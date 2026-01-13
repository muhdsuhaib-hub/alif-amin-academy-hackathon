import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, UserPlus, Edit, Trash2, Mail, Phone } from 'lucide-react';
import Modal from '../Modal';
import Input from '../Input';
import Select from '../Select';
import Button from '../Button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [page, filterRole]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (filterRole) params.append('role', filterRole);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${API}/admin/users/all?${params}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pages);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`${API}/admin/users/${selectedUser.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
          phone: selectedUser.phone
        })
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
    if (!window.confirm('Are you sure you want to delete this user?')) return;

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

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>User Management</h2>
          <p className="text-sm mt-1" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans', fontWeight: 300 }}>Manage all users, teachers, and students</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#9CA3AF' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name or email..."
              className="w-full h-11 pl-10 pr-4 rounded-lg border transition-all focus:outline-none focus:ring-2"
              style={{ borderColor: 'rgba(15, 61, 46, 0.2)', fontFamily: 'Cal Sans' }}
            />
          </div>
        </div>
        <Select
          value={filterRole}
          onChange={setFilterRole}
          options={[
            { value: '', label: 'All Roles' },
            { value: 'student', label: 'Students' },
            { value: 'teacher', label: 'Teachers' },
            { value: 'admin', label: 'Admins' }
          ]}
        />
        <Button onClick={handleSearch}>
          <Filter className="w-4 h-4 mr-2 inline" />
          Filter
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3D2E]"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead style={{ backgroundColor: '#F7F5EF' }}>
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr key={user.user_id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: 'rgba(15, 61, 46, 0.05)' }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white" style={{ backgroundColor: '#0F3D2E' }}>
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>{user.name}</p>
                        <p className="text-sm" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium capitalize" style={{
                      backgroundColor: user.role === 'admin' ? 'rgba(231, 111, 81, 0.1)' : user.role === 'teacher' ? 'rgba(200, 169, 81, 0.1)' : 'rgba(15, 61, 46, 0.1)',
                      color: user.role === 'admin' ? '#E76F51' : user.role === 'teacher' ? '#C8A951' : '#0F3D2E',
                      fontFamily: 'Cal Sans'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {user.email && (
                        <div className="flex items-center gap-2 text-sm" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans', fontWeight: 300 }}>
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center gap-2 text-sm" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans', fontWeight: 300 }}>
                          <Phone className="w-4 h-4" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                      backgroundColor: 'rgba(46, 182, 160, 0.1)',
                      color: '#2EB6A0',
                      fontFamily: 'Cal Sans'
                    }}>
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-all"
                      >
                        <Edit className="w-4 h-4" style={{ color: '#0F3D2E' }} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.user_id)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: '#E76F51' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="secondary"
            size="sm"
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            variant="secondary"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit Modal */}
      {selectedUser && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit User"
        >
          <div className="space-y-4">
            <Input
              label="Name"
              value={selectedUser.name}
              onChange={(val) => setSelectedUser({ ...selectedUser, name: val })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={selectedUser.email}
              onChange={(val) => setSelectedUser({ ...selectedUser, email: val })}
              required
            />
            <Input
              label="Phone"
              value={selectedUser.phone || ''}
              onChange={(val) => setSelectedUser({ ...selectedUser, phone: val })}
            />
            <Select
              label="Role"
              value={selectedUser.role}
              onChange={(val) => setSelectedUser({ ...selectedUser, role: val })}
              options={[
                { value: 'student', label: 'Student' },
                { value: 'teacher', label: 'Teacher' },
                { value: 'admin', label: 'Admin' }
              ]}
            />
            <div className="flex gap-3 pt-4">
              <Button onClick={handleUpdate} className="flex-1">
                Save Changes
              </Button>
              <Button onClick={() => setShowEditModal(false)} variant="secondary" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
