import React from 'react';

const variants = {
  primary:   'bg-brand text-white hover:bg-brand-light shadow-apple-xs hover:shadow-apple-sm',
  secondary: 'bg-surface-card text-ink border border-ink-faint/40 hover:bg-surface-subtle hover:border-ink-tertiary',
  ghost:     'text-ink-secondary hover:bg-surface-subtle hover:text-ink',
  danger:    'bg-danger text-white hover:bg-danger/90 shadow-apple-xs',
  gold:      'bg-gold text-white hover:bg-gold-dark shadow-apple-xs',
  link:      'text-brand hover:text-brand-light underline-offset-4 hover:underline p-0 h-auto',
};

const sizes = {
  sm: 'h-9 px-4 text-small gap-1.5',
  md: 'h-11 px-6 text-small gap-2',
  lg: 'h-12 px-8 text-body gap-2',
};

export default function Button({
  children, onClick, variant = 'primary', size = 'md',
  disabled, className = '', type = 'button', ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center rounded-md font-medium',
        'transition-all duration-200 active:scale-[0.97]',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
