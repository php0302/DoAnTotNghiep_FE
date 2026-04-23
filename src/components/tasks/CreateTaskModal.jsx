import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { CheckSquare } from 'lucide-react';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const PRIORITY_LABELS = { LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao' };
const STATUS_LABELS = { TODO: 'Cần làm', IN_PROGRESS: 'Đang làm', DONE: 'Hoàn thành' };

/**
 * Modal tạo task mới trong project
 * @param {boolean} open
 * @param {function} onClose
 * @param {function} onCreate  - callback(formData)
 * @param {string} defaultStatus - status mặc định ('TODO' | 'IN_PROGRESS' | 'DONE')
 * @param {Array} members - danh sách member để assign
 */
const CreateTaskModal = ({ open, onClose, onCreate, defaultStatus = 'TODO', members = [] }) => {
  // Lấy ngày hiện tại theo giờ địa phương (YYYY-MM-DD)
  const today = new Date().toLocaleDateString('en-CA');

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: defaultStatus,
    deadline: '',
    assignedToId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Tiêu đề task không được để trống'); return; }
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        assignedToId: form.assignedToId ? Number(form.assignedToId) : undefined,
        deadline:   form.deadline   || undefined,
      };
      await onCreate(payload);
      setForm({ title: '', description: '', priority: 'MEDIUM', status: defaultStatus, deadline: '', assignedToId: '' });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Tạo task thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Thêm task mới" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-xs text-danger bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">Tiêu đề *</label>
          <input name="title" value={form.title} onChange={handleChange}
            className="input-field" placeholder="VD: Thiết kế màn hình Login" autoFocus />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">Mô tả</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            rows={2} className="input-field resize-none" placeholder="Chi tiết task..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">Ưu tiên</label>
            <select name="priority" value={form.priority} onChange={handleChange} className="input-field">
              {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">Trạng thái</label>
            <select name="status" value={form.status} onChange={handleChange} className="input-field">
              <option value="TODO">{STATUS_LABELS.TODO}</option>
              <option value="IN_PROGRESS">{STATUS_LABELS.IN_PROGRESS}</option>
              <option value="DONE">{STATUS_LABELS.DONE}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">Deadline</label>
            <input type="date" name="deadline" value={form.deadline} onChange={handleChange} min={today}
              className="input-field" />
          </div>
          {members.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-gray uppercase tracking-wide">Giao cho</label>
              <select name="assignedToId" value={form.assignedToId} onChange={handleChange} className="input-field">
                <option value="">Chưa giao</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.fullName || m.username}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            <CheckSquare size={15} />
            {loading ? 'Đang tạo...' : 'Tạo task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
