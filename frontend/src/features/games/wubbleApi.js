import { api } from '../../api/client';

export const wubbleApi = {
  start: (payload) => api.post('/wubble-web/start', payload),
  submit: (payload) => api.post('/wubble-web/submit', payload)
};
