import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, BookOpen, LogOut, Users, Clock, TrendingUp, Video } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function StudentDashboard({ user }) {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API}/students/dashboard`, {
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

  const canJoinClass = (startTime) => {
    const now = new Date();
    const classStart = new Date(startTime);
    const diff = classStart - now;
    return diff <= 5 * 60 * 1000 && diff > -60 * 60 * 1000;
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
      <nav className="bg-white border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-medium" style={{ color: '#0F3D2E' }}>Alif Amin Academy</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: '#5A5A5A' }}>{user?.name}</span>
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
          <h1 className="text-4xl font-medium mb-2" style={{ color: '#0F3D2E' }}>Welcome, {user?.name?.split(' ')[0]}</h1>
          <p style={{ color: '#5A5A5A' }}>Continue your Quran learning journey</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div data-testid="stat-card-classes" className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0F3D2E' }}>
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Total Classes</p>
                <p className="text-2xl font-medium" style={{ color: '#0F3D2E' }}>
                  {dashboardData?.progress?.total_classes_taken || 0}
                </p>
              </div>
            </div>
          </div>

          <div data-testid="stat-card-progress" className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#D4AF37' }}>
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Current Surah</p>
                <p className="text-2xl font-medium" style={{ color: '#0F3D2E' }}>
                  {dashboardData?.progress?.current_surah || 'Al-Fatiha'}
                </p>
              </div>
            </div>
          </div>

          <div data-testid="stat-card-completion" className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E76F51' }}>
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Progress</p>
                <p className="text-2xl font-medium" style={{ color: '#0F3D2E' }}>
                  {dashboardData?.progress?.completion_percentage?.toFixed(0) || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-8 shadow-soft">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-medium" style={{ color: '#0F3D2E' }}>Upcoming Classes</h2>
              <button
                data-testid="browse-teachers-button"
                onClick={() => navigate('/student/teachers')}
                className="text-sm font-medium" style={{ color: '#D4AF37' }}
              >
                Book New Class
              </button>
            </div>

            {!dashboardData?.upcoming_classes || dashboardData.upcoming_classes.length === 0 ? (
              <div data-testid="no-upcoming-classes" className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
                <p className="mb-4" style={{ color: '#5A5A5A' }}>No upcoming classes scheduled</p>
                <button
                  data-testid="book-first-class-button"
                  onClick={() => navigate('/student/teachers')}
                  className="h-10 px-6 rounded-full bg-[#0F3D2E] text-white font-medium transition-all hover:scale-105"
                >
                  Browse Teachers
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.upcoming_classes.map((booking, idx) => (
                  <div
                    key={idx}
                    data-testid={`upcoming-class-${idx}`}
                    className="p-4 rounded-xl border" style={{ borderColor: 'rgba(4, 78, 66, 0.1)' }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium" style={{ color: '#0F3D2E' }}>
                          {formatDateTime(booking.start_time_utc)}
                        </p>
                        <p className="text-sm" style={{ color: '#5A5A5A' }}>1 hour session</p>
                      </div>
                      {booking.meet_link && (
                        <a
                          data-testid={`join-class-button-${idx}`}
                          href={booking.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`h-8 px-4 rounded-full text-white text-sm font-medium flex items-center gap-2 transition-all hover:scale-105 ${canJoinClass(booking.start_time_utc) ? 'bg-[#2EB6A0]' : 'bg-[#D4AF37]'}`}
                        >
                          <Video className="w-4 h-4" />
                          {canJoinClass(booking.start_time_utc) ? 'Join Now' : 'Join Class'}
                        </a>
                      )}
                    </div>
                    {booking.booking_type === 'trial' && (
                      <span className="inline-block text-xs px-2 py-1 rounded-full bg-[#D4AF37] bg-opacity-20 text-[#0F3D2E]">
                        Free Trial
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-soft">
            <h2 className="text-2xl font-medium mb-6" style={{ color: '#0F3D2E' }}>Recent Classes</h2>

            {!dashboardData?.past_classes || dashboardData.past_classes.length === 0 ? (
              <div data-testid="no-past-classes" className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
                <p style={{ color: '#5A5A5A' }}>No past classes yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.past_classes.slice(0, 5).map((booking, idx) => (
                  <div
                    key={idx}
                    data-testid={`past-class-${idx}`}
                    className="p-4 rounded-xl" style={{ backgroundColor: '#F7F3E8' }}
                  >
                    <p className="font-medium mb-1" style={{ color: '#0F3D2E' }}>
                      {formatDateTime(booking.start_time_utc)}
                    </p>
                    <p className="text-sm" style={{ color: '#5A5A5A' }}>Completed</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-soft">
          <h2 className="text-2xl font-medium mb-6" style={{ color: '#0F3D2E' }}>Your Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span style={{ color: '#5A5A5A' }}>Current Surah: {dashboardData?.progress?.current_surah || 'Al-Fatiha'}</span>
                <span style={{ color: '#0F3D2E' }} className="font-medium">
                  {dashboardData?.progress?.verses_completed || 0} / {dashboardData?.progress?.total_verses_in_surah || 7} verses
                </span>
              </div>
              <div className="w-full h-3 rounded-full" style={{ backgroundColor: '#F7F3E8' }}>
                <div
                  className="h-3 rounded-full transition-all"
                  style={{
                    backgroundColor: '#0F3D2E',
                    width: `${(dashboardData?.progress?.verses_completed || 0) / (dashboardData?.progress?.total_verses_in_surah || 7) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
