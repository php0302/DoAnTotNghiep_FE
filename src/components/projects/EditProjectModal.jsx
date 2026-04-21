import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { FolderKanban } from 'lucide-react';

/**
 * Modal chỉnh sửa project
 * @param {boolean} open
 * @param {function} onClose
 * @param {function} onSave - callback(id, formData)
 * @param {object}  project - dữ liệu hiện tại của project
 */
const EditProjectModal = ({ open, onClose, onSave, project }) => {
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  // Khi project thay đổi (mở modal), điền sẵn form
  useEffect(() => {
    if (project) {
      setForm({
        name:        project.name        ?? '',
        description: project.description ?? '',
        startDate:   project.startDate   ?? '',
        endDate:     project.endDate     ?? '',
      });
    }
    setError('');
  }, [project, open]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Tên dự án không được để trống'); return; }
    if (!form.startDate)   { setError('Ngày bắt đầu không được để trống'); return; }
    if (form.endDate && form.endDate < form.startDate) {
      setError('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSave(project.id, form);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa dự án" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-xs text-danger bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">Tên dự án *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="input-field"
            placeholder="Tên dự án"
            autoFocus
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">Mô tả</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="input-field resize-none"
            placeholder="Mô tả ngắn về dự án..."
          />
        </div>

        <div className="flex gap-3">
          <div className="space-y-1 flex-1">
            <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">Ngày bắt đầu *</label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div className="space-y-1 flex-1">
            <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">Ngày kết thúc</label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              min={form.startDate} /* không cho chọn trước ngày bắt đầu */
              className="input-field"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            <FolderKanban size={15} />
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProjectModal;
