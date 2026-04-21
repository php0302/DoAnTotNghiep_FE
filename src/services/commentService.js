import apiClient from './apiClient';

export const commentService = {
  getByTask: (taskId)          => apiClient.get(`/tasks/${taskId}/comments`),
  create:    (taskId, content) => apiClient.post(`/tasks/${taskId}/comments`, { content }),
  delete:    (taskId, id)      => apiClient.delete(`/tasks/${taskId}/comments/${id}`),
};
