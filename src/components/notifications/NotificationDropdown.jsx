import React from 'react';
import { Bell, CheckCheck, MessageSquare, Calendar, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TYPE_CONFIG = {
  TASK_ASSIGNED:    { icon: Bell,          color: 'text-blue-500',   bg: 'bg-blue-50'   },
  DEADLINE_UPDATED: { icon: Calendar,      color: 'text-orange-500', bg: 'bg-orange-50' },
  TASK_DELETED:     { icon: AlertCircle,   color: 'text-red-500',    bg: 'bg-red-50'    },
  COMMENT_ADDED:    { icon: MessageSquare, color: 'text-green-500',  bg: 'bg-green-50'  },
  GENERAL:          { icon: Bell,          color: 'text-gray-400',   bg: 'bg-gray-50'   },
};

/**
 * Dropdown thông báo giống Facebook
 * @param {Array}    notifications
 * @param {function} onMarkRead
 * @param {function} onMarkAllRead
 * @param {function} onClose
 */
const NotificationDropdown = ({ notifications = [], onMarkRead, onMarkAllRead, onClose }) => {
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleClickNotif = (n) => {
    // Đánh dấu đã đọc
    if (!n.isRead) onMarkRead(n.id);

    // Điều hướng đến task nếu có taskId
    if (n.taskId) {
      navigate(`/projects?taskId=${n.taskId}`);
      onClose?.();
    }
  };

  const handleMarkAllRead = async () => {
    await onMarkAllRead?.();
  };

  return (
    <div className="absolute right-0 top-12 z-50 w-[360px] bg-white border border-black/10 rounded-2xl shadow-deep overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/8">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">Thông báo</span>
          {unreadCount > 0 && (
            <span className="badge-blue">{unreadCount} mới</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              title="Đánh dấu tất cả đã đọc"
              className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover font-medium px-2 py-1 rounded-md hover:bg-primary/5 transition-colors"
            >
              <CheckCheck size={13} /> Đọc tất cả
            </button>
          )}
        </div>
      </div>

      {/* ── List ── */}
      <div className="max-h-96 overflow-y-auto divide-y divide-black/5">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-warm-muted gap-2">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
              <Bell size={24} className="opacity-30" />
            </div>
            <p className="text-sm font-medium">Không có thông báo nào</p>
            <p className="text-xs text-warm-muted">Bạn sẽ nhận được thông báo ở đây</p>
          </div>
        ) : (
          notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.GENERAL;
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
                  ${n.isRead ? 'hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50/60'}`}
                onClick={() => handleClickNotif(n)}
              >
                {/* Type icon */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon size={16} className={cfg.color} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                    {n.content}
                  </p>
                  <p className="text-xs text-warm-muted mt-0.5">
                    {n.createdAt && new Date(n.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>

                {/* Unread dot + actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                  {!n.isRead && (
                    <>
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      <button
                        title="Đánh dấu đã đọc"
                        onClick={(e) => { e.stopPropagation(); onMarkRead(n.id); }}
                        className="p-1 rounded-md text-warm-muted hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <CheckCheck size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer ── */}
      {notifications.length > 0 && (
        <div className="border-t border-black/8 px-4 py-2.5 text-center">
          <span className="text-xs text-warm-muted">
            {notifications.length} thông báo
          </span>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
