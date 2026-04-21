import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { FolderKanban, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Trang đăng ký
 * Backend RegisterRequest chỉ nhận: { username, email, password }
 * - KHÔNG có fullName (User entity không có field này)
 * - KHÔNG gửi confirmPassword lên server
 */
const Register = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',     // Chỉ dùng để validate phía client, không gửi lên server
  });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate phía client
    if (form.username.length < 3) {
      setError('Tên đăng nhập phải có ít nhất 3 ký tự');
      return;
    }
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      // Chỉ gửi 3 field backend cần: username, email, password
      await authService.register({
        username: form.username.trim(),
        email:    form.email.trim(),
        password: form.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      // Xử lý lỗi từ backend (VD: username/email đã tồn tại)
      const msg = err?.response?.data?.message
               ?? err?.response?.data?.errors?.[0]
               ?? 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-white px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-card">
            <FolderKanban className="text-white" size={18} />
          </div>
          <span className="font-bold text-gray-900 text-lg">TaskMaster</span>
        </div>

        <div className="bg-white border border-black/10 rounded-2xl shadow-card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ letterSpacing: '-0.5px' }}>
            Tạo tài khoản
          </h2>
          <p className="text-sm text-warm-gray mb-8">
            Điền thông tin để bắt đầu sử dụng TaskMaster.
          </p>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-5">
              <CheckCircle size={16} />
              Đăng ký thành công! Đang chuyển đến trang đăng nhập…
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">
                Tên đăng nhập *
              </label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                className="input-field"
                placeholder="Ít nhất 3 ký tự"
                autoFocus
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">
                Email *
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="email@example.com"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">
                Mật khẩu *
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Ít nhất 6 ký tự"
                required
              />
            </div>

            {/* Confirm password (client-side only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">
                Xác nhận mật khẩu *
              </label>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                className={`input-field ${
                  form.confirmPassword && form.confirmPassword !== form.password
                    ? 'border-red-400 focus:ring-red-300'
                    : ''
                }`}
                placeholder="Nhập lại mật khẩu"
                required
              />
              {form.confirmPassword && form.confirmPassword !== form.password && (
                <p className="text-xs text-red-500">Mật khẩu không khớp</p>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-base mt-2"
              disabled={loading || success}
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
              {!loading && !success && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="text-center text-sm text-warm-gray mt-6">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary font-semibold hover:text-primary-hover">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
