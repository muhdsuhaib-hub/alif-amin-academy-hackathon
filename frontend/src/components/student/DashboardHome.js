import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, BookOpen, Plus } from 'lucide-react';

// Countdown Timer Hook
const useCountdownTimer = (targetTime) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [canJoin, setCanJoin] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const target = new Date(targetTime);
      const diff = target - now;
      if (diff <= 5 * 60 * 1000 && diff > -60 * 60 * 1000) {
        setCanJoin(true);
        setTimeLeft('Ready to join');
      } else if (diff > 0) {
        setCanJoin(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(hours > 0 ? `Starts in ${hours}h ${mins}m` : `Starts in ${mins}m`);
      } else {
        setCanJoin(false);
        setTimeLeft('Class ended');
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return { timeLeft, canJoin };
};

// Next Class Card with countdown
const NextClassCard = ({ booking }) => {
  const { timeLeft, canJoin } = useCountdownTimer(booking.start_time_utc);

  return (
    <div className="bg-gradient-to-br from-[#0F3D2E] to-[#1a5c47] rounded-2xl p-6 text-white relative overflow-hidden" data-testid="next-class-card">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm mb-1">Upcoming Session</p>
            <h3 className="text-2xl font-bold">{booking.teacher_name || 'Your Teacher'}</h3>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-sm">
            <Clock className="w-3.5 h-3.5" />
            {booking.duration_minutes || 30} min
          </div>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-white/70" />
            <span>{new Date(booking.start_time_utc).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/70" />
            <span>{new Date(booking.start_time_utc).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-sm">{timeLeft}</span>
          {booking.meet_link ? (
            <a
              href={canJoin ? booking.meet_link : '#'}
              target={canJoin ? '_blank' : '_self'}
              rel="noopener noreferrer"
              onClick={(e) => !canJoin && e.preventDefault()}
              data-testid="join-class-btn"
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                canJoin ? 'bg-[#22C55E] hover:bg-[#16a34a] cursor-pointer' : 'bg-white/20 cursor-not-allowed'
              }`}
            >
              <Video className="w-5 h-5" />
              {canJoin ? 'Join Class' : timeLeft}
            </a>
          ) : (
            <span className="text-white/60 text-sm">Link will be available soon</span>
          )}
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
      {/* Next Class Hero */}
      <section>
        <h2 className="text-[15px] font-semibold mb-4 text-[#1D1D1F] tracking-tight">Next Class</h2>
        {nextClass ? (
          <NextClassCard booking={nextClass} />
        ) : (
          <div className="apple-card p-8 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400 mb-5 text-[15px]">No upcoming classes scheduled</p>
            <button
              onClick={onOpenBooking}
              data-testid="book-first-class-btn"
              className="apple-btn-primary"
            >
              Book Your First Class
            </button>
          </div>
        )}
      </section>

      {/* Quick Book CTA */}
      <section className="apple-card p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight">Book a New Class</h2>
        </div>
        <p className="text-[13px] text-gray-400 mb-4">Choose your teacher, date, time and session duration.</p>
        <button
          onClick={onOpenBooking}
          data-testid="quick-book-btn"
          className="w-full h-12 rounded-xl bg-[#C8A951] text-white font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:bg-[#C8A951]/90"
        >
          <Plus className="w-4 h-4" />
          Book a Session
        </button>
      </section>

      {/* Recent History */}
      <section className="apple-card p-6">
        <h2 className="text-[15px] font-semibold mb-4 text-[#1D1D1F] tracking-tight">Recent Classes</h2>
        {pastBookings.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-[15px]">No past classes yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pastBookings.map((b) => (
              <div key={b.booking_id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm" style={{ color: '#1D1D1F' }}>
                      {new Date(b.start_time_utc).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-500">{b.teacher_name || 'Teacher'} &middot; {b.duration_minutes || 30} min</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Completed</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
