import React, { useEffect, useState, useCallback } from 'react';
import { roleService } from '../../services/roleService';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, Shield, ChevronDown, ChevronUp,
  Users, Lock, CheckSquare, X, AlertCircle
} from 'lucide-react';

// Nhóm Permission theo danh mục để hiển thị đẹp
const PERMISSION_GROUPS = {
  'Người dùng': ['VIEW_USERS', 'MANAGE_USERS'],
  'Chức vụ': ['VIEW_ROLES', 'MANAGE_ROLES'],
  'Dự án': ['VIEW_ALL_PROJECTS', 'CREATE_PROJECT', 'EDIT_PROJECT', 'DELETE_PROJECT', 'MANAGE_PROJECT_MEMBERS'],
  'Công việc': ['VIEW_TASKS', 'CREATE_TASK', 'EDIT_TASK', 'DELETE_TASK', 'ASSIGN_TASK'],
  'Bình luận': ['CREATE_COMMENT', 'DELETE_ANY_COMMENT'],
  'Thống kê': ['VIEW_DASHBOARD', 'VIEW_REPORTS'],
};

const PERMISSION_LABELS = {
  VIEW_USERS: 'Xem danh sách người dùng',
  MANAGE_USERS: 'Quản lý người dùng',
  VIEW_ROLES: 'Xem danh sách chức vụ',
  MANAGE_ROLES: 'Quản lý chức vụ (CRUD)',
  VIEW_ALL_PROJECTS: 'Xem tất cả dự án',
  CREATE_PROJECT: 'Tạo dự án',
  EDIT_PROJECT: 'Chỉnh sửa dự án',
  DELETE_PROJECT: 'Xóa dự án',
  MANAGE_PROJECT_MEMBERS: 'Quản lý thành viên dự án',
  VIEW_TASKS: 'Xem công việc',
  CREATE_TASK: 'Tạo công việc',
  EDIT_TASK: 'Chỉnh sửa công việc',
  DELETE_TASK: 'Xóa công việc',
  ASSIGN_TASK: 'Phân công công việc',
  CREATE_COMMENT: 'Tạo bình luận',
  DELETE_ANY_COMMENT: 'Xóa bình luận của người khác',
  VIEW_DASHBOARD: 'Xem trang tổng quan',
  VIEW_REPORTS: 'Xem báo cáo thống kê',
};

