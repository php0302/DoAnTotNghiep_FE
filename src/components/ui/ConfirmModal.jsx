import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ open, title, content, onConfirm, onClose, confirmText = 'Xác nhận', cancelText = 'Hủy', danger = false }) => {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center p-2">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-red-100 text-red-500' : 'bg-primary/10 text-primary'}`}>
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-warm-gray leading-relaxed mb-6">
          {content}
        </p>

        <div className="flex w-full gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary justify-center">
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 justify-center btn-primary ${danger ? 'bg-danger hover:bg-red-600 focus:ring-red-500/20' : ''}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
