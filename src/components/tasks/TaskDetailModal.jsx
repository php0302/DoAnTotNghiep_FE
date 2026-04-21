import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';
import { commentService } from '../../services/commentService';
import { Calendar, Flag, User, MessageCircle, Trash2, Send } from 'lucide-react';

const PRIORITY_BADGE = { HIGH: 'badge-warn', MEDIUM: 'badge-blue', LOW: 'badge-gray' };
const STATUS_BADGE   = { TODO: 'badge-gray', IN_PROGRESS: 'badge-blue', DONE: 'badge-green' };
const PRIORITY_LABELS = { LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao' };
const STATUS_LABELS = { TODO: 'Cần làm', IN_PROGRESS: 'Đang làm', DONE: 'Hoàn thành' };

/**
 * Task Detail Modal — hiển thị chi tiết task + bình luận
 */
const TaskDetailModal = ({ open, onClose, task, onDelete, currentUser }) => {
  const [comments, setComments]   = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingCmt, setLoadingCmt] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && task?.id) {
      setLoadingCmt(true);
      commentService.getByTask(task.id)
        .then(({ data }) => setComments(data?.data ?? []))
        .catch(() => {})
        .finally(() => setLoadingCmt(false));
    }
  }, [open, task?.id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await commentService.create(task.id, newComment.trim());
      setComments((prev) => [...prev, data?.data]);
      setNewComment('');
    } catch {}
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId) => {
    await commentService.delete(task.id, commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  if (!task) return null;

  return (
    <Modal open={open} onClose={onClose} title={task.title} size="xl">
      <div className="flex gap-6">
        {/* Left — description + comments */}
        <div className="flex-1 space-y-6">
          <div>
            <h4 className="text-xs font-semibold text-warm-gray uppercase tracking-wide mb-2">Mô tả</h4>
            <p className="text-sm text-gray-700 leading-relaxed bg-warm-white border border-black/10 rounded-lg p-3 min-h-16">
              {task.description || <span className="text-warm-muted italic">Chưa có mô tả</span>}
            </p>
          </div>

          {/* Comments */}
          <div>
            <h4 className="text-xs font-semibold text-warm-gray uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <MessageCircle size={14} /> Bình luận ({comments.length})
            </h4>

            {loadingCmt ? (
              <div className="flex justify-center py-6"><Spinner /></div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5 group">
                    <Avatar name={c.author?.fullName || c.author?.username || 'U'} size="sm" />
                    <div className="flex-1 bg-warm-white border border-black/10 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-800">{c.author?.fullName || c.author?.username}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-warm-muted">
                            {c.createdAt && new Date(c.createdAt).toLocaleString('vi-VN')}
                          </span>
                          {(currentUser?.id === c.author?.id) && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment */}
            <form onSubmit={handleAddComment} className="flex gap-2 mt-3">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="input-field flex-1 text-sm"
                placeholder="Thêm bình luận..."
              />
              <button type="submit" className="btn-primary px-3" disabled={submitting}>
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Right — metadata */}
        <div className="w-52 flex-shrink-0 space-y-5 border-l border-black/10 pl-6">
          <MetaRow icon={<Flag size={14} />} label="Ưu tiên">
            <span className={`${PRIORITY_BADGE[task.priority] ?? 'badge-gray'}`}>{PRIORITY_LABELS[task.priority] ?? task.priority ?? '—'}</span>
          </MetaRow>
          <MetaRow icon={<Flag size={14} />} label="Trạng thái">
            <span className={`${STATUS_BADGE[task.status] ?? 'badge-gray'}`}>{STATUS_LABELS[task.status] ?? task.status ?? '—'}</span>
          </MetaRow>
          <MetaRow icon={<User size={14} />} label="Được giao cho">
            {task.assignee
              ? <div className="flex items-center gap-1.5">
                  <Avatar name={task.assignee.fullName || task.assignee.username} size="xs" />
                  <span className="text-sm text-gray-800">{task.assignee.fullName || task.assignee.username}</span>
                </div>
              : <span className="text-sm text-warm-muted">Chưa giao</span>
            }
          </MetaRow>
          <MetaRow icon={<Calendar size={14} />} label="Deadline">
            {task.deadline
              ? <span className="text-sm text-gray-800">{new Date(task.deadline).toLocaleDateString('vi-VN')}</span>
              : <span className="text-sm text-warm-muted">Chưa đặt</span>
            }
          </MetaRow>

          {/* Delete task */}
          {onDelete && (
            <button
              onClick={() => { onDelete(task.id); onClose(); }}
              className="btn-danger w-full mt-4 text-xs"
            >
              <Trash2 size={14} /> Xóa task
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

/** Helper component cho từng dòng metadata */
const MetaRow = ({ icon, label, children }) => (
  <div>
    <div className="flex items-center gap-1.5 text-xs font-semibold text-warm-gray uppercase tracking-wide mb-1.5">
      {icon} {label}
    </div>
    {children}
  </div>
);

export default TaskDetailModal;
