import React from 'react';

export default function Input({ label, type = 'text', value, onChange, placeholder, required, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[13px] font-medium text-gray-700 tracking-tight">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`apple-input ${className}`}
        {...props}
      />
    </div>
  );
}
