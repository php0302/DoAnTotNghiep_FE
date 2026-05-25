import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { FolderKanban, KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Trang đổi mật khẩu bắt buộc — hiển thị khi mustChangePassword = true.
 * Người dùng không thể thoát khỏi trang này cho đến khi đổi thành công.
 */
const ChangePassword = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState(false);
  const [loading, setLoading]           = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (form.newPassword === form.currentPassword) {
      setError('Mật khẩu mới phải khác mật khẩu tạm thời.');
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      // Cập nhật lại user state — tắt cờ mustChangePassword
      setUser((prev) => ({ ...prev, mustChangePassword: false }));
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra độ mạnh mật khẩu
  const strength = (() => {
    const p = form.newPassword;
    if (!p) return null;
    if (p.length < 6) return { level: 1, label: 'Yếu', color: 'bg-red-400' };
    if (p.length < 8 || !/[A-Z]/.test(p)) return { level: 2, label: 'Trung bình', color: 'bg-yellow-400' };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return { level: 3, label: 'Mạnh', color: 'bg-green-500' };
    return { level: 2, label: 'Trung bình', color: 'bg-yellow-400' };
  })();

  return (
    <div className="min-h-screen flex bg-warm-white dark:bg-slate-900">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-center flex-1 px-16 bg-white dark:bg-slate-800">
        <div className="max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-card">
              <FolderKanban className="text-white" size={20} />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg">TaskMaster</span>
          </div>

          {/* Icon bảo mật */}
          <div className="w-16 h-16 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center justify-center mb-8">
            <ShieldCheck className="text-amber-500" size={32} />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-4" style={{ letterSpacing: '-1.5px' }}>
            Bảo mật<br />tài khoản.
          </h1>
          <p className="text-warm-gray dark:text-gray-400 text-base leading-relaxed mb-6">
            Đây là lần đầu bạn đăng nhập vào hệ thống. Vui lòng đặt mật khẩu cá nhân để bảo vệ tài khoản.
          </p>

          {/* Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-amber-800">Mật khẩu tốt nên có:</p>
            <ul className="space-y-1">
              {[
                'Ít nhất 8 ký tự',
                'Có chữ hoa và chữ thường',
                'Có ít nhất 1 số',
                'Không dùng thông tin cá nhân',
              ].map((tip) => (
                <li key={tip} className="flex items-center gap-2 text-xs text-amber-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 bg-warm-white dark:bg-slate-900">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FolderKanban className="text-white" size={16} />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">TaskMaster</span>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-2xl shadow-card p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center">
                <KeyRound className="text-amber-500" size={18} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ letterSpacing: '-0.5px' }}>
                Đặt mật khẩu mới
              </h2>
            </div>
            <p className="text-sm text-warm-gray dark:text-gray-400 mb-2 ml-12">
              Xin chào, <span className="font-semibold text-gray-700 dark:text-gray-200">{user?.fullName || user?.username}</span>!
            </p>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg px-3 py-2 mb-6">
              <ShieldCheck size={14} className="flex-shrink-0 mt-0.5" />
              <span>Tài khoản được tạo bởi Admin. Vui lòng đổi mật khẩu trước khi sử dụng hệ thống.</span>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-5">
                <CheckCircle2 size={16} />
                Đổi mật khẩu thành công! Đang chuyển vào hệ thống...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide">
                  Mật khẩu tạm thời (do Admin cấp)
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrent ? 'text' : 'password'}
                    value={form.currentPassword}
                    onChange={handleChange}
                    className="input-field pr-10"
                    placeholder="Nhập mật khẩu tạm thời..."
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNew ? 'text' : 'password'}
                    value={form.newPassword}
                    onChange={handleChange}
                    className="input-field pr-10"
                    placeholder="Ít nhất 6 ký tự..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Password strength bar */}
                {strength && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.level ? strength.color : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-warm-muted dark:text-gray-500">Độ mạnh: <span className="font-medium">{strength.label}</span></p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className={`input-field pr-10 ${
                      form.confirmPassword && form.confirmPassword !== form.newPassword
                        ? 'border-red-400 focus:ring-red-300'
                        : form.confirmPassword && form.confirmPassword === form.newPassword
                        ? 'border-green-400 focus:ring-green-300'
                        : ''
                    }`}
                    placeholder="Nhập lại mật khẩu mới..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                  <p className="text-xs text-red-500">Mật khẩu không khớp</p>
                )}
                {form.confirmPassword && form.confirmPassword === form.newPassword && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Mật khẩu khớp
                  </p>
                )}
              </div>

              <button
                id="change-password-submit"
                type="submit"
                className="btn-primary w-full py-3 text-base mt-2"
                disabled={loading || success}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
                {!loading && !success && <ShieldCheck size={16} />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
