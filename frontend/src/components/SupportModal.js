import React, { useState } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SUBJECTS = [
  { value: 'technical', label: 'Technical Issue' },
  { value: 'billing', label: 'Billing & Payments' },
  { value: 'general', label: 'General Inquiry' },
];

export default function SupportModal({ isOpen, onClose, user }) {
  const [subject, setSubject] = useState('general');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!message.trim()) { toast.error('Please enter a message'); return; }
    setSending(true);
    try {
      const r = await fetch(`${API}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject, message: message.trim() }),
      });
      if (r.ok) {
        toast.success('Support ticket submitted! We\'ll get back to you soon.');
        setMessage('');
        setSubject('general');
        onClose();
      } else {
        const data = await r.json();
        toast.error(data.detail || 'Failed to submit ticket');
      }
    } catch { toast.error('Network error. Please try again.'); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md overflow-hidden animate-modal-in shadow-xl"
        onClick={e => e.stopPropagation()}
        data-testid="support-modal"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">Contact Support</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            data-testid="support-modal-close"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Subject</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all"
              data-testid="support-subject-select"
            >
              {SUBJECTS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe your issue or question..."
              rows={5}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all resize-none"
              data-testid="support-message-input"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={sending || !message.trim()}
            className="w-full h-12 rounded-2xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
            data-testid="support-submit-btn"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Submitting...' : 'Submit Ticket'}
          </button>

          <p className="text-[11px] text-slate-400 text-center">
            Our team typically responds within 24 hours
          </p>
        </div>
      </div>
    </div>
  );
}
