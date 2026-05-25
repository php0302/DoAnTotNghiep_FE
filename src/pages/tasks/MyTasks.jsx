import React, { useEffect, useState } from 'react';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import { Calendar, Flag, CheckSquare, AlertCircle } from 'lucide-react';

import websocketService from '../../services/websocketService';

const PRIORITY_BADGE = { HIGH: 'badge-warn', MEDIUM: 'badge-blue', LOW: 'badge-gray' };
const STATUS_BADGE = { TODO: 'badge-gray', IN_PROGRESS: 'badge-blue', DONE: 'badge-green' };
const PRIORITY_LABELS = { LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao' };
const STATUS_LABELS = { TODO: 'Cần làm', IN_PROGRESS: 'Đang làm', DONE: 'Hoàn thành' };

const MyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL | TODO | IN_PROGRESS | DONE
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    taskService.getMyTasks()
      .then(({ data }) => setTasks(data?.data ?? []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const projectIds = [...new Set(tasks.map((t) => t.projectId).filter(Boolean))];
    if (projectIds.length === 0) return;

    const handleRealtimeMessage = (msg) => {
      if (!msg?.type) return;
      if (msg.type === 'TASK_STATUS_CHANGED' && msg.data?.id) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === msg.data.id ? { ...t, status: msg.data.status } : t
          )
        );
      } else if (msg.type === 'TASK_UPDATED' && msg.data?.id) {
        setTasks((prev) =>
          prev.map((t) => (t.id === msg.data.id ? { ...t, ...msg.data } : t))
        );
      } else if (msg.type === 'TASK_DELETED' && msg.data?.taskId) {
        setTasks((prev) => prev.filter((t) => t.id !== msg.data.taskId));
      }
    };

    projectIds.forEach((pid) => {
      websocketService.subscribeToProject(pid, handleRealtimeMessage);
    });

    return () => {
      projectIds.forEach((pid) => {
        websocketService.unsubscribeFromProject(pid, handleRealtimeMessage);
      });
    };
  }, [tasks.map(t => t.projectId).filter(Boolean).sort().join(',')]);

  const filtered = filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);

  const FILTERS = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'TODO', label: 'Cần làm' },
    { key: 'IN_PROGRESS', label: 'Đang làm' },
    { key: 'DONE', label: 'Hoàn thành' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ letterSpacing: '-0.5px' }}>Tasks của tôi</h2>
        <p className="text-warm-gray dark:text-gray-400 text-sm mt-1">Tổng cộng {tasks.length} task được giao cho bạn</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-xl p-1 w-fit">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
              ${filter === key
                ? 'bg-primary text-white shadow-sm'
                : 'text-warm-gray dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-warm-white dark:hover:bg-slate-800'
              }`}
          >
            {label}
            <span className="ml-1.5 text-xs">
              {key === 'ALL' ? tasks.length : tasks.filter((t) => t.status === key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-2xl">
          <CheckSquare size={40} className="text-warm-muted dark:text-gray-500 mx-auto mb-3 opacity-40" />
          <p className="text-warm-gray dark:text-gray-400 font-medium">Không có task nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'DONE';
            return (
              <div
                key={task.id}
                onClick={() => setSelected(task)}
                className="bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-4
                           hover:shadow-card cursor-pointer transition-all group"
              >
                {/* Status indicator */}
                <div className={`w-2 h-8 rounded-full flex-shrink-0
                  ${task.status === 'DONE' ? 'bg-success'
                    : task.status === 'IN_PROGRESS' ? 'bg-primary'
                      : 'bg-warm-muted'}`}
                />

                {/* Title + project */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium text-gray-900 dark:text-white ${task.status === 'DONE' ? 'line-through text-warm-gray dark:text-gray-400' : ''}`}>
                    {task.title}
                  </p>
                  {task.projectName && (
                    <p className="text-xs text-warm-muted dark:text-gray-500 mt-0.5">{task.projectName}</p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.priority && (
                    <span className={PRIORITY_BADGE[task.priority] ?? 'badge-gray'}>{PRIORITY_LABELS[task.priority] ?? task.priority}</span>
                  )}
                  <span className={STATUS_BADGE[task.status] ?? 'badge-gray'}>{STATUS_LABELS[task.status] ?? task.status}</span>
                </div>

                {/* Deadline */}
                {task.deadline && (
                  <div className={`flex items-center gap-1 text-xs flex-shrink-0
                    ${isOverdue ? 'text-danger font-semibold' : 'text-warm-muted dark:text-gray-500'}`}>
                    {isOverdue && <AlertCircle size={12} />}
                    <Calendar size={12} />
                    {new Date(task.deadline).toLocaleDateString('vi-VN')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail */}
      {selected && (
        <TaskDetailModal
          open={!!selected}
          onClose={() => setSelected(null)}
          task={tasks.find((t) => t.id === selected.id) || selected}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default MyTasks;
