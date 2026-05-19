import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/auth/Login';
import ChangePassword from './pages/auth/ChangePassword';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/projects/ProjectDetail';
import MyTasks from './pages/tasks/MyTasks';
import TaskSearchPage from './pages/tasks/TaskSearchPage';
import Profile from './pages/profile/Profile';
import UserManagement from './pages/admin/UserManagement';
import RoleManagement from './pages/admin/RoleManagement';
import StatisticDashboard from './pages/dashboard/StatisticDashboard';
import DailyReport from './pages/reports/DailyReport';
import Spinner from './components/ui/Spinner';

/**
 * Route yêu cầu đăng nhập.
 * Nếu user chưa đổi mật khẩu (mustChangePassword = true) → redirect /change-password.
 */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  return children;
};

/** Route chỉ dành cho chưa đăng nhập */
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
};

/**
 * Route đặc biệt cho trang đổi mật khẩu:
 * - Phải đã đăng nhập
 * - Nếu KHÔNG cần đổi mật khẩu → redirect về /
 */
const ChangePasswordRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-warm-white">
      <Spinner size="lg" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!user.mustChangePassword) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Guest routes */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />

      {/* Trang đổi mật khẩu lần đầu (bắt buộc) */}
      <Route path="/change-password" element={<ChangePasswordRoute><ChangePassword /></ChangePasswordRoute>} />

      {/* Protected routes */}
      <Route
        path="/"
        element={<PrivateRoute><AppLayout /></PrivateRoute>}
      >
        <Route index element={<StatisticDashboard />} />
        <Route path="projects" element={<Dashboard />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="my-tasks" element={<MyTasks />} />
        <Route path="task-search" element={<TaskSearchPage />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="admin/roles" element={<RoleManagement />} />
        <Route path="reports/daily" element={<DailyReport />} />
      </Route>

      {/* Fallback — /register bị xóa, redirect về / */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
