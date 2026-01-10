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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#044E42]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <nav className="bg-white border-b" style={{ borderColor: 'rgba(4, 78, 66, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8" style={{ color: '#044E42' }} />
            <span className="text-2xl font-medium" style={{ color: '#044E42' }}>Al-Ilm Academy</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: '#5A5A5A' }}>{user?.name} (Admin)</span>
            <button
              data-testid="logout-button"
              onClick={handleLogout}
              className="flex items-center gap-2 h-10 px-4 rounded-full border border-[#044E42] border-opacity-20 text-[#044E42] hover:bg-[#044E42] hover:bg-opacity-5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-medium mb-2" style={{ color: '#044E42' }}>Admin Dashboard</h1>
          <p style={{ color: '#5A5A5A' }}>Manage your academy operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div data-testid="stat-card-students" className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#044E42' }}>
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Total Students</p>
                <p className="text-2xl font-medium" style={{ color: '#044E42' }}>
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
                <p className="text-2xl font-medium" style={{ color: '#044E42' }}>
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
                <p className="text-2xl font-medium" style={{ color: '#044E42' }}>
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
                <p className="text-2xl font-medium" style={{ color: '#044E42' }}>
                  {stats?.bookings_this_month || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-soft">
          <h2 className="text-2xl font-medium mb-6" style={{ color: '#044E42' }}>Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              data-testid="view-students-button"
              className="p-6 rounded-2xl border-2 border-[#044E42] border-opacity-20 text-left hover:border-opacity-100 hover:bg-[#044E42] hover:bg-opacity-5 transition-all"
            >
              <Users className="w-8 h-8 mb-3" style={{ color: '#044E42' }} />
              <h3 className="text-lg font-medium mb-1" style={{ color: '#044E42' }}>Manage Students</h3>
              <p className="text-sm" style={{ color: '#5A5A5A' }}>View and manage student accounts</p>
            </button>

            <button
              data-testid="view-teachers-button"
              className="p-6 rounded-2xl border-2 border-[#044E42] border-opacity-20 text-left hover:border-opacity-100 hover:bg-[#044E42] hover:bg-opacity-5 transition-all"
            >
              <Users className="w-8 h-8 mb-3" style={{ color: '#D4AF37' }} />
              <h3 className="text-lg font-medium mb-1" style={{ color: '#044E42' }}>Manage Teachers</h3>
              <p className="text-sm" style={{ color: '#5A5A5A' }}>Add or update teacher profiles</p>
            </button>

            <button
              data-testid="view-bookings-button"
              className="p-6 rounded-2xl border-2 border-[#044E42] border-opacity-20 text-left hover:border-opacity-100 hover:bg-[#044E42] hover:bg-opacity-5 transition-all"
            >
              <Calendar className="w-8 h-8 mb-3" style={{ color: '#E76F51' }} />
              <h3 className="text-lg font-medium mb-1" style={{ color: '#044E42' }}>View Bookings</h3>
              <p className="text-sm" style={{ color: '#5A5A5A' }}>Master calendar and booking management</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
