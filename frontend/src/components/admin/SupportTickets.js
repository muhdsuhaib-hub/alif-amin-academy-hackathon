import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Modal from '../Modal';
import Input from '../Input';
import Select from '../Select';
import Button from '../Button';
import { toast } from 'sonner';
import Card from '../Card';
import Spinner from '../Spinner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getPriorityCls = (p) => ({ high: 'bg-coral/10 text-coral', medium: 'bg-gold/10 text-gold-dark', low: 'bg-teal/10 text-teal' }[p] || 'bg-surface-subtle text-ink-secondary');
const getStatusIcon = (s) => ({ open: <Clock className="w-4 h-4" />, in_progress: <AlertCircle className="w-4 h-4" />, resolved: <CheckCircle className="w-4 h-4" />, closed: <CheckCircle className="w-4 h-4" /> }[s] || <MessageSquare className="w-4 h-4" />);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [newTicket, setNewTicket] = useState({ user_id: 'admin', user_name: 'Admin', user_email: 'admin@alifamin.com', subject: '', description: '', priority: 'medium' });

  useEffect(() => { fetchTickets(); }, [filterStatus, filterPriority]);

  const fetchTickets = async () => {
    try { const p = new URLSearchParams(); if (filterStatus) p.append('status', filterStatus); if (filterPriority) p.append('priority', filterPriority);
      const r = await fetch(`${API}/admin/support/tickets?${p}`, { credentials: 'include' }); if (r.ok) setTickets(await r.json()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description) { toast.error('Please fill all required fields'); return; }
    try { const r = await fetch(`${API}/admin/support/tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(newTicket) }); if (r.ok) { toast.success('Support ticket created'); setShowNewTicket(false); setNewTicket({ user_id: 'admin', user_name: 'Admin', user_email: 'admin@alifamin.com', subject: '', description: '', priority: 'medium' }); fetchTickets(); } else toast.error('Failed'); } catch { toast.error('Error'); }
  };
  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try { const r = await fetch(`${API}/admin/support/tickets/${ticketId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status: newStatus }) }); if (r.ok) { toast.success('Ticket updated'); fetchTickets(); setShowTicketDetail(false); } else toast.error('Failed'); } catch { toast.error('Error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-h2 text-brand">Support Tickets</h2><p className="text-small mt-1 text-ink-secondary">Manage support requests and issues</p></div>
        <Button onClick={() => setShowNewTicket(true)}><Plus className="w-4 h-4" />New Ticket</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Filter by Status" value={filterStatus} onChange={setFilterStatus} options={[{ value: '', label: 'All Status' }, { value: 'open', label: 'Open' }, { value: 'in_progress', label: 'In Progress' }, { value: 'resolved', label: 'Resolved' }, { value: 'closed', label: 'Closed' }]} />
        <Select label="Filter by Priority" value={filterPriority} onChange={setFilterPriority} options={[{ value: '', label: 'All Priority' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
      </div>

      <Card className="overflow-hidden">
        {loading ? <div className="flex justify-center items-center py-12"><Spinner /></div>
        : tickets.length === 0 ? <div className="text-center py-12"><MessageSquare className="w-12 h-12 mx-auto mb-4 text-ink-faint" /><p className="text-ink-secondary">No support tickets found</p></div>
        : (
          <div className="divide-y divide-surface-subtle">
            {tickets.map((ticket, idx) => (
              <div key={idx} onClick={() => { setSelectedTicket(ticket); setShowTicketDetail(true); }} className="p-6 hover:bg-surface-subtle/50 cursor-pointer transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-h3 text-ink">{ticket.subject}</h3>
                      <span className={`px-3 py-1 rounded-full text-caption font-medium capitalize ${getPriorityCls(ticket.priority)}`}>{ticket.priority}</span>
                    </div>
                    <p className="text-small line-clamp-2 text-ink-secondary">{ticket.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 text-ink-secondary">{getStatusIcon(ticket.status)}<span className="text-small capitalize">{ticket.status.replace('_', ' ')}</span></div>
                </div>
                <div className="flex items-center gap-4 text-small text-ink-tertiary"><span>From: {ticket.user_name}</span><span>&middot;</span><span>{formatDate(ticket.created_at)}</span><span>&middot;</span><span>ID: {ticket.ticket_id}</span></div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={showNewTicket} onClose={() => setShowNewTicket(false)} title="Create Support Ticket">
        <div className="space-y-4">
          <Input label="Subject" value={newTicket.subject} onChange={(v) => setNewTicket({ ...newTicket, subject: v })} placeholder="Brief description" required />
          <div><label className="block text-small font-medium mb-2 text-ink-secondary">Description <span className="text-danger">*</span></label><textarea value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} placeholder="Detailed description..." rows={5} required className="w-full px-4 py-3 rounded-md border border-ink-faint/40 transition-all focus:outline-none focus:ring-2 focus:ring-brand/15 text-body resize-none" /></div>
          <Select label="Priority" value={newTicket.priority} onChange={(v) => setNewTicket({ ...newTicket, priority: v })} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
          <div className="flex gap-3 pt-4"><Button onClick={handleCreateTicket} className="flex-1">Create Ticket</Button><Button onClick={() => setShowNewTicket(false)} variant="secondary" className="flex-1">Cancel</Button></div>
        </div>
      </Modal>

      {selectedTicket && (
        <Modal isOpen={showTicketDetail} onClose={() => setShowTicketDetail(false)} title={selectedTicket.subject}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-caption font-medium capitalize ${getPriorityCls(selectedTicket.priority)}`}>{selectedTicket.priority}</span>
              <span className="text-small text-ink-secondary capitalize">{selectedTicket.status.replace('_', ' ')}</span>
            </div>
            <div className="p-4 rounded-md bg-surface-subtle"><p className="text-body text-ink">{selectedTicket.description}</p></div>
            <div className="grid grid-cols-2 gap-4 text-small">
              <div><p className="text-ink-tertiary mb-1">From</p><p className="font-medium text-ink">{selectedTicket.user_name}</p><p className="text-ink-tertiary">{selectedTicket.user_email}</p></div>
              <div><p className="text-ink-tertiary mb-1">Created</p><p className="font-medium text-ink">{formatDate(selectedTicket.created_at)}</p></div>
            </div>
            <div className="flex gap-3 pt-4">
              {selectedTicket.status === 'open' && <Button onClick={() => handleUpdateTicketStatus(selectedTicket.ticket_id, 'in_progress')} className="flex-1">Mark In Progress</Button>}
              {selectedTicket.status === 'in_progress' && <Button onClick={() => handleUpdateTicketStatus(selectedTicket.ticket_id, 'resolved')} className="flex-1">Mark Resolved</Button>}
              {selectedTicket.status !== 'closed' && <Button onClick={() => handleUpdateTicketStatus(selectedTicket.ticket_id, 'closed')} variant="secondary" className="flex-1">Close Ticket</Button>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
