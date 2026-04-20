import { api } from '../../api/client';

export const dashboardApi = {
  me: () => api.get('/user/me'),
  games: () => api.get('/games')
};
