import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Star, X, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DURATIONS = [
  { value: 15, label: '15 min', credits: 1 },
  { value: 30, label: '30 min', credits: 2 },
  { value: 60, label: '60 min', credits: 4 },
];

export default function BookingModal({ isOpen, onClose, onSuccess, preSelectedDate, preSelectedTime }) {
  const [step, setStep] = useState(1); // 1=select teacher+time, 2=confirm
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('20:00');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [walletBalance, setWalletBalance] = useState(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
      fetchWalletBalance();
      setStep(1);
      setSelectedTeacher(null);

      // Set pre-selected date/time
      if (preSelectedDate) {
        const d = new Date(preSelectedDate);
        const dateStr = d.toISOString().split('T')[0];
        setSelectedDate(dateStr);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow.toISOString().split('T')[0]);
      }
      if (preSelectedTime) setSelectedTime(preSelectedTime);
    }
  }, [isOpen, preSelectedDate, preSelectedTime]);

  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const res = await fetch(`${API}/booking/available-teachers`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers || []);
      }
    } catch (e) {
      console.error('Failed to fetch teachers:', e);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const res = await fetch(`${API}/wallet/balance?user_id=${encodeURIComponent(document.cookie.split('session_token=')[1]?.split(';')[0] || '')}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.wallet);
      }
    } catch (e) {
      console.error('Failed to fetch wallet:', e);
    }
  };

  const creditsNeeded = DURATIONS.find(d => d.value === selectedDuration)?.credits || 2;
  const totalCredits = walletBalance ? (walletBalance.paid_credits || 0) + (walletBalance.bonus_credits || 0) : 0;
  const hasEnoughCredits = totalCredits >= creditsNeeded;

  const handleConfirmBooking = async () => {
    if (!selectedTeacher || !selectedDate || !selectedTime) {
      toast.error('Please fill in all fields');
      return;
    }

    const startTimeUTC = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();

    setBooking(true);
    try {
      const res = await fetch(`${API}/booking/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          teacher_id: selectedTeacher.teacher_id,
          start_time_utc: startTimeUTC,
          duration_minutes: selectedDuration,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Session booked with ${selectedTeacher.name}!`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(data.detail || 'Booking failed');
      }
    } catch (e) {
      toast.error('Network error. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (!isOpen) return null;

  const times = [];
  for (let h = 6; h <= 22; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`);
    times.push(`${String(h).padStart(2, '0')}:30`);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" data-testid="booking-modal-overlay">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" data-testid="booking-modal">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(15,61,46,0.08)' }}>
          <h2 className="text-lg font-semibold" style={{ color: '#0F3D2E' }}>
            {step === 1 ? 'Book a Session' : 'Confirm Booking'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" data-testid="booking-modal-close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {step === 1 && (
            <>
              {/* Duration Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Duration</label>
                <div className="grid grid-cols-3 gap-2" data-testid="duration-selector">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDuration(d.value)}
                      data-testid={`duration-${d.value}`}
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
                  data-testid="booking-date-input"
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
                  data-testid="booking-time-select"
                >
                  {times.map(t => (
                    <option key={t} value={t}>
                      {new Date(`2000-01-01T${t}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
                {loadingTeachers ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0F3D2E]" />
                  </div>
                ) : teachers.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No teachers available at the moment.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto" data-testid="teacher-list">
                    {teachers.map((t) => (
                      <button
                        key={t.teacher_id}
                        onClick={() => setSelectedTeacher(t)}
                        data-testid={`teacher-option-${t.teacher_id}`}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          selectedTeacher?.teacher_id === t.teacher_id
                            ? 'bg-[#0F3D2E]/5 border-[#0F3D2E]'
                            : 'bg-gray-50 border-gray-200 hover:border-[#0F3D2E]/40'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#0F3D2E] flex items-center justify-center text-white font-medium flex-shrink-0">
                          {t.picture ? (
                            <img src={t.picture} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            t.name?.charAt(0) || 'T'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate" style={{ color: '#1F2933' }}>{t.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {t.specializations?.length > 0 && (
                              <span>{t.specializations.slice(0, 2).join(', ')}</span>
                            )}
                            {t.rating > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 text-[#D4AF37] fill-current" />
                                {t.rating}
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedTeacher?.teacher_id === t.teacher_id && (
                          <div className="w-5 h-5 rounded-full bg-[#0F3D2E] flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Credit Summary */}
              <div className={`p-4 rounded-xl border ${hasEnoughCredits ? 'bg-[#0F3D2E]/5 border-[#0F3D2E]/20' : 'bg-red-50 border-red-200'}`} data-testid="credit-summary">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Credits Required</span>
                  <span className="font-semibold" style={{ color: '#0F3D2E' }}>{creditsNeeded} credit{creditsNeeded > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-gray-600">Your Balance</span>
                  <span className={`font-semibold ${hasEnoughCredits ? '' : 'text-red-600'}`}>
                    {walletBalance ? `${totalCredits} credits` : 'Loading...'}
                  </span>
                </div>
                {!hasEnoughCredits && walletBalance && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Insufficient credits. Please top up your wallet.</span>
                  </div>
                )}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setStep(2)}
                disabled={!selectedTeacher || !selectedDate || !selectedTime || !hasEnoughCredits}
                className="w-full h-12 rounded-xl bg-[#0F3D2E] text-white font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                data-testid="booking-next-btn"
              >
                Review Booking
              </button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Confirmation Summary */}
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-[#0F3D2E] flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {selectedTeacher?.picture ? (
                      <img src={selectedTeacher.picture} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      selectedTeacher?.name?.charAt(0) || 'T'
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{selectedTeacher?.name}</p>
                    <p className="text-sm text-gray-500">
                      {selectedTeacher?.specializations?.slice(0, 2).join(', ') || 'Quran Teacher'}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      {new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      {' '}&middot; {selectedDuration} minutes
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/20">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Session Cost</span>
                    <span className="font-semibold" style={{ color: '#0F3D2E' }}>
                      {creditsNeeded} credit{creditsNeeded > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Will be deducted from your wallet</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border font-medium hover:bg-gray-50 transition-all"
                  style={{ borderColor: 'rgba(15,61,46,0.2)', color: '#0F3D2E' }}
                  data-testid="booking-back-btn"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={booking}
                  className="flex-1 py-3 rounded-xl bg-[#0F3D2E] text-white font-medium hover:opacity-90 transition-all disabled:opacity-60"
                  data-testid="booking-confirm-btn"
                >
                  {booking ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Booking...
                    </span>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
