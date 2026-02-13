import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CancelBookingDialog({ isOpen, booking, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !booking) return null;

  const startTime = new Date(booking.start_time_utc);
  const now = new Date();
  const hoursUntil = (startTime - now) / (1000 * 60 * 60);
  const isWithin24h = hoursUntil < 24;

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/booking/${booking.booking_id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirm_no_refund: isWithin24h }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.refunded) {
          toast.success(`Booking cancelled. ${data.credits_refunded} credit(s) refunded to your wallet.`);
        } else {
          toast.success('Booking cancelled. Credits were not refunded (less than 24 hours notice).');
        }
        onSuccess?.();
        onClose();
      } else {
        toast.error(data.detail || 'Failed to cancel booking');
      }
    } catch (e) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" data-testid="cancel-dialog-overlay">
      <div className="bg-white rounded-2xl w-full max-w-md" data-testid="cancel-dialog">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(15,61,46,0.08)' }}>
          <h2 className="text-lg font-semibold text-gray-900">Cancel Booking</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" data-testid="cancel-dialog-close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          {/* Booking Info */}
          <div className="p-4 bg-gray-50 rounded-xl mb-4">
            <p className="font-medium text-sm" style={{ color: '#1F2933' }}>
              {booking.teacher_name || 'Teacher'} &middot; {booking.duration_minutes || 30} min
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              {' at '}
              {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </p>
          </div>

          {/* Warning */}
          {isWithin24h ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-5" data-testid="no-refund-warning">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800 text-sm">No Refund</p>
                  <p className="text-red-700 text-xs mt-1">
                    This class is in less than 24 hours ({Math.max(0, Math.floor(hoursUntil))}h {Math.floor((hoursUntil % 1) * 60)}m remaining).
                    Your credits for this session ({booking.credits_charged || 0} credit{(booking.credits_charged || 0) > 1 ? 's' : ''}) will <strong>not be refunded</strong>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-5" data-testid="refund-notice">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-green-800 text-sm">Full Refund</p>
                  <p className="text-green-700 text-xs mt-1">
                    You're cancelling more than 24 hours before the class.
                    {booking.credits_charged > 0 && ` ${booking.credits_charged} credit(s) will be refunded to your wallet.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border font-medium hover:bg-gray-50 transition-all"
              style={{ borderColor: 'rgba(15,61,46,0.2)', color: '#0F3D2E' }}
              data-testid="cancel-dialog-keep-btn"
            >
              Keep Booking
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all disabled:opacity-60"
              data-testid="cancel-dialog-confirm-btn"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cancelling...
                </span>
              ) : (
                'Cancel Booking'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
