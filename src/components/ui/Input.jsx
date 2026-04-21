import React from 'react';

const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {label && <label className="text-caption">{label}</label>}
      <input
        style={{
          backgroundColor: 'var(--color-white)',
          color: 'var(--color-primary-text)',
          border: '1px solid #dddddd',
          padding: '8px 12px',
          borderRadius: '4px',
          outline: 'none',
          fontFamily: 'var(--font-family-base)',
          fontSize: '15px'
        }}
        className={className}
        onFocus={(e) => {
          e.target.style.border = '1px solid var(--color-focus-blue)';
          e.target.style.boxShadow = '0 0 0 2px rgba(9, 127, 232, 0.2)';
        }}
        onBlur={(e) => {
          e.target.style.border = '1px solid #dddddd';
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && <span style={{ color: 'var(--color-warning)', fontSize: '12px' }}>{error}</span>}
    </div>
  );
};

export default Input;
