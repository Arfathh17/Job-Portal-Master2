/**
 * In-Memory Store — used as fallback when MongoDB is not available
 * Provides the same interface as Mongoose models for seamless switching
 */
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate a simple unique ID
const generateId = () => crypto.randomBytes(12).toString('hex');

// ─── Seed Data ─────────────────────────────────────────────────────────────────

const seedJobs = [
  {
    _id: generateId(),
    title: 'Senior React Developer',
    company: 'TechCorp AI',
    location: 'San Francisco, CA',
    description: 'We are looking for an experienced React developer to join our AI-powered platform team. You will build cutting-edge user interfaces for our machine learning products.',
    requirements: ['5+ years React experience', 'TypeScript proficiency', 'REST API integration', 'State management (Redux/Zustand)'],
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'Tailwind CSS'],
    salary: { min: 120000, max: 180000, currency: 'USD' },
    type: 'full-time',
    remote: true,
    postedBy: 'demo-recruiter',
    applications: [],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    _id: generateId(),
    title: 'Full Stack Engineer',
    company: 'InnovateLabs',
    location: 'New York, NY',
    description: 'Join our fast-growing startup building the next generation of SaaS tools. Work across the entire stack from database design to pixel-perfect UI.',
    requirements: ['3+ years full-stack experience', 'Node.js/Express', 'React or Vue', 'MongoDB or PostgreSQL'],
    skills: ['JavaScript', 'Node.js', 'React', 'MongoDB', 'Docker'],
    salary: { min: 100000, max: 150000, currency: 'USD' },
    type: 'full-time',
    remote: false,
    postedBy: 'demo-recruiter',
    applications: [],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    _id: generateId(),
    title: 'AI/ML Engineer',
    company: 'DeepMind Solutions',
    location: 'London, UK',
    description: 'Design and deploy machine learning models at scale. Work with cutting-edge NLP and computer vision systems that serve millions of users.',
    requirements: ['MS/PhD in CS or related field', 'Python expertise', 'PyTorch/TensorFlow', 'MLOps experience'],
    skills: ['Python', 'PyTorch', 'TensorFlow', 'AWS SageMaker', 'Docker'],
    salary: { min: 130000, max: 200000, currency: 'USD' },
    type: 'full-time',
    remote: true,
    postedBy: 'demo-recruiter',
    applications: [],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    _id: generateId(),
    title: 'DevOps Engineer',
    company: 'CloudScale Inc.',
    location: 'Austin, TX',
    description: 'Manage and scale our cloud infrastructure across AWS and GCP. Automate CI/CD pipelines and ensure 99.99% uptime for our SaaS platform.',
    requirements: ['AWS/GCP certified', 'Kubernetes expertise', 'Terraform/IaC', 'CI/CD pipelines'],
    skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Jenkins'],
    salary: { min: 110000, max: 160000, currency: 'USD' },
    type: 'full-time',
    remote: true,
    postedBy: 'demo-recruiter',
    applications: [],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    _id: generateId(),
    title: 'UI/UX Design Intern',
    company: 'PixelPerfect Studio',
    location: 'Remote',
    description: 'Great opportunity for design students! Work alongside senior designers creating beautiful interfaces for top-tier clients.',
    requirements: ['Figma proficiency', 'Design portfolio', 'Understanding of design systems', 'Currently enrolled student'],
    skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research', 'HTML/CSS'],
    salary: { min: 25000, max: 40000, currency: 'USD' },
    type: 'internship',
    remote: true,
    postedBy: 'demo-recruiter',
    applications: [],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    _id: generateId(),
    title: 'Backend Python Developer',
    company: 'DataFlow Systems',
    location: 'Berlin, Germany',
    description: 'Build robust data pipelines and APIs using Python and FastAPI. Work with large-scale data processing systems.',
    requirements: ['4+ years Python', 'FastAPI/Django', 'PostgreSQL', 'Message queues (Redis/Kafka)'],
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Kafka'],
    salary: { min: 90000, max: 140000, currency: 'USD' },
    type: 'full-time',
    remote: false,
    postedBy: 'demo-recruiter',
    applications: [],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
];

// ─── In-Memory Collections ─────────────────────────────────────────────────────

const store = {
  users: [],
  jobs: [...seedJobs],
  notifications: [],
};

// ─── User Operations ───────────────────────────────────────────────────────────

const UserStore = {
  async create(data) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const user = {
      _id: generateId(),
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'candidate',
      profile: data.profile || { phone: '', skills: [], experience: '', education: '', resume: null },
      createdAt: new Date(),
    };
    store.users.push(user);
    return user;
  },

  async findByEmail(email) {
    return store.users.find((u) => u.email === email) || null;
  },

  async findById(id) {
    return store.users.find((u) => u._id === id) || null;
  },

  async updateById(id, updates) {
    const idx = store.users.findIndex((u) => u._id === id);
    if (idx === -1) return null;
    store.users[idx] = { ...store.users[idx], ...updates };
    return store.users[idx];
  },
};

// ─── Job Operations ────────────────────────────────────────────────────────────

const JobStore = {
  async create(data) {
    const job = {
      _id: generateId(),
      ...data,
      applications: [],
      createdAt: new Date(),
    };
    store.jobs.push(job);
    return job;
  },

  async findAll(filters = {}) {
    let results = [...store.jobs];

    if (filters.search) {
      const s = filters.search.toLowerCase();
      results = results.filter(
        (j) =>
          j.title.toLowerCase().includes(s) ||
          j.company.toLowerCase().includes(s) ||
          j.skills.some((sk) => sk.toLowerCase().includes(s))
      );
    }
    if (filters.type) results = results.filter((j) => j.type === filters.type);
    if (filters.remote !== undefined) results = results.filter((j) => j.remote === filters.remote);
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      results = results.filter((j) => j.location.toLowerCase().includes(loc));
    }

    // Sort newest first
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return results;
  },

  async findById(id) {
    return store.jobs.find((j) => j._id === id) || null;
  },

  async addApplication(jobId, application) {
    const job = store.jobs.find((j) => j._id === jobId);
    if (!job) return null;
    job.applications.push({ _id: generateId(), ...application, appliedAt: new Date(), status: 'pending' });
    return job;
  },

  async getApplicationsByUser(userId) {
    const applied = [];
    store.jobs.forEach((job) => {
      job.applications.forEach((app) => {
        if (app.applicant === userId) {
          applied.push({ job: { _id: job._id, title: job.title, company: job.company, location: job.location }, ...app });
        }
      });
    });
    return applied;
  },
};

// ─── Notification Operations ───────────────────────────────────────────────────

const NotificationStore = {
  async create(data) {
    const notification = {
      _id: generateId(),
      userId: data.userId,
      type: data.type || 'info',
      title: data.title,
      message: data.message,
      read: false,
      createdAt: new Date(),
    };
    store.notifications.push(notification);
    return notification;
  },

  async getByUserId(userId) {
    return store.notifications.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async markAsRead(id) {
    const n = store.notifications.find((n) => n._id === id);
    if (n) n.read = true;
    return n;
  },

  async markAllRead(userId) {
    store.notifications.filter((n) => n.userId === userId).forEach((n) => (n.read = true));
  },
};

module.exports = { UserStore, JobStore, NotificationStore, store };
