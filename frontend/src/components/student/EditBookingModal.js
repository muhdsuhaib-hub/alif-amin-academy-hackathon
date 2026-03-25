import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DURATIONS = [
  { value: 15, label: '15 min', credits: 1 },
  { value: 30, label: '30 min', credits: 2 },
  { value: 60, label: '60 min', credits: 4 },
];

export default function EditBookingModal({ isOpen, booking, onClose, onSuccess }) {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && booking) {
      fetchTeachers();
      setSelectedTeacher(booking.teacher_id || '');
      setSelectedDuration(booking.duration_minutes || 30);

      const start = new Date(booking.start_time_utc);
      setSelectedDate(start.toISOString().split('T')[0]);
      setSelectedTime(start.toTimeString().slice(0, 5));
    }
  }, [isOpen, booking]);

  const fetchTeachers = async () => {
    try {
      const res = await fetch(`${API}/booking/available-teachers`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers || []);
      }
    } catch (e) {
      console.error('Failed to load teachers:', e);
    }
  };

  const handleSave = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please fill in all fields');
      return;
    }

    const startTimeUTC = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();

    const payload = {};
    if (selectedTeacher !== booking.teacher_id) payload.teacher_id = selectedTeacher;
    if (startTimeUTC !== booking.start_time_utc) payload.start_time_utc = startTimeUTC;
    if (selectedDuration !== (booking.duration_minutes || 30)) payload.duration_minutes = selectedDuration;

    if (Object.keys(payload).length === 0) {
      toast.info('No changes made');
      onClose();
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/booking/${booking.booking_id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Booking updated successfully!');
        onSuccess?.();
        onClose();
      } else {
        toast.error(data.detail || 'Failed to update booking');
      }
    } catch (e) {
      toast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !booking) return null;

  const oldCredits = booking.credits_charged || DURATIONS.find(d => d.value === (booking.duration_minutes || 30))?.credits || 2;
  const newCredits = DURATIONS.find(d => d.value === selectedDuration)?.credits || 2;
  const creditDiff = newCredits - oldCredits;

  const times = [];
  for (let h = 6; h <= 22; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`);
    times.push(`${String(h).padStart(2, '0')}:30`);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" data-testid="edit-booking-overlay">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" data-testid="edit-booking-modal">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(15,61,46,0.08)' }}>
          <h2 className="text-lg font-semibold" style={{ color: '#0F3D2E' }}>Edit Booking</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" data-testid="edit-booking-close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <div className="grid grid-cols-3 gap-2" data-testid="edit-duration-selector">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setSelectedDuration(d.value)}
                  data-testid={`edit-duration-${d.value}`}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedDuration === d.value
                      ? 'bg-[#0F3D2E] text-white border-[#0F3D2E]'
                      : 'bg-gray-50 border-gray-200 hover:border-[#0F3D2E]/40'
                  }`}
                >
                  <p className="font-semibold">{d.label}</p>
                  <p className={`text-xs mt-0.5 ${selectedDuration === d.value ? 'text-white/70' : 'text-gray-500'}`}>
                    {d.credits} credit{d.credits > 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full h-12 px-4 rounded-xl border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/30"
              style={{ borderColor: 'rgba(15,61,46,0.15)' }}
              data-testid="edit-date-input"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/30"
              style={{ borderColor: 'rgba(15,61,46,0.15)' }}
              data-testid="edit-time-select"
            >
              {times.map(t => (
                <option key={t} value={t}>
                  {new Date(`2000-01-01T${t}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </option>
              ))}
            </select>
          </div>

          {/* Tutor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tutor</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/30"
              style={{ borderColor: 'rgba(15,61,46,0.15)' }}
              data-testid="edit-teacher-select"
            >
              <option value="">Select teacher...</option>
              {teachers.map(t => (
                <option key={t.teacher_id} value={t.teacher_id}>{t.name}</option>
              ))}
              {/* Keep current teacher even if not in available list */}
              {booking.teacher_id && !teachers.find(t => t.teacher_id === booking.teacher_id) && (
                <option value={booking.teacher_id}>{booking.teacher_name || 'Current Teacher'}</option>
              )}
            </select>
          </div>

          {/* Credit Diff Info */}
          {creditDiff !== 0 && (
            <div className={`p-3 rounded-xl border text-sm ${creditDiff > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-green-50 border-green-200 text-green-800'}`} data-testid="credit-diff-info">
              {creditDiff > 0
                ? `This will charge ${creditDiff} additional credit(s) from your wallet.`
                : `This will refund ${Math.abs(creditDiff)} credit(s) back to your wallet.`}
            </div>
          )}

          {/* Save */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border font-medium hover:bg-gray-50 transition-all"
              style={{ borderColor: 'rgba(15,61,46,0.2)', color: '#0F3D2E' }}
              data-testid="edit-booking-cancel-btn"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-[#0F3D2E] text-white font-medium hover:opacity-90 transition-all disabled:opacity-60"
              data-testid="edit-booking-save-btn"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
