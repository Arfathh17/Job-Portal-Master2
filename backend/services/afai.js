const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OpenAI } = require('openai');
const afaiSessionStore = require('../store/afaiSessionStore');
const {
  buildSystemPrompt: buildAfaiSystemPrompt,
  buildSummaryPrompt,
} = require('./afaiPromptService');

const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const CLEANUP_MS = 30 * 60 * 1000;
const MAX_HISTORY_MESSAGES = 18;

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'];
const INTERVIEW_TYPES = new Set([
  'hr',
  'technical',
  'behavioral',
  'system-design',
  'coding',
  'ai-ml',
  'full-stack',
  'faang',
  'mixed',
]);

const SCORE_KEYS = [
  'correctness',
  'technicalSkill',
  'technicalAccuracy',
  'communication',
  'confidence',
  'completeness',
  'clarity',
  'depth',
  'problemSolving',
  'realWorldReadiness',
  'architectureThinking',
  'debuggingAbility',
];

const STATE_TAG_REGEX = /<!--AFAI_STATE:([\s\S]*?)-->/;
const STRIP_STATE_REGEX = /\s*<!--AFAI_STATE:[\s\S]*?-->/g;

const TECH_PATTERNS = [
  { name: 'React', pattern: /\b(react|jsx|hooks?|redux|context api|virtual dom|reconciliation)\b/i },
  { name: 'Node.js', pattern: /\b(node(?:\.js)?|express|event loop|middleware|npm|streams?)\b/i },
  { name: 'MongoDB', pattern: /\b(mongodb|mongoose|aggregation|indexes?|schema|nosql)\b/i },
  { name: 'JavaScript', pattern: /\b(javascript|typescript|closures?|promises?|async|await|callbacks?)\b/i },
  { name: 'JWT/Auth', pattern: /\b(jwt|auth|authentication|authorization|bcrypt|oauth|session|token)\b/i },
  { name: 'System Design', pattern: /\b(system design|scalability|load balancer|cache|queue|microservice|distributed)\b/i },
  { name: 'AI/ML', pattern: /\b(ai|ml|machine learning|llm|openai|gemini|model|prompt|rag|vector)\b/i },
  { name: 'DevOps', pattern: /\b(docker|kubernetes|ci\/cd|pipeline|aws|azure|gcp|deployment)\b/i },
  { name: 'SQL', pattern: /\b(sql|postgres|mysql|joins?|transactions?|relational)\b/i },
];

const SIGNALS = {
  uncertainty: /\b(i think|maybe|probably|not sure|kind of|sort of|i guess|idk|don't know|do not know)\b/i,
  idk: /\b(i don't know|i do not know|no idea|not sure|idk|can't answer|cannot answer)\b/i,
  realWorld: /\b(production|monitoring|logging|metrics|rollback|deployment|latency|throughput|scale|security|rate limit|cache|index|queue|load balancer|failure|retries|timeout)\b/i,
  problemSolving: /\b(trade-?off|edge case|complexity|optimi[sz]e|bottleneck|approach|constraint|root cause|debug|test|validate|profile)\b/i,
  structure: /\b(first|second|then|next|finally|because|therefore|for example|for instance|in practice)\b/i,
  question: /(^|\s)(what|why|how|can|could|should|would|is it|are there)\b[\s\S]*\?$/i,
};

const INTRO_REPLY = 'Welcome to AFAI Intelligent Interview Simulator.\nPlease introduce yourself.';
const START_SIGNAL_REGEX = /\b(start|begin|launch)\b.*\b(interview|session)\b/i;
const NAME_STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'backend',
  'candidate',
  'developer',
  'engineer',
  'frontend',
  'full',
  'hello',
  'hi',
  'mern',
  'stack',
  'student',
  'the',
]);

