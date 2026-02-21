import React, { useState, useEffect } from 'react';
import { UserCheck, Clock, X, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../Card';
import Spinner from '../Spinner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PAGE_SIZE = 10;

export default function TeacherApprovals() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    try { const r = await fetch(`${API}/admin/teachers/pending`, { credentials: 'include' }); if (r.ok) setTeachers((await r.json()).teachers || []); }
    catch { toast.error('Failed to load'); } finally { setLoading(false); }
  };

  const handleApprove = async (teacherId) => {
    try {
      const r = await fetch(`${API}/admin/teachers/${teacherId}/approve`, { method: 'POST', credentials: 'include' });
      if (r.ok) { setTeachers(prev => prev.filter(t => t.teacher_id !== teacherId)); toast.success('Teacher approved! Welcome email sent.'); }
      else toast.error('Failed to approve');
    } catch { toast.error('Error'); }
  };

  const handleReject = async () => {
    if (!showRejectModal) return;
    try {
      const r = await fetch(`${API}/admin/teachers/${showRejectModal}/reject`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (r.ok) { setTeachers(prev => prev.filter(t => t.teacher_id !== showRejectModal)); toast.success('Application rejected. Notification email sent.'); }
      else toast.error('Failed');
    } catch { toast.error('Error'); }
    finally { setShowRejectModal(null); setRejectReason(''); }
  };

  const totalPages = Math.max(1, Math.ceil(teachers.length / PAGE_SIZE));
  const paged = teachers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6" data-testid="teacher-approvals">
      <div><h2 className="text-lg font-bold text-slate-900">Pending Approvals</h2><p className="text-xs text-slate-500">{teachers.length} pending</p></div>

      {teachers.length === 0 ? (
        <Card className="p-12 text-center"><UserCheck className="w-10 h-10 mx-auto mb-3 text-emerald-200" /><p className="text-sm text-slate-500 font-medium">All caught up!</p><p className="text-xs text-slate-400 mt-1">No pending teacher applications.</p></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead><tr className="border-b border-slate-100 bg-slate-50/80">{['Teacher', 'Qualifications', 'Applied', 'Actions'].map((h, i) => <th key={i} className={`${i === 3 ? 'text-right' : 'text-left'} px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider`}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-50">
                {paged.map((t) => (
                  <tr key={t.teacher_id} className="hover:bg-slate-50/50 transition-colors" data-testid={`approval-${t.teacher_id}`}>
                    <td className="px-5 py-3"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">{t.user_name?.charAt(0) || 'T'}</div><div><p className="text-sm font-medium text-slate-900">{t.user_name || 'Unknown'}</p><p className="text-[11px] text-slate-400">{t.user_email}</p></div></div></td>
                    <td className="px-5 py-3"><div className="flex flex-wrap gap-1">{(t.specializations || []).slice(0, 3).map((s, i) => <span key={i} className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-medium">{s}</span>)}</div></td>
                    <td className="px-5 py-3"><div className="flex items-center gap-1.5 text-xs text-slate-500"><Clock className="w-3 h-3" />{fmtDate(t.created_at)}</div></td>
                    <td className="px-5 py-3 text-right"><div className="flex items-center gap-2 justify-end">
                      <button onClick={() => handleApprove(t.teacher_id)} className="px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-all" data-testid={`approve-${t.teacher_id}`}>Approve</button>
                      <button onClick={() => setShowRejectModal(t.teacher_id)} className="px-3.5 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-all" data-testid={`reject-${t.teacher_id}`}>Reject</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex gap-1.5"><button onClick={() => setPage(Math.max(1, page-1))} disabled={page===1} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button><button onClick={() => setPage(Math.min(totalPages, page+1))} disabled={page===totalPages} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button></div>
            </div>
          )}
        </Card>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowRejectModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()} data-testid="reject-modal">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500" /><h3 className="text-sm font-bold text-slate-900">Reject Application</h3></div>
              <button onClick={() => setShowRejectModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-6">
              <label className="block text-xs font-medium text-slate-500 mb-2">Rejection Reason (optional)</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="E.g., Missing Tajweed certification..." rows={3} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none" data-testid="reject-reason-input" />
              <p className="text-[10px] text-slate-400 mt-2">This will be included in the notification email to the applicant.</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={handleReject} className="flex-1 h-11 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-all" data-testid="confirm-reject-btn">Reject Application</button>
              <button onClick={() => setShowRejectModal(null)} className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
