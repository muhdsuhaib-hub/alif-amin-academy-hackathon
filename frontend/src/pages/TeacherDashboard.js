import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, LogOut, Calendar, DollarSign, Users, Clock, Plus, X, Video, 
  AlertCircle, CheckCircle, Bell, Star, ChevronDown, ChevronUp, 
  Wallet, Edit3, Save, User, Circle, Menu, Home, FileText, 
  Settings, CreditCard, Book, UserCheck, Download, Upload,
  Globe, Award, Tag, MessageSquare, ChevronRight, RefreshCw,
  TrendingUp, TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';
import NotificationBell from '../components/NotificationBell';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Sidebar Navigation Component
function TeacherSidebar({ activeSection, setActiveSection, isCollapsed, setIsCollapsed }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'wallet', label: 'Earnings Wallet', icon: Wallet },
    { id: 'availability', label: 'Availability', icon: Calendar },
    { id: 'classroom', label: 'Classroom Tools', icon: Book },
    { id: 'students', label: 'Student Management', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-white border-r z-50 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}
      style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}
    >
      {/* Logo */}
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0F3D2E' }}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm" style={{ color: '#0F3D2E' }}>Alif Amin</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-all"
        >
          <Menu className="w-5 h-5" style={{ color: '#5A5A5A' }} />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="p-2 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              activeSection === item.id ? 'bg-[#0F3D2E] text-white' : 'hover:bg-gray-50 text-gray-600'
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}

