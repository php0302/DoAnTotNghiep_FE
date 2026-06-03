// Danh sách MIME type được hỗ trợ (phải khớp với backend)
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
  'application/zip',
];

// Giới hạn kích thước: 10MB (phải khớp với backend)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Định nghĩa icon + màu sắc theo MIME type */
const FILE_TYPE_MAP = {
  'image/jpeg':  { icon: '🖼️', color: '#3b82f6', label: 'JPG' },
  'image/png':   { icon: '🖼️', color: '#3b82f6', label: 'PNG' },
  'image/gif':   { icon: '🖼️', color: '#8b5cf6', label: 'GIF' },
  'image/webp':  { icon: '🖼️', color: '#3b82f6', label: 'WebP' },
  'application/pdf': { icon: '📄', color: '#ef4444', label: 'PDF' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    { icon: '📝', color: '#2563eb', label: 'DOCX' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    { icon: '📊', color: '#16a34a', label: 'XLSX' },
  'application/zip': { icon: '📦', color: '#f59e0b', label: 'ZIP' },
};

/**
 * Lấy icon/color/label cho file theo MIME type.
 * @param {string} mimeType
 */
export const getFileIcon = (mimeType) =>
  FILE_TYPE_MAP[mimeType] || { icon: '📎', color: '#6b7280', label: 'File' };

/**
 * Format số bytes thành chuỗi dễ đọc: "1.2 MB", "500 KB", ...
 * @param {number} bytes
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const units  = ['B', 'KB', 'MB', 'GB'];
  const i      = Math.floor(Math.log(bytes) / Math.log(1024));
  const value  = bytes / Math.pow(1024, i);
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${units[i]}`;
};

/** Kiểm tra file có phải ảnh không */
export const isImage = (mimeType) => mimeType?.startsWith('image/');

/** Kiểm tra file có phải PDF không */
export const isPdf = (mimeType) => mimeType === 'application/pdf';

/**
 * Validate file trước khi upload (client-side).
 * @param {File} file
 * @returns {string|null} - Chuỗi lỗi nếu không hợp lệ, null nếu OK
 */
export const validateFile = (file) => {
  if (!file) return 'File không hợp lệ';

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Định dạng "${file.name.split('.').pop().toUpperCase()}" không được hỗ trợ`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File "${file.name}" vượt quá 10MB (${formatFileSize(file.size)})`;
  }
  return null;
};
