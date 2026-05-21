const ROLE_CONFIGS = [
  {
    role: 'Full Stack Developer',
    family: 'software',
    titles: ['full stack developer', 'fullstack developer', 'mern stack developer', 'web developer'],
    keywords: ['React', 'Node.js', 'Express.js', 'MongoDB', 'REST API', 'Authentication', 'GitHub', 'Deployment', 'JavaScript', 'Database', 'JWT', 'Frontend', 'Backend'],
    aliases: ['nodejs', 'express', 'restful api', 'api integration', 'auth', 'render', 'vercel', 'netlify'],
    skills: ['React', 'Node.js', 'Express.js', 'MongoDB', 'JavaScript', 'TypeScript', 'REST API', 'JWT', 'Git', 'GitHub', 'Redux', 'Tailwind CSS', 'PostgreSQL', 'Docker'],
    suggestions: [
      'Add project architecture details covering frontend, backend, database, authentication, and deployment.',
      'Include live deployment links and GitHub repositories for full-stack projects.',
      'Quantify impact such as users served, API latency reduced, bugs fixed, or workflow time saved.',
    ],
    careers: ['Full Stack Developer', 'MERN Stack Developer', 'Frontend Developer', 'Backend Developer'],
  },
  {
    role: 'Frontend Developer',
    family: 'software',
    titles: ['frontend developer', 'front end developer', 'react developer', 'ui developer'],
    keywords: ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Responsive Design', 'Accessibility', 'Redux', 'Performance', 'UI Components'],
    aliases: ['front-end', 'tailwind', 'vite', 'next.js', 'wcag'],
    skills: ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Tailwind CSS', 'Redux', 'Next.js', 'Vite', 'Accessibility', 'Responsive Design'],
    suggestions: [
      'Show responsive UI work with accessibility, performance, and component architecture details.',
      'Add links to deployed interfaces and explain measurable UX or performance improvements.',
      'Group frontend skills by framework, styling, state management, testing, and tooling.',
    ],
    careers: ['Frontend Developer', 'React Developer', 'UI Developer', 'Full Stack Developer'],
  },
  {
    role: 'Backend Developer',
    family: 'software',
    titles: ['backend developer', 'back end developer', 'api developer', 'server side developer'],
    keywords: ['Node.js', 'Express.js', 'REST API', 'GraphQL', 'Database', 'MongoDB', 'PostgreSQL', 'Authentication', 'Microservices', 'Redis', 'Security'],
    aliases: ['nodejs', 'express', 'api', 'jwt', 'server-side'],
    skills: ['Node.js', 'Express.js', 'REST API', 'GraphQL', 'MongoDB', 'PostgreSQL', 'Redis', 'JWT', 'Microservices', 'Docker', 'Testing'],
    suggestions: [
      'Describe API contracts, database design, authentication flow, validation, and error handling.',
      'Add performance or reliability metrics such as latency, throughput, uptime, or query improvements.',
      'Mention security practices, tests, logging, and deployment environment where relevant.',
    ],
    careers: ['Backend Developer', 'API Developer', 'Software Engineer', 'Full Stack Developer'],
  },
  {
    role: 'Software Engineer',
    family: 'software',
    titles: ['software engineer', 'software developer', 'programmer', 'application developer'],
    keywords: ['Data Structures', 'Algorithms', 'Programming', 'System Design', 'Testing', 'Git', 'Database', 'API', 'Debugging', 'OOP'],
    aliases: ['dsa', 'object oriented', 'unit testing'],
    skills: ['JavaScript', 'Python', 'Java', 'C++', 'Git', 'SQL', 'Testing', 'System Design', 'Data Structures', 'Algorithms'],
    suggestions: [
      'Connect technical skills to concrete projects, code quality, testing, and system design decisions.',
      'Add measurable engineering outcomes and scope, not only lists of languages.',
      'Include GitHub or portfolio evidence when project code can be shared.',
    ],
    careers: ['Software Engineer', 'Application Developer', 'Backend Developer', 'Full Stack Developer'],
  },
  {
    role: 'UX/UI Designer',
    family: 'design',
    titles: ['ux designer', 'ui designer', 'ux/ui designer', 'user experience designer', 'user interface designer'],
    keywords: ['Figma', 'Wireframing', 'Prototyping', 'User Research', 'Usability Testing', 'Accessibility', 'Design Systems', 'Interaction Design', 'User Flow', 'Mobile Design'],
    aliases: ['figma', 'adobe xd', 'sketch', 'persona', 'journey map', 'information architecture', 'wcag', 'user flows'],
    skills: ['Figma', 'Adobe XD', 'Sketch', 'Wireframing', 'Prototyping', 'User Research', 'Usability Testing', 'Accessibility', 'Design Systems', 'Interaction Design', 'User Flow', 'Mobile Design'],
    suggestions: [
      'Add portfolio case study links that show problem, research, wireframes, prototype, testing, and final outcome.',
      'Include research methodologies such as interviews, surveys, usability testing, or heuristic evaluation.',
      'Show design impact with metrics like task completion, conversion, engagement, accessibility, or reduced support friction.',
    ],
    careers: ['UX/UI Designer', 'Product Designer', 'UX Researcher', 'Interaction Designer'],
  },
  {
    role: 'Product Designer',
    family: 'design',
    titles: ['product designer', 'senior product designer', 'digital product designer'],
    keywords: ['Product Strategy', 'Design Systems', 'User Research', 'Prototyping', 'Figma', 'User Journey', 'A/B Testing', 'Design Thinking', 'Usability Testing', 'Stakeholder Collaboration'],
    aliases: ['roadmap', 'design sprint', 'journey map', 'ab testing', 'user flows'],
    skills: ['Figma', 'Product Strategy', 'Design Systems', 'User Research', 'Prototyping', 'A/B Testing', 'Design Thinking', 'User Journey', 'Usability Testing'],
    suggestions: [
      'Frame case studies around product problem, constraints, decisions, trade-offs, and business result.',
      'Mention collaboration with PMs, engineers, researchers, and stakeholders.',
      'Add metrics tied to product outcomes such as activation, retention, conversion, or task success.',
    ],
    careers: ['Product Designer', 'UX/UI Designer', 'UX Researcher', 'Design Lead'],
  },
  {
    role: 'UX Researcher',
    family: 'design',
    titles: ['ux researcher', 'user researcher', 'design researcher', 'user experience researcher'],
    keywords: ['User Research', 'Usability Testing', 'User Interviews', 'Surveys', 'Personas', 'Journey Mapping', 'Research Synthesis', 'A/B Testing', 'Heuristic Evaluation', 'Accessibility'],
    aliases: ['affinity mapping', 'user testing', 'research insights', 'mixed methods'],
    skills: ['User Research', 'Usability Testing', 'User Interviews', 'Surveys', 'Personas', 'Journey Mapping', 'Research Synthesis', 'A/B Testing', 'Heuristic Evaluation'],
    suggestions: [
      'Add research case studies with objective, methodology, participant count, insights, recommendations, and product impact.',
      'Mention research methods such as interviews, surveys, usability testing, heuristic evaluation, or journey mapping.',
      'Quantify research influence with task success, conversion, satisfaction, adoption, or reduced friction.',
    ],
    careers: ['UX Researcher', 'UX/UI Designer', 'Product Designer'],
  },
  {
    role: 'Graphic Designer',
    family: 'design',
    titles: ['graphic designer', 'visual designer', 'brand designer', 'creative designer'],
    keywords: ['Adobe Photoshop', 'Adobe Illustrator', 'InDesign', 'Branding', 'Typography', 'Layout Design', 'Color Theory', 'Print Design', 'Social Media Creatives', 'Visual Identity'],
    aliases: ['photoshop', 'illustrator', 'canva', 'adobe creative suite', 'brand identity'],
    skills: ['Adobe Photoshop', 'Adobe Illustrator', 'InDesign', 'Canva', 'Branding', 'Typography', 'Layout Design', 'Color Theory', 'Print Design'],
    suggestions: [
      'Add portfolio links with campaign visuals, brand systems, before/after examples, and design rationale.',
      'Mention tools, formats, industries, and production constraints handled.',
      'Quantify creative impact such as engagement, click-through rate, campaign reach, or brand consistency improvements.',
    ],
    careers: ['Graphic Designer', 'Visual Designer', 'Brand Designer', 'Creative Designer'],
  },
  {
    role: 'Data Analyst',
    family: 'data',
    titles: ['data analyst', 'business intelligence analyst', 'bi analyst', 'reporting analyst'],
    keywords: ['SQL', 'Excel', 'Power BI', 'Tableau', 'Python', 'Data Visualization', 'Dashboard', 'ETL', 'Statistics', 'Reporting'],
    aliases: ['powerbi', 'pivot table', 'pandas', 'numpy', 'analytics'],
    skills: ['SQL', 'Excel', 'Power BI', 'Tableau', 'Python', 'Pandas', 'Data Visualization', 'Dashboarding', 'Statistics', 'ETL'],
    suggestions: [
      'Add analytics projects with business question, dataset size, SQL/Python methods, dashboard output, and decision impact.',
      'Quantify reporting improvements, automation time saved, revenue insights, or forecast accuracy.',
      'Mention dashboard links or screenshots when possible.',
    ],
    careers: ['Data Analyst', 'BI Analyst', 'Reporting Analyst', 'Business Analyst'],
  },
  {
    role: 'AI/ML Engineer',
    family: 'data',
    titles: ['machine learning engineer', 'ai engineer', 'ml engineer', 'data scientist'],
    keywords: ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'LLM', 'Model Deployment', 'MLOps'],
    aliases: ['scikit-learn', 'sklearn', 'openai', 'gemini', 'rag', 'vector database'],
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'LLM', 'MLOps', 'Pandas', 'NumPy', 'Scikit-learn'],
    suggestions: [
      'Add model metrics such as accuracy, F1, latency, dataset size, evaluation method, and deployment approach.',
      'Separate experiments, production ML, LLM integration, and MLOps skills clearly.',
      'Include GitHub notebooks, demos, or API deployment links where possible.',
    ],
    careers: ['AI/ML Engineer', 'Machine Learning Engineer', 'Data Scientist', 'AI Integration Engineer'],
  },
  {
    role: 'DevOps Engineer',
    family: 'infrastructure',
    titles: ['devops engineer', 'site reliability engineer', 'sre', 'cloud devops engineer'],
    keywords: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Terraform', 'Linux', 'Monitoring', 'Jenkins'],
    aliases: ['github actions', 'gitlab ci', 'prometheus', 'grafana', 'iac'],
    skills: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Terraform', 'Linux', 'Jenkins', 'Monitoring', 'Prometheus', 'Grafana'],
    suggestions: [
      'Describe infrastructure scope: cloud provider, CI/CD flow, containers, monitoring, and incident reduction.',
      'Quantify deployment frequency, uptime, build-time reduction, cost savings, or recovery time improvements.',
      'Mention infrastructure-as-code and security practices where used.',
    ],
    careers: ['DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer', 'Platform Engineer'],
  },
  {
    role: 'Digital Marketer',
    family: 'marketing',
    titles: ['digital marketer', 'marketing executive', 'seo specialist', 'performance marketer'],
    keywords: ['SEO', 'Google Ads', 'Meta Ads', 'Content Marketing', 'Email Marketing', 'Analytics', 'Campaigns', 'Lead Generation', 'Conversion Rate', 'Social Media Marketing'],
    aliases: ['sem', 'ppc', 'google analytics', 'ga4', 'facebook ads', 'instagram ads'],
    skills: ['SEO', 'Google Ads', 'Meta Ads', 'Google Analytics', 'Content Marketing', 'Email Marketing', 'Lead Generation', 'Campaign Management', 'Social Media Marketing'],
    suggestions: [
      'Add campaign metrics such as ROAS, CAC, CTR, CPL, conversion rate, leads generated, or traffic growth.',
      'Separate organic, paid, email, content, and analytics experience.',
      'Mention tools like GA4, Search Console, Ads Manager, CRM, or marketing automation platforms.',
    ],
    careers: ['Digital Marketer', 'SEO Specialist', 'Performance Marketer', 'Marketing Executive'],
  },
  {
    role: 'Business Analyst',
    family: 'business',
    titles: ['business analyst', 'ba', 'systems analyst', 'functional analyst'],
    keywords: ['Requirements Gathering', 'Stakeholder Management', 'BRD', 'FRD', 'User Stories', 'Process Mapping', 'SQL', 'UAT', 'Agile', 'Business Process'],
    aliases: ['jira', 'confluence', 'gap analysis', 'acceptance criteria'],
    skills: ['Requirements Gathering', 'Stakeholder Management', 'User Stories', 'Process Mapping', 'SQL', 'UAT', 'Agile', 'Jira', 'Confluence'],
    suggestions: [
      'Add examples of requirements translated into user stories, workflows, acceptance criteria, and delivered outcomes.',
      'Quantify process improvements, cost savings, cycle-time reduction, or stakeholder impact.',
      'Mention domain knowledge, tools, and collaboration with product, engineering, QA, and business teams.',
    ],
    careers: ['Business Analyst', 'Product Analyst', 'Functional Analyst', 'Project Coordinator'],
  },
  {
    role: 'Project Manager',
    family: 'business',
    titles: ['project manager', 'program manager', 'scrum master', 'delivery manager'],
    keywords: ['Project Planning', 'Agile', 'Scrum', 'Risk Management', 'Budgeting', 'Stakeholder Management', 'Timeline', 'Delivery', 'Jira', 'Resource Management'],
    aliases: ['kanban', 'pmp', 'sprint planning', 'roadmap'],
    skills: ['Project Planning', 'Agile', 'Scrum', 'Risk Management', 'Budgeting', 'Stakeholder Management', 'Jira', 'Resource Management'],
    suggestions: [
      'Show project size, budget, team size, timelines, risks handled, and delivery outcomes.',
      'Quantify on-time delivery, cost control, productivity, or process improvement.',
      'Mention methodologies, tools, ceremonies, and stakeholder communication rhythm.',
    ],
    careers: ['Project Manager', 'Scrum Master', 'Program Manager', 'Delivery Manager'],
  },
  {
    role: 'HR / Recruiter',
    family: 'people',
    titles: ['hr executive', 'recruiter', 'talent acquisition', 'human resources', 'hr recruiter'],
    keywords: ['Recruitment', 'Talent Acquisition', 'Sourcing', 'Screening', 'Onboarding', 'HRMS', 'Employee Engagement', 'Interview Coordination', 'Payroll', 'Compliance'],
    aliases: ['ats', 'linkedin recruiter', 'naukri', 'workday'],
    skills: ['Recruitment', 'Talent Acquisition', 'Sourcing', 'Screening', 'Onboarding', 'HRMS', 'Employee Engagement', 'Interview Coordination'],
    suggestions: [
      'Add hiring metrics such as positions closed, time-to-fill, offer acceptance rate, or candidate pipeline size.',
      'Mention sourcing channels, ATS tools, interview coordination, onboarding, and stakeholder collaboration.',
      'Separate recruitment, HR operations, employee engagement, and compliance responsibilities.',
    ],
    careers: ['HR / Recruiter', 'Talent Acquisition Specialist', 'HR Executive', 'Recruitment Coordinator'],
  },
  {
    role: 'Sales Executive',
    family: 'sales',
    titles: ['sales executive', 'business development executive', 'account executive', 'sales representative'],
    keywords: ['Lead Generation', 'Cold Calling', 'CRM', 'Negotiation', 'Sales Pipeline', 'Revenue', 'Client Relationship', 'B2B Sales', 'Closing', 'Targets'],
    aliases: ['salesforce', 'hubspot', 'prospecting', 'quota'],
    skills: ['Lead Generation', 'Cold Calling', 'CRM', 'Negotiation', 'Sales Pipeline', 'Client Relationship', 'B2B Sales', 'Closing'],
    suggestions: [
      'Add sales metrics: revenue generated, quota attainment, deal size, conversion rate, meetings booked, or pipeline value.',
      'Mention CRM tools, sales cycle ownership, industries, and customer segments.',
      'Show negotiation, objection handling, relationship management, and retention outcomes.',
    ],
    careers: ['Sales Executive', 'Business Development Executive', 'Account Executive', 'Sales Representative'],
  },
  {
    role: 'Content Writer',
    family: 'content',
    titles: ['content writer', 'copywriter', 'technical writer', 'seo writer'],
    keywords: ['SEO Writing', 'Copywriting', 'Blog Writing', 'Content Strategy', 'Editing', 'Proofreading', 'WordPress', 'Keyword Research', 'Social Media Content', 'Technical Writing'],
    aliases: ['cms', 'semrush', 'ahrefs', 'grammar', 'content calendar'],
    skills: ['SEO Writing', 'Copywriting', 'Blog Writing', 'Content Strategy', 'Editing', 'Proofreading', 'WordPress', 'Keyword Research', 'Technical Writing'],
    suggestions: [
      'Add writing samples or portfolio links with topic, audience, format, and performance metrics.',
      'Mention SEO tools, keyword research, editorial workflow, CMS, and content strategy.',
      'Quantify traffic growth, ranking improvement, engagement, conversions, or publishing volume.',
    ],
    careers: ['Content Writer', 'Copywriter', 'SEO Writer', 'Technical Writer'],
  },
  {
    role: 'Customer Support',
    family: 'support',
    titles: ['customer support', 'customer service', 'support executive', 'technical support'],
    keywords: ['Customer Support', 'Ticketing', 'CRM', 'SLA', 'Troubleshooting', 'Live Chat', 'Email Support', 'Customer Satisfaction', 'Escalation', 'Knowledge Base'],
    aliases: ['zendesk', 'freshdesk', 'intercom', 'csat', 'helpdesk'],
    skills: ['Customer Support', 'Ticketing', 'CRM', 'SLA', 'Troubleshooting', 'Live Chat', 'Email Support', 'Escalation', 'Knowledge Base'],
    suggestions: [
      'Add support metrics such as CSAT, first response time, resolution time, ticket volume, or SLA adherence.',
      'Mention tools, channels handled, escalation ownership, and knowledge base contributions.',
      'Show customer empathy, troubleshooting process, and retention or quality improvements.',
    ],
    careers: ['Customer Support', 'Support Executive', 'Technical Support Specialist', 'Customer Success Associate'],
  },
];

