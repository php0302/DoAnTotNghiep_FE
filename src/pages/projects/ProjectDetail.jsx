import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/userService';
import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../context/AuthContext';
import KanbanBoard from '../../components/kanban/KanbanBoard';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import { ArrowLeft, Plus, Users } from 'lucide-react';

const ProjectDetail = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const [project, setProject]         = useState(null);
  const [members, setMembers]         = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask]   = useState(null);
  const [createStatus, setCreateStatus] = useState(null); // status mặc định khi mở modal tạo task
  const [projLoading, setProjLoading]   = useState(true);

  const { tasks, loading, error, fetchTasks, getTasksByStatus, moveTask, createTask, updateTask, deleteTask } = useTasks(Number(id));

  useEffect(() => {
    // Load project info
    projectService.getById(id)
      .then(({ data }) => setProject(data?.data))
      .catch(() => navigate('/'))
      .finally(() => setProjLoading(false));

    // Load project members để dùng cho "giao task"
    projectService.getMembers(id)
      .then(({ data }) => setMembers(data?.data ?? []))
      .catch(() => {});

    fetchTasks();
  }, [id]);

  /** Xử lý kết quả drag & drop */
  const isAdminOrManager = ['ADMIN', 'ROLE_ADMIN', 'PROJECT_MANAGER', 'ROLE_PROJECT_MANAGER'].includes(user?.role);

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const taskId    = Number(draggableId);
    const newStatus = destination.droppableId;

    // Kiểm tra quyền: chỉ người được giao task hoặc admin/pm mới kéo được
    const task = tasks.find((t) => t.id === taskId);
    if (!isAdminOrManager && task?.assignedToId !== user?.id) return;

    moveTask(taskId, newStatus);
  };

  /** Grouping tasks theo status */
  const tasksByStatus = {
    TODO:        getTasksByStatus('TODO'),
    IN_PROGRESS: getTasksByStatus('IN_PROGRESS'),
    DONE:        getTasksByStatus('DONE'),
  };

  if (projLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="btn-ghost p-2 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900" style={{ letterSpacing: '-0.5px' }}>
              {project?.name ?? 'Dự án'}
            </h2>
            {project?.description && (
              <p className="text-xs text-warm-gray mt-0.5">{project.description}</p>
            )}
          </div>
        </div>

        {/* Members + add task */}
        <div className="flex items-center gap-3">
          {/* Member stack */}
          <div className="flex items-center gap-1">
            <Users size={14} className="text-warm-muted" />
            <div className="flex -space-x-2 ml-1">
              {(project?.members ?? []).slice(0, 5).map((m, i) => (
                <Avatar key={m.id ?? i} name={m.fullName || m.username} size="sm" className="border-2 border-white" />
              ))}
            </div>
          </div>

          <button
            onClick={() => setCreateStatus('TODO')}
            className="btn-primary text-sm"
          >
            <Plus size={15} /> Thêm task
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* ── Kanban Board ── */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <KanbanBoard
          tasksByStatus={tasksByStatus}
          onDragEnd={handleDragEnd}
          onTaskClick={setSelectedTask}
          onAddTask={(status) => setCreateStatus(status)}
          currentUserId={user?.id}
          isAdminOrManager={isAdminOrManager}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          onDelete={deleteTask}
          onEdit={(task) => { setSelectedTask(null); setEditingTask(task); }}
          currentUser={user}
          projectId={Number(id)}
        />
      )}

      {/* Create / Edit Task Modal */}
      {(createStatus !== null || editingTask !== null) && (
        <CreateTaskModal
          open
          onClose={() => { setCreateStatus(null); setEditingTask(null); }}
          onCreate={createTask}
          onUpdate={updateTask}
          task={editingTask}
          defaultStatus={createStatus || editingTask?.status || 'TODO'}
          members={members}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
