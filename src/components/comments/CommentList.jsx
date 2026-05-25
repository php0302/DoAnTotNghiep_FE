import React, { useState, useEffect, useRef } from 'react';
import { commentService } from '../../services/commentService';
import MentionInput from './MentionInput';
import CommentItem from './CommentItem';
import Spinner from '../ui/Spinner';
import { MessageCircle, Send } from 'lucide-react';

/**
 * Hiển thị toàn bộ section comments của 1 task.
 * Hỗ trợ realtime: tự động append comment mới từ user khác qua WebSocket.
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
  const commentsEndRef              = useRef(null);

  // ── Fetch comments khi mở ────────────────────────────────────────────────
  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    commentService.getByTask(taskId)
      .then(({ data }) => setComments(data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [taskId]);

  // ── Realtime: lắng nghe comment mới từ user khác ──────────────────────────
  // useProjectRealtime phát CustomEvent 'ws:comment-created' khi nhận WS message
  useEffect(() => {
    if (!taskId) return;

    const handleNewComment = (e) => {
      const { comment, taskId: eventTaskId } = e.detail ?? {};
      // Chỉ xử lý nếu comment thuộc task đang mở
      if (Number(eventTaskId) !== Number(taskId)) return;
      // Nếu là comment của chính mình → đã được optimistic update rồi, bỏ qua
      if (comment?.author?.id === currentUser?.id) return;

      setComments((prev) => {
        // Chống duplicate
        if (prev.some((c) => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
      // Scroll xuống comment mới
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };

    window.addEventListener('ws:comment-created', handleNewComment);
    return () => window.removeEventListener('ws:comment-created', handleNewComment);
  }, [taskId, currentUser?.id]);

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
      <h4 className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
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
            <p className="text-xs text-warm-muted dark:text-gray-500 text-center py-4 italic">
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
          {/* Anchor để scroll tới khi có comment mới */}
          <div ref={commentsEndRef} />
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
      <p className="text-[10px] text-warm-muted dark:text-gray-500">
        Nhấn <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-[10px]">Enter</kbd> để gửi,{' '}
        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-[10px]">Shift+Enter</kbd> để xuống dòng,{' '}
        dùng <span className="font-mono">@</span> để nhắc đến thành viên.
      </p>
    </div>
  );
};

export default CommentList;
