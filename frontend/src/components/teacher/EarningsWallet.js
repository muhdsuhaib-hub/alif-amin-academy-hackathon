import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, X, Star, Circle, Award, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../Card';
import Spinner from '../Spinner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function EarningsWallet({ teacherData, commissionInfo, user }) {
  const [earnings, setEarnings] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bankDetails, setBankDetails] = useState({ bank: 'maybank', accountNumber: '', accountName: '' });

  useEffect(() => { if (user?.user_id) fetchEarningsData(); }, [user]);

  const fetchEarningsData = async () => {
    setLoading(true);
    try {
      const [bRes, tRes, wRes] = await Promise.all([
        fetch(`${API}/tutor-earnings/balance?user_id=${user.user_id}`, { credentials: 'include' }),
        fetch(`${API}/tutor-earnings/transactions?user_id=${user.user_id}&limit=20`, { credentials: 'include' }),
        fetch(`${API}/tutor-earnings/withdrawals?user_id=${user.user_id}&limit=10`, { credentials: 'include' }),
      ]);
      if (bRes.ok) { const d = await bRes.json(); setEarnings(d.earnings); }
      if (tRes.ok) { const d = await tRes.json(); setTransactions(d.transactions || []); }
      if (wRes.ok) { const d = await wRes.json(); setWithdrawals(d.withdrawals || []); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) { toast.error('Enter a valid amount'); return; }
    if (!bankDetails.accountNumber || !bankDetails.accountName) { toast.error('Fill in all bank details'); return; }
    const amount = parseFloat(withdrawAmount);
    if (amount > (earnings?.withdrawable_balance || 0)) { toast.error(`Insufficient balance. Available: RM ${(earnings?.withdrawable_balance || 0).toFixed(2)}`); return; }
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/tutor-earnings/withdraw?user_id=${user.user_id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ amount, bank_name: bankDetails.bank, account_number: bankDetails.accountNumber, account_holder_name: bankDetails.accountName }) });
      if (r.ok) { toast.success('Withdrawal request submitted!'); setShowWithdrawModal(false); setWithdrawAmount(''); setBankDetails({ bank: 'maybank', accountNumber: '', accountName: '' }); fetchEarningsData(); }
      else { const e = await r.json(); toast.error(e.detail || 'Failed'); }
    } catch { toast.error('Failed to submit'); } finally { setSubmitting(false); }
  };

  const commissionRate = commissionInfo?.commission_rate || 0.30;
  const tutorRate = 1 - commissionRate;
  const wb = earnings?.withdrawable_balance || 0;
  const te = earnings?.total_earnings || 0;
  const pw = earnings?.pending_withdrawal || 0;
  const tw = earnings?.total_withdrawn || 0;

  const getStatusCls = (s) => ({ completed: 'bg-success/10 text-success', pending: 'bg-warning/10 text-warning', processing: 'bg-warning/10 text-warning', rejected: 'bg-danger/10 text-danger' }[s] || 'bg-surface-subtle text-ink-secondary');
  const getTypeLabel = (t) => ({ session_earning: 'Session Earning', withdrawal_request: 'Withdrawal', withdrawal_approved: 'Withdrawal Paid', withdrawal_rejected: 'Withdrawal Returned' }[t] || t);

  if (loading) return <div className="flex items-center justify-center py-12"><Spinner /></div>;

  const inputCls = 'h-12 w-full rounded-md border border-ink-faint/40 bg-surface-card px-4 text-body placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand/40 transition-all';

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-brand to-brand-light rounded-lg p-6 text-white">
        <div className="flex items-start justify-between mb-6">
          <div><p className="text-small text-white/70 mb-1">Withdrawable Balance</p><p className="text-4xl font-bold" data-testid="withdrawable-balance">RM {wb.toFixed(2)}</p>{pw > 0 && <p className="text-small text-white/70 mt-1">RM {pw.toFixed(2)} pending</p>}</div>
          <div className="w-12 h-12 rounded-md bg-white/20 flex items-center justify-center"><Wallet className="w-6 h-6" /></div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowWithdrawModal(true)} disabled={wb <= 0} data-testid="withdraw-btn"
            className="flex-1 h-11 rounded-md bg-white text-brand font-medium flex items-center justify-center gap-2 transition-all hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed">
            <CreditCard className="w-4 h-4" />Withdraw Funds
          </button>
          <button onClick={fetchEarningsData} className="h-11 px-4 rounded-md bg-white/20 font-medium flex items-center gap-2 transition-all hover:bg-white/30"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Tier Info */}
      {commissionInfo && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-md flex items-center justify-center ${commissionInfo.tier_level === 'elite' ? 'bg-brand/10' : commissionInfo.tier_level === 'rated' ? 'bg-gold/10' : 'bg-surface-subtle'}`}>
                {commissionInfo.tier_level === 'elite' && <Award className="w-5 h-5 text-brand" />}
                {commissionInfo.tier_level === 'rated' && <Star className="w-5 h-5 text-gold-dark" />}
                {commissionInfo.tier_level === 'new' && <Circle className="w-5 h-5 text-ink-secondary" />}
              </div>
              <div><p className="font-semibold text-brand">{commissionInfo.tier_name}</p><p className="text-caption text-ink-secondary">Your earnings: {Math.round(tutorRate * 100)}% of session fee</p></div>
            </div>
            <div className="text-right"><p className="text-caption text-ink-secondary">Platform Fee</p><p className="text-h3 font-semibold text-coral">{Math.round(commissionRate * 100)}%</p></div>
          </div>
          {commissionInfo.next_tier?.next_tier && (
            <div className="mt-4 pt-4 border-t border-surface-subtle">
              <p className="text-caption text-ink-secondary mb-2">Progress to {commissionInfo.next_tier.next_tier_name}</p>
              {commissionInfo.next_tier.requirements.rating_needed > 0 && <p className="text-caption text-ink-secondary">Need {commissionInfo.next_tier.requirements.rating_needed?.toFixed(1)} more rating points</p>}
              {commissionInfo.next_tier.requirements.reviews_needed > 0 && <p className="text-caption text-ink-secondary">Need {commissionInfo.next_tier.requirements.reviews_needed} more reviews</p>}
              {commissionInfo.next_tier.requirements.sessions_needed > 0 && <p className="text-caption text-ink-secondary">Need {commissionInfo.next_tier.requirements.sessions_needed} more sessions</p>}
            </div>
          )}
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: 'Total Earned', value: `RM ${te.toFixed(2)}`, color: 'text-brand' }, { label: 'Total Withdrawn', value: `RM ${tw.toFixed(2)}`, color: 'text-teal' }, { label: 'Pending', value: `RM ${pw.toFixed(2)}`, color: 'text-gold-dark' }, { label: 'Transactions', value: transactions.length, color: 'text-brand' }].map((s, i) => (
          <Card key={i} className="p-4"><p className="text-caption text-ink-secondary mb-1">{s.label}</p><p className={`text-h3 font-semibold ${s.color}`}>{s.value}</p></Card>
        ))}
      </div>

      {/* Withdrawals */}
      {withdrawals.length > 0 && (
        <Card>
          <div className="px-6 py-4 border-b border-surface-subtle"><h3 className="text-h3 font-semibold text-brand">Recent Withdrawals</h3></div>
          <div className="divide-y divide-surface-subtle">
            {withdrawals.slice(0, 5).map((wd) => (
              <div key={wd.withdrawal_id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-subtle/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-warm flex items-center justify-center"><CreditCard className="w-5 h-5 text-brand" /></div>
                  <div><p className="font-medium text-small text-ink">{wd.bank_name} - ****{wd.account_number?.slice(-4)}</p><p className="text-caption text-ink-secondary">{new Date(wd.created_at).toLocaleDateString()}</p></div>
                </div>
                <div className="text-right"><p className="font-semibold text-coral">-RM {wd.amount.toFixed(2)}</p><span className={`text-caption px-2 py-0.5 rounded-full ${getStatusCls(wd.status)}`}>{wd.status}</span></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Transactions */}
      <Card>
        <div className="px-6 py-4 border-b border-surface-subtle"><h3 className="text-h3 font-semibold text-brand">Earnings History</h3></div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center"><Wallet className="w-12 h-12 mx-auto mb-3 text-ink-faint" /><p className="text-ink-secondary">No transactions yet</p><p className="text-small text-ink-tertiary mt-1">Your earnings will appear here after completing sessions</p></div>
        ) : (
          <div className="divide-y divide-surface-subtle">
            {transactions.map((tx) => (
              <div key={tx.transaction_id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-subtle/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-success/10' : 'bg-danger/10'}`}>{tx.amount > 0 ? <TrendingUp className="w-5 h-5 text-success" /> : <TrendingDown className="w-5 h-5 text-danger" />}</div>
                  <div><p className="font-medium text-small text-ink">{getTypeLabel(tx.transaction_type)}</p><p className="text-caption text-ink-secondary">{new Date(tx.created_at).toLocaleDateString()} {tx.description ? `\u00B7 ${tx.description?.slice(0, 40)}${tx.description?.length > 40 ? '...' : ''}` : ''}</p></div>
                </div>
                <div className="text-right"><p className={`font-semibold ${tx.amount > 0 ? 'text-teal' : 'text-coral'}`}>{tx.amount > 0 ? '+' : ''}RM {Math.abs(tx.amount).toFixed(2)}</p><p className="text-caption text-ink-tertiary">Balance: RM {tx.balance_after?.toFixed(2) || '0.00'}</p></div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowWithdrawModal(false)}>
          <div className="bg-surface-card rounded-xl w-full max-w-md p-6 animate-modal-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-h3 text-brand">Withdraw Funds</h3>
              <button onClick={() => setShowWithdrawModal(false)} className="p-2 hover:bg-surface-subtle rounded-full transition-colors"><X className="w-5 h-5 text-ink-tertiary" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-small font-medium mb-2 text-ink-secondary">Amount (RM)</label><input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Enter amount" max={wb} className={inputCls} data-testid="withdraw-amount-input" /><p className="text-caption text-ink-tertiary mt-1">Available: RM {wb.toFixed(2)}</p></div>
              <div><label className="block text-small font-medium mb-2 text-ink-secondary">Bank</label><select value={bankDetails.bank} onChange={e => setBankDetails({ ...bankDetails, bank: e.target.value })} className={inputCls} data-testid="withdraw-bank-select"><option value="maybank">Maybank</option><option value="cimb">CIMB Bank</option><option value="rhb">RHB Bank</option><option value="publicbank">Public Bank</option><option value="paypal">PayPal (International)</option><option value="wise">Wise (International)</option></select></div>
              <div><label className="block text-small font-medium mb-2 text-ink-secondary">Account Number</label><input type="text" value={bankDetails.accountNumber} onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value })} placeholder="Enter account number" className={inputCls} data-testid="withdraw-account-number" /></div>
              <div><label className="block text-small font-medium mb-2 text-ink-secondary">Account Holder Name</label><input type="text" value={bankDetails.accountName} onChange={e => setBankDetails({ ...bankDetails, accountName: e.target.value })} placeholder="Enter account holder name" className={inputCls} data-testid="withdraw-account-name" /></div>
              <button onClick={handleWithdraw} disabled={submitting} className="w-full h-11 rounded-md bg-brand text-white font-medium hover:bg-brand-light transition-all disabled:opacity-50 flex items-center justify-center gap-2" data-testid="submit-withdrawal-btn">
                {submitting ? <Spinner size="sm" className="border-white border-t-transparent" /> : 'Submit Withdrawal Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
