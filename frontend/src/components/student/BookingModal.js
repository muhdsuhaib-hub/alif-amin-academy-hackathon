import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Star, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Spinner from '../Spinner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const DURATIONS = [
  { value: 15, label: '15 min', credits: 1 },
  { value: 30, label: '30 min', credits: 2 },
  { value: 60, label: '60 min', credits: 4 },
];

export default function BookingModal({ isOpen, onClose, onSuccess, user, preSelectedDate, preSelectedTime }) {
  const [step, setStep] = useState(1);
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
      fetchTeachers(); fetchWalletBalance(); setStep(1); setSelectedTeacher(null);
      if (preSelectedDate) { setSelectedDate(new Date(preSelectedDate).toISOString().split('T')[0]); }
      else { const t = new Date(); t.setDate(t.getDate() + 1); setSelectedDate(t.toISOString().split('T')[0]); }
      if (preSelectedTime) setSelectedTime(preSelectedTime);
    }
  }, [isOpen, preSelectedDate, preSelectedTime]);

  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try { const r = await fetch(`${API}/booking/available-teachers`, { credentials: 'include' }); if (r.ok) { const d = await r.json(); setTeachers(d.teachers || []); } } catch (e) { console.error(e); } finally { setLoadingTeachers(false); }
  };
  const fetchWalletBalance = async () => {
    if (!user?.user_id) return;
    try { const r = await fetch(`${API}/wallet/balance?user_id=${user.user_id}`, { credentials: 'include' }); if (r.ok) { const d = await r.json(); setWalletBalance(d.wallet); } } catch (e) { console.error(e); }
  };

  const creditsNeeded = DURATIONS.find(d => d.value === selectedDuration)?.credits || 2;
  const totalCredits = walletBalance ? (walletBalance.paid_credits || 0) + (walletBalance.bonus_credits || 0) : 0;
  const hasEnoughCredits = totalCredits >= creditsNeeded;

  const handleConfirmBooking = async () => {
    if (!selectedTeacher || !selectedDate || !selectedTime) { toast.error('Please fill in all fields'); return; }
    setBooking(true);
    try {
      const r = await fetch(`${API}/booking/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ teacher_id: selectedTeacher.teacher_id, start_time_utc: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(), duration_minutes: selectedDuration }) });
      const data = await r.json();
      if (r.ok && data.success) { toast.success(`Session booked with ${selectedTeacher.name}!`); onSuccess?.(); onClose(); }
      else toast.error(data.detail || 'Booking failed');
    } catch { toast.error('Network error. Please try again.'); } finally { setBooking(false); }
  };

  if (!isOpen) return null;
  const times = []; for (let h = 6; h <= 22; h++) { times.push(`${String(h).padStart(2, '0')}:00`); times.push(`${String(h).padStart(2, '0')}:30`); }
  const inputCls = 'h-12 w-full rounded-md border border-ink-faint/40 bg-surface-card px-4 text-body placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand/40 transition-all';

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" data-testid="booking-modal-overlay" onClick={onClose}>
      <div className="bg-surface-card rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-modal-in" data-testid="booking-modal" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-subtle">
          <h2 className="text-h3 text-brand">{step === 1 ? 'Book a Session' : 'Confirm Booking'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-subtle rounded-full transition-colors" data-testid="booking-modal-close"><X className="w-5 h-5 text-ink-tertiary" /></button>
        </div>
        <div className="p-6 space-y-5">
          {step === 1 && (
            <>
              <div>
                <label className="block text-small font-medium text-ink-secondary mb-2">Session Duration</label>
                <div className="grid grid-cols-3 gap-2" data-testid="duration-selector">
                  {DURATIONS.map(d => (
                    <button key={d.value} onClick={() => setSelectedDuration(d.value)} data-testid={`duration-${d.value}`}
                      className={`p-3 rounded-md border text-center transition-all ${selectedDuration === d.value ? 'bg-brand text-white border-brand' : 'bg-surface-subtle border-ink-faint/20 hover:border-brand/30'}`}>
                      <p className="font-semibold text-small">{d.label}</p>
                      <p className={`text-caption mt-0.5 ${selectedDuration === d.value ? 'text-white/70' : 'text-ink-tertiary'}`}>{d.credits} credit{d.credits > 1 ? 's' : ''}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="block text-small font-medium text-ink-secondary mb-2">Date</label><input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className={inputCls} data-testid="booking-date-input" /></div>
              <div><label className="block text-small font-medium text-ink-secondary mb-2">Time</label><select value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className={inputCls} data-testid="booking-time-select">{times.map(t => <option key={t} value={t}>{new Date(`2000-01-01T${t}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</option>)}</select></div>
              <div>
                <label className="block text-small font-medium text-ink-secondary mb-2">Select Teacher</label>
                {loadingTeachers ? <div className="flex items-center justify-center py-6"><Spinner /></div>
                : teachers.length === 0 ? <div className="text-center py-6 text-ink-tertiary text-small">No teachers available at the moment.</div>
                : (
                  <div className="space-y-2 max-h-48 overflow-y-auto" data-testid="teacher-list">
                    {teachers.map(t => (
                      <button key={t.teacher_id} onClick={() => setSelectedTeacher(t)} data-testid={`teacher-option-${t.teacher_id}`}
                        className={`w-full flex items-center gap-3 p-3 rounded-md border transition-all text-left ${selectedTeacher?.teacher_id === t.teacher_id ? 'bg-brand/5 border-brand' : 'bg-surface-subtle border-ink-faint/20 hover:border-brand/30'}`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-white font-medium flex-shrink-0">{t.picture ? <img src={t.picture} alt="" className="w-10 h-10 rounded-full object-cover" /> : t.name?.charAt(0) || 'T'}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-small truncate text-ink">{t.name}</p>
                          <div className="flex items-center gap-2 text-caption text-ink-secondary">{t.specializations?.length > 0 && <span>{t.specializations.slice(0, 2).join(', ')}</span>}{t.rating > 0 && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-gold-dark fill-current" />{t.rating}</span>}</div>
                        </div>
                        {selectedTeacher?.teacher_id === t.teacher_id && <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className={`p-4 rounded-md border ${hasEnoughCredits ? 'bg-brand/5 border-brand/15' : 'bg-danger/5 border-danger/20'}`} data-testid="credit-summary">
                <div className="flex items-center justify-between"><span className="text-small text-ink-secondary">Credits Required</span><span className="font-semibold text-brand">{creditsNeeded} credit{creditsNeeded > 1 ? 's' : ''}</span></div>
                <div className="flex items-center justify-between mt-1"><span className="text-small text-ink-secondary">Your Balance</span><span className={`font-semibold ${hasEnoughCredits ? 'text-ink' : 'text-danger'}`}>{walletBalance ? `${totalCredits} credits` : 'Loading...'}</span></div>
                {!hasEnoughCredits && walletBalance && <div className="flex items-center gap-2 mt-2 text-danger text-caption"><AlertCircle className="w-3.5 h-3.5" /><span>Insufficient credits. Please top up.</span></div>}
              </div>
              <button onClick={() => setStep(2)} disabled={!selectedTeacher || !selectedDate || !selectedTime || !hasEnoughCredits} className="w-full h-12 rounded-md bg-brand text-white font-medium hover:bg-brand-light transition-all disabled:opacity-40 disabled:cursor-not-allowed" data-testid="booking-next-btn">Review Booking</button>
            </>
          )}
          {step === 2 && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-surface-subtle rounded-md">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-white font-semibold flex-shrink-0">{selectedTeacher?.picture ? <img src={selectedTeacher.picture} alt="" className="w-12 h-12 rounded-full object-cover" /> : selectedTeacher?.name?.charAt(0) || 'T'}</div>
                  <div><p className="font-medium text-ink">{selectedTeacher?.name}</p><p className="text-small text-ink-secondary">{selectedTeacher?.specializations?.slice(0, 2).join(', ') || 'Quran Teacher'}</p></div>
                </div>
                <div className="p-4 bg-surface-subtle rounded-md space-y-2">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-ink-tertiary" /><span className="text-small">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span></div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-ink-tertiary" /><span className="text-small">{new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} &middot; {selectedDuration} minutes</span></div>
                </div>
                <div className="p-4 bg-gold/10 rounded-md border border-gold/20">
                  <div className="flex items-center justify-between"><span className="text-ink-secondary text-small">Session Cost</span><span className="font-semibold text-brand">{creditsNeeded} credit{creditsNeeded > 1 ? 's' : ''}</span></div>
                  <p className="text-caption text-ink-tertiary mt-1">Will be deducted from your wallet</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-md border border-ink-faint/40 font-medium text-brand hover:bg-surface-subtle transition-all" data-testid="booking-back-btn">Back</button>
                <button onClick={handleConfirmBooking} disabled={booking} className="flex-1 py-3 rounded-md bg-brand text-white font-medium hover:bg-brand-light transition-all disabled:opacity-60 flex items-center justify-center gap-2" data-testid="booking-confirm-btn">
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
