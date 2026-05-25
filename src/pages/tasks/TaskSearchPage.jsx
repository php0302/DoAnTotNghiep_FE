import React, { useState } from 'react';
import { Search, AlertCircle, Calendar, ChevronLeft, ChevronRight, CheckSquare, Loader2 } from 'lucide-react';
import { useTaskFilter } from '../../hooks/useTaskFilter';
import TaskFilterBar from '../../components/tasks/TaskFilterBar';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';
import { useAuth } from '../../context/AuthContext';

// ─── Constants ──────────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  HIGH:   { label: 'Cao',        cls: 'badge-red',  dot: 'bg-red-500' },
  MEDIUM: { label: 'Trung bình', cls: 'badge-warn', dot: 'bg-orange-400' },
  LOW:    { label: 'Thấp',       cls: 'badge-gray', dot: 'bg-gray-400' },
};
const STATUS_CONFIG = {
  TODO:        { label: 'Cần làm',   cls: 'badge-gray',  bar: 'bg-gray-400' },
  IN_PROGRESS: { label: 'Đang làm',  cls: 'badge-blue',  bar: 'bg-blue-500' },
  DONE:        { label: 'Hoàn thành',cls: 'badge-green', bar: 'bg-green-500' },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Skeleton loading row */
const SkeletonRow = () => (
  <div className="bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-4 animate-pulse">
    <div className="w-2 h-8 rounded-full bg-gray-200 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-gray-200 rounded w-2/3" />
      <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded w-1/4" />
    </div>
    <div className="w-16 h-5 bg-gray-200 rounded-full" />
    <div className="w-14 h-5 bg-gray-200 rounded-full" />
    <div className="w-20 h-4 bg-gray-100 dark:bg-slate-700 rounded" />
  </div>
);

/** Empty state */
const EmptyState = ({ hasFilters }) => (
  <div className="text-center py-20 bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-2xl">
    <div className="w-16 h-16 bg-warm-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
      {hasFilters
        ? <Search size={28} className="text-warm-muted dark:text-gray-500 opacity-50" />
        : <CheckSquare size={28} className="text-warm-muted dark:text-gray-500 opacity-50" />
      }
    </div>
    <p className="font-semibold text-gray-900 dark:text-white mb-1">
      {hasFilters ? 'Không tìm thấy task nào' : 'Chưa có task nào'}
    </p>
    <p className="text-sm text-warm-muted dark:text-gray-500">
      {hasFilters ? 'Thử thay đổi từ khóa hoặc bộ lọc' : 'Tất cả task sẽ xuất hiện ở đây'}
    </p>
  </div>
);

/** Pagination controls */
const Pagination = ({ result, goToPage }) => {
  if (result.totalPages <= 1) return null;
  const { page, totalPages, totalElements, size } = result;
  const from = page * size + 1;
  const to   = Math.min(from + size - 1, totalElements);

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-warm-muted dark:text-gray-500">
        Hiển thị <span className="font-semibold text-gray-900 dark:text-white">{from}–{to}</span> / <span className="font-semibold text-gray-900 dark:text-white">{totalElements}</span> task
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={result.first}
          className="p-1.5 rounded-lg hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page numbers */}
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let pageNum;
          if (totalPages <= 7) {
            pageNum = i;
          } else if (page < 4) {
            pageNum = i < 5 ? i : i === 5 ? -1 : totalPages - 1;
          } else if (page > totalPages - 5) {
            pageNum = i === 0 ? 0 : i === 1 ? -1 : totalPages - 7 + i;
          } else {
            pageNum = i === 0 ? 0 : i === 1 ? -1 : i === 5 ? -1 : i === 6 ? totalPages - 1 : page - 2 + (i - 2);
          }
          if (pageNum === -1) return <span key={`ellipsis-${i}`} className="px-1 text-warm-muted dark:text-gray-500">…</span>;
          return (
            <button
              key={pageNum}
              onClick={() => goToPage(pageNum)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                pageNum === page
                  ? 'bg-primary text-white'
                  : 'hover:bg-black/5 text-warm-gray dark:text-gray-400'
              }`}
            >
              {pageNum + 1}
            </button>
          );
        })}

        <button
          onClick={() => goToPage(page + 1)}
          disabled={result.last}
          className="p-1.5 rounded-lg hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const TaskSearchPage = () => {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState(null);

  const {
    filters, pagination, result, loading, error, activeFilterCount,
    setKeyword, setFilter, resetFilters, setSort, goToPage,
  } = useTaskFilter();

  const hasActiveFilters = activeFilterCount > 0 || !!filters.keyword;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ letterSpacing: '-0.5px' }}>
            Tìm kiếm Task
          </h1>
          <p className="text-warm-gray dark:text-gray-400 text-sm mt-1">
            Tìm kiếm và lọc task theo nhiều tiêu chí
          </p>
        </div>

        {/* Result count badge */}
        {!loading && result.totalElements > 0 && (
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-medium">
            <CheckSquare size={14} />
            <span>{result.totalElements} kết quả</span>
            {loading && <Loader2 size={12} className="animate-spin" />}
          </div>
        )}
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-2xl p-4 shadow-sm">
        <TaskFilterBar
          filters={filters}
          pagination={pagination}
          activeFilterCount={activeFilterCount}
          setKeyword={setKeyword}
          setFilter={setFilter}
          resetFilters={resetFilters}
          setSort={setSort}
        />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-danger rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Task List ── */}
      <div className="space-y-2">
        {loading ? (
          // Skeleton rows
          Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
        ) : result.content.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} />
        ) : (
          result.content.map((task) => {
            const isOverdue = task.deadline
              && new Date(task.deadline) < new Date()
              && task.status !== 'DONE';
            const pri = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.MEDIUM;
            const sta = STATUS_CONFIG[task.status]    ?? STATUS_CONFIG.TODO;

            return (
              <div
                key={task.id}
                id={`task-row-${task.id}`}
                onClick={() => setSelectedTask(task)}
                className="bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-4
                           hover:shadow-card cursor-pointer transition-all group hover:border-primary/30"
              >
                {/* Status bar */}
                <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${sta.bar}`} />

                {/* Title + project + assignee */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium text-gray-900 dark:text-white truncate
                    ${task.status === 'DONE' ? 'line-through text-warm-gray dark:text-gray-400' : 'group-hover:text-primary transition-colors'}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {task.projectName && (
                      <span className="text-xs text-warm-muted dark:text-gray-500 truncate">{task.projectName}</span>
                    )}
                    {task.projectName && task.assignedToName && (
                      <span className="text-warm-muted dark:text-gray-500 text-xs">·</span>
                    )}
                    {task.assignedToName && (
                      <span className="text-xs text-warm-muted dark:text-gray-500 truncate">👤 {task.assignedToName}</span>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.priority && (
                    <span className={`${pri.cls} flex items-center gap-1`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
                      {pri.label}
                    </span>
                  )}
                  <span className={sta.cls}>{sta.label}</span>
                </div>

                {/* Deadline */}
                {task.deadline && (
                  <div className={`flex items-center gap-1 text-xs flex-shrink-0 font-medium
                    ${isOverdue ? 'text-danger' : 'text-warm-muted dark:text-gray-500'}`}>
                    {isOverdue && <AlertCircle size={12} />}
                    <Calendar size={12} />
                    {new Date(task.deadline).toLocaleDateString('vi-VN')}
                    {isOverdue && <span className="ml-0.5 badge-red px-1.5 py-0">Quá hạn</span>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && <Pagination result={result} goToPage={goToPage} />}

      {/* ── Task Detail Modal ── */}
      {selectedTask && (
        <TaskDetailModal
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={result.content.find((t) => t.id === selectedTask.id) || selectedTask}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default TaskSearchPage;
