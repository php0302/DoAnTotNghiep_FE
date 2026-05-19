import apiClient from './apiClient';

export const userService = {
  me:         ()             => apiClient.get('/users/me'),
  getAll:     ()             => apiClient.get('/users'),
  getById:    (id)           => apiClient.get(`/users/${id}`),
  updateRole: (id, roleId)   => apiClient.put(`/users/${id}/role`, { roleId }),
  updateMyProfile: (data)    => apiClient.put('/users/me', data),
  updateUserProfile: (id, data) => apiClient.put(`/users/${id}`, data),

  /** Admin tạo tài khoản nhân viên */
  createUser: (data)         => apiClient.post('/users', data),

  /** Đổi mật khẩu (kể cả lần đầu bắt buộc) */
  changePassword: (data)     => apiClient.put('/users/me/password', data),

  /** Xóa/Khóa tài khoản */
  deleteUser: (id)           => apiClient.delete(`/users/${id}`),
};
