import React from 'react';

export default function Button({ children, onClick, variant = 'primary', size = 'md', disabled, className = '' }) {
  const baseClasses = 'rounded-lg font-medium transition-all';
  
  const variantClasses = {
    primary: 'bg-[#0F3D2E] text-white hover:scale-105 active:scale-95',
    secondary: 'border-2 border-[#0F3D2E] text-[#0F3D2E] hover:bg-[#0F3D2E] hover:bg-opacity-5',
    danger: 'bg-[#E76F51] text-white hover:scale-105 active:scale-95',
    ghost: 'hover:bg-gray-100'
  };
  
  const sizeClasses = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-base',
    lg: 'h-12 px-8 text-lg'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
      style={{ fontFamily: 'Cal Sans' }}
    >
      {children}
    </button>
  );
}
