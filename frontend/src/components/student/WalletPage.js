import React, { useState, useEffect } from 'react';
import { CreditCard, Clock, Star, RefreshCw, AlertCircle, ArrowRight, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../Card';
import Spinner from '../Spinner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function WalletPage({ user }) {
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchWalletData(); fetchTransactions(); fetchPackages(); }, [user]);

  const fetchWalletData = async () => {
    try { const r = await fetch(`${API}/wallet/balance?user_id=${user?.user_id}`, { credentials: 'include' }); if (r.ok) { const d = await r.json(); setWalletData(d.wallet); } } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const fetchTransactions = async () => {
    try { const r = await fetch(`${API}/wallet/transactions?user_id=${user?.user_id}&limit=20`, { credentials: 'include' }); if (r.ok) { const d = await r.json(); setTransactions(d.transactions || []); } } catch (e) { console.error(e); }
  };
  const fetchPackages = async () => {
    try { const r = await fetch(`${API}/wallet/packages`, { credentials: 'include' }); if (r.ok) { const d = await r.json(); setPackages(d.packages || []); } } catch (e) { console.error(e); }
  };

  const confirmTopup = async () => {
    if (!selectedPackage) return;
    setProcessing(true);
    try {
      const c = await fetch(`${API}/wallet/topup/create-intent?user_id=${user?.user_id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ package_id: selectedPackage.package_id, payment_method: 'stripe' }) });
      if (!c.ok) throw new Error('Failed to create payment intent');
      const intent = await c.json();
      const cf = await fetch(`${API}/wallet/topup/confirm?payment_intent_id=${intent.payment_intent_id}&user_id=${user?.user_id}`, { method: 'POST', credentials: 'include' });
      if (cf.ok) { const r = await cf.json(); toast.success(`Added ${r.paid_credits_added || 0} paid + ${r.bonus_credits_added || 0} bonus credits!`); setShowTopupModal(false); setSelectedPackage(null); fetchWalletData(); fetchTransactions(); }
      else throw new Error('Payment confirmation failed');
    } catch (e) { toast.error(e.message || 'Top-up failed'); } finally { setProcessing(false); }
  };

  const getTransactionIcon = (type) => {
    const map = { topup_paid: <ArrowRight className="w-5 h-5 text-success rotate-180" />, topup_bonus: <Star className="w-5 h-5 text-gold-dark" />, session_deduction: <BookOpen className="w-5 h-5 text-danger" />, refund_paid: <RefreshCw className="w-5 h-5 text-info" />, refund_bonus: <RefreshCw className="w-5 h-5 text-info" />, bonus_reward: <Star className="w-5 h-5 text-gold-dark" />, bonus_expired: <AlertCircle className="w-5 h-5 text-warning" /> };
    return map[type] || <CreditCard className="w-5 h-5 text-ink-secondary" />;
  };
  const getTransactionColor = (type, amount) => { if (type.includes('deduction') || type.includes('expired')) return 'text-danger'; if (type.includes('bonus') || type === 'topup_bonus') return 'text-gold-dark'; return amount > 0 ? 'text-success' : 'text-danger'; };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  if (loading) return <div className="p-4 lg:p-8 flex items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-brand to-brand-light rounded-lg p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div><p className="text-white/70 text-small mb-1">Total Credits</p><p className="text-5xl font-bold" data-testid="total-credits">{Math.floor(walletData?.credit_balance || 0)}</p><p className="text-white/60 text-small mt-1">credits available</p></div>
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"><CreditCard className="w-7 h-7" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 mb-4">
              <div className="bg-white/10 rounded-md p-3"><p className="text-white/60 text-caption mb-1">Paid Credits</p><p className="text-h2 font-bold" data-testid="paid-credits">{Math.floor(walletData?.paid_credits || 0)}</p></div>
              <div className="bg-gold-dark/30 rounded-md p-3"><p className="text-white/60 text-caption mb-1">Bonus Credits</p><p className="text-h2 font-bold" data-testid="bonus-credits">{Math.floor(walletData?.bonus_credits || 0)}</p><p className="text-white/50 text-caption">Expires in 12 months</p></div>
            </div>
            <div className="flex items-center gap-6 pt-4 border-t border-white/20 text-body">
              <div><p className="text-white/60 text-caption">Paid Purchased</p><p className="font-semibold">{Math.floor(walletData?.total_paid_credits_purchased || 0)}</p></div>
              <div><p className="text-white/60 text-caption">Bonus Received</p><p className="font-semibold">{Math.floor(walletData?.total_bonus_credits_received || 0)}</p></div>
              <div><p className="text-white/60 text-caption">Total Used</p><p className="font-semibold">{Math.floor(walletData?.total_credits_used || 0)}</p></div>
            </div>
          </div>
        </div>

        {/* Credit Info */}
        <div className="bg-gold/10 border border-gold/20 rounded-md p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gold-dark flex-shrink-0 mt-0.5" />
            <div><p className="font-medium text-brand text-body mb-1">How Credits Work</p><p className="text-small text-ink-secondary">1 credit = 15 minutes. A 30-min session uses 2 credits (RM27), 60-min uses 4 credits (RM50). <span className="font-medium">Paid credits are used first.</span> <span className="text-gold-dark">Bonus credits expire after 12 months.</span></p></div>
          </div>
        </div>

        {/* Top-up Packages */}
        <Card className="p-6">
          <h3 className="text-h3 text-brand mb-4">Top Up Credits</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div key={pkg.package_id} className={`relative p-5 rounded-md border-2 transition-all hover:shadow-apple-md cursor-pointer ${pkg.popular ? 'border-gold bg-gold/5' : 'border-ink-faint/20 hover:border-brand/30'}`}
                onClick={() => { setSelectedPackage(pkg); setShowTopupModal(true); }} data-testid={`package-${pkg.package_id}`}>
                {pkg.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gold text-white text-caption font-medium">Most Popular</span>}
                <div className="text-center">
                  <p className="text-small text-ink-secondary mb-1">{pkg.name}</p>
                  <p className="text-3xl font-bold text-brand mb-1">{pkg.total_credits || pkg.credits}</p>
                  <p className="text-small text-ink-tertiary mb-2">total credits</p>
                  <div className="flex justify-center gap-2 mb-3">
                    <span className="text-caption bg-surface-subtle px-2 py-1 rounded-sm">{pkg.paid_credits} paid</span>
                    {pkg.bonus_credits > 0 && <span className="text-caption bg-gold/20 text-gold-dark px-2 py-1 rounded-sm font-medium">+{pkg.bonus_credits} bonus</span>}
                  </div>
                  <p className="text-h2 font-bold text-brand">RM {pkg.price_myr}</p>
                  <p className="text-caption text-success font-medium mt-1">{pkg.savings_display || pkg.savings}</p>
                </div>
                <button className={`w-full mt-4 py-2.5 rounded-md font-medium transition-all ${pkg.popular ? 'bg-gold text-white hover:bg-gold-dark' : 'bg-brand text-white hover:bg-brand-light'}`}>Select Package</button>
              </div>
            ))}
          </div>
        </Card>

        {/* Transactions */}
        <Card className="p-6">
          <h3 className="text-h3 text-brand mb-4">Transaction History</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-8"><CreditCard className="w-12 h-12 mx-auto mb-3 text-ink-faint" /><p className="text-ink-secondary">No transactions yet</p></div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.transaction_id} className="flex items-center justify-between p-4 bg-surface-subtle rounded-md">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.credit_amount > 0 ? 'bg-success/10' : 'bg-danger/10'}`}>{getTransactionIcon(tx.transaction_type)}</div>
                    <div><p className="font-medium text-small text-ink">{tx.description}</p><p className="text-caption text-ink-tertiary">{formatDate(tx.created_at)}</p></div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getTransactionColor(tx.transaction_type, tx.credit_amount)}`}>{tx.credit_amount > 0 ? '+' : ''}{Math.floor(tx.credit_amount || tx.credits || 0)} credits</p>
                    {tx.payment_amount > 0 && <p className="text-caption text-ink-tertiary">RM {tx.payment_amount}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Top-up Modal */}
      {showTopupModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => { setShowTopupModal(false); setSelectedPackage(null); }}>
          <div className="bg-surface-card rounded-xl p-6 w-full max-w-md animate-modal-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-h3 text-brand mb-6">Confirm Top-up</h3>
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-surface-subtle rounded-md text-center">
                <p className="text-small text-ink-secondary mb-1">{selectedPackage.name}</p>
                <p className="text-3xl font-bold text-brand mb-1">{selectedPackage.total_credits || selectedPackage.credits} credits</p>
                <div className="flex justify-center gap-2 mt-2">
                  <span className="text-caption bg-surface-muted px-2 py-1 rounded-sm">{selectedPackage.paid_credits} paid</span>
                  {selectedPackage.bonus_credits > 0 && <span className="text-caption bg-gold/20 text-gold-dark px-2 py-1 rounded-sm font-medium">+{selectedPackage.bonus_credits} bonus</span>}
                </div>
              </div>
              <div className="p-4 bg-gold/10 rounded-md border border-gold/20">
                <div className="flex items-center justify-between"><span className="text-ink-secondary">Amount to Pay</span><span className="text-h2 font-bold text-brand">RM {selectedPackage.price_myr}</span></div>
                <p className="text-caption text-success mt-1">{selectedPackage.savings_display || selectedPackage.savings}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowTopupModal(false); setSelectedPackage(null); }} disabled={processing} className="flex-1 py-3 rounded-md border border-ink-faint/40 font-medium text-brand hover:bg-surface-subtle transition-all disabled:opacity-50">Cancel</button>
              <button onClick={confirmTopup} disabled={processing} className="flex-1 py-3 rounded-md bg-brand text-white font-medium hover:bg-brand-light transition-all disabled:opacity-50 flex items-center justify-center gap-2" data-testid="confirm-topup-btn">
                {processing ? <Spinner size="sm" className="border-white border-t-transparent" /> : <><CreditCard className="w-5 h-5" />Pay Now</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
