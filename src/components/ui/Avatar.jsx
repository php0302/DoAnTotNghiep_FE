import React from 'react';

/**
 * Avatar hiển thị ảnh hoặc initials
 */
const Avatar = ({ name = '', src = null, size = 'md', className = '' }) => {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Màu nền dựa theo chữ đầu tên
  const colors = [
    'bg-blue-200 text-blue-800',
    'bg-purple-200 text-purple-800',
    'bg-green-200 text-green-800',
    'bg-orange-200 text-orange-800',
    'bg-teal-200 text-teal-800',
    'bg-pink-200 text-pink-800',
  ];
  const color = colors[(name.charCodeAt(0) || 0) % colors.length];

  return src ? (
    <img
      src={src}
      alt={name}
      className={`${sizes[size]} rounded-full object-cover border border-black/10 dark:border-white/10 ${className}`}
    />
  ) : (
    <div
      title={name}
      className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-semibold border border-black/10 dark:border-white/10 ${className}`}
    >
      {initials || '?'}
    </div>
  );
};

export default Avatar;
