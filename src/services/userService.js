import apiClient from './apiClient';

export const userService = {
  me:         ()         => apiClient.get('/users/me'),
  getAll:     ()         => apiClient.get('/users'),
  getById:    (id)       => apiClient.get(`/users/${id}`),
  updateRole: (id, role) => apiClient.put(`/users/${id}/role`, { role }),
};
