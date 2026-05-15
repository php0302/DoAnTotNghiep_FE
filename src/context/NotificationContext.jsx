import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import websocketService from '../services/websocketService';
import { ToastContainer } from '../components/ui/Toast';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts]               = useState([]);
  const toastIdCounter                    = useRef(0);
  // Chỉ lưu bool "đã có token chưa" để tránh re-render liên tục
  const [isLoggedIn, setIsLoggedIn]       = useState(() => !!localStorage.getItem('token'));
  // Giữ ref tới handler để WS mới có thể gọi đúng callback
  const notifHandlerRef                   = useRef(null);

  // ── Lắng nghe custom event "auth-change" từ authService ─────────────────────
  // Thay vì polling, AuthContext dispatch event này khi login/logout
  useEffect(() => {
    const handler = () => {
      const hasToken = !!localStorage.getItem('token');
      setIsLoggedIn(hasToken);
    };
    window.addEventListener('auth-change', handler);
    return () => window.removeEventListener('auth-change', handler);
  }, []);

  // ── Load từ DB ───────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(() => {
    if (!localStorage.getItem('token')) { setNotifications([]); return; }
    notificationService.getAll()
      .then(({ data }) => setNotifications(data?.data ?? []))
      .catch(() => {});
  }, []);

  // ── WebSocket lifecycle — chỉ chạy khi isLoggedIn thay đổi ─────────────────
  useEffect(() => {
    if (!isLoggedIn) {
      websocketService.disconnect();
      setNotifications([]);
      return;
    }

    fetchNotifications();

    notifHandlerRef.current = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      pushToast(notification);
      // Phát event để Dashboard hoặc component khác lắng nghe và xử lý logic
      window.dispatchEvent(new CustomEvent('ws:notification', { detail: notification }));
    };

    const token = localStorage.getItem('token');
    if (token) {
      websocketService.connect(token, (n) => notifHandlerRef.current?.(n));
    }

    return () => websocketService.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // ── Toast ────────────────────────────────────────────────────────────────────
  const pushToast = (notification) => {
    const toastId = `toast-${toastIdCounter.current++}`;
    setToasts((prev) => [...prev, { ...notification, _toastId: toastId }]);
  };

  const dismissToast = (toastId) => {
    setToasts((prev) => prev.filter((t) => t._toastId !== toastId));
  };

  // ── Mark read ────────────────────────────────────────────────────────────────
  const markRead = useCallback(async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch { /* ignore */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, fetchNotifications }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
