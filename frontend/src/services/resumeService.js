import api from './api';

export async function analyzeResumeText(payload) {
  const { data } = await api.post('/resume/analyze-text', payload);
  return data;
}

export async function fetchResumeHistory() {
  const { data } = await api.get('/resume/history');
  return data.resumes || data;
}
