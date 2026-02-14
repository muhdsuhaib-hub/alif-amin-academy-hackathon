import React from 'react';

const colorMap = {
  brand:   'bg-brand/10 text-brand',
  gold:    'bg-gold/10 text-gold-dark',
  teal:    'bg-teal/10 text-teal',
  coral:   'bg-coral/10 text-coral',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger:  'bg-danger/10 text-danger',
  info:    'bg-info/10 text-info',
  neutral: 'bg-surface-subtle text-ink-secondary',
};

const sizeMap = {
  sm: 'text-caption px-2 py-0.5',
  md: 'text-small px-2.5 py-0.5',
};

export default function Badge({ children, color = 'neutral', size = 'sm', className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium capitalize ${colorMap[color]} ${sizeMap[size]} ${className}`}>
      {children}
    </span>
  );
}
