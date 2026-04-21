import React, { useEffect, useState } from 'react';
import { projectService } from '../../services/projectService';
import CreateProjectModal from '../../components/projects/CreateProjectModal';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Plus } from 'lucide-react';
import Button from '../../components/ui/Button';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data.data || []);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async () => {
    // Sau khi tạo xong, refresh list
    await fetchProjects();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 className="text-section-heading">Dự án</h1>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} style={{ marginRight: '4px' }} /> Tạo dự án mới
        </Button>
      </div>

      {loading ? (
        <div className="text-body" style={{ color: 'var(--color-secondary-text)' }}>Đang tải dự án...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {projects.length === 0 ? (
            <div className="text-body" style={{ color: 'var(--color-secondary-text)' }}>Chưa có dự án nào.</div>
          ) : (
            projects.map(project => (
              <Card key={project.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 className="text-card-title">{project.name}</h3>
                  <Badge type={project.status === 'COMPLETED' ? 'success' : 'default'}>
                    {project.status || 'ACTIVE'}
                  </Badge>
                </div>
                <p className="text-body" style={{ color: 'var(--color-secondary-text)', flex: 1 }}>
                  {project.description || 'Chưa có mô tả.'}
                </p>
                <div style={{ borderTop: 'var(--border-whisper)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="secondary">Xem Task</Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
};

export default ProjectList;
