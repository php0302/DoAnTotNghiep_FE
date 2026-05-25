import React, { useState, useEffect, useRef } from 'react';
import { Bell, Moon, Sun } from 'lucide-react';
import useThemeStore from '../../store/themeStore';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Avatar from '../ui/Avatar';
import NotificationDropdown from '../notifications/NotificationDropdown';

const TopNav = ({ title = 'Tổng quan' }) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const { theme, toggleTheme } = useThemeStore();

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-black/10 dark:border-white/10 flex items-center justify-between px-6 flex-shrink-0 transition-colors duration-200">
      {/* Title */}
      <h1 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h1>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn-ghost p-2 rounded-lg"
          title="Chuyển giao diện"
        >
          {theme === 'dark' ? <Sun size={20} className="text-warm-gray dark:text-gray-300" /> : <Moon size={20} className="text-warm-gray dark:text-gray-400" />}
        </button>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            id="notification-bell-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative btn-ghost p-2 rounded-lg"
            title="Thông báo"
          >
            <Bell size={20} className={unreadCount > 0 ? 'text-gray-900 dark:text-white' : 'text-warm-gray dark:text-gray-300'} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <NotificationDropdown
              notifications={notifications}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onClose={() => setNotifOpen(false)}
            />
          )}
        </div>

        {/* User avatar */}
        {user && (
          <Avatar name={user.fullName || user.username} size="sm" />
        )}
      </div>
    </header>
  );
};

export default TopNav;
