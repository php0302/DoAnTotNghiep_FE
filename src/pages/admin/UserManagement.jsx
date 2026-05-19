import React, { useEffect, useState } from 'react';
import { userService } from '../../services/userService';
import { roleService } from '../../services/roleService';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import { Mail, Shield, Clock, Edit2, Save, X } from 'lucide-react';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal edit user
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', email: '' });
  const [savingUser, setSavingUser] = useState(false);

  // Chỉ cho admin vào trang này
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

  const handleRoleChange = async (userId, newRoleId) => {
    try {
      await userService.updateRole(userId, Number(newRoleId));
      setUsers(prev =>
        prev.map(u => {
          if (u.id === userId) {
            const newRole = roles.find(r => r.id === Number(newRoleId));
            return { ...u, roleId: Number(newRoleId), role: newRole?.name };
          }
          return u;
        })
      );
    } catch (err) {
      alert(err?.response?.data?.message ?? 'Cập nhật thất bại');
    }
  };

  const handleEditClick = (u) => {
    setEditingUser(u.id);
    setEditForm({ fullName: u.fullName || u.username, email: u.email });
  };

  const handleSaveEdit = async (userId) => {
    setSavingUser(true);
    try {
      await userService.updateUserProfile(userId, editForm);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...editForm } : u));
      setEditingUser(null);
    } catch (err) {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
    } finally {
      setSavingUser(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Spinner size="lg" /></div>;
  if (error) return <div className="p-10 text-center text-danger">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.5px' }}>Quản lý Thành viên</h2>
        <p className="text-warm-gray text-sm mt-1">Quản lý tài khoản và phân quyền cho hệ thống.</p>
      </div>

      <Card className="overflow-hidden">
        <ul className="divide-y divide-black/5">
          {users.map((u) => (
            <li key={u.id} className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-black/[0.01] transition-colors">
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
                        onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                      <input 
                        type="email" 
                        className="input-field text-sm py-1.5"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
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
                      <h4 className="text-sm font-bold text-gray-900 truncate flex items-center gap-2">
                        {u.fullName || u.username}
                        {!u.isActive && <span className="badge-red text-[10px] uppercase font-bold py-0.5 px-1.5">Bị khóa</span>}
                      </h4>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-warm-muted">
                        <span className="flex items-center gap-1"><Mail size={12} /> {u.email}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> Gia nhập: {new Date(u.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <Shield size={14} className="text-primary hidden sm:block" />
                    <select
                      value={u.roleId || ''}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="input-field py-1.5 text-sm font-medium pr-8 w-full sm:w-auto bg-gray-50 focus:bg-white cursor-pointer"
                      disabled={u.id === user.id} // Không tự sửa quyền chính mình
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                    
                    <button 
                      onClick={() => handleEditClick(u)}
                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors ml-1"
                      title="Sửa thông tin"
                    >
                      <Edit2 size={15} />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default UserManagement;
