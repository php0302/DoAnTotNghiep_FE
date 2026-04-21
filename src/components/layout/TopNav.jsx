import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import Avatar from '../ui/Avatar';
import NotificationDropdown from '../notifications/NotificationDropdown';

const TopNav = ({ title = 'Dashboard' }) => {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = () => {
    notificationService.getAll()
      .then(({ data }) => setNotifications(data?.data ?? []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    // Tự động làm mới thông báo mỗi 30 giây
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

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

  const handleMarkRead = async (id) => {
    await notificationService.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  return (
    <header className="h-14 bg-white border-b border-black/10 flex items-center justify-between px-6 flex-shrink-0">
      {/* Title */}
      <h1 className="text-base font-semibold text-gray-900">{title}</h1>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative btn-ghost p-2 rounded-lg"
            title="Thông báo"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <NotificationDropdown
              notifications={notifications}
              onMarkRead={handleMarkRead}
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
