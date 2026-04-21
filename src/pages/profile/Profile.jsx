import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import Avatar from '../../components/ui/Avatar';
import { User, Mail, Shield, Save, CheckCircle } from 'lucide-react';

/**
 * Profile page
 * UserResponse từ backend có: id, username, email, role, isActive, createdAt
 * KHÔNG có fullName — hiển thị username làm tên chính
 */
const Profile = () => {
  const { user, setUser } = useAuth();
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  // Refresh thông tin user từ server
  const handleRefresh = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await userService.me();
      setUser(data?.data ?? user);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Không thể tải lại thông tin. Thử lại sau.');
    } finally {
      setSaving(false);
    }
  };

  const roleName = (user?.role ?? 'MEMBER').toString().replace('ROLE_', '');
  const roleColors = {
    ADMIN: 'badge-red',
    PROJECT_MANAGER: 'badge-blue',
    MEMBER: 'badge-gray',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.5px' }}>
          Hồ sơ cá nhân
        </h2>
        <p className="text-warm-gray text-sm mt-1">Quản lý thông tin tài khoản của bạn</p>
      </div>

      {/* Profile card */}
      <div className="card p-8">
        {/* Avatar + basic info */}
        <div className="flex items-center gap-5 mb-8 pb-8 border-b border-black/10">
          <Avatar name={user?.username ?? 'U'} size="lg" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{user?.username}</h3>
            <p className="text-sm text-warm-gray">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Shield size={13} className="text-primary" />
              <span className={roleColors[roleName] ?? 'badge-gray'}>{roleName}</span>
              {user?.isActive && (
                <span className="badge-green">Đang hoạt động</span>
              )}
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          <InfoRow icon={<User size={14} />} label="Tên đăng nhập" value={user?.username} />
          <InfoRow icon={<Mail size={14} />} label="Email" value={user?.email} />
          <InfoRow icon={<Shield size={14} />} label="Vai trò" value={roleName} />
          <InfoRow
            label="Ngày tạo"
            value={user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString('vi-VN')
              : '—'}
          />
        </div>

        {/* Messages */}
        {error && (
          <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</div>
        )}
        {saved && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
            <CheckCircle size={15} /> Đã cập nhật thông tin thành công!
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-black/10">
          <button onClick={handleRefresh} className="btn-primary" disabled={saving}>
            <Save size={15} />
            {saving ? 'Đang tải...' : 'Làm mới thông tin'}
          </button>
        </div>
      </div>

      {/* Account Info card */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Thông tin tài khoản</h3>
        <div className="space-y-3 text-sm text-warm-gray">
          <p>Tài khoản được tạo với username và email được đăng ký lúc đầu.</p>
          <p className="text-xs text-warm-muted">
            Để thay đổi mật khẩu hoặc thông tin tài khoản, vui lòng liên hệ quản trị viên hệ thống.
          </p>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="bg-warm-white border border-black/10 rounded-xl p-4">
    <div className="flex items-center gap-1.5 text-xs font-semibold text-warm-gray uppercase tracking-wide mb-2">
      {icon} {label}
    </div>
    <p className="text-sm font-medium text-gray-900">{value ?? '—'}</p>
  </div>
);

export default Profile;
