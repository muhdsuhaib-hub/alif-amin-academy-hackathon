import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API}/admin/stats`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F3D2E]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F5EF' }}>
      <nav className="bg-white border-b" style={{ borderColor: 'rgba(4, 78, 66, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8" style={{ color: '#0F3D2E' }} />
            <span className="text-2xl font-medium" style={{ color: '#0F3D2E' }}>Alif Amin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: '#5A5A5A' }}>{user?.name} (Admin)</span>
            <button
              data-testid="logout-button"
              onClick={handleLogout}
              className="flex items-center gap-2 h-10 px-4 rounded-full border border-[#0F3D2E] border-opacity-20 text-[#0F3D2E] hover:bg-[#0F3D2E] hover:bg-opacity-5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-medium mb-2" style={{ color: '#0F3D2E' }}>Admin Dashboard</h1>
          <p style={{ color: '#5A5A5A' }}>Manage your academy operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div data-testid="stat-card-students" className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0F3D2E' }}>
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Total Students</p>
                <p className="text-2xl font-medium" style={{ color: '#0F3D2E' }}>
                  {stats?.total_students || 0}
                </p>
              </div>
            </div>
          </div>

          <div data-testid="stat-card-teachers" className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#D4AF37' }}>
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Active Teachers</p>
                <p className="text-2xl font-medium" style={{ color: '#0F3D2E' }}>
                  {stats?.total_teachers || 0}
                </p>
              </div>
            </div>
          </div>

          <div data-testid="stat-card-bookings" className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E76F51' }}>
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Total Bookings</p>
                <p className="text-2xl font-medium" style={{ color: '#0F3D2E' }}>
                  {stats?.total_bookings || 0}
                </p>
              </div>
            </div>
          </div>

          <div data-testid="stat-card-this-month" className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2EB6A0' }}>
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>This Month</p>
                <p className="text-2xl font-medium" style={{ color: '#0F3D2E' }}>
                  {stats?.bookings_this_month || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-soft">
          <h2 className="text-2xl font-medium mb-6" style={{ color: '#0F3D2E' }}>Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              data-testid="view-students-button"
              className="p-6 rounded-2xl border-2 border-[#0F3D2E] border-opacity-20 text-left hover:border-opacity-100 hover:bg-[#0F3D2E] hover:bg-opacity-5 transition-all"
            >
              <Users className="w-8 h-8 mb-3" style={{ color: '#0F3D2E' }} />
              <h3 className="text-lg font-medium mb-1" style={{ color: '#0F3D2E' }}>Manage Students</h3>
              <p className="text-sm" style={{ color: '#5A5A5A' }}>View and manage student accounts</p>
            </button>

            <button
              data-testid="view-teachers-button"
              className="p-6 rounded-2xl border-2 border-[#0F3D2E] border-opacity-20 text-left hover:border-opacity-100 hover:bg-[#0F3D2E] hover:bg-opacity-5 transition-all"
            >
              <Users className="w-8 h-8 mb-3" style={{ color: '#D4AF37' }} />
              <h3 className="text-lg font-medium mb-1" style={{ color: '#0F3D2E' }}>Manage Teachers</h3>
              <p className="text-sm" style={{ color: '#5A5A5A' }}>Add or update teacher profiles</p>
            </button>

            <button
              data-testid="view-bookings-button"
              className="p-6 rounded-2xl border-2 border-[#0F3D2E] border-opacity-20 text-left hover:border-opacity-100 hover:bg-[#0F3D2E] hover:bg-opacity-5 transition-all"
            >
              <Calendar className="w-8 h-8 mb-3" style={{ color: '#E76F51' }} />
              <h3 className="text-lg font-medium mb-1" style={{ color: '#0F3D2E' }}>View Bookings</h3>
              <p className="text-sm" style={{ color: '#5A5A5A' }}>Master calendar and booking management</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
