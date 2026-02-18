import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, ArrowUpRight, ArrowDownRight, Clock, Landmark, X } from 'lucide-react';
import { toast } from 'sonner';
import Spinner from '../Spinner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function IncomeCreditCard({ wallet, tier }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-6 sm:p-8 text-white shadow-lg" data-testid="teacher-credit-card">
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-amber-500/10" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute top-6 right-6 w-10 h-10 rounded-full border-2 border-amber-400/30 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border border-amber-400/40" />
      </div>
      <div className="relative z-10">
        <p className="text-emerald-200/50 text-[10px] font-medium uppercase tracking-[0.2em] mb-1">Net Income Balance</p>
        <p className="text-3xl sm:text-4xl font-bold">
          RM {(wallet?.balance || 0).toFixed(0)}
        </p>
        <div className="flex gap-6 mt-5">
          <div>
            <p className="text-emerald-200/40 text-[10px] uppercase tracking-wider">Total Earned</p>
            <p className="text-lg font-semibold text-amber-300">RM {(wallet?.total_earned || 0).toFixed(0)}</p>
          </div>
          <div>
            <p className="text-emerald-200/40 text-[10px] uppercase tracking-wider">Withdrawn</p>
            <p className="text-lg font-semibold text-emerald-300">RM {(wallet?.total_withdrawn || 0).toFixed(0)}</p>
          </div>
        </div>
        {tier && (
          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-emerald-200/50">
            Platform Fee: {Math.round(tier.commission_rate * 100)}% ({tier.name})
          </div>
        )}
      </div>
    </div>
  );
}

export default function EarningsWallet({ dashboardData, user, onRefresh }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ bank_name: '', account_number: '', account_holder: '', amount: '' });
  const [processing, setProcessing] = useState(false);

  const wallet = dashboardData?.wallet || {};
  const tier = dashboardData?.tier || {};
  const teacherId = dashboardData?.teacher?.teacher_id;

  useEffect(() => {
    if (teacherId) fetchTransactions();
  }, [teacherId]);

  const fetchTransactions = async () => {
    try {
      const r = await fetch(`${API}/teachers/${teacherId}/transactions?limit=50`, { credentials: 'include' });
      if (r.ok) { const d = await r.json(); setTransactions(d.transactions || []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handlePayout = async () => {
    const { bank_name, account_number, account_holder, amount } = payoutForm;
    if (!bank_name || !account_number || !account_holder || !amount) {
      toast.error('Please fill all fields'); return;
    }
    setProcessing(true);
    try {
      const r = await fetch(`${API}/teacher/request-payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...payoutForm, amount: parseFloat(amount) }),
      });
      if (r.ok) {
        toast.success('Payout request submitted!');
        setShowPayoutModal(false);
        setPayoutForm({ bank_name: '', account_number: '', account_holder: '', amount: '' });
        onRefresh?.();
      } else {
        const data = await r.json();
        toast.error(data.detail || 'Payout request failed');
      }
    } catch { toast.error('Network error'); }
    finally { setProcessing(false); }
  };

  const inputCls = 'h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all';

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto" data-testid="teacher-earnings-page">
      <IncomeCreditCard wallet={wallet} tier={tier} />

      <button
        onClick={() => setShowPayoutModal(true)}
        data-testid="request-payout-btn"
        className="w-full mt-4 h-12 rounded-2xl bg-amber-100 text-amber-800 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-amber-200 transition-all active:scale-[0.98]"
      >
        <Landmark className="w-4 h-4" />Request Payout
      </button>

      {/* Transaction History */}
      <div className="mt-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm" data-testid="teacher-transactions">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Earnings History</h3>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Spinner /></div>
        ) : transactions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-200" />
            <p className="text-xs text-slate-400">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {transactions.map((t, i) => (
              <div key={t.transaction_id || i} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  t.transaction_type === 'session_earning' ? 'bg-emerald-50' : t.transaction_type === 'withdrawal' ? 'bg-red-50' : 'bg-slate-50'
                }`}>
                  {t.transaction_type === 'session_earning' ? <ArrowDownRight className="w-4 h-4 text-emerald-600" /> :
                   t.transaction_type === 'withdrawal' ? <ArrowUpRight className="w-4 h-4 text-red-500" /> :
                   <DollarSign className="w-4 h-4 text-slate-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 truncate">{t.description || t.transaction_type}</p>
                  <p className="text-[11px] text-slate-400">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    {t.gross_amount ? ` · Gross: RM ${t.gross_amount}` : ''}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${
                  t.transaction_type === 'withdrawal' ? 'text-red-500' : 'text-emerald-600'
                }`}>
                  {t.transaction_type === 'withdrawal' ? '-' : '+'}RM {(t.net_amount || t.amount || 0).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={() => setShowPayoutModal(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md overflow-hidden animate-modal-in shadow-xl" onClick={e => e.stopPropagation()} data-testid="payout-modal">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Request Payout</h2>
              <button onClick={() => setShowPayoutModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Bank Name</label>
                <input value={payoutForm.bank_name} onChange={e => setPayoutForm(p => ({ ...p, bank_name: e.target.value }))} placeholder="e.g. Maybank" className={inputCls} data-testid="payout-bank-name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Account Number</label>
                <input value={payoutForm.account_number} onChange={e => setPayoutForm(p => ({ ...p, account_number: e.target.value }))} placeholder="1234567890" className={inputCls} data-testid="payout-account-number" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Account Holder Name</label>
                <input value={payoutForm.account_holder} onChange={e => setPayoutForm(p => ({ ...p, account_holder: e.target.value }))} placeholder="Full name" className={inputCls} data-testid="payout-account-holder" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Amount (RM)</label>
                <input type="number" value={payoutForm.amount} onChange={e => setPayoutForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" className={inputCls} data-testid="payout-amount" />
                <p className="text-[11px] text-slate-400 mt-1">Available: RM {(wallet.balance || 0).toFixed(2)}</p>
              </div>
              <button
                onClick={handlePayout}
                disabled={processing}
                className="w-full h-12 rounded-2xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                data-testid="confirm-payout-btn"
              >
                {processing ? 'Processing...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
