import { useEffect, useRef, useCallback } from 'react';
import websocketService from '../services/websocketService';

/**
 * Hook lắng nghe realtime events của một project qua WebSocket.
 *
 * Khi nhận message từ /topic/project.{projectId}, hook này:
 * - Dùng actorId để lọc bỏ self-events (tránh double update)
 * - Gọi setTasks để cập nhật state Kanban tức thì
 * - Emit custom events cho các component con (VD: TaskDetailModal refresh comments)
 *
 * @param {number}   projectId   - ID của project cần theo dõi
 * @param {function} setTasks    - setState function từ useTasks
 * @param {function} fetchTasks  - refetch function để sync sau reconnect
 * @param {number}   currentUserId - ID user hiện tại (để lọc self-events)
 */
export const useProjectRealtime = (projectId, setTasks, fetchTasks, currentUserId) => {
  // Dùng ref để tránh stale closure
  const setTasksRef    = useRef(setTasks);
  const fetchTasksRef  = useRef(fetchTasks);
  const currentUserRef = useRef(currentUserId);

  useEffect(() => { setTasksRef.current = setTasks; }, [setTasks]);
  useEffect(() => { fetchTasksRef.current = fetchTasks; }, [fetchTasks]);
  useEffect(() => { currentUserRef.current = currentUserId; }, [currentUserId]);

  const handleRealtimeMessage = useCallback((msg) => {
    if (!msg?.type) return;

    // Lọc bỏ self-events: Nếu mình là người kích hoạt → bỏ qua
    // (vì local state đã được optimistic-update trước đó rồi)
    if (msg.actorId && msg.actorId === currentUserRef.current) {
      console.debug(`[Realtime] Skip self-event: ${msg.type}`);
      return;
    }

    console.log(`[Realtime] Event received: ${msg.type}`, msg.data);

    switch (msg.type) {
      case 'TASK_CREATED': {
        const newTask = msg.data;
        if (!newTask?.id) break;
        setTasksRef.current((prev) => {
          // Chống duplicate: nếu task đã tồn tại rồi thì bỏ qua
          if (prev.some((t) => t.id === newTask.id)) return prev;
          return [...prev, newTask];
        });
        break;
      }

      case 'TASK_UPDATED': {
        const updatedTask = msg.data;
        if (!updatedTask?.id) break;
        setTasksRef.current((prev) =>
          prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
        );
        break;
      }

      case 'TASK_STATUS_CHANGED': {
        const changedTask = msg.data;
        if (!changedTask?.id) break;
        setTasksRef.current((prev) =>
          prev.map((t) =>
            t.id === changedTask.id
              ? { ...t, status: changedTask.status }
              : t
          )
        );
        break;
      }

      case 'TASK_DELETED': {
        const taskId = msg.data?.taskId;
        if (!taskId) break;
        setTasksRef.current((prev) => prev.filter((t) => t.id !== taskId));
        break;
      }

      case 'COMMENT_CREATED': {
        // Phát custom event để TaskDetailModal (nếu đang mở) tự refresh comments
        // Dùng CustomEvent thay vì prop drilling qua nhiều tầng
        const comment = msg.data;
        if (!comment?.taskId && !comment?.task?.id) break;
        const taskId = comment.taskId ?? comment.task?.id;
        window.dispatchEvent(
          new CustomEvent('ws:comment-created', {
            detail: { comment, taskId, projectId: msg.projectId },
          })
        );
        break;
      }

      default:
        // Unknown event type — ignore
        break;
    }
  }, []); // deps rỗng vì dùng ref

  useEffect(() => {
    console.log(`[Realtime] Hook mounted with projectId: ${projectId}`);
    if (!projectId) {
      console.log('[Realtime] projectId is falsy, skipping subscription');
      return;
    }

    console.log(`[Realtime] Calling subscribeToProject(${projectId})`);
    // Subscribe to project realtime topic
    websocketService.subscribeToProject(projectId, handleRealtimeMessage);

    // Khi reconnect: fetch lại data để vá khoảng trống event bị miss
    const cleanupReconnect = websocketService.onReconnect(() => {
      console.log(`[Realtime] Reconnected — refetching project ${projectId} tasks`);
      fetchTasksRef.current?.();
    });

    return () => {
      console.log(`[Realtime] Hook unmounted, unsubscribing from project ${projectId}`);
      websocketService.unsubscribeFromProject(projectId);
      cleanupReconnect();
    };
  }, [projectId, handleRealtimeMessage]);
};
