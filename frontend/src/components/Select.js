import React from 'react';

export default function Select({ label, value, onChange, options, placeholder, className = '' }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-small font-medium text-ink-secondary">{label}</label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-12 w-full rounded-md border border-ink-faint/40 bg-surface-card px-4 text-body appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23AEAEB2%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10 focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand/40 transition-all ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
