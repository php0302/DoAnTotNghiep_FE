import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

// Mapping route → tiêu đề hiển thị
const TITLES = {
  '/':              'Tổng quan',
  '/projects':      'Dự án',
  '/my-tasks':      'Công việc của tôi',
  '/profile':       'Hồ sơ cá nhân',
  '/task-search':   'Tìm kiếm công việc',
  '/users':         'Quản lý Thành viên',
  '/admin/roles':   'Quản lý Chức vụ',
};

const AppLayout = () => {
  const { pathname } = useLocation();
  // Tìm tiêu đề phù hợp (kể cả dynamic routes như /projects/:id)
  const title = TITLES[pathname] ?? 'TaskMaster';

  return (
    <div className="flex h-screen bg-warm-white overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav title={title} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
