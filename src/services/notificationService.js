import apiClient from './apiClient';

export const notificationService = {
  getAll:    ()   => apiClient.get('/notifications'),
  markRead:  (id) => apiClient.patch(`/notifications/${id}/read`),
};
