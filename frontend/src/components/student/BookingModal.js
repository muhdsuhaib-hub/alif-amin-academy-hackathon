import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Star, X, AlertCircle, ChevronRight, ChevronLeft, User, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Spinner from '../Spinner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const DURATIONS = [
  { value: 15, label: '15 min', credits: 1 },
  { value: 30, label: '30 min', credits: 2 },
  { value: 60, label: '60 min', credits: 4 },
];

const STEPS = ['Configure', 'Select Teacher', 'Review'];

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100" data-testid="booking-step-indicator">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />}
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
            i + 1 === currentStep ? 'bg-emerald-100 text-emerald-700' :
            i + 1 < currentStep ? 'text-emerald-600' : 'text-slate-400'
          }`}>
            {label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function BookingModal({ isOpen, onClose, onSuccess, user }) {
  const [step, setStep] = useState(1);
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('20:00');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [walletBalance, setWalletBalance] = useState(null);
  const [booking, setBooking] = useState(false);
  const [profileTeacher, setProfileTeacher] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchWalletBalance();
      setStep(1);
      setSelectedTeacher(null);
      setTeachers([]);
      setProfileTeacher(null);
      const t = new Date();
      t.setDate(t.getDate() + 1);
      setSelectedDate(t.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const fetchTeachers = async (date, time) => {
    if (!date || !time) return;
    setLoadingTeachers(true);
    try {
      const r = await fetch(`${API}/booking/available-teachers?date=${date}&time=${time}&duration=${selectedDuration}`, { credentials: 'include' });
      if (r.ok) { const d = await r.json(); setTeachers(d.teachers || []); }
    } catch (e) { console.error(e); }
    finally { setLoadingTeachers(false); }
  };

  const fetchWalletBalance = async () => {
    if (!user?.user_id) return;
    try {
      const r = await fetch(`${API}/wallet/balance?user_id=${user.user_id}`, { credentials: 'include' });
      if (r.ok) { const d = await r.json(); setWalletBalance(d.wallet); }
    } catch (e) { console.error(e); }
  };

  const creditsNeeded = DURATIONS.find(d => d.value === selectedDuration)?.credits || 2;
  const totalCredits = walletBalance ? (walletBalance.paid_credits || 0) + (walletBalance.bonus_credits || 0) : 0;
  const hasEnoughCredits = totalCredits >= creditsNeeded;

  const handleConfirmBooking = async () => {
    if (!selectedTeacher || !selectedDate || !selectedTime) { toast.error('Please fill in all fields'); return; }
    setBooking(true);
    try {
      // Construct UTC time explicitly to avoid timezone issues
      const startDt = new Date(`${selectedDate}T${selectedTime}:00Z`);
      if (isNaN(startDt.getTime())) { toast.error('Invalid date or time selected'); setBooking(false); return; }

      const r = await fetch(`${API}/booking/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          teacher_id: selectedTeacher.teacher_id,
          start_time_utc: startDt.toISOString(),
          duration_minutes: selectedDuration,
        }),
      });
      const data = await r.json();
      if (r.ok && data.success) {
        toast.success(`Session booked with ${selectedTeacher.name}!`);
        onSuccess?.();
        onClose();
      } else if (r.status === 409) {
        toast.error(data.detail || 'This time slot has just been booked. Please select another time.');
      } else {
        toast.error(data.detail || 'Booking failed. Please try again.');
      }
    } catch (e) {
      console.error('Booking error:', e);
      toast.error('Connection error. Please check your internet and try again.');
    }
    finally { setBooking(false); }
  };

  if (!isOpen) return null;

  const times = [];
  for (let h = 0; h < 24; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`);
    times.push(`${String(h).padStart(2, '0')}:30`);
  }

  const inputCls = 'h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all';

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in" data-testid="booking-modal-overlay" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden animate-modal-in shadow-xl"
        data-testid="booking-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Book a Session</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors" data-testid="booking-modal-close">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <StepIndicator currentStep={step} />

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-5">
          {/* Step 1: Configure */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Duration</label>
                <div className="grid grid-cols-3 gap-2" data-testid="duration-selector">
                  {DURATIONS.map(d => (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDuration(d.value)}
                      data-testid={`duration-${d.value}`}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        selectedDuration === d.value
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:border-emerald-300 text-slate-700'
                      }`}
                    >
                      <p className="font-semibold text-sm">{d.label}</p>
                      <p className={`text-[11px] mt-0.5 ${selectedDuration === d.value ? 'text-emerald-200' : 'text-slate-400'}`}>
                        {d.credits} credit{d.credits > 1 ? 's' : ''}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={inputCls}
                  data-testid="booking-date-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Time</label>
                <select value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className={inputCls} data-testid="booking-time-select">
                  {times.map(t => (
                    <option key={t} value={t}>
                      {new Date(`2000-01-01T${t}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Credit Summary */}
              <div className={`p-4 rounded-2xl border ${hasEnoughCredits ? 'bg-emerald-50/50 border-emerald-200/50' : 'bg-red-50/50 border-red-200/50'}`} data-testid="credit-summary">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Credits Required</span>
                  <span className="font-semibold text-emerald-700">{creditsNeeded}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-slate-600">Your Balance</span>
                  <span className={`font-semibold ${hasEnoughCredits ? 'text-slate-900' : 'text-red-600'}`}>
                    {walletBalance ? totalCredits : '...'}
                  </span>
                </div>
                {!hasEnoughCredits && walletBalance && (
                  <div className="flex items-center gap-1.5 mt-2 text-red-600 text-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Insufficient credits. Please top up first.
                  </div>
                )}
              </div>

              <button
                onClick={() => { fetchTeachers(selectedDate, selectedTime); setStep(2); }}
                disabled={!selectedDate || !selectedTime || !hasEnoughCredits}
                className="w-full h-12 rounded-2xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                data-testid="booking-next-btn"
              >
                Next: Select Teacher
              </button>
            </>
          )}

          {/* Step 2: Select Teacher */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">Available Teachers for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</label>
                {loadingTeachers ? (
                  <div className="flex items-center justify-center py-8"><Spinner /></div>
                ) : teachers.length === 0 ? (
                  <div className="text-center py-8" data-testid="no-teachers-available">
                    <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 text-sm font-medium">No teachers available</p>
                    <p className="text-slate-400 text-xs mt-1">No teacher has opened this time slot. Try a different date or time.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[340px] overflow-y-auto" data-testid="teacher-list">
                    {teachers.map(t => (
                      <div
                        key={t.teacher_id}
                        data-testid={`teacher-option-${t.teacher_id}`}
                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                          selectedTeacher?.teacher_id === t.teacher_id
                            ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200'
                            : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50'
                        }`}
                      >
                        <button
                          onClick={() => setSelectedTeacher(t)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <div className="w-11 h-11 rounded-2xl bg-emerald-700 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                            {t.picture ? <img src={t.picture} alt="" className="w-11 h-11 object-cover" /> : <User className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-900 truncate">{t.name}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              {t.specializations?.length > 0 && <span>{t.specializations.slice(0, 2).join(', ')}</span>}
                              <span className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 text-amber-500 fill-current" />{t.rating > 0 ? t.rating.toFixed(1) : 'New'}
                              </span>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => setProfileTeacher(t)}
                          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-emerald-700 transition-all flex-shrink-0"
                          data-testid={`view-profile-${t.teacher_id}`}
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {selectedTeacher?.teacher_id === t.teacher_id && (
                          <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-2xl border border-slate-200 font-medium text-sm text-slate-700 hover:bg-slate-50 transition-all" data-testid="booking-back-btn">
                  <ChevronLeft className="w-4 h-4 inline mr-1" />Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedTeacher}
                  className="flex-1 py-3 rounded-2xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  data-testid="booking-review-btn"
                >
                  Review
                </button>
              </div>
            </>
          )}

          {/* Teacher Profile Quick View Modal */}
          {profileTeacher && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in" onClick={() => setProfileTeacher(null)}>
              <div
                className="bg-white/80 backdrop-blur-2xl border border-white/30 rounded-3xl w-full max-w-md mx-4 shadow-2xl overflow-hidden animate-modal-in"
                data-testid="teacher-profile-modal"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-700 flex items-center justify-center text-white text-xl font-bold overflow-hidden flex-shrink-0">
                        {profileTeacher.picture ? <img src={profileTeacher.picture} alt="" className="w-16 h-16 object-cover" /> : profileTeacher.name?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{profileTeacher.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                            {profileTeacher.rating > 0 ? profileTeacher.rating.toFixed(1) : 'New Teacher'}
                          </span>
                          {profileTeacher.total_classes > 0 && (
                            <span className="text-xs text-slate-400">&middot; {profileTeacher.total_classes} classes</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setProfileTeacher(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors" data-testid="close-teacher-profile">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  {profileTeacher.video_intro && (
                    <div className="mb-4 rounded-2xl overflow-hidden bg-black">
                      <video
                        src={profileTeacher.video_intro}
                        controls
                        className="w-full max-h-48 object-contain"
                        preload="metadata"
                      />
                    </div>
                  )}

                  {profileTeacher.bio && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">About</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{profileTeacher.bio}</p>
                    </div>
                  )}

                  {profileTeacher.specializations?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Specialties</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profileTeacher.specializations.map((s, i) => (
                          <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profileTeacher.total_classes >= 100 && profileTeacher.rating >= 4.7 ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200/50 mb-4">
                      <span className="text-amber-600 text-sm font-semibold">Elite Tutor</span>
                      <span className="text-xs text-amber-500">Top-rated educator</span>
                    </div>
                  ) : profileTeacher.total_classes >= 20 && profileTeacher.rating >= 4.5 ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200/50 mb-4">
                      <span className="text-emerald-600 text-sm font-semibold">Rated Tutor</span>
                      <span className="text-xs text-emerald-500">Verified educator</span>
                    </div>
                  ) : null}

                  <button
                    onClick={() => { setSelectedTeacher(profileTeacher); setProfileTeacher(null); }}
                    className="w-full h-11 rounded-2xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-all active:scale-[0.97]"
                    data-testid="select-teacher-from-profile"
                  >
                    Select This Teacher
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {step === 3 && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                    {selectedTeacher?.picture ? <img src={selectedTeacher.picture} alt="" className="w-12 h-12 object-cover" /> : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{selectedTeacher?.name}</p>
                    <p className="text-xs text-slate-500">{selectedTeacher?.specializations?.slice(0, 2).join(', ') || 'Quran Teacher'}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} &middot; {selectedDuration} minutes
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Session Cost</span>
                    <span className="font-bold text-emerald-700">{creditsNeeded} credit{creditsNeeded > 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Will be deducted from your wallet</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-2xl border border-slate-200 font-medium text-sm text-slate-700 hover:bg-slate-50 transition-all" data-testid="booking-back-btn">
                  Back
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={booking}
                  className="flex-1 py-3 rounded-2xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  data-testid="booking-confirm-btn"
                >
                  {booking ? <><Spinner size="sm" className="border-white border-t-transparent" /> Booking...</> : 'Confirm Booking'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
