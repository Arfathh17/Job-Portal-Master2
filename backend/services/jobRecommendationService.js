const { fetchIndiaJobs } = require('./adzunaJobService');
const { fetchRemoteJobs } = require('./remotiveJobService');
const { getManualJobs } = require('./manualJobStore');

const STOP_WORDS = new Set([
  'and',
  'or',
  'the',
  'with',
  'for',
  'job',
  'developer',
  'engineer',
  'software',
  'remote',
  'full',
  'time',
]);

function normalize(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/c\+\+/g, 'cplusplus')
    .replace(/c#/g, 'csharp')
    .replace(/node\.js/g, 'nodejs')
    .replace(/react\.js/g, 'react')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function titleCase(value = '') {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function unique(items) {
  return [...new Set(items.map(item => String(item || '').trim()).filter(Boolean))];
}

function extractProfile(parsedData = {}, resumeText = '') {
  const parsedSkills = parsedData.skills || {};
  const skills = unique([
    ...(Array.isArray(parsedSkills) ? parsedSkills : []),
    ...(parsedSkills.technical || []),
    ...(parsedSkills.frameworks || []),
    ...(parsedSkills.databases || []),
    ...(parsedSkills.tools || []),
    ...(parsedSkills.platforms || []),
    ...(parsedSkills.languages || []),
  ]);

  const suggestedRoles = unique([
    ...(parsedData.suggestedRoles || []),
    ...(parsedData.jobPreferences?.roles || []),
    ...(parsedData.preferredRoles || []),
  ]);

  return {
    skills,
    yearsOfExperience: Number(parsedData.yearsOfExperience || String(resumeText).match(/(\d+)\+?\s*(?:years|yrs)/i)?.[1] || 0),
    preferredRoles: suggestedRoles,
    preferredLocations: unique([
      parsedData.jobPreferences?.location,
      parsedData.personalInfo?.location,
      parsedData.location,
    ]),
  };
}

function tokenize(values) {
  return unique(values.flatMap(value => normalize(value).split(/\s+/)))
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

function getJobId(job = {}) {
  return String(job._id || job.id || job.externalId || `${job.source || 'job'}-${job.title}-${job.company}`);
}

function getJobApplyLink(job = {}) {
  return job.applyLink || job.url || job.redirect_url || job.job_apply_link || '';
}

function getJobText(job = {}) {
  return [
    job.title,
    job.company,
    job.location,
    job.description,
    job.type,
    ...(job.skills || []),
  ].join(' ');
}

function scoreJob(job, profile) {
  const jobText = normalize(getJobText(job));
  const skillTokens = tokenize(profile.skills);
  const roleTokens = tokenize(profile.preferredRoles);
  const locationTokens = tokenize(profile.preferredLocations);

  const matchedSkillTokens = skillTokens.filter(token => jobText.includes(token));
  const matchedRoleTokens = roleTokens.filter(token => jobText.includes(token));
  const matchedLocationTokens = locationTokens.filter(token => jobText.includes(token));

  const skillScore = skillTokens.length
    ? (matchedSkillTokens.length / Math.min(skillTokens.length, 10)) * 68
    : 0;
  const roleScore = roleTokens.length
    ? Math.min(14, (matchedRoleTokens.length / Math.min(roleTokens.length, 4)) * 14)
    : 6;
  const locationScore = locationTokens.length && matchedLocationTokens.length ? 5 : 0;
  const experienceScore = Math.min(8, profile.yearsOfExperience * 1.6);
  const richJobBonus = Array.isArray(job.skills) && job.skills.length ? 5 : 2;
  const sourceBonus = job.source === 'manual' ? 3 : 0;

  const matchPercentage = Math.max(
    matchedSkillTokens.length ? 52 : 35,
    Math.min(98, Math.round(skillScore + roleScore + locationScore + experienceScore + richJobBonus + sourceBonus)),
  );

  return {
    matchPercentage,
    matchedSkills: profile.skills.filter(skill => jobText.includes(normalize(skill))).slice(0, 8),
  };
}

async function getAvailableJobs(profile) {
  const keyword = profile.skills[0] || profile.preferredRoles[0] || '';
  const providers = [
    getManualJobs({ source: 'manual' }),
    fetchRemoteJobs({ keyword, limit: 35 }),
    fetchIndiaJobs({ keyword, location: profile.preferredLocations[0] || 'India', limit: 25, page: 1 }),
  ];

  const settled = await Promise.allSettled(providers);
  return settled
    .flatMap(result => (result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []))
    .filter(job => job && typeof job === 'object');
}

function dedupeJobs(jobs) {
  const seen = new Set();

  return jobs.filter(job => {
    const key = normalize(`${job.title || ''} ${job.company || ''}`);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function recommendJobs(parsedData, resumeText) {
  const profile = extractProfile(parsedData, resumeText);
  const jobs = dedupeJobs(await getAvailableJobs(profile));

  return jobs
    .map(job => {
      const score = scoreJob(job, profile);
      return {
        id: getJobId(job),
        title: job.title || job.job_title || 'Untitled Role',
        company: job.company || job.employer_name || 'Company',
        location: job.location || job.job_location || job.candidate_required_location || 'Remote',
        type: job.type || 'full-time',
        source: job.source || 'manual',
        applyLink: getJobApplyLink(job),
        description: job.description || job.job_description || '',
        salary: job.salary || job.salaryText || 'Not disclosed',
        skills: Array.isArray(job.skills) ? job.skills : [],
        matchPercentage: score.matchPercentage,
        matchedSkills: score.matchedSkills.map(titleCase),
      };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 5);
}

module.exports = {
  recommendJobs,
};
