import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, X, Clock, Video } from 'lucide-react';
import Modal from '../Modal';
import Input from '../Input';
import Select from '../Select';
import Button from '../Button';
import { toast } from 'sonner';
import Card from '../Card';
import Spinner from '../Spinner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getStatusCls = (s) => ({ scheduled: 'bg-teal/10 text-teal border-teal', completed: 'bg-brand/10 text-brand border-brand', cancelled: 'bg-coral/10 text-coral border-coral' }[s] || 'bg-surface-subtle text-ink-secondary border-ink-tertiary');

export default function BookingCalendar() {
  const [bookings, setBookings] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({ student_id: '', teacher_id: '', start_time_utc: '', duration_minutes: 60, booking_type: 'paid', notes: '' });

  useEffect(() => { fetchBookings(); fetchTeachers(); fetchStudents(); }, [selectedDate, filterTeacher, filterStudent]);

  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDate) { const s = new Date(selectedDate); s.setHours(0,0,0,0); const e = new Date(selectedDate); e.setHours(23,59,59,999); params.append('start_date', s.toISOString()); params.append('end_date', e.toISOString()); }
      if (filterTeacher) params.append('teacher_id', filterTeacher);
      if (filterStudent) params.append('student_id', filterStudent);
      const r = await fetch(`${API}/admin/calendar/bookings?${params}`, { credentials: 'include' }); if (r.ok) setBookings(await r.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const fetchTeachers = async () => { try { const r = await fetch(`${API}/teachers`, { credentials: 'include' }); if (r.ok) setTeachers(await r.json()); } catch (e) { console.error(e); } };
  const fetchStudents = async () => { try { const r = await fetch(`${API}/admin/users/all?role=student&limit=100`, { credentials: 'include' }); if (r.ok) { const d = await r.json(); setStudents(d.users); } } catch (e) { console.error(e); } };

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

  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-h2 text-brand">Master Calendar</h2><p className="text-small mt-1 text-ink-secondary">View and manage all class bookings</p></div>
        <Button onClick={() => setShowManualBooking(true)}><Plus className="w-4 h-4" />Manual Booking</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input type="date" label="Select Date" value={selectedDate} onChange={setSelectedDate} />
        <Select label="Filter by Teacher" value={filterTeacher} onChange={setFilterTeacher} options={[{ value: '', label: 'All Teachers' }, ...teachers.map(t => ({ value: t.teacher_id, label: t.user?.name || 'Unknown' }))]} />
        <Select label="Filter by Student" value={filterStudent} onChange={setFilterStudent} options={[{ value: '', label: 'All Students' }, ...students.map(s => ({ value: s.student_info?.student_id || '', label: s.name || 'Unknown' }))]} />
      </div>

      <Card className="overflow-hidden">
        {loading ? <div className="flex justify-center items-center py-12"><Spinner /></div>
        : bookings.length === 0 ? <div className="text-center py-12"><CalendarIcon className="w-12 h-12 mx-auto mb-4 text-ink-faint" /><p className="text-ink-secondary">No bookings found for selected date</p></div>
        : (
          <div className="p-6 grid gap-4">
            {bookings.map((booking, idx) => {
              const cls = getStatusCls(booking.status);
              return (
                <div key={idx} className={`p-4 rounded-md border-l-4 bg-surface-warm hover:shadow-apple-sm transition-all ${cls.split(' ')[2] ? `border-l-${cls.split(' ')[2].replace('border-', '')}` : ''}`} style={{ borderLeftColor: booking.status === 'scheduled' ? '#2EB6A0' : booking.status === 'completed' ? '#0F3D2E' : '#E76F51' }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-ink-secondary" /><span className="text-small font-semibold text-ink">{formatTime(booking.start_time_utc)} - {formatTime(booking.end_time_utc)}</span></div>
                        <span className={`px-3 py-1 rounded-full text-caption font-medium capitalize ${getStatusCls(booking.status).split(' ').slice(0, 2).join(' ')}`}>{booking.status}</span>
                        {booking.booking_type === 'trial' && <span className="px-3 py-1 rounded-full text-caption font-medium bg-gold/10 text-gold-dark">Trial</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-caption mb-1 text-ink-tertiary">Student</p><p className="text-small font-medium text-ink">{booking.student?.user?.name || 'Unknown'}</p></div>
                        <div><p className="text-caption mb-1 text-ink-tertiary">Teacher</p><p className="text-small font-medium text-ink">{booking.teacher?.user?.name || 'Unknown'}</p></div>
                      </div>
                      {booking.meet_link && <div className="mt-3 flex items-center gap-2"><Video className="w-4 h-4 text-brand" /><a href={booking.meet_link} target="_blank" rel="noopener noreferrer" className="text-small text-brand hover:underline">Join Google Meet</a></div>}
                    </div>
                    {booking.status === 'scheduled' && <button onClick={() => handleCancelBooking(booking.booking_id)} className="p-2 rounded-md hover:bg-coral/10 transition-all"><X className="w-5 h-5 text-coral" /></button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal isOpen={showManualBooking} onClose={() => setShowManualBooking(false)} title="Create Manual Booking" size="md">
        <div className="space-y-4">
          <Select label="Student" value={newBooking.student_id} onChange={(v) => setNewBooking({ ...newBooking, student_id: v })} options={[{ value: '', label: 'Select Student' }, ...students.map(s => ({ value: s.student_info?.student_id || '', label: `${s.name} (${s.email})` }))]} />
          <Select label="Teacher" value={newBooking.teacher_id} onChange={(v) => setNewBooking({ ...newBooking, teacher_id: v })} options={[{ value: '', label: 'Select Teacher' }, ...teachers.map(t => ({ value: t.teacher_id, label: t.user?.name || 'Unknown' }))]} />
          <Input type="datetime-local" label="Start Time" value={newBooking.start_time_utc} onChange={(v) => setNewBooking({ ...newBooking, start_time_utc: new Date(v).toISOString() })} required />
          <Select label="Duration" value={newBooking.duration_minutes.toString()} onChange={(v) => setNewBooking({ ...newBooking, duration_minutes: parseInt(v) })} options={[{ value: '30', label: '30 minutes' }, { value: '60', label: '1 hour' }, { value: '90', label: '1.5 hours' }, { value: '120', label: '2 hours' }]} />
          <Select label="Booking Type" value={newBooking.booking_type} onChange={(v) => setNewBooking({ ...newBooking, booking_type: v })} options={[{ value: 'trial', label: 'Trial' }, { value: 'paid', label: 'Paid' }]} />
          <div><label className="block text-small font-medium mb-2 text-ink-secondary">Notes (Optional)</label><textarea value={newBooking.notes} onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })} placeholder="Add any notes..." rows={3} className="w-full px-4 py-3 rounded-md border border-ink-faint/40 transition-all focus:outline-none focus:ring-2 focus:ring-brand/15 text-body" /></div>
          <div className="flex gap-3 pt-4"><Button onClick={handleCreateManualBooking} className="flex-1">Create Booking</Button><Button onClick={() => setShowManualBooking(false)} variant="secondary" className="flex-1">Cancel</Button></div>
        </div>
      </Modal>
    </div>
  );
}
