import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { taskService } from '../services/taskService';
import ProjectCard from '../components/projects/ProjectCard';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import EditProjectModal from '../components/projects/EditProjectModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Spinner from '../components/ui/Spinner';
import { Plus, FolderKanban, CheckSquare, TrendingUp, Clock } from 'lucide-react';

const Dashboard = () => {
  const { user }          = useAuth();
  const { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject } = useProjects();
  const [myTasks, setMyTasks]       = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // project đang được edit
  const [deleteTarget, setDeleteTarget] = useState(null); // id của project đang chờ xoá

  const canManage = ['ADMIN', 'ROLE_ADMIN', 'PROJECT_MANAGER', 'ROLE_PROJECT_MANAGER'].includes(user?.role);

  useEffect(() => {
    fetchProjects();
    taskService.getMyTasks()
      .then(({ data }) => setMyTasks(data?.data ?? []))
      .catch(() => {});
  }, [fetchProjects]);

  const totalTasks     = myTasks.length;
  const doneTasks      = myTasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasks = myTasks.filter((t) => t.status === 'IN_PROGRESS').length;

  const stats = [
    { label: 'Dự án',          value: projects.length,  icon: FolderKanban, color: 'text-primary',  bg: 'bg-primary-light' },
    { label: 'Tổng task',      value: totalTasks,        icon: CheckSquare,  color: 'text-teal',     bg: 'bg-teal/10' },
    { label: 'Đang thực hiện', value: inProgressTasks,   icon: Clock,        color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Hoàn thành',     value: doneTasks,         icon: TrendingUp,   color: 'text-success',  bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.5px' }}>
          Chào {user?.fullName || user?.username || 'bạn'} 👋
        </h2>
        <p className="text-warm-gray text-sm mt-1">Đây là tổng quan công việc của bạn hôm nay.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-warm-gray uppercase tracking-wide">{label}</span>
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon size={16} className={color} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900" style={{ letterSpacing: '-1px' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Projects section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Dự án của bạn</h3>
          <button onClick={() => setCreateOpen(true)} className="btn-primary text-sm">
            <Plus size={16} /> Tạo dự án
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : error ? (
          <div className="text-center py-12 text-danger bg-red-50 rounded-xl border border-red-200 text-sm">{error}</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-white border border-black/10 rounded-2xl">
            <FolderKanban size={40} className="text-warm-muted mx-auto mb-3 opacity-50" />
            <p className="text-warm-gray font-medium">Chưa có dự án nào</p>
            <p className="text-warm-muted text-sm mt-1">Tạo dự án đầu tiên để bắt đầu!</p>
            <button onClick={() => setCreateOpen(true)} className="btn-primary mt-4">
              <Plus size={16} /> Tạo dự án
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onEdit={setEditTarget}
                onDelete={() => setDeleteTarget(p.id)}
                canManage={canManage}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create project modal */}
      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={createProject} />

      {/* Edit project modal */}
      <EditProjectModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        project={editTarget}
        onSave={updateProject}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Xóa dự án"
        content="Bạn có chắc chắn muốn xóa dự án này? Thao tác này sẽ xóa tất cả task và bình luận bên trong, và KHÔNG THỂ hoàn tác!"
        danger={true}
        confirmText="Xóa Dự Án"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteProject(deleteTarget);
        }}
      />
    </div>
  );
};

export default Dashboard;
