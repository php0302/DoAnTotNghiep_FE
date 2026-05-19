import apiClient from './apiClient';

export const userService = {
  me:         ()             => apiClient.get('/users/me'),
  getAll:     ()             => apiClient.get('/users'),
  getById:    (id)           => apiClient.get(`/users/${id}`),
  updateRole: (id, roleId)   => apiClient.put(`/users/${id}/role`, { roleId }),
  updateMyProfile: (data)    => apiClient.put('/users/me', data),
  updateUserProfile: (id, data) => apiClient.put(`/users/${id}`, data),
};
