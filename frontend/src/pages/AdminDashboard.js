import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, DollarSign, TrendingUp, TrendingDown,
  Clock, AlertCircle, CheckCircle, XCircle, BookOpen, UserPlus,
  CreditCard, BarChart3, Bell, UserCheck, Wallet, PiggyBank,
  Award, Star, Circle, Home, Video
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import UserManagement from '../components/admin/UserManagement';
import BookingCalendar from '../components/admin/BookingCalendar';
import FinancialReports from '../components/admin/FinancialReports';
import SupportTickets from '../components/admin/SupportTickets';
import SubscriptionManagement from '../components/admin/SubscriptionManagement';
import TeacherApprovals from '../components/admin/TeacherApprovals';
import WithdrawalManagement from '../components/admin/WithdrawalManagement';
import SessionMonitor from '../components/admin/SessionMonitor';
import LayoutShell from '../components/layout/LayoutShell';
import { PageLoader } from '../components/Spinner';
import Card from '../components/Card';
import Spinner from '../components/Spinner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MENU_ITEMS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'sessions', label: 'Sessions', icon: Video },
  { id: 'approvals', label: 'Approvals', icon: UserCheck },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'withdrawals', label: 'Withdrawals', icon: Wallet },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'support', label: 'Support', icon: Bell },
];

