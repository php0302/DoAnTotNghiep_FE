import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  Bell, User, LogOut, ChevronLeft, ChevronRight, Shield, BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';

const NAV_ITEMS = [
  { to: '/projects',  icon: FolderKanban,    label: 'Projects' },
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/my-tasks',  icon: CheckSquare,     label: 'My Tasks' },
  { to: '/profile',   icon: User,            label: 'Profile' },
];

const ADMIN_NAV = [
  { to: '/users',     icon: Shield,          label: 'Quản lý Thành viên' }
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside
      className={`
        flex flex-col h-full bg-white border-r border-black/10 transition-all duration-300
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo + collapse button */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-black/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FolderKanban size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">TaskMaster</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-black/5 text-warm-muted hover:text-gray-800 transition-colors ml-auto"
          title={collapsed ? 'Mở rộng' : 'Thu nhỏ'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          // Hide Dashboard for regular members
          if (label === 'Dashboard' && user && ['MEMBER', 'ROLE_MEMBER'].includes(user.role)) {
            return null;
          }
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}

        {user && ['ADMIN', 'ROLE_ADMIN'].includes(user.role) && (
          <>
            <div className={`mt-4 mb-2 text-[10px] font-bold text-warm-gray uppercase tracking-wider ${collapsed ? 'text-center px-1' : 'px-4'}`}>
              {!collapsed ? 'Quản trị' : '••'}
            </div>
            {ADMIN_NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active text-primary bg-primary/10' : 'hover:bg-primary/5 hover:text-primary'} ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-black/10 px-2 py-3 space-y-1">
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2">
            <Avatar name={user.fullName || user.username} size="sm" />
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-gray-900 truncate">{user.fullName || user.username}</p>
              <p className="text-xs text-warm-muted truncate">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50 ${collapsed ? 'justify-center' : ''}`}
          title="Đăng xuất"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
