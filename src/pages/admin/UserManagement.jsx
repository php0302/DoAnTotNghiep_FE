import React, { useEffect, useState } from 'react';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import { Mail, Shield, Clock } from 'lucide-react';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chỉ cho admin vào trang này
  const isAdmin = ['ADMIN', 'ROLE_ADMIN'].includes(user?.role);

  const loadUsers = async () => {
    try {
      const { data } = await userService.getAll();
      setUsers(data?.data || []);
    } catch (err) {
      setError('Lỗi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadUsers();
    else {
      setLoading(false);
      setError('Bạn không có quyền truy cập trang này');
    }
  }, [isAdmin]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userService.updateRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      // TODO: Thêm toast notification thành công ở đây nếu muốn
    } catch (err) {
      alert(err?.response?.data?.message ?? 'Cập nhật thất bại');
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
              <div className="flex items-center gap-4 min-w-0">
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

              {/* Thay đổi quyền */}
              <div className="flex-shrink-0 flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <Shield size={14} className="text-primary hidden sm:block" />
                <select
                  value={u.role.replace('ROLE_', '')}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  className="input-field py-1.5 text-sm font-medium pr-8 w-full sm:w-auto bg-gray-50 focus:bg-white cursor-pointer"
                  disabled={u.id === user.id} // Không tự sửa quyền chính mình để an toàn
                >
                  <option value="ADMIN">Quản trị viên (Admin)</option>
                  <option value="PROJECT_MANAGER">Quản lý Dự án (PM)</option>
                  <option value="MEMBER">Nhân viên (Member)</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default UserManagement;
