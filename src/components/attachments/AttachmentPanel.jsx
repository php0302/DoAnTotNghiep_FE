import React, { useState, useRef, useCallback } from 'react';
import { useAttachments } from '../../hooks/useAttachments';
import {
  getFileIcon,
  formatFileSize,
  isImage,
  isPdf,
  validateFile,
} from '../../utils/fileUtils';
import { attachmentService } from '../../services/attachmentService';
import PreviewModal from './PreviewModal';
import styles from './AttachmentPanel.module.css';

/**
 * Component hiển thị và quản lý file đính kèm của một task hoặc comment.
 *
 * @param {Object} props
 * @param {number}  [props.taskId]       - ID task (truyền nếu đây là attachment của task)
 * @param {number}  [props.commentId]    - ID comment (truyền nếu đây là attachment của comment)
 * @param {number}  props.currentUserId  - ID user đang đăng nhập (để kiểm tra quyền xóa)
 * @param {boolean} [props.isAdmin]      - true nếu user là ADMIN (được xóa mọi file)
 */
export default function AttachmentPanel({
  taskId,
  commentId,
  currentUserId,
  isAdmin = false,
}) {
  const { attachments, loading, uploading, uploadProgress, error, upload, remove } =
    useAttachments({ taskId, commentId });

  const [dragOver, setDragOver]         = useState(false);
  const [fileErrors, setFileErrors]     = useState([]);
  const [preview, setPreview]           = useState(null); // { url, type, name }
  const [deletingId, setDeletingId]     = useState(null);
  const fileInputRef                    = useRef(null);

  // ── Drag & Drop handlers ─────────────────────────────────────────────────
  const handleDragOver  = useCallback((e) => { e.preventDefault(); setDragOver(true);  }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setDragOver(false); }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    await processFiles(droppedFiles);
  }, []); // eslint-disable-line

  const handleFileInput = useCallback(async (e) => {
    const selectedFiles = Array.from(e.target.files);
    await processFiles(selectedFiles);
    e.target.value = ''; // Reset input để cho phép chọn lại cùng file
  }, []); // eslint-disable-line

  /** Validate và upload từng file */
  const processFiles = async (files) => {
    const errors = [];
    setFileErrors([]);

    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
        continue;
      }
      try {
        await upload(file);
      } catch (e) {
        errors.push(e.message);
      }
    }
    if (errors.length > 0) setFileErrors(errors);
  };

  // ── Preview ──────────────────────────────────────────────────────────────
  const handlePreview = useCallback((attachment) => {
    const url = attachmentService.getFileUrl(attachment.fileUrl);
    if (isImage(attachment.fileType) || isPdf(attachment.fileType)) {
      setPreview({ url, type: attachment.fileType, name: attachment.originalName });
    } else {
      // Không thể preview → mở tab mới / download
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // ── Download ─────────────────────────────────────────────────────────────
  const handleDownload = useCallback((attachment) => {
    const url = attachmentService.getFileUrl(attachment.fileUrl);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = attachment.originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (attachment) => {
    if (!window.confirm(`Xóa file "${attachment.originalName}"?`)) return;
    setDeletingId(attachment.id);
    try {
      await remove(attachment.id);
    } finally {
      setDeletingId(null);
    }
  }, [remove]);

  const canDelete = (attachment) =>
    attachment.uploadedById === currentUserId || isAdmin;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>
          📎 Đính kèm
          {attachments.length > 0 && (
            <span className={styles.badge}>{attachments.length}</span>
          )}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''} ${uploading ? styles.dropzoneUploading : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !uploading && fileInputRef.current?.click()}
        aria-label="Khu vực tải file"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.docx,.xlsx,.zip"
          onChange={handleFileInput}
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        {uploading ? (
          /* Progress State */
          <div className={styles.uploadingState}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className={styles.progressText}>
              Đang upload... {uploadProgress}%
            </span>
          </div>
        ) : (
          /* Idle State */
          <div className={styles.dropzonePlaceholder}>
            <div className={styles.dropzoneIcon}>
              {dragOver ? '📂' : '⬆️'}
            </div>
            <p className={styles.dropzoneText}>
              {dragOver
                ? 'Thả file để upload'
                : <>Kéo thả file vào đây hoặc <strong>click để chọn</strong></>}
            </p>
            <p className={styles.dropzoneHint}>
              JPG, PNG, GIF, WebP, PDF, DOCX, XLSX, ZIP • Tối đa 10MB/file
            </p>
          </div>
        )}
      </div>

      {/* File Errors */}
      {fileErrors.length > 0 && (
        <div className={styles.errors}>
          {fileErrors.map((err, idx) => (
            <div key={idx} className={styles.errorItem}>
              <span>⚠️</span> {err}
            </div>
          ))}
        </div>
      )}

      {/* API Error */}
      {error && (
        <div className={styles.apiError}>⚠️ {error}</div>
      )}

      {/* Attachment List */}
      <div className={styles.listWrapper}>
        {loading ? (
          /* Skeleton Loading */
          <div className={styles.skeleton}>
            {[1, 2].map((n) => (
              <div key={n} className={styles.skeletonItem} />
            ))}
          </div>
        ) : attachments.length === 0 ? (
          /* Empty State */
          <div className={styles.empty}>
            <span>📭</span>
            <p>Chưa có file đính kèm</p>
          </div>
        ) : (
          /* List */
          <ul className={styles.list}>
            {attachments.map((att) => {
              const { icon, color } = getFileIcon(att.fileType);
              const canPreview = isImage(att.fileType) || isPdf(att.fileType);
              const isDeleting = deletingId === att.id;

              return (
                <li
                  key={att.id}
                  className={`${styles.item} ${isDeleting ? styles.itemDeleting : ''}`}
                >
                  {/* File Icon */}
                  <div className={styles.itemIcon} style={{ color }}>
                    {icon}
                  </div>

                  {/* File Info */}
                  <div className={styles.itemInfo}>
                    <button
                      className={styles.itemName}
                      onClick={() => handlePreview(att)}
                      title={canPreview ? 'Click để xem trước' : 'Click để tải xuống'}
                    >
                      {att.originalName}
                    </button>
                    <span className={styles.itemMeta}>
                      {formatFileSize(att.fileSize)}
                      &nbsp;·&nbsp;
                      {att.uploadedByName}
                      &nbsp;·&nbsp;
                      {new Date(att.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className={styles.itemActions}>
                    <button
                      className={`${styles.actionBtn} ${styles.downloadBtn}`}
                      onClick={() => handleDownload(att)}
                      title="Tải xuống"
                      aria-label={`Tải xuống ${att.originalName}`}
                    >
                      ⬇️
                    </button>
                    {canDelete(att) && (
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDelete(att)}
                        disabled={isDeleting}
                        title="Xóa file"
                        aria-label={`Xóa ${att.originalName}`}
                      >
                        {isDeleting ? '⏳' : '🗑️'}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Preview Modal */}
      {preview && (
        <PreviewModal
          url={preview.url}
          type={preview.type}
          name={preview.name}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
