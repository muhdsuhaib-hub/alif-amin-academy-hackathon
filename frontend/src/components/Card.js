import React from 'react';

const variants = {
  default: 'bg-surface-card border border-ink-faint/20 shadow-apple-sm',
  flat:    'bg-surface-card border border-ink-faint/20',
  ghost:   'bg-surface-subtle',
  gradient: '',
};

export default function Card({ children, className = '', variant = 'default', hover = false, ...props }) {
  return (
    <div
      className={[
        'rounded-lg',
        variants[variant],
        hover ? 'transition-all duration-300 hover:shadow-apple-md hover:-translate-y-0.5' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`px-6 py-4 border-b border-surface-subtle ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
  return <div className={`px-6 py-6 ${className}`}>{children}</div>;
}
