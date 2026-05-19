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
import { Plus, FolderKanban } from 'lucide-react';

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

    // Lắng nghe sự kiện realtime khi được thêm vào project mới hoặc project bị xoá
    const handleNotification = (e) => {
      const notif = e.detail;
      if (notif?.type === 'PROJECT_ASSIGNED' || notif?.type === 'PROJECT_DELETED') {
        console.log(`[Dashboard] Phát hiện event ${notif.type}, đang tải lại danh sách...`);
        fetchProjects();
      }
    };
    window.addEventListener('ws:notification', handleNotification);
    return () => window.removeEventListener('ws:notification', handleNotification);
  }, [fetchProjects]);


  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.5px' }}>
          Chào {user?.fullName || user?.username || 'bạn'} 👋
        </h2>
        <p className="text-warm-gray text-sm mt-1">Đây là tổng quan công việc của bạn hôm nay.</p>
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
