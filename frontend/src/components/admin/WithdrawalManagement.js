import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../Card';
import Spinner from '../Spinner';

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

  useEffect(() => { fetchData(); }, []);

  // #2: 15-second auto-refresh polling
  useEffect(() => {
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, statsRes, allRes] = await Promise.all([
        fetch(`${API}/tutor-earnings/admin/pending-withdrawals`, { credentials: 'include' }),
        fetch(`${API}/tutor-earnings/admin/commission-earned`, { credentials: 'include' }),
        fetch(`${API}/tutor-earnings/admin/all-withdrawals?limit=50${statusFilter ? `&status=${statusFilter}` : ''}`, { credentials: 'include' }),
      ]);
      if (pendingRes.ok) { const d = await pendingRes.json(); setPendingWithdrawals(d.pending_withdrawals || []); }
      if (statsRes.ok) setCommissionStats(await statsRes.json());
      if (allRes.ok) { const d = await allRes.json(); setAllWithdrawals(d.withdrawals || []); }
    } catch (e) { console.error(e); toast.error('Failed to load data'); } finally { setLoading(false); }
  };

  const handleApprove = async (withdrawalId) => {
    setProcessingId(withdrawalId);
    try {
      const userStr = localStorage.getItem('user');
      const adminUserId = userStr ? JSON.parse(userStr)?.user_id : 'admin';
      const r = await fetch(`${API}/tutor-earnings/admin/withdrawals/${withdrawalId}/process?admin_user_id=${adminUserId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status: 'approved', admin_notes: adminNotes || null }) });
      if (r.ok) { toast.success('Withdrawal approved'); fetchData(); setAdminNotes(''); } else { const e = await r.json(); toast.error(e.detail || 'Failed'); }
    } catch { toast.error('Failed'); } finally { setProcessingId(null); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Please provide a reason'); return; }
    setProcessingId(selectedWithdrawal.withdrawal_id);
    try {
      const userStr = localStorage.getItem('user');
      const adminUserId = userStr ? JSON.parse(userStr)?.user_id : 'admin';
      const r = await fetch(`${API}/tutor-earnings/admin/withdrawals/${selectedWithdrawal.withdrawal_id}/process?admin_user_id=${adminUserId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status: 'rejected', rejection_reason: rejectReason, admin_notes: adminNotes || null }) });
      if (r.ok) { toast.success('Rejected, funds returned'); fetchData(); setShowRejectModal(false); setRejectReason(''); setAdminNotes(''); setSelectedWithdrawal(null); } else { const e = await r.json(); toast.error(e.detail || 'Failed'); }
    } catch { toast.error('Failed'); } finally { setProcessingId(null); }
  };

  const getStatusBadge = (s) => {
    const map = { completed: { cls: 'bg-success/10 text-success', icon: CheckCircle, label: 'Paid' }, pending: { cls: 'bg-warning/10 text-warning', icon: Clock, label: 'Pending' }, processing: { cls: 'bg-info/10 text-info', icon: RefreshCw, label: 'Processing' }, rejected: { cls: 'bg-danger/10 text-danger', icon: XCircle, label: 'Rejected' } };
    const conf = map[s] || { cls: 'bg-surface-subtle text-ink-secondary', icon: Clock, label: s };
    return <span className={`px-2 py-1 rounded-full text-caption font-medium flex items-center gap-1 ${conf.cls}`}><conf.icon className={`w-3 h-3 ${s === 'processing' ? 'animate-spin' : ''}`} />{conf.label}</span>;
  };

  const inputCls = 'h-12 w-full rounded-md border border-ink-faint/40 bg-surface-card px-4 text-body focus:outline-none focus:ring-2 focus:ring-brand/15 transition-all';

  if (loading) return <div className="flex items-center justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6">
      {commissionStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: TrendingUp, color: 'text-teal', bg: 'bg-teal/10', label: 'Total Commission', value: `RM ${(commissionStats.commission_earned?.total_platform_commission || 0).toLocaleString()}`, sub: `From ${commissionStats.commission_earned?.total_sessions_completed || 0} sessions` },
            { icon: DollarSign, color: 'text-coral', bg: 'bg-coral/10', label: 'Outstanding Tutor Balance', value: `RM ${(commissionStats.withdrawals?.outstanding_tutor_balance || 0).toLocaleString()}`, sub: 'Owed to tutors' },
            { icon: Clock, color: 'text-gold-dark', bg: 'bg-gold/10', label: 'Pending Withdrawals', value: commissionStats.withdrawals?.pending_withdrawal_count || 0, sub: `RM ${(commissionStats.withdrawals?.pending_withdrawal_amount || 0).toLocaleString()} total` },
            { icon: CheckCircle, color: 'text-brand', bg: 'bg-brand/10', label: 'Total Withdrawn', value: `RM ${(commissionStats.withdrawals?.total_withdrawn || 0).toLocaleString()}`, sub: `${commissionStats.withdrawals?.total_withdrawal_count || 0} completed` },
          ].map((s, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center gap-3 mb-2"><div className={`w-10 h-10 rounded-md flex items-center justify-center ${s.bg}`}><s.icon className={`w-5 h-5 ${s.color}`} /></div><p className="text-small text-ink-secondary">{s.label}</p></div>
              <p className={`text-h2 font-bold ${s.color}`}>{s.value}</p>
              <p className="text-caption text-ink-tertiary mt-1">{s.sub}</p>
            </Card>
          ))}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-subtle flex items-center justify-between">
          <div className="flex items-center gap-3"><AlertCircle className="w-5 h-5 text-gold-dark" /><h3 className="text-h3 text-ink">Pending Withdrawal Requests</h3>{pendingWithdrawals.length > 0 && <span className="px-2 py-0.5 rounded-full text-caption font-medium bg-warning/10 text-warning">{pendingWithdrawals.length} pending</span>}</div>
          <button onClick={fetchData} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-small font-medium hover:bg-surface-subtle transition-all text-brand"><RefreshCw className="w-4 h-4" />Refresh</button>
        </div>
        {pendingWithdrawals.length === 0 ? (
          <div className="p-8 text-center"><CheckCircle className="w-12 h-12 mx-auto mb-3 text-ink-faint" /><p className="text-ink-secondary">No pending withdrawal requests</p></div>
        ) : (
          <div className="divide-y divide-surface-subtle">
            {pendingWithdrawals.map((wd) => (
              <div key={wd.withdrawal_id} className="p-4 hover:bg-surface-subtle/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-white font-medium">{wd.teacher_info?.name?.charAt(0) || 'T'}</div>
                    <div><p className="font-medium text-ink">{wd.teacher_info?.name || 'Unknown'}</p><p className="text-caption text-ink-secondary">{wd.teacher_info?.email} &middot; {wd.teacher_info?.tier_level} tier</p></div>
                  </div>
                  <div className="text-right"><p className="text-xl font-bold text-coral">RM {wd.amount.toFixed(2)}</p><p className="text-caption text-ink-tertiary">{new Date(wd.created_at).toLocaleString()}</p></div>
                </div>
                <div className="bg-surface-subtle rounded-md p-3 mb-3"><p className="text-caption text-ink-tertiary mb-1">Bank Details</p><p className="text-small font-medium text-ink">{wd.bank_name} - {wd.account_number}</p><p className="text-small text-ink-secondary">{wd.account_holder_name}</p></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleApprove(wd.withdrawal_id)} disabled={processingId === wd.withdrawal_id} data-testid={`approve-withdrawal-${wd.withdrawal_id}`}
                    className="flex-1 h-10 rounded-md bg-teal text-white font-medium flex items-center justify-center gap-2 transition-all hover:bg-teal/90 disabled:opacity-50">
                    {processingId === wd.withdrawal_id ? <Spinner size="sm" className="border-white border-t-transparent" /> : <><CheckCircle className="w-4 h-4" />Approve & Mark Paid</>}
                  </button>
                  <button onClick={() => { setSelectedWithdrawal(wd); setShowRejectModal(true); }} disabled={processingId === wd.withdrawal_id} data-testid={`reject-withdrawal-${wd.withdrawal_id}`}
                    className="flex-1 h-10 rounded-md border border-coral text-coral font-medium flex items-center justify-center gap-2 transition-all hover:bg-coral/5"><XCircle className="w-4 h-4" />Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-subtle flex items-center justify-between cursor-pointer" onClick={() => setShowAllWithdrawals(!showAllWithdrawals)}>
          <h3 className="text-h3 text-ink">Withdrawal History</h3>
          <div className="flex items-center gap-3">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setTimeout(fetchData, 100); }} onClick={e => e.stopPropagation()} className="px-3 py-1.5 rounded-md border border-ink-faint/40 text-small text-ink focus:outline-none"><option value="">All Status</option><option value="pending">Pending</option><option value="completed">Completed</option><option value="rejected">Rejected</option></select>
            {showAllWithdrawals ? <ChevronUp className="w-5 h-5 text-ink-secondary" /> : <ChevronDown className="w-5 h-5 text-ink-secondary" />}
          </div>
        </div>
        {showAllWithdrawals && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-surface-subtle bg-surface-subtle"><th className="text-left px-6 py-3 text-caption font-medium text-ink-tertiary uppercase tracking-wider">Tutor</th><th className="text-left px-6 py-3 text-caption font-medium text-ink-tertiary uppercase tracking-wider">Amount</th><th className="text-left px-6 py-3 text-caption font-medium text-ink-tertiary uppercase tracking-wider">Bank</th><th className="text-left px-6 py-3 text-caption font-medium text-ink-tertiary uppercase tracking-wider">Status</th><th className="text-left px-6 py-3 text-caption font-medium text-ink-tertiary uppercase tracking-wider">Date</th></tr></thead>
              <tbody className="divide-y divide-surface-subtle">
                {allWithdrawals.map((wd) => (
                  <tr key={wd.withdrawal_id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="px-6 py-3"><p className="font-medium text-small text-ink">{wd.teacher_info?.name || 'Unknown'}</p><p className="text-caption text-ink-tertiary">{wd.teacher_info?.email}</p></td>
                    <td className="px-6 py-3"><p className="font-semibold text-brand">RM {wd.amount.toFixed(2)}</p></td>
                    <td className="px-6 py-3"><p className="text-small text-ink">{wd.bank_name}</p><p className="text-caption text-ink-tertiary">****{wd.account_number?.slice(-4)}</p></td>
                    <td className="px-6 py-3">{getStatusBadge(wd.status)}{wd.rejection_reason && <p className="text-caption text-danger mt-1">{wd.rejection_reason}</p>}</td>
                    <td className="px-6 py-3"><p className="text-small text-ink-secondary">{new Date(wd.created_at).toLocaleDateString()}</p>{wd.processed_at && <p className="text-caption text-ink-tertiary">Processed: {new Date(wd.processed_at).toLocaleDateString()}</p>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allWithdrawals.length === 0 && <div className="p-8 text-center"><p className="text-ink-secondary">No records found</p></div>}
          </div>
        )}
      </Card>

      {showRejectModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => { setShowRejectModal(false); setRejectReason(''); setAdminNotes(''); setSelectedWithdrawal(null); }}>
          <div className="bg-surface-card rounded-xl w-full max-w-md p-6 animate-modal-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-h3 text-brand mb-4">Reject Withdrawal</h3>
            <div className="bg-surface-subtle rounded-md p-3 mb-4"><p className="text-small font-medium text-ink">{selectedWithdrawal.teacher_info?.name}</p><p className="text-h3 font-bold text-coral">RM {selectedWithdrawal.amount.toFixed(2)}</p></div>
            <div className="mb-4"><label className="block text-small font-medium mb-2 text-ink-secondary">Rejection Reason *</label><textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Enter reason..." className="w-full h-24 p-3 rounded-md border border-ink-faint/40 resize-none focus:outline-none focus:ring-2 focus:ring-brand/15 text-body" data-testid="reject-reason-input" /></div>
            <div className="mb-4"><label className="block text-small font-medium mb-2 text-ink-secondary">Admin Notes (Optional)</label><input type="text" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Internal notes..." className={inputCls} /></div>
            <div className="flex gap-3">
              <button onClick={() => { setShowRejectModal(false); setRejectReason(''); setAdminNotes(''); setSelectedWithdrawal(null); }} className="flex-1 h-11 rounded-md border border-ink-faint/40 font-medium text-ink-secondary transition-all hover:bg-surface-subtle">Cancel</button>
              <button onClick={handleReject} disabled={processingId === selectedWithdrawal.withdrawal_id} data-testid="confirm-reject-btn"
                className="flex-1 h-11 rounded-md bg-coral text-white font-medium flex items-center justify-center gap-2 transition-all hover:bg-coral/90 disabled:opacity-50">
                {processingId === selectedWithdrawal.withdrawal_id ? <Spinner size="sm" className="border-white border-t-transparent" /> : <><XCircle className="w-4 h-4" />Reject & Return</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
