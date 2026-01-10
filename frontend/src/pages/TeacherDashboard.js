import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, Calendar, DollarSign, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TeacherDashboard({ user }) {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API}/teachers/dashboard`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
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

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <span className="text-sm" style={{ color: '#5A5A5A' }}>{user?.name}</span>
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
          <h1 className="text-4xl font-medium mb-2" style={{ color: '#044E42' }}>Teacher Dashboard</h1>
          <p style={{ color: '#5A5A5A' }}>Manage your classes and track your earnings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div data-testid="stat-card-today" className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#044E42' }}>
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Today's Classes</p>
                <p className="text-2xl font-medium" style={{ color: '#044E42' }}>
                  {dashboardData?.todays_classes?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div data-testid="stat-card-month" className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#D4AF37' }}>
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>This Month</p>
                <p className="text-2xl font-medium" style={{ color: '#044E42' }}>
                  {dashboardData?.completed_this_month || 0} classes
                </p>
              </div>
            </div>
          </div>

          <div data-testid="stat-card-earnings" className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E76F51' }}>
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Est. Earnings</p>
                <p className="text-2xl font-medium" style={{ color: '#044E42' }}>
                  RM {dashboardData?.estimated_earnings?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-soft">
            <h2 className="text-2xl font-medium mb-6" style={{ color: '#044E42' }}>Today's Schedule</h2>

            {!dashboardData?.todays_classes || dashboardData.todays_classes.length === 0 ? (
              <div data-testid="no-classes-today" className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
                <p style={{ color: '#5A5A5A' }}>No classes scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.todays_classes.map((booking, idx) => (
                  <div
                    key={idx}
                    data-testid={`class-${idx}`}
                    className="p-4 rounded-xl border" style={{ borderColor: 'rgba(4, 78, 66, 0.1)' }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium" style={{ color: '#044E42' }}>
                          {formatDateTime(booking.start_time_utc)}
                        </p>
                        <p className="text-sm" style={{ color: '#5A5A5A' }}>
                          Student ID: {booking.student_id}
                        </p>
                      </div>
                      {booking.meet_link && (
                        <a
                          data-testid={`meet-link-${idx}`}
                          href={booking.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 px-4 rounded-full bg-[#044E42] text-white text-sm font-medium flex items-center gap-2 transition-all hover:scale-105"
                        >
                          Join
                        </a>
                      )}
                    </div>
                    {booking.booking_type === 'trial' && (
                      <span className="inline-block text-xs px-2 py-1 rounded-full bg-[#D4AF37] bg-opacity-20 text-[#044E42]">
                        Trial Class
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-soft">
            <h2 className="text-2xl font-medium mb-6" style={{ color: '#044E42' }}>Teacher Info</h2>

            {dashboardData?.teacher && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ backgroundColor: '#F7F3E8' }}>
                  <p className="text-sm mb-1" style={{ color: '#5A5A5A' }}>Hourly Rate</p>
                  <p className="text-xl font-medium" style={{ color: '#044E42' }}>
                    RM {dashboardData.teacher.hourly_rate}
                  </p>
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: '#F7F3E8' }}>
                  <p className="text-sm mb-1" style={{ color: '#5A5A5A' }}>Total Classes Taught</p>
                  <p className="text-xl font-medium" style={{ color: '#044E42' }}>
                    {dashboardData.teacher.total_classes}
                  </p>
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: '#F7F3E8' }}>
                  <p className="text-sm mb-1" style={{ color: '#5A5A5A' }}>Rating</p>
                  <p className="text-xl font-medium" style={{ color: '#044E42' }}>
                    {dashboardData.teacher.rating.toFixed(1)} / 5.0
                  </p>
                </div>

                {dashboardData.teacher.meet_link && (
                  <div className="p-4 rounded-xl" style={{ backgroundColor: '#F7F3E8' }}>
                    <p className="text-sm mb-2" style={{ color: '#5A5A5A' }}>Your Google Meet Link</p>
                    <a
                      href={dashboardData.teacher.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm break-all"
                      style={{ color: '#044E42' }}
                    >
                      {dashboardData.teacher.meet_link}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
