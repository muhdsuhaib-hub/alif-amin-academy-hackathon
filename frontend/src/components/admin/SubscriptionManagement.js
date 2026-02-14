import React, { useState, useEffect } from 'react';
import { CreditCard, Pause, Play, XCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import Modal from '../Modal';
import Input from '../Input';
import Button from '../Button';
import { toast } from 'sonner';
import Card from '../Card';
import Spinner from '../Spinner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getStatusCls = (s) => ({ active: 'bg-teal/10 text-teal', trial: 'bg-gold/10 text-gold-dark', paused: 'bg-coral/10 text-coral' }[s] || 'bg-surface-subtle text-ink-secondary');

export default function SubscriptionManagement() {
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [action, setAction] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');

  useEffect(() => { fetchOverview(); fetchStudents(); }, []);

  const fetchOverview = async () => { try { const r = await fetch(`${API}/admin/subscriptions/overview`, { credentials: 'include' }); if (r.ok) setOverview(await r.json()); } catch (e) { console.error(e); } };
  const fetchStudents = async () => { try { const r = await fetch(`${API}/admin/users/all?role=student&limit=100`, { credentials: 'include' }); if (r.ok) { const d = await r.json(); setStudents(d.users.filter(u => u.student_info)); } } catch (e) { console.error(e); } finally { setLoading(false); } };
  const handleAction = async () => {
    if (!selectedStudent || !action) return;
    try {
      const body = { student_id: selectedStudent.student_info.student_id, action };
      if (discountPercentage) body.discount_percentage = parseFloat(discountPercentage);
      const r = await fetch(`${API}/admin/subscriptions/manage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      if (r.ok) { toast.success(`Subscription ${action} successful`); setShowActionModal(false); setSelectedStudent(null); setAction(''); setDiscountPercentage(''); fetchStudents(); fetchOverview(); }
      else toast.error('Failed to update subscription');
    } catch { toast.error('Error updating subscription'); }
  };
  const openActionModal = (student, actionType) => { setSelectedStudent(student); setAction(actionType); setShowActionModal(true); };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

  if (loading) return <div className="flex justify-center items-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-h2 text-brand">Subscription Management</h2><p className="text-small mt-1 text-ink-secondary">Manage student subscriptions and trials</p></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: TrendingUp, color: 'text-teal', label: 'Active', value: overview?.active_subscriptions || 0 },
          { icon: Clock, color: 'text-gold-dark', label: 'Trial', value: overview?.trial_subscriptions || 0 },
          { icon: Pause, color: 'text-coral', label: 'Paused', value: overview?.paused_subscriptions || 0 },
          { icon: XCircle, color: 'text-ink-tertiary', label: 'Cancelled', value: overview?.cancelled_subscriptions || 0 },
        ].map((s, i) => (
          <Card key={i} className="p-6"><div className="flex items-center gap-3 mb-2"><s.icon className={`w-5 h-5 ${s.color}`} /><p className="text-small font-medium text-ink-tertiary">{s.label}</p></div><p className="text-3xl font-semibold text-ink">{s.value}</p></Card>
        ))}
      </div>

      {overview?.trials_expiring_soon?.length > 0 && (
        <div className="bg-warning/5 rounded-lg p-6 border border-warning/20">
          <div className="flex items-center gap-3 mb-4"><AlertTriangle className="w-5 h-5 text-coral" /><h3 className="text-h3 text-ink">Trials Expiring Soon ({overview.trials_expiring_soon.length})</h3></div>
          <div className="grid gap-3">
            {overview.trials_expiring_soon.slice(0, 5).map((s, i) => (
              <div key={i} className="p-3 rounded-md bg-surface-card"><p className="text-small font-medium text-ink">{s.student_name || 'Unknown Student'}</p><p className="text-caption text-ink-tertiary">{s.student_email || ''}</p></div>
            ))}
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-surface-subtle bg-surface-subtle">{['Student', 'Status', 'Plan', 'Next Billing', 'Actions'].map((h) => <th key={h} className="px-6 py-3 text-left text-caption font-medium text-ink-tertiary uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-surface-subtle">
              {students.map((student, idx) => (
                <tr key={idx} className="hover:bg-surface-subtle/50 transition-colors">
                  <td className="px-6 py-4"><p className="font-medium text-small text-ink">{student.name}</p><p className="text-caption text-ink-tertiary">{student.email}</p></td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-caption font-medium capitalize ${getStatusCls(student.student_info.subscription_status)}`}>{student.student_info.subscription_status}</span></td>
                  <td className="px-6 py-4"><p className="text-small text-ink-secondary">{student.student_info.subscription_plan || 'No plan'}</p></td>
                  <td className="px-6 py-4"><p className="text-small text-ink-secondary">{formatDate(student.student_info.next_billing_date)}</p></td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {student.student_info.subscription_status === 'active' && <button onClick={() => openActionModal(student, 'pause')} className="p-2 rounded-md hover:bg-coral/10 transition-all" title="Pause"><Pause className="w-4 h-4 text-coral" /></button>}
                      {student.student_info.subscription_status === 'paused' && <button onClick={() => openActionModal(student, 'resume')} className="p-2 rounded-md hover:bg-teal/10 transition-all" title="Resume"><Play className="w-4 h-4 text-teal" /></button>}
                      {student.student_info.subscription_status === 'trial' && <button onClick={() => openActionModal(student, 'extend_trial')} className="p-2 rounded-md hover:bg-gold/10 transition-all" title="Extend Trial"><Clock className="w-4 h-4 text-gold-dark" /></button>}
                      {student.student_info.subscription_status !== 'cancelled' && <button onClick={() => openActionModal(student, 'cancel')} className="p-2 rounded-md hover:bg-danger/10 transition-all" title="Cancel"><XCircle className="w-4 h-4 text-ink-tertiary" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedStudent && (
        <Modal isOpen={showActionModal} onClose={() => setShowActionModal(false)} title={`${action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ')} Subscription`}>
          <div className="space-y-4">
            <div className="p-4 rounded-md bg-surface-subtle"><p className="text-small mb-1 text-ink-tertiary">Student</p><p className="font-medium text-ink">{selectedStudent.name}</p><p className="text-small text-ink-secondary">{selectedStudent.email}</p></div>
            <div className="p-4 rounded-md bg-gold/10 border-l-4 border-gold">
              <p className="text-small text-ink">
                {action === 'pause' && "This will pause the student's subscription. They won't be charged until resumed."}
                {action === 'resume' && "This will reactivate the student's subscription and billing."}
                {action === 'extend_trial' && 'This will extend the trial period by 7 days.'}
                {action === 'cancel' && 'This will cancel the subscription permanently. This action cannot be undone.'}
              </p>
            </div>
            {action !== 'cancel' && action !== 'extend_trial' && <Input label="Apply Discount (Optional)" type="number" value={discountPercentage} onChange={setDiscountPercentage} placeholder="Enter discount percentage (0-100)" />}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleAction} className="flex-1" variant={action === 'cancel' ? 'danger' : 'primary'}>Confirm {action.replace('_', ' ')}</Button>
              <Button onClick={() => setShowActionModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
