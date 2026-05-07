import apiClient from './apiClient';

export const commentService = {
  getByTask: (taskId)                    => apiClient.get(`/tasks/${taskId}/comments`),
  create:    (taskId, content)           => apiClient.post(`/tasks/${taskId}/comments`, { content }),
  update:    (taskId, commentId, content) => apiClient.put(`/tasks/${taskId}/comments/${commentId}`, { content }),
  delete:    (taskId, commentId)         => apiClient.delete(`/tasks/${taskId}/comments/${commentId}`),
};
