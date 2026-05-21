const express = require('express');

const { getIsConnected } = require('../config/db');
const { auth, authorizeRoles } = require('../middleware/auth');
const { fetchIndiaJobs } = require('../services/adzunaJobService');
const { fetchRemoteJobs } = require('../services/remotiveJobService');
const {
  addApplication: addManualApplication,
  createManualJob,
  getApplicationsByRecruiter,
  getApplicationsByUser,
  getManualJobById,
  getManualJobs,
  normalizeManualJob,
} = require('../services/manualJobStore');

const router = express.Router();

function getMemoryStore() {
  return require('../store/memoryStore').JobStore;
}

function getJobModel() {
  return require('../models/jobs');
}

function getApplicationModel() {
  return require('../models/Application');
}

function getSavedJobModel() {
  return require('../models/SavedJob');
}

function buildJobQuery(query) {
  const filters = {};

  if (query.search || query.keyword) {
    const regex = new RegExp(query.search || query.keyword, 'i');
    filters.$or = [
      { title: regex },
      { company: regex },
      { description: regex },
      { skills: regex },
    ];
  }

  if (query.type) filters.type = query.type;
  if (query.location) filters.location = new RegExp(query.location, 'i');
  if (query.remote !== undefined) filters.remote = query.remote === 'true';
  if (query.status) filters.status = query.status;
  else filters.status = { $ne: 'draft' };

  return filters;
}

function getFilters(query = {}) {
  return {
    keyword: query.keyword || query.search || '',
    search: query.search || query.keyword || '',
    source: query.source || '',
    region: query.region || '',
    location: query.location || '',
    country: query.country || '',
    type: query.type || '',
    remote: query.remote,
    limit: query.limit,
    page: query.page,
  };
}

function sortJobs(jobs) {
  const sourceRank = { adzuna: 0, manual: 1, remotive: 2 };
  return jobs.sort((a, b) => {
    const sourceDelta = (sourceRank[a?.source] ?? 10) - (sourceRank[b?.source] ?? 10);
    if (sourceDelta) return sourceDelta;
    return new Date(b?.createdAt || b?.created || 0) - new Date(a?.createdAt || a?.created || 0);
  });
}

