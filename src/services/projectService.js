import apiClient from './apiClient';

export const projectService = {
  getAll:        ()           => apiClient.get('/projects'),
  getById:       (id)         => apiClient.get(`/projects/${id}`),
  create:        (data)       => apiClient.post('/projects', data),
  update:        (id, data)   => apiClient.put(`/projects/${id}`, data),
  delete:        (id)         => apiClient.delete(`/projects/${id}`),
  addMember:     (id, data)   => apiClient.post(`/projects/${id}/members`, data),
  removeMember:  (id, userId) => apiClient.delete(`/projects/${id}/members/${userId}`),
  getMembers:    (id)         => apiClient.get(`/projects/${id}/members`),
};
