import React from 'react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import { Users, Crown, Shield, User } from 'lucide-react';

/** Badge role hiển thị cho từng thành viên */
const RoleBadge = ({ role }) => {
  const map = {
    PROJECT_MANAGER: { label: 'Quản lý', icon: Crown,  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    ADMIN:           { label: 'Admin',    icon: Shield, cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
    MEMBER:          { label: 'Thành viên', icon: User, cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  };

  const cfg = map[role] ?? map.MEMBER;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
};

/**
 * ProjectMembersModal — hiển thị danh sách thành viên của một dự án
 *
 * @param {boolean}  open      - show/hide
 * @param {function} onClose   - callback đóng modal
 * @param {string}   projectName - tên dự án
 * @param {Array}    members   - mảng UserResponse [{ id, fullName, username, email, role }]
 * @param {boolean}  loading   - đang tải dữ liệu
 */
const ProjectMembersModal = ({ open, onClose, projectName, members = [], loading = false }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Users size={17} className="text-primary" />
          Thành viên dự án
        </span>
      }
      size="sm"
    >
      {/* Project name sub-heading */}
      <p className="text-xs text-warm-muted dark:text-gray-400 -mt-2 mb-4 truncate">
        {projectName}
      </p>

      {loading ? (
        /* skeleton */
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-black/10 dark:bg-white/10 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-black/10 dark:bg-white/10 rounded w-3/5" />
                <div className="h-2.5 bg-black/5 dark:bg-white/5 rounded w-2/5" />
              </div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-8 text-warm-muted dark:text-gray-500 text-sm">
          <Users size={36} className="mx-auto mb-2 opacity-25" />
          Chưa có thành viên nào
        </div>
      ) : (
        <ul className="space-y-2 max-h-[380px] overflow-y-auto pr-1 -mr-1">
          {members.map((m, idx) => (
            <li
              key={m.id ?? idx}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.07] transition-colors"
            >
              {/* Avatar */}
              <Avatar name={m.fullName || m.username} src={m.avatarUrl} size="md" className="flex-shrink-0" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {m.fullName || m.username}
                </p>
                {m.email && (
                  <p className="text-xs text-warm-muted dark:text-gray-400 truncate">{m.email}</p>
                )}
              </div>

              {/* Role badge */}
              <RoleBadge role={m.role} />
            </li>
          ))}
        </ul>
      )}

      {/* Footer count */}
      {!loading && members.length > 0 && (
        <p className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 text-xs text-warm-muted dark:text-gray-500 text-right">
          {members.length} thành viên
        </p>
      )}
    </Modal>
  );
};

export default ProjectMembersModal;
