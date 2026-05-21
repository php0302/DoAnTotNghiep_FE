import { useState, useEffect, useCallback, useRef } from 'react';
import { taskService } from '../services/taskService';
import websocketService from '../services/websocketService';

/**
 * Custom hook quản lý toàn bộ state cho chức năng Search & Filter Task.
 * Bao gồm: debounced search, filter state, pagination, sorting, và API fetching.
 */
const DEFAULT_FILTERS = {
  keyword:    '',
  status:     '',
  priority:   '',
  assigneeId: '',
  projectId:  '',
  startDate:  '',
  endDate:    '',
  overdue:    false,
};

const DEFAULT_PAGINATION = {
  page:    0,
  size:    20,
  sortBy:  'createdAt',
  sortDir: 'DESC',
};

export function useTaskFilter() {
  const [filters, setFilters]       = useState(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  // Kết quả từ API
  const [result, setResult] = useState({
    content:       [],
    totalElements: 0,
    totalPages:    0,
    page:          0,
    size:          20,
    first:         true,
    last:          true,
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Debounce keyword: chờ 400ms sau lần nhập cuối mới gọi API
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const debounceTimer = useRef(null);

  // Cập nhật keyword với debounce
  const setKeyword = useCallback((kw) => {
    setFilters(prev => ({ ...prev, keyword: kw }));
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedKeyword(kw);
      setPagination(prev => ({ ...prev, page: 0 })); // reset về trang 1 khi search
    }, 400);
  }, []);

  // Cập nhật một filter (không phải keyword)
  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 0 })); // reset về trang 1 khi filter thay đổi
  }, []);

  // Xóa tất cả filter
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setDebouncedKeyword('');
    setPagination(DEFAULT_PAGINATION);
  }, []);

  // Đếm số filter đang active (trừ keyword vì hiển thị riêng)
  const activeFilterCount = Object.entries(filters).filter(
    ([key, val]) => key !== 'keyword' && val !== '' && val !== false && val !== null
  ).length;

  // Sort
  const setSort = useCallback((sortBy, sortDir) => {
    setPagination(prev => ({ ...prev, sortBy, sortDir, page: 0 }));
  }, []);

  // Pagination
  const goToPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((size) => {
    setPagination(prev => ({ ...prev, size, page: 0 }));
  }, []);

  // ── Fetch data khi bất kỳ filter/pagination thay đổi ──────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = {
      keyword:    debouncedKeyword || undefined,
      status:     filters.status     || undefined,
      priority:   filters.priority   || undefined,
      assigneeId: filters.assigneeId || undefined,
      projectId:  filters.projectId  || undefined,
      startDate:  filters.startDate  || undefined,
      endDate:    filters.endDate    || undefined,
      overdue:    filters.overdue    || undefined,
      page:       pagination.page,
      size:       pagination.size,
      sortBy:     pagination.sortBy,
      sortDir:    pagination.sortDir,
    };

    taskService.search(params)
      .then(({ data }) => {
        if (!cancelled) {
          setResult(data?.data ?? {
            content: [], totalElements: 0, totalPages: 0,
            page: 0, size: 20, first: true, last: true,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.message ?? 'Lỗi tải dữ liệu');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [debouncedKeyword, filters.status, filters.priority, filters.assigneeId,
      filters.projectId, filters.startDate, filters.endDate, filters.overdue,
      pagination.page, pagination.size, pagination.sortBy, pagination.sortDir]);

  // ── Realtime WebSocket updates for search results ──────────────────────────
  useEffect(() => {
    const tasks = result.content;
    const projectIds = [...new Set(tasks.map((t) => t.projectId).filter(Boolean))];
    if (projectIds.length === 0) return;

    const handleRealtimeMessage = (msg) => {
      if (!msg?.type) return;
      if (msg.type === 'TASK_STATUS_CHANGED' && msg.data?.id) {
        setResult((prev) => ({
          ...prev,
          content: prev.content.map((t) =>
            t.id === msg.data.id ? { ...t, status: msg.data.status } : t
          ),
        }));
      } else if (msg.type === 'TASK_UPDATED' && msg.data?.id) {
        setResult((prev) => ({
          ...prev,
          content: prev.content.map((t) =>
            t.id === msg.data.id ? { ...t, ...msg.data } : t
          ),
        }));
      } else if (msg.type === 'TASK_DELETED' && msg.data?.taskId) {
        setResult((prev) => ({
          ...prev,
          content: prev.content.filter((t) => t.id !== msg.data.taskId),
          totalElements: Math.max(0, prev.totalElements - 1),
        }));
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
  }, [result.content.map((t) => t.projectId).filter(Boolean).sort().join(',')]);

  return {
    // State
    filters,
    pagination,
    result,
    loading,
    error,
    activeFilterCount,

    // Actions
    setKeyword,
    setFilter,
    resetFilters,
    setSort,
    goToPage,
    setPageSize,
  };
}
