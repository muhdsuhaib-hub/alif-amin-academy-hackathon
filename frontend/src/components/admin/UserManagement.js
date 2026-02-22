import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Edit, Mail, Phone, Download, X, ChevronLeft, ChevronRight, Calendar, MapPin, LogIn, Ban, Wallet, MoreHorizontal, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Card from '../Card';
import Spinner from '../Spinner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getRoleBadgeCls = (role) => ({ admin: 'bg-rose-50 text-rose-700', teacher: 'bg-amber-50 text-amber-700' }[role] || 'bg-emerald-50 text-emerald-700');
const getStatusCls = (s) => ({ suspended: 'bg-red-50 text-red-600', active: 'bg-emerald-50 text-emerald-700' }[s] || 'bg-slate-50 text-slate-600');

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletBonusAmount, setWalletBonusAmount] = useState('');
  const [walletReason, setWalletReason] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinMode, setPinMode] = useState('verify'); // 'verify' or 'create'

  useEffect(() => { fetchUsers(); }, [page, filterRole, filterStatus]);
  useEffect(() => { const close = () => setOpenMenuId(null); window.addEventListener('click', close); return () => window.removeEventListener('click', close); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (filterRole) params.append('role', filterRole);
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);
      const r = await fetch(`${API}/admin/users/all?${params}`, { credentials: 'include' });
      if (r.ok) { const d = await r.json(); setUsers(d.users || []); setTotalPages(d.pages || 1); setTotalUsers(d.total || 0); }
    } catch (e) { console.error(e); toast.error('Failed to load users'); } finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchUsers(); };

  const handleImpersonate = async (u) => {
    try {
      const r = await fetch(`${API}/admin/users/${u.user_id}/impersonate`, { method: 'POST', credentials: 'include' });
      if (!r.ok) { toast.error('Failed to impersonate'); return; }
      const data = await r.json();
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const cookies = document.cookie.split(';').map(c => c.trim());
      const sessionCookie = cookies.find(c => c.startsWith('session_token='));
      const currentToken = sessionCookie ? sessionCookie.split('=')[1] : '';
      localStorage.setItem('admin_return_token', currentToken);
      localStorage.setItem('admin_return_user', JSON.stringify(currentUser));
      document.cookie = `session_token=${data.token}; path=/; SameSite=Lax`;
      localStorage.setItem('user', JSON.stringify(data.user));
      const route = data.user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
      toast.success(`Logged in as ${data.user.name}`);
      window.location.href = route;
    } catch { toast.error('Impersonation failed'); }
  };

  const handleSuspend = async (u) => {
    const action = u.status === 'suspended' ? 'activate' : 'suspend';
    if (!window.confirm(`${action === 'suspend' ? 'Suspend' : 'Activate'} ${u.name}?`)) return;
    try {
      const r = await fetch(`${API}/admin/users/${u.user_id}/suspend`, { method: 'POST', credentials: 'include' });
      if (r.ok) { const d = await r.json(); toast.success(`User ${d.status}`); fetchUsers(); }
      else toast.error('Failed');
    } catch { toast.error('Error'); }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      const r = await fetch(`${API}/admin/users/${deleteTarget.user_id}`, { method: 'DELETE', credentials: 'include' });
      if (r.ok) {
        toast.success(`${deleteTarget.name} permanently deleted`);
        setUsers(prev => prev.filter(u => u.user_id !== deleteTarget.user_id));
        setTotalUsers(prev => prev - 1);
        setShowDeleteModal(false);
        setDeleteTarget(null);
      } else {
        const e = await r.json();
        toast.error(e.detail || 'Delete failed');
      }
    } catch { toast.error('Error deleting user'); }
  };


  const handleEdit = (u) => { setSelectedUser({ ...u }); setWalletAmount(''); setWalletBonusAmount(''); setWalletReason(''); setShowEditModal(true); };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    try {
      const r = await fetch(`${API}/admin/users/${selectedUser.user_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(selectedUser) });
      if (r.ok) toast.success('User updated');
      else toast.error('Failed to update');
    } catch { toast.error('Error updating'); }

    if ((walletAmount && parseFloat(walletAmount) !== 0) || (walletBonusAmount && parseFloat(walletBonusAmount) !== 0)) {
      // Wallet adjustment requires PIN — open PIN modal
      setShowPinModal(true);
      return;
    }

    setShowEditModal(false);
    fetchUsers();
  };

  const executeWalletAdjust = async (pin) => {
    try {
      const r = await fetch(`${API}/admin/users/wallet-adjust`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ user_id: selectedUser.user_id, amount: parseFloat(walletAmount) || 0, bonus_amount: parseFloat(walletBonusAmount) || 0, reason: walletReason || 'Admin adjustment', admin_pin: pin }) });
      if (r.ok) { const d = await r.json(); toast.success(`Wallet adjusted. Paid: ${d.new_paid_credits}, Bonus: ${d.new_bonus_credits}, Total: ${d.new_credit_balance}`); setShowPinModal(false); setShowEditModal(false); fetchUsers(); }
      else {
        const e = await r.json();
        if (e.detail === 'PIN_NOT_SET') { setPinMode('create'); }
        else toast.error(e.detail || 'Failed');
      }
    } catch { toast.error('Error'); }
  };

  const handlePinSubmit = async (pin) => {
    if (pinMode === 'create') {
      try {
        const r = await fetch(`${API}/admin/admin-pin/set`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ pin }) });
        if (r.ok) { toast.success('PIN created'); executeWalletAdjust(pin); }
        else toast.error('Failed to create PIN');
      } catch { toast.error('Error'); }
    } else {
      executeWalletAdjust(pin);
    }
  };

  const exportToExcel = async () => {
    try {
      const params = new URLSearchParams({ page: '1', limit: '10000' });
      if (filterRole) params.append('role', filterRole);
      if (searchTerm) params.append('search', searchTerm);
      const r = await fetch(`${API}/admin/users/all?${params}`, { credentials: 'include' });
      if (!r.ok) throw new Error();
      const data = await r.json();
      const rows = [['Name','Email','Phone','Role','Status','Timezone','Created'].join(',')];
      (data.users || []).forEach(u => rows.push([u.name,u.email,u.phone,u.role,u.status||'active',u.timezone,u.created_at].map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(',')));
      const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `users_${new Date().toISOString().split('T')[0]}.csv`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      toast.success(`Exported ${data.users?.length || 0} users`);
    } catch { toast.error('Export failed'); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

  return (
    <div className="space-y-6" data-testid="user-management">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h2 className="text-lg font-bold text-slate-900">User Management</h2><p className="text-xs text-slate-500">{totalUsers} total users</p></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all" data-testid="filter-btn">
            <Filter className="w-3.5 h-3.5" />Filters{(filterRole || filterStatus) && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
          </button>
          <button onClick={exportToExcel} className="flex items-center gap-2 h-9 px-3 rounded-xl bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 transition-all" data-testid="export-btn">
            <Download className="w-3.5 h-3.5" />Export
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search name, email..." className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" data-testid="user-search-input" /></div>
          <button type="submit" className="h-10 px-5 rounded-xl bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-all">Search</button>
        </form>
        {showFilters && (
          <div className="border-t border-slate-100 pt-4 mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-600 focus:outline-none" data-testid="filter-role">
              <option value="">All Roles</option><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option>
            </select>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-600 focus:outline-none" data-testid="filter-status">
              <option value="">All Status</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="trial">Trial</option>
            </select>
            <button onClick={() => { setFilterRole(''); setFilterStatus(''); setSearchTerm(''); setPage(1); }} className="h-10 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50">Clear</button>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Spinner /></div>
        : users.length === 0 ? <div className="text-center py-12"><Users className="w-10 h-10 mx-auto mb-2 text-slate-200" /><p className="text-sm text-slate-400">No users found</p></div>
        : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead><tr className="border-b border-slate-100 bg-slate-50/80">{['User', 'Contact', 'Role', 'Status', 'Registered', 'Actions'].map((h, i) => <th key={i} className={`${i === 5 ? 'text-right' : 'text-left'} px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider`}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => (
                    <tr key={u.user_id} className="hover:bg-slate-50/50 transition-colors" data-testid={`user-row-${u.user_id}`}>
                      <td className="px-5 py-3"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{u.name?.charAt(0) || 'U'}</div><div className="min-w-0"><p className="text-sm font-medium text-slate-900 truncate">{u.name || 'Unknown'}</p></div></div></td>
                      <td className="px-5 py-3"><p className="text-xs text-slate-600 truncate max-w-[180px]">{u.email}</p>{u.phone && <p className="text-[10px] text-slate-400">{u.phone}</p>}</td>
                      <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize ${getRoleBadgeCls(u.role)}`}>{u.role || 'student'}</span></td>
                      <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize ${getStatusCls(u.status)}`}>{u.status || 'active'}</span></td>
                      <td className="px-5 py-3"><span className="text-xs text-slate-500">{formatDate(u.created_at)}</span></td>
                      <td className="px-5 py-3 text-right">
                        <div className="relative inline-block">
                          <button onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === u.user_id ? null : u.user_id); }} className="p-2 rounded-lg hover:bg-slate-100 transition-colors" data-testid={`user-actions-${u.user_id}`}>
                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                          </button>
                          {openMenuId === u.user_id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200/60 py-1 z-20 animate-fade-in" onClick={e => e.stopPropagation()} data-testid={`user-menu-${u.user_id}`}>
                              <button onClick={() => { handleImpersonate(u); setOpenMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors" data-testid={`impersonate-${u.user_id}`}>
                                <LogIn className="w-3.5 h-3.5 text-blue-500" />Login As User
                              </button>
                              <button onClick={() => { handleEdit(u); setOpenMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors" data-testid={`edit-user-${u.user_id}`}>
                                <Edit className="w-3.5 h-3.5 text-slate-400" />Edit User
                              </button>
                              {u.role === 'student' && (
                                <button onClick={() => { handleEdit(u); setOpenMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors" data-testid={`adjust-wallet-${u.user_id}`}>
                                  <Wallet className="w-3.5 h-3.5 text-emerald-500" />Adjust Wallet
                                </button>
                              )}
                              <div className="h-px bg-slate-100 my-1" />
                              <button onClick={() => { handleSuspend(u); setOpenMenuId(null); }} className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors ${u.status === 'suspended' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-600 hover:bg-red-50'}`} data-testid={`suspend-${u.user_id}`}>
                                {u.status === 'suspended' ? <><CheckCircle className="w-3.5 h-3.5" />Activate User</> : <><Ban className="w-3.5 h-3.5" />Suspend User</>}
                              </button>
                              <button onClick={() => { setDeleteTarget(u); setShowDeleteModal(true); setOpenMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-700 hover:bg-red-50 transition-colors border-t border-slate-100" data-testid={`delete-${u.user_id}`}>
                                <Trash2 className="w-3.5 h-3.5" />Delete Permanently
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Edit + Wallet Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()} data-testid="edit-user-modal">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Edit User</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[{ label: 'Full Name', key: 'name', type: 'text' }, { label: 'Email', key: 'email', type: 'email' }, { label: 'Phone', key: 'phone', type: 'tel' }].map(f => (
                <div key={f.key}><label className="block text-xs font-medium text-slate-500 mb-1.5">{f.label}</label><input type={f.type} value={selectedUser[f.key] || ''} onChange={e => setSelectedUser({ ...selectedUser, [f.key]: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" data-testid={`edit-${f.key}`} /></div>
              ))}
              <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Role</label><select value={selectedUser.role || 'student'} onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" data-testid="edit-role"><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option></select></div>

              {/* Wallet Adjustment Section (students only) */}
              {selectedUser.role === 'student' && (
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 mb-3"><Wallet className="w-4 h-4 text-emerald-600" /><p className="text-xs font-semibold text-slate-700">Wallet Adjustment</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[10px] text-slate-500 mb-1">Paid Credits (+ / -)</label><input type="number" step="0.01" value={walletAmount} onChange={e => setWalletAmount(e.target.value)} placeholder="e.g. 10 or -5" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" data-testid="wallet-amount" /></div>
                  <div><label className="block text-[10px] text-slate-500 mb-1">Bonus Credits (+ / -)</label><input type="number" step="0.01" value={walletBonusAmount} onChange={e => setWalletBonusAmount(e.target.value)} placeholder="e.g. 5 or -3" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" data-testid="wallet-bonus-amount" /></div>
                </div>
                <div className="mt-3"><label className="block text-[10px] text-slate-500 mb-1">Reason</label><input type="text" value={walletReason} onChange={e => setWalletReason(e.target.value)} placeholder="Refund, bonus, correction..." className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" data-testid="wallet-reason" /></div>
              </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={handleUpdate} className="flex-1 h-11 rounded-xl bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-all" data-testid="save-user-btn">Save Changes</button>
              <button onClick={() => setShowEditModal(false)} className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* PIN Modal for Wallet Adjust */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4" data-testid="wallet-pin-modal">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-sm font-bold text-slate-900">{pinMode === 'create' ? 'Create Security PIN' : 'Verify Admin PIN'}</h3><p className="text-[10px] text-slate-400 mt-1">Required to adjust wallet balance</p></div>
            <form onSubmit={e => { e.preventDefault(); handlePinSubmit(pinValue); }} className="p-6 space-y-4">
              <input type="password" maxLength={6} value={pinValue} onChange={e => setPinValue(e.target.value.replace(/\D/g, ''))} placeholder="6-digit PIN" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-lg text-center font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500/20" autoFocus data-testid="wallet-pin-input" />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 h-11 rounded-xl bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800">{pinMode === 'create' ? 'Create & Adjust' : 'Verify & Adjust'}</button>
                <button type="button" onClick={() => { setShowPinModal(false); setPinValue(''); }} className="flex-1 h-11 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4" data-testid="delete-user-modal">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete User Permanently?</h3>
              <p className="text-sm text-slate-500 mb-1">
                You are about to delete <span className="font-semibold text-slate-700">{deleteTarget.name}</span> ({deleteTarget.email}).
              </p>
              <p className="text-xs text-red-600 font-medium">
                This will permanently remove this user and all associated data. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }} className="flex-1 h-11 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors" data-testid="cancel-delete-btn">Cancel</button>
              <button onClick={handleDeleteUser} className="flex-1 h-11 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors" data-testid="confirm-delete-btn">Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
