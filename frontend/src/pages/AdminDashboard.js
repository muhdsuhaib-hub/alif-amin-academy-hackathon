import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, DollarSign, TrendingUp,
  Clock, AlertCircle, CheckCircle, BookOpen, UserPlus,
  CreditCard, BarChart3, Bell, UserCheck, Wallet,
  Award, Star, Circle, Video, Settings, Library, LogIn,
  Ban, Edit, MoreHorizontal, X, Save, ShieldAlert,
  ArrowLeftCircle, ExternalLink, RefreshCw
} from 'lucide-react';
import UserManagement from '../components/admin/UserManagement';
import BookingCalendar from '../components/admin/BookingCalendar';
import FinancialReports from '../components/admin/FinancialReports';
import SupportTickets from '../components/admin/SupportTickets';
import SubscriptionManagement from '../components/admin/SubscriptionManagement';
import TeacherApprovals from '../components/admin/TeacherApprovals';
import WithdrawalManagement from '../components/admin/WithdrawalManagement';
import SessionMonitor from '../components/admin/SessionMonitor';
import ContentLibrary from '../components/admin/ContentLibrary';
import AdminSettings from '../components/admin/AdminSettings';
import LayoutShell from '../components/layout/LayoutShell';
import { PageLoader } from '../components/Spinner';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MENU_ITEMS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'sessions', label: 'Sessions', icon: Video },
  { id: 'approvals', label: 'Approvals', icon: UserCheck },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'withdrawals', label: 'Withdrawals', icon: Wallet },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'activities', label: 'Content Library', icon: Library },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'support', label: 'Support', icon: Bell },
];

const TAB_TITLES = {
  overview: 'Command Center', sessions: 'Session Monitor', approvals: 'Teacher Approvals',
  users: 'User Management', bookings: 'Bookings', withdrawals: 'Withdrawals',
  finance: 'Financial Reports', activities: 'Content Library', settings: 'Settings', support: 'Support',
};

/* ─── Impersonation Return Banner ─── */
function ImpersonationBanner() {
  const adminToken = localStorage.getItem('admin_return_token');
  const navigate = useNavigate();
  if (!adminToken) return null;

  const handleReturn = () => {
    const token = localStorage.getItem('admin_return_token');
    localStorage.removeItem('admin_return_token');
    document.cookie = `session_token=${token}; path=/; SameSite=Lax`;
    const adminUser = JSON.parse(localStorage.getItem('admin_return_user') || '{}');
    localStorage.setItem('user', JSON.stringify(adminUser));
    localStorage.removeItem('admin_return_user');
    navigate('/admin/dashboard');
    window.location.reload();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-fade-in">
      <button
        onClick={handleReturn}
        className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-red-600 text-white shadow-2xl shadow-red-500/30 hover:bg-red-700 transition-all text-sm font-semibold"
        data-testid="return-to-admin-btn"
      >
        <ArrowLeftCircle className="w-5 h-5" />
        Return to Admin
      </button>
    </div>
  );
}

/* ─── KPI Card ─── */
function KpiCard({ label, value, icon: Icon, color, onClick, badge }) {
  return (
    <Card
      className={`p-5 transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-emerald-200/50 active:scale-[0.98]' : ''}`}
      onClick={onClick}
      data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">{badge}</span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </Card>
  );
}

