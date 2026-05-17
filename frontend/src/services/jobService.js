import api from './api';

export async function fetchJobs(params = {}) {
  const { data } = await api.get('/jobs/all', { params });
  return data.jobs || data;
}

export async function fetchRemoteJobs(params = {}) {
  const { data } = await api.get('/jobs/remote', { params });
  return data.jobs || [];
}

export async function fetchIndiaJobs(params = {}) {
  const { data } = await api.get('/jobs/india', { params });
  return data.jobs || [];
}

export async function searchRemoteJobs(keyword) {
  const { data } = await api.get('/jobs/search', { params: { keyword } });
  return data.jobs || [];
}

export async function fetchRecruiterJobs() {
  const { data } = await api.get('/jobs/mine');
  return data.jobs || [];
}

export async function createJob(payload) {
  const { data } = await api.post('/jobs/create', payload);
  return data.job;
}

export async function applyToJob(jobId, payload = {}) {
  const { data } = await api.post(`/jobs/${jobId}/apply`, payload);
  return data;
}

export async function fetchCandidateApplications() {
  const { data } = await api.get('/jobs/applications/me');
  return data.applications || [];
}

export async function fetchRecruiterApplications() {
  const { data } = await api.get('/jobs/applications/recruiter');
  return data.applications || [];
}
