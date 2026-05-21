const { GoogleGenerativeAI } = require('@google/generative-ai');

const SUPPORTED_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'MERN Stack Developer',
  'Full Stack Developer',
  'AI/ML Engineer',
  'Data Analyst',
  'DevOps Engineer',
  'Cloud Engineer',
  'UI/UX Developer',
  'Software Engineer',
];

const ROLE_PROFILES = {
  'Frontend Developer': {
    skills: ['react', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'redux', 'vite', 'next.js', 'accessibility'],
    roadmap: ['Deepen React rendering knowledge', 'Practice frontend performance profiling', 'Build accessible responsive dashboards'],
    salaryTrend: 'Strong demand for React and product-focused frontend engineers.',
  },
  'Backend Developer': {
    skills: ['node.js', 'express', 'api', 'rest', 'graphql', 'mongodb', 'postgresql', 'jwt', 'redis', 'microservices'],
    roadmap: ['Build secure REST APIs', 'Learn Redis caching', 'Practice database indexing and query optimization'],
    salaryTrend: 'Consistent demand for API, auth, and scalable service experience.',
  },
  'MERN Stack Developer': {
    skills: ['mongodb', 'express', 'react', 'node.js', 'javascript', 'jwt', 'redux', 'tailwind', 'rest api'],
    roadmap: ['Build a complete MERN SaaS project', 'Add JWT refresh-token auth', 'Deploy with Docker and CI/CD'],
    salaryTrend: 'High portfolio value for startup and SaaS engineering roles.',
  },
  'Full Stack Developer': {
    skills: ['react', 'node.js', 'database', 'api', 'auth', 'docker', 'cloud', 'testing', 'system design'],
    roadmap: ['Practice end-to-end architecture', 'Add automated tests', 'Learn cloud deployment basics'],
    salaryTrend: 'Broad hiring demand when frontend, backend, and deployment skills are visible.',
  },
  'AI/ML Engineer': {
    skills: ['python', 'machine learning', 'pytorch', 'tensorflow', 'nlp', 'llm', 'pandas', 'numpy', 'scikit-learn', 'mlops'],
    roadmap: ['Build model evaluation projects', 'Learn vector search and RAG', 'Deploy an ML API with monitoring'],
    salaryTrend: 'Premium demand when ML skills are paired with production deployment.',
  },
  'Data Analyst': {
    skills: ['sql', 'excel', 'python', 'pandas', 'power bi', 'tableau', 'statistics', 'dashboard', 'analytics'],
    roadmap: ['Create SQL portfolio case studies', 'Build BI dashboards', 'Practice statistical storytelling'],
    salaryTrend: 'Strong entry-to-mid demand for SQL and dashboard-heavy profiles.',
  },
  'DevOps Engineer': {
    skills: ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ci/cd', 'linux', 'monitoring', 'jenkins'],
    roadmap: ['Containerize a full-stack app', 'Create a CI/CD pipeline', 'Learn Kubernetes deployment basics'],
    salaryTrend: 'Strong demand for automation, cloud, and reliability skills.',
  },
  'Cloud Engineer': {
    skills: ['aws', 'azure', 'gcp', 'terraform', 'cloudformation', 'docker', 'networking', 'iam', 'serverless'],
    roadmap: ['Learn IAM and cloud networking', 'Deploy projects on AWS or Azure', 'Add Terraform infrastructure examples'],
    salaryTrend: 'Growing demand for cloud migration and infrastructure automation.',
  },
  'UI/UX Developer': {
    skills: ['figma', 'html', 'css', 'javascript', 'react', 'design system', 'accessibility', 'responsive design'],
    roadmap: ['Document a design system', 'Improve accessibility skills', 'Build polished UI case studies'],
    salaryTrend: 'Best fit where design implementation and frontend engineering overlap.',
  },
  'Software Engineer': {
    skills: ['data structures', 'algorithms', 'javascript', 'python', 'java', 'database', 'testing', 'system design', 'git'],
    roadmap: ['Practice DSA fundamentals', 'Strengthen testing habits', 'Build projects with clean architecture'],
    salaryTrend: 'Broad demand across product engineering and platform teams.',
  },
};

const CERTIFICATIONS = {
  cloud: ['AWS Cloud Practitioner', 'Azure Fundamentals', 'Google Associate Cloud Engineer'],
  devops: ['Docker Certified Associate', 'Certified Kubernetes Application Developer'],
  data: ['Microsoft PL-300 Power BI Data Analyst', 'Google Data Analytics Certificate'],
  ai: ['TensorFlow Developer Certificate', 'AWS Machine Learning Specialty'],
  security: ['CompTIA Security+', 'ISC2 Certified in Cybersecurity'],
};

