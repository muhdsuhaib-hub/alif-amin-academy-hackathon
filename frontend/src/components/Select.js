import React from 'react';
import { Check } from 'lucide-react';

export default function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-4 rounded-lg border transition-all focus:outline-none focus:ring-2"
        style={{
          borderColor: 'rgba(15, 61, 46, 0.2)',
          fontFamily: 'Cal Sans',
          color: '#1F2933'
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
