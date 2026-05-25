import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { FolderKanban, Users, X, UserPlus, Trash2 } from 'lucide-react';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';

/**
 * Modal chỉnh sửa project — gồm 2 tab: Thông tin & Thành viên
 * @param {boolean}  open
 * @param {function} onClose
 * @param {function} onSave  - callback(id, formData)
 * @param {object}   project - dữ liệu hiện tại của project
 */
const EditProjectModal = ({ open, onClose, onSave, project }) => {
  const [tab, setTab] = useState('info'); // 'info' | 'members'

  /* ── Tab Thông tin ── */
  const [form, setForm]     = useState({ name: '', description: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  /* ── Tab Thành viên ── */
  const [members, setMembers]       = useState([]);   // thành viên hiện tại
  const [allUsers, setAllUsers]     = useState([]);   // toàn bộ user
  const [addIds, setAddIds]         = useState([]);   // user đang được chọn để thêm
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError]     = useState('');
  const [memberSuccess, setMemberSuccess] = useState('');

  /* ── Khởi tạo khi mở modal ── */
  useEffect(() => {
    if (!open || !project) return;

    // Reset về tab info mỗi lần mở mới
    setTab('info');
    setError('');
    setMemberError('');
    setMemberSuccess('');
    setAddIds([]);

    setForm({
      name:        project.name        ?? '',
      description: project.description ?? '',
      startDate:   project.startDate   ?? '',
      endDate:     project.endDate     ?? '',
    });

    // Load danh sách thành viên + toàn bộ user song song
    setMemberLoading(true);
    Promise.all([
      projectService.getMembers(project.id),
      userService.getAll(),
    ])
      .then(([membersRes, usersRes]) => {
        setMembers(membersRes?.data?.data ?? []);
        setAllUsers(usersRes?.data?.data ?? []);
      })
      .catch(() => {
        setMembers([]);
        setAllUsers([]);
      })
      .finally(() => setMemberLoading(false));
  }, [open, project]);

  /* ── Handlers Tab Thông tin ── */
  const handleChange  = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit  = async (e) => {
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
      await onSave(project.id, form);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  /* ── Handlers Tab Thành viên ── */
  const memberIds = members.map((m) => m.id);

  // Danh sách user chưa là thành viên (để hiện trong ô chọn thêm)
  const nonMembers = allUsers.filter((u) => !memberIds.includes(u.id));

  const toggleAddId = (id) => {
    setAddIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleAddMembers = async () => {
    if (addIds.length === 0) return;
    setMemberError('');
    setMemberSuccess('');
    try {
      await Promise.all(
        addIds.map((userId) =>
          projectService.addMember(project.id, { userId, role: 'MEMBER' })
        )
      );
      // Refresh member list
      const res = await projectService.getMembers(project.id);
      setMembers(res?.data?.data ?? []);
      setAddIds([]);
      setMemberSuccess(`Đã thêm ${addIds.length} thành viên thành công!`);
      setTimeout(() => setMemberSuccess(''), 3000);
    } catch (err) {
      setMemberError(err?.response?.data?.message ?? 'Thêm thành viên thất bại');
    }
  };

  const handleRemoveMember = async (userId) => {
    setMemberError('');
    setMemberSuccess('');
    try {
      await projectService.removeMember(project.id, userId);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      setMemberSuccess('Đã xóa thành viên khỏi dự án.');
      setTimeout(() => setMemberSuccess(''), 3000);
    } catch (err) {
      setMemberError(err?.response?.data?.message ?? 'Xóa thành viên thất bại');
    }
  };

  /* ── Render ── */
  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa dự án" size="md">
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-warm-white dark:bg-slate-800 rounded-lg p-1 border border-black/8">
        <button
          type="button"
          onClick={() => setTab('info')}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-md transition-all
            ${tab === 'info'
              ? 'bg-white dark:bg-slate-800 shadow-sm text-primary border border-black/8'
              : 'text-warm-gray dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'}`}
        >
          <FolderKanban size={13} /> Thông tin dự án
        </button>
        <button
          type="button"
          onClick={() => setTab('members')}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-md transition-all
            ${tab === 'members'
              ? 'bg-white dark:bg-slate-800 shadow-sm text-primary border border-black/8'
              : 'text-warm-gray dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'}`}
        >
          <Users size={13} /> Thành viên
          {members.length > 0 && (
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {members.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab: Thông tin ── */}
      {tab === 'info' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-xs text-danger bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide">Tên dự án *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input-field"
              placeholder="Tên dự án"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide">Mô tả</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="input-field resize-none"
              placeholder="Mô tả ngắn về dự án..."
            />
          </div>

          <div className="flex gap-3">
            <div className="space-y-1 flex-1">
              <label className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide">Ngày bắt đầu *</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="input-field" />
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide">Ngày kết thúc</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange}
                min={form.startDate} className="input-field" />
            </div>
          </div>

          <div className="flex gap-2 pt-1 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <FolderKanban size={15} />
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      )}

      {/* ── Tab: Thành viên ── */}
      {tab === 'members' && (
        <div className="space-y-4">
          {/* Thông báo */}
          {memberError && (
            <p className="text-xs text-danger bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">{memberError}</p>
          )}
          {memberSuccess && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{memberSuccess}</p>
          )}

          {/* Danh sách thành viên hiện tại */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <Users size={13} /> Thành viên hiện tại ({members.length})
            </label>

            {memberLoading ? (
              <p className="text-xs text-warm-muted dark:text-gray-500 text-center py-4">Đang tải...</p>
            ) : members.length === 0 ? (
              <p className="text-xs text-warm-muted dark:text-gray-500 text-center py-4 border border-dashed border-black/15 rounded-lg">
                Chưa có thành viên nào trong dự án
              </p>
            ) : (
              <div className="border border-black/10 dark:border-white/10 rounded-lg overflow-hidden divide-y divide-black/5 max-h-44 overflow-y-auto">
                {members.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 px-3 py-2 hover:bg-warm-white dark:hover:bg-slate-800 transition-colors">
                    {/* Avatar */}
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-primary/15 text-primary">
                      {(u.fullName || u.username || '?')[0].toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{u.fullName || u.username}</p>
                      <p className="text-xs text-warm-muted dark:text-gray-500 truncate">{u.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(u.id)}
                      title="Xóa khỏi dự án"
                      className="p-1 rounded-md text-warm-muted dark:text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Thêm thành viên mới */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <UserPlus size={13} /> Thêm thành viên mới
            </label>

            {/* Chips người đang chọn */}
            {addIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-warm-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-lg">
                {allUsers.filter((u) => addIds.includes(u.id)).map((u) => (
                  <span
                    key={u.id}
                    className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full"
                  >
                    {u.fullName || u.username}
                    <button type="button" onClick={() => toggleAddId(u.id)} className="hover:text-red-500 transition-colors">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Danh sách user chưa là thành viên */}
            <div className="border border-black/10 dark:border-white/10 rounded-lg overflow-hidden max-h-36 overflow-y-auto">
              {nonMembers.length === 0 ? (
                <p className="text-xs text-warm-muted dark:text-gray-500 text-center py-4">Tất cả người dùng đã là thành viên</p>
              ) : (
                nonMembers.map((u) => {
                  const checked = addIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-warm-white dark:hover:bg-slate-800
                        ${checked ? 'bg-primary/5' : ''}`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                        ${checked ? 'bg-primary text-white' : 'bg-warm-muted/20 text-warm-gray dark:text-gray-400'}`}>
                        {(u.fullName || u.username || '?')[0].toUpperCase()}
                      </span>
                      <span className="flex-1 text-sm text-gray-800 dark:text-gray-100">{u.fullName || u.username}</span>
                      <span className="text-xs text-warm-muted dark:text-gray-500">{u.email}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAddId(u.id)}
                        className="accent-primary"
                      />
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex gap-2 pt-1 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Đóng</button>
            {addIds.length > 0 && (
              <button type="button" onClick={handleAddMembers} className="btn-primary">
                <UserPlus size={15} />
                Thêm {addIds.length} thành viên
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default EditProjectModal;
