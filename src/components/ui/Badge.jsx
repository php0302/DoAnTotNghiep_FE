import React from 'react';

const Badge = ({ children, type = 'default', className = '', ...props }) => {
  let backgroundColor = 'var(--color-badge-bg)';
  let color = 'var(--color-focus-blue)';

  if (type === 'success') {
    backgroundColor = '#e6f7f6';
    color = 'var(--color-success)';
  } else if (type === 'warning') {
    backgroundColor = '#fdf2e8';
    color = 'var(--color-warning)';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: '9999px',
        backgroundColor,
        color,
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.125px'
      }}
      className={className}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
