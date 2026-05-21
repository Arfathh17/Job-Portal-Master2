import api from './api';

export async function analyzeResumeText(payload) {
  const { data } = await api.post('/resume/analyze-text', payload);
  return data;
}

export async function uploadResume(file) {
  const formData = new FormData();
  formData.append('resume', file);

  const { data } = await api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function fetchResumeHistory() {
  const { data } = await api.get('/resume/history');
  return data.resumes || data;
}