const TARGET_KEYWORDS = [
  { label: 'React', terms: ['react'] },
  { label: 'Node.js', terms: ['node.js', 'nodejs'] },
  { label: 'Express.js', terms: ['express.js', 'express'] },
  { label: 'MongoDB', terms: ['mongodb', 'mongo db'] },
  { label: 'REST API', terms: ['rest api', 'restful api', 'api integration'] },
  { label: 'Git', terms: ['git'] },
  { label: 'GitHub', terms: ['github'] },
  { label: 'Deployment', terms: ['deployment', 'deployed', 'render', 'vercel', 'netlify', 'aws', 'azure', 'gcp'] },
  { label: 'Authentication', terms: ['authentication', 'auth', 'jwt', 'oauth', 'firebase auth'] },
  { label: 'AI integration', terms: ['ai integration', 'artificial intelligence', 'llm', 'generative ai'] },
  { label: 'OpenAI API / Gemini API', terms: ['openai api', 'gemini api', 'openai', 'gemini'] },
];

const SECTION_HEADINGS = [
  'summary',
  'professional summary',
  'profile',
  'objective',
  'skills',
  'technical skills',
  'projects',
  'experience',
  'work experience',
  'internship',
  'internships',
  'education',
  'certifications',
  'achievements',
];

function isUsableKey(key) {
  return typeof key === 'string'
    && key.trim().length > 20
    && !/your_|replace|placeholder|example/i.test(key);
}

