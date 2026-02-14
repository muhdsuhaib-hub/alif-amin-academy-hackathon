import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit2, Trash2 } from 'lucide-react';
import Card from '../Card';

const ScheduleCard = ({ booking, onEdit, onCancel }) => {
  const isScheduled = booking.status === 'scheduled';
  const isFuture = new Date(booking.start_time_utc) > new Date();
  const statusMap = { scheduled: { cls: 'bg-success/15 text-success', label: 'Upcoming' }, cancelled: { cls: 'bg-danger/15 text-danger', label: 'Cancelled' } };
  const st = statusMap[booking.status] || { cls: 'bg-surface-muted text-ink-secondary', label: 'Completed' };

  return (
    <div className={`p-4 rounded-md border ${booking.status === 'cancelled' ? 'bg-danger/5 border-danger/15' : 'bg-surface-subtle border-ink-faint/20'}`} data-testid={`schedule-card-${booking.booking_id}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-small text-ink">{new Date(booking.start_time_utc).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          <p className="text-caption text-ink-secondary">{new Date(booking.start_time_utc).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} &middot; {booking.duration_minutes || 30} min</p>
          <p className="text-caption text-ink-tertiary mt-1">{booking.teacher_name || 'Teacher'}</p>
          {booking.credits_charged > 0 && <p className="text-caption text-ink-tertiary">{booking.credits_charged} credit{booking.credits_charged > 1 ? 's' : ''}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`text-caption px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
          {isScheduled && isFuture && (
            <div className="flex items-center gap-1">
              <button onClick={() => onEdit(booking)} data-testid={`edit-btn-${booking.booking_id}`} className="p-1.5 hover:bg-surface-card rounded-md text-ink-tertiary hover:text-brand transition-all" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => onCancel(booking)} data-testid={`cancel-btn-${booking.booking_id}`} className="p-1.5 hover:bg-danger/10 rounded-md text-ink-tertiary hover:text-danger transition-all" title="Cancel"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function MySchedule({ bookings, onOpenBooking, onEdit, onCancel }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const getDaysInMonth = (date) => {
    const y = date.getFullYear(), m = date.getMonth();
    const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
    const days = [];
    for (let i = 0; i < first.getDay(); i++) days.push(null);
    for (let i = 1; i <= last.getDate(); i++) days.push(new Date(y, m, i));
    return days;
  };

  const calendarDays = getDaysInMonth(currentMonth);
  const getClassesForDay = (day) => day ? bookings.filter(b => new Date(b.start_time_utc).toDateString() === day.toDateString()) : [];
  const filteredClasses = selectedDay ? getClassesForDay(selectedDay) : bookings;

  return (
    <div className="p-4 lg:p-8" data-testid="my-schedule-page">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-h2 text-brand">My Schedule</h2>
        <button onClick={onOpenBooking} data-testid="schedule-book-btn" className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-brand text-white font-medium text-small hover:bg-brand-light transition-all active:scale-[0.97]"><Plus className="w-4 h-4" />New Booking</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-h3 text-brand">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
            <div className="flex gap-2">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 hover:bg-surface-subtle rounded-md transition-colors"><ChevronLeft className="w-5 h-5 text-ink-secondary" /></button>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:bg-surface-subtle rounded-md transition-colors"><ChevronRight className="w-5 h-5 text-ink-secondary" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-caption font-medium text-ink-tertiary py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={idx} className="aspect-square" />;
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = selectedDay && day.toDateString() === selectedDay.toDateString();
              const dayClasses = getClassesForDay(day);
              return (
                <button key={idx} onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`aspect-square rounded-md flex flex-col items-center justify-center relative transition-all ${isSelected ? 'bg-brand text-white' : isToday ? 'bg-brand/10' : 'hover:bg-surface-subtle'}`}>
                  <span className={`text-small ${isSelected ? 'font-semibold' : ''}`}>{day.getDate()}</span>
                  <div className="flex gap-0.5 mt-1">
                    {dayClasses.some(c => c.status === 'scheduled') && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-success'}`} />}
                    {dayClasses.some(c => c.status === 'cancelled') && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/60' : 'bg-danger'}`} />}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-subtle">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-success" /><span className="text-caption text-ink-tertiary">Scheduled</span></div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-danger" /><span className="text-caption text-ink-tertiary">Cancelled</span></div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-h3 text-brand mb-4">{selectedDay ? selectedDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'All Bookings'}</h3>
          {filteredClasses.length === 0 ? (
            <div className="text-center py-8"><Calendar className="w-10 h-10 mx-auto mb-3 text-ink-faint" /><p className="text-ink-tertiary text-small">No classes {selectedDay ? 'on this day' : 'found'}</p></div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">{filteredClasses.map(b => <ScheduleCard key={b.booking_id} booking={b} onEdit={onEdit} onCancel={onCancel} />)}</div>
          )}
        </Card>
      </div>
    </div>
  );
}
