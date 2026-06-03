import { useState, useEffect, useCallback } from 'react';
import { attachmentService } from '../services/attachmentService';

/**
 * Hook quản lý state cho attachment của task hoặc comment.
 *
 * @param {Object} options
 * @param {number} [options.taskId]    - ID của task (nếu attachment thuộc task)
 * @param {number} [options.commentId] - ID của comment (nếu attachment thuộc comment)
 *
 * @example
 * // Dùng cho task:
 * const { attachments, upload, remove, loading } = useAttachments({ taskId: 5 });
 *
 * // Dùng cho comment:
 * const { attachments, upload, remove } = useAttachments({ commentId: 12 });
 */
export function useAttachments({ taskId, commentId }) {
  const [attachments, setAttachments]       = useState([]);
  const [loading, setLoading]               = useState(false);
  const [uploading, setUploading]           = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError]                   = useState(null);

  // ── Fetch list ───────────────────────────────────────────────────────────
  const fetchAttachments = useCallback(async () => {
    if (!taskId && !commentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = taskId
        ? await attachmentService.getByTask(taskId)
        : await attachmentService.getByComment(commentId);
      setAttachments(res.data?.data || []);
    } catch (e) {
      setError('Không thể tải danh sách file đính kèm');
      console.error('[useAttachments] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [taskId, commentId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  // ── Upload ───────────────────────────────────────────────────────────────
  const upload = useCallback(async (file) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const res = taskId
        ? await attachmentService.uploadToTask(taskId, file, setUploadProgress)
        : await attachmentService.uploadToComment(commentId, file, setUploadProgress);

      const newAttachment = res.data?.data;
      if (newAttachment) {
        // Optimistic UI: thêm ngay vào đầu danh sách
        setAttachments((prev) => [newAttachment, ...prev]);
      }
      return newAttachment;
    } catch (e) {
      const msg = e.response?.data?.message || 'Upload thất bại. Vui lòng thử lại.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [taskId, commentId]);

  // ── Delete ───────────────────────────────────────────────────────────────
  const remove = useCallback(async (attachmentId) => {
    // Optimistic UI: xóa khỏi list ngay lập tức
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    try {
      await attachmentService.delete(attachmentId);
    } catch (e) {
      // Rollback nếu lỗi
      fetchAttachments();
      const msg = e.response?.data?.message || 'Không thể xóa file';
      setError(msg);
    }
  }, [fetchAttachments]);

  return {
    attachments,
    loading,
    uploading,
    uploadProgress,
    error,
    upload,
    remove,
    refetch: fetchAttachments,
  };
}
