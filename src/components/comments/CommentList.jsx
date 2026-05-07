import React, { useState, useEffect } from 'react';
import { commentService } from '../../services/commentService';
import MentionInput from './MentionInput';
import CommentItem from './CommentItem';
import Spinner from '../ui/Spinner';
import { MessageCircle, Send } from 'lucide-react';

/**
 * Hiển thị toàn bộ section comments của 1 task.
 *
 * @param {number}  taskId      - ID task
 * @param {number}  projectId   - ID project (để gọi suggestMembers)
 * @param {object}  currentUser - user đang đăng nhập
 */
const CommentList = ({ taskId, projectId, currentUser }) => {
  const [comments, setComments]     = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading]       = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch comments khi mở ────────────────────────────────────────────────
  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    commentService.getByTask(taskId)
      .then(({ data }) => setComments(data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [taskId]);

  // ── Tạo comment mới (Optimistic UI) ─────────────────────────────────────
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!newComment.trim() || submitting) return;

    const text = newComment.trim();

    // Optimistic: thêm ngay vào danh sách
    const tempId = `temp-${Date.now()}`;
    const tempComment = {
      id: tempId,
      content: text,
      taskId,
      author: {
        id: currentUser?.id,
        username: currentUser?.username,
        fullName: currentUser?.fullName || currentUser?.username,
      },
      mentions: [],
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    setComments((prev) => [...prev, tempComment]);
    setNewComment('');
    setSubmitting(true);

    try {
      const { data } = await commentService.create(taskId, text);
      // Thay temp bằng dữ liệu thật từ server (có mentions đầy đủ)
      setComments((prev) => prev.map((c) => (c.id === tempId ? data?.data : c)));
    } catch {
      // Rollback optimistic
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setNewComment(text);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdated = (updated) => {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDeleted = (deletedId) => {
    setComments((prev) => prev.filter((c) => c.id !== deletedId));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <h4 className="text-xs font-semibold text-warm-gray uppercase tracking-wide flex items-center gap-1.5">
        <MessageCircle size={14} />
        Bình luận ({comments.length})
      </h4>

      {/* Comment list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scroll-smooth">
          {comments.length === 0 && (
            <p className="text-xs text-warm-muted text-center py-4 italic">
              Chưa có bình luận nào. Hãy là người đầu tiên!
            </p>
          )}
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUser={currentUser}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1">
          <MentionInput
            value={newComment}
            onChange={setNewComment}
            onSubmit={handleSubmit}
            projectId={projectId}
            disabled={submitting}
          />
        </div>
        <button
          type="submit"
          className="btn-primary px-3 py-2 flex-shrink-0 self-end"
          disabled={submitting || !newComment.trim()}
        >
          <Send size={14} />
        </button>
      </form>
      <p className="text-[10px] text-warm-muted">
        Nhấn <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Enter</kbd> để gửi,{' '}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Shift+Enter</kbd> để xuống dòng,{' '}
        dùng <span className="font-mono">@</span> để nhắc đến thành viên.
      </p>
    </div>
  );
};

export default CommentList;