const CONCEPT_RUBRICS = [
  {
    pattern: /authentication versus authorization|authentication vs authorization|topic authentication/i,
    expected: [
      { label: 'identity verification', pattern: /\b(identity|login|verify|who the user is|credentials?)\b/i },
      { label: 'permission or access checks', pattern: /\b(permission|access|role|allowed|authorize|authorization)\b/i },
    ],
    wrong: [
      { pattern: /\b(database|db|collection|table)\b/i, note: 'Authentication and authorization are not databases.' },
      { pattern: /\bsame thing\b|\bno difference\b/i, note: 'Authentication and authorization are related, but they are not the same.' },
    ],
    correction: 'Authentication verifies identity; authorization decides what an authenticated user is allowed to access.',
    followUp: 'Can you give one candidate/recruiter example that shows the difference between authentication and authorization?',
  },
  {
    pattern: /\b(jwt|json web token|token risk|token flow|refresh token)\b/i,
    expected: [
      { label: 'JSON Web Token or token', pattern: /\b(jwt|json web token|token)\b/i },
      { label: 'authentication or authorization use', pattern: /\b(auth|login|access|authorize|permission)\b/i },
      { label: 'signed claims', pattern: /\b(sign|signature|claim|payload|header)\b/i },
      { label: 'client-server transport', pattern: /\b(client|server|request|bearer|cookie|header)\b/i },
    ],
    wrong: [
      { pattern: /\b(database|db|collection|table|schema)\b/i, note: 'JWT is not a database.' },
      { pattern: /\b(hash|hashing|bcrypt)\b/i, note: 'JWT is not a password hashing mechanism.' },
      { pattern: /\b(frontend framework|ui library)\b/i, note: 'JWT is not a frontend framework.' },
    ],
    correction: 'JWT stands for JSON Web Token. It is a signed token commonly used to carry authentication or authorization claims between client and server.',
    followUp: 'Can you explain where JWT is commonly used in a web application login flow?',
  },
  {
    pattern: /\b(express middleware|middleware)\b/i,
    expected: [
      { label: 'request-response pipeline', pattern: /\b(request|req|response|res|pipeline|route)\b/i },
      { label: 'next function', pattern: /\bnext\s*\(|next middleware|next function|next\b/i },
      { label: 'cross-cutting concerns', pattern: /\b(auth|logging|validation|error|parse|cors)\b/i },
    ],
    wrong: [
      { pattern: /\b(database|db|collection|table)\b/i, note: 'Express middleware is not a database layer.' },
      { pattern: /\breact component|ui\b/i, note: 'Express middleware runs on the backend request pipeline, not inside the React UI.' },
    ],
    correction: 'Express middleware is a function that runs during the request-response cycle and can inspect, modify, stop, or pass control with next().',
    followUp: 'Can you describe how an auth middleware would validate a JWT before a protected route runs?',
  },
  {
    pattern: /\b(node\.?js event loop|event loop|async i\/o|microtasks?|macrotasks?)\b/i,
    expected: [
      { label: 'non-blocking async execution', pattern: /\b(non-?blocking|async|asynchronous|i\/o|callback|promise)\b/i },
      { label: 'single-threaded JavaScript coordination', pattern: /\b(single.?thread|call stack|queue|event queue|task queue|microtask)\b/i },
      { label: 'performance impact', pattern: /\b(block|cpu|latency|throughput|performance|api)\b/i },
    ],
    wrong: [
      { pattern: /\b(database|db|collection|table)\b/i, note: 'The event loop is not a database concept.' },
      { pattern: /\bcreates one thread per request\b/i, note: 'Node.js does not create one JavaScript thread per request by default.' },
    ],
    correction: 'The Node.js event loop coordinates non-blocking asynchronous work by moving callbacks and promise tasks back onto the JavaScript thread when work is ready.',
    followUp: 'What kind of code can still block the Node.js event loop even when the API uses async/await?',
  },
  {
    pattern: /\b(mongodb indexes?|indexes?|query optimization|applicant filtering)\b/i,
    expected: [
      { label: 'indexed query fields', pattern: /\b(index|compound|field|filter|sort|search)\b/i },
      { label: 'query plan or explain', pattern: /\b(explain|query plan|scan|covered|performance)\b/i },
      { label: 'read/write trade-off', pattern: /\b(write|storage|trade.?off|cardinality|selectivity)\b/i },
    ],
    wrong: [
      { pattern: /\b(css|html|react component)\b/i, note: 'MongoDB indexes are database structures, not frontend UI code.' },
      { pattern: /\bindex every field\b/i, note: 'Indexing every field usually hurts writes and storage without improving the right queries.' },
    ],
    correction: 'MongoDB indexes speed up specific queries by organizing selected fields, but they must match real filters/sorts and have write/storage trade-offs.',
    followUp: 'Which fields would you index for recruiter applicant filtering, and why?',
  },
  {
    pattern: /\b(react rendering|reconciliation|keys?|virtual dom)\b/i,
    expected: [
      { label: 'diffing or reconciliation', pattern: /\b(diff|reconcile|reconciliation|compare|virtual dom)\b/i },
      { label: 'stable identity with keys', pattern: /\b(key|identity|stable|list|rerender)\b/i },
      { label: 'DOM update efficiency', pattern: /\b(dom|update|render|performance)\b/i },
    ],
    wrong: [
      { pattern: /\b(database|db|server only)\b/i, note: 'React reconciliation is a frontend rendering concept, not a database process.' },
      { pattern: /\bkeys are only for css\b/i, note: 'React keys are used for element identity during list reconciliation, not styling.' },
    ],
    correction: 'React reconciliation compares the new UI tree with the previous one and uses stable keys to preserve list item identity efficiently.',
    followUp: 'What bug can happen if you use array indexes as keys in a list that can be reordered?',
  },
];

const QUESTION_BANK = {
  hr: {
    beginner: [
      { topic: 'Motivation', text: 'Walk me through your background and what kind of role you are targeting right now.' },
      { topic: 'Role Fit', text: 'Why does this role make sense for your next step?' },
    ],
    intermediate: [
      { topic: 'Ownership', text: 'Tell me about a time you owned a task from ambiguity to delivery. What decisions did you make yourself?' },
      { topic: 'Collaboration', text: 'Describe a time you disagreed with a teammate. How did you handle it?' },
    ],
    advanced: [
      { topic: 'Judgment', text: 'Tell me about a high-pressure situation where you had incomplete information. How did you decide what to do?' },
      { topic: 'Impact', text: 'What is the strongest evidence that you can create business impact, not just complete assigned tasks?' },
    ],
    expert: [
      { topic: 'Leadership', text: 'If you joined a team with low trust and slipping delivery dates, how would you diagnose and improve it in your first month?' },
    ],
  },
  behavioral: {
    beginner: [
      { topic: 'Learning', text: 'Tell me about a mistake you made while learning a technology. What changed after that?' },
    ],
    intermediate: [
      { topic: 'Conflict Resolution', text: 'Give me a concrete example of a technical disagreement. What was your position, and what was the outcome?' },
      { topic: 'Deadlines', text: 'Describe a deadline you almost missed. What did you do to recover?' },
    ],
    advanced: [
      { topic: 'Failure Analysis', text: 'Tell me about a production issue, broken feature, or failed project. What did you personally learn from it?' },
      { topic: 'Leadership', text: 'Tell me about a time you influenced people without formal authority.' },
    ],
    expert: [
      { topic: 'Decision Quality', text: 'Describe a decision you made that looked right initially but later proved wrong. How did you respond?' },
    ],
  },
  coding: {
    beginner: [
      { topic: 'Arrays', text: 'Think aloud: given an array of numbers, how would you return the two numbers that add up to a target?' },
      { topic: 'Strings', text: 'How would you check if two strings are anagrams? Talk through edge cases before code.' },
    ],
    intermediate: [
      { topic: 'Hash Maps', text: 'Design an algorithm to find the first non-repeating character in a string. What is the time and space complexity?' },
      { topic: 'Sliding Window', text: 'Find the length of the longest substring without repeating characters. Walk me through the approach first.' },
    ],
    advanced: [
      { topic: 'Graphs', text: 'You have courses and prerequisites. How would you detect if all courses can be completed?' },
      { topic: 'Dynamic Programming', text: 'How would you solve coin change for the minimum number of coins? Explain the recurrence and edge cases.' },
    ],
    expert: [
      { topic: 'Optimization', text: 'Design an autocomplete suggestion engine. Start with the data structure, then discuss latency and memory trade-offs.' },
    ],
  },
  'system-design': {
    beginner: [
      { topic: 'API Design', text: 'Design a simple job application tracking API. What entities and endpoints would you start with?' },
    ],
    intermediate: [
      { topic: 'Scalability', text: 'Design a notification system for job application updates. How would you handle retries and failures?' },
      { topic: 'Data Modeling', text: 'How would you model candidates, recruiters, jobs, and applications for fast search and reporting?' },
    ],
    advanced: [
      { topic: 'Architecture', text: 'Design this AI job portal for 1 million candidates and 50,000 recruiters. Walk me through services, storage, caching, and queues.' },
      { topic: 'Reliability', text: 'How would you make resume analysis asynchronous, observable, and resilient to AI provider failures?' },
    ],
    expert: [
      { topic: 'Distributed Systems', text: 'Design a real-time interview evaluation platform that supports live sessions, audit logs, and provider failover.' },
    ],
  },
  technical: {
    beginner: [
      { topic: 'Web Fundamentals', text: 'Explain what happens from the moment a user clicks Apply until the backend stores the application.' },
    ],
    intermediate: [
      { topic: 'API Architecture', text: 'How would you structure authentication and role-based access for candidates and recruiters?' },
      { topic: 'Debugging', text: 'A candidate can log in but applying to a job returns 401. Walk me through your debugging process.' },
    ],
    advanced: [
      { topic: 'Production Readiness', text: 'What would you add before launching this job portal to real users: security, monitoring, performance, and failure handling?' },
      { topic: 'Security', text: 'How would you protect resume uploads, JWTs, and recruiter-only endpoints in production?' },
    ],
    expert: [
      { topic: 'Architecture Review', text: 'If the AI interview simulator becomes slow and expensive at scale, how would you redesign it?' },
    ],
  },
  'ai-ml': {
    beginner: [
      { topic: 'AI Fundamentals', text: 'Explain the difference between a prompt-based AI feature and a trained machine learning model.' },
    ],
    intermediate: [
      { topic: 'Prompt Engineering', text: 'How would you design prompts so the interview simulator asks one adaptive question at a time and remembers context?' },
      { topic: 'Evaluation', text: 'How would you evaluate whether AI-generated interview feedback is accurate and fair?' },
    ],
    advanced: [
      { topic: 'AI Architecture', text: 'Design a resume analyzer that extracts skills, scores ATS fit, and avoids hallucinated claims.' },
      { topic: 'LLM Reliability', text: 'How would you handle malformed AI responses, provider downtime, and prompt injection in candidate input?' },
    ],
    expert: [
      { topic: 'AI Systems', text: 'Design an interview engine that combines rubric scoring, conversation memory, and adaptive question generation. Where should deterministic code end and LLM reasoning begin?' },
    ],
  },
  'full-stack': {
    beginner: [
      { topic: 'Full Stack Flow', text: 'Trace a resume upload from React UI to backend storage and AI analysis.' },
    ],
    intermediate: [
      { topic: 'State and API', text: 'How would you manage loading, error, and optimistic UI states when a candidate applies for a job?' },
      { topic: 'Realtime', text: 'How would you use Socket.io in this platform without making the app hard to debug?' },
    ],
    advanced: [
      { topic: 'End-to-End Design', text: 'Design the candidate dashboard end to end: frontend state, API contracts, database queries, and background jobs.' },
      { topic: 'Performance', text: 'The recruiter dashboard is slow with 100,000 applicants. How would you optimize frontend rendering and backend queries?' },
    ],
    expert: [
      { topic: 'SaaS Architecture', text: 'How would you evolve this project into a multi-tenant SaaS platform with isolation, billing, analytics, and auditability?' },
    ],
  },
  faang: {
    beginner: [
      { topic: 'Communication', text: 'Before solving a problem, what clarifying questions would you ask for a job search and recommendation feature?' },
    ],
    intermediate: [
      { topic: 'DSA', text: 'Given streams of job applications, how would you maintain the top K candidates per job efficiently?' },
      { topic: 'Behavioral', text: 'Tell me about a time you raised the quality bar on a project. What changed because of you?' },
    ],
    advanced: [
      { topic: 'System Design', text: 'Design a job recommendation system. Cover data ingestion, ranking, feedback loops, and cold start.' },
      { topic: 'Trade-offs', text: 'If accuracy, latency, and cost conflict in AI candidate evaluation, how would you make the product decision?' },
    ],
    expert: [
      { topic: 'Ambiguity', text: 'Design a hiring platform that must be fair, explainable, scalable, and resistant to gaming. Start with requirements and trade-offs.' },
    ],
  },
  mixed: {
    beginner: [
      { topic: 'Introduction', text: 'Tell me about yourself, your strongest technologies, and one project you are ready to defend technically.' },
    ],
    intermediate: [
      { topic: 'Project Depth', text: 'Pick one project from your experience. Explain the architecture, your role, and the hardest technical decision.' },
    ],
    advanced: [
      { topic: 'Production Thinking', text: 'Take your strongest project and explain what would break first if usage grew 100x.' },
    ],
    expert: [
      { topic: 'Engineering Judgment', text: 'What technical decision have you made that involved a serious trade-off? Defend it.' },
    ],
  },
};

const TECH_BANK = {
  React: {
    beginner: [
      { topic: 'React Fundamentals', text: 'What problem does React solve, and how do components help structure a UI?' },
    ],
    intermediate: [
      { topic: 'React Rendering', text: 'Explain reconciliation and why keys matter when rendering lists.' },
      { topic: 'React State', text: 'When would you use local state, Context, Redux, or server state in a real React app?' },
    ],
    advanced: [
      { topic: 'React Performance', text: 'A React page with thousands of applicants feels slow. How would you find and fix the rendering bottleneck?' },
      { topic: 'React Architecture', text: 'How would you structure reusable components and API state for a candidate dashboard?' },
    ],
    expert: [
      { topic: 'Frontend Architecture', text: 'Design a frontend architecture for a multi-role job portal with candidates, recruiters, admins, and real-time interview sessions.' },
    ],
  },
  'Node.js': {
    beginner: [
      { topic: 'Express Middleware', text: 'What is middleware in Express, and how does a request flow through it?' },
    ],
    intermediate: [
      { topic: 'Node Event Loop', text: 'Explain the Node.js event loop and how async I/O affects API performance.' },
      { topic: 'Node Error Handling', text: 'How would you design centralized error handling in an Express API?' },
    ],
    advanced: [
      { topic: 'Node Scalability', text: 'Your Node API slows down during resume uploads and AI calls. How would you redesign the flow?' },
      { topic: 'Node Streams', text: 'When would streams help in a backend like this, and what pitfalls would you watch for?' },
    ],
    expert: [
      { topic: 'Node Production', text: 'How would you scale a Node.js backend across processes and machines while keeping sessions, queues, and logs coherent?' },
    ],
  },
  MongoDB: {
    beginner: [
      { topic: 'MongoDB Modeling', text: 'How would you model jobs and applications in MongoDB?' },
    ],
    intermediate: [
      { topic: 'MongoDB Indexes', text: 'Which indexes would you create for job search and recruiter applicant filtering?' },
      { topic: 'Mongoose', text: 'What role does Mongoose play, and where can schemas help or hurt flexibility?' },
    ],
    advanced: [
      { topic: 'MongoDB Performance', text: 'A recruiter filter query over applicants is timing out. Walk me through query optimization.' },
      { topic: 'MongoDB Consistency', text: 'How would you handle application status updates so candidate and recruiter views stay consistent?' },
    ],
    expert: [
      { topic: 'Data Architecture', text: 'How would you design MongoDB collections, indexes, archiving, and analytics for millions of job applications?' },
    ],
  },
  'JWT/Auth': {
    beginner: [
      { topic: 'Authentication', text: 'Explain authentication versus authorization using candidates and recruiters as examples.' },
    ],
    intermediate: [
      { topic: 'JWT Flow', text: 'Walk me through a secure JWT login flow with refresh tokens and role checks.' },
      { topic: 'Password Security', text: 'How should bcrypt be used, and what mistakes would make password storage unsafe?' },
    ],
    advanced: [
      { topic: 'Auth Security', text: 'A recruiter-only endpoint is being accessed by candidates. How would you debug and fix it?' },
      { topic: 'Token Risk', text: 'What are the security trade-offs of storing JWTs in localStorage versus httpOnly cookies?' },
    ],
    expert: [
      { topic: 'Access Control', text: 'Design authorization for a multi-tenant hiring platform with recruiters, agencies, candidates, and admins.' },
    ],
  },
  'System Design': QUESTION_BANK['system-design'],
  'AI/ML': QUESTION_BANK['ai-ml'],
  JavaScript: {
    beginner: [
      { topic: 'JavaScript Basics', text: 'Explain the difference between var, let, and const.' },
    ],
    intermediate: [
      { topic: 'JavaScript Async', text: 'Explain promises, async/await, and how errors propagate through async code.' },
      { topic: 'Closures', text: 'What is a closure, and where would you use one in frontend or backend code?' },
    ],
    advanced: [
      { topic: 'JavaScript Runtime', text: 'Explain microtasks versus macrotasks and how they can affect UI rendering or server behavior.' },
    ],
    expert: [
      { topic: 'JavaScript Architecture', text: 'How would you prevent shared JavaScript utilities from becoming a source of hidden coupling across a large app?' },
    ],
  },
};

function isUsableKey(key) {
  return typeof key === 'string'
    && key.trim().length > 20
    && !/your_|replace|placeholder|example/i.test(key);
}

function initGemini() {
  if (!isUsableKey(process.env.GEMINI_API_KEY)) return null;

  try {
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (error) {
    console.warn('AFAI Gemini init failed:', error.message);
    return null;
  }
}

function initOpenAI() {
  if (!isUsableKey(process.env.OPENAI_API_KEY)) return null;

  try {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (error) {
    console.warn('AFAI OpenAI init failed:', error.message);
    return null;
  }
}

const geminiClient = initGemini();
const openaiClient = initOpenAI();

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values) {
  const valid = values.filter(value => Number.isFinite(value));
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}

function scoreToTen(score) {
  return Number((clamp(score) / 10).toFixed(1));
}

function normalizeDifficulty(value) {
  const normalized = String(value || '').toLowerCase().trim();
  if (DIFFICULTIES.includes(normalized)) return normalized;
  if (normalized === 'easy') return 'beginner';
  if (normalized === 'medium') return 'intermediate';
  if (normalized === 'hard') return 'advanced';
  return 'intermediate';
}

function normalizeInterviewType(value) {
  const normalized = String(value || '').toLowerCase().trim().replace(/_/g, '-');
  if (INTERVIEW_TYPES.has(normalized)) return normalized;
  if (/full.?stack/i.test(normalized)) return 'full-stack';
  if (/system/i.test(normalized)) return 'system-design';
  if (/machine|ml|ai/i.test(normalized)) return 'ai-ml';
  if (/faang|mock/i.test(normalized)) return 'faang';
  return 'mixed';
}

function normalizeOptions(input, experienceArg) {
  if (typeof input === 'object' && input !== null) {
    return {
      role: input.role || input.targetRole || 'Software Engineer',
      experience: input.experience || input.experienceLevel || 'Not specified',
      technologies: normalizeTechnologies(input.technologies || input.skills || []),
      interviewType: normalizeInterviewType(input.interviewType || input.type || input.mode),
      difficulty: normalizeDifficulty(input.difficulty),
      company: input.company || input.companyMode || 'generic',
    };
  }

  return {
    role: input || 'Software Engineer',
    experience: experienceArg || 'Not specified',
    technologies: [],
    interviewType: 'mixed',
    difficulty: 'intermediate',
    company: 'generic',
  };
}

function normalizeTechnologies(value) {
  const items = Array.isArray(value)
    ? value
    : String(value || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

  const normalized = new Set();
  for (const item of items) {
    const text = String(item).trim();
    if (!text) continue;
    const detected = detectTechnologies(text);
    if (detected.length === 0) normalized.add(text);
    detected.forEach(tech => normalized.add(tech));
  }
  return [...normalized];
}

function createSessionId() {
  if (typeof crypto.randomUUID === 'function') return `afai_${crypto.randomUUID()}`;
  return `afai_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function detectTechnologies(text) {
  const found = [];
  for (const tech of TECH_PATTERNS) {
    if (tech.pattern.test(text)) found.push(tech.name);
  }
  return [...new Set(found)];
}

function bumpMap(map, key, amount = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + amount);
}

function topKeys(map, limit = 5) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

function serializeMap(map) {
  return Object.fromEntries([...map.entries()].sort((a, b) => b[1] - a[1]));
}

function getNextDifficulty(current, direction) {
  const index = DIFFICULTIES.indexOf(current);
  if (direction === 'harder') return DIFFICULTIES[Math.min(DIFFICULTIES.length - 1, index + 1)];
  if (direction === 'easier') return DIFFICULTIES[Math.max(0, index - 1)];
  return current;
}

function difficultyDirection(score) {
  if (score >= 82) return 'harder';
  if (score < 45) return 'easier';
  return 'same';
}

function classify(score, answer) {
  if (SIGNALS.idk.test(answer)) return 'IDK';
  const words = wordCount(answer);
  if (words < 6) return 'VAGUE';
  if (score >= 80) return 'CORRECT';
  if (score >= 55) return 'PARTIAL';
  if (score >= 35) return 'VAGUE';
  return 'INCORRECT';
}

function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function isStartSignal(text) {
  return START_SIGNAL_REGEX.test(String(text || ''));
}

function titleCaseName(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function extractCandidateName(text) {
  const source = String(text || '').trim();
  const patterns = [
    /\bmy name is\s+([a-z][a-z.'-]{1,30})(?:\s+([a-z][a-z.'-]{1,30}))?/i,
    /\bthis is\s+([a-z][a-z.'-]{1,30})(?:\s+([a-z][a-z.'-]{1,30}))?/i,
    /\bi am\s+([a-z][a-z.'-]{1,30})(?:\s+([a-z][a-z.'-]{1,30}))?/i,
    /\bi'm\s+([a-z][a-z.'-]{1,30})(?:\s+([a-z][a-z.'-]{1,30}))?/i,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(source);
    if (!match) continue;
    const parts = [match[1], match[2]]
      .filter(Boolean)
      .map(part => part.replace(/[^a-z.'-]/gi, '').toLowerCase())
      .filter(part => part && !NAME_STOPWORDS.has(part));
    if (parts.length > 0) return titleCaseName(parts.slice(0, 2).join(' '));
  }

  return '';
}

function getQuestionContext(session) {
  return `${session.lastQuestion?.topic || ''} ${session.lastQuestion?.text || ''}`;
}

function evaluateConceptAnswer(session, answer) {
  const context = getQuestionContext(session);
  const text = String(answer || '');
  const rubric = CONCEPT_RUBRICS.find(item => item.pattern.test(context))
    || CONCEPT_RUBRICS.find(item => item.pattern.test(text) && item.wrong.some(wrong => wrong.pattern.test(text)));
  if (!rubric) return null;

  const matched = rubric.expected.filter(item => item.pattern.test(text));
  const missing = rubric.expected
    .filter(item => !item.pattern.test(text))
    .map(item => item.label);
  const wrong = rubric.wrong.find(item => item.pattern.test(text));
  const coverage = matched.length / Math.max(1, rubric.expected.length);

  if (wrong) {
    return {
      classification: 'INCORRECT',
      scoreCap: 32,
      technicalAccuracyCap: 28,
      completenessCap: 30,
      correctness: 18,
      correction: `${wrong.note} ${rubric.correction}`,
      missingConcepts: missing.length ? missing : rubric.expected.map(item => item.label),
      followUpQuestion: rubric.followUp,
    };
  }

  if (coverage >= 0.7 && wordCount(text) >= 12) {
    return {
      classification: 'CORRECT',
      scoreFloor: 78,
      correctness: 86,
      completenessFloor: 72,
      correction: '',
      missingConcepts: missing,
      followUpQuestion: '',
    };
  }

  if (coverage >= 0.35) {
    return {
      classification: 'PARTIAL',
      scoreCap: 72,
      technicalAccuracyCap: 68,
      completenessCap: 62,
      correctness: 58,
      correction: `You covered the basic direction, but missed ${missing.slice(0, 2).join(' and ') || 'one important detail'}. ${rubric.correction}`,
      missingConcepts: missing,
      followUpQuestion: rubric.followUp,
    };
  }

  return {
    classification: wordCount(text) < 8 ? 'VAGUE' : 'PARTIAL',
    scoreCap: 52,
    technicalAccuracyCap: 48,
    completenessCap: 42,
    correctness: 42,
    correction: `The answer does not yet cover the core concept. ${rubric.correction}`,
    missingConcepts: missing,
    followUpQuestion: rubric.followUp,
  };
}

function analyzeAnswer(session, answer) {
  const text = String(answer || '').trim();
  const words = wordCount(text);
  const detectedTech = detectTechnologies(text);
  const uncertainty = SIGNALS.uncertainty.test(text) ? 1 : 0;
  const realWorld = SIGNALS.realWorld.test(text) ? 1 : 0;
  const problemSolving = SIGNALS.problemSolving.test(text) ? 1 : 0;
  const structure = SIGNALS.structure.test(text) ? 1 : 0;
  const isCandidateQuestion = SIGNALS.question.test(text) && words <= 28;

  if (isCandidateQuestion && session.questionCount > 0) {
    return {
      classification: 'QUESTION',
      nextAction: 'clarify',
      topic: session.lastQuestion?.topic || 'Clarification',
      score: 0,
      scores: emptyScores(),
      strengths: [],
      weakAreas: [],
      technologies: detectedTech,
      confidenceSignal: 'clarifying',
      notes: ['Candidate asked for clarification.'],
    };
  }

  let base = 20;
  base += Math.min(words, 90) * 0.7;
  base += structure * 12;
  base += problemSolving * 14;
  base += realWorld * 14;
  base += Math.min(detectedTech.length, 4) * 4;
  base -= uncertainty * 12;

  if (words > 180) base -= 8;
  if (SIGNALS.idk.test(text)) base = Math.min(base, 18);

  const conceptEvaluation = evaluateConceptAnswer(session, text);

  let clarity = clamp(35 + Math.min(words, 70) * 0.5 + structure * 18 - (words > 180 ? 12 : 0) - uncertainty * 8);
  let depth = clamp(25 + Math.min(words, 100) * 0.55 + problemSolving * 18 + realWorld * 14 - uncertainty * 8);
  let technicalAccuracy = clamp(base + problemSolving * 5 + realWorld * 4);
  let completeness = clamp(25 + Math.min(words, 85) * 0.55 + structure * 12 + realWorld * 10 + problemSolving * 8 - uncertainty * 8);
  let correctness = technicalAccuracy;
  const communication = clamp((clarity * 0.7) + (structure ? 18 : 6) - uncertainty * 6);
  const confidence = clamp(55 + Math.min(words, 80) * 0.25 - uncertainty * 24 + structure * 6);
  const architectureThinking = clamp(25 + realWorld * 25 + /architecture|design|service|database|cache|queue|scal/i.test(text) * 20 + Math.min(words, 80) * 0.25);
  const debuggingAbility = clamp(25 + /debug|log|trace|metric|reproduce|root cause|test|monitor/i.test(text) * 35 + problemSolving * 10);
  const realWorldReadiness = clamp(30 + realWorld * 30 + problemSolving * 10 + /security|deploy|monitor|rollback|failure/i.test(text) * 15);
  const problemSolvingScore = clamp(30 + problemSolving * 30 + structure * 12 + /edge case|constraint|trade/i.test(text) * 14);

  if (conceptEvaluation) {
    if (Number.isFinite(conceptEvaluation.scoreFloor)) {
      technicalAccuracy = clamp(Math.max(technicalAccuracy, conceptEvaluation.scoreFloor));
      correctness = clamp(Math.max(correctness, conceptEvaluation.correctness || conceptEvaluation.scoreFloor));
      completeness = clamp(Math.max(completeness, conceptEvaluation.completenessFloor || conceptEvaluation.scoreFloor - 6));
      depth = clamp(Math.max(depth, 65));
    }

    if (Number.isFinite(conceptEvaluation.scoreCap)) {
      technicalAccuracy = clamp(Math.min(technicalAccuracy, conceptEvaluation.technicalAccuracyCap || conceptEvaluation.scoreCap));
      correctness = clamp(Math.min(correctness, conceptEvaluation.correctness || conceptEvaluation.scoreCap));
      completeness = clamp(Math.min(completeness, conceptEvaluation.completenessCap || conceptEvaluation.scoreCap));
      depth = clamp(Math.min(depth, conceptEvaluation.scoreCap + 8));
      clarity = clamp(Math.min(clarity, Math.max(42, conceptEvaluation.scoreCap + 12)));
    }
  }

  const technicalSkill = clamp((technicalAccuracy + depth + correctness) / 3);
  const overall = average([
    correctness,
    technicalSkill,
    technicalAccuracy,
    communication,
    confidence,
    completeness,
    clarity,
    depth,
    problemSolvingScore,
    realWorldReadiness,
    architectureThinking,
    debuggingAbility,
  ]);

  const weakAreas = [];
  const strengths = [];
  const answeredTopic = session.lastQuestion?.topic || 'General';

  if (technicalAccuracy >= 75) strengths.push(answeredTopic);
  if (communication >= 75) strengths.push('Communication clarity');
  if (realWorldReadiness >= 70) strengths.push('Production awareness');
  if (problemSolvingScore >= 70) strengths.push('Structured problem solving');

  if (technicalAccuracy < 55) weakAreas.push(answeredTopic);
  if (depth < 55) weakAreas.push('Technical depth');
  if (communication < 55) weakAreas.push('Communication clarity');
  if (realWorldReadiness < 55) weakAreas.push('Real-world readiness');

  let classification = conceptEvaluation?.classification || classify(overall, text);
  if (SIGNALS.idk.test(text)) classification = 'IDK';
  const direction = difficultyDirection(overall);

  if (conceptEvaluation?.classification === 'CORRECT') strengths.push(answeredTopic);
  if (conceptEvaluation?.classification && conceptEvaluation.classification !== 'CORRECT') weakAreas.push(answeredTopic);
  if (conceptEvaluation?.missingConcepts?.length) {
    conceptEvaluation.missingConcepts.slice(0, 2).forEach(item => weakAreas.push(item));
  }

  const nextAction = classification === 'CORRECT' && direction === 'harder'
    ? 'ask_harder_follow_up'
    : classification === 'INCORRECT' || classification === 'IDK' || classification === 'VAGUE'
      ? 'simplify_or_clarify'
      : 'ask_deeper_follow_up';

  return {
    classification,
    nextAction,
    topic: answeredTopic,
    score: overall,
    scores: {
      correctness,
      technicalSkill,
      technicalAccuracy,
      communication,
      confidence,
      completeness,
      clarity,
      depth,
      problemSolving: problemSolvingScore,
      realWorldReadiness,
      architectureThinking,
      debuggingAbility,
    },
    strengths: [...new Set(strengths)],
    weakAreas: [...new Set(weakAreas)],
    technologies: detectedTech,
    confidenceSignal: confidence >= 72 ? 'confident' : uncertainty ? 'uncertain' : 'steady',
    correction: conceptEvaluation?.correction || '',
    missingConcepts: conceptEvaluation?.missingConcepts || [],
    followUpQuestion: conceptEvaluation?.followUpQuestion || '',
    answerQuality: {
      correctness,
      technicalAccuracy,
      communication,
      confidence,
      completeness,
    },
    notes: [
      ...buildEvaluationNotes(classification, words, realWorld, problemSolving, uncertainty),
      ...(conceptEvaluation?.correction ? ['Used concept-level validation.'] : []),
    ],
  };
}

function buildEvaluationNotes(classification, words, realWorld, problemSolving, uncertainty) {
  const notes = [];
  if (classification === 'IDK') notes.push('Candidate explicitly did not know.');
  if (words < 12) notes.push('Answer was too brief for a real interview.');
  if (realWorld) notes.push('Included production-level context.');
  if (problemSolving) notes.push('Showed problem-solving or trade-off awareness.');
  if (uncertainty) notes.push('Showed uncertainty in phrasing.');
  return notes;
}

function emptyScores() {
  return SCORE_KEYS.reduce((scores, key) => {
    scores[key] = 0;
    return scores;
  }, {});
}

function normalizeEvaluation(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const fallbackScores = fallback?.scores || emptyScores();
  const scores = {};

  for (const key of SCORE_KEYS) {
    scores[key] = clamp(source.scores?.[key] ?? source[key] ?? fallbackScores[key] ?? 0);
  }

  return {
    classification: source.classification || fallback?.classification || 'PARTIAL',
    nextAction: source.nextAction || fallback?.nextAction || 'ask_deeper_follow_up',
    topic: source.topic || fallback?.topic || 'General',
    difficulty: normalizeDifficulty(source.difficulty || fallback?.difficulty),
    questionNumber: Number(source.questionNumber || fallback?.questionNumber || 0),
    score: clamp(source.score ?? average(Object.values(scores))),
    scores,
    strengths: Array.isArray(source.strengths) ? source.strengths : fallback?.strengths || [],
    weakAreas: Array.isArray(source.weakAreas) ? source.weakAreas : fallback?.weakAreas || [],
    technologies: normalizeTechnologies(source.technologies || fallback?.technologies || []),
    confidenceSignal: source.confidenceSignal || fallback?.confidenceSignal || 'steady',
    notes: Array.isArray(source.notes) ? source.notes : fallback?.notes || [],
    correction: source.correction || fallback?.correction || '',
    missingConcepts: Array.isArray(source.missingConcepts) ? source.missingConcepts : fallback?.missingConcepts || [],
    followUpQuestion: source.followUpQuestion || fallback?.followUpQuestion || '',
    answerQuality: source.answerQuality || fallback?.answerQuality || {
      correctness: scores.correctness,
      technicalAccuracy: scores.technicalAccuracy,
      communication: scores.communication,
      confidence: scores.confidence,
      completeness: scores.completeness,
    },
  };
}

function parseStateTag(text) {
  const match = STATE_TAG_REGEX.exec(text || '');
  if (!match) return null;

  try {
    return JSON.parse(match[1]);
  } catch (error) {
    return null;
  }
}

function stripStateTag(text) {
  return String(text || '').replace(STRIP_STATE_REGEX, '').trim();
}

function buildTurnPrompt(session, message) {
  if (session.questionCount === 0) {
    return `
Start the interview with the mandatory introduction step only.

Say exactly:
"Welcome to AFAI Intelligent Interview Simulator.
Please introduce yourself."

Do not ask a technical question until the candidate introduces themselves.
Candidate message: ${message || '(session started)'}
`.trim();
  }

  return `
Candidate latest response:
${message}

Current interview memory:
${JSON.stringify(session.memorySnapshot(), null, 2)}

Analyze the answer deeply before asking the next question.
- Decide whether it is CORRECT, PARTIAL, VAGUE, INCORRECT, IDK, or QUESTION.
- If wrong, say that naturally, briefly correct the concept, and ask a simpler contextual follow-up.
- If partially correct, say what is missing and ask a focused follow-up.
- If correct, acknowledge it and ask a deeper or harder follow-up.
- Maintain continuity with the candidate name, previous answers, strengths, weak areas, and current topic.
- Ask exactly one adaptive next question.
`.trim();
}

function pickFromPool(pool, session) {
  const used = new Set(session.memory.previousQuestions.map(item => item.text));
  const firstUnused = pool.find(question => !used.has(question.text));
  return firstUnused || pool[session.questionCount % pool.length];
}

function selectQuestion(session, evaluation = null) {
  const direction = evaluation ? difficultyDirection(evaluation.score) : 'same';
  const difficulty = getNextDifficulty(session.currentDifficulty, direction);
  const latestTech = evaluation?.technologies?.[0];
  const rememberedTech = [...session.memory.technologies][session.questionCount % Math.max(1, session.memory.technologies.size)];
  const tech = latestTech || rememberedTech;

  if (tech && TECH_BANK[tech]) {
    return {
      ...pickFromPool(TECH_BANK[tech][difficulty] || TECH_BANK[tech].intermediate, session),
      difficulty,
      source: tech,
    };
  }

  const type = session.interviewType === 'faang' ? 'faang' : session.interviewType;
  const bank = QUESTION_BANK[type] || QUESTION_BANK.mixed;
  return {
    ...pickFromPool(bank[difficulty] || bank.intermediate || bank.beginner, session),
    difficulty,
    source: type,
  };
}

function buildOpeningQuestion(session) {
  const type = session.interviewType === 'mixed' ? inferInterviewTypeFromRole(session.role) : session.interviewType;
  const bank = QUESTION_BANK[type] || QUESTION_BANK.mixed;
  const pool = bank[session.currentDifficulty] || bank.intermediate || bank.beginner;
  return {
    ...pickFromPool(pool, session),
    difficulty: session.currentDifficulty,
    source: type,
  };
}

function inferInterviewTypeFromRole(role) {
  if (/full.?stack/i.test(role)) return 'full-stack';
  if (/ai|ml|data|machine/i.test(role)) return 'ai-ml';
  if (/system|architect/i.test(role)) return 'system-design';
  if (/hr|recruit/i.test(role)) return 'hr';
  return 'technical';
}

function buildMockReply(session, evaluation, nextQuestion) {
  if (evaluation.classification === 'QUESTION') {
    const last = session.lastQuestion?.text || nextQuestion.text;
    return `That's a reasonable clarification. I am looking for your reasoning, assumptions, trade-offs, and a concrete example where possible. I will not solve it for you yet.\n\nLet's stay with this: ${last}`;
  }

  const askedQuestion = evaluation.followUpQuestion || nextQuestion.text;
  const missing = evaluation.missingConcepts?.length
    ? ` Missing pieces: ${evaluation.missingConcepts.slice(0, 3).join(', ')}.`
    : '';
  const correction = evaluation.correction ? ` ${evaluation.correction}` : '';
  const transitions = {
    CORRECT: [
      'Good answer. You covered the core idea clearly, so I am going to push a little deeper.',
      'Correct. That is a solid explanation; now let us test how you apply it in practice.',
    ],
    PARTIAL: [
      `You are partially correct.${missing}${correction}`,
      `Good attempt, but you missed an important point.${missing}${correction}`,
    ],
    VAGUE: [
      `I am going to pause you there because that is too high-level for a real interview answer.${missing}${correction}`,
      `That answer needs more specifics. Name the components, failure modes, or concrete steps you would take.${missing}${correction}`,
    ],
    INCORRECT: [
      `That's not quite correct.${correction || ' There is an issue with that explanation.'}`,
      `Not exactly.${correction || ' The concept is being mixed up here.'}`,
    ],
    IDK: [
      'That is okay. In an interview, it is better to be honest than to improvise. I will simplify the next question.',
      `Fair enough. Let us use this as a learning signal.${correction}`,
    ],
  };

  const options = transitions[evaluation.classification] || transitions.PARTIAL;
  const transition = options[session.questionCount % options.length];
  return `${transition.trim()}\n\n${askedQuestion}`;
}

function buildFallbackSummary(summary) {
  const score = summary.averageScore;
  const level = score >= 82 ? 'strong hire' : score >= 70 ? 'hire leaning' : score >= 55 ? 'borderline' : 'not ready yet';
  const strengths = summary.strengths.length
    ? summary.strengths.map(item => `- ${item}`).join('\n')
    : '- Consistent participation\n- Willingness to engage with unfamiliar topics';
  const weaknesses = summary.weaknesses.length
    ? summary.weaknesses.map(item => `- ${item}`).join('\n')
    : '- Add more concrete examples\n- Explain trade-offs more explicitly';

  return `## Overall Performance
${score}/100 (${scoreToTen(score)}/10) - ${summary.performanceLevel}

## Strengths
${strengths}

## Weaknesses
${weaknesses}

## Improvement Roadmap
- Practice answering with situation, decision, trade-off, and result.
- Review the weakest technical topics and explain them out loud.
- Build one production-style project path: auth, data model, API, UI states, monitoring.
- Do weekly mock interviews with follow-up pressure.

## Hiring Recommendation
${level}. ${summary.hiringRecommendation}

## Confidence Analysis
${summary.confidenceAnalysis}

## Suggested Learning Path
${summary.learningPath.map(item => `- ${item}`).join('\n')}`;
}

class InterviewSession {
  constructor(options) {
    this.sessionId = createSessionId();
    this.role = options.role;
    this.experience = options.experience;
    this.interviewType = options.interviewType;
    this.company = options.company;
    this.currentDifficulty = options.difficulty;
    this.provider = 'demo';
    this.chat = null;
    this.history = [];
    this.evaluations = [];
    this.questionCount = 0;
    this.lastQuestion = null;
    this.stage = 'intro_prompt';
    this.startTime = Date.now();
    this.lastActivity = Date.now();
    this.memory = {
      candidateName: '',
      technologies: new Set(options.technologies),
      strengths: new Map(),
      weakAreas: new Map(),
      mistakes: [],
      contradictions: [],
      confidenceSignals: [],
      communicationPatterns: [],
      previousAnswers: [],
      previousQuestions: [],
      topicsCovered: new Set(),
    };
  }

  get averageScore() {
    return average(this.evaluations.filter(item => item.score > 0).map(item => item.score));
  }

  get elapsedMinutes() {
    return Math.round((Date.now() - this.startTime) / 60000);
  }

  get performanceLevel() {
    const score = this.averageScore;
    if (score >= 85) return 'Exceptional';
    if (score >= 72) return 'Strong';
    if (score >= 58) return 'Developing';
    if (score >= 42) return 'Needs focused practice';
    return 'Not interview ready';
  }

  memorySnapshot() {
    return {
      role: this.role,
      experience: this.experience,
      interviewType: this.interviewType,
      stage: this.stage,
      candidateName: this.memory.candidateName,
      currentDifficulty: this.currentDifficulty,
      technologies: [...this.memory.technologies],
      strengths: topKeys(this.memory.strengths, 6),
      weakAreas: topKeys(this.memory.weakAreas, 6),
      mistakes: this.memory.mistakes.slice(-6),
      contradictions: this.memory.contradictions.slice(-4),
      confidenceSignals: this.memory.confidenceSignals.slice(-8),
      communicationPatterns: this.memory.communicationPatterns.slice(-8),
      previousQuestions: this.memory.previousQuestions.slice(-8),
      topicsCovered: [...this.memory.topicsCovered],
      lastQuestion: this.lastQuestion,
      averageScore: this.averageScore,
    };
  }

  addQuestion(question) {
    this.lastQuestion = question;
    this.memory.previousQuestions.push(question);
    this.memory.topicsCovered.add(question.topic);
    this.currentDifficulty = question.difficulty || this.currentDifficulty;
  }

  applyEvaluation(evaluation) {
    if (!evaluation) return;

    const normalized = normalizeEvaluation(evaluation);
    this.evaluations.push(normalized);
    this.questionCount = Math.max(this.questionCount, normalized.questionNumber || this.questionCount);
    this.currentDifficulty = normalized.difficulty || this.currentDifficulty;
    this.lastActivity = Date.now();

    normalized.technologies.forEach(tech => this.memory.technologies.add(tech));
    normalized.strengths.forEach(topic => bumpMap(this.memory.strengths, topic));
    normalized.weakAreas.forEach(topic => bumpMap(this.memory.weakAreas, topic));
    this.memory.confidenceSignals.push(normalized.confidenceSignal);

    if (normalized.classification === 'VAGUE') this.memory.communicationPatterns.push('vague answer');
    if (normalized.classification === 'IDK') this.memory.mistakes.push(`Could not answer: ${normalized.topic}`);
    if (normalized.classification === 'INCORRECT') this.memory.mistakes.push(`Weak answer: ${normalized.topic}`);
  }

  addTurn(role, content) {
    this.history.push({ role, content, at: new Date().toISOString() });
    this.lastActivity = Date.now();
    if (role === 'user') this.memory.previousAnswers.push(String(content || '').slice(0, 600));
    if (this.history.length > MAX_HISTORY_MESSAGES) {
      this.history = this.history.slice(-MAX_HISTORY_MESSAGES);
    }
  }

  getScoreAverages() {
    const scored = this.evaluations.filter(item => item.score > 0);
    const result = {};

    for (const key of SCORE_KEYS) {
      result[key] = average(scored.map(item => item.scores?.[key] || 0));
    }

    return result;
  }

  getSummary() {
    const scoreAverages = this.getScoreAverages();
    const strengths = topKeys(this.memory.strengths, 6);
    const weaknesses = topKeys(this.memory.weakAreas, 6);
    const avg = this.averageScore;

    return {
      sessionId: this.sessionId,
      role: this.role,
      experience: this.experience,
      interviewType: this.interviewType,
      company: this.company,
      totalQuestions: this.questionCount,
      averageScore: avg,
      scoreOutOf10: scoreToTen(avg),
      performanceLevel: this.performanceLevel,
      durationMinutes: this.elapsedMinutes,
      scoreBreakdown: scoreAverages,
      scoreBreakdownOutOf10: Object.fromEntries(Object.entries(scoreAverages).map(([key, value]) => [key, scoreToTen(value)])),
      technologiesMentioned: [...this.memory.technologies],
      topicsCovered: [...this.memory.topicsCovered],
      strengths,
      weaknesses,
      technicalGaps: weaknesses.filter(item => !/communication|clarity/i.test(item)),
      communicationReview: scoreAverages.communication >= 70
        ? 'Communication was generally clear and structured.'
        : 'Communication needs more structure, specificity, and concise examples.',
      confidenceAnalysis: scoreAverages.confidence >= 72
        ? 'The candidate sounded confident without relying heavily on hedging language.'
        : 'Confidence appeared uneven; answers should be more direct and evidence-backed.',
      hiringRecommendation: avg >= 82
        ? 'Strong hire signal for the target level.'
        : avg >= 70
          ? 'Positive signal, with a few gaps to validate in another round.'
          : avg >= 55
            ? 'Borderline signal; more preparation or a narrower role fit is recommended.'
            : 'Not ready for this target level yet.',
      learningPath: buildLearningPath(weaknesses, this.role, this.interviewType),
      evaluations: this.evaluations,
      memory: {
        strengths: serializeMap(this.memory.strengths),
        weakAreas: serializeMap(this.memory.weakAreas),
        mistakes: this.memory.mistakes,
        contradictions: this.memory.contradictions,
        confidenceSignals: this.memory.confidenceSignals,
      },
    };
  }
}

function buildLearningPath(weaknesses, role, interviewType) {
  const path = [];
  const joined = `${weaknesses.join(' ')} ${role} ${interviewType}`.toLowerCase();

  if (/react|frontend|render|ui/.test(joined)) {
    path.push('React rendering, hooks, state architecture, and performance profiling.');
  }
  if (/node|backend|api|auth|jwt|express/.test(joined)) {
    path.push('Node.js API architecture, middleware, auth security, error handling, and async execution.');
  }
  if (/mongo|database|data|index/.test(joined)) {
    path.push('MongoDB data modeling, indexing, aggregation, and query optimization.');
  }
  if (/system|architecture|scale|production|real-world/.test(joined)) {
    path.push('System design fundamentals: capacity, caching, queues, observability, and reliability.');
  }
  if (/coding|arrays|graphs|dynamic|algorithm/.test(joined)) {
    path.push('DSA practice focused on reasoning, complexity, edge cases, and optimization.');
  }
  if (/communication|clarity|depth/.test(joined) || path.length === 0) {
    path.push('Interview communication: answer with context, approach, trade-offs, example, and result.');
  }

  return [...new Set(path)].slice(0, 5);
}

class AFAIService {
  constructor() {
    this.sessions = afaiSessionStore;
    setInterval(() => this._cleanupSessions(), CLEANUP_MS);
  }

  createSession(roleOrOptions, experienceArg) {
    const options = normalizeOptions(roleOrOptions, experienceArg);
    const session = new InterviewSession(options);

    if (geminiClient) {
      try {
        const model = geminiClient.getGenerativeModel({
          model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          systemInstruction: buildAfaiSystemPrompt(session),
        });
        session.chat = model.startChat({ history: [] });
        session.provider = 'gemini';
      } catch (error) {
        console.warn('AFAI Gemini session failed:', error.message);
      }
    }

    if (!session.chat && openaiClient) {
      session.provider = 'openai';
    }

    this.sessions.set(session.sessionId, session);
    return session.sessionId;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  async processMessage(payload) {
    const options = normalizeOptions(payload || {});
    let session = this.sessions.get(payload?.sessionId);

    if (!session) {
      const sessionId = this.createSession(options);
      session = this.sessions.get(sessionId);
    }

    const message = String(payload?.message || '').trim();

    if (session.stage === 'intro_prompt' || (session.questionCount === 0 && !session.lastQuestion && isStartSignal(message))) {
      return this._sendIntroPrompt(session, message);
    }

    if (session.stage === 'awaiting_introduction') {
      return this._processCandidateIntroduction(session, message);
    }

    if (session.provider === 'gemini' || session.provider === 'openai') {
      try {
        return await this._processWithAI(session, message);
      } catch (error) {
        console.warn('AFAI AI provider failed, using deterministic engine:', error.message);
      }
    }

    return this._processWithMock(session, message);
  }

  async streamMessage(res, payload) {
    const result = await this.processMessage(payload);

    if (result.sessionId && result.sessionId !== payload?.sessionId) {
      res.write(`data: ${JSON.stringify({ type: 'session', sessionId: result.sessionId })}\n\n`);
    }

    await this._emitTextStream(res, result.reply);
    res.write(`data: ${JSON.stringify({
      type: 'done',
      fullText: result.reply,
      evaluation: result.evaluation,
      stats: result.stats,
      mode: result.mode,
    })}\n\n`);
    res.end();
  }

  _sendIntroPrompt(session, message) {
    const evaluation = this._introEvaluation(session, null, 0, ['Asked candidate to introduce themselves.']);
    session.stage = 'awaiting_introduction';
    session.addTurn('user', message || '(session started)');
    session.addTurn('assistant', INTRO_REPLY);
    session.applyEvaluation(evaluation);
    session.questionCount = 0;

    return this._response(session, INTRO_REPLY, evaluation, session.provider === 'demo' ? 'demo' : 'ai');
  }

  _processCandidateIntroduction(session, message) {
    const name = extractCandidateName(message);
    if (name) session.memory.candidateName = name;

    detectTechnologies(message).forEach(tech => session.memory.technologies.add(tech));

    const firstQuestion = buildOpeningQuestion(session);
    const greeting = name
      ? `Nice to meet you, ${name}. Welcome to AFAI.`
      : 'Nice to meet you. Welcome to AFAI.';
    const reply = `${greeting}\nLet's begin your technical interview.\n\n${firstQuestion.text}`;
    const evaluation = this._introEvaluation(session, firstQuestion, 1, ['Candidate introduced themselves and first question was asked.']);

    session.stage = 'interviewing';
    session.addTurn('user', message);
    session.addTurn('assistant', reply);
    session.addQuestion(firstQuestion);
    session.applyEvaluation(evaluation);
    session.questionCount = 1;

    return this._response(session, reply, evaluation, session.provider === 'demo' ? 'demo' : 'ai');
  }

  async _processWithAI(session, message) {
    const prompt = buildTurnPrompt(session, message);
    let fullText = '';

    if (session.provider === 'gemini' && session.chat) {
      const result = await session.chat.sendMessage(prompt);
      fullText = result.response.text();
    } else if (session.provider === 'openai') {
      const response = await openaiClient.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.65,
        messages: [
          { role: 'system', content: buildAfaiSystemPrompt(session) },
          ...session.history.map(item => ({
            role: item.role === 'assistant' ? 'assistant' : 'user',
            content: item.content,
          })),
          { role: 'user', content: prompt },
        ],
      });
      fullText = response.choices[0]?.message?.content || '';
    }

    const cleanText = stripStateTag(fullText);
    const fallback = session.questionCount === 0
      ? this._introEvaluation(session)
      : analyzeAnswer(session, message);
    const parsed = parseStateTag(fullText);
    const evaluation = normalizeEvaluation(parsed, {
      ...fallback,
      questionNumber: session.questionCount + 1,
      difficulty: session.currentDifficulty,
    });

    session.addTurn('user', message || '(session started)');
    session.addTurn('assistant', cleanText);
    session.applyEvaluation(evaluation);

    if (evaluation.topic) session.memory.topicsCovered.add(evaluation.topic);
    session.currentDifficulty = evaluation.difficulty || session.currentDifficulty;
    session.questionCount = evaluation.questionNumber || session.questionCount + 1;

    const questionFromText = this._extractLastQuestion(cleanText);
    session.addQuestion({
      topic: evaluation.topic || 'Adaptive Interview',
      text: questionFromText || cleanText,
      difficulty: session.currentDifficulty,
      source: session.provider,
    });

    return this._response(session, cleanText, evaluation, 'ai');
  }

  _processWithMock(session, message) {
    if (session.questionCount === 0) {
      return this._sendIntroPrompt(session, message);
    }

    const evaluation = normalizeEvaluation(analyzeAnswer(session, message), {
      questionNumber: session.questionCount + 1,
      difficulty: session.currentDifficulty,
    });
    let nextQuestion = selectQuestion(session, evaluation);
    if (evaluation.followUpQuestion) {
      nextQuestion = {
        ...nextQuestion,
        topic: evaluation.topic || nextQuestion.topic,
        text: evaluation.followUpQuestion,
        source: 'adaptive_follow_up',
      };
    }
    evaluation.questionNumber = session.questionCount + 1;
    evaluation.difficulty = nextQuestion.difficulty;

    const reply = buildMockReply(session, evaluation, nextQuestion);

    session.addTurn('user', message);
    session.addTurn('assistant', reply);
    session.applyEvaluation(evaluation);
    session.questionCount = evaluation.questionNumber;
    session.addQuestion(nextQuestion);

    return this._response(session, reply, evaluation, 'demo');
  }

  _introEvaluation(session, question = null, questionNumber = 0, notes = ['Interview started.']) {
    return {
      classification: 'INTRO',
      nextAction: 'start',
      topic: question?.topic || 'Introduction',
      difficulty: session.currentDifficulty,
      questionNumber,
      score: 0,
      scores: emptyScores(),
      strengths: [],
      weakAreas: [],
      technologies: [...session.memory.technologies],
      confidenceSignal: 'steady',
      correction: '',
      missingConcepts: [],
      followUpQuestion: '',
      answerQuality: {
        correctness: 0,
        technicalAccuracy: 0,
        communication: 0,
        confidence: 0,
        completeness: 0,
      },
      notes,
    };
  }

  _response(session, reply, evaluation, mode) {
    return {
      reply,
      sessionId: session.sessionId,
      evaluation,
      stats: {
        questionCount: session.questionCount,
        averageScore: session.averageScore,
        elapsedMinutes: session.elapsedMinutes,
        performanceLevel: session.performanceLevel,
        currentDifficulty: session.currentDifficulty,
        technologiesMentioned: [...session.memory.technologies],
        strengths: topKeys(session.memory.strengths, 5),
        weakAreas: topKeys(session.memory.weakAreas, 5),
      },
      mode,
    };
  }

  _extractLastQuestion(text) {
    const sentences = String(text || '').split(/(?<=[?.!])\s+/).filter(Boolean);
    for (let i = sentences.length - 1; i >= 0; i -= 1) {
      if (/\?$/.test(sentences[i].trim())) return sentences[i].trim();
    }
    return '';
  }

  async _emitTextStream(res, text) {
    const chunks = String(text || '').split(/(\s+)/).filter(chunk => chunk.length > 0);
    for (const chunk of chunks) {
      res.write(`data: ${JSON.stringify({ type: 'token', text: chunk })}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 12));
    }
  }

  async generateSummary(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const summary = session.getSummary();

    if (session.provider === 'gemini' || session.provider === 'openai') {
      try {
        summary.aiSummary = await this._generateAiSummary(session, summary);
      } catch (error) {
        console.warn('AFAI summary provider failed:', error.message);
      }
    }

    if (!summary.aiSummary) {
      summary.aiSummary = buildFallbackSummary(summary);
    }

    return summary;
  }

  async _generateAiSummary(session, summary) {
    const prompt = buildSummaryPrompt(summary);

    if (session.provider === 'gemini' && session.chat) {
      const result = await session.chat.sendMessage(prompt);
      return stripStateTag(result.response.text());
    }

    if (session.provider === 'openai') {
      const response = await openaiClient.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.45,
        messages: [
          { role: 'system', content: 'You are AFAI generating the final interview report. Be direct, fair, and actionable.' },
          { role: 'user', content: prompt },
        ],
      });
      return stripStateTag(response.choices[0]?.message?.content || '');
    }

    return '';
  }

  _cleanupSessions() {
    const cutoff = Date.now() - SESSION_TTL_MS;
    for (const [sessionId, session] of this.sessions) {
      if (session.lastActivity < cutoff) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

module.exports = new AFAIService();
