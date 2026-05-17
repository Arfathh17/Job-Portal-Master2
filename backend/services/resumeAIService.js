const { OpenAI } = require('openai');
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

function isUsableKey(key) {
  return typeof key === 'string'
    && key.trim().length > 20
    && !/your_|replace|placeholder|example/i.test(key);
}

function getOpenAIClient() {
  if (!isUsableKey(process.env.OPENAI_API_KEY)) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

  const projectCount = (lower.match(/\b(project|built|developed|implemented|created|designed)\b/g) || []).length;
  const hasMetrics = /\b\d+%|\b\d+\s*percent|\b\d+x|\b\d+\+|\b(increased|reduced|improved|optimized)\b/i.test(text);
  const educationSignals = unique([
    /bachelor|b\.tech|bsc|bs\b/i.test(text) && 'Bachelor degree',
    /master|m\.tech|msc|ms\b/i.test(text) && 'Master degree',
    /phd|doctorate/i.test(text) && 'PhD',
    /certified|certification|certificate/i.test(text) && 'Certification',
  ]);
  const yearsMatch = lower.match(/(\d+)\+?\s*(?:years|yrs)/);
  const yearsOfExperience = Number(parsedData.yearsOfExperience ?? yearsMatch?.[1] ?? 0);

  return {
    text,
    lower,
    skills: extractedSkills,
    projectCount,
    hasMetrics,
    educationSignals,
    yearsOfExperience,
    wordCount: text.split(/\s+/).filter(Boolean).length,
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

  const atsScore = clamp(
    38
      + Math.min(25, signals.skills.length * 3)
      + Math.min(15, signals.projectCount * 3)
      + (signals.hasMetrics ? 12 : 0)
      + Math.min(10, Math.floor(signals.wordCount / 80)),
    30,
    96,
  );

  const strengths = unique([
    signals.skills.length >= 5 && 'Strong technical keyword coverage',
    signals.projectCount >= 2 && 'Project experience is visible',
    signals.hasMetrics && 'Includes measurable impact signals',
    signals.educationSignals.length > 0 && 'Education or certification signal detected',
  ]);

  const improvements = unique([
    !signals.hasMetrics && 'Add measurable impact such as performance, users, revenue, or time saved',
    signals.projectCount < 2 && 'Add 2-3 portfolio projects with stack, architecture, and outcome',
    signals.skills.length < 6 && 'Add more role-specific technical keywords',
    'Tailor summary and skills section to each target job description',
  ]);

  const bestCareerPath = recommendedRoles[0]?.role || 'Software Engineer';

  return {
    atsScore,
    recommendedRoles,
    bestCareerPath,
    estimatedExperienceLevel: estimateExperienceLevel(signals.yearsOfExperience, signals.skills.length, signals.projectCount),
    nextTechnologiesToLearn: unique(recommendedRoles.flatMap(role => role.missingSkills)).slice(0, 6),
    portfolioImprovements: [
      'Add one deployed project with live URL and GitHub link',
      'Document architecture decisions and trade-offs in project descriptions',
      'Add metrics: latency reduced, users served, bugs fixed, or automation time saved',
    ],
    suggestedCertifications: inferCertifications(recommendedRoles).slice(0, 4),
    topHiringCompanies: ['TCS', 'Infosys', 'Accenture', 'Deloitte', 'Amazon', 'Microsoft'].slice(0, 5),
    strengths: strengths.length ? strengths : ['Readable resume structure', 'Found career-relevant keywords'],
    improvements,
    extractedSkills: signals.skills,
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
    improvements: Array.isArray(source.improvements) ? source.improvements : fallback.improvements,
    extractedSkills: Array.isArray(source.extractedSkills) ? source.extractedSkills : fallback.extractedSkills,
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
- skills
- projects
- technologies
- experience
- education
- resume keywords
- ATS strengths
- career fit
- skill gaps for higher-level roles

Return ONLY valid JSON in this exact shape:
{
  "atsScore": 82,
  "estimatedExperienceLevel": "Beginner|Intermediate|Advanced",
  "bestCareerPath": "MERN Stack Developer",
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
  "improvements": []
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
      const openai = getOpenAIClient();
      if (openai) {
        const response = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.35,
          messages: [
            { role: 'system', content: 'Return valid JSON only. Do not include markdown.' },
            { role: 'user', content: buildPrompt(resumeText, parsedData) },
          ],
        });
        return normalizeRoleAnalysis(parseJson(response.choices[0]?.message?.content), fallback);
      }

      const gemini = getGeminiClient();
      if (gemini) {
        const model = gemini.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
        const result = await model.generateContent(buildPrompt(resumeText, parsedData));
        return normalizeRoleAnalysis(parseJson(result.response.text()), fallback);
      }
    } catch (error) {
      console.warn('Resume role recommendation AI fallback:', error.message);
    }

    return fallback;
  }
}

module.exports = new ResumeAIService();