function getGeminiClient() {
  if (!isUsableKey(process.env.GEMINI_API_KEY)) return null;
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasTerm(text, term) {
  const normalized = term.replace(/\./g, '\\.?').replace(/\+/g, '\\+');
  return new RegExp(`\\b${normalized}\\b`, 'i').test(text);
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function toTitleCaseName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(part => part.length <= 2 && part === part.toUpperCase()
      ? part
      : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function isLikelyName(line) {
  const value = String(line || '').trim();
  if (!value || value.length < 3 || value.length > 60) return false;
  if (/@|https?:|www\.|\d|resume|curriculum|developer|engineer|email|phone|linkedin|github/i.test(value)) return false;
  const words = value.split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  return words.every(word => /^[A-Za-z][A-Za-z.'-]*$/.test(word));
}

function isLikelyParsedName(value) {
  const normalized = String(value || '').trim();
  if (!normalized || normalized.length < 3 || normalized.length > 60) return false;
  if (/@|https?:|www\.|\d|resume|curriculum|developer|engineer|email|phone|linkedin|github/i.test(normalized)) return false;
  return normalized.split(/\s+/).every(word => /^[A-Za-z][A-Za-z.'-]*$/.test(word));
}

function extractCandidateName(resumeText, parsedData = {}) {
  const parsedName = parsedData.personalInfo?.name
    || parsedData.header?.name
    || parsedData.name
    || parsedData.fullName;

  if (isLikelyParsedName(parsedName)) {
    return toTitleCaseName(parsedName);
  }

  const lines = String(resumeText || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 10);

  const nameLine = lines.find(isLikelyName);
  return nameLine ? toTitleCaseName(nameLine) : '';
}

function hasAnyTerm(text, terms) {
  return terms.some(term => hasTerm(text, term));
}

function getSectionText(text, headings) {
  const lines = String(text || '').split(/\r?\n/);
  const normalizedTargets = headings.map(heading => heading.toLowerCase());
  const allHeadings = new Set(SECTION_HEADINGS.map(heading => heading.toLowerCase()));

  const startIndex = lines.findIndex(line => {
    const normalized = line.trim().replace(/[:\-]+$/, '').toLowerCase();
    return normalizedTargets.includes(normalized);
  });

  if (startIndex === -1) return '';

  const endIndex = lines.findIndex((line, index) => {
    if (index <= startIndex) return false;
    const normalized = line.trim().replace(/[:\-]+$/, '').toLowerCase();
    return allHeadings.has(normalized);
  });

  return lines.slice(startIndex + 1, endIndex === -1 ? lines.length : endIndex).join('\n').trim();
}

function detectSections(text) {
  const lower = String(text || '').toLowerCase();
  return {
    summary: /\b(summary|professional summary|profile|objective)\b/i.test(lower),
    skills: /\b(skills|technical skills|technologies|tools)\b/i.test(lower),
    projects: /\b(projects?|portfolio)\b/i.test(lower),
    experience: /\b(experience|work experience|internship|employment)\b/i.test(lower),
    education: /\b(education|degree|university|college|bachelor|master|b\.tech|m\.tech)\b/i.test(lower),
    certifications: /\b(certifications?|certificates?|certified)\b/i.test(lower),
  };
}

function buildSection(section, score, feedback, recommendation, evidence = '') {
  const normalizedScore = clamp(score);
  const status = normalizedScore >= 78 ? 'Strong' : normalizedScore >= 55 ? 'Developing' : 'Needs work';
  return {
    section,
    score: normalizedScore,
    status,
    feedback,
    recommendation,
    evidence,
  };
}

function extractResumeSignals(resumeText, parsedData = {}) {
  const text = String(resumeText || '');
  const lower = text.toLowerCase();
  const parsedSkills = parsedData.skills || {};
  const skillsFromParsed = [
    ...(Array.isArray(parsedSkills) ? parsedSkills : []),
    ...(parsedSkills.technical || []),
    ...(parsedSkills.frameworks || []),
    ...(parsedSkills.databases || []),
    ...(parsedSkills.tools || []),
    ...(parsedSkills.platforms || []),
    ...(parsedSkills.languages || []),
  ];
  const knownTerms = unique(Object.values(ROLE_PROFILES).flatMap(profile => profile.skills));
  const extractedSkills = unique([
    ...skillsFromParsed.map(skill => String(skill).trim()),
    ...knownTerms.filter(term => hasTerm(lower, term)),
  ]);

  const projectCount = (lower.match(/\b(projects?|built|developed|implemented|created|designed)\b/g) || []).length;
  const hasMetrics = /\b\d+%|\b\d+\s*percent|\b\d+x|\b\d+\+|\b(increased|reduced|improved|optimized)\b/i.test(text);
  const educationSignals = unique([
    /bachelor|b\.tech|bsc|bs\b/i.test(text) && 'Bachelor degree',
    /master|m\.tech|msc|ms\b/i.test(text) && 'Master degree',
    /phd|doctorate/i.test(text) && 'PhD',
    /certified|certification|certificate/i.test(text) && 'Certification',
  ]);
  const yearsMatch = lower.match(/(\d+)\+?\s*(?:years|yrs)/);
  const yearsOfExperience = Number(parsedData.yearsOfExperience ?? yearsMatch?.[1] ?? 0);
  const sections = detectSections(text);
  const summaryText = parsedData.summary || getSectionText(text, ['summary', 'professional summary', 'profile', 'objective']);
  const projectText = getSectionText(text, ['projects', 'project', 'portfolio']);
  const experienceText = getSectionText(text, ['experience', 'work experience', 'internship', 'internships', 'employment']);
  const educationText = getSectionText(text, ['education']);
  const certificationText = getSectionText(text, ['certifications', 'certification', 'certificates']);
  const emailPresent = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);
  const phonePresent = /(?:\+?\d[\d\s().-]{7,}\d)/.test(text);
  const linkedinPresent = /linkedin\.com|linkedin/i.test(text);
  const githubPresent = /github\.com|github/i.test(text);
  const portfolioPresent = /https?:\/\/|www\.|portfolio|vercel|netlify|render/i.test(text);
  const quantifiedMatches = text.match(/\b\d+(?:\.\d+)?\s*(?:%|percent|x|\+|users?|clients?|projects?|apis?|seconds?|minutes?|hours?|days?|requests?|records?)/gi) || [];
  const impactVerbPresent = /\b(increased|reduced|improved|optimized|automated|deployed|launched|scaled|saved|built|integrated|migrated)\b/i.test(text);
  const bulletCount = (text.match(/^\s*[-*]\s+/gm) || []).length;
  const longSentenceCount = text
    .split(/[.!?]\s+/)
    .filter(sentence => sentence.trim().split(/\s+/).length > 45)
    .length;
  const targetKeywordMatches = TARGET_KEYWORDS.filter(keyword => hasAnyTerm(lower, keyword.terms)).map(keyword => keyword.label);
  const missingTargetKeywords = TARGET_KEYWORDS.filter(keyword => !targetKeywordMatches.includes(keyword.label)).map(keyword => keyword.label);

  return {
    text,
    lower,
    skills: extractedSkills,
    projectCount,
    hasMetrics,
    educationSignals,
    yearsOfExperience,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    candidateName: extractCandidateName(text, parsedData),
    sections,
    summaryText,
    projectText,
    experienceText,
    educationText,
    certificationText,
    emailPresent,
    phonePresent,
    linkedinPresent,
    githubPresent,
    portfolioPresent,
    quantifiedMatches,
    impactVerbPresent,
    bulletCount,
    longSentenceCount,
    targetKeywordMatches,
    missingTargetKeywords,
  };
}

function estimateExperienceLevel(yearsOfExperience, skillsCount, projectCount) {
  const maturityScore = yearsOfExperience * 14 + skillsCount * 2 + projectCount * 3;
  if (maturityScore >= 95) return 'Advanced';
  if (maturityScore >= 50) return 'Intermediate';
  return 'Beginner';
}

function scoreRole(profile, signals) {
  const matchedSkills = profile.skills.filter(skill => {
    const skillRegex = new RegExp(`\\b${escapeRegExp(skill).replace(/\\\./g, '\\.?')}\\b`, 'i');
    return signals.skills.some(candidateSkill => skillRegex.test(candidateSkill)) || skillRegex.test(signals.lower);
  });
  const missingSkills = profile.skills.filter(skill => !matchedSkills.includes(skill));
  const requiredSkillWindow = Math.min(profile.skills.length, 6);
  const skillScore = Math.min(70, (matchedSkills.length / requiredSkillWindow) * 70);
  const experienceScore = Math.min(15, signals.yearsOfExperience * 3);
  const projectScore = Math.min(10, signals.projectCount * 2);
  const metricScore = signals.hasMetrics ? 5 : 0;
  const coreDepthBonus = matchedSkills.length >= 5 ? 8 : matchedSkills.length >= 4 ? 4 : 0;

  return {
    matchedSkills,
    missingSkills,
    matchPercentage: clamp(skillScore + experienceScore + projectScore + metricScore + coreDepthBonus, 18, 98),
  };
}

function buildReason(role, matchedSkills, signals) {
  if (matchedSkills.length >= 3) {
    return `Strong fit because the resume shows ${matchedSkills.slice(0, 5).join(', ')} with relevant project or experience signals.`;
  }
  if (signals.projectCount > 1) {
    return `Potential fit because project work is visible, but more role-specific keywords are needed for stronger ATS alignment.`;
  }
  return `Possible fit based on transferable software fundamentals, but the resume should add more direct ${role} evidence.`;
}

function roadmapForRole(role, missingSkills, profile) {
  return unique([
    ...missingSkills.slice(0, 2).map(skill => `Learn ${skill} fundamentals`),
    ...profile.roadmap.slice(0, 3),
  ]).slice(0, 5);
}

function inferCertifications(topRoles) {
  const joined = topRoles.map(role => role.role).join(' ').toLowerCase();
  if (/cloud/.test(joined)) return CERTIFICATIONS.cloud;
  if (/devops/.test(joined)) return CERTIFICATIONS.devops;
  if (/data/.test(joined)) return CERTIFICATIONS.data;
  if (/ai|ml/.test(joined)) return CERTIFICATIONS.ai;
  return ['freeCodeCamp Full Stack Developer', 'Meta Front-End Developer Certificate', 'MongoDB Associate Developer'];
}

function deterministicRoleRecommendations(resumeText, parsedData = {}) {
  const signals = extractResumeSignals(resumeText, parsedData);
  const contactScore = clamp(
    (signals.emailPresent ? 3 : 0)
      + (signals.phonePresent ? 3 : 0)
      + (signals.linkedinPresent ? 2 : 0)
      + ((signals.githubPresent || signals.portfolioPresent) ? 2 : 0),
    0,
    10,
  );
  const summaryWords = signals.summaryText.split(/\s+/).filter(Boolean).length;
  const summaryScore = clamp(
    signals.summaryText
      ? 4
        + (summaryWords >= 25 ? 3 : summaryWords >= 12 ? 1 : 0)
        + (signals.targetKeywordMatches.length ? 2 : 0)
        + (signals.impactVerbPresent ? 1 : 0)
      : 2,
    0,
    10,
  );
  const skillsScore = clamp(
    Math.min(15, signals.skills.length * 1.4 + signals.targetKeywordMatches.length * 0.9),
    0,
    15,
  );
  const projectTechMentions = ROLE_PROFILES['MERN Stack Developer'].skills
    .filter(skill => hasTerm(signals.projectText.toLowerCase(), skill)).length;
  const projectsScore = clamp(
    (signals.sections.projects || signals.projectCount > 0 ? 4 : 1)
      + Math.min(4, signals.projectCount)
      + Math.min(3, projectTechMentions)
      + (signals.quantifiedMatches.length ? 1 : 0),
    0,
    12,
  );
  const experienceScore = clamp(
    (signals.sections.experience || signals.yearsOfExperience > 0 ? 5 : 2)
      + Math.min(4, signals.yearsOfExperience)
      + (/intern|developer|engineer|worked|company|organization/i.test(signals.experienceText || signals.text) ? 2 : 0)
      + (signals.quantifiedMatches.length && signals.sections.experience ? 1 : 0),
    0,
    12,
  );
  const educationScore = clamp(
    signals.educationSignals.length || signals.sections.education || signals.educationText
      ? 6 + Math.min(2, signals.educationSignals.length)
      : 2,
    0,
    8,
  );
  const certificationScore = clamp(
    signals.sections.certifications || signals.certificationText || /certified|certificate/i.test(signals.text) ? 5 : 1,
    0,
    5,
  );
  const quantifiedScore = clamp(
    Math.min(8, signals.quantifiedMatches.length * 2.5) + (signals.impactVerbPresent ? 2 : 0),
    0,
    10,
  );
  const keywordScore = clamp((signals.targetKeywordMatches.length / TARGET_KEYWORDS.length) * 10, 0, 10);
  const clarityScore = clamp(
    4 - Math.min(2, signals.longSentenceCount) - (/ {3,}|\t{2,}/.test(signals.text) ? 1 : 0),
    1,
    4,
  );
  const structureScore = clamp(
    (Object.values(signals.sections).filter(Boolean).length >= 5 ? 2 : 0)
      + (signals.bulletCount >= 4 ? 1 : 0)
      + (signals.wordCount >= 250 && signals.wordCount <= 900 ? 1 : 0),
    0,
    4,
  );
  const scoreBreakdown = {
    contactInformation: contactScore,
    professionalSummary: summaryScore,
    skillsSection: skillsScore,
    projectDetails: projectsScore,
    experience: experienceScore,
    education: educationScore,
    certifications: certificationScore,
    quantifiedAchievements: quantifiedScore,
    atsKeywordMatch: keywordScore,
    grammarClarity: clarityScore,
    lengthStructure: structureScore,
  };
  const atsScore = clamp(Object.values(scoreBreakdown).reduce((total, score) => total + score, 0), 25, 98);
  const recommendedRoles = SUPPORTED_ROLES.map(role => {
    const profile = ROLE_PROFILES[role];
    const roleScore = scoreRole(profile, signals);
    const missingSkills = roleScore.missingSkills.slice(0, 5).map(skill => skill.toUpperCase() === skill ? skill : skill.replace(/\b\w/g, char => char.toUpperCase()));
    const matchedSkills = roleScore.matchedSkills.map(skill => skill.replace(/\b\w/g, char => char.toUpperCase()));

    return {
      role,
      matchPercentage: roleScore.matchPercentage,
      reason: buildReason(role, matchedSkills, signals),
      matchedSkills,
      missingSkills,
      salaryTrend: profile.salaryTrend,
      recommendedLearning: roadmapForRole(role, missingSkills, profile),
    };
  })
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 5);

  const strengths = unique([
    contactScore >= 8 && 'Contact details are easy to find, including email plus professional links or phone.',
    signals.targetKeywordMatches.length >= 6 && `Strong ATS keyword coverage for ${signals.targetKeywordMatches.slice(0, 5).join(', ')}.`,
    signals.projectCount >= 2 && 'Project work is visible and gives recruiters concrete engineering evidence.',
    signals.quantifiedMatches.length > 0 && 'The resume includes measurable impact signals instead of only responsibilities.',
    educationScore >= 6 && 'Education information is present and supports the candidate profile.',
  ]);

  const weaknesses = unique([
    contactScore < 7 && 'Contact section is incomplete; recruiters may not see enough direct reach-out links.',
    summaryScore < 6 && 'Professional summary is missing or too generic for full-stack and AI developer roles.',
    projectsScore < 7 && 'Projects need stronger stack, feature, API, deployment, and impact details.',
    experienceScore < 7 && 'Experience or internship section needs clearer responsibilities and outcomes.',
    quantifiedScore < 6 && 'Achievements are not quantified with numbers, scale, users, performance, or time saved.',
    keywordScore < 6 && `Missing ATS keywords: ${signals.missingTargetKeywords.slice(0, 6).join(', ')}.`,
  ]);

  const sectionAnalysis = [
    buildSection(
      'Summary',
      summaryScore * 10,
      signals.summaryText
        ? `Summary detected with ${summaryWords} words. It ${summaryWords >= 25 ? 'has enough room to position the candidate' : 'is short and should sell the target role more clearly'}.`
        : 'No dedicated professional summary was detected.',
      signals.summaryText
        ? 'Mention your target role, strongest stack, AI/full-stack focus, and one measurable achievement in 2-3 lines.'
        : 'Add a 2-3 line summary naming full-stack or AI developer focus, strongest technologies, and one outcome.',
      signals.summaryText.slice(0, 160),
    ),
    buildSection(
      'Skills',
      Math.round((skillsScore / 15) * 100),
      signals.skills.length
        ? `Detected ${signals.skills.slice(0, 8).join(', ')}.`
        : 'No strong technical skills list was detected.',
      signals.missingTargetKeywords.length
        ? `Add missing role keywords such as ${signals.missingTargetKeywords.slice(0, 6).join(', ')} where they are truthful.`
        : 'Keep the skills section grouped by frontend, backend, database, AI, tools, and deployment.',
      signals.targetKeywordMatches.join(', '),
    ),
    buildSection(
      'Projects',
      Math.round((projectsScore / 12) * 100),
      signals.projectText
        ? `Projects section detected. ${projectTechMentions ? 'Technologies are mentioned, but outcomes can be sharper.' : 'Technologies used are not clear enough.'}`
        : 'Projects section is missing or too difficult to detect from the resume text.',
      projectTechMentions
        ? 'For each project, add problem, tech stack, API/database/auth details, deployment link, and measurable impact.'
        : 'Your projects section does not mention technologies used. Add React, Node.js, MongoDB, APIs, deployment, and measurable impact.',
      signals.projectText.slice(0, 160),
    ),
    buildSection(
      'Experience',
      Math.round((experienceScore / 12) * 100),
      signals.sections.experience || signals.yearsOfExperience
        ? `Experience signal detected${signals.yearsOfExperience ? ` with ${signals.yearsOfExperience}+ years referenced` : ''}.`
        : 'No clear work experience or internship section was detected.',
      'Use action verbs and add measurable responsibilities: built APIs, integrated auth, improved performance, handled users, or deployed features.',
      signals.experienceText.slice(0, 160),
    ),
    buildSection(
      'Education',
      Math.round((educationScore / 8) * 100),
      educationScore >= 6
        ? `Education signal detected: ${signals.educationSignals.join(', ') || 'degree or institution details found'}.`
        : 'Education details are thin or missing.',
      'Include degree, institution, graduation year, CGPA if strong, and relevant coursework only when useful.',
      signals.educationText.slice(0, 160),
    ),
    buildSection(
      'ATS Optimization',
      keywordScore * 10,
      signals.targetKeywordMatches.length
        ? `Matched ${signals.targetKeywordMatches.length}/${TARGET_KEYWORDS.length} target full-stack/AI keywords.`
        : 'The resume does not contain the expected full-stack or AI developer keywords.',
      signals.missingTargetKeywords.length
        ? `Add truthful evidence for ${signals.missingTargetKeywords.slice(0, 8).join(', ')}.`
        : 'Keyword coverage is strong; keep matching keywords to actual project evidence.',
      signals.targetKeywordMatches.join(', '),
    ),
    buildSection(
      'Formatting',
      Math.round(((clarityScore + structureScore) / 8) * 100),
      `Resume has ${signals.wordCount} words, ${signals.bulletCount} bullet lines, and ${Object.values(signals.sections).filter(Boolean).length} detected sections.`,
      signals.wordCount < 250
        ? 'Expand the resume with concise bullets under projects and experience; one-page resumes still need enough evidence.'
        : 'Keep headings consistent, prefer bullets over paragraphs, and keep each bullet focused on action, technology, and outcome.',
      '',
    ),
  ];

  const actionableImprovements = unique([
    ...sectionAnalysis
      .filter(section => section.score < 75)
      .map(section => section.recommendation),
    signals.quantifiedMatches.length < 2 && 'Add at least 3 quantified bullets, such as "reduced API latency by 30%" or "served 500+ users".',
    signals.githubPresent ? '' : 'Add a GitHub profile or repository links for projects that can be reviewed.',
    signals.portfolioPresent ? '' : 'Add live deployment links for the strongest full-stack projects.',
  ]).slice(0, 8);

  const bestCareerPath = recommendedRoles[0]?.role || 'Software Engineer';
  const candidateName = signals.candidateName;

  return {
    atsScore,
    overallScore: atsScore,
    candidateName,
    welcomeMessage: candidateName
      ? `Welcome ${candidateName} to AFAI Resume IQ. Let's analyze your resume.`
      : "Welcome to AFAI Resume IQ. Let's analyze your resume.",
    scoreBreakdown,
    sectionAnalysis,
    recommendedRoles,
    bestCareerPath,
    estimatedExperienceLevel: estimateExperienceLevel(signals.yearsOfExperience, signals.skills.length, signals.projectCount),
    nextTechnologiesToLearn: unique([
      ...signals.missingTargetKeywords,
      ...recommendedRoles.flatMap(role => role.missingSkills),
    ]).slice(0, 6),
    portfolioImprovements: unique([
      'Add one deployed project with live URL and GitHub link',
      'Document architecture decisions and trade-offs in project descriptions',
      'Add metrics: latency reduced, users served, bugs fixed, or automation time saved',
    ]),
    suggestedCertifications: inferCertifications(recommendedRoles).slice(0, 4),
    topHiringCompanies: ['TCS', 'Infosys', 'Accenture', 'Deloitte', 'Amazon', 'Microsoft'].slice(0, 5),
    strengths: strengths.length ? strengths : ['Readable resume structure', 'Found career-relevant keywords'],
    weaknesses: weaknesses.length ? weaknesses : ['Resume is readable, but it can still improve evidence depth and ATS alignment.'],
    improvements: actionableImprovements,
    actionableImprovements,
    missingKeywordSuggestions: signals.missingTargetKeywords,
    extractedSkills: signals.skills,
    resumeQualitySignals: {
      wordCount: signals.wordCount,
      detectedSections: Object.entries(signals.sections).filter(([, present]) => present).map(([section]) => section),
      contact: {
        email: signals.emailPresent,
        phone: signals.phonePresent,
        linkedin: signals.linkedinPresent,
        github: signals.githubPresent,
        portfolio: signals.portfolioPresent,
      },
      matchedTargetKeywords: signals.targetKeywordMatches,
      quantifiedEvidenceCount: signals.quantifiedMatches.length,
    },
    mode: 'deterministic',
  };
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || '').match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeRoleAnalysis(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const fallbackRoles = fallback.recommendedRoles || [];

  return {
    atsScore: clamp(source.atsScore ?? fallback.atsScore),
    recommendedRoles: Array.isArray(source.recommendedRoles) && source.recommendedRoles.length
      ? source.recommendedRoles.map((role, index) => ({
        role: role.role || fallbackRoles[index]?.role || 'Software Engineer',
        matchPercentage: clamp(role.matchPercentage ?? role.score ?? fallbackRoles[index]?.matchPercentage ?? 60),
        reason: role.reason || fallbackRoles[index]?.reason || 'Role aligns with detected skills and project keywords.',
        matchedSkills: Array.isArray(role.matchedSkills) ? role.matchedSkills : fallbackRoles[index]?.matchedSkills || [],
        missingSkills: Array.isArray(role.missingSkills) ? role.missingSkills : fallbackRoles[index]?.missingSkills || [],
        salaryTrend: role.salaryTrend || fallbackRoles[index]?.salaryTrend || 'Demand varies by market and experience level.',
        recommendedLearning: Array.isArray(role.recommendedLearning) ? role.recommendedLearning : fallbackRoles[index]?.recommendedLearning || [],
      }))
      : fallbackRoles,
    bestCareerPath: source.bestCareerPath || fallback.bestCareerPath,
    estimatedExperienceLevel: source.estimatedExperienceLevel || fallback.estimatedExperienceLevel,
    nextTechnologiesToLearn: Array.isArray(source.nextTechnologiesToLearn) ? source.nextTechnologiesToLearn : fallback.nextTechnologiesToLearn,
    portfolioImprovements: Array.isArray(source.portfolioImprovements) ? source.portfolioImprovements : fallback.portfolioImprovements,
    suggestedCertifications: Array.isArray(source.suggestedCertifications) ? source.suggestedCertifications : fallback.suggestedCertifications,
    topHiringCompanies: Array.isArray(source.topHiringCompanies) ? source.topHiringCompanies : fallback.topHiringCompanies,
    strengths: Array.isArray(source.strengths) ? source.strengths : fallback.strengths,
    weaknesses: Array.isArray(source.weaknesses) ? source.weaknesses : fallback.weaknesses,
    improvements: Array.isArray(source.improvements) ? source.improvements : fallback.improvements,
    actionableImprovements: Array.isArray(source.actionableImprovements) ? source.actionableImprovements : fallback.actionableImprovements,
    missingKeywordSuggestions: Array.isArray(source.missingKeywordSuggestions) ? source.missingKeywordSuggestions : fallback.missingKeywordSuggestions,
    sectionAnalysis: Array.isArray(source.sectionAnalysis) ? source.sectionAnalysis : fallback.sectionAnalysis,
    scoreBreakdown: source.scoreBreakdown && typeof source.scoreBreakdown === 'object' ? source.scoreBreakdown : fallback.scoreBreakdown,
    candidateName: typeof source.candidateName === 'string' ? source.candidateName : fallback.candidateName,
    welcomeMessage: typeof source.welcomeMessage === 'string' ? source.welcomeMessage : fallback.welcomeMessage,
    extractedSkills: Array.isArray(source.extractedSkills) ? source.extractedSkills : fallback.extractedSkills,
    resumeQualitySignals: source.resumeQualitySignals && typeof source.resumeQualitySignals === 'object' ? source.resumeQualitySignals : fallback.resumeQualitySignals,
    mode: source.mode || 'ai',
  };
}

function buildPrompt(resumeText, parsedData) {
  return `
You are an expert ATS system, technical recruiter, and career coach.
Analyze the resume and recommend suitable tech job roles.

Supported roles:
${SUPPORTED_ROLES.map(role => `- ${role}`).join('\n')}

Evaluate based on:
- contact information
- professional summary quality
- skills section strength
- project details
- work or internship experience
- education and certifications
- quantified achievements
- ATS keyword match
- grammar and clarity
- resume length and structure

Use only evidence present in the resume text. Do not invent companies, projects, metrics, certifications, links, or skills.
Make suggestions specific to missing or weak evidence in this resume.

Return ONLY valid JSON in this exact shape:
{
  "atsScore": 82,
  "candidateName": "Name found in resume or empty string",
  "welcomeMessage": "Welcome Name to AFAI Resume IQ. Let's analyze your resume.",
  "estimatedExperienceLevel": "Beginner|Intermediate|Advanced",
  "bestCareerPath": "MERN Stack Developer",
  "scoreBreakdown": {
    "contactInformation": 8,
    "professionalSummary": 7,
    "skillsSection": 12,
    "projectDetails": 8,
    "experience": 7,
    "education": 6,
    "certifications": 2,
    "quantifiedAchievements": 4,
    "atsKeywordMatch": 7,
    "grammarClarity": 3,
    "lengthStructure": 3
  },
  "sectionAnalysis": [
    {
      "section": "Projects",
      "score": 70,
      "status": "Developing",
      "feedback": "Specific evidence from the resume",
      "recommendation": "Specific improvement",
      "evidence": "Short excerpt or detected signal"
    }
  ],
  "recommendedRoles": [
    {
      "role": "MERN Stack Developer",
      "matchPercentage": 91,
      "reason": "Strong React, Node.js, MongoDB projects detected",
      "matchedSkills": ["React", "Node.js", "MongoDB"],
      "missingSkills": ["Redis", "Docker"],
      "salaryTrend": "Short market-oriented sentence",
      "recommendedLearning": ["Learn Docker basics", "Build scalable backend APIs"]
    }
  ],
  "nextTechnologiesToLearn": [],
  "portfolioImprovements": [],
  "suggestedCertifications": [],
  "topHiringCompanies": [],
  "strengths": [],
  "weaknesses": [],
  "improvements": [],
  "actionableImprovements": [],
  "missingKeywordSuggestions": []
}

Resume text:
${resumeText.slice(0, 12000)}

Parsed resume context:
${JSON.stringify(parsedData || {}, null, 2).slice(0, 5000)}
`.trim();
}

class ResumeAIService {
  async analyzeResumeForRoles(resumeText, parsedData = {}) {
    const fallback = deterministicRoleRecommendations(resumeText, parsedData);

    try {
      const gemini = getGeminiClient();
      if (gemini) {
        const model = gemini.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
        const result = await model.generateContent(buildPrompt(resumeText, parsedData));
        const normalized = normalizeRoleAnalysis(parseJson(result.response.text()), fallback);

        return {
          ...normalized,
          atsScore: fallback.atsScore,
          overallScore: fallback.overallScore,
          candidateName: fallback.candidateName,
          welcomeMessage: fallback.welcomeMessage,
          scoreBreakdown: fallback.scoreBreakdown,
          sectionAnalysis: fallback.sectionAnalysis,
          strengths: fallback.strengths,
          weaknesses: fallback.weaknesses,
          improvements: fallback.improvements,
          actionableImprovements: fallback.actionableImprovements,
          missingKeywordSuggestions: fallback.missingKeywordSuggestions,
          extractedSkills: fallback.extractedSkills,
          resumeQualitySignals: fallback.resumeQualitySignals,
          mode: 'ai-assisted-deterministic',
        };
      }
    } catch (error) {
      console.warn('Resume role recommendation AI fallback:', error.message);
    }

    return fallback;
  }
}

module.exports = new ResumeAIService();
