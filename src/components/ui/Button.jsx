import React from 'react';

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid transparent',
    borderRadius: variant === 'pill' ? '9999px' : '4px',
    transition: 'all 0.2s ease',
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--color-blue)',
      color: 'var(--color-white)',
      padding: '8px 16px',
    },
    secondary: {
      backgroundColor: 'rgba(0,0,0,0.05)',
      color: 'var(--color-primary-text)',
      padding: '8px 16px',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-primary-text)',
      padding: '4px 8px',
    },
    pill: {
      backgroundColor: 'var(--color-badge-bg)',
      color: 'var(--color-focus-blue)',
      padding: '4px 8px',
      fontSize: '12px',
      fontWeight: '600',
    }
  };

  const style = { ...baseStyle, ...variants[variant] };

  return (
    <button style={style} className={`btn-custom ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
