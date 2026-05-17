import api from './api';

export async function loginUser(credentials) {
  const { data } = await api.post('/auth/login', credentials);
  return data;
}

export async function registerUser(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data;
}
