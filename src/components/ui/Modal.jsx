import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Generic Modal component - dùng Portal-style overlay
 * @param {boolean} open - show/hide
 * @param {function} onClose - callback đóng modal
 * @param {string} title - tiêu đề modal
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl'
 */
const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  const ref = useRef(null);

  // Đóng modal khi nhấn Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Khóa scroll body khi modal mở
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={ref}
        className={`relative z-10 w-full ${widths[size]} bg-white rounded-2xl shadow-deep border border-black/10 animate-fadeIn`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.18s ease-out; }
      `}</style>
    </div>
  );
};

export default Modal;
