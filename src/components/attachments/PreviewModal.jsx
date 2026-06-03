import React, { useEffect, useCallback } from 'react';
import { isImage, isPdf } from '../../utils/fileUtils';
import styles from './PreviewModal.module.css';

/**
 * Modal preview file ảnh và PDF.
 * Nhấn Escape hoặc click overlay để đóng.
 */
export default function PreviewModal({ url, type, name, onClose }) {
  // Đóng modal khi nhấn Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Ngăn scroll body khi modal mở
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title} title={name}>{name}</span>
          <div className={styles.headerActions}>
            <button
              className={styles.downloadBtn}
              onClick={handleDownload}
              title="Tải xuống"
            >
              ⬇️ Tải xuống
            </button>
            <button
              className={styles.closeBtn}
              onClick={onClose}
              title="Đóng (Escape)"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {isImage(type) ? (
            <img
              src={url}
              alt={name}
              className={styles.image}
            />
          ) : isPdf(type) ? (
            <iframe
              src={url}
              title={name}
              className={styles.pdf}
              frameBorder="0"
            />
          ) : (
            <div className={styles.unsupported}>
              <span>📎</span>
              <p>Không thể xem trước file này</p>
              <button className={styles.downloadBtnLarge} onClick={handleDownload}>
                ⬇️ Tải xuống để xem
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
