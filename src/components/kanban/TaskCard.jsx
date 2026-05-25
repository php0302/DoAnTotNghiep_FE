import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, AlertCircle, User, Lock } from 'lucide-react';
import Avatar from '../ui/Avatar';

/** Màu priority badge */
const PRIORITY_BADGE = {
  HIGH:   'badge-warn',
  MEDIUM: 'badge-blue',
  LOW:    'badge-gray',
};

const PRIORITY_LABEL = {
  HIGH:   '🟠 Cao',
  MEDIUM: '🟡 Trung bình',
  LOW:    '⚪ Thấp',
};

/**
 * Task card dùng trong Kanban - hỗ trợ Drag & Drop
 * @param {boolean} canDrag - Người dùng hiện tại có quyền kéo task này không
 */
const TaskCard = ({ task, index, onClick, canDrag = false }) => {
  const { id, title, priority, deadline, assignedToName } = task;

  const isOverdue = deadline && new Date(deadline) < new Date();

  return (
    <Draggable draggableId={String(id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...(canDrag ? provided.dragHandleProps : {})} // Chỉ gán dragHandle nếu có quyền
          onClick={() => onClick(task)}
          className={`task-card relative
            ${snapshot.isDragging ? 'ring-2 ring-primary/40 shadow-deep rotate-1' : ''}
            ${!canDrag ? 'cursor-default opacity-90' : 'cursor-grab'}
          `}
        >
          {/* Lock icon nếu không có quyền kéo */}
          {!canDrag && (
            <span className="absolute top-2 right-2 text-warm-muted dark:text-gray-500/50" title="Chỉ người được giao task mới có thể thay đổi trạng thái">
              <Lock size={11} />
            </span>
          )}

          {/* Priority badge */}
          {priority && (
            <span className={`${PRIORITY_BADGE[priority] ?? 'badge-gray'} mb-2 inline-block`}>
              {PRIORITY_LABEL[priority] ?? priority}
            </span>
          )}

          {/* Title */}
          <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug mb-3">{title}</p>

          {/* Footer: deadline + assignee */}
          <div className="flex items-center justify-between mt-auto">
            {deadline ? (
              <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-danger font-semibold' : 'text-warm-muted dark:text-gray-500'}`}>
                <Calendar size={12} />
                {new Date(deadline).toLocaleDateString('vi-VN')}
                {isOverdue && <AlertCircle size={12} />}
              </div>
            ) : (
              <span />
            )}

            {assignedToName ? (
              <Avatar name={assignedToName} size="xs" />
            ) : (
              <User size={14} className="text-warm-muted dark:text-gray-500" />
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
