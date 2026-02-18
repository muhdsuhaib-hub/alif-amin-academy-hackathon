import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM - 10 PM
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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

function slotKey(date, hour, half) {
  return `${date.toISOString().split('T')[0]}T${String(hour).padStart(2, '0')}:${half ? '30' : '00'}`;
}

export default function AvailabilityCalendar({ teacherId }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [slots, setSlots] = useState({});       // { slotKey: 'available' | 'booked' }
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [paintMode, setPaintMode] = useState(null); // 'available' | 'remove'
  const [saving, setSaving] = useState(false);

  const weekDates = getWeekDates(weekOffset);
  const weekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const fetchSlots = useCallback(async () => {
    if (!teacherId) return;
    const startDate = weekDates[0].toISOString().split('T')[0];
    const endDate = weekDates[6].toISOString().split('T')[0];
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
  }, [teacherId, weekOffset]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const toggleSlot = (key) => {
    const current = slots[key];
    if (current === 'booked') return; // Can't modify booked slots
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
    if (slots[key] === 'booked') return;
    const current = slots[key];
    setPaintMode(current === 'available' ? 'remove' : 'available');
    setIsMouseDown(true);
    toggleSlot(key);
  };

  const handleMouseEnter = (key) => {
    if (isMouseDown && slots[key] !== 'booked') toggleSlot(key);
  };

  useEffect(() => {
    const up = () => { setIsMouseDown(false); setPaintMode(null); };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

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
          return {
            date,
            start_time: time,
            end_time: `${String(endH).padStart(2, '0')}:${endM}`,
          };
        });

      const r = await fetch(`${API}/booking/availability/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          teacher_id: teacherId,
          week_start: weekDates[0].toISOString().split('T')[0],
          slots: availableSlots,
        }),
      });
      if (r.ok) {
        toast.success('Availability saved!');
        fetchSlots();
      } else {
        toast.error('Failed to save availability');
      }
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  const isToday = (d) => d.toDateString() === new Date().toDateString();
  const isPast = (date, hour, half) => {
    const slotTime = new Date(date);
    slotTime.setHours(hour, half ? 30 : 0, 0, 0);
    return slotTime < new Date();
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto" data-testid="availability-manager">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Weekly Schedule</h2>
          <p className="text-xs text-slate-500 mt-0.5">Click or drag to toggle 30-minute slots</p>
        </div>
        <button
          onClick={saveAvailability}
          disabled={saving}
          data-testid="save-availability-btn"
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 text-white font-medium text-sm hover:bg-emerald-800 transition-all active:scale-[0.97] disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button onClick={() => setWeekOffset(w => w - 1)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <span className="text-sm font-medium text-slate-700">{weekLabel}</span>
        <button onClick={() => setWeekOffset(w => w + 1)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-400" /><span className="text-[11px] text-slate-400">Available</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-200" /><span className="text-[11px] text-slate-400">Unavailable</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400" /><span className="text-[11px] text-slate-400">Booked</span></div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm overflow-hidden select-none">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day Headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100">
              <div className="p-2" />
              {weekDates.map((d, i) => (
                <div key={i} className={`p-2 text-center border-l border-slate-100 ${isToday(d) ? 'bg-emerald-50/50' : ''}`}>
                  <p className="text-[11px] font-medium text-slate-400">{DAY_SHORT[i]}</p>
                  <p className={`text-sm font-semibold ${isToday(d) ? 'text-emerald-700' : 'text-slate-700'}`}>{d.getDate()}</p>
                </div>
              ))}
            </div>

            {/* Time Rows */}
            {HOURS.map(hour => (
              <React.Fragment key={hour}>
                {[false, true].map(half => (
                  <div key={`${hour}-${half}`} className="grid grid-cols-[60px_repeat(7,1fr)]">
                    <div className="px-2 py-0 flex items-center justify-end pr-3 border-r border-slate-100">
                      {!half && <span className="text-[10px] text-slate-400">{hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'PM' : 'AM'}</span>}
                    </div>
                    {weekDates.map((date, di) => {
                      const key = slotKey(date, hour, half);
                      const status = slots[key];
                      const past = isPast(date, hour, half);

                      let bg = 'bg-white hover:bg-slate-50';
                      if (status === 'available') bg = 'bg-emerald-400/70 hover:bg-emerald-400';
                      else if (status === 'booked') bg = 'bg-red-400/70';
                      if (past && status !== 'booked') bg = 'bg-slate-50';

                      return (
                        <div
                          key={di}
                          className={`h-5 border-l border-b border-slate-100/60 transition-colors cursor-pointer ${bg} ${past && !status ? 'cursor-not-allowed opacity-50' : ''}`}
                          onMouseDown={() => !past && handleMouseDown(key)}
                          onMouseEnter={() => !past && handleMouseEnter(key)}
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
    </div>
  );
}
