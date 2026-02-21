import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Calendar, Clock, DollarSign, TrendingUp, Flame, Award, Star, Users } from 'lucide-react';

function useCountdown(targetTime, durationMin = 60) {
  const [state, setState] = React.useState({ text: '', canJoin: false });
  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      const target = new Date(targetTime);
      const diff = target.getTime() - now.getTime();
      const fiveMin = 5 * 60 * 1000;
      const classEnd = target.getTime() + durationMin * 60 * 1000;
      const isOver = now.getTime() > classEnd;

      if (isOver) setState({ text: 'Ended', canJoin: false });
      else if (diff <= fiveMin) setState({ text: diff <= 0 ? 'In progress' : 'Ready', canJoin: true });
      else if (diff > 0 && diff <= 24 * 3600000) {
        const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000);
        setState({ text: h > 0 ? `${h}h ${m}m` : `${m}m`, canJoin: false });
      } else setState({ text: diff > 0 ? `${Math.floor(diff / 86400000)}d away` : 'Ended', canJoin: false });
    };
    update();
    const i = setInterval(update, 30000);
    return () => clearInterval(i);
  }, [targetTime, durationMin]);
  return state;
}

function HeroNextClass({ booking }) {
  const navigate = useNavigate();
  const { text, canJoin } = useCountdown(booking.start_time_utc);
  const classroomUrl = booking.session_id ? `/classroom/${booking.session_id}` : null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-6 sm:p-8 text-white" data-testid="teacher-hero-card">
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Next Class</span>
          <span className="text-xs font-medium bg-amber-500/30 text-amber-200 px-3 py-1 rounded-full backdrop-blur-sm">{text}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold mb-1">{booking.student_name || 'Student'}</h2>
        <p className="text-emerald-200/80 text-sm mb-6">{booking.duration_minutes || 30} minute session</p>
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-emerald-100">
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 opacity-70" />{new Date(booking.start_time_utc).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 opacity-70" />{new Date(booking.start_time_utc).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <button
          onClick={() => classroomUrl && navigate(classroomUrl)}
          disabled={!canJoin || !classroomUrl}
          data-testid="teacher-join-class-btn"
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
            canJoin && classroomUrl
              ? 'bg-white text-emerald-800 hover:bg-emerald-50 shadow-lg active:scale-[0.97]'
              : 'bg-white/15 text-white/60 cursor-not-allowed backdrop-blur-sm'
          }`}
        >
          <Video className="w-4 h-4" />{canJoin ? 'Join Classroom' : text === 'Ended' ? 'Class Ended' : `Starts in ${text}`}
        </button>
      </div>
    </div>
  );
}

function HeroEmptyState({ onNavigateTab }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-6 sm:p-8" data-testid="teacher-hero-empty">
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-emerald-50" />
      <div className="relative z-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <Calendar className="w-3.5 h-3.5" />No Classes Today
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">No upcoming classes</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-md">Update your availability to get booked by students.</p>
        <button
          onClick={() => onNavigateTab?.('availability')}
          data-testid="update-availability-btn"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-all active:scale-[0.97] shadow-sm"
        >
          <Calendar className="w-4 h-4" />Update Availability
        </button>
      </div>
    </div>
  );
}

function TierWidget({ tier }) {
  const tierIcons = { new: Users, rated: Star, elite: Award };
  const tierColors = { new: 'text-slate-600', rated: 'text-amber-600', elite: 'text-emerald-700' };
  const tierBg = { new: 'bg-slate-50', rated: 'bg-amber-50', elite: 'bg-emerald-50' };
  const Icon = tierIcons[tier.level] || Users;

  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-5" data-testid="tier-widget">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-xl ${tierBg[tier.level]} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${tierColors[tier.level]}`} />
        </div>
        <div>
          <span className="text-sm font-semibold text-slate-900">{tier.name}</span>
          <p className="text-[11px] text-slate-400">{Math.round((1 - tier.commission_rate) * 100)}% earnings rate</p>
        </div>
      </div>
      {tier.next_tier_name && (
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500">Progress to {tier.next_tier_name}</span>
            <span className="font-medium text-slate-700">{tier.total_sessions}/{tier.level === 'new' ? 20 : 100}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${tier.progress_pct}%` }} />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{tier.sessions_to_next} classes to next tier</p>
        </div>
      )}
      {!tier.next_tier_name && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700">
          <Flame className="w-3.5 h-3.5" />Top tier achieved!
        </div>
      )}
    </div>
  );
}

function EarningsWidget({ stats }) {
  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-5" data-testid="earnings-widget">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
          <DollarSign className="w-4 h-4 text-amber-600" />
        </div>
        <span className="text-sm font-semibold text-slate-900">Financial Snapshot</span>
      </div>
      <p className="text-3xl font-bold text-emerald-700 tabular-nums" data-testid="month-net-earnings">
        RM {(stats.net_earnings || 0).toFixed(2)}
      </p>
      <p className="text-[11px] text-slate-400 mt-0.5 uppercase tracking-wider">Net Income This Month</p>
      <p className="text-sm text-slate-500 mt-3 tabular-nums" data-testid="month-gross-earnings">
        Gross Generated: RM {(stats.gross_earnings || 0).toFixed(2)}
      </p>
    </div>
  );
}

function StatsWidget({ teacher }) {
  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-5" data-testid="stats-widget">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
        </div>
        <span className="text-sm font-semibold text-slate-900">Overview</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Rating', value: (teacher.rating || 0).toFixed(1), sub: '/ 5.0' },
          { label: 'Total Classes', value: teacher.total_classes || 0, sub: 'completed' },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl bg-slate-50/80">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className="text-lg font-bold text-slate-900 tabular-nums">{s.value} <span className="text-xs font-normal text-slate-400">{s.sub}</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardOverview({ dashboardData, onNavigateTab }) {
  // Filter out classes that have already ended
  const now = new Date();
  const upcomingClasses = (dashboardData?.upcoming_classes || []).filter(b => {
    const start = new Date(b.start_time_utc);
    const end = start.getTime() + (b.duration_minutes || 60) * 60 * 1000;
    return end > now.getTime();
  });
  const nextClass = upcomingClasses[0];
  const tier = dashboardData?.tier || {};
  const stats = dashboardData?.month_stats || { net_earnings: 0, gross_earnings: 0, classes_taught: 0 };
  const teacher = dashboardData?.teacher || {};

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto" data-testid="teacher-dashboard-home">
      <section className="mb-6">
        {nextClass ? <HeroNextClass booking={nextClass} /> : <HeroEmptyState onNavigateTab={onNavigateTab} />}
      </section>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TierWidget tier={tier} />
        <EarningsWidget stats={stats} />
        <StatsWidget teacher={teacher} />
      </section>
    </div>
  );
}
