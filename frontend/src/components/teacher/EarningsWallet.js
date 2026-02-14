import React, { useState, useEffect } from 'react';
import { 
  Wallet, CreditCard, X, Star, Circle, Award, RefreshCw, TrendingUp, TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';

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
  const [bankDetails, setBankDetails] = useState({
    bank: 'maybank',
    accountNumber: '',
    accountName: ''
  });

  useEffect(() => {
    if (user?.user_id) {
      fetchEarningsData();
    }
  }, [user]);

  const fetchEarningsData = async () => {
    setLoading(true);
    try {
      const balanceRes = await fetch(`${API}/tutor-earnings/balance?user_id=${user.user_id}`, {
        credentials: 'include'
      });
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setEarnings(balanceData.earnings);
      }

      const txRes = await fetch(`${API}/tutor-earnings/transactions?user_id=${user.user_id}&limit=20`, {
        credentials: 'include'
      });
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }

      const wdRes = await fetch(`${API}/tutor-earnings/withdrawals?user_id=${user.user_id}&limit=10`, {
        credentials: 'include'
      });
      if (wdRes.ok) {
        const wdData = await wdRes.json();
        setWithdrawals(wdData.withdrawals || []);
      }
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!bankDetails.accountNumber || !bankDetails.accountName) {
      toast.error('Please fill in all bank details');
      return;
    }
    
    const amount = parseFloat(withdrawAmount);
    if (amount > (earnings?.withdrawable_balance || 0)) {
      toast.error(`Insufficient balance. Available: RM ${(earnings?.withdrawable_balance || 0).toFixed(2)}`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API}/tutor-earnings/withdraw?user_id=${user.user_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: amount,
          bank_name: bankDetails.bank,
          account_number: bankDetails.accountNumber,
          account_holder_name: bankDetails.accountName
        })
      });

      if (response.ok) {
        toast.success('Withdrawal request submitted! You will be notified once processed.');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setBankDetails({ bank: 'maybank', accountNumber: '', accountName: '' });
        fetchEarningsData();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      toast.error('Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const commissionRate = commissionInfo?.commission_rate || 0.30;
  const tutorRate = 1 - commissionRate;
  const withdrawableBalance = earnings?.withdrawable_balance || 0;
  const totalEarnings = earnings?.total_earnings || 0;
  const pendingWithdrawal = earnings?.pending_withdrawal || 0;
  const totalWithdrawn = earnings?.total_withdrawn || 0;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-600';
      case 'pending': case 'processing': return 'bg-yellow-50 text-yellow-600';
      case 'rejected': return 'bg-red-50 text-red-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'session_earning': return 'Session Earning';
      case 'withdrawal_request': return 'Withdrawal';
      case 'withdrawal_approved': return 'Withdrawal Paid';
      case 'withdrawal_rejected': return 'Withdrawal Returned';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3D2E]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-[#0F3D2E] to-[#1a5c47] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm opacity-80 mb-1">Withdrawable Balance</p>
            <p className="text-4xl font-bold" data-testid="withdrawable-balance">RM {withdrawableBalance.toFixed(2)}</p>
            {pendingWithdrawal > 0 && (
              <p className="text-sm opacity-70 mt-1">RM {pendingWithdrawal.toFixed(2)} pending withdrawal</p>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={withdrawableBalance <= 0}
            className="flex-1 h-11 rounded-xl bg-white text-[#0F3D2E] font-medium flex items-center justify-center gap-2 transition-all hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="withdraw-btn"
          >
            <CreditCard className="w-4 h-4" />
            Withdraw Funds
          </button>
          <button 
            onClick={fetchEarningsData}
            className="h-11 px-4 rounded-xl bg-white bg-opacity-20 font-medium flex items-center gap-2 transition-all hover:bg-opacity-30"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tier & Commission Info */}
      {commissionInfo && (
        <div className="bg-white rounded-xl p-4 border" >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  backgroundColor: commissionInfo.tier_level === 'elite' ? 'rgba(15, 61, 46, 0.1)' : 
                                   commissionInfo.tier_level === 'rated' ? 'rgba(212, 175, 55, 0.15)' : 
                                   'rgba(107, 114, 128, 0.1)'
                }}
              >
                {commissionInfo.tier_level === 'elite' && <Award className="w-5 h-5" style={{ color: '#0F3D2E' }} />}
                {commissionInfo.tier_level === 'rated' && <Star className="w-5 h-5" style={{ color: '#D4AF37' }} />}
                {commissionInfo.tier_level === 'new' && <Circle className="w-5 h-5" style={{ color: '#6B7280' }} />}
              </div>
              <div>
                <p className="font-semibold" style={{ color: '#0F3D2E' }}>{commissionInfo.tier_name}</p>
                <p className="text-xs text-gray-500">Your earnings: {Math.round(tutorRate * 100)}% of session fee</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Platform Fee</p>
              <p className="text-lg font-semibold" style={{ color: '#E76F51' }}>{Math.round(commissionRate * 100)}%</p>
            </div>
          </div>
          
          {commissionInfo.next_tier?.next_tier && (
            <div className="mt-4 pt-4 border-t" >
              <p className="text-xs text-gray-500 mb-2">Progress to {commissionInfo.next_tier.next_tier_name}</p>
              {commissionInfo.next_tier.requirements.rating_needed > 0 && (
                <p className="text-xs" style={{ color: '#5A5A5A' }}>
                  Need {commissionInfo.next_tier.requirements.rating_needed?.toFixed(1)} more rating points
                </p>
              )}
              {commissionInfo.next_tier.requirements.reviews_needed > 0 && (
                <p className="text-xs" style={{ color: '#5A5A5A' }}>
                  Need {commissionInfo.next_tier.requirements.reviews_needed} more reviews
                </p>
              )}
              {commissionInfo.next_tier.requirements.sessions_needed > 0 && (
                <p className="text-xs" style={{ color: '#5A5A5A' }}>
                  Need {commissionInfo.next_tier.requirements.sessions_needed} more completed sessions
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border" >
          <p className="text-xs text-gray-500 mb-1">Total Earned</p>
          <p className="text-xl font-semibold" style={{ color: '#0F3D2E' }}>RM {totalEarnings.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border" >
          <p className="text-xs text-gray-500 mb-1">Total Withdrawn</p>
          <p className="text-xl font-semibold" style={{ color: '#2EB6A0' }}>RM {totalWithdrawn.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border" >
          <p className="text-xs text-gray-500 mb-1">Pending Withdrawal</p>
          <p className="text-xl font-semibold" style={{ color: '#D4AF37' }}>RM {pendingWithdrawal.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border" >
          <p className="text-xs text-gray-500 mb-1">Transactions</p>
          <p className="text-xl font-semibold" style={{ color: '#0F3D2E' }}>{transactions.length}</p>
        </div>
      </div>

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <div className="bg-white rounded-2xl border overflow-hidden" >
          <div className="p-4 border-b" >
            <h3 className="font-semibold" style={{ color: '#0F3D2E' }}>Recent Withdrawals</h3>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(15, 61, 46, 0.05)' }}>
            {withdrawals.slice(0, 5).map((wd) => (
              <div key={wd.withdrawal_id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F7F5EF] flex items-center justify-center">
                    <CreditCard className="w-5 h-5" style={{ color: '#0F3D2E' }} />
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: '#1D1D1F' }}>
                      {wd.bank_name} - ****{wd.account_number?.slice(-4)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(wd.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold" style={{ color: '#E76F51' }}>-RM {wd.amount.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(wd.status)}`}>
                    {wd.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border overflow-hidden" >
        <div className="p-4 border-b flex items-center justify-between" >
          <h3 className="font-semibold" style={{ color: '#0F3D2E' }}>Earnings History</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No transactions yet</p>
            <p className="text-sm text-gray-400 mt-1">Your earnings will appear here after completing sessions</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(15, 61, 46, 0.05)' }}>
            {transactions.map((tx) => (
              <div key={tx.transaction_id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.amount > 0 ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    {tx.amount > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: '#1D1D1F' }}>
                      {getTransactionTypeLabel(tx.transaction_type)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.created_at).toLocaleDateString()} • {tx.description?.slice(0, 40)}
                      {tx.description?.length > 40 ? '...' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${tx.amount > 0 ? 'text-[#2EB6A0]' : 'text-[#E76F51]'}`}>
                    {tx.amount > 0 ? '+' : ''}RM {Math.abs(tx.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Balance: RM {tx.balance_after?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: '#0F3D2E' }}>Withdraw Funds</h3>
              <button onClick={() => setShowWithdrawModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Amount (RM)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={withdrawableBalance}
                  className="apple-input"
                  
                  data-testid="withdraw-amount-input"
                />
                <p className="text-xs text-gray-500 mt-1">Available: RM {withdrawableBalance.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Bank</label>
                <select
                  value={bankDetails.bank}
                  onChange={(e) => setBankDetails({ ...bankDetails, bank: e.target.value })}
                  className="apple-input"
                  
                  data-testid="withdraw-bank-select"
                >
                  <option value="maybank">Maybank</option>
                  <option value="cimb">CIMB Bank</option>
                  <option value="rhb">RHB Bank</option>
                  <option value="publicbank">Public Bank</option>
                  <option value="paypal">PayPal (International)</option>
                  <option value="wise">Wise (International)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Account Number</label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  placeholder="Enter account number"
                  className="apple-input"
                  
                  data-testid="withdraw-account-number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Account Holder Name</label>
                <input
                  type="text"
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                  placeholder="Enter account holder name"
                  className="apple-input"
                  
                  data-testid="withdraw-account-name"
                />
              </div>

              <button
                onClick={handleWithdraw}
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-[#0F3D2E] text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="submit-withdrawal-btn"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Submit Withdrawal Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
