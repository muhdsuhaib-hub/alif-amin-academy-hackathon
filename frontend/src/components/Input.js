import React from 'react';

export default function Input({
  label, type = 'text', value, onChange, placeholder,
  required, className = '', icon: Icon, ...props
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-small font-medium text-ink-secondary">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
        )}
        <input
          type={type}
          value={value}
          onChange={typeof onChange === 'function' && onChange.length === 0 ? onChange : (e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={[
            'h-12 w-full rounded-md border border-ink-faint/40 bg-surface-card px-4 text-body',
            'placeholder:text-ink-tertiary',
            'focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand/40',
            'transition-all duration-200',
            Icon ? 'pl-11' : '',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
    </div>
  );
}
