import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';

/** Config từng column */
const COLUMN_CONFIG = {
  TODO:        { label: 'Cần làm',      dot: 'bg-warm-muted',  header: 'bg-warm-white dark:bg-slate-800' },
  IN_PROGRESS: { label: 'Đang làm',     dot: 'bg-primary',     header: 'bg-primary-light dark:bg-primary/20' },
  DONE:        { label: 'Hoàn thành',   dot: 'bg-success',     header: 'bg-green-50 dark:bg-green-500/20' },
};

/**
 * Kanban column — chứa danh sách TaskCard + Droppable zone
 */
const KanbanColumn = ({ status, tasks = [], onTaskClick, onAddTask, currentUserId, isAdminOrManager }) => {
  const cfg = COLUMN_CONFIG[status] ?? { label: status, dot: 'bg-gray-300', header: 'bg-gray-50 dark:bg-slate-800/80' };

  return (
    <div className="kanban-col flex-shrink-0">
      {/* Column header */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl ${cfg.header} border-b border-black/10 dark:border-white/10`}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{cfg.label}</span>
          <span className="badge-gray">{tasks.length}</span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="btn-ghost p-1 rounded-lg text-warm-gray dark:text-gray-400 hover:text-primary"
          title="Thêm task"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Droppable zone */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 flex flex-col gap-2 p-3 overflow-y-auto min-h-32 transition-colors duration-150 rounded-b-xl
              ${snapshot.isDraggingOver ? 'bg-primary-light/40' : ''}`}
            style={{ maxHeight: 'calc(100vh - 280px)' }}
          >
            {tasks.map((task, i) => {
              const canDrag = isAdminOrManager || task.assignedToId === currentUserId;
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={i}
                  onClick={onTaskClick}
                  canDrag={canDrag}
                />
              );
            })}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-8 text-warm-muted dark:text-gray-500 opacity-60">
                <p className="text-xs">Chưa có task</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
