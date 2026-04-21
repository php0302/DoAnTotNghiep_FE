import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Spinner loading component
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <Loader2 className={`animate-spin text-primary ${sizes[size]} ${className}`} />
  );
};

export default Spinner;
