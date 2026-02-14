import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Users, Clock, CheckCircle, XCircle, AlertCircle,
  Search, RefreshCw, Eye, ChevronDown, ChevronUp, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function WithdrawalManagement() {
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [allWithdrawals, setAllWithdrawals] = useState([]);
  const [commissionStats, setCommissionStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllWithdrawals, setShowAllWithdrawals] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pending withdrawals
      const pendingRes = await fetch(`${API}/tutor-earnings/admin/pending-withdrawals`, {
        credentials: 'include'
      });
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingWithdrawals(data.pending_withdrawals || []);
      }

      // Fetch commission stats
      const statsRes = await fetch(`${API}/tutor-earnings/admin/commission-earned`, {
        credentials: 'include'
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setCommissionStats(data);
      }

      // Fetch all withdrawals
      const allRes = await fetch(`${API}/tutor-earnings/admin/all-withdrawals?limit=50${statusFilter ? `&status=${statusFilter}` : ''}`, {
        credentials: 'include'
      });
      if (allRes.ok) {
        const data = await allRes.json();
        setAllWithdrawals(data.withdrawals || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load withdrawal data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId) => {
    setProcessingId(withdrawalId);
    try {
      // Get admin user_id from localStorage
      const userStr = localStorage.getItem('user');
      const adminUserId = userStr ? JSON.parse(userStr)?.user_id : 'admin';

      const response = await fetch(
        `${API}/tutor-earnings/admin/withdrawals/${withdrawalId}/process?admin_user_id=${adminUserId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            status: 'approved',
            admin_notes: adminNotes || null
          })
        }
      );

      if (response.ok) {
        toast.success('Withdrawal approved and marked as paid');
        fetchData();
        setAdminNotes('');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to approve withdrawal');
      }
    } catch (error) {
      toast.error('Failed to approve withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessingId(selectedWithdrawal.withdrawal_id);
    try {
      const userStr = localStorage.getItem('user');
      const adminUserId = userStr ? JSON.parse(userStr)?.user_id : 'admin';

      const response = await fetch(
        `${API}/tutor-earnings/admin/withdrawals/${selectedWithdrawal.withdrawal_id}/process?admin_user_id=${adminUserId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            status: 'rejected',
            rejection_reason: rejectReason,
            admin_notes: adminNotes || null
          })
        }
      );

      if (response.ok) {
        toast.success('Withdrawal rejected, funds returned to tutor balance');
        fetchData();
        setShowRejectModal(false);
        setRejectReason('');
        setAdminNotes('');
        setSelectedWithdrawal(null);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to reject withdrawal');
      }
    } catch (error) {
      toast.error('Failed to reject withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Paid</span>;
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600 flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>;
      case 'processing':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" />Processing</span>;
      case 'rejected':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600">{status}</span>;
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
      {/* Commission Stats Cards */}
      {commissionStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(46, 182, 160, 0.1)' }}>
                <TrendingUp className="w-5 h-5" style={{ color: '#2EB6A0' }} />
              </div>
              <p className="text-sm text-gray-500">Total Commission Earned</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#2EB6A0' }}>
              RM {(commissionStats.commission_earned?.total_platform_commission || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">From {commissionStats.commission_earned?.total_sessions_completed || 0} sessions</p>
          </div>

          <div className="bg-white rounded-xl p-5 border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(231, 111, 81, 0.1)' }}>
                <DollarSign className="w-5 h-5" style={{ color: '#E76F51' }} />
              </div>
              <p className="text-sm text-gray-500">Outstanding Tutor Balance</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#E76F51' }}>
              RM {(commissionStats.withdrawals?.outstanding_tutor_balance || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">Owed to tutors</p>
          </div>

          <div className="bg-white rounded-xl p-5 border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}>
                <Clock className="w-5 h-5" style={{ color: '#D4AF37' }} />
              </div>
              <p className="text-sm text-gray-500">Pending Withdrawals</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#D4AF37' }}>
              {commissionStats.withdrawals?.pending_withdrawal_count || 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">RM {(commissionStats.withdrawals?.pending_withdrawal_amount || 0).toLocaleString()} total</p>
          </div>

          <div className="bg-white rounded-xl p-5 border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(15, 61, 46, 0.1)' }}>
                <CheckCircle className="w-5 h-5" style={{ color: '#0F3D2E' }} />
              </div>
              <p className="text-sm text-gray-500">Total Withdrawn</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#0F3D2E' }}>
              RM {(commissionStats.withdrawals?.total_withdrawn || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">{commissionStats.withdrawals?.total_withdrawal_count || 0} withdrawals completed</p>
          </div>
        </div>
      )}

      {/* Pending Withdrawals Section */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5" style={{ color: '#D4AF37' }} />
            <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>
              Pending Withdrawal Requests
            </h3>
            {pendingWithdrawals.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                {pendingWithdrawals.length} pending
              </span>
            )}
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
            style={{ color: '#0F3D2E' }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {pendingWithdrawals.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
            <p className="text-gray-500">No pending withdrawal requests</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(15, 61, 46, 0.05)' }}>
            {pendingWithdrawals.map((wd) => (
              <div key={wd.withdrawal_id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0F3D2E] flex items-center justify-center text-white font-medium">
                      {wd.teacher_info?.name?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: '#1D1D1F' }}>{wd.teacher_info?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{wd.teacher_info?.email} • {wd.teacher_info?.tier_level} tier</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold" style={{ color: '#E76F51' }}>RM {wd.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{new Date(wd.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-500 mb-1">Bank Details</p>
                  <p className="text-sm font-medium" style={{ color: '#1D1D1F' }}>
                    {wd.bank_name} - {wd.account_number}
                  </p>
                  <p className="text-sm text-gray-600">{wd.account_holder_name}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(wd.withdrawal_id)}
                    disabled={processingId === wd.withdrawal_id}
                    className="flex-1 h-10 rounded-lg bg-[#2EB6A0] text-white font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                    data-testid={`approve-withdrawal-${wd.withdrawal_id}`}
                  >
                    {processingId === wd.withdrawal_id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Approve & Mark Paid
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedWithdrawal(wd);
                      setShowRejectModal(true);
                    }}
                    disabled={processingId === wd.withdrawal_id}
                    className="flex-1 h-10 rounded-lg border font-medium flex items-center justify-center gap-2 transition-all hover:bg-red-50"
                    style={{ borderColor: '#E76F51', color: '#E76F51' }}
                    data-testid={`reject-withdrawal-${wd.withdrawal_id}`}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Withdrawals History */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
        <div 
          className="p-4 border-b flex items-center justify-between cursor-pointer"
          style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}
          onClick={() => setShowAllWithdrawals(!showAllWithdrawals)}
        >
          <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>
            Withdrawal History
          </h3>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setTimeout(fetchData, 100);
              }}
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1.5 rounded-lg border text-sm"
              style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            {showAllWithdrawals ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>

        {showAllWithdrawals && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)', backgroundColor: '#F9FAFB' }}>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tutor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Bank</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(15, 61, 46, 0.05)' }}>
                {allWithdrawals.map((wd) => (
                  <tr key={wd.withdrawal_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm" style={{ color: '#1D1D1F' }}>{wd.teacher_info?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{wd.teacher_info?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: '#0F3D2E' }}>RM {wd.amount.toFixed(2)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm" style={{ color: '#1D1D1F' }}>{wd.bank_name}</p>
                      <p className="text-xs text-gray-500">****{wd.account_number?.slice(-4)}</p>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(wd.status)}
                      {wd.rejection_reason && (
                        <p className="text-xs text-red-500 mt-1">{wd.rejection_reason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">{new Date(wd.created_at).toLocaleDateString()}</p>
                      {wd.processed_at && (
                        <p className="text-xs text-gray-400">Processed: {new Date(wd.processed_at).toLocaleDateString()}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allWithdrawals.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-gray-500">No withdrawal records found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: '#0F3D2E' }}>Reject Withdrawal</h3>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium" style={{ color: '#1D1D1F' }}>
                {selectedWithdrawal.teacher_info?.name}
              </p>
              <p className="text-lg font-bold" style={{ color: '#E76F51' }}>
                RM {selectedWithdrawal.amount.toFixed(2)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">Rejection Reason *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full h-24 p-3 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-[#E76F51]"
                style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                data-testid="reject-reason-input"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">Admin Notes (Optional)</label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes..."
                className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setAdminNotes('');
                  setSelectedWithdrawal(null);
                }}
                className="flex-1 h-11 rounded-lg border font-medium transition-all hover:bg-gray-50"
                style={{ borderColor: 'rgba(15, 61, 46, 0.2)', color: '#5A5A5A' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === selectedWithdrawal.withdrawal_id}
                className="flex-1 h-11 rounded-lg bg-[#E76F51] text-white font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                data-testid="confirm-reject-btn"
              >
                {processingId === selectedWithdrawal.withdrawal_id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Reject & Return Funds
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
