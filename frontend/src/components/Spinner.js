import React from 'react';

const sizeMap = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-10 h-10 border-[3px]',
};

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <div className={`${sizeMap[size]} border-brand border-t-transparent rounded-full animate-spin ${className}`} />
  );
}

export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="md" />
        <p className="text-small text-ink-tertiary">{message}</p>
      </div>
    </div>
  );
}
