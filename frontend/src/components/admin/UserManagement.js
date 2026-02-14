import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Edit, Trash2, Mail, Phone, Download, X, ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../Card';
import Spinner from '../Spinner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getRoleBadgeCls = (role) => ({ admin: 'bg-coral/10 text-coral', teacher: 'bg-gold/10 text-gold-dark' }[role] || 'bg-teal/10 text-teal');

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { fetchUsers(); }, [page, filterRole, filterStatus]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (filterRole) params.append('role', filterRole);
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);
      if (filterDateFrom) params.append('date_from', filterDateFrom);
      if (filterDateTo) params.append('date_to', filterDateTo);
      const r = await fetch(`${API}/admin/users/all?${params}`, { credentials: 'include' });
      if (r.ok) { const d = await r.json(); setUsers(d.users || []); setTotalPages(d.pages || 1); setTotalUsers(d.total || 0); }
    } catch (e) { console.error(e); toast.error('Failed to load users'); } finally { setLoading(false); }
  };
  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchUsers(); };
  const handleEdit = (u) => { setSelectedUser({ ...u }); setShowEditModal(true); };
  const handleUpdate = async () => {
    if (!selectedUser) return;
    try { const r = await fetch(`${API}/admin/users/${selectedUser.user_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(selectedUser) }); if (r.ok) { toast.success('User updated'); setShowEditModal(false); fetchUsers(); } else toast.error('Failed to update'); }
    catch { toast.error('Error updating'); }
  };
  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try { const r = await fetch(`${API}/admin/users/${userId}`, { method: 'DELETE', credentials: 'include' }); if (r.ok) { toast.success('User deleted'); fetchUsers(); } else toast.error('Failed'); }
    catch { toast.error('Error deleting'); }
  };
  const exportToExcel = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '10000' });
      if (filterRole) params.append('role', filterRole); if (searchTerm) params.append('search', searchTerm); if (filterStatus) params.append('status', filterStatus); if (filterDateFrom) params.append('date_from', filterDateFrom); if (filterDateTo) params.append('date_to', filterDateTo);
      const r = await fetch(`${API}/admin/users/all?${params}`, { credentials: 'include' });
      if (!r.ok) throw new Error('Failed');
      const data = await r.json(); const allUsers = data.users || [];
      const headers = ['Name', 'Email', 'Phone', 'Role', 'Auth Provider', 'Schedule Preference', 'Reading Level', 'Subscription Status', 'Timezone', 'Created At'];
      const csvRows = [headers.join(',')];
      allUsers.forEach(u => { csvRows.push([u.name, u.email, u.phone, u.role, u.auth_provider || 'google', u.schedule_preference, u.reading_level, u.subscription_status, u.timezone, u.created_at].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',')); });
      const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.setAttribute('href', url); link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      toast.success(`Exported ${allUsers.length} users`);
    } catch { toast.error('Failed to export'); } finally { setExporting(false); }
  };
  const clearFilters = () => { setFilterRole(''); setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); setSearchTerm(''); setPage(1); };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

  const inputCls = 'h-12 w-full rounded-md border border-ink-faint/40 bg-surface-card px-4 text-body placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand/40 transition-all';
  const filterInputCls = 'w-full h-10 px-3 rounded-md border border-ink-faint/40 text-small focus:outline-none focus:ring-2 focus:ring-brand/15';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h2 className="text-h2 text-brand">User Management</h2><p className="text-small text-ink-secondary">{totalUsers} total users</p></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 h-10 px-4 rounded-md font-medium transition-all hover:bg-surface-subtle border border-ink-faint/40 text-brand text-small">
            <Filter className="w-4 h-4" />Filters{(filterRole || filterStatus || filterDateFrom || filterDateTo) && <span className="w-2 h-2 rounded-full bg-coral" />}
          </button>
          <button onClick={exportToExcel} disabled={exporting} className="flex items-center gap-2 h-10 px-4 rounded-md bg-brand text-white font-medium text-small transition-all hover:bg-brand-light disabled:opacity-50">
            {exporting ? <Spinner size="sm" className="border-white border-t-transparent" /> : <Download className="w-4 h-4" />}Export
          </button>
        </div>
      </div>

      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="flex-1 relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-tertiary" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, email, or phone..." className={`${inputCls} pl-12 h-11`} /></div>
          <button type="submit" className="h-11 px-6 rounded-md bg-brand text-white font-medium text-small transition-all hover:bg-brand-light">Search</button>
        </form>
        {showFilters && (
          <div className="border-t border-surface-subtle pt-4 mt-4">
            <div className="flex items-center justify-between mb-4"><h4 className="font-medium text-ink">Filter Options</h4><button onClick={clearFilters} className="text-small text-ink-tertiary hover:text-ink-secondary">Clear all</button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div><label className="block text-caption font-medium mb-1.5 text-ink-secondary">Role</label><select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1); }} className={filterInputCls}><option value="">All Roles</option><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option></select></div>
              <div><label className="block text-caption font-medium mb-1.5 text-ink-secondary">Status</label><select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className={filterInputCls}><option value="">All Status</option><option value="trial">Trial</option><option value="active">Active</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option></select></div>
              <div><label className="block text-caption font-medium mb-1.5 text-ink-secondary">From</label><input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className={filterInputCls} /></div>
              <div><label className="block text-caption font-medium mb-1.5 text-ink-secondary">To</label><input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className={filterInputCls} /></div>
            </div>
            <button onClick={() => { setPage(1); fetchUsers(); }} className="mt-4 h-10 px-6 rounded-md bg-brand text-white font-medium text-small transition-all hover:bg-brand-light">Apply Filters</button>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        {loading ? <div className="flex items-center justify-center py-12"><Spinner /></div>
        : users.length === 0 ? <div className="text-center py-12"><Users className="w-12 h-12 mx-auto mb-3 text-ink-faint" /><p className="text-ink-secondary">No users found</p></div>
        : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-surface-subtle">{['User', 'Contact', 'Role', 'Details', 'Registered', ''].map((h, i) => <th key={i} className={`${i === 5 ? 'text-right' : 'text-left'} px-6 py-3 text-caption font-medium text-ink-tertiary uppercase tracking-wider`}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-surface-subtle">
                  {users.map((user) => (
                    <tr key={user.user_id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-white font-medium">{user.name?.charAt(0) || 'U'}</div><div><p className="font-medium text-small text-ink">{user.name || 'Unknown'}</p><p className="text-caption text-ink-tertiary">{user.auth_provider || 'google'}</p></div></div></td>
                      <td className="px-6 py-4"><div className="space-y-1"><div className="flex items-center gap-1.5 text-small text-ink-secondary"><Mail className="w-3.5 h-3.5" /><span className="truncate max-w-[180px]">{user.email}</span></div>{user.phone && <div className="flex items-center gap-1.5 text-small text-ink-tertiary"><Phone className="w-3.5 h-3.5" /><span>{user.phone}</span></div>}</div></td>
                      <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-caption font-medium capitalize ${getRoleBadgeCls(user.role)}`}>{user.role || 'student'}</span></td>
                      <td className="px-6 py-4"><div className="space-y-1 text-caption text-ink-tertiary">{user.schedule_preference && <p>Schedule: <span className="text-ink-secondary">{user.schedule_preference}</span></p>}{user.reading_level && <p>Level: <span className="text-ink-secondary">{user.reading_level}</span></p>}{user.timezone && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /><span>{user.timezone}</span></div>}</div></td>
                      <td className="px-6 py-4"><div className="flex items-center gap-1.5 text-small text-ink-secondary"><Calendar className="w-3.5 h-3.5" /><span>{formatDate(user.created_at)}</span></div></td>
                      <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-2"><button onClick={() => handleEdit(user)} className="p-2 rounded-md hover:bg-surface-subtle transition-all" title="Edit"><Edit className="w-4 h-4 text-ink-tertiary" /></button><button onClick={() => handleDelete(user.user_id)} className="p-2 rounded-md hover:bg-danger/10 transition-all" title="Delete"><Trash2 className="w-4 h-4 text-danger" /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-surface-subtle">
              <p className="text-small text-ink-secondary">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-md border border-ink-faint/30 transition-all hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-md border border-ink-faint/30 transition-all hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </Card>

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowEditModal(false)}>
          <div className="bg-surface-card rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-modal-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-surface-subtle flex items-center justify-between"><h3 className="text-h3 text-brand">Edit User</h3><button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-surface-subtle rounded-full transition-colors"><X className="w-5 h-5 text-ink-tertiary" /></button></div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Full Name', key: 'name', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Phone', key: 'phone', type: 'tel' },
                { label: 'Timezone', key: 'timezone', type: 'text' },
              ].map(f => (
                <div key={f.key}><label className="block text-small font-medium mb-2 text-ink-secondary">{f.label}</label><input type={f.type} value={selectedUser[f.key] || ''} onChange={(e) => setSelectedUser({ ...selectedUser, [f.key]: e.target.value })} className={inputCls} /></div>
              ))}
              <div><label className="block text-small font-medium mb-2 text-ink-secondary">Role</label><select value={selectedUser.role || 'student'} onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })} className={inputCls}><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option></select></div>
            </div>
            <div className="px-6 py-4 border-t border-surface-subtle flex gap-3">
              <button onClick={handleUpdate} className="flex-1 h-11 rounded-md bg-brand text-white font-medium transition-all hover:bg-brand-light">Save Changes</button>
              <button onClick={() => setShowEditModal(false)} className="flex-1 h-11 rounded-md border border-ink-faint/40 font-medium text-brand transition-all hover:bg-surface-subtle">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
