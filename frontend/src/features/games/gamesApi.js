import { api } from '../../api/client';

export const gamesApi = {
  list: () => api.get('/games'),
  start: (gameId) => api.post(`/games/${gameId}/start`, {}),
  complete: (gameId, payload) => api.post(`/games/${gameId}/complete`, payload)
};