const GENERAL_CONFIG = {
  role: 'General Professional',
  family: 'general',
  titles: [],
  keywords: ['Communication', 'Problem Solving', 'Collaboration', 'Leadership', 'Analysis', 'Operations', 'Planning', 'Reporting'],
  aliases: [],
  skills: ['Communication', 'Problem Solving', 'Collaboration', 'Leadership', 'Analysis', 'Planning', 'Reporting'],
  suggestions: [
    'Clarify the target role in the summary and align skills, experience, and achievements to that role.',
    'Add measurable outcomes that show scope, quality, speed, revenue, customer impact, or process improvement.',
    'Use clear section headings and evidence-rich bullets instead of broad responsibility statements.',
  ],
  careers: ['General Professional', 'Business Analyst', 'Project Coordinator'],
};

const SECTION_HEADINGS = [
  'summary',
  'professional summary',
  'profile',
  'objective',
  'skills',
  'technical skills',
  'core competencies',
  'tools',
  'projects',
  'portfolio',
  'case studies',
  'experience',
  'work experience',
  'employment',
  'internship',
  'internships',
  'education',
  'certifications',
  'achievements',
  'accomplishments',
];

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function unique(items) {
  const seen = new Set();
  return items.filter(item => {
    const value = String(item || '').trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function titleCase(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(part => (/^[A-Z]{2,}$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
    .join(' ');
}

function termRegex(term) {
  const escaped = escapeRegExp(term)
    .replace(/\\\./g, '\\.?')
    .replace(/\\\+/g, '\\+')
    .replace(/\\\//g, '[\\s/-]?')
    .replace(/\s+/g, '[\\s/-]+');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
}

function hasTerm(text, term) {
  return termRegex(term).test(String(text || ''));
}

function matchingTerms(text, terms) {
  return unique(terms.filter(term => hasTerm(text, term)));
}

function isLikelyParsedName(value) {
  const normalized = String(value || '').trim();
  if (!normalized || normalized.length < 3 || normalized.length > 60) return false;
  if (/@|https?:|www\.|\d|resume|curriculum|email|phone|linkedin|github/i.test(normalized)) return false;
  return normalized.split(/\s+/).every(word => /^[A-Za-z][A-Za-z.'-]*$/.test(word));
}

function isLikelyNameLine(line) {
  const normalized = String(line || '').trim();
  if (!isLikelyParsedName(normalized)) return false;
  const words = normalized.split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  return !ROLE_CONFIGS.some(config => config.titles.some(title => hasTerm(normalized, title)));
}

function extractCandidateName(resumeText, parsedData = {}) {
  const parsedName = parsedData.personalInfo?.name
    || parsedData.header?.name
    || parsedData.name
    || parsedData.fullName;

  if (isLikelyParsedName(parsedName)) return titleCase(parsedName);

  const nameLine = String(resumeText || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 10)
    .find(isLikelyNameLine);

  return nameLine ? titleCase(nameLine) : '';
}

function getSectionText(text, headings) {
  const lines = String(text || '').split(/\r?\n/);
  const targets = headings.map(heading => heading.toLowerCase());
  const allHeadings = new Set(SECTION_HEADINGS);
  const startIndex = lines.findIndex(line => targets.includes(line.trim().replace(/[:\-]+$/, '').toLowerCase()));

  if (startIndex === -1) return '';

  const endIndex = lines.findIndex((line, index) => {
    if (index <= startIndex) return false;
    return allHeadings.has(line.trim().replace(/[:\-]+$/, '').toLowerCase());
  });

  return lines.slice(startIndex + 1, endIndex === -1 ? lines.length : endIndex).join('\n').trim();
}

function detectSections(text) {
  const lower = String(text || '').toLowerCase();
  return {
    summary: /\b(summary|professional summary|profile|objective)\b/i.test(lower),
    skills: /\b(skills|technical skills|core competencies|tools|technologies)\b/i.test(lower),
    projects: /\b(projects?|portfolio|case studies|campaigns?)\b/i.test(lower),
    experience: /\b(experience|work experience|employment|internship|professional experience)\b/i.test(lower),
    education: /\b(education|degree|university|college|bachelor|master|b\.tech|m\.tech|mba)\b/i.test(lower),
    certifications: /\b(certifications?|certificates?|certified|license)\b/i.test(lower),
    achievements: /\b(achievements?|accomplishments?|awards?|impact)\b/i.test(lower),
  };
}

function extractParsedSkills(parsedData = {}) {
  const skills = parsedData.skills || {};
  if (Array.isArray(skills)) return skills;

  return [
    ...(skills.technical || []),
    ...(skills.soft || []),
    ...(skills.languages || []),
    ...(skills.tools || []),
    ...(skills.frameworks || []),
    ...(skills.databases || []),
    ...(skills.platforms || []),
    ...(parsedData.tools || []),
    ...(parsedData.certifications || []),
  ];
}

function buildVocabulary() {
  return unique(ROLE_CONFIGS.flatMap(config => [
    ...config.keywords,
    ...config.aliases,
    ...config.skills,
  ]));
}

function detectRoleScores(text) {
  const lower = String(text || '').toLowerCase();

  return ROLE_CONFIGS.map(config => {
    const titleMatches = matchingTerms(lower, config.titles);
    const keywordMatches = matchingTerms(lower, config.keywords);
    const aliasMatches = matchingTerms(lower, config.aliases);
    const skillMatches = matchingTerms(lower, config.skills);
    const score = titleMatches.length * 8
      + keywordMatches.length * 4
      + skillMatches.length * 3
      + aliasMatches.length * 2;

    return {
      role: config.role,
      config,
      score,
      titleMatches,
      keywordMatches,
      aliasMatches,
      skillMatches,
      evidence: unique([...titleMatches, ...keywordMatches, ...skillMatches, ...aliasMatches]),
    };
  }).sort((a, b) => b.score - a.score);
}

function extractSignals(resumeText, parsedData = {}) {
  const text = String(resumeText || '');
  const lower = text.toLowerCase();
  const parsedSkills = extractParsedSkills(parsedData);
  const vocabulary = buildVocabulary();
  const detectedFromVocabulary = vocabulary.filter(term => hasTerm(lower, term));
  const allSkills = unique([...parsedSkills, ...detectedFromVocabulary]).map(skill => {
    const canonical = ROLE_CONFIGS.flatMap(config => [...config.keywords, ...config.skills])
      .find(term => term.toLowerCase() === String(skill).toLowerCase());
    return canonical || titleCase(skill);
  });
  const roleScores = detectRoleScores(text);
  const topRole = roleScores[0]?.score > 0 ? roleScores[0] : { config: GENERAL_CONFIG, role: GENERAL_CONFIG.role, score: 0, evidence: [] };
  const sections = detectSections(text);
  const summaryText = parsedData.summary || getSectionText(text, ['summary', 'professional summary', 'profile', 'objective']);
  const projectText = getSectionText(text, ['projects', 'project', 'portfolio', 'case studies', 'campaigns']);
  const experienceText = getSectionText(text, ['experience', 'work experience', 'employment', 'internship', 'professional experience']);
  const educationText = getSectionText(text, ['education']);
  const certificationText = getSectionText(text, ['certifications', 'certification', 'certificates']);
  const contact = {
    email: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text),
    phone: /(?:\+?\d[\d\s().-]{7,}\d)/.test(text),
    linkedin: /linkedin\.com|linkedin/i.test(text),
    github: /github\.com|github/i.test(text),
    portfolio: /https?:\/\/|www\.|portfolio|behance|dribbble|medium|notion|figma\.com|tableau\.com|github/i.test(text),
  };
  const quantifiedMatches = text.match(/\b\d+(?:\.\d+)?\s*(?:%|percent|x|\+|users?|clients?|customers?|projects?|campaigns?|tickets?|leads?|revenue|sales|hours?|days?|requests?|records?|dashboards?|interviews?|hires?)/gi) || [];
  const impactVerbPresent = /\b(increased|reduced|improved|optimized|automated|launched|scaled|saved|delivered|designed|researched|analyzed|managed|generated|resolved|closed|converted|hired|published)\b/i.test(text);
  const bulletCount = (text.match(/^\s*[-*]\s+/gm) || []).length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const yearsOfExperience = Number(parsedData.yearsOfExperience ?? lower.match(/(\d+)\+?\s*(?:years|yrs)/)?.[1] ?? 0);

  return {
    text,
    lower,
    skills: allSkills,
    roleScores,
    detectedRole: topRole.config.role,
    roleConfig: topRole.config,
    roleEvidence: topRole.evidence,
    candidateName: extractCandidateName(text, parsedData),
    sections,
    summaryText,
    projectText,
    experienceText,
    educationText,
    certificationText,
    contact,
    quantifiedMatches,
    impactVerbPresent,
    bulletCount,
    wordCount,
    yearsOfExperience,
  };
}

function roleKeywordMatches(signals, config) {
  const terms = unique([...config.keywords, ...config.aliases]);
  const matched = config.keywords.filter(keyword => hasTerm(signals.lower, keyword)
    || config.aliases.some(alias => alias.toLowerCase().includes(keyword.toLowerCase()) && hasTerm(signals.lower, alias)));
  const aliasMatched = config.aliases.filter(alias => hasTerm(signals.lower, alias));
  return {
    matchedKeywords: unique([...matched, ...aliasMatched.map(alias => {
      const canonical = config.keywords.find(keyword => hasTerm(alias, keyword) || alias.toLowerCase().includes(keyword.toLowerCase()));
      return canonical || titleCase(alias);
    })]),
    missingKeywords: config.keywords.filter(keyword => !terms.some(term => hasTerm(signals.lower, term) && (term === keyword || keyword.toLowerCase().includes(term.toLowerCase()) || term.toLowerCase().includes(keyword.toLowerCase())))),
  };
}

function sectionScore(present, evidenceScore = 0, baseWhenPresent = 58, baseWhenMissing = 28) {
  return clamp((present ? baseWhenPresent : baseWhenMissing) + evidenceScore);
}

function buildSection(section, score, feedback, recommendation, evidence = '') {
  const normalized = clamp(score);
  return {
    section,
    score: normalized,
    status: normalized >= 78 ? 'Strong' : normalized >= 55 ? 'Developing' : 'Needs work',
    feedback,
    recommendation,
    evidence,
  };
}

function analyzeSections(signals, keywordData) {
  const config = signals.roleConfig;
  const summaryWords = signals.summaryText.split(/\s+/).filter(Boolean).length;
  const roleSkillMatches = config.skills.filter(skill => hasTerm(signals.lower, skill));
  const skillsScore = clamp(Math.min(100, 32 + roleSkillMatches.length * 8 + keywordData.matchedKeywords.length * 4));
  const projectsExperienceScore = sectionScore(
    signals.sections.projects || signals.sections.experience,
    Math.min(24, signals.quantifiedMatches.length * 5)
      + Math.min(12, roleSkillMatches.length * 2)
      + (signals.impactVerbPresent ? 8 : 0),
  );
  const atsScore = clamp((keywordData.matchedKeywords.length / Math.max(1, config.keywords.length)) * 100);
  const structureScore = clamp(
    25
      + Object.values(signals.sections).filter(Boolean).length * 8
      + (signals.bulletCount >= 4 ? 12 : 0)
      + (signals.wordCount >= 220 && signals.wordCount <= 950 ? 15 : 0)
      + (signals.contact.email ? 8 : 0)
      + (signals.contact.phone || signals.contact.linkedin || signals.contact.portfolio ? 8 : 0),
  );
  const educationScore = sectionScore(
    signals.sections.education || Boolean(signals.educationText),
    signals.sections.certifications || signals.certificationText ? 12 : 0,
    74,
    42,
  );
  const achievementScore = clamp(
    28
      + Math.min(45, signals.quantifiedMatches.length * 15)
      + (signals.impactVerbPresent ? 18 : 0)
      + (signals.sections.achievements ? 9 : 0),
  );
  const summaryScore = sectionScore(
    Boolean(signals.summaryText),
    (summaryWords >= 25 ? 18 : summaryWords >= 12 ? 8 : 0) + (signals.roleEvidence.length ? 8 : 0),
  );

  const sectionAnalysis = [
    buildSection(
      'Summary',
      summaryScore,
      signals.summaryText
        ? `Summary detected with ${summaryWords} words and ${signals.detectedRole} positioning signals.`
        : 'No dedicated professional summary was detected.',
      signals.summaryText
        ? `Sharpen the summary around ${signals.detectedRole}, strongest tools, domain context, and one measurable outcome.`
        : `Add a 2-3 line summary naming the target ${signals.detectedRole} role, strongest tools, and one proof point.`,
      signals.summaryText.slice(0, 180),
    ),
    buildSection(
      'Skills',
      skillsScore,
      roleSkillMatches.length
        ? `Detected role-relevant skills: ${roleSkillMatches.slice(0, 10).join(', ')}.`
        : `Few direct ${signals.detectedRole} skills were detected.`,
      keywordData.missingKeywords.length
        ? `Add truthful skills or evidence for ${keywordData.missingKeywords.slice(0, 6).join(', ')} if you have them.`
        : 'Skill coverage is aligned with the detected role; keep grouping tools and competencies clearly.',
      roleSkillMatches.join(', '),
    ),
    buildSection(
      'Projects / Experience',
      projectsExperienceScore,
      signals.projectText || signals.experienceText
        ? `Found ${signals.sections.projects ? 'project/portfolio' : 'experience'} evidence for this profile.`
        : 'Project, portfolio, campaign, or work evidence is hard to identify.',
      config.family === 'design'
        ? 'Show case studies from research to prototype to testing, with portfolio links and design impact.'
        : config.family === 'data'
          ? 'Show datasets, methods, dashboards/models, business question, and decision impact.'
          : config.family === 'marketing'
            ? 'Show campaigns, channels, budgets if shareable, audience, and performance metrics.'
            : config.family === 'sales'
              ? 'Show pipeline, targets, revenue, conversion, CRM usage, and customer segments.'
              : 'Use action-result bullets that show scope, tools, process, and measurable impact.',
      (signals.projectText || signals.experienceText).slice(0, 180),
    ),
    buildSection(
      'ATS Optimization',
      atsScore,
      `Matched ${keywordData.matchedKeywords.length}/${config.keywords.length} ${signals.detectedRole} ATS keywords.`,
      keywordData.missingKeywords.length
        ? `Prioritize role-specific keywords: ${keywordData.missingKeywords.slice(0, 8).join(', ')}.`
        : 'Role-specific ATS keyword coverage is strong.',
      keywordData.matchedKeywords.join(', '),
    ),
    buildSection(
      'Resume Structure',
      structureScore,
      `Detected ${Object.values(signals.sections).filter(Boolean).length} sections, ${signals.bulletCount} bullet lines, and ${signals.wordCount} words.`,
      'Use consistent headings, concise bullets, contact links, and a clear action-context-impact pattern.',
      '',
    ),
    buildSection(
      'Education',
      educationScore,
      educationScore >= 70 ? 'Education or certification information is visible.' : 'Education details are thin or missing.',
      'Include degree, institution, dates, relevant coursework, certifications, or training only when useful for the target role.',
      signals.educationText.slice(0, 180),
    ),
    buildSection(
      'Achievements / Impact',
      achievementScore,
      signals.quantifiedMatches.length
        ? `Detected quantified evidence: ${signals.quantifiedMatches.slice(0, 4).join(', ')}.`
        : 'Quantified achievements are limited or missing.',
      'Add measurable proof: percentages, volume, time saved, revenue, customer impact, quality, hiring, delivery, or satisfaction metrics.',
      signals.quantifiedMatches.join(', '),
    ),
  ];

  const overallScore = clamp(
    skillsScore * 0.20
      + projectsExperienceScore * 0.25
      + atsScore * 0.20
      + structureScore * 0.15
      + educationScore * 0.10
      + achievementScore * 0.10,
  );

  return {
    sectionAnalysis,
    atsScore,
    overallScore,
    scoreBreakdown: {
      skills: skillsScore,
      projectsExperience: projectsExperienceScore,
      atsOptimization: atsScore,
      resumeStructure: structureScore,
      education: educationScore,
      achievementsImpact: achievementScore,
    },
  };
}

function scoreRoleFit(config, signals) {
  const keywordData = roleKeywordMatches(signals, config);
  const skillMatches = config.skills.filter(skill => hasTerm(signals.lower, skill));
  const titleMatches = config.titles.filter(title => hasTerm(signals.lower, title));
  const familyBonus = config.family === signals.roleConfig.family ? 8 : 0;
  const matchPercentage = clamp(
    keywordData.matchedKeywords.length * 7
      + skillMatches.length * 5
      + titleMatches.length * 14
      + Math.min(10, signals.quantifiedMatches.length * 2)
      + familyBonus,
    12,
    98,
  );

  return {
    role: config.role,
    matchPercentage,
    matchedSkills: unique([...keywordData.matchedKeywords, ...skillMatches]).slice(0, 8),
    missingSkills: keywordData.missingKeywords.slice(0, 6),
    reason: keywordData.matchedKeywords.length || skillMatches.length
      ? `Recommended because the resume shows ${unique([...keywordData.matchedKeywords, ...skillMatches]).slice(0, 5).join(', ')} and ${config.family} role signals.`
      : `Closest fit based on transferable experience, but more direct ${config.role} evidence is needed.`,
    salaryTrend: 'Demand depends on portfolio depth, measurable outcomes, tool fluency, and domain experience.',
    recommendedLearning: config.suggestions.slice(0, 3),
  };
}

function buildRecommendations(signals) {
  const recommendations = ROLE_CONFIGS
    .map(config => scoreRoleFit(config, signals))
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 5);

  if (!recommendations.length) {
    return [scoreRoleFit(GENERAL_CONFIG, signals)];
  }

  return recommendations;
}

function buildStrengths(signals, keywordData, scores) {
  return unique([
    signals.contact.email && (signals.contact.phone || signals.contact.linkedin || signals.contact.portfolio) && 'Contact details and professional links are visible.',
    keywordData.matchedKeywords.length >= Math.ceil(signals.roleConfig.keywords.length * 0.55) && `Strong ${signals.detectedRole} keyword alignment: ${keywordData.matchedKeywords.slice(0, 6).join(', ')}.`,
    scores.scoreBreakdown.projectsExperience >= 72 && 'Experience, projects, portfolio, or campaigns show role-relevant evidence.',
    signals.quantifiedMatches.length > 0 && 'Resume includes measurable impact signals.',
    scores.scoreBreakdown.resumeStructure >= 75 && 'Resume structure is readable and ATS-friendly.',
  ]);
}

function buildWeaknesses(signals, keywordData, scores) {
  return unique([
    keywordData.missingKeywords.length >= 4 && `Missing important ${signals.detectedRole} keywords: ${keywordData.missingKeywords.slice(0, 6).join(', ')}.`,
    scores.scoreBreakdown.projectsExperience < 65 && `${signals.detectedRole} experience needs clearer role-specific evidence and outcomes.`,
    scores.scoreBreakdown.achievementsImpact < 60 && 'Achievements are not quantified enough for a strong recruiter or ATS read.',
    !signals.contact.portfolio && ['design', 'content', 'data', 'software'].includes(signals.roleConfig.family) && 'Portfolio, case study, project, or work sample links are missing.',
    scores.scoreBreakdown.resumeStructure < 65 && 'Resume structure needs clearer headings, bullets, or contact details.',
  ]);
}

function buildActionableImprovements(signals, keywordData, scores) {
  return unique([
    ...signals.roleConfig.suggestions,
    keywordData.missingKeywords.length && `Add truthful evidence for ${keywordData.missingKeywords.slice(0, 6).join(', ')} instead of unrelated generic keywords.`,
    scores.scoreBreakdown.achievementsImpact < 65 && 'Rewrite at least three bullets with measurable impact: action, context, metric, result.',
    scores.scoreBreakdown.resumeStructure < 70 && 'Use clear headings for Summary, Skills, Experience, Education, and role-specific projects or portfolio work.',
  ]).slice(0, 8);
}

function inferExperienceLevel(signals, overallScore) {
  const maturity = signals.yearsOfExperience * 12 + overallScore * 0.45 + signals.quantifiedMatches.length * 5;
  if (maturity >= 78) return 'Advanced';
  if (maturity >= 50) return 'Intermediate';
  return 'Beginner';
}

function buildAnalysis(resumeText, parsedData = {}) {
  const signals = extractSignals(resumeText, parsedData);
  const keywordData = roleKeywordMatches(signals, signals.roleConfig);
  const scores = analyzeSections(signals, keywordData);
  const recommendedRoles = buildRecommendations(signals);
  const strengths = buildStrengths(signals, keywordData, scores);
  const weaknesses = buildWeaknesses(signals, keywordData, scores);
  const actionableImprovements = buildActionableImprovements(signals, keywordData, scores);
  const candidateName = signals.candidateName;

  return {
    atsScore: scores.atsScore,
    overallScore: scores.overallScore,
    candidateName,
    detectedRole: signals.detectedRole,
    welcomeMessage: candidateName
      ? `Welcome ${candidateName} to AFAI Resume IQ. Let's analyze your ${signals.detectedRole} resume.`
      : `Welcome to AFAI Resume IQ. Let's analyze your ${signals.detectedRole} resume.`,
    scoreBreakdown: scores.scoreBreakdown,
    sectionAnalysis: scores.sectionAnalysis,
    recommendedRoles,
    bestCareerPath: recommendedRoles[0]?.role || signals.detectedRole,
    estimatedExperienceLevel: inferExperienceLevel(signals, scores.overallScore),
    nextTechnologiesToLearn: keywordData.missingKeywords.slice(0, 6),
    portfolioImprovements: signals.roleConfig.suggestions,
    suggestedCertifications: [],
    topHiringCompanies: [],
    strengths: strengths.length ? strengths : ['Resume has readable baseline information for the detected role.'],
    weaknesses: weaknesses.length ? weaknesses : ['No major role mismatch detected, but more evidence can strengthen the profile.'],
    improvements: actionableImprovements,
    actionableImprovements,
    missingKeywordSuggestions: keywordData.missingKeywords,
    matchedRoleKeywords: keywordData.matchedKeywords,
    extractedSkills: signals.skills,
    resumeQualitySignals: {
      wordCount: signals.wordCount,
      detectedSections: Object.entries(signals.sections).filter(([, present]) => present).map(([section]) => section),
      detectedRole: signals.detectedRole,
      roleEvidence: signals.roleEvidence,
      roleScores: signals.roleScores.slice(0, 5).map(item => ({ role: item.role, score: item.score, evidence: item.evidence.slice(0, 6) })),
      contact: signals.contact,
      quantifiedEvidenceCount: signals.quantifiedMatches.length,
    },
    mode: 'role-aware-deterministic',
  };
}

class ResumeAIService {
  async analyzeResumeForRoles(resumeText, parsedData = {}) {
    return buildAnalysis(resumeText, parsedData);
  }
}

module.exports = new ResumeAIService();
