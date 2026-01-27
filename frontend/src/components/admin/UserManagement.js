import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Edit, Trash2, Mail, Phone, Download, X, ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

  useEffect(() => {
    fetchUsers();
  }, [page, filterRole, filterStatus]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (filterRole) params.append('role', filterRole);
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);
      if (filterDateFrom) params.append('date_from', filterDateFrom);
      if (filterDateTo) params.append('date_to', filterDateTo);

      const response = await fetch(`${API}/admin/users/all?${params}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalPages(data.pages || 1);
        setTotalUsers(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleEdit = (user) => {
    setSelectedUser({ ...user });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`${API}/admin/users/${selectedUser.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(selectedUser)
      });

      if (response.ok) {
        toast.success('User updated successfully');
        setShowEditModal(false);
        fetchUsers();
      } else {
        toast.error('Failed to update user');
      }
    } catch (error) {
      toast.error('Error updating user');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`${API}/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        fetchUsers();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (error) {
      toast.error('Error deleting user');
    }
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      // Fetch all users for export
      const params = new URLSearchParams({ page: '1', limit: '10000' });
      if (filterRole) params.append('role', filterRole);
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);
      if (filterDateFrom) params.append('date_from', filterDateFrom);
      if (filterDateTo) params.append('date_to', filterDateTo);

      const response = await fetch(`${API}/admin/users/all?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      const allUsers = data.users || [];

      // Create CSV content
      const headers = ['Name', 'Email', 'Phone', 'Role', 'Auth Provider', 'Schedule Preference', 'Reading Level', 'Subscription Status', 'Timezone', 'Created At'];
      const csvRows = [headers.join(',')];

      allUsers.forEach(user => {
        const row = [
          `"${(user.name || '').replace(/"/g, '""')}"`,
          `"${(user.email || '').replace(/"/g, '""')}"`,
          `"${(user.phone || '').replace(/"/g, '""')}"`,
          `"${(user.role || '').replace(/"/g, '""')}"`,
          `"${(user.auth_provider || 'google').replace(/"/g, '""')}"`,
          `"${(user.schedule_preference || '').replace(/"/g, '""')}"`,
          `"${(user.reading_level || '').replace(/"/g, '""')}"`,
          `"${(user.subscription_status || '').replace(/"/g, '""')}"`,
          `"${(user.timezone || '').replace(/"/g, '""')}"`,
          `"${(user.created_at || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      
      // Create and download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allUsers.length} users to CSV`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export users');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setFilterRole('');
    setFilterStatus('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchTerm('');
    setPage(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return { backgroundColor: 'rgba(231, 111, 81, 0.1)', color: '#E76F51' };
      case 'teacher':
        return { backgroundColor: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37' };
      default:
        return { backgroundColor: 'rgba(46, 182, 160, 0.1)', color: '#2EB6A0' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: '#0F3D2E' }}>User Management</h2>
          <p className="text-sm text-gray-500">{totalUsers} total users</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl font-medium transition-all hover:bg-gray-100"
            style={{ border: '1px solid rgba(15, 61, 46, 0.2)', color: '#0F3D2E' }}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(filterRole || filterStatus || filterDateFrom || filterDateTo) && (
              <span className="w-2 h-2 rounded-full bg-[#E76F51]" />
            )}
          </button>
          <button
            onClick={exportToExcel}
            disabled={exporting}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#0F3D2E] text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export Excel
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border p-4" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full h-11 pl-12 pr-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
              style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
            />
          </div>
          <button
            type="submit"
            className="h-11 px-6 rounded-xl bg-[#0F3D2E] text-white font-medium transition-all hover:opacity-90"
          >
            Search
          </button>
        </form>

        {/* Filter Panel */}
        {showFilters && (
          <div className="border-t pt-4 mt-4" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium" style={{ color: '#1F2933' }}>Filter Options</h4>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Role Filter */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-600">Role</label>
                <select
                  value={filterRole}
                  onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
                  className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                >
                  <option value="">All Roles</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-600">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                  className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                >
                  <option value="">All Status</option>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-600">Registered From</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-600">Registered To</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                />
              </div>
            </div>
            <button
              onClick={() => { setPage(1); fetchUsers(); }}
              className="mt-4 h-10 px-6 rounded-xl bg-[#0F3D2E] text-white font-medium text-sm transition-all hover:opacity-90"
            >
              Apply Filters
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3D2E]"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Details</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Registered</th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'rgba(15, 61, 46, 0.05)' }}>
                  {users.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                            style={{ backgroundColor: '#0F3D2E' }}
                          >
                            {user.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-sm" style={{ color: '#1F2933' }}>{user.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-400">{user.auth_provider || 'google'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[180px]">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span 
                          className="px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                          style={getRoleBadgeStyle(user.role)}
                        >
                          {user.role || 'student'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs text-gray-500">
                          {user.schedule_preference && (
                            <p>Schedule: <span className="text-gray-700">{user.schedule_preference}</span></p>
                          )}
                          {user.reading_level && (
                            <p>Level: <span className="text-gray-700">{user.reading_level}</span></p>
                          )}
                          {user.timezone && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{user.timezone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(user.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-all"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.user_id)}
                            className="p-2 rounded-lg hover:bg-red-50 transition-all"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
              <p className="text-sm text-gray-500">
                Showing page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
              <h3 className="text-xl font-semibold" style={{ color: '#0F3D2E' }}>Edit User</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Full Name</label>
                <input
                  type="text"
                  value={selectedUser.name || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                  className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Email</label>
                <input
                  type="email"
                  value={selectedUser.email || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Phone</label>
                <input
                  type="tel"
                  value={selectedUser.phone || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                  className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Role</label>
                <select
                  value={selectedUser.role || 'student'}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                  className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Timezone</label>
                <input
                  type="text"
                  value={selectedUser.timezone || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, timezone: e.target.value })}
                  className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                />
              </div>
            </div>

            <div className="p-6 border-t flex gap-3" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
              <button
                onClick={handleUpdate}
                className="flex-1 h-11 rounded-xl bg-[#0F3D2E] text-white font-medium transition-all hover:opacity-90"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 h-11 rounded-xl border font-medium transition-all hover:bg-gray-50"
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
