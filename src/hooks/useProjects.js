import { useState, useCallback } from 'react';
import { projectService } from '../services/projectService';

/**
 * Hook quản lý danh sách Projects.
 * Trả về: { projects, loading, error, fetchProjects, createProject, deleteProject }
 */
export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await projectService.getAll();
      setProjects(data?.data ?? []);
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Lỗi tải danh sách dự án');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = async (payload) => {
    const { data } = await projectService.create(payload);
    setProjects((prev) => [data?.data, ...prev]);
    return data?.data;
  };

  const updateProject = async (id, payload) => {
    const { data } = await projectService.update(id, payload);
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...data?.data } : p)));
    return data?.data;
  };

  const deleteProject = async (id) => {
    await projectService.delete(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject };
};
