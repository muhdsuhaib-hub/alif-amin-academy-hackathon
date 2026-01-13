import React from 'react';

export default function Input({ label, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
          {label} {required && <span style={{ color: '#E76F51' }}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full h-11 px-4 rounded-lg border transition-all focus:outline-none focus:ring-2"
        style={{
          borderColor: 'rgba(15, 61, 46, 0.2)',
          fontFamily: 'Cal Sans',
          color: '#1F2933'
        }}
      />
    </div>
  );
}
