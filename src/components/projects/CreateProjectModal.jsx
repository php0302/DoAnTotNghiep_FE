import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { FolderKanban, X, UserPlus } from 'lucide-react';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';

/**
 * Modal tạo project mới — có chọn thành viên
 * @param {boolean} open
 * @param {function} onClose
 * @param {function} onCreate - callback(projectData) — vẫn gọi để refresh list
 */
const CreateProjectModal = ({ open, onClose, onCreate }) => {
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '' });
  const [allUsers, setAllUsers]     = useState([]);
  const [selectedIds, setSelectedIds] = useState([]); // danh sách userId được chọn
  const [loading, setLoading]       = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError]           = useState('');

  // Load danh sách user khi mở modal
  useEffect(() => {
    if (!open) return;
    setLoadingUsers(true);
    userService.getAll()
      .then(({ data }) => setAllUsers(data?.data ?? []))
      .catch(() => setAllUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [open]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleUser = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleClose = () => {
    setForm({ name: '', description: '', startDate: '', endDate: '' });
    setSelectedIds([]);
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Tên dự án không được để trống'); return; }
    if (!form.startDate)   { setError('Ngày bắt đầu không được để trống'); return; }
    if (form.endDate && form.endDate < form.startDate) {
      setError('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // 1. Tạo project qua prop onCreate (hàm createProject từ useProjects)
      const newProject = await onCreate(form);

      // 2. Thêm từng thành viên được chọn (role mặc định MEMBER)
      if (newProject?.id && selectedIds.length > 0) {
        await Promise.all(
          selectedIds.map((userId) =>
            projectService.addMember(newProject.id, { userId, role: 'MEMBER' })
          )
        );
      }

      handleClose();
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Tạo dự án thất bại');
    } finally {
      setLoading(false);
    }
  };

  const selectedUsers = allUsers.filter((u) => selectedIds.includes(u.id));

  return (
    <Modal open={open} onClose={handleClose} title="Tạo dự án mới" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-xs text-danger bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Tên dự án */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">Tên dự án *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="input-field"
            placeholder="VD: Website Bán Hàng"
            autoFocus
          />
        </div>

        {/* Mô tả */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">Mô tả</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            className="input-field resize-none"
            placeholder="Mô tả ngắn về dự án..."
          />
        </div>

        {/* Ngày */}
        <div className="flex gap-3">
          <div className="space-y-1 flex-1">
            <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">Ngày bắt đầu *</label>
            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="input-field" />
          </div>
          <div className="space-y-1 flex-1">
            <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">Ngày kết thúc</label>
            <input type="date" name="endDate" value={form.endDate} onChange={handleChange}
              min={form.startDate}
              className="input-field" />
          </div>
        </div>

        {/* Chọn thành viên */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide flex items-center gap-1.5">
            <UserPlus size={13} /> Thêm thành viên
          </label>

          {/* Chips các thành viên đã chọn */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2 bg-warm-white border border-black/10 rounded-lg">
              {selectedUsers.map((u) => (
                <span
                  key={u.id}
                  className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full"
                >
                  {u.fullName || u.username}
                  <button
                    type="button"
                    onClick={() => toggleUser(u.id)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Danh sách user để chọn */}
          <div className="border border-black/10 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
            {loadingUsers ? (
              <p className="text-xs text-warm-muted text-center py-4">Đang tải danh sách...</p>
            ) : allUsers.length === 0 ? (
              <p className="text-xs text-warm-muted text-center py-4">Không có thành viên nào</p>
            ) : (
              allUsers.map((u) => {
                const checked = selectedIds.includes(u.id);
                return (
                  <label
                    key={u.id}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-warm-white
                      ${checked ? 'bg-primary/5' : ''}`}
                  >
                    {/* Avatar circle */}
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${checked ? 'bg-primary text-white' : 'bg-warm-muted/20 text-warm-gray'}`}>
                      {(u.fullName || u.username || '?')[0].toUpperCase()}
                    </span>
                    <span className="flex-1 text-sm text-gray-800">{u.fullName || u.username}</span>
                    <span className="text-xs text-warm-muted">{u.email}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleUser(u.id)}
                      className="accent-primary"
                    />
                  </label>
                );
              })
            )}
          </div>
          {selectedIds.length > 0 && (
            <p className="text-xs text-warm-muted">Đã chọn {selectedIds.length} thành viên</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1 justify-end">
          <button type="button" onClick={handleClose} className="btn-secondary">Hủy</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            <FolderKanban size={15} />
            {loading ? 'Đang tạo...' : 'Tạo dự án'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;
