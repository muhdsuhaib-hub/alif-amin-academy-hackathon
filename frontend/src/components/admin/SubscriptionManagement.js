import React, { useState, useEffect } from 'react';
import { CreditCard, Pause, Play, XCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import Modal from '../Modal';
import Input from '../Input';
import Select from '../Select';
import Button from '../Button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SubscriptionManagement() {
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [action, setAction] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');

  useEffect(() => {
    fetchOverview();
    fetchStudents();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await fetch(`${API}/admin/subscriptions/overview`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setOverview(data);
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API}/admin/users/all?role=student&limit=100`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.users.filter(u => u.student_info));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedStudent || !action) return;

    try {
      const body = {
        student_id: selectedStudent.student_info.student_id,
        action: action
      };

      if (discountPercentage) {
        body.discount_percentage = parseFloat(discountPercentage);
      }

      const response = await fetch(`${API}/admin/subscriptions/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success(`Subscription ${action} successful`);
        setShowActionModal(false);
        setSelectedStudent(null);
        setAction('');
        setDiscountPercentage('');
        fetchStudents();
        fetchOverview();
      } else {
        toast.error('Failed to update subscription');
      }
    } catch (error) {
      toast.error('Error updating subscription');
    }
  };

  const openActionModal = (student, actionType) => {
    setSelectedStudent(student);
    setAction(actionType);
    setShowActionModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return { bg: 'rgba(46, 182, 160, 0.1)', text: '#2EB6A0' };
      case 'trial': return { bg: 'rgba(200, 169, 81, 0.1)', text: '#C8A951' };
      case 'paused': return { bg: 'rgba(231, 111, 81, 0.1)', text: '#E76F51' };
      case 'cancelled': return { bg: 'rgba(156, 163, 175, 0.1)', text: '#9CA3AF' };
      default: return { bg: 'rgba(156, 163, 175, 0.1)', text: '#9CA3AF' };
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3D2E]"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>Subscription Management</h2>
        <p className="text-sm mt-1" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans', fontWeight: 300 }}>
          Manage student subscriptions and trials
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5" style={{ color: '#2EB6A0' }} />
            <p className="text-sm font-medium" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>Active</p>
          </div>
          <p className="text-3xl font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
            {overview?.active_subscriptions || 0}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5" style={{ color: '#C8A951' }} />
            <p className="text-sm font-medium" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>Trial</p>
          </div>
          <p className="text-3xl font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
            {overview?.trial_subscriptions || 0}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
          <div className="flex items-center gap-3 mb-2">
            <Pause className="w-5 h-5" style={{ color: '#E76F51' }} />
            <p className="text-sm font-medium" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>Paused</p>
          </div>
          <p className="text-3xl font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
            {overview?.paused_subscriptions || 0}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-5 h-5" style={{ color: '#9CA3AF' }} />
            <p className="text-sm font-medium" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>Cancelled</p>
          </div>
          <p className="text-3xl font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
            {overview?.cancelled_subscriptions || 0}
          </p>
        </div>
      </div>

      {/* Trials Expiring Soon */}
      {overview?.trials_expiring_soon && overview.trials_expiring_soon.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border mb-8" style={{ borderColor: 'rgba(231, 111, 81, 0.3)', backgroundColor: '#FFF9E6' }}>
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5" style={{ color: '#E76F51' }} />
            <h3 className="text-lg font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
              Trials Expiring Soon ({overview.trials_expiring_soon.length})
            </h3>
          </div>
          <div className="grid gap-3">
            {overview.trials_expiring_soon.slice(0, 5).map((student, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white">
                <p className="text-sm font-medium" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                  Student ID: {student.student_id}
                </p>
                <p className="text-xs" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans', fontWeight: 300 }}>
                  Level: {student.current_level}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students List */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: '#F7F5EF' }}>
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>Student</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>Plan</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>Next Billing</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => {
                const statusColors = getStatusColor(student.student_info.subscription_status);
                return (
                  <tr key={idx} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: 'rgba(15, 61, 46, 0.05)' }}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>{student.name}</p>
                        <p className="text-sm" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>{student.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                        style={{
                          backgroundColor: statusColors.bg,
                          color: statusColors.text,
                          fontFamily: 'Cal Sans'
                        }}
                      >
                        {student.student_info.subscription_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>
                        {student.student_info.subscription_plan || 'No plan'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>
                        {formatDate(student.student_info.next_billing_date)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {student.student_info.subscription_status === 'active' && (
                          <button
                            onClick={() => openActionModal(student, 'pause')}
                            className="p-2 rounded-lg hover:bg-orange-50 transition-all"
                            title="Pause"
                          >
                            <Pause className="w-4 h-4" style={{ color: '#E76F51' }} />
                          </button>
                        )}
                        {student.student_info.subscription_status === 'paused' && (
                          <button
                            onClick={() => openActionModal(student, 'resume')}
                            className="p-2 rounded-lg hover:bg-green-50 transition-all"
                            title="Resume"
                          >
                            <Play className="w-4 h-4" style={{ color: '#2EB6A0' }} />
                          </button>
                        )}
                        {student.student_info.subscription_status === 'trial' && (
                          <button
                            onClick={() => openActionModal(student, 'extend_trial')}
                            className="p-2 rounded-lg hover:bg-blue-50 transition-all"
                            title="Extend Trial"
                          >
                            <Clock className="w-4 h-4" style={{ color: '#C8A951' }} />
                          </button>
                        )}
                        {student.student_info.subscription_status !== 'cancelled' && (
                          <button
                            onClick={() => openActionModal(student, 'cancel')}
                            className="p-2 rounded-lg hover:bg-red-50 transition-all"
                            title="Cancel"
                          >
                            <XCircle className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {selectedStudent && (
        <Modal
          isOpen={showActionModal}
          onClose={() => setShowActionModal(false)}
          title={`${action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ')} Subscription`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#F7F5EF' }}>
              <p className="text-sm mb-1" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>Student</p>
              <p className="font-medium" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>{selectedStudent.name}</p>
              <p className="text-sm" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans', fontWeight: 300 }}>{selectedStudent.email}</p>
            </div>

            <div className="p-4 rounded-xl border-l-4" style={{ backgroundColor: '#FFF9E6', borderLeftColor: '#C8A951' }}>
              <p className="text-sm" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                {action === 'pause' && 'This will pause the student\'s subscription. They won\'t be charged until resumed.'}
                {action === 'resume' && 'This will reactivate the student\'s subscription and billing.'}
                {action === 'extend_trial' && 'This will extend the trial period by 7 days.'}
                {action === 'cancel' && 'This will cancel the subscription permanently. This action cannot be undone.'}
              </p>
            </div>

            {action !== 'cancel' && action !== 'extend_trial' && (
              <Input
                label="Apply Discount (Optional)"
                type="number"
                value={discountPercentage}
                onChange={setDiscountPercentage}
                placeholder="Enter discount percentage (0-100)"
              />
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAction}
                className="flex-1"
                variant={action === 'cancel' ? 'danger' : 'primary'}
              >
                Confirm {action.replace('_', ' ')}
              </Button>
              <Button onClick={() => setShowActionModal(false)} variant="secondary" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
