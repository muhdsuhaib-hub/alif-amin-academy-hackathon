import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Plus, Video, Clock, X, Star, CheckCircle, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import EvaluateModal from './EvaluateModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function ScheduleCard({ booking, onCancel }) {
  const navigate = useNavigate();
  const now = Date.now();
  const start = new Date(booking.start_time_utc).getTime();
  const endMs = booking.end_time_utc
    ? new Date(booking.end_time_utc).getTime()
    : start + (booking.duration_minutes || 30) * 60000;
  const canJoin = start - now <= 5 * 60 * 1000 && start - now > -60 * 60 * 1000;

  let displayStatus, statusStyle;
  if (booking.status === 'completed') {
    displayStatus = 'Completed';
    statusStyle = 'bg-emerald-50 text-emerald-700';
  } else if (booking.status === 'cancelled') {
    displayStatus = 'Cancelled';
    statusStyle = 'bg-red-50 text-red-600';
  } else if (booking.status === 'scheduled' && endMs < now) {
    displayStatus = 'Missed';
    statusStyle = 'bg-slate-100 text-slate-500';
  } else {
    displayStatus = 'Upcoming';
    statusStyle = 'bg-blue-50 text-blue-700';
  }

  const isFutureScheduled = booking.status === 'scheduled' && start > now;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        booking.status === 'cancelled' ? 'bg-red-50/30 border-red-200/50' : 'bg-white/70 backdrop-blur-xl border-white/20 shadow-sm'
      }`}
      data-testid={`schedule-card-${booking.booking_id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-slate-900">
            {new Date(booking.start_time_utc).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date(booking.start_time_utc).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} &middot; {booking.duration_minutes || 30} min
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{booking.teacher_name || 'Tutor'}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span data-testid={`status-badge-${booking.booking_id}`} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyle}`}>
            {displayStatus}
          </span>
          {isFutureScheduled && (
            <div className="flex items-center gap-1.5">
              {canJoin && booking.session_id && (
                <button
                  onClick={() => navigate(`/classroom/${booking.session_id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-medium hover:bg-emerald-700 transition-colors cursor-pointer"
                  data-testid={`join-btn-${booking.booking_id}`}
                >
                  <Video className="w-3 h-3" />Join
                </button>
              )}
              <button
                onClick={() => onCancel?.(booking)}
                className="p-1.5 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                data-testid={`cancel-btn-${booking.booking_id}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PastSessionCard({ session, onEvaluate }) {
  const reviewed = session.student_reviewed;
  return (
    <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm" data-testid={`past-card-${session.booking_id}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-slate-900">
            {new Date(session.start_time_utc).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date(session.start_time_utc).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} &middot; {session.duration_minutes || 30} min
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{session.teacher_name || 'Tutor'}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            {session.status === 'missed' ? 'Missed' : 'Completed'}
          </span>
          {session.session_id && !reviewed && session.status === 'completed' ? (
            <button
              onClick={() => onEvaluate(session)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-[11px] font-semibold hover:bg-amber-600 transition-colors cursor-pointer"
              data-testid={`evaluate-btn-${session.booking_id}`}
            >
              <Star className="w-3 h-3" />Evaluate
            </button>
          ) : reviewed ? (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-[11px] font-medium" data-testid={`evaluated-badge-${session.booking_id}`}>
              <CheckCircle className="w-3 h-3" />Evaluated
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function MySchedule({ bookings: initialBookings, onOpenBooking, onRefresh, onEdit, onCancel }) {
  const [activeView, setActiveView] = useState('upcoming');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [pastLoading, setPastLoading] = useState(false);
  const [evaluateSession, setEvaluateSession] = useState(null);

  useEffect(() => { fetchScheduleBookings(); }, []);
  useEffect(() => { if (activeView === 'past') fetchPastSessions(); }, [activeView]);

  const fetchScheduleBookings = async () => {
    try {
      const r = await fetch(`${API}/booking/my-bookings`, { credentials: 'include' });
      if (r.ok) {
        const data = await r.json();
        setBookings(data.bookings || []);
      }
    } catch (e) { console.error('Schedule fetch error:', e); }
  };

  const fetchPastSessions = useCallback(async () => {
    setPastLoading(true);
    try {
      const r = await fetch(`${API}/booking/past-sessions`, { credentials: 'include' });
      if (r.ok) {
        const data = await r.json();
        setPastSessions(data.sessions || []);
      }
    } catch (e) { console.error('Past sessions fetch error:', e); }
    finally { setPastLoading(false); }
  }, []);

  const handleCancelBooking = async (booking) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const r = await fetch(`${API}/booking/${booking.booking_id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirm_no_refund: true }),
      });
      const data = await r.json();
      if (r.ok && data.success) {
        toast.success(data.refunded ? 'Booking cancelled. Credits refunded.' : 'Booking cancelled.');
        fetchScheduleBookings();
        onRefresh?.();
      } else {
        toast.error(data.detail || 'Failed to cancel');
      }
    } catch { toast.error('Network error'); }
  };

  const handleEvaluated = (bookingId) => {
    setPastSessions(prev => prev.map(s => s.booking_id === bookingId ? { ...s, student_reviewed: true } : s));
  };

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
    <div className="p-4 lg:p-8 max-w-6xl mx-auto" data-testid="my-schedule-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">My Schedule</h2>
          <p className="text-xs text-slate-500 mt-0.5">{bookings.filter(b => b.status === 'scheduled').length} upcoming classes</p>
        </div>
        <button
          onClick={onOpenBooking}
          data-testid="schedule-book-btn"
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 text-white font-medium text-sm hover:bg-emerald-800 transition-all active:scale-[0.97] shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />Book Class
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 rounded-2xl p-1" data-testid="schedule-tabs">
        {[
          { id: 'upcoming', label: 'Upcoming', icon: Calendar },
          { id: 'past', label: 'Past Sessions', icon: Clock },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveView(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeView === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
            data-testid={`tab-${t.id}`}
          >
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {activeView === 'upcoming' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendar */}
          <div className="lg:col-span-2 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-slate-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-1">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[11px] font-medium text-slate-400 py-1.5">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={idx} className="aspect-square" />;
                const isToday = day.toDateString() === new Date().toDateString();
                const isSelected = selectedDay && day.toDateString() === selectedDay.toDateString();
                const dayClasses = getClassesForDay(day);
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all text-sm cursor-pointer ${
                      isSelected ? 'bg-emerald-700 text-white shadow-sm' :
                      isToday ? 'bg-emerald-50 text-emerald-700 font-semibold' :
                      'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{day.getDate()}</span>
                    <div className="flex gap-0.5 mt-0.5">
                      {dayClasses.some(c => c.status === 'scheduled' && new Date(c.start_time_utc).getTime() > Date.now()) && (
                        <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                      )}
                      {dayClasses.some(c => c.status === 'completed') && (
                        <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/80' : 'bg-emerald-500'}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[11px] text-slate-400">Upcoming</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[11px] text-slate-400">Completed</span></div>
            </div>
          </div>

          {/* Session list */}
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              {selectedDay ? selectedDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'All Sessions'}
            </h3>
            {filteredClasses.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                <p className="text-xs text-slate-400">No classes {selectedDay ? 'on this day' : 'found'}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto">
                {filteredClasses.map(b => (
                  <ScheduleCard key={b.booking_id} booking={b} onCancel={handleCancelBooking} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'past' && (
        <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Past Sessions</h3>
          {pastLoading ? (
            <div className="text-center py-12">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-200 animate-pulse" />
              <p className="text-xs text-slate-400">Loading sessions...</p>
            </div>
          ) : pastSessions.length === 0 ? (
            <div className="text-center py-12" data-testid="past-empty-state">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <h4 className="text-sm font-semibold text-slate-600 mb-1">No past sessions yet</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Once you complete your first class, it will appear here for you to review.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {pastSessions.map(s => (
                <PastSessionCard key={s.booking_id} session={s} onEvaluate={setEvaluateSession} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Evaluate Modal */}
      {evaluateSession && (
        <EvaluateModal
          session={evaluateSession}
          onClose={() => setEvaluateSession(null)}
          onSubmitted={handleEvaluated}
        />
      )}
    </div>
  );
}
