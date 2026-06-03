import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { workLogService } from '../../services/workLogService';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';
import { Calendar as CalendarIcon, Clock, Search, Trash2 } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';

const DailyReport = () => {
  const { user } = useAuth();

  // Redirect non-privileged users to projects page
  if (user && ['MEMBER', 'ROLE_MEMBER'].includes(user.role)) {
    return <Navigate to="/projects" replace />;
  }

  const isAdminOrPM = user && ['ADMIN', 'PROJECT_MANAGER', 'ROLE_ADMIN', 'ROLE_PROJECT_MANAGER'].includes(user.role);

  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0] // 7 days ago
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    projectService.getAll().then(res => setProjects(res.data?.data || []));
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      projectService.getMembers(selectedProjectId).then(res => setMembers(res.data?.data || []));
    } else {
      setMembers([]);
      setSelectedUserId('');
    }
  }, [selectedProjectId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await workLogService.getReport({ 
        startDate, 
        endDate,
        projectId: selectedProjectId || undefined,
        userId: selectedUserId || undefined
      });
      setReport(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, selectedProjectId, selectedUserId]);

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa work log này không?')) return;
    try {
      await workLogService.delete(logId);
      fetchReport();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi xóa log');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-warm-white dark:bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Báo cáo Thời gian</h1>
          <p className="text-sm text-warm-gray dark:text-gray-400 mt-1">
            Theo dõi tổng số giờ làm việc của bạn và dự án.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-black/10 dark:border-white/10 shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-primary" />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Từ ngày:</span>
            <input
              type="date"
              className="input-field py-1.5 px-3 text-sm w-auto"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-primary" />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Đến ngày:</span>
            <input
              type="date"
              className="input-field py-1.5 px-3 text-sm w-auto"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {isAdminOrPM && (
            <>
              <div className="flex items-center gap-2 border-l border-black/10 dark:border-white/10 pl-4">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Dự án:</span>
                <select 
                  className="input-field py-1.5 px-3 text-sm w-40"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {selectedProjectId && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Thành viên:</span>
                  <select 
                    className="input-field py-1.5 px-3 text-sm w-40"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.fullName}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <button onClick={fetchReport} className="btn-primary text-sm py-1.5 px-4 ml-auto">
            <Search size={16} /> Lọc
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-lg border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Summary Cards */}
        {report && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-black/10 dark:border-white/10 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wider">Tổng giờ đã làm</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{report.totalHours} <span className="text-lg font-medium text-warm-gray dark:text-gray-400">giờ</span></p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-black/10 dark:border-white/10 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                <CalendarIcon size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wider">Số log</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{report.logs.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-black/10 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-slate-900/30">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chi tiết công việc</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-slate-900/50">
                <tr className="border-b border-black/10 dark:border-white/10">
                  <th className="py-3 px-6 text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wider">Ngày</th>
                  <th className="py-3 px-6 text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wider">Thành viên</th>
                  <th className="py-3 px-6 text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wider">Công việc</th>
                  <th className="py-3 px-6 text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wider">Dự án</th>
                  <th className="py-3 px-6 text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wider">Số giờ</th>
                  <th className="py-3 px-6 text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wider">Mô tả</th>
                  <th className="py-3 px-6 text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-warm-muted dark:text-gray-500">
                      <Spinner className="mx-auto" />
                    </td>
                  </tr>
                ) : report?.logs?.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-warm-muted dark:text-gray-500 italic">
                      Không có dữ liệu log time trong khoảng thời gian này.
                    </td>
                  </tr>
                ) : (
                  report?.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-warm-white dark:hover:bg-slate-800 transition-colors">
                      <td className="py-3 px-6 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {new Date(log.logDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Avatar name={log.userFullName} size="xs" />
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{log.userFullName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-900 dark:text-white font-medium">
                        {log.taskTitle}
                      </td>
                      <td className="py-3 px-6 text-sm text-warm-muted dark:text-gray-500">
                        {log.projectName}
                      </td>
                      <td className="py-3 px-6">
                        <span className="badge-blue text-xs font-semibold px-2.5 py-1 rounded-md">
                          {log.hoursLogged}h
                        </span>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-600 max-w-xs truncate" title={log.description}>
                        {log.description || '—'}
                      </td>
                      <td className="py-3 px-6 text-right">
                        {(isAdminOrPM || log.userId === user?.id) && (
                          <button 
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1.5 text-warm-gray dark:text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa log"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyReport;
