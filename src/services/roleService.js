import apiClient from './apiClient';

export const roleService = {
  /** Lấy danh sách tất cả chức vụ (kèm userCount) */
  getAll: () => apiClient.get('/roles'),

  /** Lấy thông tin chi tiết một chức vụ */
  getById: (id) => apiClient.get(`/roles/${id}`),

  /** Tạo chức vụ mới */
  create: (data) => apiClient.post('/roles', data),

  /** Cập nhật chức vụ */
  update: (id, data) => apiClient.put(`/roles/${id}`, data),

  /** Xóa chức vụ */
  delete: (id) => apiClient.delete(`/roles/${id}`),

  /** Lấy danh sách tất cả Permissions có trong hệ thống */
  getAllPermissions: () => apiClient.get('/roles/permissions'),
};
