import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import Avatar from '../../components/ui/Avatar';
import { User, Mail, Shield, Save, CheckCircle, Edit2, X } from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || user?.username || '',
    email: user?.email || ''
  });

  // Đồng bộ form khi user context thay đổi
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        fullName: user.fullName || user.username || '',
        email: user.email || ''
      });
    }
  }, [user, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await userService.updateMyProfile(formData);
      setUser(data?.data ?? user);
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin.');
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.5px' }}>
            Hồ sơ cá nhân
          </h2>
          <p className="text-warm-gray text-sm mt-1">Quản lý thông tin tài khoản của bạn</p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm">
            <Edit2 size={15} /> Chỉnh sửa
          </button>
        )}
      </div>

      <div className="card p-8">
        <div className="flex items-center gap-5 mb-8 pb-8 border-b border-black/10">
          <Avatar name={user?.fullName || user?.username || 'U'} size="lg" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{user?.fullName || user?.username}</h3>
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

        {error && (
          <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</div>
        )}
        {saved && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
            <CheckCircle size={15} /> Đã cập nhật thông tin thành công!
          </div>
        )}

        {!isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
            <InfoRow icon={<User size={14} />} label="Tên hiển thị" value={user?.fullName || user?.username} />
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
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Tên hiển thị</label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Nhập tên hiển thị của bạn..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Nhập địa chỉ email..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => {
                  setIsEditing(false);
                  setError('');
                }} 
                className="btn-secondary"
              >
                <X size={15} /> Hủy bỏ
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                <Save size={15} />
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Thông tin tài khoản</h3>
        <div className="space-y-3 text-sm text-warm-gray">
          <p>Tên đăng nhập không thể thay đổi sau khi đăng ký.</p>
          <p className="text-xs text-warm-muted">
            Để thay đổi mật khẩu hoặc thông tin khác, vui lòng liên hệ quản trị viên hệ thống.
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
