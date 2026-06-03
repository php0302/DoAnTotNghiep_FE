import React, { useEffect, useState } from 'react';
import { userService } from '../../services/userService';
import { roleService } from '../../services/roleService';
import { useAuth } from '../../context/AuthContext';
import websocketService from '../../services/websocketService';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import {
  Mail, Shield, Clock, Edit2, Save, X, Trash2,
  UserPlus, KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2, AlertTriangle, RefreshCw,
} from 'lucide-react';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers]   = useState([]);
  const [roles, setRoles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  // ── Modal tạo tài khoản ──
  const [showCreate, setShowCreate]     = useState(false);
  const [createForm, setCreateForm]     = useState({ username: '', email: '', password: '', roleId: '' });
  const [showCreatePwd, setShowCreatePwd] = useState(false);
  const [createError, setCreateError]   = useState('');
  const [creating, setCreating]         = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  // ── Modal sửa thông tin ──
  const [editingUser, setEditingUser]   = useState(null);
  const [editForm, setEditForm]         = useState({ fullName: '', email: '' });
  const [savingUser, setSavingUser]     = useState(false);

  // ── Modal xóa tài khoản ──
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting]     = useState(false);

  // ── Modal đặt lại mật khẩu ──
  const [resetTarget, setResetTarget]         = useState(null); // user đang reset
  const [resetPwd, setResetPwd]               = useState('');
  const [resetPwdConfirm, setResetPwdConfirm] = useState('');
  const [forceChange, setForceChange]         = useState(true);
  const [showResetPwd, setShowResetPwd]       = useState(false);
  const [showResetPwdConfirm, setShowResetPwdConfirm] = useState(false);
  const [resetError, setResetError]           = useState('');
  const [resetSuccess, setResetSuccess]       = useState(false);
  const [resetting, setResetting]             = useState(false);

  const isAdmin = ['ADMIN', 'ROLE_ADMIN'].includes(user?.role);

  const loadData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        userService.getAll(),
        roleService.getAll(),
      ]);
      setUsers(usersRes.data?.data || []);
      setRoles(rolesRes.data?.data || []);
    } catch (err) {
      setError('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadData();
    else {
      setLoading(false);
      setError('Bạn không có quyền truy cập trang này');
    }
  }, [isAdmin]);

  // ── Subscribe realtime /topic/admin để nhận sự kiện PASSWORD_CHANGED ──
  useEffect(() => {
    if (!isAdmin) return;

    websocketService.subscribeToAdmin((msg) => {
      if (msg.type === 'PASSWORD_CHANGED' && msg.data?.userId) {
        const changedUserId = Number(msg.data.userId);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === changedUserId
              ? { ...u, mustChangePassword: false }
              : u
          )
        );
      } else if (msg.type === 'USER_DEACTIVATED' && msg.data?.userId) {
        const deactivatedUserId = Number(msg.data.userId);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === deactivatedUserId
              ? { ...u, isActive: false }
              : u
          )
        );
      }
    });

    return () => websocketService.unsubscribeFromAdmin();
  }, [isAdmin]);

  // ── Xử lý tạo tài khoản ──
  const handleOpenCreate = () => {
    setCreateForm({ username: '', email: '', password: '', roleId: roles[0]?.id ?? '' });
    setCreateError('');
    setCreateSuccess(false);
    setShowCreate(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!createForm.roleId) {
      setCreateError('Vui lòng chọn chức vụ cho nhân viên.');
      return;
    }
    setCreating(true);
    try {
      const res = await userService.createUser({
        username: createForm.username.trim(),
        email:    createForm.email.trim(),
        password: createForm.password,
        roleId:   Number(createForm.roleId),
      });
      const newUser = res.data?.data;
      setUsers((prev) => [...prev, newUser]);
      setCreateSuccess(true);
      setTimeout(() => setShowCreate(false), 1500);
    } catch (err) {
      setCreateError(err?.response?.data?.message ?? 'Tạo tài khoản thất bại. Vui lòng thử lại.');
    } finally {
      setCreating(false);
    }
  };

  // ── Xử lý đổi role ──
  const handleRoleChange = async (userId, newRoleId) => {
    try {
      await userService.updateRole(userId, Number(newRoleId));
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            const newRole = roles.find((r) => r.id === Number(newRoleId));
            return { ...u, roleId: Number(newRoleId), role: newRole?.name };
          }
          return u;
        })
      );
    } catch (err) {
      alert(err?.response?.data?.message ?? 'Cập nhật thất bại');
    }
  };

  // ── Xử lý sửa thông tin ──
  const handleEditClick = (u) => {
    setEditingUser(u.id);
    setEditForm({ fullName: u.fullName || u.username, email: u.email });
  };

  const handleSaveEdit = async (userId) => {
    setSavingUser(true);
    try {
      await userService.updateUserProfile(userId, editForm);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...editForm } : u)));
      setEditingUser(null);
    } catch (err) {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
    } finally {
      setSavingUser(false);
    }
  };

  // ── Xử lý xóa (khóa) tài khoản ──
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await userService.deleteUser(userToDelete.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === userToDelete.id ? { ...u, isActive: false } : u))
      );
      setUserToDelete(null);
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi vô hiệu hóa tài khoản.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Mở modal đặt lại mật khẩu ──
  const handleOpenReset = (u) => {
    setResetTarget(u);
    setResetPwd('');
    setResetPwdConfirm('');
    setForceChange(true);
    setShowResetPwd(false);
    setShowResetPwdConfirm(false);
    setResetError('');
    setResetSuccess(false);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    if (resetPwd.length < 6) {
      setResetError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (resetPwd !== resetPwdConfirm) {
      setResetError('Xác nhận mật khẩu không khớp.');
      return;
    }
    setResetting(true);
    try {
      await userService.resetPassword(resetTarget.id, {
        newPassword: resetPwd,
        forceChangeOnLogin: forceChange,
      });
      setResetSuccess(true);
      // Cập nhật flag mustChangePassword trong danh sách
      setUsers((prev) =>
        prev.map((u) =>
          u.id === resetTarget.id ? { ...u, mustChangePassword: forceChange } : u
        )
      );
      setTimeout(() => setResetTarget(null), 1800);
    } catch (err) {
      setResetError(err?.response?.data?.message ?? 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Spinner size="lg" /></div>;
  if (error)   return <div className="p-10 text-center text-danger">{error}</div>;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ letterSpacing: '-0.5px' }}>
            Quản lý Thành viên
          </h2>
          <p className="text-warm-gray dark:text-gray-400 text-sm mt-1">
            Quản lý tài khoản và phân quyền cho hệ thống.
          </p>
        </div>
        <button
          id="btn-create-user"
          onClick={handleOpenCreate}
          className="btn-primary flex-shrink-0"
        >
          <UserPlus size={16} />
          Tạo tài khoản
        </button>
      </div>

      {/* ── Danh sách user ── */}
      <Card className="overflow-hidden">
        <ul className="divide-y divide-black/5">
          {users.map((u) => (
            <li
              key={u.id}
              className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-black/[0.01] transition-colors"
            >
              {editingUser === u.id ? (
                // EDIT MODE
                <div className="flex-1 w-full space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Tên hiển thị</label>
                      <input
                        type="text"
                        className="input-field text-sm py-1.5"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        className="input-field text-sm py-1.5"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleSaveEdit(u.id)} disabled={savingUser} className="btn-primary py-1.5 text-xs px-3">
                      <Save size={13} /> {savingUser ? 'Đang lưu...' : 'Lưu lại'}
                    </button>
                    <button onClick={() => setEditingUser(null)} className="btn-secondary py-1.5 text-xs px-3">
                      <X size={13} /> Hủy
                    </button>
                  </div>
                </div>
              ) : (
                // VIEW MODE
                <>
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <Avatar name={u.fullName || u.username} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate flex items-center gap-2">
                        {u.fullName || u.username}
                        {!u.isActive && (
                          <span className="badge-red text-[10px] uppercase font-bold py-0.5 px-1.5">Bị khóa</span>
                        )}
                        {u.mustChangePassword && (
                          <span
                            title="Chưa đổi mật khẩu lần đầu"
                            className="inline-flex items-center gap-1 text-[10px] font-bold py-0.5 px-1.5 rounded bg-amber-100 text-amber-700 border border-amber-300"
                          >
                            <KeyRound size={10} /> Chờ đổi MK
                          </span>
                        )}
                      </h4>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-warm-muted dark:text-gray-500">
                        <span className="flex items-center gap-1"><Mail size={12} /> {u.email}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> Gia nhập: {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <Shield size={14} className="text-primary hidden sm:block" />
                    <select
                      value={u.roleId || ''}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="input-field py-1.5 text-sm font-medium pr-8 w-full sm:w-auto bg-gray-50 dark:bg-slate-800/80 focus:bg-white dark:bg-slate-800 cursor-pointer"
                      disabled={u.id === user.id}
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleEditClick(u)}
                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors ml-1"
                      title="Sửa thông tin"
                      disabled={!u.isActive}
                    >
                      <Edit2 size={15} />
                    </button>
                    {/* Nút đặt lại mật khẩu — chỉ cho user khác và còn active */}
                    {u.id !== user.id && (
                      <button
                        onClick={() => handleOpenReset(u)}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors ml-1"
                        title="Đặt lại mật khẩu"
                      >
                        <RefreshCw size={15} />
                      </button>
                    )}
                    {u.id !== user.id && u.isActive && (
                      <button
                        onClick={() => setUserToDelete(u)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors ml-1"
                        title="Vô hiệu hóa"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {/* ══════════════ MODAL TẠO TÀI KHOẢN ══════════════ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-black/10 dark:border-white/10 animate-slide-up">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                  <UserPlus size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Tạo tài khoản nhân viên</h3>
                  <p className="text-xs text-warm-gray dark:text-gray-400 mt-0.5">Nhân viên sẽ đổi mật khẩu khi đăng nhập lần đầu.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:bg-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {/* Error */}
              {createError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  {createError}
                </div>
              )}

              {/* Success */}
              {createSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
                  <CheckCircle2 size={15} />
                  Tạo tài khoản thành công!
                </div>
              )}

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide">
                  Tên đăng nhập *
                </label>
                <input
                  id="create-username"
                  type="text"
                  className="input-field"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  placeholder="Ít nhất 3 ký tự..."
                  autoFocus
                  required
                  minLength={3}
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide">
                  Email *
                </label>
                <input
                  id="create-email"
                  type="email"
                  className="input-field"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>

              {/* Password tạm thời */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide">
                  Mật khẩu tạm thời *
                </label>
                <div className="relative">
                  <input
                    id="create-password"
                    type={showCreatePwd ? 'text' : 'password'}
                    className="input-field pr-10"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Ít nhất 6 ký tự..."
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePwd(!showCreatePwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showCreatePwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-xs text-warm-muted dark:text-gray-500">Nhân viên sẽ phải đổi mật khẩu này khi đăng nhập lần đầu.</p>
              </div>

              {/* Role — bắt buộc chọn */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide">
                  Chức vụ *
                </label>
                <select
                  id="create-role"
                  className="input-field cursor-pointer"
                  value={createForm.roleId}
                  onChange={(e) => setCreateForm({ ...createForm, roleId: e.target.value })}
                  required
                >
                  <option value="" disabled>-- Chọn chức vụ --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  id="create-user-submit"
                  type="submit"
                  className="btn-primary flex-1 py-2.5"
                  disabled={creating || createSuccess}
                >
                  <UserPlus size={15} />
                  {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="btn-secondary py-2.5 px-4"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL XÓA TÀI KHOẢN ══════════════ */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm border border-black/10 dark:border-white/10 animate-slide-up p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Vô hiệu hóa tài khoản?</h3>
                <p className="text-sm text-gray-500">
                  Bạn có chắc muốn vô hiệu hóa <span className="font-semibold text-gray-900 dark:text-white">{userToDelete.fullName || userToDelete.username}</span>?
                  Tài khoản này sẽ không thể đăng nhập được nữa.
                </p>
              </div>
              <div className="flex w-full gap-3 pt-2">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-lg font-semibold transition-colors"
                  disabled={isDeleting}
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  disabled={isDeleting}
                >
                  {isDeleting ? <Spinner size="sm" className="text-white" /> : <Trash2 size={16} />}
                  <span>{isDeleting ? 'Đang khóa...' : 'Xác nhận'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL ĐẶT LẠI MẬT KHẨU ══════════════ */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-black/10 dark:border-white/10 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center">
                  <KeyRound size={18} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Đặt lại mật khẩu</h3>
                  <p className="text-xs text-warm-gray dark:text-gray-400 mt-0.5 truncate max-w-[220px]">
                    {resetTarget.fullName || resetTarget.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResetTarget(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:bg-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
              {/* Info banner */}
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs rounded-lg px-4 py-3">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <span>Mật khẩu mới sẽ được áp dụng ngay lập tức. Người dùng cần đăng nhập lại bằng mật khẩu mới này.</span>
              </div>

              {/* Error */}
              {resetError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  {resetError}
                </div>
              )}

              {/* Success */}
              {resetSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
                  <CheckCircle2 size={15} />
                  Đặt lại mật khẩu thành công!
                </div>
              )}

              {/* Mật khẩu mới */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide">
                  Mật khẩu mới *
                </label>
                <div className="relative">
                  <input
                    id="reset-new-password"
                    type={showResetPwd ? 'text' : 'password'}
                    className="input-field pr-10"
                    value={resetPwd}
                    onChange={(e) => setResetPwd(e.target.value)}
                    placeholder="Ít nhất 6 ký tự..."
                    required
                    minLength={6}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPwd(!showResetPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showResetPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide">
                  Xác nhận mật khẩu mới *
                </label>
                <div className="relative">
                  <input
                    id="reset-confirm-password"
                    type={showResetPwdConfirm ? 'text' : 'password'}
                    className={`input-field pr-10 ${
                      resetPwdConfirm && resetPwd !== resetPwdConfirm
                        ? 'border-red-400 focus:ring-red-300'
                        : resetPwdConfirm && resetPwd === resetPwdConfirm
                        ? 'border-green-400 focus:ring-green-300'
                        : ''
                    }`}
                    value={resetPwdConfirm}
                    onChange={(e) => setResetPwdConfirm(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPwdConfirm(!showResetPwdConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showResetPwdConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {resetPwdConfirm && resetPwd !== resetPwdConfirm && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={11} /> Mật khẩu xác nhận không khớp
                  </p>
                )}
                {resetPwdConfirm && resetPwd === resetPwdConfirm && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Mật khẩu khớp
                  </p>
                )}
              </div>

              {/* Tùy chọn buộc đổi lại lần đầu */}
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.07] transition-colors">
                <input
                  id="reset-force-change"
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
                  checked={forceChange}
                  onChange={(e) => setForceChange(e.target.checked)}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Buộc đổi mật khẩu khi đăng nhập</p>
                  <p className="text-xs text-warm-muted dark:text-gray-400 mt-0.5">
                    Người dùng sẽ phải tự tạo mật khẩu mới sau khi đăng nhập bằng mật khẩu bạn đặt.
                  </p>
                </div>
              </label>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  id="reset-password-submit"
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  disabled={resetting || resetSuccess}
                >
                  <KeyRound size={15} />
                  {resetting ? 'Đang đặt lại...' : 'Xác nhận đặt lại'}
                </button>
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="btn-secondary py-2.5 px-4"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
