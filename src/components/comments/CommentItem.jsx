import React, { useState } from 'react';
import Avatar from '../ui/Avatar';
import MentionHighlight from './MentionHighlight';
import { commentService } from '../../services/commentService';
import { Trash2, Edit2, Check, X } from 'lucide-react';

/**
 * Hiển thị 1 comment với tính năng xoá & sửa inline.
 *
 * @param {object}   comment     - dữ liệu comment từ API
 * @param {object}   currentUser - user đang đăng nhập
 * @param {function} onDeleted   - (commentId) => void
 * @param {function} onUpdated   - (updatedComment) => void
 */
const CommentItem = ({ comment, currentUser, onDeleted, onUpdated }) => {
  const [editing, setEditing]     = useState(false);
  const [editText, setEditText]   = useState(comment.content);
  const [saving, setSaving]       = useState(false);

  const isAuthor = currentUser?.id === comment.author?.id;
  const isAdminOrManager = ['ADMIN', 'ROLE_ADMIN', 'PROJECT_MANAGER', 'ROLE_PROJECT_MANAGER']
    .includes(currentUser?.role);
  const canModify = isAuthor || isAdminOrManager;

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText.trim() === comment.content) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const { data } = await commentService.update(comment.taskId, comment.id, editText.trim());
      onUpdated?.(data?.data);
      setEditing(false);
    } catch { /* giữ nguyên nếu lỗi */ }
    setSaving(false);
  };

  const handleDelete = async () => {
    await commentService.delete(comment.taskId, comment.id);
    onDeleted?.(comment.id);
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="flex gap-2.5 group">
      <Avatar name={comment.author?.fullName || comment.author?.username || 'U'} size="sm" />

      <div className="flex-1 bg-warm-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2.5 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
              {comment.author?.fullName || comment.author?.username}
            </span>
            <span className="text-[10px] text-warm-muted dark:text-gray-500 flex-shrink-0">
              {formatTime(comment.createdAt)}
              {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                <span className="ml-1 italic">(đã chỉnh sửa)</span>
              )}
            </span>
          </div>

          {/* Actions (ẩn cho đến khi hover) */}
          {canModify && !editing && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              {isAuthor && (
                <button
                  onClick={() => { setEditText(comment.content); setEditing(true); }}
                  className="p-1 text-warm-muted dark:text-gray-500 hover:text-indigo-600 rounded transition-colors"
                  title="Sửa comment"
                >
                  <Edit2 size={11} />
                </button>
              )}
              <button
                onClick={handleDelete}
                className="p-1 text-warm-muted dark:text-gray-500 hover:text-red-500 rounded transition-colors"
                title="Xoá comment"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Content / Edit mode */}
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="input-field w-full resize-none text-sm"
              rows={2}
              autoFocus
            />
            <div className="flex gap-1.5 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="btn-ghost text-xs py-1 px-2"
              >
                <X size={12} /> Huỷ
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="btn-primary text-xs py-1 px-2"
              >
                <Check size={12} /> {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        ) : (
          <MentionHighlight content={comment.content} mentions={comment.mentions} />
        )}
      </div>
    </div>
  );
};

export default CommentItem;
