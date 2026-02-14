import React from 'react';

export default function Button({ children, onClick, variant = 'primary', size = 'md', disabled, className = '', type = 'button', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-[#0F3D2E] text-white hover:bg-[#0F3D2E]/90 shadow-sm hover:shadow-md',
    secondary: 'bg-white text-[#1D1D1F] border border-gray-200 hover:bg-gray-50 hover:border-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
    ghost: 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900',
    link: 'text-[#0F3D2E] hover:text-[#0F3D2E]/80 underline-offset-4 hover:underline p-0 h-auto'
  };
  
  const sizes = {
    sm: 'h-9 px-4 text-[13px]',
    md: 'h-11 px-6 text-sm',
    lg: 'h-12 px-8 text-base'
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