// =================== Modal Thêm / Chỉnh sửa ===================
const RoleModal = ({ role, onClose, onSave }) => {
  const isEdit = !!role;
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selectedPerms, setSelectedPerms] = useState(new Set(role?.permissions || []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const togglePerm = (perm) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      next.has(perm) ? next.delete(perm) : next.add(perm);
      return next;
    });
  };

  const toggleGroup = (perms) => {
    const allSelected = perms.every(p => selectedPerms.has(p));
    setSelectedPerms(prev => {
      const next = new Set(prev);
      if (allSelected) perms.forEach(p => next.delete(p));
      else perms.forEach(p => next.add(p));
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Tên chức vụ không được để trống'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { name: name.trim(), description: description.trim(), permissions: [...selectedPerms] };
      if (isEdit) {
        await roleService.update(role.id, payload);
      } else {
        await roleService.create(payload);
      }
      onSave();
    } catch (err) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Chỉnh sửa chức vụ' : 'Thêm chức vụ mới'}
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg text-warm-gray dark:text-gray-400 hover:text-gray-800 dark:text-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
            {/* Tên chức vụ */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                Tên chức vụ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="VD: Tester, QA, Designer..."
                className="input-field w-full"
                disabled={role?.systemRole}
              />
              {role?.systemRole && (
                <p className="text-xs text-warm-muted dark:text-gray-500 mt-1 flex items-center gap-1">
                  <Lock size={11} /> Chức vụ hệ thống — không thể đổi tên
                </p>
              )}
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Mô tả</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Mô tả về vai trò và trách nhiệm..."
                rows={2}
                className="input-field w-full resize-none"
              />
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Quyền hạn ({selectedPerms.size} / {Object.values(PERMISSION_GROUPS).flat().length} quyền được chọn)
              </label>
              <div className="space-y-3">
                {Object.entries(PERMISSION_GROUPS).map(([groupName, perms]) => {
                  const allSelected = perms.every(p => selectedPerms.has(p));
                  const someSelected = perms.some(p => selectedPerms.has(p));
                  return (
                    <div key={groupName} className="border border-black/8 rounded-xl overflow-hidden">
                      {/* Group header */}
                      <button
                        type="button"
                        onClick={() => toggleGroup(perms)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-slate-800/80 hover:bg-gray-100 dark:bg-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            allSelected ? 'bg-primary border-primary' : someSelected ? 'bg-primary/30 border-primary' : 'border-gray-300'
                          }`}>
                            {allSelected && <CheckSquare size={10} className="text-white" />}
                          </div>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{groupName}</span>
                        </div>
                        <span className="text-xs text-warm-muted dark:text-gray-500">{perms.filter(p => selectedPerms.has(p)).length}/{perms.length}</span>
                      </button>
                      {/* Permissions trong nhóm */}
                      <div className="px-4 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {perms.map(perm => (
                          <label key={perm} className="flex items-center gap-2 cursor-pointer group py-1">
                            <input
                              type="checkbox"
                              checked={selectedPerms.has(perm)}
                              onChange={() => togglePerm(perm)}
                              className="w-3.5 h-3.5 accent-primary cursor-pointer"
                            />
                            <span className="text-xs text-gray-600 group-hover:text-gray-900 dark:text-white transition-colors">
                              {PERMISSION_LABELS[perm]}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-black/10 dark:border-white/10 bg-gray-50 dark:bg-slate-900/50">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2 text-sm">
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-5 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo chức vụ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =================== Modal Xác nhận Xóa ===================
const DeleteModal = ({ role, onClose, onConfirm, deleting }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Trash2 size={18} className="text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">Xóa chức vụ "{role.name}"?</h3>
          <p className="text-sm text-warm-gray dark:text-gray-400">
            Hành động này không thể hoàn tác. Chức vụ sẽ bị xóa vĩnh viễn khỏi hệ thống.
          </p>
        </div>
      </div>
      <div className="flex gap-3 mt-5 justify-end">
        <button onClick={onClose} disabled={deleting} className="btn-ghost px-4 py-2 text-sm">
          Hủy
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
        </button>
      </div>
    </div>
  </div>
);

// =================== Thẻ Role ===================
const RoleCard = ({ role, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const permCount = role.permissions?.length || 0;

  return (
    <div className="card p-5 space-y-3 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">{role.name}</h3>
              {role.systemRole && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                  <Lock size={9} /> Hệ thống
                </span>
              )}
            </div>
            {role.description && (
              <p className="text-xs text-warm-muted dark:text-gray-500 mt-0.5 truncate">{role.description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(role)}
            className="btn-ghost p-1.5 text-warm-gray dark:text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all"
            title="Chỉnh sửa"
          >
            <Pencil size={14} />
          </button>
          {!role.systemRole && (
            <button
              onClick={() => onDelete(role)}
              className="btn-ghost p-1.5 text-warm-gray dark:text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Xóa"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-warm-muted dark:text-gray-500">
        <span className="flex items-center gap-1">
          <Users size={12} />
          {role.userCount} thành viên
        </span>
        <span className="flex items-center gap-1">
          <CheckSquare size={12} />
          {permCount} quyền hạn
        </span>
      </div>

      {/* Permissions toggle */}
      {permCount > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? 'Ẩn quyền hạn' : 'Xem quyền hạn'}
          </button>
          {expanded && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {role.permissions.map(perm => (
                <span
                  key={perm}
                  className="text-[10px] bg-primary/8 text-primary font-medium px-2 py-0.5 rounded-full"
                >
                  {PERMISSION_LABELS[perm] || perm}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// =================== Trang chính ===================
const RoleManagement = () => {
  const { user } = useAuth();
  const isAdmin = ['ADMIN', 'ROLE_ADMIN'].includes(user?.role);

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!isAdmin) return <Navigate to="/" replace />;

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await roleService.getAll();
      setRoles(data?.data || []);
    } catch {
      setError('Không thể tải danh sách chức vụ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const handleEdit = (role) => { setEditingRole(role); setModalOpen(true); };
  const handleCreate = () => { setEditingRole(null); setModalOpen(true); };
  const handleModalClose = () => { setModalOpen(false); setEditingRole(null); };
  const handleModalSave = () => { handleModalClose(); loadRoles(); };

  const handleDeleteRequest = (role) => { setDeleteTarget(role); setDeleteError(''); };
  const handleDeleteCancel = () => { setDeleteTarget(null); setDeleteError(''); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await roleService.delete(deleteTarget.id);
      setDeleteTarget(null);
      loadRoles();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Không thể xóa chức vụ này';
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ letterSpacing: '-0.5px' }}>
            Quản lý Chức vụ
          </h2>
          <p className="text-warm-gray dark:text-gray-400 text-sm mt-1">
            Tạo và cấu hình các chức vụ với quyền hạn chi tiết cho hệ thống.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"
        >
          <Plus size={16} />
          Thêm chức vụ mới
        </button>
      </div>

      {/* Lỗi xóa */}
      {deleteError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Không thể xóa chức vụ</p>
            <p className="text-sm text-red-600 mt-0.5">{deleteError}</p>
          </div>
          <button onClick={() => setDeleteError('')} className="ml-auto text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Nội dung */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 space-y-3 animate-pulse">
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded w-3/4" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-danger">{error}</div>
      ) : roles.length === 0 ? (
        <div className="text-center py-16 text-warm-muted dark:text-gray-500">
          <Shield size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Chưa có chức vụ nào. Nhấn "Thêm chức vụ mới" để bắt đầu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => (
            <RoleCard
              key={role.id}
              role={role}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <RoleModal
          role={editingRole}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
      {deleteTarget && !deleteError && (
        <DeleteModal
          role={deleteTarget}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          deleting={deleting}
        />
      )}
    </div>
  );
};

export default RoleManagement;
