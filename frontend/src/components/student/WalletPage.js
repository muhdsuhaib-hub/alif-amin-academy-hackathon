import React, { useState, useEffect } from 'react';
import { CreditCard, Clock, Star, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight, X, ChevronLeft, ChevronRight, Plus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Spinner from '../Spinner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ITEMS_PER_PAGE = 10;

function CreditCard3D({ wallet }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-6 sm:p-8 text-white shadow-lg" data-testid="wallet-credit-card">
      {/* Decorative elements */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-amber-500/10" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute top-6 right-6 w-10 h-10 rounded-full border-2 border-amber-400/30 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border border-amber-400/40" />
      </div>

      <div className="relative z-10">
        <p className="text-emerald-200/50 text-[10px] font-medium uppercase tracking-[0.2em] mb-1">Available Balance</p>
        <p className="text-3xl sm:text-4xl font-bold">
          {wallet?.credit_balance || 0}
          <span className="text-lg font-normal text-emerald-200/60 ml-1.5">credits</span>
        </p>

        <div className="flex gap-6 mt-5">
          <div>
            <p className="text-emerald-200/40 text-[10px] uppercase tracking-wider">Paid</p>
            <p className="text-lg font-semibold text-amber-300">{wallet?.paid_credits || 0}</p>
          </div>
          <div>
            <p className="text-emerald-200/40 text-[10px] uppercase tracking-wider">Bonus</p>
            <p className="text-lg font-semibold text-emerald-300">{wallet?.bonus_credits || 0}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-emerald-200/30 text-xs">Alif Amin Academy</p>
          <div className="flex gap-1">
            {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 rounded-full bg-emerald-200/20" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionIcon({ type, amount }) {
  const config = {
    topup_paid: { icon: ArrowDownRight, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    topup_bonus: { icon: Star, bg: 'bg-amber-50', color: 'text-amber-600' },
    session_deduction: { icon: ArrowUpRight, bg: 'bg-red-50', color: 'text-red-500' },
    refund_paid: { icon: RefreshCw, bg: 'bg-blue-50', color: 'text-blue-600' },
    refund_bonus: { icon: RefreshCw, bg: 'bg-blue-50', color: 'text-blue-600' },
    bonus_reward: { icon: Star, bg: 'bg-amber-50', color: 'text-amber-600' },
    bonus_expired: { icon: AlertCircle, bg: 'bg-orange-50', color: 'text-orange-500' },
  };
  const c = config[type] || { icon: CreditCard, bg: 'bg-slate-50', color: 'text-slate-500' };
  const Icon = c.icon;
  return (
    <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-4 h-4 ${c.color}`} />
    </div>
  );
}

export default function WalletPage({ user }) {
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Handle Billplz redirect back
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ps = params.get('payment');
    if (ps === 'success') {
      setPaymentStatus('success');
      toast.success('Payment successful! Credits have been added.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (ps === 'failed') {
      setPaymentStatus('failed');
      toast.error('Payment was not completed.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => { fetchWalletData(); fetchTransactions(); fetchPackages(); }, [user]);

  const fetchWalletData = async () => {
    try {
      const r = await fetch(`${API}/wallet/balance?user_id=${user?.user_id}`, { credentials: 'include' });
      if (r.ok) { const d = await r.json(); setWalletData(d.wallet); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTransactions = async () => {
    try {
      const r = await fetch(`${API}/wallet/transactions?user_id=${user?.user_id}&limit=100`, { credentials: 'include' });
      if (r.ok) { const d = await r.json(); setTransactions(d.transactions || []); }
    } catch (e) { console.error(e); }
  };

  const fetchPackages = async () => {
    try {
      const r = await fetch(`${API}/wallet/packages`, { credentials: 'include' });
      if (r.ok) { const d = await r.json(); setPackages(d.packages || []); }
    } catch (e) { console.error(e); }
  };

  const confirmTopup = async () => {
    if (topupMode === 'custom') {
      await confirmCustomTopup();
      return;
    }
    if (!selectedPackage) return;
    setProcessing(true);
    try {
      const billplzRes = await fetch(`${API}/payments/billplz/create-bill`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ package_id: selectedPackage.package_id }),
      });
      if (billplzRes.ok) {
        const { bill_url } = await billplzRes.json();
        toast.info('Redirecting to Billplz payment...');
        window.location.href = bill_url;
        return;
      }
      const err = await billplzRes.json();
      toast.error(err.detail || 'Payment gateway not available. Please contact admin.');
    } catch (e) { toast.error('Could not connect to payment gateway.'); }
    finally { setProcessing(false); }
  };

  const confirmCustomTopup = async () => {
    const qty = parseInt(customQuantity, 10);
    if (!qty || qty < 1 || qty > 100) { toast.error('Enter 1–100 credits'); return; }
    setProcessing(true);
    try {
      const r = await fetch(`${API}/wallet/topup/custom?user_id=${user?.user_id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ credits: qty }),
      });
      if (r.ok) {
        const data = await r.json();
        toast.success(`Added ${data.credits_added || qty} credits!`);
        closeTopupModal();
        fetchWalletData();
        fetchTransactions();
      } else {
        const data = await r.json();
        throw new Error(data.detail || 'Custom top-up failed');
      }
    } catch (e) { toast.error(e.message || 'Top-up failed'); }
    finally { setProcessing(false); }
  };

  const closeTopupModal = () => {
    setShowTopupModal(false);
    setSelectedPackage(null);
    setCustomQuantity('');
    setTopupMode('package');
  };

  const customTotal = parseInt(customQuantity, 10) > 0 ? parseInt(customQuantity, 10) * 15 : 0;
  const canConfirm = topupMode === 'package' ? !!selectedPackage : (parseInt(customQuantity, 10) > 0);

  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const pagedTransactions = transactions.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const getAmountColor = (type, amount) => {
    if (type && (type.includes('deduction') || type.includes('expired'))) return 'text-red-500';
    return amount > 0 ? 'text-emerald-600' : 'text-red-500';
  };

  if (loading) return <div className="p-8 flex items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto" data-testid="wallet-page">
      {/* Credit Card */}
      <CreditCard3D wallet={walletData} />

      {/* Top Up Button */}
      <button
        onClick={() => setShowTopupModal(true)}
        data-testid="topup-btn"
        className="w-full mt-4 h-12 rounded-2xl bg-amber-100 text-amber-800 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-amber-200 transition-all active:scale-[0.98]"
      >
        <Plus className="w-4 h-4" />
        Top Up Credits
      </button>

      {/* Transaction History */}
      <div className="mt-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm" data-testid="transaction-history">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Transaction History</h3>
        </div>

        {transactions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-200" />
            <p className="text-xs text-slate-400">No transactions yet</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-50">
              {pagedTransactions.map((t, i) => (
                <div key={t.transaction_id || i} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                  <TransactionIcon type={t.transaction_type} amount={t.credit_amount} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 truncate">{t.description}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(t.created_at)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${getAmountColor(t.transaction_type, t.credit_amount)}`}>
                    {t.credit_amount > 0 ? '+' : ''}{t.credit_amount}
                  </span>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 text-xs text-slate-500 disabled:opacity-30 hover:text-emerald-700"
                  data-testid="tx-prev-page"
                >
                  <ChevronLeft className="w-3 h-3" />Prev
                </button>
                <span className="text-xs text-slate-400">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 text-xs text-slate-500 disabled:opacity-30 hover:text-emerald-700"
                  data-testid="tx-next-page"
                >
                  Next<ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Top-up Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={closeTopupModal}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto animate-modal-in shadow-xl" onClick={e => e.stopPropagation()} data-testid="topup-modal">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Top Up Credits</h2>
              <button onClick={closeTopupModal} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="px-6 pt-5 pb-2">
              <div className="flex rounded-2xl bg-slate-100 p-1" data-testid="topup-mode-toggle">
                <button
                  onClick={() => { setTopupMode('package'); setCustomQuantity(''); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${topupMode === 'package' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  data-testid="topup-mode-package"
                >
                  Packages
                </button>
                <button
                  onClick={() => { setTopupMode('custom'); setSelectedPackage(null); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${topupMode === 'custom' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  data-testid="topup-mode-custom"
                >
                  Custom Amount
                </button>
              </div>
            </div>

            <div className="p-6 pt-3 space-y-3">
              {topupMode === 'package' ? (
                /* Package Selection */
                packages.map(pkg => (
                  <button
                    key={pkg.package_id}
                    onClick={() => setSelectedPackage(pkg)}
                    data-testid={`package-${pkg.package_id}`}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      selectedPackage?.package_id === pkg.package_id
                        ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200'
                        : 'bg-white border-slate-200 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{pkg.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {pkg.paid_credits} paid{pkg.bonus_credits > 0 ? ` + ${pkg.bonus_credits} bonus` : ''} credits
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-700">RM {pkg.price_myr}</p>
                        {pkg.bonus_credits > 0 && (
                          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            +{pkg.bonus_credits} bonus
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                /* Custom Top-Up */
                <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200 p-5" data-testid="custom-topup-card">
                  <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">How many credits?</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={customQuantity}
                      onChange={e => setCustomQuantity(e.target.value)}
                      placeholder="e.g. 5"
                      className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-lg font-semibold text-slate-900 text-center placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      data-testid="custom-quantity-input"
                    />
                    <span className="text-sm text-slate-500 flex-shrink-0">credits</span>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Rate: RM 15 / credit</span>
                    <span className="text-sm font-bold text-emerald-700" data-testid="custom-total-price">
                      {customTotal > 0 ? `RM ${customTotal}` : 'RM 0'}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={confirmTopup}
                disabled={!canConfirm || processing}
                className="w-full h-12 rounded-2xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                data-testid="confirm-topup-btn"
              >
                {processing ? <><Spinner size="sm" className="border-white border-t-transparent" /> Processing...</> : 'Confirm Top Up'}
              </button>
              <p className="text-[11px] text-slate-400 text-center">Payment processing is currently in demo mode</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
