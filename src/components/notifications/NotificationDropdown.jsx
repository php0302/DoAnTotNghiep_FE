import React from 'react';
import { Bell, CheckCheck } from 'lucide-react';

/**
 * Dropdown thông báo xuất hiện từ TopNav
 */
const NotificationDropdown = ({ notifications = [], onMarkRead }) => {
  return (
    <div className="absolute right-0 top-10 z-50 w-80 bg-white border border-black/10 rounded-xl shadow-deep overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
        <span className="text-sm font-semibold text-gray-900">Thông báo</span>
        <span className="badge-blue">{notifications.filter((n) => !n.read).length} mới</span>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-black/5">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-warm-muted">
            <Bell size={32} className="mb-2 opacity-40" />
            <p className="text-sm">Không có thông báo</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 hover:bg-warm-white transition-colors cursor-pointer
                ${n.read ? 'opacity-60' : ''}`}
              onClick={() => !n.read && onMarkRead(n.id)}
            >
              {/* Dot unread */}
              <div className="mt-1.5 flex-shrink-0">
                {!n.read
                  ? <div className="w-2 h-2 rounded-full bg-primary" />
                  : <div className="w-2 h-2 rounded-full bg-transparent" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-snug">{n.message || n.content || 'Thông báo mới'}</p>
                {n.createdAt && (
                  <p className="text-xs text-warm-muted mt-0.5">
                    {new Date(n.createdAt).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
              {!n.read && (
                <button
                  title="Đánh dấu đã đọc"
                  className="text-primary hover:text-primary-hover flex-shrink-0 mt-0.5"
                  onClick={(e) => { e.stopPropagation(); onMarkRead(n.id); }}
                >
                  <CheckCheck size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
