import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className={`bg-white rounded-2xl shadow-xl w-full ${sizeClasses[size]} relative`}
          style={{ fontFamily: 'Cal Sans' }}
        >
          <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
            <h3 className="text-xl font-semibold" style={{ color: '#1F2933' }}>{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              <X className="w-5 h-5" style={{ color: '#5A5A5A' }} />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
