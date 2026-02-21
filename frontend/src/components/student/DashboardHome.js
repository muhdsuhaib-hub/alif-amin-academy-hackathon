import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, Plus, Wallet, TrendingUp, BookOpen, ChevronRight, Sparkles } from 'lucide-react';

const useCountdown = (targetTime, durationMin = 60) => {
  const [state, setState] = useState({ text: '', canJoin: false, isNear: false });
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const target = new Date(targetTime);
      const diff = target.getTime() - now.getTime();
      const fiveMin = 5 * 60 * 1000;
      const classEnd = target.getTime() + durationMin * 60 * 1000;
      const isOver = now.getTime() > classEnd;

      if (isOver) {
        setState({ text: 'Class ended', canJoin: false, isNear: false });
      } else if (diff <= fiveMin) {
        // Within 5 min or class in progress
        setState({ text: diff <= 0 ? 'In progress' : 'Ready to join', canJoin: true, isNear: true });
      } else if (diff > 0 && diff <= 24 * 3600000) {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setState({ text: h > 0 ? `${h}h ${m}m` : `${m}m`, canJoin: false, isNear: true });
      } else if (diff > 24 * 3600000) {
        const days = Math.floor(diff / 86400000);
        setState({ text: `${days} day${days > 1 ? 's' : ''} away`, canJoin: false, isNear: false });
      } else {
        setState({ text: 'Class ended', canJoin: false, isNear: false });
      }
    };
    update();
    const i = setInterval(update, 30000);
    return () => clearInterval(i);
  }, [targetTime, durationMin]);
  return state;
};

function SmartHeroCountdown({ booking }) {
  const navigate = useNavigate();
  const { text, canJoin } = useCountdown(booking.start_time_utc);
  const classroomUrl = booking.session_id ? `/classroom/${booking.session_id}` : null;

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-6 sm:p-8 text-white"
      data-testid="hero-countdown-card"
    >
      {/* Decorative circles */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
            Next Session
          </span>
          <span className="text-xs font-medium bg-amber-500/30 text-amber-200 px-3 py-1 rounded-full backdrop-blur-sm">
            {text}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold mb-1">
          {booking.teacher_name || 'Your Teacher'}
        </h2>
        <p className="text-emerald-200/80 text-sm mb-6">
          {booking.duration_minutes || 30} minute session
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-emerald-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 opacity-70" />
            {new Date(booking.start_time_utc).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 opacity-70" />
            {new Date(booking.start_time_utc).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <button
          onClick={() => classroomUrl && navigate(classroomUrl)}
          disabled={!canJoin || !classroomUrl}
          data-testid="join-class-btn"
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
            canJoin && classroomUrl
              ? 'bg-white text-emerald-800 hover:bg-emerald-50 shadow-lg active:scale-[0.97]'
              : 'bg-white/15 text-white/60 cursor-not-allowed backdrop-blur-sm'
          }`}
        >
          <Video className="w-4 h-4" />
          {canJoin ? 'Join Classroom' : `Starts in ${text}`}
        </button>
      </div>
    </div>
  );
}

function SmartHeroBookPrompt({ onOpenBooking }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-6 sm:p-8"
      data-testid="hero-book-prompt"
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-emerald-50" />
      <div className="relative z-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Start Learning
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
          Ready for your next Quran session?
        </h2>
        <p className="text-sm text-slate-500 mb-6 max-w-md">
          Book a 1-on-1 lesson with a qualified teacher and continue your journey.
        </p>
        <button
          onClick={onOpenBooking}
          data-testid="book-first-class-btn"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-all active:scale-[0.97] shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Book a Session
        </button>
      </div>
    </div>
  );
}

function ProgressWidget({ progress }) {
  const hasData = progress.total_sessions > 0;
  const overall = hasData ? Math.round((progress.avg_fluency + progress.avg_tajweed + progress.avg_makhraj) / 3) : 0;

  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-5" data-testid="progress-widget">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-sm font-semibold text-slate-900">My Progress</span>
        </div>
        {hasData && (
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
            {overall}/10
          </span>
        )}
      </div>
      {hasData ? (
        <div className="space-y-3">
          {[
            { label: 'Fluency', value: progress.avg_fluency, color: 'bg-emerald-500' },
            { label: 'Tajweed', value: progress.avg_tajweed, color: 'bg-emerald-400' },
            { label: 'Makhraj', value: progress.avg_makhraj, color: 'bg-emerald-300' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-medium text-slate-900">{item.value}/10</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${(item.value / 10) * 100}%` }} />
              </div>
            </div>
          ))}
          <p className="text-[11px] text-slate-400 mt-1">{progress.total_sessions} session{progress.total_sessions !== 1 ? 's' : ''} completed</p>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-slate-400">Complete your first session to see progress</p>
        </div>
      )}
    </div>
  );
}

