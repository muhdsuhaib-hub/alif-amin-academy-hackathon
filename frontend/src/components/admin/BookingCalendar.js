import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Plus, X, Clock, Video, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../Modal';
import Input from '../Input';
import Select from '../Select';
import Button from '../Button';
import { toast } from 'sonner';
import Card from '../Card';
import Spinner from '../Spinner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_COLORS = {
  scheduled: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400' },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BookingCalendar() {
  const [bookings, setBookings] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [newBooking, setNewBooking] = useState({ student_id: '', teacher_id: '', start_time_utc: '', duration_minutes: 60, booking_type: 'paid', notes: '' });

  // Month boundaries
  const monthStart = useMemo(() => {
    const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    return d;
  }, [viewMonth]);

  const monthEnd = useMemo(() => {
    const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    return d;
  }, [viewMonth]);

  useEffect(() => { fetchBookings(); fetchTeachers(); fetchStudents(); }, [viewMonth, filterTeacher, filterStudent]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('start_date', monthStart.toISOString());
      params.append('end_date', monthEnd.toISOString());
      if (filterTeacher) params.append('teacher_id', filterTeacher);
      if (filterStudent) params.append('student_id', filterStudent);
      const r = await fetch(`${API}/admin/calendar/bookings?${params}`, { credentials: 'include' });
      if (r.ok) setBookings(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTeachers = async () => { try { const r = await fetch(`${API}/teachers`, { credentials: 'include' }); if (r.ok) setTeachers(await r.json()); } catch {} };
  const fetchStudents = async () => { try { const r = await fetch(`${API}/admin/users/all?role=student&limit=100`, { credentials: 'include' }); if (r.ok) { const d = await r.json(); setStudents(d.users); } } catch {} };

  const handleCreateManualBooking = async () => {
    if (!newBooking.student_id || !newBooking.teacher_id || !newBooking.start_time_utc) { toast.error('Please fill all required fields'); return; }
    try {
      const r = await fetch(`${API}/admin/calendar/manual-booking`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(newBooking) });
      if (r.ok) { toast.success('Manual booking created'); setShowManualBooking(false); setNewBooking({ student_id: '', teacher_id: '', start_time_utc: '', duration_minutes: 60, booking_type: 'paid', notes: '' }); fetchBookings(); }
      else { const e = await r.json(); toast.error(e.detail || 'Failed'); }
    } catch { toast.error('Error creating booking'); }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try { const r = await fetch(`${API}/admin/calendar/bookings/${bookingId}`, { method: 'DELETE', credentials: 'include' }); if (r.ok) { toast.success('Booking cancelled'); fetchBookings(); } else toast.error('Failed'); } catch { toast.error('Error'); }
  };

  const prevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const nextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  const goToday = () => setViewMonth(new Date());

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = monthStart.getDay();
    const daysInMonth = monthEnd.getDate();
    const days = [];
    // Pad start
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    // Pad end
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [monthStart, monthEnd]);

  // Group bookings by day
  const bookingsByDay = useMemo(() => {
    const map = {};
    (bookings || []).forEach(b => {
      if (!b.start_time_utc) return;
      const d = new Date(b.start_time_utc).getDate();
      if (!map[d]) map[d] = [];
      map[d].push(b);
    });
    return map;
  }, [bookings]);

  const today = new Date();
  const isCurrentMonth = viewMonth.getMonth() === today.getMonth() && viewMonth.getFullYear() === today.getFullYear();

  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

  const dayBookings = selectedDay ? (bookingsByDay[selectedDay] || []) : [];

  return (
    <div className="space-y-4" data-testid="booking-calendar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Master Calendar</h2>
          <p className="text-xs text-slate-500 mt-0.5">Monthly view of all bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">Today</button>
          <Button onClick={() => setShowManualBooking(true)} data-testid="manual-booking-btn"><Plus className="w-4 h-4" />Manual Booking</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Filter by Teacher" value={filterTeacher} onChange={setFilterTeacher} options={[{ value: '', label: 'All Teachers' }, ...teachers.map(t => ({ value: t.teacher_id, label: t.user?.name || 'Unknown' }))]} />
        <Select label="Filter by Student" value={filterStudent} onChange={setFilterStudent} options={[{ value: '', label: 'All Students' }, ...students.map(s => ({ value: s.student_info?.student_id || '', label: s.name || 'Unknown' }))]} />
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/60 shadow-sm px-5 py-3">
        <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors" data-testid="prev-month">
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>
        <h3 className="text-base font-bold text-slate-900" data-testid="current-month">
          {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors" data-testid="next-month">
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden" data-testid="calendar-grid">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {WEEKDAYS.map(d => (
            <div key={d} className="px-2 py-2.5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} className="min-h-[90px] bg-slate-50/30 border-b border-r border-slate-100/60" />;
              const dayEvents = bookingsByDay[day] || [];
              const isToday = isCurrentMonth && day === today.getDate();
              const isSelected = selectedDay === day;
              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`min-h-[90px] p-1.5 text-left border-b border-r border-slate-100/60 transition-all hover:bg-emerald-50/30 ${
                    isSelected ? 'bg-emerald-50 ring-1 ring-inset ring-emerald-300' : ''
                  }`}
                  data-testid={`cal-day-${day}`}
                >
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                    isToday ? 'bg-emerald-700 text-white' : 'text-slate-700'
                  }`}>{day}</span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((b, j) => {
                      const sc = STATUS_COLORS[b.status] || STATUS_COLORS.scheduled;
                      return (
                        <div key={j} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                          <span className="truncate">{formatTime(b.start_time_utc)}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="block text-[10px] text-slate-400 pl-1">+{dayEvents.length - 3} more</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Day Detail Panel */}
      {selectedDay && (
        <Card className="overflow-hidden" data-testid="day-detail-panel">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <h3 className="text-sm font-semibold text-slate-900">
              {viewMonth.toLocaleDateString('en-US', { month: 'long' })} {selectedDay} — {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}
            </h3>
            <button onClick={() => setSelectedDay(null)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
          {dayBookings.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-slate-200" />
              <p className="text-xs text-slate-400">No bookings this day</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {dayBookings.map((b, idx) => {
                const sc = STATUS_COLORS[b.status] || STATUS_COLORS.scheduled;
                return (
                  <div key={idx} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                    <span className={`w-2 h-full min-h-[40px] rounded-full flex-shrink-0 ${sc.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-700">{formatTime(b.start_time_utc)}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${sc.bg} ${sc.text}`}>{b.status}</span>
                        {b.booking_type === 'trial' && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Trial</span>}
                      </div>
                      <p className="text-sm text-slate-900">{b.teacher?.user?.name || b.teacher_name || 'Tutor'} & {b.student?.user?.name || b.student_name || 'Student'}</p>
                    </div>
                    {b.status === 'scheduled' && (
                      <button onClick={() => handleCancelBooking(b.booking_id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" data-testid={`cancel-${b.booking_id}`}>
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Manual Booking Modal */}
      <Modal isOpen={showManualBooking} onClose={() => setShowManualBooking(false)} title="Create Manual Booking" size="md">
        <div className="space-y-4">
          <Select label="Student" value={newBooking.student_id} onChange={(v) => setNewBooking({ ...newBooking, student_id: v })} options={[{ value: '', label: 'Select Student' }, ...students.map(s => ({ value: s.student_info?.student_id || '', label: `${s.name} (${s.email})` }))]} />
          <Select label="Teacher" value={newBooking.teacher_id} onChange={(v) => setNewBooking({ ...newBooking, teacher_id: v })} options={[{ value: '', label: 'Select Teacher' }, ...teachers.map(t => ({ value: t.teacher_id, label: t.user?.name || 'Unknown' }))]} />
          <Input type="datetime-local" label="Start Time" value={newBooking.start_time_utc} onChange={(v) => setNewBooking({ ...newBooking, start_time_utc: new Date(v).toISOString() })} required />
          <Select label="Duration" value={newBooking.duration_minutes.toString()} onChange={(v) => setNewBooking({ ...newBooking, duration_minutes: parseInt(v) })} options={[{ value: '30', label: '30 minutes' }, { value: '60', label: '1 hour' }, { value: '90', label: '1.5 hours' }, { value: '120', label: '2 hours' }]} />
          <Select label="Booking Type" value={newBooking.booking_type} onChange={(v) => setNewBooking({ ...newBooking, booking_type: v })} options={[{ value: 'trial', label: 'Trial' }, { value: 'paid', label: 'Paid' }]} />
          <div><label className="block text-xs font-medium mb-2 text-slate-500">Notes (Optional)</label><textarea value={newBooking.notes} onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })} placeholder="Add any notes..." rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm" /></div>
          <div className="flex gap-3 pt-4"><Button onClick={handleCreateManualBooking} className="flex-1">Create Booking</Button><Button onClick={() => setShowManualBooking(false)} variant="secondary" className="flex-1">Cancel</Button></div>
        </div>
      </Modal>
    </div>
  );
}
