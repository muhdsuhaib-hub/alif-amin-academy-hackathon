import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Clock, Mail, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../Card';
import Spinner from '../Spinner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TeacherApprovals() {
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { fetchPendingTeachers(); }, []);

  const fetchPendingTeachers = async () => {
    try { const r = await fetch(`${API}/admin/teachers/pending`, { credentials: 'include' }); if (r.ok) { const d = await r.json(); setPendingTeachers(d.pending_teachers || []); } }
    catch (e) { console.error(e); toast.error('Failed to load pending teachers'); } finally { setLoading(false); }
  };
  const handleApprove = async (teacherId) => {
    setProcessingId(teacherId);
    try { const r = await fetch(`${API}/admin/teachers/${teacherId}/approve`, { method: 'POST', credentials: 'include' }); if (r.ok) { toast.success('Teacher approved!'); fetchPendingTeachers(); } else { const e = await r.json(); toast.error(e.detail || 'Failed'); } }
    catch { toast.error('Error approving'); } finally { setProcessingId(null); }
  };
  const handleReject = async () => {
    if (!selectedTeacher) return;
    setProcessingId(selectedTeacher.teacher_id);
    try { const r = await fetch(`${API}/admin/teachers/${selectedTeacher.teacher_id}/reject?reason=${encodeURIComponent(rejectReason)}`, { method: 'POST', credentials: 'include' }); if (r.ok) { toast.success('Application rejected'); setShowRejectModal(false); fetchPendingTeachers(); } else { const e = await r.json(); toast.error(e.detail || 'Failed'); } }
    catch { toast.error('Error rejecting'); } finally { setProcessingId(null); }
  };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  if (loading) return <div className="flex items-center justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-h2 text-brand">Teacher Approvals</h2><p className="text-small mt-1 text-ink-secondary">Review and approve pending teacher applications</p></div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-gold/10"><Clock className="w-4 h-4 text-gold-dark" /><span className="text-small font-medium text-gold-dark">{pendingTeachers.length} Pending</span></div>
      </div>

      {pendingTeachers.length === 0 ? (
        <Card className="p-8 text-center"><CheckCircle className="w-12 h-12 mx-auto mb-4 text-teal" /><h3 className="text-h3 text-ink mb-2">All Caught Up!</h3><p className="text-ink-secondary">No pending teacher applications to review.</p></Card>
      ) : (
        <div className="space-y-4">
          {pendingTeachers.map((teacher) => (
            <Card key={teacher.teacher_id} className="p-6 hover:shadow-apple-md transition-all" data-testid={`pending-teacher-${teacher.teacher_id}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-white text-xl font-medium">{teacher.user?.name?.charAt(0) || 'T'}</div>
                  <div>
                    <h3 className="text-h3 text-ink">{teacher.user?.name || 'Unknown'}</h3>
                    <div className="flex items-center gap-4 mt-2 text-small text-ink-secondary">
                      <div className="flex items-center gap-1"><Mail className="w-4 h-4" /><span>{teacher.user?.email || 'N/A'}</span></div>
                      <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>Applied: {formatDate(teacher.created_at)}</span></div>
                    </div>
                    <div className="mt-3"><span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-caption font-medium bg-gold/10 text-gold-dark"><AlertCircle className="w-3 h-3" />Pending Review</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button data-testid={`approve-${teacher.teacher_id}`} onClick={() => handleApprove(teacher.teacher_id)} disabled={processingId === teacher.teacher_id}
                    className="flex items-center gap-2 h-10 px-4 rounded-md bg-teal text-white font-medium transition-all hover:bg-teal/90 disabled:opacity-50">
                    {processingId === teacher.teacher_id ? <Spinner size="sm" className="border-white border-t-transparent" /> : <UserCheck className="w-4 h-4" />}Approve
                  </button>
                  <button data-testid={`reject-${teacher.teacher_id}`} onClick={() => { setSelectedTeacher(teacher); setRejectReason(''); setShowRejectModal(true); }} disabled={processingId === teacher.teacher_id}
                    className="flex items-center gap-2 h-10 px-4 rounded-md bg-coral/10 text-coral font-medium transition-all hover:bg-coral/20 disabled:opacity-50"><UserX className="w-4 h-4" />Reject</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showRejectModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowRejectModal(false)}>
          <div className="bg-surface-card rounded-xl p-6 w-full max-w-md animate-modal-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center"><XCircle className="w-5 h-5 text-coral" /></div>
              <div><h3 className="text-h3 text-ink">Reject Application</h3><p className="text-small text-ink-secondary">{selectedTeacher.user?.name}</p></div>
            </div>
            <div className="mb-6">
              <label className="block text-small font-medium mb-2 text-ink-secondary">Reason for Rejection (Optional)</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Provide a reason..." className="w-full h-24 px-4 py-3 rounded-md border border-ink-faint/40 resize-none focus:outline-none focus:ring-2 focus:ring-brand/15 text-body" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleReject} disabled={processingId === selectedTeacher.teacher_id} className="flex-1 h-11 rounded-md bg-coral text-white font-medium transition-all hover:bg-coral/90 disabled:opacity-50">{processingId === selectedTeacher.teacher_id ? 'Rejecting...' : 'Confirm Rejection'}</button>
              <button onClick={() => setShowRejectModal(false)} className="flex-1 h-11 rounded-md border border-ink-faint/40 font-medium text-brand transition-all hover:bg-surface-subtle">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
