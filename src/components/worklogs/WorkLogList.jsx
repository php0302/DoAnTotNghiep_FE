import React, { useState, useEffect } from 'react';
import { workLogService } from '../../services/workLogService';
import Avatar from '../ui/Avatar';
import { Clock, Trash2 } from 'lucide-react';

const WorkLogList = ({ task, currentUser }) => {
  const todayStr = new Date().toLocaleDateString('en-CA');
  const taskId = task?.id;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(todayStr);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isAdminOrManager = ['ADMIN', 'ROLE_ADMIN', 'PROJECT_MANAGER', 'ROLE_PROJECT_MANAGER'].includes(currentUser?.role);
  const isAssignee = currentUser && (task?.assignedToId === currentUser.id || task?.assignee?.id === currentUser.id);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await workLogService.getByTask(taskId);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch work logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!hours || isNaN(hours) || Number(hours) <= 0 || Number(hours) > 24) {
      setErrorMsg('Số giờ phải lớn hơn 0 và nhỏ hơn hoặc bằng 24');
      return;
    }
    if (date !== todayStr) {
      setErrorMsg('Chỉ được phép ghi nhận thời gian cho ngày hôm nay');
      return;
    }
    
    try {
      setSubmitting(true);
      await workLogService.create({
        taskId,
        hoursLogged: Number(hours),
        logDate: date,
        description
      });
      setSuccessMsg('Ghi nhận thời gian thành công');
      setHours('');
      setDescription('');
      fetchLogs();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi ghi nhận thời gian');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (logId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa log này?')) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await workLogService.delete(logId);
      setSuccessMsg('Xóa log thành công');
      setLogs(logs.filter(l => l.id !== logId));
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi xóa log');
    }
  };

  return (
    <div className="space-y-4">
      {/* Form thêm mới hoặc cảnh báo phân quyền */}
      {isAssignee ? (
        <form onSubmit={handleSubmit} className="bg-warm-white p-4 rounded-lg border border-black/10 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              Log Time
            </h5>
            {errorMsg && <span className="text-xs text-red-500 font-medium">{errorMsg}</span>}
            {successMsg && <span className="text-xs text-green-600 font-medium">{successMsg}</span>}
          </div>
          <div className="flex gap-3">
            <div className="w-1/3">
              <label className="block text-xs text-warm-gray mb-1">Số giờ *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                className="input-field py-1.5 px-3 text-sm"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Ví dụ: 2.5"
                required
              />
            </div>
            <div className="w-2/3">
              <label className="block text-xs text-warm-gray mb-1">Ngày thực hiện</label>
              <input
                type="date"
                className="input-field py-1.5 px-3 text-sm bg-gray-100 cursor-not-allowed"
                value={date}
                disabled
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-warm-gray mb-1">Mô tả công việc</label>
            <textarea
              className="input-field py-1.5 px-3 text-sm min-h-[60px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bạn đã làm gì?"
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="btn-primary text-xs py-1.5 px-4">
              {submitting ? 'Đang lưu...' : 'Lưu lại'}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-start gap-2.5 bg-orange-50 border border-orange-200 text-amber-800 rounded-xl px-4 py-3 text-xs leading-relaxed">
          <span className="text-sm mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold text-amber-900 mb-0.5">Hạn chế ghi nhận thời gian</p>
            <p className="text-amber-700">
              {task?.assignedToId || task?.assignee?.id
                ? "Chỉ thành viên được giao công việc này mới có quyền báo cáo thời gian làm."
                : "Công việc này chưa được phân công. Vui lòng phân công công việc trước khi ghi nhận thời gian."}
            </p>
          </div>
        </div>
      )}

      {/* Danh sách logs */}
      <div className="space-y-3 mt-4">
        <h5 className="text-sm font-semibold text-gray-800">Lịch sử</h5>
        {loading ? (
          <div className="text-sm text-warm-muted text-center py-4">Đang tải...</div>
        ) : logs.length === 0 ? (
          <div className="text-sm text-warm-muted text-center py-4 italic border border-dashed border-black/10 rounded-lg">
            Chưa có thời gian nào được ghi nhận.
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex gap-3 p-3 bg-white border border-black/5 rounded-lg shadow-sm group">
                <Avatar name={log.userFullName} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{log.userFullName}</span>
                      <span className="text-xs text-warm-muted ml-2">
                        {new Date(log.logDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <span className="badge-blue text-xs font-semibold px-2 py-0.5 rounded-full">
                      {log.hoursLogged}h
                    </span>
                  </div>
                  {log.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{log.description}</p>
                  )}
                </div>
                {(isAdminOrManager || log.userId === currentUser?.id) && (
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="p-1.5 text-warm-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 self-start"
                    title="Xóa log"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkLogList;
