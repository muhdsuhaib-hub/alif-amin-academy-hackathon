import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, Wallet, AlertTriangle, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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

export default function FinancialReports() {
  const [revenue, setRevenue] = useState(null);
  const [liability, setLiability] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  const deferred = revenue?.deferred_revenue?.amount || liability?.credit_liability?.paid_credits_monetary_value || 0;
  const recognized = revenue?.revenue_recognition?.commission_earned || 0;
  const tutorPayable = revenue?.tutor_payable?.pending_payment || 0;
  const tutorPaid = revenue?.tutor_payable?.already_paid || 0;
  const sessionVal = revenue?.session_economics?.total_session_value || 0;
  const sessionCount = revenue?.session_economics?.completed_sessions || 0;
  const commissionRate = revenue?.session_economics?.effective_commission_rate || 0;

  return (
    <div className="space-y-6" data-testid="financial-reports">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-slate-900">Financial Dashboard</h2><p className="text-xs text-slate-500 mt-0.5">All figures calculated from real transaction data</p></div>
        <button onClick={fetchData} className="p-2 rounded-lg hover:bg-slate-100 transition-colors"><RefreshCw className="w-4 h-4 text-slate-400" /></button>
      </div>

      {/* Primary Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Deferred Revenue (Liability)"
          subtitle="Cash collected but not yet earned — student wallet balances"
          value={`RM ${deferred.toLocaleString()}`}
          color="bg-amber-50 text-amber-700"
          icon={AlertTriangle}
          border="border-l-4 border-l-amber-400"
        />
        <MetricCard
          title="Recognized Revenue (Profit)"
          subtitle="Platform commission from completed sessions"
          value={`RM ${recognized.toLocaleString()}`}
          color="bg-emerald-50 text-emerald-700"
          icon={TrendingUp}
          border="border-l-4 border-l-emerald-500"
        />
        <MetricCard
          title="Tutor Payable (Owed)"
          subtitle="Owed to tutors minus processed withdrawals"
          value={`RM ${tutorPayable.toLocaleString()}`}
          color="bg-red-50 text-red-700"
          icon={Wallet}
          border="border-l-4 border-l-red-400"
        />
      </div>

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
                <tr><td className="py-3 text-slate-600">Total Paid Credits Held</td><td className="py-3 text-right font-semibold">{(liability.credit_liability.total_paid_credits || 0).toLocaleString()} credits</td></tr>
                <tr><td className="py-3 text-slate-600">Monetary Value (Liability)</td><td className="py-3 text-right font-semibold text-amber-700">RM {(liability.credit_liability.paid_credits_monetary_value || 0).toLocaleString()}</td></tr>
                <tr><td className="py-3 text-slate-600">Total Bonus Credits</td><td className="py-3 text-right font-semibold">{(liability.credit_liability.total_bonus_credits || 0).toLocaleString()} credits</td></tr>
                <tr><td className="py-3 text-slate-600">Wallets with Balance</td><td className="py-3 text-right font-semibold">{liability.credit_liability.wallets_with_balance || 0}</td></tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
