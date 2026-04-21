import apiClient from './apiClient';

export const taskService = {
  getByProject:  (projectId)          => apiClient.get(`/projects/${projectId}/tasks`),
  getMyTasks:    ()                   => apiClient.get('/tasks/my'),
  getById:       (taskId)             => apiClient.get(`/tasks/${taskId}`),
  create:        (projectId, data)    => apiClient.post(`/projects/${projectId}/tasks`, data),
  update:        (taskId, data)       => apiClient.put(`/tasks/${taskId}`, data),
  updateStatus:  (taskId, status)     => apiClient.patch(`/tasks/${taskId}/status?status=${status}`),
  assign:        (taskId, userId)     => apiClient.patch(`/tasks/${taskId}/assign?userId=${userId}`),
  delete:        (taskId)             => apiClient.delete(`/tasks/${taskId}`),
};
