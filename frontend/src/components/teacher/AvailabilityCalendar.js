import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalIcon, Clock } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23 (full day)
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekDates(offset = 0) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - start.getDay() + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function slotKey(date, hour, half) {
  return `${localDateStr(date)}T${String(hour).padStart(2, '0')}:${half ? '30' : '00'}`;
}

function timeOptions() {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (const m of ['00', '30']) {
      const val = `${String(h).padStart(2, '0')}:${m}`;
      const label = new Date(`2000-01-01T${val}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      opts.push({ value: val, label });
    }
  }
  return opts;
}

function AddAvailabilityModal({ isOpen, onClose, onSave, weekDates }) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const times = timeOptions();

  if (!isOpen) return null;

  const handleSave = () => {
    if (!date || !startTime || !endTime) { toast.error('Fill all fields'); return; }
    if (startTime >= endTime) { toast.error('End time must be after start time'); return; }
    onSave(date, startTime, endTime);
    onClose();
  };

  const inputCls = 'h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all';

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm overflow-hidden animate-modal-in shadow-xl" onClick={e => e.stopPropagation()} data-testid="add-availability-modal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Add Availability</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className={inputCls} data-testid="avail-date-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Start</label>
              <select value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} data-testid="avail-start-time">
                {times.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">End</label>
              <select value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} data-testid="avail-end-time">
                {times.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleSave} className="w-full h-12 rounded-2xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-all active:scale-[0.98]" data-testid="avail-save-btn">
            Add Slots
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AvailabilityCalendar({ teacherId }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [slots, setSlots] = useState({});
  const [bookedSlots, setBookedSlots] = useState({});
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [paintMode, setPaintMode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const weekDates = getWeekDates(weekOffset);
  const weekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const fetchSlots = useCallback(async () => {
    if (!teacherId) return;
    const startDate = localDateStr(weekDates[0]);
    const endDate = localDateStr(weekDates[6]);
    try {
      const r = await fetch(`${API}/booking/teacher-availability/${teacherId}?start_date=${startDate}&end_date=${endDate}`, { credentials: 'include' });
      if (r.ok) {
        const data = await r.json();
        const slotMap = {};
        (data.slots || []).forEach(s => {
          const key = s.start_time?.slice(0, 16);
          if (key) slotMap[key] = s.is_booked ? 'booked' : 'available';
        });
        setSlots(slotMap);
      }
    } catch (e) { console.error('Fetch availability error:', e); }

    // Fetch booked sessions overlay (use /bookings which handles teacher role)
    try {
      const r2 = await fetch(`${API}/bookings?status=scheduled`, { credentials: 'include' });
      if (r2.ok) {
        const data2 = await r2.json();
        const bookingsList = Array.isArray(data2) ? data2 : (data2.bookings || []);
        const booked = {};
        bookingsList.filter(b => b.status === 'scheduled').forEach(b => {
          const start = new Date(b.start_time_utc);
          const end = b.end_time_utc ? new Date(b.end_time_utc) : new Date(start.getTime() + (b.duration_minutes || 30) * 60000);
          const dur = (end - start) / 60000;
          for (let m = 0; m < dur; m += 30) {
            const slotDate = new Date(start.getTime() + m * 60000);
            const key = `${localDateStr(slotDate)}T${String(slotDate.getHours()).padStart(2, '0')}:${slotDate.getMinutes() < 30 ? '00' : '30'}`;
            booked[key] = b.student?.user?.name || b.student_name || 'Booked';
          }
        });
        setBookedSlots(booked);
      }
    } catch {}
  }, [teacherId, weekOffset]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const toggleSlot = (key) => {
    if (slots[key] === 'booked' || bookedSlots[key]) return;
    setSlots(prev => {
      const next = { ...prev };
      if (paintMode === 'available') next[key] = 'available';
      else if (paintMode === 'remove') delete next[key];
      else {
        if (next[key] === 'available') delete next[key];
        else next[key] = 'available';
      }
      return next;
    });
  };

  const handleMouseDown = (key) => {
    if (slots[key] === 'booked' || bookedSlots[key]) return;
    setPaintMode(slots[key] === 'available' ? 'remove' : 'available');
    setIsMouseDown(true);
    toggleSlot(key);
  };

  const handleMouseEnter = (key) => {
    if (isMouseDown && !bookedSlots[key] && slots[key] !== 'booked') toggleSlot(key);
  };

  useEffect(() => {
    const up = () => { setIsMouseDown(false); setPaintMode(null); };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const handleAddFromModal = (date, startTime, endTime) => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    setSlots(prev => {
      const next = { ...prev };
      for (let m = startMin; m < endMin; m += 30) {
        const h = Math.floor(m / 60);
        const half = (m % 60) >= 30;
        const key = `${date}T${String(h).padStart(2, '0')}:${half ? '30' : '00'}`;
        if (!bookedSlots[key]) next[key] = 'available';
      }
      return next;
    });
    toast.success('Slots added! Click "Save Changes" to persist.');
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      const availableSlots = Object.entries(slots)
        .filter(([, v]) => v === 'available')
        .map(([key]) => {
          const [date, time] = key.split('T');
          const [h, m] = time.split(':');
          const endH = m === '30' ? parseInt(h) + 1 : parseInt(h);
          const endM = m === '30' ? '00' : '30';
          return { date, start_time: time, end_time: `${String(endH).padStart(2, '0')}:${endM}` };
        });

      const r = await fetch(`${API}/booking/availability/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teacher_id: teacherId, week_start: weekDates[0].toISOString().split('T')[0], slots: availableSlots }),
      });
      if (r.ok) { toast.success('Availability saved!'); fetchSlots(); }
      else toast.error('Failed to save');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  const isPast = (date, hour, half) => {
    const t = new Date(date);
    t.setHours(hour, half ? 30 : 0, 0, 0);
    return t < new Date();
  };
  const isToday = (d) => d.toDateString() === new Date().toDateString();

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto" data-testid="availability-manager">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Weekly Schedule</h2>
          <p className="text-xs text-slate-500 mt-0.5">Click or drag to toggle 30-minute slots</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddModal(true)} data-testid="add-availability-btn" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-all">
            <Plus className="w-4 h-4" />Add Availability
          </button>
          <button onClick={saveAvailability} disabled={saving} data-testid="save-availability-btn" className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 text-white font-medium text-sm hover:bg-emerald-800 transition-all active:scale-[0.97] disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 px-1">
        <button onClick={() => setWeekOffset(w => w - 1)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
        <span className="text-sm font-medium text-slate-700">{weekLabel}</span>
        <button onClick={() => setWeekOffset(w => w + 1)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
      </div>

      <div className="flex items-center gap-4 mb-4 px-1">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-400" /><span className="text-[11px] text-slate-400">Available</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-200" /><span className="text-[11px] text-slate-400">Unavailable</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400" /><span className="text-[11px] text-slate-400">Booked</span></div>
      </div>

      <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm overflow-hidden select-none">
        <div className="overflow-x-auto" style={{ maxHeight: '65vh' }}>
          <div className="min-w-[700px]">
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="p-2" />
              {weekDates.map((d, i) => (
                <div key={i} className={`p-2 text-center border-l border-slate-100 ${isToday(d) ? 'bg-emerald-50/50' : ''}`}>
                  <p className="text-[11px] font-medium text-slate-400">{DAY_SHORT[i]}</p>
                  <p className={`text-sm font-semibold ${isToday(d) ? 'text-emerald-700' : 'text-slate-700'}`}>{d.getDate()}</p>
                </div>
              ))}
            </div>
            {HOURS.map(hour => (
              <React.Fragment key={hour}>
                {[false, true].map(half => (
                  <div key={`${hour}-${half}`} className="grid grid-cols-[60px_repeat(7,1fr)]">
                    <div className="px-2 py-0 flex items-center justify-end pr-3 border-r border-slate-100">
                      {!half && <span className="text-[10px] text-slate-400">{hour === 0 ? '12AM' : hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`}</span>}
                    </div>
                    {weekDates.map((date, di) => {
                      const key = slotKey(date, hour, half);
                      const status = slots[key];
                      const isBooked = bookedSlots[key] || status === 'booked';
                      const past = isPast(date, hour, half);

                      let bg = 'bg-white hover:bg-slate-50';
                      if (isBooked) bg = 'bg-red-400/70';
                      else if (status === 'available') bg = 'bg-emerald-400/70 hover:bg-emerald-400';
                      if (past && !isBooked) bg = 'bg-slate-50';

                      return (
                        <div
                          key={di}
                          title={isBooked ? `Booked: ${bookedSlots[key] || ''}` : ''}
                          className={`h-5 border-l border-b border-slate-100/60 transition-colors ${isBooked ? 'cursor-not-allowed' : past ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${bg}`}
                          onMouseDown={() => !past && !isBooked && handleMouseDown(key)}
                          onMouseEnter={() => !past && !isBooked && handleMouseEnter(key)}
                          data-testid={`slot-${key}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <AddAvailabilityModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleAddFromModal} weekDates={weekDates} />
    </div>
  );
}
