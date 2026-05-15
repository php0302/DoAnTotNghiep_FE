import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/projects/ProjectDetail';
import MyTasks from './pages/tasks/MyTasks';
import TaskSearchPage from './pages/tasks/TaskSearchPage';
import Profile from './pages/profile/Profile';
import UserManagement from './pages/admin/UserManagement';
import StatisticDashboard from './pages/dashboard/StatisticDashboard';
import Spinner from './components/ui/Spinner';

/** Route yêu cầu đăng nhập */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <Spinner size="lg" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

/** Route chỉ dành cho chưa đăng nhập */
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Guest routes */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

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
      </Route>

      {/* Fallback */}
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
