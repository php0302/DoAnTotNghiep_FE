import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FolderKanban, ArrowRight, AlertCircle } from 'lucide-react';

const Login = () => {
  const [form, setForm]     = useState({ username: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login }           = useAuth();
  const navigate            = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Tên đăng nhập hoặc mật khẩu không đúng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-warm-white dark:bg-slate-900">
      {/* ── Left panel (ẩn trên mobile) ── */}
      <div className="hidden lg:flex flex-col justify-center flex-1 px-16 bg-white dark:bg-slate-800">
        <div className="max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-card">
              <FolderKanban className="text-white" size={20} />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg">TaskMaster</span>
          </div>

          <h1
            className="text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6"
            style={{ letterSpacing: '-1.5px' }}
          >
            Think it.<br />Make it.
          </h1>
          <p className="text-warm-gray dark:text-gray-400 text-lg leading-relaxed">
            Quản lý dự án và công việc của nhóm bạn — mượt mà, tối giản, và hiệu quả.
          </p>

          {/* Features list */}
          <ul className="mt-8 space-y-3">
            {['Kanban board trực quan', 'Theo dõi tiến độ theo thời gian thực', 'Bình luận & phối hợp nhóm'].map((f) => (
              <li key={f} className="flex items-center gap-3 text-warm-gray dark:text-gray-400 text-sm">
                <div className="w-5 h-5 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                {f}
              </li>
            ))}
          </ul>
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1" style={{ letterSpacing: '-0.5px' }}>Đăng nhập</h2>
            <p className="text-sm text-warm-gray dark:text-gray-400 mb-8">Chào mừng trở lại! Nhập thông tin của bạn.</p>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide">Tên đăng nhập</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nhập username..."
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide">Mật khẩu</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 text-base mt-2"
                disabled={loading}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <p className="text-center text-sm text-warm-gray dark:text-gray-400 mt-6">
              Chưa có tài khoản?{' '}
              <span className="text-primary font-semibold">Liên hệ Admin để được cấp tài khoản.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
