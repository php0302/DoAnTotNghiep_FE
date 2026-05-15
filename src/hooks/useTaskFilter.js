import { useState, useEffect, useCallback, useRef } from 'react';
import { taskService } from '../services/taskService';

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
