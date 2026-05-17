import api from '../services/api';

export async function startAFAISession(payload) {
  const { data } = await api.post('/afai/start', payload);
  return data;
}

export async function sendAFAIMessage(payload) {
  const { data } = await api.post('/afai', payload);
  return data;
}

export async function getAFAISummary(sessionId) {
  const { data } = await api.post('/afai/summary', { sessionId });
  return data.summary;
}
