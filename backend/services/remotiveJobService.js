const axios = require('axios');

const REMOTIVE_API_URL = 'https://remotive.com/api/remote-jobs';
const DEFAULT_LIMIT = 40;

function stripHtml(value = '') {
  return String(value)
    .replace(/<style[^>]*>.*?<\/style>/gis, ' ')
    .replace(/<script[^>]*>.*?<\/script>/gis, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeJobType(value = '') {
  const type = String(value).toLowerCase();
  if (type.includes('intern')) return 'internship';
  if (type.includes('part')) return 'part-time';
  if (type.includes('contract') || type.includes('freelance')) return 'contract';
  return 'full-time';
}

function normalizeSkills(job) {
  const tags = Array.isArray(job.tags) ? job.tags : [];
  const skills = tags
    .concat(job.category ? [job.category] : [])
    .map(item => String(item).trim())
    .filter(Boolean);

  return [...new Set(skills)].slice(0, 8);
}

function normalizeRemotiveJob(job) {
  const id = `remotive-${job.id}`;

  return {
    _id: id,
    id,
    externalId: String(job.id),
    title: job.title || 'Untitled role',
    company: job.company_name || 'Unknown company',
    description: stripHtml(job.description),
    location: job.candidate_required_location || 'Remote',
    salary: job.salary || 'Not disclosed',
    skills: normalizeSkills(job),
    type: normalizeJobType(job.job_type),
    remote: true,
    applyLink: job.url || '',
    source: 'remotive',
    createdAt: job.publication_date || new Date().toISOString(),
  };
}

async function fetchRemoteJobs(options = {}) {
  try {
    const keyword = String(options.keyword || '').trim();
    const limit = Number(options.limit || DEFAULT_LIMIT);

    const { data } = await axios.get(REMOTIVE_API_URL, {
      params: keyword ? { search: keyword } : {},
      timeout: 12000,
    });

    const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
    return jobs.map(normalizeRemotiveJob).slice(0, Number.isFinite(limit) ? limit : DEFAULT_LIMIT);
  } catch (error) {
    const message = error.response?.data?.message || error.response?.statusText || error.message || 'Remotive request failed.';
    const wrappedError = new Error(`Remotive jobs unavailable: ${message}`);
    wrappedError.statusCode = error.response?.status || 502;
    wrappedError.provider = 'remotive';
    throw wrappedError;
  }
}

module.exports = {
  fetchRemoteJobs,
  normalizeRemotiveJob,
};
