import React, { useState, useEffect } from 'react';
import { Calendar, Globe, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../Card';
import Spinner from '../Spinner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AvailabilityCalendar({ teacherData }) {
  const [availability, setAvailability] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlot, setNewSlot] = useState({ startDate: '', endDate: '', startTime: '', endTime: '', recurring: false, days: [] });
  const [userTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (teacherData?.teacher_id) fetchAvailability(); }, [teacherData]);

  const fetchAvailability = async () => {
    try { const r = await fetch(`${API}/teachers/${teacherData.teacher_id}/availability`, { credentials: 'include' }); if (r.ok) setAvailability(await r.json() || []); } catch (e) { console.error(e); }
  };

  const handleAddAvailability = async () => {
    if (!newSlot.startDate || !newSlot.startTime || !newSlot.endTime) { toast.error('Please fill all required fields'); return; }
    setLoading(true);
    try {
      const start = new Date(newSlot.startDate); const end = newSlot.endDate ? new Date(newSlot.endDate) : start;
      let currentDate = new Date(start);
      while (currentDate <= end) {
        const s = new Date(`${currentDate.toISOString().split('T')[0]}T${newSlot.startTime}`);
        const e = new Date(`${currentDate.toISOString().split('T')[0]}T${newSlot.endTime}`);
        await fetch(`${API}/teachers/${teacherData.teacher_id}/availability`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ start_time_utc: s.toISOString(), end_time_utc: e.toISOString(), recurring: newSlot.recurring }) });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      toast.success('Availability slots added!'); setShowAddModal(false); setNewSlot({ startDate: '', endDate: '', startTime: '', endTime: '', recurring: false, days: [] }); fetchAvailability();
    } catch { toast.error('Failed to add availability'); } finally { setLoading(false); }
  };

  const convertToLocal = (utc, opts) => new Date(utc).toLocaleString('en-US', { timeZone: userTimezone, ...opts });

  const inputCls = 'h-12 w-full rounded-md border border-ink-faint/40 bg-surface-card px-4 text-body focus:outline-none focus:ring-2 focus:ring-brand/15 transition-all';

  return (
    <div className="space-y-6">
      <div className="bg-info/5 rounded-md p-4 flex items-center gap-3 border border-info/20">
        <Globe className="w-5 h-5 text-info" />
        <div><p className="text-small font-medium text-ink">Your Timezone: {userTimezone}</p><p className="text-caption text-ink-secondary">All times are automatically converted for students</p></div>
      </div>

      <div className="flex items-center justify-between">
        <div><h3 className="text-h3 text-brand">Your Availability</h3><p className="text-small text-ink-secondary">Set when you're available for classes</p></div>
        <button onClick={() => setShowAddModal(true)} data-testid="add-availability-btn"
          className="flex items-center gap-2 h-10 px-4 rounded-md bg-brand text-white font-medium text-small transition-all hover:bg-brand-light"><Plus className="w-4 h-4" />Add Availability</button>
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-subtle"><h4 className="text-body font-medium text-ink">Upcoming Available Slots</h4></div>
        {availability.length === 0 ? (
          <div className="p-8 text-center"><Calendar className="w-12 h-12 mx-auto mb-3 text-ink-faint" /><p className="text-ink-secondary">No availability set</p><p className="text-small text-ink-tertiary mt-1">Add your available time slots to start receiving bookings</p></div>
        ) : (
          <div className="divide-y divide-surface-subtle">
            {availability.slice(0, 15).map((slot, idx) => (
              <div key={slot.slot_id || idx} className="p-4 flex items-center justify-between hover:bg-surface-subtle/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-surface-warm flex flex-col items-center justify-center">
                    <span className="text-caption font-medium text-brand">{convertToLocal(slot.start_time_utc, { weekday: 'short' }).split(' ')[0]}</span>
                    <span className="text-lg font-bold text-brand">{new Date(slot.start_time_utc).getDate()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-small text-ink">{convertToLocal(slot.start_time_utc, { hour: 'numeric', minute: '2-digit', hour12: true })} - {convertToLocal(slot.end_time_utc, { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                    <p className="text-caption text-ink-tertiary">{convertToLocal(slot.start_time_utc, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-caption font-medium ${slot.is_booked ? 'bg-success/10 text-success' : 'bg-gold/10 text-gold-dark'}`}>{slot.is_booked ? 'Booked' : 'Available'}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div className="bg-surface-card rounded-xl w-full max-w-lg p-6 animate-modal-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h3 className="text-h3 text-brand">Add Availability</h3><button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-surface-subtle rounded-full"><X className="w-5 h-5 text-ink-tertiary" /></button></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-small font-medium mb-2 text-ink-secondary">Start Date</label><input type="date" value={newSlot.startDate} onChange={(e) => setNewSlot({ ...newSlot, startDate: e.target.value })} min={new Date().toISOString().split('T')[0]} className={inputCls} /></div>
                <div><label className="block text-small font-medium mb-2 text-ink-secondary">End Date (Optional)</label><input type="date" value={newSlot.endDate} onChange={(e) => setNewSlot({ ...newSlot, endDate: e.target.value })} min={newSlot.startDate || new Date().toISOString().split('T')[0]} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-small font-medium mb-2 text-ink-secondary">Start Time</label><input type="time" value={newSlot.startTime} onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })} className={inputCls} /></div>
                <div><label className="block text-small font-medium mb-2 text-ink-secondary">End Time</label><input type="time" value={newSlot.endTime} onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="p-4 rounded-md bg-surface-warm">
                <p className="text-small font-medium mb-3 text-brand">Quick Select</p>
                <div className="flex flex-wrap gap-2">
                  {['08:00-10:00','10:00-12:00','14:00-16:00','16:00-18:00','20:00-22:00'].map(s => {
                    const [start, end] = s.split('-');
                    return <button key={s} onClick={() => setNewSlot({ ...newSlot, startTime: start, endTime: end })} className="px-3 py-1.5 rounded-md text-caption font-medium border border-brand/20 bg-surface-card text-brand hover:bg-brand hover:text-white transition-all">{s.replace('-', ' - ')}</button>;
                  })}
                </div>
              </div>
              <button onClick={handleAddAvailability} disabled={loading} className="w-full h-11 rounded-md bg-brand text-white font-medium flex items-center justify-center gap-2 hover:bg-brand-light transition-all disabled:opacity-50">
                {loading ? <Spinner size="sm" className="border-white border-t-transparent" /> : 'Save Availability'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
