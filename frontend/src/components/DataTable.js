import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function DataTable({ headers, children, className = '' }) {
  return (
    <div className={`bg-surface-card rounded-lg border border-ink-faint/20 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-subtle">
              {headers.map((h, i) => (
                <th key={i} className={`px-6 py-3 text-caption font-medium text-ink-tertiary uppercase tracking-wider ${h.align === 'right' ? 'text-right' : 'text-left'}`}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-subtle">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Pagination({ page, totalPages, onPageChange, className = '' }) {
  return (
    <div className={`flex items-center justify-between px-6 py-4 border-t border-surface-subtle ${className}`}>
      <p className="text-small text-ink-secondary">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-2 rounded-md border border-ink-faint/30 transition-all hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="p-2 rounded-md border border-ink-faint/30 transition-all hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