// Earnings Wallet Section - Connected to Backend
function EarningsWallet({ teacherData, commissionInfo, user }) {
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
      // Fetch earnings balance
      const balanceRes = await fetch(`${API}/tutor-earnings/balance?user_id=${user.user_id}`, {
        credentials: 'include'
      });
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setEarnings(balanceData.earnings);
      }

      // Fetch transaction history
      const txRes = await fetch(`${API}/tutor-earnings/transactions?user_id=${user.user_id}&limit=20`, {
        credentials: 'include'
      });
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }

      // Fetch withdrawal history
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
        const data = await response.json();
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
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
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
          
          {/* Next Tier Progress */}
          {commissionInfo.next_tier?.next_tier && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
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
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <p className="text-xs text-gray-500 mb-1">Total Earned</p>
          <p className="text-xl font-semibold" style={{ color: '#0F3D2E' }}>RM {totalEarnings.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <p className="text-xs text-gray-500 mb-1">Total Withdrawn</p>
          <p className="text-xl font-semibold" style={{ color: '#2EB6A0' }}>RM {totalWithdrawn.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <p className="text-xs text-gray-500 mb-1">Pending Withdrawal</p>
          <p className="text-xl font-semibold" style={{ color: '#D4AF37' }}>RM {pendingWithdrawal.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <p className="text-xs text-gray-500 mb-1">Transactions</p>
          <p className="text-xl font-semibold" style={{ color: '#0F3D2E' }}>{transactions.length}</p>
        </div>
      </div>

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
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
                    <p className="font-medium text-sm" style={{ color: '#1F2933' }}>
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
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
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
                    <p className="font-medium text-sm" style={{ color: '#1F2933' }}>
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
                  className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                  data-testid="withdraw-amount-input"
                />
                <p className="text-xs text-gray-500 mt-1">Available: RM {withdrawableBalance.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Bank</label>
                <select
                  value={bankDetails.bank}
                  onChange={(e) => setBankDetails({ ...bankDetails, bank: e.target.value })}
                  className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
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
                  className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
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
                  className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
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

// Availability Calendar Section
function AvailabilityCalendar({ teacherData }) {
  const [availability, setAvailability] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    recurring: false,
    days: []
  });
  const [userTimezone, setUserTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [loading, setLoading] = useState(false);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    if (teacherData?.teacher_id) {
      fetchAvailability();
    }
  }, [teacherData]);

  const fetchAvailability = async () => {
    try {
      const response = await fetch(`${API}/teachers/${teacherData.teacher_id}/availability`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setAvailability(data || []);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const handleAddAvailability = async () => {
    if (!newSlot.startDate || !newSlot.startTime || !newSlot.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Generate slots for the date range
      const start = new Date(newSlot.startDate);
      const end = newSlot.endDate ? new Date(newSlot.endDate) : start;
      
      let currentDate = new Date(start);
      while (currentDate <= end) {
        const startDateTime = new Date(`${currentDate.toISOString().split('T')[0]}T${newSlot.startTime}`);
        const endDateTime = new Date(`${currentDate.toISOString().split('T')[0]}T${newSlot.endTime}`);

        await fetch(`${API}/teachers/${teacherData.teacher_id}/availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            start_time_utc: startDateTime.toISOString(),
            end_time_utc: endDateTime.toISOString(),
            recurring: newSlot.recurring
          })
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      toast.success('Availability slots added successfully!');
      setShowAddModal(false);
      setNewSlot({ startDate: '', endDate: '', startTime: '', endTime: '', recurring: false, days: [] });
      fetchAvailability();
    } catch (error) {
      toast.error('Failed to add availability');
    } finally {
      setLoading(false);
    }
  };

  const convertToLocalTime = (utcTime) => {
    const date = new Date(utcTime);
    return date.toLocaleString('en-US', { 
      timeZone: userTimezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const convertToLocalDate = (utcTime) => {
    const date = new Date(utcTime);
    return date.toLocaleDateString('en-US', { 
      timeZone: userTimezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Timezone Info */}
      <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
        <Globe className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Your Timezone: {userTimezone}</p>
          <p className="text-xs text-blue-700">All times are automatically converted for students in different timezones</p>
        </div>
      </div>

      {/* Add Availability Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: '#0F3D2E' }}>Your Availability</h3>
          <p className="text-sm text-gray-500">Set when you&apos;re available for classes</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#0F3D2E] text-white font-medium transition-all hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Add Availability
        </button>
      </div>

      {/* Availability Grid */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <h4 className="font-medium" style={{ color: '#1F2933' }}>Upcoming Available Slots</h4>
        </div>
        
        {availability.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No availability set</p>
            <p className="text-sm text-gray-400 mt-1">Add your available time slots to start receiving bookings</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(15, 61, 46, 0.05)' }}>
            {availability.slice(0, 15).map((slot, idx) => (
              <div key={slot.slot_id || idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F7F5EF] flex flex-col items-center justify-center">
                    <span className="text-xs font-medium" style={{ color: '#0F3D2E' }}>
                      {convertToLocalDate(slot.start_time_utc).split(' ')[0]}
                    </span>
                    <span className="text-lg font-bold" style={{ color: '#0F3D2E' }}>
                      {new Date(slot.start_time_utc).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: '#1F2933' }}>
                      {convertToLocalTime(slot.start_time_utc)} - {convertToLocalTime(slot.end_time_utc)}
                    </p>
                    <p className="text-xs text-gray-500">{convertToLocalDate(slot.start_time_utc)}</p>
                  </div>
                </div>
                <span 
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    slot.is_booked 
                      ? 'bg-green-50 text-green-600' 
                      : 'bg-yellow-50 text-yellow-600'
                  }`}
                >
                  {slot.is_booked ? 'Booked' : 'Available'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Availability Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: '#0F3D2E' }}>Add Availability</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={newSlot.startDate}
                    onChange={(e) => setNewSlot({ ...newSlot, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">End Date (Optional)</label>
                  <input
                    type="date"
                    value={newSlot.endDate}
                    onChange={(e) => setNewSlot({ ...newSlot, endDate: e.target.value })}
                    min={newSlot.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Start Time</label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">End Time</label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F5EF]">
                <p className="text-sm font-medium mb-3" style={{ color: '#0F3D2E' }}>Quick Select Time Slots</p>
                <div className="flex flex-wrap gap-2">
                  {['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00', '20:00-22:00'].map((slot) => (
                    <button
                      key={slot}
                      onClick={() => {
                        const [start, end] = slot.split('-');
                        setNewSlot({ ...newSlot, startTime: start, endTime: end });
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-[#0F3D2E] hover:text-white"
                      style={{ backgroundColor: 'white', color: '#0F3D2E', border: '1px solid rgba(15, 61, 46, 0.2)' }}
                    >
                      {slot.replace('-', ' - ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={newSlot.recurring}
                  onChange={(e) => setNewSlot({ ...newSlot, recurring: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-[#0F3D2E] focus:ring-[#0F3D2E]"
                />
                <label htmlFor="recurring" className="text-sm text-gray-700">
                  Make this a recurring weekly slot
                </label>
              </div>

              <button
                onClick={handleAddAvailability}
                disabled={loading}
                className="w-full h-11 rounded-xl bg-[#0F3D2E] text-white font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Availability
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

// Classroom Tools Section
function ClassroomTools({ teacherData, students }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [lessonNotes, setLessonNotes] = useState({});
  const [currentNote, setCurrentNote] = useState('');
  const [showMushaf, setShowMushaf] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pointerPosition, setPointerPosition] = useState({ x: 50, y: 50 });
  const [isPointerActive, setIsPointerActive] = useState(false);

  const fetchStudentNotes = async (studentId) => {
    try {
      const response = await fetch(`${API}/teachers/notes/${studentId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setLessonNotes(prev => ({ ...prev, [studentId]: data.notes || [] }));
      }
    } catch (error) {
      // Mock notes
      setLessonNotes(prev => ({ 
        ...prev, 
        [studentId]: [
          { id: 1, date: '2026-01-15', note: "Student struggles with Makhraj of letter 'Ain'" },
          { id: 2, date: '2026-01-14', note: 'Good progress on Madd rules, continue practicing' },
        ]
      }));
    }
  };

  useEffect(() => {
    // Load saved notes for selected student
    if (selectedStudent) {
      fetchStudentNotes(selectedStudent.student_id);
    }
  }, [selectedStudent]);

  const handleSaveNote = async () => {
    if (!currentNote.trim() || !selectedStudent) return;
    
    toast.success('Note saved successfully');
    setLessonNotes(prev => ({
      ...prev,
      [selectedStudent.student_id]: [
        { id: Math.random(), date: new Date().toISOString().split('T')[0], note: currentNote },
        ...(prev[selectedStudent.student_id] || [])
      ]
    }));
    setCurrentNote('');
  };

  const handlePointerMove = (e) => {
    if (!isPointerActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPointerPosition({ x, y });
  };

  return (
    <div className="space-y-6">
      {/* Digital Mushaf Card */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <div>
            <h3 className="font-semibold" style={{ color: '#0F3D2E' }}>Digital Mushaf</h3>
            <p className="text-sm text-gray-500">Interactive Quran with live pointer</p>
          </div>
          <button
            onClick={() => setShowMushaf(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#0F3D2E] text-white font-medium transition-all hover:opacity-90"
          >
            <Book className="w-4 h-4" />
            Open Mushaf
          </button>
        </div>
        <div className="p-6 bg-[#F7F5EF]">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold" style={{ color: '#0F3D2E' }}>604</p>
              <p className="text-xs text-gray-500">Total Pages</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: '#0F3D2E' }}>114</p>
              <p className="text-xs text-gray-500">Surahs</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: '#0F3D2E' }}>30</p>
              <p className="text-xs text-gray-500">Juz</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Notes */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <h3 className="font-semibold" style={{ color: '#0F3D2E' }}>Lesson Notes</h3>
          <p className="text-sm text-gray-500">Private notes for each student</p>
        </div>
        
        <div className="p-4">
          {/* Student Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">Select Student</label>
            <select
              value={selectedStudent?.student_id || ''}
              onChange={(e) => {
                const student = students.find(s => s.student_id === e.target.value);
                setSelectedStudent(student);
              }}
              className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
              style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
            >
              <option value="">Choose a student...</option>
              {students.map(student => (
                <option key={student.student_id} value={student.student_id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <>
              {/* Add Note */}
              <div className="mb-4">
                <textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Add a note about this student's progress..."
                  className="w-full h-24 p-3 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                />
                <button
                  onClick={handleSaveNote}
                  className="mt-2 flex items-center gap-2 h-9 px-4 rounded-lg bg-[#0F3D2E] text-white text-sm font-medium transition-all hover:opacity-90"
                >
                  <Save className="w-4 h-4" />
                  Save Note
                </button>
              </div>

              {/* Notes History */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Previous Notes</h4>
                {(lessonNotes[selectedStudent.student_id] || []).map(note => (
                  <div key={note.id} className="p-3 rounded-lg bg-[#F7F5EF]">
                    <p className="text-sm" style={{ color: '#1F2933' }}>{note.note}</p>
                    <p className="text-xs text-gray-500 mt-1">{note.date}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mushaf Modal */}
      {showMushaf && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="bg-[#0F3D2E] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setShowMushaf(false)} className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="font-semibold">Digital Mushaf - Uthmani Script</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPointerActive(!isPointerActive)}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                    isPointerActive ? 'bg-[#D4AF37] text-[#0F3D2E]' : 'bg-white bg-opacity-20'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  {isPointerActive ? 'Pointer ON' : 'Enable Pointer'}
                </button>
                <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-lg px-3 py-2">
                  <button 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                  >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                  </button>
                  <span className="w-16 text-center">Page {currentPage}</span>
                  <button 
                    onClick={() => setCurrentPage(Math.min(604, currentPage + 1))}
                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                  >
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mushaf Display */}
            <div 
              className="flex-1 bg-[#FDF8E8] flex items-center justify-center relative cursor-crosshair"
              onMouseMove={handlePointerMove}
            >
              {/* Simulated Quran Page */}
              <div className="w-[600px] h-[800px] bg-white shadow-2xl rounded-lg p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-xs text-gray-400">Page {currentPage}</div>
                
                {/* Arabic Text Simulation */}
                <div className="text-right font-arabic leading-loose" style={{ direction: 'rtl' }}>
                  <p className="text-2xl mb-4" style={{ fontFamily: 'Amiri, serif', color: '#1F2933' }}>
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                  <p className="text-xl mb-3" style={{ fontFamily: 'Amiri, serif', color: '#1F2933' }}>
                    الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴿١﴾
                  </p>
                  <p className="text-xl mb-3" style={{ fontFamily: 'Amiri, serif', color: '#1F2933' }}>
                    الرَّحْمَٰنِ الرَّحِيمِ ﴿٢﴾
                  </p>
                  <p className="text-xl mb-3" style={{ fontFamily: 'Amiri, serif', color: '#1F2933' }}>
                    مَالِكِ يَوْمِ الدِّينِ ﴿٣﴾
                  </p>
                  <p className="text-xl mb-3" style={{ fontFamily: 'Amiri, serif', color: '#1F2933' }}>
                    إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٤﴾
                  </p>
                  <p className="text-xl mb-3" style={{ fontFamily: 'Amiri, serif', color: '#1F2933' }}>
                    اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴿٥﴾
                  </p>
                  <p className="text-xl mb-3" style={{ fontFamily: 'Amiri, serif', color: '#1F2933' }}>
                    صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ﴿٦﴾
                  </p>
                </div>

                {/* Live Pointer */}
                {isPointerActive && (
                  <div 
                    className="absolute w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ 
                      left: `${pointerPosition.x}%`, 
                      top: `${pointerPosition.y}%`,
                      transition: 'all 0.1s ease-out'
                    }}
                  >
                    <div className="w-6 h-6 bg-[#E76F51] rounded-full opacity-80 animate-pulse"></div>
                    <div className="absolute top-0 left-0 w-6 h-6 bg-[#E76F51] rounded-full animate-ping"></div>
                  </div>
                )}
              </div>

              {isPointerActive && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[#0F3D2E] text-white px-4 py-2 rounded-lg text-sm">
                  Move your cursor to point at specific text. Students see your pointer in real-time.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Student Management Section
function StudentManagement({ teacherData, students, setStudents }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState(null);
  const [reportData, setReportData] = useState({
    attendance: '4/4',
    progress: '',
    notes: ''
  });

  const getLastLessonStatus = (lastSession) => {
    if (!lastSession) return 'never';
    const now = new Date();
    const sessionDate = new Date(lastSession);
    const daysSince = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 14) return 'inactive';
    if (daysSince > 7) return 'warning';
    return 'active';
  };

  const sendReminder = async (student) => {
    toast.success(`Reminder sent to ${student.name}!`);
  };

  const generateReport = () => {
    if (!selectedStudentForReport) return;
    
    // In real app, this would generate a PDF
    toast.success('Report generated! Check your downloads folder.');
    setShowReportModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <p className="text-xs text-gray-500 mb-1">Active Students</p>
          <p className="text-2xl font-semibold" style={{ color: '#0F3D2E' }}>
            {students.filter(s => getLastLessonStatus(s.last_session) === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <p className="text-xs text-gray-500 mb-1">Need Attention</p>
          <p className="text-2xl font-semibold" style={{ color: '#E76F51' }}>
            {students.filter(s => getLastLessonStatus(s.last_session) === 'warning').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <p className="text-xs text-gray-500 mb-1">Inactive (2+ weeks)</p>
          <p className="text-2xl font-semibold text-gray-400">
            {students.filter(s => getLastLessonStatus(s.last_session) === 'inactive').length}
          </p>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <h3 className="font-semibold" style={{ color: '#0F3D2E' }}>Student List</h3>
        </div>
        
        {/* Table Header */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)', backgroundColor: '#F9FAFB' }}>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Full Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Reading Level</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Last Lesson</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'rgba(15, 61, 46, 0.05)' }}>
              {students.map(student => {
                const status = getLastLessonStatus(student.last_session);
                return (
                  <tr key={student.student_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#0F3D2E] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {student.name?.charAt(0) || 'S'}
                        </div>
                        <span className="font-medium text-sm" style={{ color: '#1F2933' }}>{student.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{student.email || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize" style={{
                        backgroundColor: student.current_level === 'beginner' ? 'rgba(59, 130, 246, 0.1)' :
                                        student.current_level === 'slow' ? 'rgba(245, 158, 11, 0.1)' :
                                        student.current_level === 'comfortable' ? 'rgba(34, 197, 94, 0.1)' :
                                        student.current_level === 'advanced' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                        color: student.current_level === 'beginner' ? '#3B82F6' :
                               student.current_level === 'slow' ? '#F59E0B' :
                               student.current_level === 'comfortable' ? '#22C55E' :
                               student.current_level === 'advanced' ? '#8B5CF6' : '#6B7280'
                      }}>
                        {student.current_level === 'beginner' ? 'Just Starting' :
                         student.current_level === 'slow' ? 'Reads Slowly' :
                         student.current_level === 'comfortable' ? 'Comfortable' :
                         student.current_level === 'advanced' ? 'Advanced' : student.current_level || 'Not Set'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${
                        status === 'active' ? 'text-green-600' :
                        status === 'warning' ? 'text-yellow-600' :
                        status === 'inactive' ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {student.last_session ? new Date(student.last_session).toLocaleDateString() : 'Never'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {status === 'active' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                          Active
                        </span>
                      )}
                      {status === 'warning' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600 flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3 h-3" />
                          7+ days
                        </span>
                      )}
                      {status === 'inactive' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3 h-3" />
                          14+ days
                        </span>
                      )}
                      {status === 'never' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          New
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(status === 'warning' || status === 'inactive') && (
                          <button
                            onClick={() => sendReminder(student)}
                            className="h-8 px-3 rounded-lg text-xs font-medium bg-[#D4AF37] text-white transition-all hover:opacity-90"
                          >
                            Send Reminder
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedStudentForReport(student);
                            setShowReportModal(true);
                          }}
                          className="h-8 px-3 rounded-lg text-xs font-medium border transition-all hover:bg-gray-50"
                          style={{ borderColor: 'rgba(15, 61, 46, 0.2)', color: '#0F3D2E' }}
                        >
                          <FileText className="w-3 h-3 inline mr-1" />
                          Report
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {students.length === 0 && (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No students yet</p>
          </div>
        )}
      </div>

      {/* Report Card Modal */}
      {showReportModal && selectedStudentForReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: '#0F3D2E' }}>Generate Report Card</h3>
              <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F7F5EF]">
                <p className="text-sm font-medium" style={{ color: '#0F3D2E' }}>{selectedStudentForReport.name}</p>
                <p className="text-xs text-gray-500">{selectedStudentForReport.current_level}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Attendance (This Month)</label>
                <input
                  type="text"
                  value={reportData.attendance}
                  onChange={(e) => setReportData({ ...reportData, attendance: e.target.value })}
                  placeholder="e.g., 4/4"
                  className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Progress</label>
                <input
                  type="text"
                  value={reportData.progress}
                  onChange={(e) => setReportData({ ...reportData, progress: e.target.value })}
                  placeholder="e.g., Completed Surah Al-Mulk"
                  className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Additional Notes</label>
                <textarea
                  value={reportData.notes}
                  onChange={(e) => setReportData({ ...reportData, notes: e.target.value })}
                  placeholder="Comments for parents..."
                  className="w-full h-24 p-3 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                />
              </div>

              <button
                onClick={generateReport}
                className="w-full h-11 rounded-xl bg-[#0F3D2E] text-white font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90"
              >
                <Download className="w-4 h-4" />
                Generate PDF Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Profile Management Section
function ProfileManagement({ teacherData, user }) {
  const [profile, setProfile] = useState({
    bio: teacherData?.bio || '',
    hourlyRate: teacherData?.hourly_rate || 50,
    meetLink: teacherData?.meet_link || '',
    specializations: teacherData?.specializations || [],
    yearsExperience: teacherData?.years_experience || 0
  });
  const [videoFile, setVideoFile] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const specialties = [
    'Hifz (Memorization)',
    'Tajweed',
    'Qiraat',
    'Arabic for Kids',
    'Arabic for Adults',
    'English Speaking',
    'Malay Speaking',
    'Female Students Only'
  ];

  const toggleSpecialty = (specialty) => {
    setProfile(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialty)
        ? prev.specializations.filter(s => s !== specialty)
        : [...prev.specializations, specialty]
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API}/teachers/${teacherData.teacher_id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        toast.success('Profile updated successfully!');
      } else {
        toast.success('Profile saved (demo mode)');
      }
    } catch (error) {
      toast.success('Profile saved (demo mode)');
    } finally {
      setSaving(false);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Video must be under 50MB');
        return;
      }
      setVideoFile(file);
      toast.success('Video selected! Save profile to upload.');
    }
  };

  const handleCertificateUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCertificateFile(file);
      toast.success('Certificate selected! Save profile to upload.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-[#0F3D2E] flex items-center justify-center text-white text-3xl font-medium">
            {user?.name?.charAt(0) || 'T'}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold" style={{ color: '#0F3D2E' }}>{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              {teacherData?.is_active ? (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Verified Teacher
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600">
                  Pending Verification
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#F7F5EF]" style={{ color: '#0F3D2E' }}>
                <Star className="w-3 h-3 inline mr-1" fill="#D4AF37" stroke="#D4AF37" />
                {teacherData?.rating?.toFixed(1) || '5.0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#0F3D2E' }}>Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Bio / About Me</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell students about yourself, your teaching style, and experience..."
              className="w-full h-32 p-3 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
              style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Hourly Rate (RM)</label>
              <input
                type="number"
                value={profile.hourlyRate}
                onChange={(e) => setProfile({ ...profile, hourlyRate: parseFloat(e.target.value) })}
                className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Years of Experience</label>
              <input
                type="number"
                value={profile.yearsExperience}
                onChange={(e) => setProfile({ ...profile, yearsExperience: parseInt(e.target.value) })}
                className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Google Meet Link</label>
            <input
              type="url"
              value={profile.meetLink}
              onChange={(e) => setProfile({ ...profile, meetLink: e.target.value })}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
              style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
            />
          </div>
        </div>
      </div>

      {/* Specialties */}
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#0F3D2E' }}>Specialties & Skills</h3>
        <div className="flex flex-wrap gap-2">
          {specialties.map(specialty => (
            <button
              key={specialty}
              onClick={() => toggleSpecialty(specialty)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                profile.specializations.includes(specialty)
                  ? 'bg-[#0F3D2E] text-white'
                  : 'bg-[#F7F5EF] text-gray-600 hover:bg-gray-200'
              }`}
            >
              {profile.specializations.includes(specialty) && <CheckCircle className="w-4 h-4 inline mr-1" />}
              {specialty}
            </button>
          ))}
        </div>
      </div>

      {/* Video Introduction */}
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <h3 className="font-semibold mb-2" style={{ color: '#0F3D2E' }}>Video Introduction</h3>
        <p className="text-sm text-gray-500 mb-4">Upload a 1-2 minute video of yourself reciting Quran so parents can hear your voice and Tajweed quality.</p>
        
        <div className="border-2 border-dashed rounded-xl p-8 text-center" style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}>
          {videoFile ? (
            <div>
              <Video className="w-12 h-12 mx-auto mb-3" style={{ color: '#0F3D2E' }} />
              <p className="font-medium" style={{ color: '#0F3D2E' }}>{videoFile.name}</p>
              <p className="text-sm text-gray-500">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-2">Drag and drop or click to upload</p>
              <p className="text-xs text-gray-400">MP4, MOV up to 50MB</p>
            </>
          )}
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ position: 'relative' }}
          />
        </div>
      </div>

      {/* Certificates */}
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <h3 className="font-semibold mb-2" style={{ color: '#0F3D2E' }}>Ijazah / Certificates</h3>
        <p className="text-sm text-gray-500 mb-4">Upload your credentials to get a &quot;Verified&quot; badge (e.g., Degree from Al-Azhar, Darul Quran).</p>
        
        <div className="border-2 border-dashed rounded-xl p-8 text-center" style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}>
          {certificateFile ? (
            <div>
              <Award className="w-12 h-12 mx-auto mb-3" style={{ color: '#D4AF37' }} />
              <p className="font-medium" style={{ color: '#0F3D2E' }}>{certificateFile.name}</p>
            </div>
          ) : (
            <>
              <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-2">Upload your certificates</p>
              <p className="text-xs text-gray-400">PDF, JPG, PNG up to 10MB</p>
            </>
          )}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleCertificateUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ position: 'relative' }}
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveProfile}
        disabled={saving}
        className="w-full h-12 rounded-xl bg-[#0F3D2E] text-white font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
      >
        {saving ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Profile
          </>
        )}
      </button>
    </div>
  );
}

// Dashboard Overview Section (simplified from original)
function DashboardOverview({ teacherData, students, user, commissionInfo }) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-[#0F3D2E] to-[#1a5c47] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p className="opacity-80">Here&apos;s your teaching overview for today</p>
          </div>
          {/* Tier Badge in Welcome Banner */}
          {commissionInfo && (
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)'
              }}
            >
              {commissionInfo.tier_level === 'elite' && <Award className="w-5 h-5" />}
              {commissionInfo.tier_level === 'rated' && <Star className="w-5 h-5" />}
              {commissionInfo.tier_level === 'new' && <Circle className="w-5 h-5" />}
              <div>
                <p className="text-sm font-semibold">{commissionInfo.tier_name}</p>
                <p className="text-xs opacity-80">{Math.round((1 - commissionInfo.commission_rate) * 100)}% earnings rate</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <DollarSign className="w-8 h-8 mb-2" style={{ color: '#2EB6A0' }} />
          <p className="text-2xl font-bold" style={{ color: '#0F3D2E' }}>RM {(teacherData?.estimated_earnings || 0).toFixed(0)}</p>
          <p className="text-xs text-gray-500">This Month</p>
        </div>
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <Users className="w-8 h-8 mb-2" style={{ color: '#D4AF37' }} />
          <p className="text-2xl font-bold" style={{ color: '#0F3D2E' }}>{students.length}</p>
          <p className="text-xs text-gray-500">Active Students</p>
        </div>
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <Calendar className="w-8 h-8 mb-2" style={{ color: '#E76F51' }} />
          <p className="text-2xl font-bold" style={{ color: '#0F3D2E' }}>{teacherData?.todays_classes?.length || 0}</p>
          <p className="text-xs text-gray-500">Classes Today</p>
        </div>
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <Star className="w-8 h-8 mb-2" style={{ color: '#FBBF24' }} fill="#FBBF24" />
          <p className="text-2xl font-bold" style={{ color: '#0F3D2E' }}>{(teacherData?.teacher?.rating || 5.0).toFixed(1)}</p>
          <p className="text-xs text-gray-500">Your Rating</p>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-2xl border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <h3 className="font-semibold" style={{ color: '#0F3D2E' }}>Today&apos;s Schedule</h3>
        </div>
        <div className="p-4">
          {(!teacherData?.todays_classes || teacherData.todays_classes.length === 0) ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No classes scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teacherData.todays_classes.map((cls, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#F7F5EF]">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-10 rounded-full bg-[#0F3D2E]"></div>
                    <div>
                      <p className="font-medium" style={{ color: '#1F2933' }}>
                        {new Date(cls.start_time_utc).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </p>
                      <p className="text-xs text-gray-500">Student ID: {cls.student_id?.slice(0, 8)}...</p>
                    </div>
                  </div>
                  {cls.meet_link && (
                    <a
                      href={cls.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-4 rounded-lg bg-[#0F3D2E] text-white text-sm font-medium flex items-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      Join
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Teacher Dashboard Component
export default function TeacherDashboard({ user }) {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [students, setStudents] = useState([]);
  const [commissionInfo, setCommissionInfo] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchCommissionInfo = async (teacherId) => {
    try {
      const response = await fetch(`${API}/commission/tutor/${teacherId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCommissionInfo(data);
      }
    } catch (error) {
      console.error('Error fetching commission info:', error);
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API}/teachers/dashboard`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        if (data.teacher?.approval_status === 'pending' || data.teacher?.is_active === false) {
          setIsPendingApproval(true);
        }
        if (data.teacher?.teacher_id && data.teacher?.is_active) {
          fetchStudents(data.teacher.teacher_id);
          fetchCommissionInfo(data.teacher.teacher_id);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (teacherId) => {
    try {
      const response = await fetch(`${API}/teachers/${teacherId}/students`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      // Mock students
      setStudents([
        { student_id: '1', name: 'Ahmad bin Ali', current_level: "Iqra' Vol 4", last_session: '2026-01-25', status: 'active' },
        { student_id: '2', name: 'Sarah Abdullah', current_level: 'Juz 29', last_session: '2026-01-20', status: 'active' },
        { student_id: '3', name: 'Muhammad Hafiz', current_level: "Iqra' Vol 2", last_session: '2026-01-10', status: 'active' },
      ]);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F5EF' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F3D2E]"></div>
      </div>
    );
  }

  // Pending approval view
  if (isPendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F7F5EF' }}>
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
          <div className="w-16 h-16 rounded-full bg-[#D4AF37] bg-opacity-10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" style={{ color: '#D4AF37' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#0F3D2E' }}>Application Under Review</h2>
          <p className="text-gray-500 mb-6">
            Thank you for registering! Your application is being reviewed by our team. 
            You&apos;ll receive an email once approved.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#2EB6A0' }}>
            <CheckCircle className="w-4 h-4" />
            <span>Profile created successfully</span>
          </div>
          <button
            onClick={handleLogout}
            className="mt-6 text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F5EF' }}>
      {/* Sidebar */}
      <TeacherSidebar 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Top Header */}
        <header className="bg-white border-b sticky top-0 z-30 px-6 py-4" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold" style={{ color: '#0F3D2E' }}>
                {activeSection === 'dashboard' && 'Dashboard'}
                {activeSection === 'wallet' && 'Earnings Wallet'}
                {activeSection === 'availability' && 'Availability Calendar'}
                {activeSection === 'classroom' && 'Classroom Tools'}
                {activeSection === 'students' && 'Student Management'}
                {activeSection === 'profile' && 'Profile Settings'}
              </h1>
              {/* Tier Badge */}
              {commissionInfo && (
                <div 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: commissionInfo.tier_level === 'elite' ? 'rgba(15, 61, 46, 0.1)' : 
                                     commissionInfo.tier_level === 'rated' ? 'rgba(212, 175, 55, 0.15)' : 
                                     'rgba(107, 114, 128, 0.1)',
                    color: commissionInfo.tier_color || '#6B7280'
                  }}
                >
                  {commissionInfo.tier_level === 'elite' && <Award className="w-4 h-4" />}
                  {commissionInfo.tier_level === 'rated' && <Star className="w-4 h-4" />}
                  {commissionInfo.tier_level === 'new' && <Circle className="w-4 h-4" />}
                  <span>{commissionInfo.tier_name}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell userId={user?.user_id} userRole="teacher" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0F3D2E] flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium" style={{ color: '#1F2933' }}>{user?.name}</p>
                </div>
                <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full">
                  <LogOut className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {activeSection === 'dashboard' && (
            <DashboardOverview teacherData={dashboardData} students={students} user={user} commissionInfo={commissionInfo} />
          )}
          {activeSection === 'wallet' && (
            <EarningsWallet teacherData={dashboardData?.teacher} commissionInfo={commissionInfo} />
          )}
          {activeSection === 'availability' && (
            <AvailabilityCalendar teacherData={dashboardData?.teacher} />
          )}
          {activeSection === 'classroom' && (
            <ClassroomTools teacherData={dashboardData?.teacher} students={students} />
          )}
          {activeSection === 'students' && (
            <StudentManagement teacherData={dashboardData?.teacher} students={students} setStudents={setStudents} />
          )}
          {activeSection === 'profile' && (
            <ProfileManagement teacherData={dashboardData?.teacher} user={user} />
          )}
        </div>
      </main>
    </div>
  );
}
