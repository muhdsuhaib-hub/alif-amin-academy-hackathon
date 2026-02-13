import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Clock, Star, RefreshCw, AlertCircle, ArrowRight, BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

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

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
    fetchPackages();
  }, [user]);

  const fetchWalletData = async () => {
    try {
      const response = await fetch(`${API}/wallet/balance?user_id=${user?.user_id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setWalletData(data.wallet);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API}/wallet/transactions?user_id=${user?.user_id}&limit=20`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${API}/wallet/packages`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const handleTopup = async (pkg) => {
    setSelectedPackage(pkg);
    setShowTopupModal(true);
  };

  const confirmTopup = async () => {
    if (!selectedPackage) return;
    
    setProcessing(true);
    try {
      const createResponse = await fetch(`${API}/wallet/topup/create-intent?user_id=${user?.user_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          package_id: selectedPackage.package_id,
          payment_method: 'stripe'
        })
      });
      
      if (!createResponse.ok) throw new Error('Failed to create payment intent');
      
      const intentData = await createResponse.json();
      
      const confirmResponse = await fetch(
        `${API}/wallet/topup/confirm?payment_intent_id=${intentData.payment_intent_id}&user_id=${user?.user_id}`,
        { method: 'POST', credentials: 'include' }
      );
      
      if (confirmResponse.ok) {
        const result = await confirmResponse.json();
        toast.success(`Successfully added ${result.paid_credits_added || 0} paid + ${result.bonus_credits_added || 0} bonus credits!`);
        setShowTopupModal(false);
        setSelectedPackage(null);
        fetchWalletData();
        fetchTransactions();
      } else {
        throw new Error('Payment confirmation failed');
      }
    } catch (error) {
      toast.error(error.message || 'Top-up failed');
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'topup_paid': return <ArrowRight className="w-5 h-5 text-green-600 rotate-180" />;
      case 'topup_bonus': return <Star className="w-5 h-5 text-[#D4AF37]" />;
      case 'session_deduction': return <BookOpen className="w-5 h-5 text-red-600" />;
      case 'refund_paid':
      case 'refund_bonus': return <RefreshCw className="w-5 h-5 text-blue-600" />;
      case 'bonus_reward': return <Star className="w-5 h-5 text-[#D4AF37]" />;
      case 'bonus_expired': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default: return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type, amount) => {
    if (type.includes('deduction') || type.includes('expired')) return 'text-red-600';
    if (type.includes('bonus') || type === 'topup_bonus') return 'text-[#D4AF37]';
    if (amount > 0) return 'text-green-600';
    return 'text-red-600';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F3D2E]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Credit Balance Card */}
        <div className="bg-gradient-to-br from-[#0F3D2E] to-[#1a5c47] rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/70 text-sm mb-1">Total Credits</p>
                <p className="text-5xl font-bold" data-testid="total-credits">{Math.floor(walletData?.credit_balance || 0)}</p>
                <p className="text-white/60 text-sm mt-1">credits available</p>
              </div>
              <div className="text-right">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-2">
                  <CreditCard className="w-7 h-7" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4 mb-4">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/60 text-xs mb-1">Paid Credits</p>
                <p className="text-2xl font-bold" data-testid="paid-credits">{Math.floor(walletData?.paid_credits || 0)}</p>
              </div>
              <div className="bg-[#D4AF37]/30 rounded-xl p-3">
                <p className="text-white/60 text-xs mb-1">Bonus Credits</p>
                <p className="text-2xl font-bold" data-testid="bonus-credits">{Math.floor(walletData?.bonus_credits || 0)}</p>
                <p className="text-white/50 text-xs">Expires in 12 months</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 pt-4 border-t border-white/20">
              <div>
                <p className="text-white/60 text-xs">Paid Purchased</p>
                <p className="text-lg font-semibold">{Math.floor(walletData?.total_paid_credits_purchased || 0)}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Bonus Received</p>
                <p className="text-lg font-semibold">{Math.floor(walletData?.total_bonus_credits_received || 0)}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Total Used</p>
                <p className="text-lg font-semibold">{Math.floor(walletData?.total_credits_used || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Info */}
        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[#0F3D2E] mb-1">How Credits Work</p>
              <p className="text-sm text-gray-600">
                1 credit = 15 minutes of class time. A 30-minute session uses 2 credits (RM27), and a 60-minute session uses 4 credits (RM50). 
                <span className="font-medium"> Paid credits are used first, then bonus credits.</span>
                <span className="text-[#D4AF37]"> Bonus credits expire after 12 months.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Top-up Packages */}
        <div className="bg-white rounded-2xl p-6 border mb-6" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#0F3D2E' }}>Top Up Credits</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div 
                key={pkg.package_id}
                className={`relative p-5 rounded-xl border-2 transition-all hover:shadow-lg cursor-pointer ${
                  pkg.popular ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-gray-100 hover:border-[#0F3D2E]/30'
                }`}
                onClick={() => handleTopup(pkg)}
                data-testid={`package-${pkg.package_id}`}
              >
                {pkg.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#D4AF37] text-white text-xs font-medium">
                    Most Popular
                  </span>
                )}
                
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">{pkg.name}</p>
                  <p className="text-3xl font-bold mb-1" style={{ color: '#0F3D2E' }}>{pkg.total_credits || pkg.credits}</p>
                  <p className="text-sm text-gray-400 mb-2">total credits</p>
                  
                  <div className="flex justify-center gap-2 mb-3">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{pkg.paid_credits} paid</span>
                    {pkg.bonus_credits > 0 && (
                      <span className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-1 rounded font-medium">
                        +{pkg.bonus_credits} bonus
                      </span>
                    )}
                  </div>
                  
                  <p className="text-2xl font-bold" style={{ color: '#0F3D2E' }}>RM {pkg.price_myr}</p>
                  <p className="text-xs text-green-600 font-medium mt-1">{pkg.savings_display || pkg.savings}</p>
                </div>
                
                <button className={`w-full mt-4 py-2.5 rounded-xl font-medium transition-all ${
                  pkg.popular ? 'bg-[#D4AF37] text-white hover:opacity-90' : 'bg-[#0F3D2E] text-white hover:opacity-90'
                }`}>
                  Select Package
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#0F3D2E' }}>Transaction History</h3>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.transaction_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.credit_amount > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {getTransactionIcon(tx.transaction_type)}
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#1F2933' }}>{tx.description}</p>
                      <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getTransactionColor(tx.transaction_type, tx.credit_amount)}`}>
                      {tx.credit_amount > 0 ? '+' : ''}{Math.floor(tx.credit_amount || tx.credits || 0)} credits
                    </p>
                    {tx.payment_amount > 0 && <p className="text-xs text-gray-400">RM {tx.payment_amount}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top-up Confirmation Modal */}
      {showTopupModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4" style={{ color: '#0F3D2E' }}>Confirm Top-up</h3>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-500 mb-1">{selectedPackage.name}</p>
                <p className="text-4xl font-bold mb-1" style={{ color: '#0F3D2E' }}>
                  {selectedPackage.total_credits || selectedPackage.credits} credits
                </p>
                <div className="flex justify-center gap-2 mt-2">
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">{selectedPackage.paid_credits} paid</span>
                  {selectedPackage.bonus_credits > 0 && (
                    <span className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-1 rounded font-medium">
                      +{selectedPackage.bonus_credits} bonus
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/20">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Amount to Pay</span>
                  <span className="text-2xl font-bold" style={{ color: '#0F3D2E' }}>RM {selectedPackage.price_myr}</span>
                </div>
                <p className="text-xs text-green-600 mt-1">{selectedPackage.savings_display || selectedPackage.savings}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowTopupModal(false); setSelectedPackage(null); }}
                disabled={processing}
                className="flex-1 py-3 rounded-xl border font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                style={{ borderColor: 'rgba(15, 61, 46, 0.2)', color: '#0F3D2E' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmTopup}
                disabled={processing}
                className="flex-1 py-3 rounded-xl bg-[#0F3D2E] text-white font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="confirm-topup-btn"
              >
                {processing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
