const crypto = require('crypto');

const db = require('../config/firebaseAdmin');
const { JobStore } = require('../store/memoryStore');

const COLLECTION = process.env.FIRESTORE_JOBS_COLLECTION || 'jobs';
const FIRESTORE_TIMEOUT_MS = Number(process.env.FIRESTORE_TIMEOUT_MS || 3500);

function createId() {
  return `manual_${crypto.randomBytes(10).toString('hex')}`;
}

function timestampToIso(value) {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  return value;
}

function normalizeSalary(salary) {
  if (typeof salary === 'string') return salary.trim() || 'Not disclosed';
  if (salary && typeof salary === 'object') {
    const min = salary.min ? Number(salary.min) : null;
    const max = salary.max ? Number(salary.max) : null;
    const currency = salary.currency || 'USD';
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${currency} ${min.toLocaleString()}+`;
  }
  return 'Not disclosed';
}

function normalizeManualJob(job = {}) {
  const id = String(job._id || job.id || createId());

  return {
    _id: id,
    id,
    title: job.title || 'Untitled role',
    company: job.company || 'AI Job Portal',
    description: job.description || '',
    location: job.location || (job.remote ? 'Remote' : 'Not specified'),
    salary: normalizeSalary(job.salary),
    skills: Array.isArray(job.skills) ? job.skills : [],
    type: job.type || 'full-time',
    remote: Boolean(job.remote),
    applyLink: job.applyLink || '',
    source: 'manual',
    status: job.status || 'active',
    postedBy: job.postedBy || null,
    applications: Array.isArray(job.applications) ? job.applications : [],
    createdAt: timestampToIso(job.createdAt),
  };
}

function matchesFilters(job, filters = {}) {
  const keyword = String(filters.keyword || filters.search || '').trim().toLowerCase();
  const type = String(filters.type || '').trim().toLowerCase();
  const source = String(filters.source || '').trim().toLowerCase();

  if (source && job.source !== source) return false;
  if (filters.remote !== undefined && String(filters.remote) !== String(job.remote)) return false;
  if (type && job.type !== type) return false;

  if (!keyword) return true;

  return [
    job.title,
    job.company,
    job.description,
    job.location,
    job.salary,
    ...(job.skills || []),
  ].some(value => String(value || '').toLowerCase().includes(keyword));
}

function ensureFirestore() {
  if (!db) {
    const error = new Error('Firestore is not configured.');
    error.code = 'FIRESTORE_NOT_CONFIGURED';
    throw error;
  }
}

function withFirestoreTimeout(promise, operation) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`Firestore ${operation} timed out.`);
      error.code = 'FIRESTORE_TIMEOUT';
      reject(error);
    }, FIRESTORE_TIMEOUT_MS);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function warnFallback(operation, error) {
  console.warn(`Manual job store: ${operation} using in-memory fallback (${error.message})`);
}

async function createManualJob(payload) {
  const createdAt = new Date();

  try {
    ensureFirestore();
    const docRef = db.collection(COLLECTION).doc(payload._id || createId());
    const job = normalizeManualJob({
      ...payload,
      _id: docRef.id,
      id: docRef.id,
      source: 'manual',
      createdAt,
      applications: [],
      status: payload.status || 'active',
    });

    await withFirestoreTimeout(docRef.set({
      ...job,
      createdAt,
    }), 'create');

    return job;
  } catch (error) {
    warnFallback('create', error);
  }

  return normalizeManualJob(await JobStore.create({
    ...payload,
    source: 'manual',
    createdAt,
    status: payload.status || 'active',
  }));
}

async function getManualJobs(filters = {}) {
  try {
    ensureFirestore();
    const snapshot = await withFirestoreTimeout(
      db.collection(COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get(),
      'list',
    );

    const jobs = snapshot.docs.map(doc => normalizeManualJob({
      _id: doc.id,
      id: doc.id,
      ...doc.data(),
    }));
    return jobs.filter(job => matchesFilters(job, filters));
  } catch (error) {
    warnFallback('list', error);
    const jobs = await JobStore.findAll(filters);
    return jobs.map(normalizeManualJob).filter(job => matchesFilters(job, filters));
  }
}

async function getManualJobById(id) {
  try {
    ensureFirestore();
    const doc = await withFirestoreTimeout(db.collection(COLLECTION).doc(id).get(), 'get');
    if (!doc.exists) return null;
    return normalizeManualJob({
      _id: doc.id,
      id: doc.id,
      ...doc.data(),
    });
  } catch (error) {
    warnFallback('get', error);
    const job = await JobStore.findById(id);
    return job ? normalizeManualJob(job) : null;
  }
}

async function addApplication(jobId, application) {
  const app = {
    _id: createId(),
    applicant: application.applicant,
    candidate: application.candidate || application.applicant,
    coverLetter: application.coverLetter || '',
    status: 'pending',
    appliedAt: new Date().toISOString(),
  };

  try {
    ensureFirestore();
    return await withFirestoreTimeout(db.runTransaction(async transaction => {
      const docRef = db.collection(COLLECTION).doc(jobId);
      const snapshot = await transaction.get(docRef);
      if (!snapshot.exists) return null;

      const job = normalizeManualJob({
        _id: snapshot.id,
        id: snapshot.id,
        ...snapshot.data(),
      });

      if (job.applications.some(item => item.applicant === app.applicant || item.candidate === app.candidate)) {
        const error = new Error('You have already applied to this job.');
        error.statusCode = 409;
        throw error;
      }

      transaction.update(docRef, {
        applications: [...job.applications, app],
      });

      return app;
    }), 'apply');
  } catch (error) {
    if (error.statusCode === 409) throw error;
    warnFallback('apply', error);
    const job = await JobStore.addApplication(jobId, app);
    return job ? app : null;
  }
}

async function getApplicationsByUser(userId) {
  const jobs = await getManualJobs();
  return jobs.flatMap(job => (
    (job.applications || [])
      .filter(application => application.applicant === userId || application.candidate === userId)
      .map(application => ({ ...application, job }))
  ));
}

async function getApplicationsByRecruiter(recruiterId) {
  const jobs = await getManualJobs();
  return jobs
    .filter(job => job.postedBy === recruiterId)
    .flatMap(job => (job.applications || []).map(application => ({ ...application, job })));
}

module.exports = {
  addApplication,
  createManualJob,
  getApplicationsByRecruiter,
  getApplicationsByUser,
  getManualJobById,
  getManualJobs,
  normalizeManualJob,
};
