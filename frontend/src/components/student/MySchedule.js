import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit2, Trash2 } from 'lucide-react';

// Single schedule card with edit/cancel
const ScheduleCard = ({ booking, onEdit, onCancel }) => {
  const isScheduled = booking.status === 'scheduled';
  const isFuture = new Date(booking.start_time_utc) > new Date();

  return (
    <div
      className={`p-4 rounded-xl border ${
        booking.status === 'cancelled' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
      }`}
      data-testid={`schedule-card-${booking.booking_id}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-sm" style={{ color: '#1D1D1F' }}>
            {new Date(booking.start_time_utc).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(booking.start_time_utc).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            {' '}&middot; {booking.duration_minutes || 30} min
          </p>
          <p className="text-xs text-gray-400 mt-1">{booking.teacher_name || 'Teacher'}</p>
          {booking.credits_charged > 0 && (
            <p className="text-xs text-gray-400">{booking.credits_charged} credit{booking.credits_charged > 1 ? 's' : ''}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            booking.status === 'scheduled' ? 'bg-[#22C55E]/20 text-[#22C55E]'
            : booking.status === 'cancelled' ? 'bg-red-100 text-red-600'
            : 'bg-gray-200 text-gray-600'
          }`}>
            {booking.status === 'scheduled' ? 'Upcoming' : booking.status === 'cancelled' ? 'Cancelled' : 'Completed'}
          </span>

          {isScheduled && isFuture && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(booking)}
                data-testid={`edit-btn-${booking.booking_id}`}
                className="p-1.5 hover:bg-white rounded-lg text-gray-500 hover:text-[#0F3D2E] transition-all"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onCancel(booking)}
                data-testid={`cancel-btn-${booking.booking_id}`}
                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-all"
                title="Cancel"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
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
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const calendarDays = getDaysInMonth(currentMonth);

  const getClassesForDay = (day) => {
    if (!day) return [];
    return bookings.filter(b => {
      const d = new Date(b.start_time_utc);
      return d.toDateString() === day.toDateString();
    });
  };

  const filteredClasses = selectedDay ? getClassesForDay(selectedDay) : bookings;

  return (
    <div className="p-4 lg:p-8" data-testid="my-schedule-page">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: '#0F3D2E' }}>My Schedule</h2>
        <button
          onClick={onOpenBooking}
          data-testid="schedule-book-btn"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F3D2E] text-white font-medium text-sm hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Booking
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold" style={{ color: '#0F3D2E' }}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={idx} className="aspect-square" />;
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = selectedDay && day.toDateString() === selectedDay.toDateString();
              const dayClasses = getClassesForDay(day);
              const hasScheduled = dayClasses.some(c => c.status === 'scheduled');
              const hasCancelled = dayClasses.some(c => c.status === 'cancelled');

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all ${
                    isSelected ? 'bg-[#0F3D2E] text-white' : isToday ? 'bg-[#0F3D2E]/10' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-sm ${isSelected ? 'font-semibold' : ''}`}>{day.getDate()}</span>
                  <div className="flex gap-0.5 mt-1">
                    {hasScheduled && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#22C55E]'}`} />}
                    {hasCancelled && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-300' : 'bg-red-500'}`} />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" /><span className="text-xs text-gray-500">Scheduled</span></div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-xs text-gray-500">Cancelled</span></div>
          </div>
        </div>

        {/* Agenda */}
        <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#0F3D2E' }}>
            {selectedDay ? selectedDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'All Bookings'}
          </h3>

          {filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">No classes {selectedDay ? 'on this day' : 'found'}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredClasses.map((b) => (
                <ScheduleCard key={b.booking_id} booking={b} onEdit={onEdit} onCancel={onCancel} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
