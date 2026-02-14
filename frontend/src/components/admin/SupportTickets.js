import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Modal from '../Modal';
import Input from '../Input';
import Select from '../Select';
import Button from '../Button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [newTicket, setNewTicket] = useState({
    user_id: 'admin',
    user_name: 'Admin',
    user_email: 'admin@alifamin.com',
    subject: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, filterPriority]);

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterPriority) params.append('priority', filterPriority);

      const response = await fetch(`${API}/admin/support/tickets?${params}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch(`${API}/admin/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newTicket)
      });

      if (response.ok) {
        toast.success('Support ticket created');
        setShowNewTicket(false);
        setNewTicket({
          user_id: 'admin',
          user_name: 'Admin',
          user_email: 'admin@alifamin.com',
          subject: '',
          description: '',
          priority: 'medium'
        });
        fetchTickets();
      } else {
        toast.error('Failed to create ticket');
      }
    } catch (error) {
      toast.error('Error creating ticket');
    }
  };

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      const response = await fetch(`${API}/admin/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success('Ticket status updated');
        fetchTickets();
        setShowTicketDetail(false);
      } else {
        toast.error('Failed to update ticket');
      }
    } catch (error) {
      toast.error('Error updating ticket');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return { bg: 'rgba(231, 111, 81, 0.1)', text: '#E76F51' };
      case 'medium': return { bg: 'rgba(200, 169, 81, 0.1)', text: '#C8A951' };
      case 'low': return { bg: 'rgba(46, 182, 160, 0.1)', text: '#2EB6A0' };
      default: return { bg: 'rgba(156, 163, 175, 0.1)', text: '#9CA3AF' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <CheckCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: '#1D1D1F',  }}>Support Tickets</h2>
          <p className="text-sm mt-1" style={{ color: '#5A5A5A',  }}>
            Manage support requests and issues
          </p>
        </div>
        <Button onClick={() => setShowNewTicket(true)}>
          <Plus className="w-4 h-4 mr-2 inline" />
          New Ticket
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Select
          label="Filter by Status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: '', label: 'All Status' },
            { value: 'open', label: 'Open' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'closed', label: 'Closed' }
          ]}
        />
        <Select
          label="Filter by Priority"
          value={filterPriority}
          onChange={setFilterPriority}
          options={[
            { value: '', label: 'All Priority' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' }
          ]}
        />
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl shadow-sm border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3D2E]"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
            <p style={{ color: '#5A5A5A',  }}>No support tickets found</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(15, 61, 46, 0.05)' }}>
            {tickets.map((ticket, idx) => {
              const priorityColors = getPriorityColor(ticket.priority);
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setShowTicketDetail(true);
                  }}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F',  }}>
                          {ticket.subject}
                        </h3>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                          style={{
                            backgroundColor: priorityColors.bg,
                            color: priorityColors.text,
                            
                          }}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2" style={{ color: '#5A5A5A',  }}>
                        {ticket.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getStatusIcon(ticket.status)}
                      <span className="text-sm capitalize" style={{ color: '#5A5A5A',  }}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm" style={{ color: '#9CA3AF',  }}>
                    <span>From: {ticket.user_name}</span>
                    <span>•</span>
                    <span>{formatDate(ticket.created_at)}</span>
                    <span>•</span>
                    <span>ID: {ticket.ticket_id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      <Modal
        isOpen={showNewTicket}
        onClose={() => setShowNewTicket(false)}
        title="Create Support Ticket"
      >
        <div className="space-y-4">
          <Input
            label="Subject"
            value={newTicket.subject}
            onChange={(val) => setNewTicket({ ...newTicket, subject: val })}
            placeholder="Brief description of the issue"
            required
          />
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#1D1D1F',  }}>
              Description <span style={{ color: '#E76F51' }}>*</span>
            </label>
            <textarea
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              placeholder="Detailed description of the issue..."
              rows={5}
              required
              className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
              style={{
                borderColor: 'rgba(15, 61, 46, 0.2)',
                
              }}
            />
          </div>
          <Select
            label="Priority"
            value={newTicket.priority}
            onChange={(val) => setNewTicket({ ...newTicket, priority: val })}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' }
            ]}
          />
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreateTicket} className="flex-1">
              Create Ticket
            </Button>
            <Button onClick={() => setShowNewTicket(false)} variant="secondary" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <Modal
          isOpen={showTicketDetail}
          onClose={() => setShowTicketDetail(false)}
          title="Ticket Details"
          size="lg"
        >
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-semibold" style={{ color: '#1D1D1F',  }}>
                  {selectedTicket.subject}
                </h3>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                  style={{
                    backgroundColor: getPriorityColor(selectedTicket.priority).bg,
                    color: getPriorityColor(selectedTicket.priority).text,
                    
                  }}
                >
                  {selectedTicket.priority}
                </span>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: '#F7F5EF' }}>
                <p style={{ color: '#1D1D1F',  }}>{selectedTicket.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm mb-1" style={{ color: '#9CA3AF',  }}>Submitted By</p>
                <p className="font-medium" style={{ color: '#1D1D1F',  }}>{selectedTicket.user_name}</p>
                <p className="text-sm" style={{ color: '#5A5A5A',  }}>{selectedTicket.user_email}</p>
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: '#9CA3AF',  }}>Created</p>
                <p className="font-medium" style={{ color: '#1D1D1F',  }}>{formatDate(selectedTicket.created_at)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1D1D1F',  }}>
                Update Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleUpdateTicketStatus(selectedTicket.ticket_id, 'in_progress')}
                  variant={selectedTicket.status === 'in_progress' ? 'primary' : 'secondary'}
                >
                  In Progress
                </Button>
                <Button
                  onClick={() => handleUpdateTicketStatus(selectedTicket.ticket_id, 'resolved')}
                  variant={selectedTicket.status === 'resolved' ? 'primary' : 'secondary'}
                >
                  Resolved
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
