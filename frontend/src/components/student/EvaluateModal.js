import React, { useState } from 'react';
import { Star, X, Send } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function EvaluateModal({ session, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Please select a star rating'); return; }
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/classroom/session/${session.session_id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating, review }),
      });
      if (r.ok) {
        toast.success('Thank you for your feedback!');
        onSubmitted?.(session.booking_id);
        onClose();
      } else {
        const err = await r.json().catch(() => ({}));
        toast.error(err.detail || 'Failed to submit review');
      }
    } catch { toast.error('Network error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()} data-testid="evaluate-modal">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Evaluate Session</h2>
            <p className="text-xs text-slate-500 mt-0.5">with {session.teacher_name || session.student_name || 'Tutor'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 cursor-pointer" data-testid="close-evaluate-modal">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          {/* Star Rating */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">How was your session?</label>
            <div className="flex items-center justify-center gap-2" data-testid="star-rating">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110 cursor-pointer"
                  data-testid={`star-${s}`}
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      s <= (hoverRating || rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-xs text-slate-400 mt-2">
                {['', 'Needs Improvement', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Comments (optional)</label>
            <textarea
              value={review}
              onChange={e => setReview(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all resize-none"
              data-testid="review-textarea"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100">
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full h-12 rounded-2xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            data-testid="submit-evaluate-btn"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Evaluation'}
          </button>
        </div>
      </div>
    </div>
  );
}
