import { useState, useCallback } from 'react';
import { taskService } from '../services/taskService';

/**
 * Hook quản lý Tasks theo từng project.
 * Columns: TODO | IN_PROGRESS | DONE
 * 
 * Xuất ra `setTasks` để useProjectRealtime có thể apply realtime updates
 * trực tiếp vào state mà không cần re-fetch từ server.
 */
export const useTasks = (projectId) => {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await taskService.getByProject(projectId);
      setTasks(data?.data ?? []);
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Lỗi tải danh sách task');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  /** Lấy tasks theo status column */
  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status);

  /** Cập nhật status sau drag-and-drop */
  const moveTask = async (taskId, newStatus) => {
    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove) return;
    const oldStatus = taskToMove.status;

    setError(null);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );

    try {
      await taskService.updateStatus(taskId, newStatus);
    } catch (e) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: oldStatus } : t)),
      );
      setError(e?.response?.data?.message ?? 'Không thể chuyển trạng thái công việc');
      setTimeout(() => setError(null), 5000);
    }
  };

  const createTask = async (payload) => {
    const { data } = await taskService.create(projectId, payload);
    setTasks((prev) => [...prev, data?.data]);
    return data?.data;
  };

  const updateTask = async (taskId, payload) => {
    const { data } = await taskService.update(taskId, payload);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? data?.data : t)));
    return data?.data;
  };

  const deleteTask = async (taskId) => {
    await taskService.delete(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return {
    tasks,
    setTasks,    // ← Export để useProjectRealtime apply realtime updates
    loading,
    error,
    fetchTasks,
    getTasksByStatus,
    moveTask,
    createTask,
    updateTask,
    deleteTask,
  };
};
