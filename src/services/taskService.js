import apiClient from './apiClient';

export const taskService = {
  getByProject:  (projectId)          => apiClient.get(`/projects/${projectId}/tasks`),
  getMyTasks:    ()                   => apiClient.get('/tasks/my'),
  getById:       (taskId)             => apiClient.get(`/tasks/${taskId}`),
  create:        (projectId, data)    => apiClient.post(`/projects/${projectId}/tasks`, data),
  update:        (taskId, data)       => apiClient.put(`/tasks/${taskId}`, data),
  updateStatus:  (taskId, status)     => apiClient.patch(`/tasks/${taskId}/status`, { status }),
  assign:        (taskId, userId)     => apiClient.patch(`/tasks/${taskId}/assign?userId=${userId}`),
  delete:        (taskId)             => apiClient.delete(`/tasks/${taskId}`),

  /**
   * Tìm kiếm & filter task nâng cao với phân trang.
   * @param {Object} params - { keyword, status, priority, assigneeId, projectId,
   *                            startDate, endDate, overdue, page, size, sortBy, sortDir }
   */
  search: (params = {}) => {
    // Loại bỏ các key có giá trị null/undefined/empty để URL sạch hơn
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
    );
    return apiClient.get('/tasks/search', { params: cleanParams });
  },
};

