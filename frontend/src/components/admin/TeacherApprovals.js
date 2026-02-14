import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Clock, Mail, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TeacherApprovals() {
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingTeachers();
  }, []);

  const fetchPendingTeachers = async () => {
    try {
      const response = await fetch(`${API}/admin/teachers/pending`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPendingTeachers(data.pending_teachers || []);
      }
    } catch (error) {
      console.error('Error fetching pending teachers:', error);
      toast.error('Failed to load pending teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (teacherId) => {
    setProcessingId(teacherId);
    try {
      const response = await fetch(`${API}/admin/teachers/${teacherId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Teacher approved successfully!');
        fetchPendingTeachers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to approve teacher');
      }
    } catch (error) {
      toast.error('Error approving teacher');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (teacher) => {
    setSelectedTeacher(teacher);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedTeacher) return;
    
    setProcessingId(selectedTeacher.teacher_id);
    try {
      const response = await fetch(`${API}/admin/teachers/${selectedTeacher.teacher_id}/reject?reason=${encodeURIComponent(rejectReason)}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Teacher application rejected');
        setShowRejectModal(false);
        fetchPendingTeachers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to reject teacher');
      }
    } catch (error) {
      toast.error('Error rejecting teacher');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: '#0F3D2E' }}>Teacher Approvals</h2>
          <p className="text-sm mt-1" style={{ color: '#5A5A5A' }}>
            Review and approve pending teacher applications
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}>
          <Clock className="w-4 h-4" style={{ color: '#D4AF37' }} />
          <span className="text-sm font-medium" style={{ color: '#D4AF37' }}>
            {pendingTeachers.length} Pending
          </span>
        </div>
      </div>

      {/* Pending Teachers List */}
      {pendingTeachers.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid rgba(15, 61, 46, 0.1)' }}>
          <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#2EB6A0' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: '#1D1D1F' }}>All Caught Up!</h3>
          <p style={{ color: '#5A5A5A' }}>No pending teacher applications to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingTeachers.map((teacher) => (
            <div
              key={teacher.teacher_id}
              data-testid={`pending-teacher-${teacher.teacher_id}`}
              className="bg-white rounded-2xl p-6 transition-all hover:shadow-md"
              style={{ border: '1px solid rgba(15, 61, 46, 0.1)' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-medium"
                    style={{ backgroundColor: '#0F3D2E' }}
                  >
                    {teacher.user?.name?.charAt(0) || 'T'}
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>
                      {teacher.user?.name || 'Unknown'}
                    </h3>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: '#5A5A5A' }}>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{teacher.user?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Applied: {formatDate(teacher.created_at)}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-3 flex items-center gap-2">
                      <span 
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37' }}
                      >
                        <AlertCircle className="w-3 h-3" />
                        Pending Review
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    data-testid={`approve-${teacher.teacher_id}`}
                    onClick={() => handleApprove(teacher.teacher_id)}
                    disabled={processingId === teacher.teacher_id}
                    className="flex items-center gap-2 h-10 px-4 rounded-full text-white font-medium transition-all hover:scale-105 disabled:opacity-50"
                    style={{ backgroundColor: '#2EB6A0' }}
                  >
                    {processingId === teacher.teacher_id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    data-testid={`reject-${teacher.teacher_id}`}
                    onClick={() => openRejectModal(teacher)}
                    disabled={processingId === teacher.teacher_id}
                    className="flex items-center gap-2 h-10 px-4 rounded-full font-medium transition-all hover:scale-105 disabled:opacity-50"
                    style={{ backgroundColor: 'rgba(231, 111, 81, 0.1)', color: '#E76F51' }}
                  >
                    <UserX className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(231, 111, 81, 0.1)' }}>
                <XCircle className="w-5 h-5" style={{ color: '#E76F51' }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>Reject Application</h3>
                <p className="text-sm" style={{ color: '#5A5A5A' }}>{selectedTeacher.user?.name}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: '#1D1D1F' }}>
                Reason for Rejection (Optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                className="w-full h-24 px-4 py-3 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={processingId === selectedTeacher.teacher_id}
                className="flex-1 h-11 rounded-full text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#E76F51' }}
              >
                {processingId === selectedTeacher.teacher_id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 h-11 rounded-full border font-medium transition-all hover:bg-gray-50"
                style={{ borderColor: 'rgba(15, 61, 46, 0.2)', color: '#0F3D2E' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