function normalizeDuplicateValue(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(private|pvt|limited|ltd|inc|llc|corp|corporation|company|co)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function removeDuplicateJobs(jobs) {
  const seen = new Set();

  return jobs.filter(job => {
    if (!job || typeof job !== 'object') return false;
    const title = normalizeDuplicateValue(job.title);
    const company = normalizeDuplicateValue(job.company);
    if (!title || !company) return true;

    const key = `${title}::${company}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildCombinedResponse(results, filters, errors, meta = {}) {
  try {
    const uniqueJobs = removeDuplicateJobs(results);
    const filteredJobs = applyCombinedFilters(uniqueJobs, filters);

    if (!filteredJobs.length && shouldUseRegionalFallback(filters, errors)) {
      const fallbackJobs = applyCombinedFilters(uniqueJobs, getRegionalFallbackFilters(filters));
      return { jobs: sortJobs(fallbackJobs), errors, meta };
    }

    const remotiveFallbackJobs = getRemotiveRegionalFallbackJobs(uniqueJobs, filters, meta);
    if (!filteredJobs.length && remotiveFallbackJobs.length) {
      return {
        jobs: sortJobs(remotiveFallbackJobs),
        errors,
        meta: {
          ...meta,
          fallback: 'remotive-location',
          message: 'Showing available remote jobs for this location',
        },
      };
    }

    return { jobs: sortJobs(filteredJobs), errors, meta };
  } catch (error) {
    console.error('Combined jobs normalization error:', error.message || error);
    return { jobs: sortJobs(removeDuplicateJobs(results)), errors: [...errors, 'normalize'], meta };
  }
}

function withProviderTimeout(promise, provider, timeoutMs) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`${provider} jobs request timed out.`);
      error.provider = provider;
      error.statusCode = 504;
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

async function runJobProvider(provider, jobPromise, errors, timeoutMs = 15000) {
  try {
    const jobs = await withProviderTimeout(jobPromise, provider, timeoutMs);
    return Array.isArray(jobs) ? jobs.filter(job => job && typeof job === 'object') : [];
  } catch (error) {
    console.error(`${provider} jobs fetch error:`, error.message || error);
    errors.push(provider);
    return [];
  }
}

function normalizeLocationValue(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/bengaluru/g, 'bangalore')
    .replace(/\s+/g, ' ')
    .trim();
}

function getJobLocation(job = {}) {
  return job.location
    || job.job_location
    || job.city
    || job.companyLocation
    || job.company_location
    || job.job_city
    || job.candidate_required_location
    || job.job_country
    || '';
}

function getJobLocationValues(job = {}) {
  return [
    getJobLocation(job),
    job.location,
    job.job_location,
    job.city,
    job.companyLocation,
    job.company_location,
    job.candidate_required_location,
    job.country,
    job.job_city,
    job.job_country,
    job.job_state,
  ]
    .map(normalizeLocationValue)
    .filter(Boolean);
}

function includesAnyLocation(values, terms) {
  const normalizedTerms = terms.map(normalizeLocationValue);
  return values.some(value => normalizedTerms.some(term => value.includes(term)));
}

function isIndiaJob(job) {
  const values = getJobLocationValues(job);
  return includesAnyLocation(values, ['india', 'in', 'bangalore', 'bengaluru', 'karnataka', 'remote india']);
}

function isBangaloreJob(job) {
  const values = getJobLocationValues(job);
  return includesAnyLocation(values, ['bangalore', 'bengaluru', 'karnataka']);
}

function isRegionalSearch(value = '') {
  return /\b(india|bangalore|bengaluru|karnataka)\b/i.test(String(value || ''));
}

function isBangaloreScope(value = '') {
  return /\b(bangalore|bengaluru|karnataka)\b/i.test(String(value || ''));
}

function shouldUseRegionalFallback(filters = {}, errors = []) {
  if (!errors.includes('adzuna')) return false;
  if (isRegionalSearch(filters.source) || isRegionalSearch(filters.region) || isRegionalSearch(filters.location)) {
    return false;
  }

  return [
    filters.source,
    filters.region,
    filters.location,
    filters.country,
    filters.keyword,
    filters.search,
  ].some(isRegionalSearch);
}

function getRegionalFallbackFilters(filters = {}) {
  const fallbackFilters = {
    ...filters,
    source: '',
    region: '',
    location: '',
    country: '',
    remote: undefined,
  };

  if (isRegionalSearch(fallbackFilters.keyword)) fallbackFilters.keyword = '';
  if (isRegionalSearch(fallbackFilters.search)) fallbackFilters.search = '';

  return fallbackFilters;
}

function matchesRequestedLocation(job, requestedLocation) {
  const location = normalizeLocationValue(requestedLocation);
  if (!location) return true;

  if (['india', 'in'].includes(location)) return isIndiaJob(job);
  if (['bangalore', 'bengaluru', 'karnataka'].includes(location)) return isBangaloreJob(job);

  return includesAnyLocation(getJobLocationValues(job), [location]);
}

function getRegionalFallbackTerms(filters = {}) {
  const regionText = [
    filters.source,
    filters.region,
    filters.location,
    filters.country,
  ].map(normalizeLocationValue).join(' ');

  if (/\b(bangalore|karnataka)\b/.test(regionText)) {
    return ['bangalore', 'bengaluru', 'india'];
  }

  if (/\b(india|in)\b/.test(regionText)) {
    return ['india', 'bangalore', 'bengaluru'];
  }

  return [];
}

function matchesRemotiveRegionalFallback(job, terms) {
  if (job.source !== 'remotive') return false;

  const haystack = [
    job.location,
    job.candidate_required_location,
    job.title,
    job.description,
  ].map(normalizeLocationValue).join(' ');

  return terms.some(term => haystack.includes(normalizeLocationValue(term)));
}

function getRemotiveRegionalFallbackJobs(jobs, filters, meta = {}) {
  if (!meta.adzunaUnavailable) return [];

  const terms = getRegionalFallbackTerms(filters);
  if (!terms.length) return [];

  return jobs.filter(job => matchesRemotiveRegionalFallback(job, terms));
}

function validateManualJob(body) {
  const missing = ['title', 'company', 'description'].filter(field => !String(body[field] || '').trim());
  if (missing.length) return `${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} required.`;
  return null;
}

function normalizeCreatePayload(body, user) {
  return {
    title: String(body.title || '').trim(),
    company: String(body.company || '').trim(),
    location: String(body.location || (body.remote ? 'Remote' : '')).trim() || 'Not specified',
    description: String(body.description || '').trim(),
    salary: body.salary || body.salaryText || 'Not disclosed',
    skills: Array.isArray(body.skills)
      ? body.skills.map(skill => String(skill).trim()).filter(Boolean)
      : String(body.skills || '').split(',').map(skill => skill.trim()).filter(Boolean),
    type: body.type || 'full-time',
    remote: Boolean(body.remote),
    applyLink: body.applyLink || body.applyUrl || '',
    source: 'manual',
    status: body.status || 'active',
    postedBy: user.id,
  };
}

function requireMongoForSavedJobs(res) {
  if (getIsConnected()) return false;
  res.status(503).json({ error: 'Saved jobs require MongoDB. Please connect the database and try again.' });
  return true;
}

function normalizeSavedJobPayload(body = {}) {
  const job = body.job && typeof body.job === 'object' ? body.job : body;
  const externalId = String(job._id || job.externalId || job.id || body.externalId || '').trim();

  return {
    externalId,
    title: job.title || job.job_title || '',
    company: job.company || job.employer_name || '',
    location: job.location || job.job_location || job.candidate_required_location || '',
    salary: job.salary || job.salaryText || 'Not disclosed',
    description: job.description || job.job_description || '',
    applyLink: job.applyLink || job.url || job.redirect_url || job.job_apply_link || '',
    url: job.url || job.applyLink || job.redirect_url || job.job_apply_link || '',
    source: job.source || 'manual',
    type: job.type || 'full-time',
    remote: Boolean(job.remote),
    jobSnapshot: job,
  };
}

function applyCombinedFilters(jobs, filters) {
  const keyword = String(filters.keyword || filters.search || '').trim().toLowerCase();
  const type = String(filters.type || '').trim();
  const remote = filters.remote;
  const source = String(filters.source || '').trim().toLowerCase();
  const region = String(filters.region || '').trim().toLowerCase();
  const location = String(filters.location || '').trim().toLowerCase();
  const country = String(filters.country || '').trim().toLowerCase();
  const sourceFilters = new Set(['manual', 'remotive', 'adzuna']);

  return jobs.filter(job => {
    if (sourceFilters.has(source) && job.source !== source) return false;
    if ((source === 'india' || region === 'india' || country === 'india' || country === 'in') && !isIndiaJob(job)) return false;
    if ((isBangaloreScope(source) || isBangaloreScope(region)) && !isBangaloreJob(job)) return false;
    if (location && !matchesRequestedLocation(job, location)) return false;
    if (type && job.type !== type) return false;
    if (remote !== undefined && remote !== '' && String(job.remote) !== String(remote)) return false;
    if (!keyword) return true;

    return [
      job.title,
      job.company,
      job.description,
      job.location,
      job.salary,
      ...(job.skills || []),
    ].some(value => String(value || '').toLowerCase().includes(keyword));
  });
}

async function fetchCombinedJobs(query) {
  const filters = getFilters(query);
  const source = String(filters.source || 'all').toLowerCase();
  const region = String(filters.region || '').toLowerCase();
  const location = String(filters.location || '').toLowerCase();
  const isBangaloreRequest = isBangaloreScope(source) || isBangaloreScope(region) || isBangaloreScope(location);
  const isIndiaScope = source === 'india' || isBangaloreRequest || region === 'india'
    || location.includes('india');
  const shouldFetchManual = source === 'all' || source === 'manual' || isIndiaScope;
  const shouldFetchRemote = source === 'all' || source === 'remotive' || source === 'remote' || isIndiaScope;
  const shouldFetchIndia = source === 'all' || source === 'adzuna' || isIndiaScope;
  const errors = [];
  const providers = [];

  if (shouldFetchManual) {
    const manualFilters = source === 'manual' ? filters : { ...filters, source: '' };
    providers.push(runJobProvider('manual', getManualJobs(manualFilters), errors, 8000));
  }

  if (shouldFetchRemote) {
    providers.push(runJobProvider('remotive', fetchRemoteJobs({
        keyword: filters.keyword,
        limit: filters.limit || 40,
      }), errors, 14000));
  }

  if (shouldFetchIndia) {
    providers.push(runJobProvider('adzuna', fetchIndiaJobs({
        keyword: filters.keyword,
        type: filters.type,
        location: isBangaloreRequest ? 'Bengaluru' : filters.location || 'India',
        limit: filters.limit || 30,
        page: filters.page || 1,
      }), errors, 18000));
  }

  const results = (await Promise.all(providers)).flat();
  const hasAdzunaResults = results.some(job => job.source === 'adzuna');
  const meta = {
    adzunaUnavailable: shouldFetchIndia && (errors.includes('adzuna') || !hasAdzunaResults),
  };

  return buildCombinedResponse(results, filters, errors, meta);
}

router.get('/remote', async (req, res) => {
  try {
    const jobs = await fetchRemoteJobs({
      keyword: req.query.keyword || req.query.search,
      limit: req.query.limit || 40,
    });
    return res.json({ success: true, jobs });
  } catch (error) {
    console.error('Remotive jobs error:', error);
    return res.status(502).json({ error: 'Failed to fetch remote jobs from Remotive.' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const keyword = req.query.keyword || req.query.search || '';
    const jobs = await fetchRemoteJobs({ keyword, limit: req.query.limit || 40 });
    return res.json({ success: true, jobs });
  } catch (error) {
    console.error('Remote job search error:', error);
    return res.status(502).json({ error: 'Failed to search remote jobs.' });
  }
});

router.get('/india', async (req, res) => {
  try {
    const filters = getFilters({ ...req.query, source: 'india' });
    const { jobs, errors, meta } = await fetchCombinedJobs(filters);
    return res.json({ success: true, jobs, meta: { sources: ['adzuna', 'remotive'], errors, ...meta } });
  } catch (error) {
    console.error('Adzuna India jobs error:', error.message || error);
    const statusCode = error.statusCode || 502;
    return res.status(statusCode).json({
      error: statusCode === 503 ? error.message : 'Failed to fetch India jobs from Adzuna.',
    });
  }
});

router.get('/all', async (req, res) => {
  try {
    const { jobs, errors, meta } = await fetchCombinedJobs(req.query);
    return res.json({ success: true, jobs, meta: { sources: ['manual', 'adzuna', 'remotive'], errors, ...meta } });
  } catch (error) {
    console.error('Combined jobs error:', error);
    return res.status(500).json({ error: 'Failed to fetch jobs.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { jobs, errors, meta } = await fetchCombinedJobs(req.query);
    return res.json({ success: true, jobs, meta: { sources: ['manual', 'adzuna', 'remotive'], errors, ...meta } });
  } catch (error) {
    console.error('Get jobs error:', error);
    return res.status(500).json({ error: 'Failed to fetch jobs.' });
  }
});

router.get('/mine', auth, authorizeRoles('recruiter', 'admin'), async (req, res) => {
  try {
    const jobs = (await getManualJobs({ source: 'manual' }))
      .filter(job => req.user.role === 'admin' || String(job.postedBy) === String(req.user.id));
    return res.json({ success: true, jobs });
  } catch (error) {
    console.error('Get recruiter jobs error:', error);
    return res.status(500).json({ error: 'Failed to fetch recruiter jobs.' });
  }
});

router.get('/applications/me', auth, authorizeRoles('candidate', 'admin'), async (req, res) => {
  try {
    const manualApplications = await getApplicationsByUser(req.user.id);

    if (!getIsConnected()) {
      return res.json({ success: true, applications: manualApplications });
    }

    const mongoApplications = await getApplicationModel()
      .find({ candidate: req.user.id })
      .populate('job', 'title company location type remote')
      .sort({ createdAt: -1 });

    return res.json({ success: true, applications: [...manualApplications, ...mongoApplications] });
  } catch (error) {
    console.error('Get candidate applications error:', error);
    return res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

router.get('/applications/recruiter', auth, authorizeRoles('recruiter', 'admin'), async (req, res) => {
  try {
    const manualApplications = req.user.role === 'admin'
      ? (await getManualJobs()).flatMap(job => (job.applications || []).map(application => ({ ...application, job })))
      : await getApplicationsByRecruiter(req.user.id);

    if (!getIsConnected()) {
      return res.json({ success: true, applications: manualApplications });
    }

    const mongoApplications = await getApplicationModel()
      .find(req.user.role === 'admin' ? {} : { recruiter: req.user.id })
      .populate('job', 'title company location')
      .populate('candidate', 'name email profile')
      .sort({ createdAt: -1 });

    return res.json({ success: true, applications: [...manualApplications, ...mongoApplications] });
  } catch (error) {
    console.error('Get recruiter applications error:', error);
    return res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

router.get('/saved', auth, async (req, res) => {
  try {
    if (requireMongoForSavedJobs(res)) return;

    const savedJobs = await getSavedJobModel()
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, jobs: savedJobs });
  } catch (error) {
    console.error('Get saved jobs error:', error);
    return res.status(500).json({ error: 'Failed to fetch saved jobs.' });
  }
});

router.post('/saved', auth, async (req, res) => {
  try {
    if (requireMongoForSavedJobs(res)) return;

    const payload = normalizeSavedJobPayload(req.body);
    if (!payload.externalId) {
      return res.status(400).json({ error: 'Job id is required to save a job.' });
    }

    const savedJob = await getSavedJobModel().findOneAndUpdate(
      { user: req.user.id, externalId: payload.externalId },
      { $set: { ...payload, user: req.user.id } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return res.status(201).json({ success: true, job: savedJob });
  } catch (error) {
    console.error('Save job error:', error);
    return res.status(500).json({ error: 'Failed to save job.' });
  }
});

router.delete('/saved/:externalId', auth, async (req, res) => {
  try {
    if (requireMongoForSavedJobs(res)) return;

    await getSavedJobModel().deleteOne({
      user: req.user.id,
      externalId: req.params.externalId,
    });

    return res.json({ success: true, message: 'Job removed from saved jobs.' });
  } catch (error) {
    console.error('Unsave job error:', error);
    return res.status(500).json({ error: 'Failed to remove saved job.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (id.startsWith('remotive-')) {
      const jobs = await fetchRemoteJobs({ limit: 500 });
      const job = jobs.find(item => item._id === id || item.externalId === id.replace('remotive-', ''));
      if (!job) return res.status(404).json({ error: 'Job not found.' });
      return res.json({ success: true, job });
    }

    const manualJob = await getManualJobById(id);
    if (manualJob) return res.json({ success: true, job: manualJob });

    if (getIsConnected()) {
      const job = await getJobModel()
        .findById(id)
        .populate('postedBy', 'name email role');
      if (!job) return res.status(404).json({ error: 'Job not found.' });
      return res.json({ success: true, job });
    }

    const job = await getMemoryStore().findById(id);
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    return res.json({ success: true, job });
  } catch (error) {
    console.error('Get job error:', error);
    return res.status(500).json({ error: 'Failed to fetch job.' });
  }
});

async function createPlatformJob(req, res) {
  try {
    const validationError = validateManualJob(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const job = await createManualJob(normalizeCreatePayload(req.body, req.user));

    return res.status(201).json({
      success: true,
      id: job.id,
      job,
      message: 'Job created successfully.',
    });
  } catch (error) {
    console.error('Job creation error:', error);
    return res.status(500).json({ error: 'Failed to create job.' });
  }
}

router.post('/create', auth, authorizeRoles('recruiter', 'admin'), createPlatformJob);
router.post('/', auth, authorizeRoles('recruiter', 'admin'), createPlatformJob);

router.post('/:id/apply', auth, authorizeRoles('candidate', 'admin'), async (req, res) => {
  try {
    if (req.params.id.startsWith('remotive-')) {
      return res.status(400).json({ error: 'Remote jobs must be applied to through their external apply link.' });
    }

    const manualApplication = await addManualApplication(req.params.id, {
      applicant: req.user.id,
      candidate: req.user.id,
      coverLetter: req.body.coverLetter,
    });

    if (manualApplication) {
      return res.status(201).json({ success: true, application: manualApplication, message: 'Application submitted.' });
    }

    if (!getIsConnected()) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    const job = await getJobModel().findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found.' });

    const application = await getApplicationModel().create({
      job: job._id,
      candidate: req.user.id,
      recruiter: job.postedBy,
      resume: req.body.resumeId,
      coverLetter: req.body.coverLetter,
    });

    if (!job.applications.some(item => item.applicant?.toString() === req.user.id)) {
      job.applications.push({ applicant: req.user.id, status: 'pending' });
      await job.save();
    }

    return res.status(201).json({ success: true, application, message: 'Application submitted.' });
  } catch (error) {
    if (error.statusCode === 409 || error.code === 11000) {
      return res.status(409).json({ error: 'You have already applied to this job.' });
    }
    console.error('Apply job error:', error);
    return res.status(500).json({ error: 'Failed to apply for job.' });
  }
});

router.patch('/applications/:applicationId/status', auth, authorizeRoles('recruiter', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid application status.' });
    }

    if (!getIsConnected()) {
      return res.json({ success: true, message: 'Application status updated in demo mode.' });
    }

    const query = { _id: req.params.applicationId };
    if (req.user.role !== 'admin') query.recruiter = req.user.id;

    const application = await getApplicationModel()
      .findOneAndUpdate(query, { status }, { new: true })
      .populate('job', 'title company')
      .populate('candidate', 'name email');

    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    return res.json({ success: true, application });
  } catch (error) {
    console.error('Update application status error:', error);
    return res.status(500).json({ error: 'Failed to update application status.' });
  }
});

module.exports = router;
