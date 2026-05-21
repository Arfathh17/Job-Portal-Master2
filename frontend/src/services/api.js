import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'https://afai-backend.onrender.com';
const API_BASE_URL = `${API_URL.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ai_job_portal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ai_job_portal_token');
      localStorage.removeItem('ai_job_portal_user');
    }
    return Promise.reject(error);
  },
);

export default api;
