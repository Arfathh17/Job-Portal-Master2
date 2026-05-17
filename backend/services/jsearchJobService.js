const axios = require('axios');

const JSEARCH_API_URL = 'https://jsearch.p.rapidapi.com/search';
const JSEARCH_API_HOST = process.env.JSEARCH_API_HOST || process.env.RAPIDAPI_HOST || 'jsearch.p.rapidapi.com';
const DEFAULT_LIMIT = 30;

function getApiKey() {
  return process.env.JSEARCH_API_KEY || process.env.RAPIDAPI_KEY || '';
}

function isJSearchConfigured() {
  return Boolean(getApiKey());
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<style[^>]*>.*?<\/style>/gis, ' ')
    .replace(/<script[^>]*>.*?<\/script>/gis, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeJobType(job = {}) {
  const values = [
    job.job_employment_type,
    ...(Array.isArray(job.job_employment_types) ? job.job_employment_types : []),
    job.job_title,
  ].join(' ').toLowerCase();

  if (values.includes('intern')) return 'internship';
  if (values.includes('part')) return 'part-time';
  if (values.includes('contract') || values.includes('temporary')) return 'contract';
  return 'full-time';
}

function normalizeSalary(job = {}) {
  if (job.job_salary) return String(job.job_salary);

  const min = Number(job.job_min_salary);
  const max = Number(job.job_max_salary);
  const currency = job.job_salary_currency || 'INR';
  const period = job.job_salary_period ? ` / ${String(job.job_salary_period).toLowerCase()}` : '';

  if (Number.isFinite(min) && Number.isFinite(max) && min && max) {
    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}${period}`;
  }

  if (Number.isFinite(min) && min) return `${currency} ${min.toLocaleString()}+${period}`;
  return 'Not disclosed';
}

function normalizeSkills(job = {}) {
  const requiredSkills = Array.isArray(job.job_required_skills) ? job.job_required_skills : [];
  const qualifications = Array.isArray(job.job_highlights?.Qualifications) ? job.job_highlights.Qualifications : [];
  const responsibilities = Array.isArray(job.job_highlights?.Responsibilities) ? job.job_highlights.Responsibilities : [];

  return [...new Set(
    requiredSkills
      .concat(qualifications, responsibilities)
      .map(item => String(item).replace(/\s+/g, ' ').trim())
      .filter(Boolean),
  )].slice(0, 8);
}

function normalizeLocation(job = {}) {
  return job.job_location || [
    job.job_city,
    job.job_state,
    job.job_country,
  ].filter(Boolean).join(', ') || 'India';
}

function normalizeCountry(job = {}) {
  const values = [
    job.job_country,
    job.job_location,
    job.job_city,
    job.job_state,
  ].filter(Boolean).join(' ').toLowerCase();

  if (values.includes('india') || values.includes('bangalore') || values.includes('bengaluru') || values.includes('karnataka')) {
    return 'India';
  }

  return job.job_country || 'India';
}

function normalizeJSearchJob(job = {}) {
  const externalId = String(job.job_id || `${job.job_title}-${job.employer_name}-${job.job_apply_link}`);
  const id = `jsearch-${Buffer.from(externalId).toString('base64url').slice(0, 48)}`;

  return {
    _id: id,
    id,
    externalId,
    title: job.job_title || 'Untitled role',
    company: job.employer_name || 'Unknown company',
    description: stripHtml(job.job_description),
    location: normalizeLocation(job),
    salary: normalizeSalary(job),
    skills: normalizeSkills(job),
    type: normalizeJobType(job),
    remote: Boolean(job.job_is_remote),
    applyLink: job.job_apply_link || job.job_google_link || '',
    source: 'jsearch',
    country: normalizeCountry(job),
    city: job.job_city || '',
    job_city: job.job_city || '',
    job_country: normalizeCountry(job),
    job_location: normalizeLocation(job),
    job_state: job.job_state || '',
    createdAt: job.job_posted_at_datetime_utc || new Date().toISOString(),
  };
}

function buildQueries(options = {}) {
  const keyword = String(options.keyword || options.search || '').trim();
  const location = String(options.location || '').trim();
  const type = String(options.type || '').trim().toLowerCase();
  const isBangalore = /bangalore|bengaluru/i.test(location);

  if (keyword) {
    const locationText = isBangalore ? 'Bangalore India' : location || 'India';
    const typeText = type === 'internship' ? ' internship' : '';
    return [`${keyword}${typeText} jobs in ${locationText}`];
  }

  if (type === 'internship') {
    return [
      'software developer internship in Bangalore India',
      'tech internship in India',
    ];
  }

  if (isBangalore) {
    return [
      'software developer jobs in Bangalore India',
      'tech jobs in Bangalore India',
      'internship jobs in Bangalore India',
    ];
  }

  return [
    'software developer jobs in India',
    'tech jobs in India',
    'software developer internship in India',
  ];
}

async function fetchQuery(query, pageSize) {
  try {
    const { data } = await axios.get(JSEARCH_API_URL, {
      params: {
        query,
        page: 1,
        num_pages: 1,
        country: 'in',
        date_posted: 'month',
      },
      headers: {
        'X-RapidAPI-Key': getApiKey(),
        'X-RapidAPI-Host': JSEARCH_API_HOST,
      },
      timeout: 15000,
    });

    return (Array.isArray(data?.data) ? data.data : [])
      .map(normalizeJSearchJob)
      .slice(0, pageSize);
  } catch (error) {
    const message = error.response?.data?.message || error.response?.statusText || error.message || 'JSearch request failed.';
    const wrappedError = new Error(`JSearch query failed: ${message}`);
    wrappedError.statusCode = error.response?.status || 502;
    wrappedError.provider = 'jsearch';
    wrappedError.query = query;
    throw wrappedError;
  }
}

async function fetchIndiaJobs(options = {}) {
  if (!isJSearchConfigured()) {
    const error = new Error('JSearch API key is not configured. Set JSEARCH_API_KEY or RAPIDAPI_KEY on the backend.');
    error.statusCode = 503;
    throw error;
  }

  const limit = Number(options.limit || DEFAULT_LIMIT);
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT;
  const queries = buildQueries(options);
  const perQueryLimit = Math.max(5, Math.ceil(safeLimit / queries.length));
  const responses = await Promise.allSettled(queries.map(query => fetchQuery(query, perQueryLimit)));
  const jobs = responses.flatMap(result => (result.status === 'fulfilled' ? result.value : []));

  if (!jobs.length && responses.some(result => result.status === 'rejected')) {
    throw responses.find(result => result.status === 'rejected').reason;
  }

  return jobs.slice(0, safeLimit);
}

module.exports = {
  fetchIndiaJobs,
  isJSearchConfigured,
  normalizeJSearchJob,
};