/* ─── Live Session Row ─── */
function LiveSessionRow({ session, onCancel }) {
  const start = new Date(session.start_time_utc);
  const now = new Date();
  const isLive = start <= now;
  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-slate-50/80 rounded-xl transition-colors" data-testid={`session-${session.booking_id}`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{session.student_name} <span className="text-slate-400 font-normal">with</span> {session.teacher_name}</p>
          <p className="text-[11px] text-slate-400">{start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} &middot; {session.duration_minutes || 60}min</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${isLive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {isLive ? 'Live' : session.status}
        </span>
        {session.meet_link_slug && (
          <a href={`/classroom/${session.meet_link_slug}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors" title="View Classroom">
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
          </a>
        )}
      </div>
    </div>
  );
}

/* ─── Main AdminDashboard ─── */
export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [liability, setLiability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [revenue, setRevenue] = useState(null);
  const [commissionSummary, setCommissionSummary] = useState(null);
  const [liveSessions, setLiveSessions] = useState([]);

  const fetchStats = useCallback(async () => {
    try { const r = await fetch(`${API}/admin/stats`, { credentials: 'include' }); if (r.ok) setStats(await r.json()); } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);
  const fetchLiability = useCallback(async () => {
    try { const r = await fetch(`${API}/admin/wallet/liability`, { credentials: 'include' }); if (r.ok) setLiability(await r.json()); } catch (e) { console.error(e); }
  }, []);
  const fetchRevenue = useCallback(async () => {
    try { const r = await fetch(`${API}/admin/revenue/recognition`, { credentials: 'include' }); if (r.ok) setRevenue(await r.json()); } catch (e) { console.error(e); }
  }, []);
  const fetchCommissionSummary = useCallback(async () => {
    try { const r = await fetch(`${API}/commission/admin/summary`, { credentials: 'include' }); if (r.ok) setCommissionSummary(await r.json()); } catch (e) { console.error(e); }
  }, []);
  const fetchLiveSessions = useCallback(async () => {
    try { const r = await fetch(`${API}/admin/overview/live-sessions`, { credentials: 'include' }); if (r.ok) setLiveSessions((await r.json()).sessions || []); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchStats(); fetchLiability(); fetchRevenue(); fetchCommissionSummary(); fetchLiveSessions(); }, [fetchStats, fetchLiability, fetchRevenue, fetchCommissionSummary, fetchLiveSessions]);

  const runTierEvaluation = async () => {
    try { const r = await fetch(`${API}/commission/evaluate-all`, { method: 'POST', credentials: 'include' }); if (r.ok) { const d = await r.json(); fetchCommissionSummary(); toast.success(`Tier evaluation complete! Upgraded: ${d.upgraded?.length || 0}`); } } catch (e) { console.error(e); }
  };
  const handleLogout = async () => {
    try { await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }); localStorage.removeItem('user'); localStorage.removeItem('admin_return_token'); localStorage.removeItem('admin_return_user'); navigate('/login'); } catch (e) { console.error(e); }
  };

  if (loading) return <PageLoader />;

  const pendingApprovals = stats?.pending_approvals || 0;

  return (
    <>
      <ImpersonationBanner />
      <LayoutShell menuItems={MENU_ITEMS} activeTab={activeTab} setActiveTab={setActiveTab} tabTitles={TAB_TITLES} user={user} userRole="admin" roleBadge="Admin" onLogout={handleLogout}>
        <div className="p-4 lg:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Net Revenue" value={`RM ${(revenue?.revenue_recognition?.commission_earned || 0).toLocaleString()}`} icon={DollarSign} color="bg-emerald-50 text-emerald-700" onClick={() => setActiveTab('finance')} />
                <KpiCard label="Active Students" value={stats?.total_students || 0} icon={BookOpen} color="bg-blue-50 text-blue-700" onClick={() => setActiveTab('users')} />
                <KpiCard label="Active Teachers" value={stats?.total_teachers || 0} icon={Users} color="bg-amber-50 text-amber-700" onClick={() => setActiveTab('users')} />
                <KpiCard label="Pending Approvals" value={pendingApprovals} icon={UserCheck} color="bg-red-50 text-red-700" onClick={() => setActiveTab('approvals')} badge={pendingApprovals} />
              </div>

              {/* Live Sessions */}
              <Card className="overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-900">Today's Sessions</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{liveSessions.length}</span>
                  </div>
                  <button onClick={fetchLiveSessions} className="p-2 rounded-lg hover:bg-slate-100 transition-colors"><RefreshCw className="w-4 h-4 text-slate-400" /></button>
                </div>
                {liveSessions.length === 0 ? (
                  <div className="p-8 text-center"><Clock className="w-8 h-8 mx-auto mb-2 text-slate-200" /><p className="text-xs text-slate-400">No sessions scheduled for today</p></div>
                ) : (
                  <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
                    {liveSessions.map((s) => <LiveSessionRow key={s.booking_id} session={s} />)}
                  </div>
                )}
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: UserPlus, color: 'text-emerald-600', label: 'Sign-ups Today', value: stats?.new_signups_today || 0 },
                  { icon: Calendar, color: 'text-blue-600', label: 'Classes This Month', value: stats?.bookings_this_month || 0 },
                  { icon: CheckCircle, color: 'text-teal-600', label: 'Completed', value: stats?.completed_bookings || 0 },
                  { icon: AlertCircle, color: 'text-amber-600', label: 'Expiring Trials', value: stats?.trial_students?.length || 0 },
                ].map((s, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center gap-2 mb-1"><s.icon className={`w-4 h-4 ${s.color}`} /><p className="text-[11px] text-slate-500">{s.label}</p></div>
                    <p className="text-xl font-bold text-slate-900">{s.value}</p>
                  </Card>
                ))}
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="p-5 border-l-4 border-l-amber-400">
                  <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Deferred Revenue (Liability)</p>
                  <p className="text-2xl font-bold text-slate-900">RM {(revenue?.deferred_revenue?.amount || liability?.credit_liability?.paid_credits_monetary_value || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Cash collected but not yet earned</p>
                </Card>
                <Card className="p-5 border-l-4 border-l-emerald-500">
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">Recognized Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">RM {(revenue?.revenue_recognition?.commission_earned || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Platform commission from completed sessions</p>
                </Card>
                <Card className="p-5 border-l-4 border-l-red-400">
                  <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider mb-1">Tutor Payable</p>
                  <p className="text-2xl font-bold text-slate-900">RM {(revenue?.tutor_payable?.pending_payment || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Owed to tutors (pending withdrawal)</p>
                </Card>
              </div>

              {/* Commission Tiers */}
              {commissionSummary && (
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Commission Tiers</h3>
                    <button onClick={runTierEvaluation} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-all font-medium">Run Evaluation</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: Circle, label: 'New', rate: '30%', count: commissionSummary?.tier_distribution?.new?.count || 0, cls: 'text-slate-500 bg-slate-50' },
                      { icon: Star, label: 'Rated', rate: '25%', count: commissionSummary?.tier_distribution?.rated?.count || 0, cls: 'text-amber-600 bg-amber-50' },
                      { icon: Award, label: 'Elite', rate: '20%', count: commissionSummary?.tier_distribution?.elite?.count || 0, cls: 'text-emerald-700 bg-emerald-50' },
                    ].map((t, i) => (
                      <div key={i} className={`p-4 rounded-xl ${t.cls} text-center`}>
                        <t.icon className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-xl font-bold">{t.count}</p>
                        <p className="text-[10px] font-medium">{t.label} ({t.rate})</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'approvals' && <TeacherApprovals />}
          {activeTab === 'sessions' && <SessionMonitor />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'bookings' && <BookingCalendar />}
          {activeTab === 'withdrawals' && <WithdrawalManagement />}
          {activeTab === 'finance' && <FinancialReports />}
          {activeTab === 'activities' && <ContentLibrary />}
          {activeTab === 'settings' && <AdminSettings />}
          {activeTab === 'support' && <SupportTickets />}
        </div>
      </LayoutShell>
    </>
  );
}
