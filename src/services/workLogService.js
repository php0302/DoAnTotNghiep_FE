import apiClient from './apiClient';

export const workLogService = {
  /**
   * Tạo work log mới
   * @param {{ taskId, hoursLogged, logDate, description }} data
   */
  create: (data) => apiClient.post('/worklogs', data),

  /**
   * Lấy danh sách work log của một task
   */
  getByTask: (taskId) => apiClient.get(`/worklogs/task/${taskId}`),

  /**
   * Lấy báo cáo ngày
   * @param {{ startDate, endDate, userId }} params
   */
  getReport: (params = {}) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null && v !== '')
    );
    return apiClient.get('/worklogs/report', { params: clean });
  },

  /**
   * Xoá một work log
   */
  delete: (id) => apiClient.delete(`/worklogs/${id}`),
};
