import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Calendar, Clock, DollarSign, TrendingUp, Flame, Award, Star, Users, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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

/* -------- Skeleton Loader -------- */
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/60 ${className}`} />;
}

function SkeletonDashboard() {
  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6" data-testid="teacher-dashboard-skeleton">
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/* -------- Hero: Next Class -------- */
function HeroNextClass({ booking }) {
  const navigate = useNavigate();
  const { text, canJoin } = useCountdown(booking.start_time_utc);
  const classroomUrl = booking.session_id ? `/classroom/${booking.session_id}` : null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-6 sm:p-8 text-white shadow-lg" data-testid="teacher-hero-card">
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

/* -------- Hero: Empty State (improved) -------- */
function HeroEmptyState({ onNavigateTab }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-200/60 shadow-sm p-6 sm:p-8" data-testid="teacher-hero-empty">
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-emerald-100/40" />
      <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-amber-100/30" />
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
          <Calendar className="w-9 h-9 text-emerald-600/60" />
        </div>
        <div className="text-center sm:text-left flex-1">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Your Schedule is Clear</h2>
          <p className="text-sm text-slate-500 mb-4 max-w-sm">No upcoming classes right now. Set your availability so students can book sessions with you.</p>
          <button
            onClick={() => onNavigateTab?.('availability')}
            data-testid="update-availability-btn"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-all active:scale-[0.97] shadow-sm"
          >
            <Calendar className="w-4 h-4" />Set Availability
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------- Tier Widget -------- */
function TierWidget({ tier }) {
  const tierIcons = { new: Users, rated: Star, elite: Award };
  const tierColors = { new: 'text-slate-600', rated: 'text-amber-600', elite: 'text-emerald-700' };
  const tierBg = { new: 'bg-slate-50', rated: 'bg-amber-50', elite: 'bg-emerald-50' };
  const Icon = tierIcons[tier.level] || Users;
  const netRate = tier.commission_rate != null ? Math.round((1 - tier.commission_rate) * 100) : 60;

  return (
    <div className="rounded-2xl bg-white border border-slate-200/60 shadow-sm p-5" data-testid="tier-widget">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-xl ${tierBg[tier.level]} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${tierColors[tier.level]}`} />
        </div>
        <div>
          <span className="text-sm font-semibold text-slate-900">{tier.name}</span>
          <p className="text-[11px] text-emerald-600 font-medium" data-testid="tier-net-rate">You earn {netRate}%</p>
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

/* -------- Earnings Widget -------- */
function EarningsWidget({ stats }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/60 shadow-sm p-5" data-testid="earnings-widget">
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
    </div>
  );
}

/* -------- Stats Widget -------- */
function StatsWidget({ teacher }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/60 shadow-sm p-5" data-testid="stats-widget">
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

/* -------- Analytics Charts (#10) with Date Filters (#4) -------- */
function AnalyticsCharts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('30d'); // '30d' | 'month' | 'year' | 'custom'
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const fetchAnalytics = useCallback(async (mode, from, to) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const now = new Date();
      if (mode === 'month') {
        params.set('start_date', `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
        params.set('end_date', now.toISOString().slice(0, 10));
      } else if (mode === 'year') {
        params.set('start_date', `${now.getFullYear()}-01-01`);
        params.set('end_date', now.toISOString().slice(0, 10));
      } else if (mode === 'custom' && from && to) {
        params.set('start_date', from);
        params.set('end_date', to);
      }
      // Default (30d) sends no params, backend defaults to 30d
      const r = await fetch(`${API}/teacher/analytics?${params}`, { credentials: 'include' });
      if (r.ok) setData(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAnalytics('30d'); }, [fetchAnalytics]);

  const handleFilter = (mode) => {
    setFilterMode(mode);
    if (mode !== 'custom') fetchAnalytics(mode);
  };

  const applyCustom = () => {
    if (customFrom && customTo) fetchAnalytics('custom', customFrom, customTo);
  };

  const earningsData = (data?.daily_earnings || []).map(d => ({
    date: d.date.slice(5),
    earnings: d.earnings,
  }));

  const ratingData = (data?.rating_trend || []).map(d => ({
    date: d.date?.slice(5) || '',
    rating: d.rating,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-medium text-slate-700">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {typeof p.value === 'number' && p.name === 'RM' ? `RM ${p.value.toFixed(2)}` : p.value}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4" data-testid="teacher-analytics-charts">
      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center gap-2" data-testid="analytics-date-filter">
        {[
          { id: '30d', label: 'Last 30 Days' },
          { id: 'month', label: 'This Month' },
          { id: 'year', label: 'This Year' },
          { id: 'custom', label: 'Custom Range' },
        ].map(f => (
          <button key={f.id} onClick={() => handleFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterMode === f.id ? 'bg-emerald-700 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300'}`}
            data-testid={`filter-${f.id}`}>{f.label}</button>
        ))}
        {filterMode === 'custom' && (
          <div className="flex items-center gap-2 ml-auto">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="h-8 px-2 rounded-lg border border-slate-200 text-xs" data-testid="filter-custom-from" />
            <span className="text-xs text-slate-400">to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="h-8 px-2 rounded-lg border border-slate-200 text-xs" data-testid="filter-custom-to" />
            <button onClick={applyCustom}
              className="h-8 px-3 rounded-lg bg-emerald-700 text-white text-xs font-semibold" data-testid="filter-apply-custom">Apply</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Earnings Chart */}
        <div className="rounded-2xl bg-white border border-slate-200/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-900">Daily Earnings</span>
              <p className="text-[11px] text-slate-400">{data?.date_from?.slice(5)} — {data?.date_to?.slice(5)}</p>
            </div>
          </div>
          {loading ? <Skeleton className="h-[200px] w-full" /> : earningsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={45} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="earnings" name="RM" stroke="#059669" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#059669' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-slate-400">
              <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">No earnings data yet</p>
            </div>
          )}
        </div>

        {/* Rating Trend Chart */}
        <div className="rounded-2xl bg-white border border-slate-200/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-900">Rating Trend</span>
              <p className="text-[11px] text-slate-400">{ratingData.length} review{ratingData.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {loading ? <Skeleton className="h-[200px] w-full" /> : ratingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ratingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: '#94a3b8' }} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rating" name="Rating" stroke="#d97706" strokeWidth={2} dot={{ r: 3, fill: '#d97706' }} activeDot={{ r: 5, fill: '#d97706' }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-slate-400">
              <Star className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">No reviews yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------- Main Dashboard -------- */
export default function DashboardOverview({ dashboardData, onNavigateTab }) {
  if (!dashboardData) return <SkeletonDashboard />;

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
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6" data-testid="teacher-dashboard-home">
      <section>
        {nextClass ? <HeroNextClass booking={nextClass} /> : <HeroEmptyState onNavigateTab={onNavigateTab} />}
      </section>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TierWidget tier={tier} />
        <EarningsWidget stats={stats} />
        <StatsWidget teacher={teacher} />
      </section>
      <section>
        <AnalyticsCharts />
      </section>
    </div>
  );
}
