import apiClient from './apiClient';

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8080';

export const attachmentService = {
  /**
   * Upload file vào task.
   * @param {number} taskId
   * @param {File} file
   * @param {(percent: number) => void} onProgress - callback cập nhật % upload
   */
  uploadToTask: (taskId, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },

  /**
   * Upload file vào comment.
   */
  uploadToComment: (commentId, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/comments/${commentId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },

  /** Lấy danh sách file của task */
  getByTask: (taskId) => apiClient.get(`/tasks/${taskId}/attachments`),

  /** Lấy danh sách file của comment */
  getByComment: (commentId) => apiClient.get(`/comments/${commentId}/attachments`),

  /** Xóa attachment */
  delete: (attachmentId) => apiClient.delete(`/attachments/${attachmentId}`),

  /**
   * Trả về URL đầy đủ để download / xem file.
   * fileUrl ví dụ: "/uploads/tasks/5/abc123.pdf"
   */
  getFileUrl: (fileUrl) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    return `${BASE_URL}${fileUrl}`;
  },
};
