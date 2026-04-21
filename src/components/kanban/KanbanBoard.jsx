import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import KanbanColumn from './KanbanColumn';

const COLUMNS = ['TODO', 'IN_PROGRESS', 'DONE'];

/**
 * KanbanBoard — wrapper DragDropContext + render 3 columns
 * @param {object} tasksByStatus  - { TODO: [], IN_PROGRESS: [], DONE: [] }
 * @param {function} onDragEnd    - callback sau khi kéo thả
 * @param {function} onTaskClick  - mở task detail modal
 * @param {function} onAddTask    - mở create task modal với status được chọn
 */
const KanbanBoard = ({ tasksByStatus, onDragEnd, onTaskClick, onAddTask, currentUserId, isAdminOrManager }) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 min-h-0">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status] ?? []}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
            currentUserId={currentUserId}
            isAdminOrManager={isAdminOrManager}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
