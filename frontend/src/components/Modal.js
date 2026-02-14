import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" />

      <div
        className={`relative bg-surface-card rounded-xl shadow-apple-lg w-full ${sizeMap[size]} animate-modal-in overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-surface-subtle">
          <h3 className="text-h3 text-ink">{title}</h3>
          <button
            onClick={onClose}
            data-testid="modal-close-btn"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-subtle transition-colors"
          >
            <X className="w-4 h-4 text-ink-tertiary" />
          </button>
        </div>

        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-surface-subtle flex gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
