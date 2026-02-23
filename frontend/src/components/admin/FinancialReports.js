import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, Wallet, AlertTriangle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import Card from '../Card';
import Spinner from '../Spinner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function MetricCard({ title, subtitle, value, color, icon: Icon, border }) {
  return (
    <Card className={`p-5 ${border || ''}`} data-testid={`finance-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-600 mt-1">{title}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>
    </Card>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-semibold text-slate-800">RM {(p.value || 0).toFixed(2)}</span>
        </p>
      ))}
    </div>
  );
};

export default function FinancialReports() {
  const [revenue, setRevenue] = useState(null);
  const [liability, setLiability] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartGroup, setChartGroup] = useState('day');
  const [chartLoading, setChartLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [chartFilterMode, setChartFilterMode] = useState('30d');
  const [chartCustomFrom, setChartCustomFrom] = useState('');
  const [chartCustomTo, setChartCustomTo] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [revRes, liabRes] = await Promise.all([
        fetch(`${API}/admin/revenue/recognition`, { credentials: 'include' }),
        fetch(`${API}/admin/wallet/liability`, { credentials: 'include' }),
      ]);
      if (revRes.ok) setRevenue(await revRes.json());
      if (liabRes.ok) setLiability(await liabRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchChart = useCallback(async (groupBy, startDate, endDate) => {
    setChartLoading(true);
    try {
      const params = new URLSearchParams({ group_by: groupBy });
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      const r = await fetch(`${API}/admin/revenue/chart-data?${params}`, { credentials: 'include' });
      if (r.ok) {
        const d = await r.json();
        setChartData((d.chart_data || []).map(item => ({
          ...item,
          label: groupBy === 'month' ? item.period : item.period.slice(5),
        })));
      }
    } catch (e) { console.error(e); }
    finally { setChartLoading(false); }
  }, []);

  useEffect(() => { fetchData(); fetchChart(chartGroup); }, [fetchData, fetchChart, chartGroup]);

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  const deferred = revenue?.deferred_revenue?.amount || liability?.credit_liability?.paid_credits_monetary_value || 0;
  const recognized = revenue?.revenue_recognition?.commission_earned || 0;
  const tutorPayable = revenue?.tutor_payable?.pending_payment || 0;
  const tutorPaid = revenue?.tutor_payable?.already_paid || 0;
  const sessionVal = revenue?.session_summary?.total_session_value || 0;
  const sessionCount = revenue?.session_summary?.total_completed || 0;
  const commissionRate = revenue?.accounting_summary?.platform_margin_percent || 0;

  return (
    <div className="space-y-6" data-testid="financial-reports">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-slate-900">Financial Dashboard</h2><p className="text-xs text-slate-500 mt-0.5">All figures calculated from real transaction data</p></div>
        <button onClick={fetchData} className="p-2 rounded-lg hover:bg-slate-100 transition-colors"><RefreshCw className="w-4 h-4 text-slate-400" /></button>
      </div>

      {/* Primary Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Deferred Revenue (Liability)" subtitle="Cash collected but not yet earned" value={`RM ${deferred.toLocaleString()}`} color="bg-amber-50 text-amber-700" icon={AlertTriangle} border="border-l-4 border-l-amber-400" />
        <MetricCard title="Recognized Revenue (Profit)" subtitle="Platform commission from completed sessions" value={`RM ${recognized.toLocaleString()}`} color="bg-emerald-50 text-emerald-700" icon={TrendingUp} border="border-l-4 border-l-emerald-500" />
        <MetricCard title="Tutor Payable (Owed)" subtitle="Owed to tutors minus processed withdrawals" value={`RM ${tutorPayable.toLocaleString()}`} color="bg-red-50 text-red-700" icon={Wallet} border="border-l-4 border-l-red-400" />
      </div>

      {/* Revenue Chart (#9) with Date Filters (#5) */}
      <Card className="p-6" data-testid="revenue-chart-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Gross Revenue vs Net Profit</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Platform earnings breakdown</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5">
            {['day', 'month'].map(g => (
              <button key={g} onClick={() => setChartGroup(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${chartGroup === g ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                data-testid={`chart-group-${g}`}>
                {g === 'day' ? 'Daily' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>
        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-4" data-testid="chart-date-filter">
          {[
            { id: '30d', label: 'Last 30 Days' },
            { id: 'month', label: 'This Month' },
            { id: 'year', label: 'This Year' },
            { id: 'custom', label: 'Custom Range' },
          ].map(f => (
            <button key={f.id} onClick={() => {
              setChartFilterMode(f.id);
              if (f.id !== 'custom') {
                const now = new Date();
                let from, to = now.toISOString().slice(0, 10);
                if (f.id === 'month') from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                else if (f.id === 'year') from = `${now.getFullYear()}-01-01`;
                else { from = null; to = null; }
                fetchChart(chartGroup, from, to);
              }
            }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${chartFilterMode === f.id ? 'bg-emerald-700 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300'}`}
              data-testid={`chart-filter-${f.id}`}>{f.label}</button>
          ))}
          {chartFilterMode === 'custom' && (
            <div className="flex items-center gap-2 ml-auto">
              <input type="date" value={chartCustomFrom} onChange={e => setChartCustomFrom(e.target.value)}
                className="h-8 px-2 rounded-lg border border-slate-200 text-xs" data-testid="chart-custom-from" />
              <span className="text-xs text-slate-400">to</span>
              <input type="date" value={chartCustomTo} onChange={e => setChartCustomTo(e.target.value)}
                className="h-8 px-2 rounded-lg border border-slate-200 text-xs" data-testid="chart-custom-to" />
              <button onClick={() => { if (chartCustomFrom && chartCustomTo) fetchChart(chartGroup, chartCustomFrom, chartCustomTo); }}
                className="h-8 px-3 rounded-lg bg-emerald-700 text-white text-xs font-semibold" data-testid="chart-apply-custom">Apply</button>
            </div>
          )}
        </div>
        {chartLoading ? (
          <div className="h-[280px] flex items-center justify-center"><Spinner /></div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={50} tickFormatter={v => `RM${v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="gross" name="Gross Revenue" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net_profit" name="Net Profit" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex flex-col items-center justify-center text-slate-400">
            <DollarSign className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">No revenue data yet</p>
            <p className="text-xs mt-1">Data will appear after completed sessions</p>
          </div>
        )}
      </Card>

      {/* Session Economics */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Session Economics</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Completed Sessions</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{sessionCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Total Session Value</p>
            <p className="text-xl font-bold text-slate-900 mt-1">RM {sessionVal.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Already Paid Out</p>
            <p className="text-xl font-bold text-slate-900 mt-1">RM {tutorPaid.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Effective Commission</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">{commissionRate.toFixed(1)}%</p>
          </div>
        </div>
      </Card>

      {/* Wallet Liability Breakdown */}
      {liability?.credit_liability && (
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Wallet Liability Breakdown</h3>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Metric</th>
                  <th className="text-right py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                <tr><td className="py-3 text-slate-600">Total Paid Credits Held</td><td className="py-3 text-right font-semibold">{(liability.credit_liability.total_paid_credits_outstanding || 0).toLocaleString()} credits</td></tr>
                <tr><td className="py-3 text-slate-600">Monetary Value (Liability)</td><td className="py-3 text-right font-semibold text-amber-700">RM {(liability.credit_liability.paid_credits_monetary_value || 0).toLocaleString()}</td></tr>
                <tr><td className="py-3 text-slate-600">Total Bonus Credits</td><td className="py-3 text-right font-semibold">{(liability.credit_liability.total_bonus_credits_outstanding || 0).toLocaleString()} credits</td></tr>
                <tr><td className="py-3 text-slate-600">Wallets with Balance</td><td className="py-3 text-right font-semibold">{liability.wallet_summary?.wallets_with_balance || 0}</td></tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