function WalletWidget({ wallet, onNavigateWallet }) {
  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-5" data-testid="wallet-widget">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Wallet</span>
        </div>
        <button
          onClick={onNavigateWallet}
          className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
          data-testid="wallet-view-all-btn"
        >
          View <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-2xl p-4 text-white">
        <p className="text-emerald-200/60 text-[11px] font-medium uppercase tracking-wider mb-1">Balance</p>
        <p className="text-2xl font-bold">{wallet.credit_balance || 0} <span className="text-base font-normal text-emerald-200/70">credits</span></p>
        <div className="flex gap-4 mt-3 text-xs text-emerald-200/60">
          <span>Paid: {wallet.paid_credits || 0}</span>
          <span>Bonus: {wallet.bonus_credits || 0}</span>
        </div>
      </div>
    </div>
  );
}

function QuickBookCard({ onOpenBooking }) {
  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-5" data-testid="quick-book-card">
      <h3 className="text-sm font-semibold text-slate-900 mb-1">Book a Class</h3>
      <p className="text-xs text-slate-500 mb-4">Choose teacher, date & duration</p>
      <button
        onClick={onOpenBooking}
        data-testid="quick-book-btn"
        className="w-full h-11 rounded-2xl bg-amber-100 text-amber-800 font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:bg-amber-200"
      >
        <Plus className="w-4 h-4" />
        Book a Session
      </button>
    </div>
  );
}

function RecentClassesList({ classes }) {
  const [page, setPage] = useState(1);
  const perPage = 5;
  const totalPages = Math.max(1, Math.ceil(classes.length / perPage));
  const paged = classes.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-5" data-testid="recent-classes">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Classes</h3>
      {classes.length === 0 ? (
        <div className="text-center py-6">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-200" />
          <p className="text-xs text-slate-400">No past classes yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paged.map((b) => (
              <div key={b.booking_id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{b.teacher_name || 'Teacher'}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(b.start_time_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &middot; {b.duration_minutes || 30} min
                  </p>
                </div>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full flex-shrink-0">Completed</span>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <p className="text-[10px] text-slate-400">{page}/{totalPages}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function DashboardHome({ dashboardData, onOpenBooking, onNavigateTab }) {
  const upcomingClasses = dashboardData?.upcoming_classes || [];
  const pastClasses = dashboardData?.past_classes || [];
  const wallet = dashboardData?.wallet || {};
  const progress = dashboardData?.progress || {};
  const nextClass = upcomingClasses[0];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto" data-testid="dashboard-home">
      {/* Smart Hero */}
      <section className="mb-6">
        {nextClass ? (
          <SmartHeroCountdown booking={nextClass} />
        ) : (
          <SmartHeroBookPrompt onOpenBooking={onOpenBooking} />
        )}
      </section>

      {/* Widgets Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <ProgressWidget progress={progress} />
        <WalletWidget wallet={wallet} onNavigateWallet={() => onNavigateTab?.('wallet')} />
        <QuickBookCard onOpenBooking={onOpenBooking} />
      </section>

      {/* Recent Classes */}
      <section>
        <RecentClassesList classes={pastClasses} />
      </section>
    </div>
  );
}
