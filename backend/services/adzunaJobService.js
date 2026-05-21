const axios = require('axios');

const ADZUNA_API_BASE_URL = 'https://api.adzuna.com/v1/api/jobs/in/search';
const DEFAULT_LIMIT = 20;
const BANGALORE_LOCATION_ALIASES = ['Bengaluru', 'Bangalore', 'Karnataka'];

function getCredentials() {
  return {
    appId: process.env.ADZUNA_APP_ID || '',
    appKey: process.env.ADZUNA_APP_KEY || '',
  };
}

function isAdzunaConfigured() {
  const { appId, appKey } = getCredentials();
  return Boolean(appId && appKey);
}

function normalizeSalary(result = {}) {
  const min = result.salary_min;
  const max = result.salary_max;

  if (min && max) return `${min} - ${max}`;
  if (min) return `${min} - `;
  if (max) return ` - ${max}`;
  return 'Not disclosed';
}

function normalizeJobType(result = {}) {
  const values = [
    result.title,
    result.contract_type,
    result.contract_time,
    result.category?.label,
  ].join(' ').toLowerCase();

  if (values.includes('intern')) return 'internship';
  if (values.includes('part')) return 'part-time';
  if (values.includes('contract')) return 'contract';
  return 'full-time';
}

function normalizeLocationValue(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/bengaluru/g, 'bangalore')
    .replace(/\s+/g, ' ')
    .trim();
}

function getLocationQueries(location = '') {
  const normalizedLocation = normalizeLocationValue(location);

  if (!normalizedLocation || ['india', 'in'].includes(normalizedLocation)) {
    return [''];
  }

  if (/\b(bangalore|karnataka)\b/.test(normalizedLocation)) {
    return BANGALORE_LOCATION_ALIASES;
  }

  return [location];
}

function removeDuplicateJobs(jobs = []) {
  const seen = new Set();

  return jobs.filter(job => {
    const id = String(job.externalId || job.id || job._id || '').trim();
    const fallbackKey = [
      job.title,
      job.company,
      job.location,
      job.applyLink || job.url,
    ].map(value => String(value || '').toLowerCase().trim()).join('::');
    const key = id || fallbackKey;

    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeAdzunaJob(result = {}) {
  const id = String(result.id || `${result.title}-${result.redirect_url}`);
  const location = result.location?.display_name || 'India';
  const company = result.company?.display_name || 'Unknown company';
  const url = result.redirect_url || '';
  const created = result.created || new Date().toISOString();

  return {
    _id: `adzuna-${id}`,
    id,
    externalId: id,
    title: result.title || 'Untitled role',
    company,
    location,
    description: result.description || '',
    url,
    applyLink: url,
    salary: normalizeSalary(result),
    created,
    createdAt: created,
    source: 'adzuna',
    country: 'India',
    job_country: 'India',
    job_location: location,
    type: normalizeJobType(result),
    remote: /remote/i.test(location),
  };
}

async function fetchIndiaJobs(options = {}) {
  if (!isAdzunaConfigured()) {
    const error = new Error('Adzuna API credentials are not configured. Set ADZUNA_APP_ID and ADZUNA_APP_KEY on the backend.');
    error.statusCode = 503;
    error.provider = 'adzuna';
    throw error;
  }

  const { appId, appKey } = getCredentials();
  const limit = Number(options.limit || DEFAULT_LIMIT);
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT;
  const page = Number(options.page || 1);
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const keyword = String(options.keyword || options.search || '').trim();
  const location = String(options.location || options.region || '').trim();
  const type = String(options.type || '').trim();
  const what = [keyword, type === 'internship' && !/intern/i.test(keyword) ? 'internship' : '']
    .filter(Boolean)
    .join(' ')
    .trim();

  const params = {
    app_id: appId,
    app_key: appKey,
    results_per_page: safeLimit,
    'content-type': 'application/json',
  };

  if (what) params.what = what;

  const request = requestParams => axios.get(`${ADZUNA_API_BASE_URL}/${safePage}`, {
    params: requestParams,
    timeout: 15000,
  });

  try {
    const locationQueries = getLocationQueries(location);
    const jobs = [];
    let lastError = null;

    for (const locationQuery of locationQueries) {
      try {
        const response = await request({
          ...params,
          ...(locationQuery ? { where: locationQuery } : {}),
        });
        const results = Array.isArray(response.data?.results) ? response.data.results : [];
        jobs.push(...results.map(normalizeAdzunaJob));

        if (jobs.length >= safeLimit) break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!jobs.length && lastError) throw lastError;

    return removeDuplicateJobs(jobs).slice(0, safeLimit);
  } catch (error) {
    const message = error.response?.data?.message || error.response?.statusText || error.message || 'Adzuna request failed.';
    const wrappedError = new Error(`Adzuna jobs unavailable: ${message}`);
    wrappedError.statusCode = error.response?.status || 502;
    wrappedError.provider = 'adzuna';
    throw wrappedError;
  }
}

module.exports = {
  fetchIndiaJobs,
  isAdzunaConfigured,
  normalizeAdzunaJob,
};
