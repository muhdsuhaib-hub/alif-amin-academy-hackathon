import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Plus } from 'lucide-react';
import Card from '../Card';

const useCountdownTimer = (targetTime) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [canJoin, setCanJoin] = useState(false);
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const target = new Date(targetTime);
      const diff = target - now;
      if (diff <= 5 * 60 * 1000 && diff > -60 * 60 * 1000) { setCanJoin(true); setTimeLeft('Ready to join'); }
      else if (diff > 0) { setCanJoin(false); const h = Math.floor(diff / 3600000); const m = Math.floor((diff % 3600000) / 60000); setTimeLeft(h > 0 ? `Starts in ${h}h ${m}m` : `Starts in ${m}m`); }
      else { setCanJoin(false); setTimeLeft('Class ended'); }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [targetTime]);
  return { timeLeft, canJoin };
};

const NextClassCard = ({ booking }) => {
  const { timeLeft, canJoin } = useCountdownTimer(booking.start_time_utc);
  return (
    <div className="bg-gradient-to-br from-brand to-brand-light rounded-lg p-6 text-white relative overflow-hidden" data-testid="next-class-card">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-small mb-1">Upcoming Session</p>
            <h3 className="text-h2 font-bold">{booking.teacher_name || 'Your Teacher'}</h3>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-small">
            <Clock className="w-3.5 h-3.5" />{booking.duration_minutes || 30} min
          </div>
        </div>
        <div className="flex items-center gap-4 mb-6 text-body">
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-white/70" /><span>{new Date(booking.start_time_utc).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span></div>
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-white/70" /><span>{new Date(booking.start_time_utc).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-small">{timeLeft}</span>
          {booking.meet_link ? (
            <a href={canJoin ? booking.meet_link : '#'} target={canJoin ? '_blank' : '_self'} rel="noopener noreferrer"
              onClick={(e) => !canJoin && e.preventDefault()} data-testid="join-class-btn"
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all ${canJoin ? 'bg-success hover:bg-success/90 cursor-pointer' : 'bg-white/20 cursor-not-allowed'}`}>
              <Video className="w-5 h-5" />{canJoin ? 'Join Class' : timeLeft}
            </a>
          ) : <span className="text-white/60 text-small">Link will be available soon</span>}
        </div>
      </div>
    </div>
  );
};

export default function DashboardHome({ bookings, onOpenBooking }) {
  const upcomingBookings = bookings.filter(b => b.status === 'scheduled' && new Date(b.start_time_utc) > new Date());
  const pastBookings = bookings.filter(b => b.status === 'completed').slice(0, 3);
  const nextClass = upcomingBookings[0];

  return (
    <div className="p-4 lg:p-8 space-y-6 stagger-children" data-testid="dashboard-home">
      <section>
        <h2 className="text-body font-semibold mb-4 text-ink">Next Class</h2>
        {nextClass ? <NextClassCard booking={nextClass} /> : (
          <Card className="p-8 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-4 text-ink-faint" />
            <p className="text-ink-tertiary mb-5 text-body">No upcoming classes scheduled</p>
            <button onClick={onOpenBooking} data-testid="book-first-class-btn" className="inline-flex items-center justify-center rounded-md font-medium text-small h-11 px-6 bg-brand text-white hover:bg-brand-light shadow-apple-xs transition-all duration-200 active:scale-[0.97]">Book Your First Class</button>
          </Card>
        )}
      </section>

      <Card className="p-6">
        <h2 className="text-body font-semibold text-ink mb-1">Book a New Class</h2>
        <p className="text-small text-ink-tertiary mb-4">Choose your teacher, date, time and session duration.</p>
        <button onClick={onOpenBooking} data-testid="quick-book-btn"
          className="w-full h-12 rounded-md bg-gold text-white font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:bg-gold-dark">
          <Plus className="w-4 h-4" />Book a Session
        </button>
      </Card>

      <Card className="p-6">
        <h2 className="text-body font-semibold mb-4 text-ink">Recent Classes</h2>
        {pastBookings.length === 0 ? (
          <div className="text-center py-8"><Clock className="w-8 h-8 mx-auto mb-3 text-ink-faint" /><p className="text-ink-tertiary text-body">No past classes yet</p></div>
        ) : (
          <div className="space-y-2">
            {pastBookings.map((b) => (
              <div key={b.booking_id} className="p-4 rounded-md bg-surface-subtle border border-ink-faint/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-small text-ink">{new Date(b.start_time_utc).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    <p className="text-small text-ink-secondary">{b.teacher_name || 'Teacher'} &middot; {b.duration_minutes || 30} min</p>
                  </div>
                  <span className="text-caption px-2 py-0.5 rounded-full bg-surface-muted text-ink-secondary">Completed</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
