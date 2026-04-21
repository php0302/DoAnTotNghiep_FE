import React from 'react';

const Card = ({ children, padding = '24px', className = '', ...props }) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-white)',
        border: 'var(--border-whisper)',
        borderRadius: '12px',
        padding: padding,
        boxShadow: 'var(--shadow-soft-card)',
        transition: 'box-shadow 0.2s ease'
      }}
      className={className}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-deep-card)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-soft-card)';
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