const TAB_TITLES = {
  overview: 'Overview', sessions: 'Session Monitor', approvals: 'Teacher Approvals', users: 'User Management',
  bookings: 'Bookings', withdrawals: 'Withdrawals', subscriptions: 'Subscriptions',
  finance: 'Financial Reports', support: 'Support',
};

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [liability, setLiability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [revenue, setRevenue] = useState(null);
  const [commissionSummary, setCommissionSummary] = useState(null);

  useEffect(() => { fetchStats(); fetchLiability(); fetchRevenue(); fetchCommissionSummary(); }, []);

  const fetchStats = async () => {
    try { const r = await fetch(`${API}/admin/stats`, { credentials: 'include' }); if (r.ok) setStats(await r.json()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const fetchLiability = async () => {
    try { const r = await fetch(`${API}/admin/wallet/liability`, { credentials: 'include' }); if (r.ok) setLiability(await r.json()); } catch (e) { console.error(e); }
  };
  const fetchRevenue = async () => {
    try { const r = await fetch(`${API}/admin/revenue/recognition`, { credentials: 'include' }); if (r.ok) setRevenue(await r.json()); } catch (e) { console.error(e); }
  };
  const fetchCommissionSummary = async () => {
    try { const r = await fetch(`${API}/commission/admin/summary`, { credentials: 'include' }); if (r.ok) setCommissionSummary(await r.json()); } catch (e) { console.error(e); }
  };
  const runTierEvaluation = async () => {
    try { const r = await fetch(`${API}/commission/evaluate-all`, { method: 'POST', credentials: 'include' }); if (r.ok) { const d = await r.json(); fetchCommissionSummary(); alert(`Tier evaluation complete!\nUpgraded: ${d.upgraded?.length || 0}\nDowngraded: ${d.downgraded?.length || 0}\nUnchanged: ${d.unchanged?.length || 0}`); } } catch (e) { console.error(e); }
  };
  const handleLogout = async () => {
    try { await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }); navigate('/'); } catch (e) { console.error(e); }
  };

  const userGrowthData = stats?.charts?.user_growth || [];
  const revenueData = stats?.charts?.revenue_trend || [];
  const attendanceData = stats?.charts?.attendance || [];

  if (loading) return <PageLoader />;

  const KpiCard = ({ label, value, icon: Icon, iconBg, iconColor, trend }) => (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-small font-medium text-ink-tertiary mb-1">{label}</p>
          <p className="text-3xl font-semibold text-ink">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-md flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-2">
          {trend >= 0 ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-danger" />}
          <span className={`text-small font-medium ${trend >= 0 ? 'text-success' : 'text-danger'}`}>{trend >= 0 ? '+' : ''}{trend}%</span>
          <span className="text-small text-ink-tertiary">vs last month</span>
        </div>
      )}
    </Card>
  );

  return (
    <LayoutShell menuItems={MENU_ITEMS} activeTab={activeTab} setActiveTab={setActiveTab} tabTitles={TAB_TITLES} user={user} userRole="admin" roleBadge="Admin" onLogout={handleLogout}>
      <div className="p-4 lg:p-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard label="Total Active Users" value={stats?.total_users || 0} icon={Users} iconBg="bg-brand/10" iconColor="text-brand" trend={stats?.trends?.user_trend || 0} />
              <KpiCard label="Active Students" value={stats?.total_students || 0} icon={BookOpen} iconBg="bg-gold/10" iconColor="text-gold-dark" trend={stats?.trends?.student_trend || 0} />
              <KpiCard label="Revenue (MTD)" value={`RM ${stats?.revenue_mtd?.toLocaleString() || 0}`} icon={DollarSign} iconBg="bg-teal/10" iconColor="text-teal" trend={stats?.trends?.revenue_trend || 0} />
              <KpiCard label="Conversion Rate" value={`${stats?.conversion_rate || 0}%`} icon={TrendingUp} iconBg="bg-coral/10" iconColor="text-coral" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[
                { title: 'User Growth', data: userGrowthData, chart: (d) => <AreaChart data={d}><defs><linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0F3D2E" stopOpacity={0.3}/><stop offset="95%" stopColor="#0F3D2E" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="month" stroke="#AEAEB2" style={{ fontSize: '12px' }}/><YAxis stroke="#AEAEB2" style={{ fontSize: '12px' }}/><Tooltip/><Area type="monotone" dataKey="users" stroke="#0F3D2E" fillOpacity={1} fill="url(#colorUsers)"/></AreaChart> },
                { title: 'Revenue Trend', data: revenueData, chart: (d) => <LineChart data={d}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="month" stroke="#AEAEB2" style={{ fontSize: '12px' }}/><YAxis stroke="#AEAEB2" style={{ fontSize: '12px' }}/><Tooltip/><Line type="monotone" dataKey="revenue" stroke="#2EB6A0" strokeWidth={2}/></LineChart> },
                { title: 'Attendance Rate', data: attendanceData, chart: (d) => <BarChart data={d}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="day" stroke="#AEAEB2" style={{ fontSize: '12px' }}/><YAxis stroke="#AEAEB2" style={{ fontSize: '12px' }}/><Tooltip/><Bar dataKey="rate" fill="#C8A951" radius={[8, 8, 0, 0]}/></BarChart> },
              ].map(({ title, data, chart }) => (
                <Card key={title} className="p-6">
                  <h3 className="text-h3 text-ink mb-4">{title}</h3>
                  <ResponsiveContainer width="100%" height={200}>{chart(data)}</ResponsiveContainer>
                </Card>
              ))}
            </div>

            {/* Today's Highlights */}
            <Card className="p-6">
              <h3 className="text-h3 text-ink mb-6">Today&apos;s Highlights</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-brand" /><h4 className="text-body font-medium text-ink">Classes Today</h4></div>
                  <div className="space-y-3">
                    {stats?.todays_classes?.slice(0, 3).map((b, i) => (
                      <div key={i} className="p-3 rounded-md bg-surface-subtle">
                        <p className="text-small font-medium text-ink">{new Date(b.start_time_utc).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-caption text-ink-secondary">Booking ID: {b.booking_id.slice(0, 12)}...</p>
                      </div>
                    )) || <p className="text-small text-ink-tertiary">No classes today</p>}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-4"><AlertCircle className="w-5 h-5 text-gold-dark" /><h4 className="text-body font-medium text-ink">Trials Expiring Soon</h4></div>
                  <div className="space-y-3">
                    {stats?.trial_students?.slice(0, 3).map((s, i) => (
                      <div key={i} className="p-3 rounded-md bg-warning/5">
                        <p className="text-small font-medium text-ink">{s.student_name || 'Unknown Student'}</p>
                        <p className="text-caption text-ink-secondary">{s.student_email || ''}</p>
                      </div>
                    )) || <p className="text-small text-ink-tertiary">No expiring trials</p>}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-4"><XCircle className="w-5 h-5 text-coral" /><h4 className="text-body font-medium text-ink">Failed Payments</h4></div>
                  <div className="p-4 rounded-md bg-coral/5 text-center"><p className="text-h2 font-semibold text-coral mb-1">0</p><p className="text-small text-ink-secondary">All payments successful</p></div>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: UserPlus, color: 'text-brand', label: 'New Sign-ups Today', value: stats?.new_signups_today || 0 },
                { icon: Calendar, color: 'text-gold-dark', label: 'Classes This Month', value: stats?.bookings_this_month || 0 },
                { icon: CheckCircle, color: 'text-teal', label: 'Completed Classes', value: stats?.completed_bookings || 0 },
                { icon: Users, color: 'text-coral', label: 'Active Teachers', value: stats?.total_teachers || 0 },
              ].map((s, i) => (
                <Card key={i} className="p-6">
                  <div className="flex items-center gap-3 mb-2"><s.icon className={`w-5 h-5 ${s.color}`} /><p className="text-small font-medium text-ink-tertiary">{s.label}</p></div>
                  <p className="text-h2 font-semibold text-ink">{s.value}</p>
                </Card>
              ))}
            </div>

            {/* Credit Liability */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-gold-dark/10 flex items-center justify-center"><Wallet className="w-5 h-5 text-gold-dark" /></div>
                  <div><h3 className="text-h3 text-ink">Credit Liability Tracker</h3><p className="text-small text-ink-tertiary">Outstanding wallet credits & tutor payout exposure</p></div>
                </div>
                <button onClick={fetchLiability} className="text-small px-4 py-2 rounded-md transition-all hover:bg-surface-subtle text-brand">Refresh</button>
              </div>
              {liability ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { icon: CreditCard, color: 'text-brand', bg: 'bg-surface-subtle', label: 'Paid Credits Outstanding', value: Math.floor(liability?.credit_liability?.total_paid_credits_outstanding || 0), sub: `RM ${(liability?.credit_liability?.paid_credits_monetary_value || 0).toLocaleString()} value` },
                      { icon: PiggyBank, color: 'text-gold-dark', bg: 'bg-gold-dark/10', label: 'Bonus Credits Outstanding', value: Math.floor(liability?.credit_liability?.total_bonus_credits_outstanding || 0), sub: `RM ${(liability?.marketing_liability?.bonus_credits_value || 0).toLocaleString()} marketing cost` },
                      { icon: DollarSign, color: 'text-coral', bg: 'bg-coral/10', label: 'Tutor Payout Exposure', value: `RM ${(liability?.tutor_payout_exposure?.total_exposure || 0).toLocaleString()}`, sub: `If all credits used (${Math.round((liability?.base_rates?.tutor_rate || 0.8) * 100)}% payout rate)` },
                      { icon: TrendingUp, color: 'text-teal', bg: 'bg-teal/10', label: 'Total Top-up Revenue', value: `RM ${(liability?.wallet_summary?.total_topup_revenue || 0).toLocaleString()}`, sub: `From ${liability?.wallet_summary?.wallets_with_balance || 0} active wallets` },
                    ].map((item, i) => (
                      <div key={i} className={`p-4 rounded-md ${item.bg}`}>
                        <div className="flex items-center gap-2 mb-2"><item.icon className={`w-4 h-4 ${item.color}`} /><p className="text-caption font-medium text-ink-tertiary">{item.label}</p></div>
                        <p className={`text-h2 font-bold mb-1 ${item.color}`}>{item.value}</p>
                        <p className="text-small text-ink-secondary">{item.sub}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-surface-subtle">
                    {[
                      { label: 'Platform Commission (potential)', value: `RM ${(liability?.platform_commission?.potential_commission || 0).toLocaleString()}` },
                      { label: 'Sessions Completed', value: liability?.historical_usage?.total_sessions_completed || 0 },
                      { label: 'Tutor Payouts Made', value: `RM ${(liability?.historical_usage?.total_tutor_payouts_made || 0).toLocaleString()}` },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-md bg-surface-subtle">
                        <span className="text-small text-ink-secondary">{item.label}</span>
                        <span className="text-small font-semibold text-brand">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="flex items-center justify-center py-8"><Spinner /></div>}
            </Card>

            {/* Revenue Recognition */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-teal/10 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-teal" /></div>
                  <div><h3 className="text-h3 text-ink">Revenue Recognition</h3><p className="text-small text-ink-tertiary">Commission recognized only when sessions completed</p></div>
                </div>
                <button onClick={fetchRevenue} className="text-small px-4 py-2 rounded-md transition-all hover:bg-surface-subtle text-brand">Refresh</button>
              </div>
              {revenue ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {[
                      { icon: DollarSign, color: 'teal', label: 'Cash Collected', value: `RM ${(revenue?.cash_flow?.total_cash_collected || 0).toLocaleString()}`, sub: `Last 30 days: RM ${(revenue?.cash_flow?.last_30_days || 0).toLocaleString()}` },
                      { icon: TrendingUp, color: 'brand', label: 'Commission Earned', value: `RM ${(revenue?.revenue_recognition?.commission_earned || 0).toLocaleString()}`, sub: `Last 30 days: RM ${(revenue?.revenue_recognition?.last_30_days || 0).toLocaleString()}` },
                      { icon: Users, color: 'coral', label: 'Tutor Payable', value: `RM ${(revenue?.tutor_payable?.total_payable || 0).toLocaleString()}`, sub: `Paid: RM ${(revenue?.tutor_payable?.already_paid || 0).toLocaleString()} | Pending: RM ${(revenue?.tutor_payable?.pending_payment || 0).toLocaleString()}` },
                    ].map((item, i) => (
                      <div key={i} className={`p-5 rounded-md border-2 border-${item.color}/20 bg-${item.color}/5`}>
                        <div className="flex items-center gap-2 mb-3"><item.icon className={`w-5 h-5 text-${item.color}`} /><p className="text-small font-medium text-ink-secondary">{item.label}</p></div>
                        <p className={`text-3xl font-bold text-${item.color} mb-1`}>{item.value}</p>
                        <div className="mt-3 pt-3 border-t border-current/10"><p className="text-caption text-ink-secondary">{item.sub}</p></div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-md bg-warning/5 border border-warning/20">
                      <div className="flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-gold-dark" /><p className="text-small font-semibold text-warning/80">Deferred Revenue (Liability)</p></div>
                      <p className="text-h2 font-bold text-warning/80 mb-2">RM {(revenue?.deferred_revenue?.amount || 0).toLocaleString()}</p>
                      <p className="text-caption text-warning/60 mb-3">Cash collected but not yet earned</p>
                      <div className="text-caption space-y-1 text-ink-secondary">
                        <div className="flex justify-between"><span>Cash Collected:</span><span>RM {(revenue?.deferred_revenue?.breakdown?.cash_collected || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Revenue Recognized:</span><span>RM {(revenue?.deferred_revenue?.breakdown?.minus_revenue_recognized || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between font-semibold pt-1 border-t border-warning/20"><span>= Deferred:</span><span>RM {(revenue?.deferred_revenue?.breakdown?.equals_deferred || 0).toLocaleString()}</span></div>
                      </div>
                    </div>
                    <div className="p-4 rounded-md bg-surface-subtle">
                      <p className="text-small font-semibold text-brand mb-3">Accounting Summary</p>
                      <div className="space-y-3">
                        {[
                          { label: 'Gross Revenue (Sessions)', value: `RM ${(revenue?.accounting_summary?.gross_revenue || 0).toLocaleString()}`, color: 'text-brand' },
                          { label: 'Net Platform Revenue', value: `RM ${(revenue?.accounting_summary?.net_platform_revenue || 0).toLocaleString()}`, color: 'text-teal' },
                          { label: 'Marketing Cost (Bonus Used)', value: `RM ${(revenue?.marketing_expense?.realized || 0).toLocaleString()}`, color: 'text-coral' },
                          { label: 'Sessions Completed', value: revenue?.session_summary?.total_completed || 0, color: 'text-brand', border: true },
                        ].map((item, i) => (
                          <div key={i} className={`flex justify-between items-center ${item.border ? 'pt-2 border-t border-surface-muted' : ''}`}>
                            <span className="text-small text-ink-secondary">{item.label}</span>
                            <span className={`text-small font-semibold ${item.color}`}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded-md bg-info/5 border border-info/20">
                    <div className="flex items-start gap-2"><AlertCircle className="w-4 h-4 text-info flex-shrink-0 mt-0.5" /><p className="text-caption text-info/80"><strong>Revenue Recognition Policy:</strong> Platform commission is only recognized as earned revenue when sessions are completed. Cash collected from top-ups is held as deferred revenue (liability) until services are delivered.</p></div>
                  </div>
                </>
              ) : <div className="flex items-center justify-center py-8"><Spinner /></div>}
            </Card>

            {/* Commission Tiers */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-brand/10 flex items-center justify-center"><UserCheck className="w-5 h-5 text-brand" /></div>
                  <div><h3 className="text-h3 text-ink">Tutor Commission Tiers</h3><p className="text-small text-ink-tertiary">Tiered commission based on performance</p></div>
                </div>
                <button onClick={runTierEvaluation} className="text-small px-4 py-2 rounded-md bg-brand text-white hover:bg-brand-light transition-all">Run Monthly Evaluation</button>
              </div>
              {commissionSummary ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {[
                      { icon: Circle, iconCls: 'text-ink-secondary', bg: 'bg-surface-subtle border border-ink-faint/20', label: 'New Tutor', rate: '30% commission', count: commissionSummary?.tier_distribution?.new?.count || 0, sub: 'tutors', color: 'text-ink-secondary' },
                      { icon: Star, iconCls: 'text-gold-dark', bg: 'bg-gold-dark/5 border border-gold-dark/20', label: 'Rated Tutor', rate: '25% commission', count: commissionSummary?.tier_distribution?.rated?.count || 0, sub: '4.5+ rating, 20+ reviews', color: 'text-gold-dark' },
                      { icon: Award, iconCls: 'text-brand', bg: 'bg-brand/5 border border-brand/20', label: 'Elite Tutor', rate: '20% commission', count: commissionSummary?.tier_distribution?.elite?.count || 0, sub: '100+ sessions, 4.7+ rating', color: 'text-brand' },
                    ].map((tier, i) => (
                      <div key={i} className={`p-4 rounded-md ${tier.bg}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tier.bg.split(' ')[0]}`}><tier.icon className={`w-4 h-4 ${tier.iconCls}`} /></div>
                          <div><p className="font-semibold text-small text-ink">{tier.label}</p><p className={`text-caption ${tier.color}`}>{tier.rate}</p></div>
                        </div>
                        <p className={`text-3xl font-bold mb-1 ${tier.color}`}>{tier.count}</p>
                        <p className="text-caption text-ink-secondary">{tier.sub}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-md bg-surface-subtle">
                    <p className="text-small font-semibold text-brand mb-2">Commission Tier Rules</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-small text-ink-secondary">
                      <div><p className="mb-1"><strong>Upgrade Criteria:</strong></p><ul className="list-disc list-inside text-caption space-y-1"><li>New to Rated: 4.5+ rating with 20+ reviews</li><li>Rated to Elite: 100+ sessions with 4.7+ rating</li></ul></div>
                      <div><p className="mb-1"><strong>Downgrade Rule:</strong></p><p className="text-caption">If rating falls below 4.3 reverts to New Tutor (30%)</p><p className="text-caption mt-2"><strong>Total Tutors:</strong> {commissionSummary?.total_active_tutors || 0}</p></div>
                    </div>
                  </div>
                </>
              ) : <div className="flex items-center justify-center py-8"><Spinner /></div>}
            </Card>
          </div>
        )}

        {activeTab === 'approvals' && <TeacherApprovals />}
        {activeTab === 'sessions' && <SessionMonitor />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'bookings' && <BookingCalendar />}
        {activeTab === 'withdrawals' && <WithdrawalManagement />}
        {activeTab === 'subscriptions' && <SubscriptionManagement />}
        {activeTab === 'finance' && <FinancialReports />}
        {activeTab === 'support' && <SupportTickets />}
      </div>
    </LayoutShell>
  );
}
