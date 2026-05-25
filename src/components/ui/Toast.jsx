import React, { useEffect, useState } from 'react';
import { Bell, MessageSquare, Calendar, X, AlertCircle } from 'lucide-react';

const TYPE_CONFIG = {
  TASK_ASSIGNED:    { icon: Bell,          color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200'  },
  DEADLINE_UPDATED: { icon: Calendar,      color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200'},
  TASK_DELETED:     { icon: AlertCircle,   color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200'   },
  COMMENT_ADDED:    { icon: MessageSquare, color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
  GENERAL:          { icon: Bell,          color: 'text-gray-600',   bg: 'bg-gray-50 dark:bg-slate-800/80',   border: 'border-gray-200'  },
};

/**
 * Toast notification popup tự dismiss sau 4 giây
 * @param {object}   notification  - { id, content, type }
 * @param {function} onDismiss     - callback khi dismiss (bằng tay hoặc auto)
 */
const Toast = ({ notification, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const cfg = TYPE_CONFIG[notification?.type] ?? TYPE_CONFIG.GENERAL;
  const Icon = cfg.icon;

  useEffect(() => {
    // Slide in
    const t1 = setTimeout(() => setVisible(true), 10);
    // Auto dismiss sau 4 giây
    const t2 = setTimeout(() => handleDismiss(), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss(notification.id), 350);
  };

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-lg max-w-sm w-full cursor-pointer
        ${cfg.bg} ${cfg.border}
        transition-all duration-350 ease-out
        ${visible && !leaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      onClick={handleDismiss}
      role="alert"
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white dark:bg-slate-800 shadow-sm`}>
        <Icon size={15} className={cfg.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
          Thông báo mới
        </p>
        <p className="text-sm text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">
          {notification.content}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5"
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      <div className={`absolute bottom-0 left-0 h-0.5 rounded-b-xl ${cfg.color.replace('text-', 'bg-')} animate-shrink`} />
    </div>
  );
};

/**
 * Container chứa danh sách Toast, xuất hiện góc dưới-phải
 */
export const ToastContainer = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast notification={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};

export default Toast;
