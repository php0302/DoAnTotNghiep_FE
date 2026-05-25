import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, Trash2, Pencil } from 'lucide-react';
import Avatar from '../ui/Avatar';

/** Màu tiến độ theo phần trăm */
const progressColor = (pct) => {
  if (pct >= 80) return 'bg-success';
  if (pct >= 40) return 'bg-primary';
  return 'bg-orange-400';
};

const statusBadge = {
  ACTIVE:    'badge-blue',
  COMPLETED: 'badge-green',
  ARCHIVED:  'badge-gray',
  ON_HOLD:   'badge-warn',
};

const ProjectCard = ({ project, onDelete, onEdit, canManage = false }) => {
  const navigate = useNavigate();
  const { id, name, description, status, members = [], progress = 0, startDate, endDate } = project;

  const pct = Math.min(Math.max(Math.round(progress ?? 0), 0), 100);

  const fmt = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : null;

  return (
    <div 
      className="card p-5 flex flex-col gap-4 group cursor-pointer hover:shadow-md transition-all"
      onClick={() => navigate(`/projects/${id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className={`${statusBadge[status] ?? 'badge-gray'} mb-2 inline-block`}>
            {status ?? 'ACTIVE'}
          </span>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">{name}</h3>
        </div>

        {/* Action buttons — chỉ hiện khi có quyền */}
        {canManage && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit && onEdit(project); }}
              className="btn-ghost p-1.5 text-warm-gray dark:text-gray-400 hover:text-primary hover:bg-blue-50 transition-all"
              title="Chỉnh sửa"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete && onDelete(id); }}
              className="btn-ghost p-1.5 text-warm-gray dark:text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
              title="Xóa dự án"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-warm-gray dark:text-gray-400 leading-relaxed line-clamp-2">{description}</p>
      )}

      {/* Dates */}
      {(startDate || endDate) && (
        <div className="flex items-center gap-3 text-xs text-warm-muted dark:text-gray-500">
          <Calendar size={12} />
          <span>{fmt(startDate)} {endDate ? `→ ${fmt(endDate)}` : ''}</span>
        </div>
      )}

      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-warm-muted dark:text-gray-500">Tiến độ</span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{pct}%</span>
        </div>
        <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor(pct)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Members + Open */}
      <div className="flex items-center justify-between pt-1">
        {/* Avatar stack */}
        <div className="flex -space-x-2">
          {members.slice(0, 4).map((m, i) => (
            <Avatar key={m.id ?? i} name={m.fullName || m.username} size="xs" className="border-2 border-white" />
          ))}
          {members.length > 4 && (
            <div className="w-6 h-6 rounded-full bg-black/5 border-2 border-white flex items-center justify-center text-[10px] font-semibold text-warm-gray dark:text-gray-400">
              +{members.length - 4}
            </div>
          )}
          {members.length === 0 && (
            <span className="text-xs text-warm-muted dark:text-gray-500 italic">Chưa có thành viên</span>
          )}
        </div>

        {/* Open */}
        <button
          onClick={() => navigate(`/projects/${id}`)}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
        >
          Mở <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;
