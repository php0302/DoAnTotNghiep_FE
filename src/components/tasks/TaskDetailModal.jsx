import React from 'react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import CommentList from '../comments/CommentList';
import WorkLogList from '../worklogs/WorkLogList';
import AttachmentPanel from '../attachments/AttachmentPanel';
import { Calendar, Flag, User, Edit2, Trash2, MessageSquare, Clock, Paperclip } from 'lucide-react';

const PRIORITY_BADGE  = { HIGH: 'badge-warn', MEDIUM: 'badge-blue', LOW: 'badge-gray' };
const PRIORITY_LABELS = { LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao' };
const STATUS_BADGE    = {
  TODO: 'badge-gray',
  IN_PROGRESS: 'badge-blue',
  IN_REVIEW: 'badge-warn',
  TESTING: 'badge-indigo',
  DONE: 'badge-green',
  BLOCKED: 'badge-danger'
};
const STATUS_LABELS   = {
  TODO: 'Cần làm',
  IN_PROGRESS: 'Đang làm',
  IN_REVIEW: 'Chờ review',
  TESTING: 'Đang test',
  DONE: 'Hoàn thành',
  BLOCKED: 'Tạm dừng'
};

/**
 * Task Detail Modal — chi tiết task + comment/mention
 *
 * @param {boolean}  open
 * @param {function} onClose
 * @param {object}   task        - task object
 * @param {function} onDelete    - (taskId) => void
 * @param {function} onEdit      - (task) => void
 * @param {object}   currentUser - user đang đăng nhập
 * @param {number}   projectId   - ID project (dùng cho MentionInput)
 */
const TaskDetailModal = ({ open, onClose, task, onDelete, onEdit, currentUser, projectId }) => {
  if (!task) return null;

  const isAdminOrManager = ['ADMIN', 'ROLE_ADMIN', 'PROJECT_MANAGER', 'ROLE_PROJECT_MANAGER']
    .includes(currentUser?.role);

  const [activeTab, setActiveTab] = React.useState('comments');

  return (
    <Modal open={open} onClose={onClose} title={task.title} size="xl">
      <div className="flex gap-6">
        {/* ── Cột trái: mô tả + comments ── */}
        <div className="flex-1 space-y-5 min-w-0">
          {/* Mô tả */}
          <div>
            <h4 className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide mb-2">
              Mô tả
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed bg-warm-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-lg p-3 min-h-[60px]">
              {task.description || (
                <span className="text-warm-muted dark:text-gray-500 italic">Chưa có mô tả</span>
              )}
            </p>
          </div>

          {/* Tabs: Bình luận / Đính kèm / Thời gian */}
          <div className="border-b border-black/10 dark:border-white/10 flex gap-4">
            <button
              onClick={() => setActiveTab('comments')}
              className={`pb-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'comments' ? 'border-primary text-primary' : 'border-transparent text-warm-gray dark:text-gray-400 hover:text-gray-800 dark:text-gray-100'
              }`}
            >
              <MessageSquare size={16} /> Bình luận
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`pb-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'attachments' ? 'border-primary text-primary' : 'border-transparent text-warm-gray dark:text-gray-400 hover:text-gray-800 dark:text-gray-100'
              }`}
            >
              <Paperclip size={16} /> Đính kèm
            </button>
            <button
              onClick={() => setActiveTab('worklogs')}
              className={`pb-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'worklogs' ? 'border-primary text-primary' : 'border-transparent text-warm-gray dark:text-gray-400 hover:text-gray-800 dark:text-gray-100'
              }`}
            >
              <Clock size={16} /> Ghi nhận thời gian
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[200px]">
            {activeTab === 'comments' && (
              <CommentList
                taskId={task.id}
                projectId={projectId || task.projectId}
                currentUser={currentUser}
              />
            )}
            {activeTab === 'attachments' && (
              <AttachmentPanel
                taskId={task.id}
                currentUserId={currentUser?.id}
                isAdmin={['ADMIN', 'ROLE_ADMIN'].includes(currentUser?.role)}
              />
            )}
            {activeTab === 'worklogs' && (
              <WorkLogList
                task={task}
                currentUser={currentUser}
              />
            )}
          </div>
        </div>

        {/* ── Cột phải: metadata + actions ── */}
        <div className="w-52 flex-shrink-0 space-y-4 border-l border-black/10 dark:border-white/10 pl-6">
          <MetaRow icon={<Flag size={14} />} label="Ưu tiên">
            <span className={PRIORITY_BADGE[task.priority] ?? 'badge-gray'}>
              {PRIORITY_LABELS[task.priority] ?? task.priority ?? '—'}
            </span>
          </MetaRow>

          <MetaRow icon={<Flag size={14} />} label="Trạng thái">
            <span className={STATUS_BADGE[task.status] ?? 'badge-gray'}>
              {STATUS_LABELS[task.status] ?? task.status ?? '—'}
            </span>
          </MetaRow>

          <MetaRow icon={<User size={14} />} label="Được giao cho">
            {task.assignedToName ? (
              <div className="flex items-center gap-1.5">
                <Avatar name={task.assignedToName} size="xs" />
                <span className="text-sm text-gray-800 dark:text-gray-100 truncate">
                  {task.assignedToName}
                </span>
              </div>
            ) : (
              <span className="text-sm text-warm-muted dark:text-gray-500">Chưa giao</span>
            )}
          </MetaRow>

          <MetaRow icon={<Calendar size={14} />} label="Deadline">
            {task.deadline ? (
              <span className="text-sm text-gray-800 dark:text-gray-100">
                {new Date(task.deadline).toLocaleDateString('vi-VN')}
              </span>
            ) : (
              <span className="text-sm text-warm-muted dark:text-gray-500">Chưa đặt</span>
            )}
          </MetaRow>

          {/* Edit / Delete — chỉ Admin & PM */}
          {isAdminOrManager && (
            <div className="pt-4 mt-2 border-t border-black/10 dark:border-white/10 space-y-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(task)}
                  className="btn-secondary w-full text-xs justify-center"
                >
                  <Edit2 size={13} /> Sửa task
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { onDelete(task.id); onClose(); }}
                  className="btn-danger w-full text-xs justify-center"
                >
                  <Trash2 size={13} /> Xoá task
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

const MetaRow = ({ icon, label, children }) => (
  <div>
    <div className="flex items-center gap-1.5 text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide mb-1.5">
      {icon} {label}
    </div>
    {children}
  </div>
);

export default TaskDetailModal;
