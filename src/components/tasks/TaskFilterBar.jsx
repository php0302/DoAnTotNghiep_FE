import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, ChevronDown, ArrowUpDown } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/userService';

const STATUS_OPTIONS = [
  { value: 'TODO',        label: 'Cần làm' },
  { value: 'IN_PROGRESS', label: 'Đang làm' },
  { value: 'DONE',        label: 'Hoàn thành' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW',    label: '🟢 Thấp' },
  { value: 'MEDIUM', label: '🟡 Trung bình' },
  { value: 'HIGH',   label: '🔴 Cao' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Ngày tạo' },
  { value: 'deadline',  label: 'Deadline' },
  { value: 'priority',  label: 'Ưu tiên' },
  { value: 'status',    label: 'Trạng thái' },
  { value: 'title',     label: 'Tên task' },
];

const DEADLINE_PRESETS = [
  { label: 'Hôm nay',    getRange: () => { const t = today(); return { startDate: t, endDate: t }; } },
  { label: 'Tuần này',   getRange: () => { const t = today(); return { startDate: t, endDate: addDays(t, 7) }; } },
  { label: 'Tháng này',  getRange: () => { const t = today(); return { startDate: t, endDate: addDays(t, 30) }; } },
];

function today() {
  return new Date().toISOString().split('T')[0];
}
function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

/**
 * Bộ lọc nâng cao dạng panel.
 * Props: filters, pagination, activeFilterCount, setFilter, setKeyword, resetFilters, setSort
 */
const TaskFilterBar = ({
  filters, pagination, activeFilterCount,
  setFilter, setKeyword, resetFilters, setSort,
}) => {
  const [projects, setProjects] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load danh sách project & user một lần
  useEffect(() => {
    projectService.getAll().then(({ data }) => setProjects(data?.data ?? [])).catch(() => {});
    userService.getAll().then(({ data }) => setUsers(data?.data ?? [])).catch(() => {});
  }, []);

  const handleDeadlinePreset = (preset) => {
    const { startDate, endDate } = preset.getRange();
    setFilter('startDate', startDate);
    setFilter('endDate', endDate);
    setFilter('overdue', false);
  };

  // Chip hiển thị filter đang active
  const activeChips = [];
  if (filters.status)     activeChips.push({ key: 'status',     label: STATUS_OPTIONS.find(o => o.value === filters.status)?.label });
  if (filters.priority)   activeChips.push({ key: 'priority',   label: PRIORITY_OPTIONS.find(o => o.value === filters.priority)?.label?.replace(/🟢|🟡|🔴\s?/, '') });
  if (filters.assigneeId) activeChips.push({ key: 'assigneeId', label: `Người thực hiện: ${users.find(u => String(u.id) === String(filters.assigneeId))?.fullName ?? filters.assigneeId}` });
  if (filters.projectId)  activeChips.push({ key: 'projectId',  label: `Project: ${projects.find(p => String(p.id) === String(filters.projectId))?.name ?? filters.projectId}` });
  if (filters.startDate)  activeChips.push({ key: 'startDate',  label: `Từ: ${filters.startDate}` });
  if (filters.endDate)    activeChips.push({ key: 'endDate',    label: `Đến: ${filters.endDate}` });
  if (filters.overdue)    activeChips.push({ key: 'overdue',    label: 'Quá hạn' });

  return (
    <div className="space-y-3">
      {/* ── Row 1: Search + Sort + Advanced toggle ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted dark:text-gray-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            id="task-search-input"
            type="text"
            placeholder="Tìm kiếm task..."
            value={filters.keyword}
            onChange={e => setKeyword(e.target.value)}
            className="input-field pl-9 pr-8"
          />
          {filters.keyword && (
            <button
              onClick={() => setKeyword('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warm-muted dark:text-gray-500 hover:text-gray-700 dark:text-gray-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <div className="flex items-center gap-1.5 border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 rounded px-3 py-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-black/5 transition-colors"
               onClick={() => {
                 const newDir = pagination.sortDir === 'ASC' ? 'DESC' : 'ASC';
                 setSort(pagination.sortBy, newDir);
               }}>
            <ArrowUpDown size={14} className="text-warm-muted dark:text-gray-500" />
            <select
              value={pagination.sortBy}
              onChange={e => setSort(e.target.value, pagination.sortDir)}
              onClick={e => e.stopPropagation()}
              className="bg-transparent border-none outline-none text-sm cursor-pointer pr-1"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="text-xs text-warm-muted dark:text-gray-500 font-mono">
              {pagination.sortDir === 'ASC' ? '↑' : '↓'}
            </span>
          </div>
        </div>

        {/* Advanced filter toggle */}
        <button
          id="task-filter-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-3 py-2 rounded border text-sm font-medium transition-all ${
            activeFilterCount > 0
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-white dark:bg-slate-800 border-black/10 dark:border-white/10 text-warm-gray dark:text-gray-400 hover:bg-black/5'
          }`}
        >
          <SlidersHorizontal size={14} />
          <span>Bộ lọc</span>
          {activeFilterCount > 0 && (
            <span className="bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown size={12} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {/* Reset button */}
        {(activeFilterCount > 0 || filters.keyword) && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-sm text-warm-gray dark:text-gray-400 hover:text-danger transition-colors"
          >
            <X size={13} /> Xóa bộ lọc
          </button>
        )}
      </div>

      {/* ── Row 2: Advanced filter panel ── */}
      {showAdvanced && (
        <div className="bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-xl p-4 space-y-4 animate-fade-in shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-warm-gray dark:text-gray-400 mb-1.5 uppercase tracking-wide">Trạng thái</label>
              <select
                id="filter-status"
                value={filters.status}
                onChange={e => setFilter('status', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Tất cả</option>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-warm-gray dark:text-gray-400 mb-1.5 uppercase tracking-wide">Ưu tiên</label>
              <select
                id="filter-priority"
                value={filters.priority}
                onChange={e => setFilter('priority', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Tất cả</option>
                {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-semibold text-warm-gray dark:text-gray-400 mb-1.5 uppercase tracking-wide">Người thực hiện</label>
              <select
                id="filter-assignee"
                value={filters.assigneeId}
                onChange={e => setFilter('assigneeId', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Tất cả</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.fullName || u.username}</option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div>
              <label className="block text-xs font-semibold text-warm-gray dark:text-gray-400 mb-1.5 uppercase tracking-wide">Project</label>
              <select
                id="filter-project"
                value={filters.projectId}
                onChange={e => setFilter('projectId', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Tất cả</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline section */}
          <div>
            <label className="block text-xs font-semibold text-warm-gray dark:text-gray-400 mb-2 uppercase tracking-wide">Deadline</label>
            <div className="flex flex-wrap items-center gap-2">
              {/* Preset buttons */}
              {DEADLINE_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => handleDeadlinePreset(preset)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-black/10 dark:border-white/10 bg-warm-white dark:bg-slate-800 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                >
                  {preset.label}
                </button>
              ))}

              {/* Overdue toggle */}
              <button
                onClick={() => { setFilter('overdue', !filters.overdue); setFilter('startDate', ''); setFilter('endDate', ''); }}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  filters.overdue
                    ? 'bg-danger/10 border-danger/30 text-danger font-semibold'
                    : 'border-black/10 dark:border-white/10 bg-warm-white dark:bg-slate-800 hover:bg-danger/10 hover:border-danger/30 hover:text-danger'
                }`}
              >
                ⚠️ Quá hạn
              </button>

              <span className="text-warm-muted dark:text-gray-500 text-xs">hoặc</span>

              {/* Custom date range */}
              <div className="flex items-center gap-1.5">
                <input
                  id="filter-start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={e => { setFilter('startDate', e.target.value); setFilter('overdue', false); }}
                  className="input-field text-xs w-36"
                />
                <span className="text-warm-muted dark:text-gray-500 text-xs">→</span>
                <input
                  id="filter-end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={e => { setFilter('endDate', e.target.value); setFilter('overdue', false); }}
                  className="input-field text-xs w-36"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Row 3: Active filter chips ── */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map(chip => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20"
            >
              {chip.label}
              <button
                onClick={() => {
                  if (chip.key === 'overdue') setFilter('overdue', false);
                  else setFilter(chip.key, '');
                }}
                className="hover:text-danger transition-colors"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskFilterBar;
