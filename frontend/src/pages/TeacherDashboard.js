import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, Calendar, DollarSign, Users, Clock, Plus, X, Video, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TeacherDashboard({ user }) {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [newSlot, setNewSlot] = useState({
    date: '',
    time: '',
    recurring: false,
    recurrence_pattern: null
  });
  const [addingSlot, setAddingSlot] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');
  const [isPendingApproval, setIsPendingApproval] = useState(false);

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
        // Check if teacher is pending approval
        if (data.teacher?.approval_status === 'pending' || data.teacher?.is_active === false) {
          setIsPendingApproval(true);
        }
        // Fetch availability if we have teacher data and is approved
        if (data.teacher?.teacher_id && data.teacher?.is_active) {
          fetchAvailability(data.teacher.teacher_id);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async (teacherId) => {
    try {
      const response = await fetch(`${API}/teachers/${teacherId}/availability`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const handleAddSlot = async () => {
    if (!newSlot.date || !newSlot.time) {
      toast.error('Please select a date and time');
      return;
    }

    setAddingSlot(true);
    try {
      const startTime = new Date(`${newSlot.date}T${newSlot.time}`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour slot

      const response = await fetch(`${API}/teachers/${dashboardData.teacher.teacher_id}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          start_time_utc: startTime.toISOString(),
          end_time_utc: endTime.toISOString(),
          recurring: newSlot.recurring,
          recurrence_pattern: newSlot.recurrence_pattern
        })
      });

      if (response.ok) {
        toast.success('Availability slot added successfully');
        setShowAddSlot(false);
        setNewSlot({ date: '', time: '', recurring: false, recurrence_pattern: null });
        fetchAvailability(dashboardData.teacher.teacher_id);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to add slot');
      }
    } catch (error) {
      toast.error('Error adding availability slot');
    } finally {
      setAddingSlot(false);
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
        {/* Pending Approval Banner */}
        {isPendingApproval && (
          <div 
            className="mb-8 p-6 rounded-2xl flex items-start gap-4"
            style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)' }}
          >
            <AlertCircle className="w-6 h-6 mt-0.5" style={{ color: '#D4AF37' }} />
            <div>
              <h3 className="text-lg font-semibold mb-1" style={{ color: '#1F2933' }}>Application Under Review</h3>
              <p style={{ color: '#5A5A5A' }}>
                Thank you for registering as a teacher! Your application is currently being reviewed by our team. 
                You&apos;ll receive an email notification once your account is approved, and you&apos;ll be able to start teaching.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: '#D4AF37' }}>
                <CheckCircle className="w-4 h-4" />
                <span>Profile created successfully</span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-4xl font-medium mb-2" style={{ color: '#0F3D2E' }}>Teacher Dashboard</h1>
          <p style={{ color: '#5A5A5A' }}>
            {isPendingApproval ? 'Complete your profile while waiting for approval' : 'Manage your classes and track your earnings'}
          </p>
        </div>

        {!isPendingApproval && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div data-testid="stat-card-today" className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0F3D2E' }}>
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Today&apos;s Classes</p>
                <p className="text-2xl font-medium" style={{ color: '#0F3D2E' }}>
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
                <p className="text-2xl font-medium" style={{ color: '#0F3D2E' }}>
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
                <p className="text-2xl font-medium" style={{ color: '#0F3D2E' }}>
                  RM {dashboardData?.estimated_earnings?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('schedule')}
            className="px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'schedule' ? '#0F3D2E' : 'transparent',
              color: activeTab === 'schedule' ? 'white' : '#5A5A5A'
            }}
          >
            Today&apos;s Schedule
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className="px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'availability' ? '#0F3D2E' : 'transparent',
              color: activeTab === 'availability' ? 'white' : '#5A5A5A'
            }}
          >
            Manage Availability
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className="px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'info' ? '#0F3D2E' : 'transparent',
              color: activeTab === 'info' ? 'white' : '#5A5A5A'
            }}
          >
            My Info
          </button>
        </div>

        {activeTab === 'schedule' && (
          <div className="bg-white rounded-3xl p-8 shadow-soft">
            <h2 className="text-2xl font-medium mb-6" style={{ color: '#0F3D2E' }}>Today&apos;s Schedule</h2>

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
                        <p className="font-medium" style={{ color: '#0F3D2E' }}>
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
                          className="h-8 px-4 rounded-full bg-[#0F3D2E] text-white text-sm font-medium flex items-center gap-2 transition-all hover:scale-105"
                        >
                          <Video className="w-4 h-4" />
                          Join
                        </a>
                      )}
                    </div>
                    {booking.booking_type === 'trial' && (
                      <span className="inline-block text-xs px-2 py-1 rounded-full bg-[#D4AF37] bg-opacity-20 text-[#0F3D2E]">
                        Trial Class
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="bg-white rounded-3xl p-8 shadow-soft">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-medium" style={{ color: '#0F3D2E' }}>Manage Availability</h2>
                <p className="text-sm mt-1" style={{ color: '#5A5A5A' }}>Set your available time slots for students to book</p>
              </div>
              <button
                data-testid="add-slot-button"
                onClick={() => setShowAddSlot(true)}
                className="h-10 px-4 rounded-full bg-[#0F3D2E] text-white font-medium flex items-center gap-2 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Add Slot
              </button>
            </div>

            {availability.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
                <p style={{ color: '#5A5A5A' }}>No availability slots set</p>
                <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>Add time slots to allow students to book classes with you</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availability.map((slot, idx) => (
                  <div
                    key={slot.slot_id}
                    className="p-4 rounded-xl border flex justify-between items-center"
                    style={{ borderColor: slot.is_booked ? 'rgba(46, 182, 160, 0.3)' : 'rgba(4, 78, 66, 0.1)', backgroundColor: slot.is_booked ? 'rgba(46, 182, 160, 0.05)' : 'transparent' }}
                  >
                    <div className="flex items-center gap-4">
                      <Clock className="w-5 h-5" style={{ color: '#0F3D2E' }} />
                      <div>
                        <p className="font-medium" style={{ color: '#0F3D2E' }}>
                          {formatDateTime(slot.start_time_utc)}
                        </p>
                        <p className="text-sm" style={{ color: '#5A5A5A' }}>1 hour slot</p>
                      </div>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: slot.is_booked ? 'rgba(46, 182, 160, 0.1)' : 'rgba(200, 169, 81, 0.1)',
                        color: slot.is_booked ? '#2EB6A0' : '#C8A951'
                      }}
                    >
                      {slot.is_booked ? 'Booked' : 'Available'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && dashboardData?.teacher && (
          <div className="bg-white rounded-3xl p-8 shadow-soft">
            <h2 className="text-2xl font-medium mb-6" style={{ color: '#0F3D2E' }}>Teacher Info</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: '#F7F3E8' }}>
                <p className="text-sm mb-1" style={{ color: '#5A5A5A' }}>Hourly Rate</p>
                <p className="text-xl font-medium" style={{ color: '#0F3D2E' }}>
                  RM {dashboardData.teacher.hourly_rate}
                </p>
              </div>

              <div className="p-4 rounded-xl" style={{ backgroundColor: '#F7F3E8' }}>
                <p className="text-sm mb-1" style={{ color: '#5A5A5A' }}>Total Classes Taught</p>
                <p className="text-xl font-medium" style={{ color: '#0F3D2E' }}>
                  {dashboardData.teacher.total_classes}
                </p>
              </div>

              <div className="p-4 rounded-xl" style={{ backgroundColor: '#F7F3E8' }}>
                <p className="text-sm mb-1" style={{ color: '#5A5A5A' }}>Rating</p>
                <p className="text-xl font-medium" style={{ color: '#0F3D2E' }}>
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
                    style={{ color: '#0F3D2E' }}
                  >
                    {dashboardData.teacher.meet_link}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Slot Modal */}
        {showAddSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold" style={{ color: '#0F3D2E' }}>Add Availability Slot</h3>
                <button onClick={() => setShowAddSlot(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" style={{ color: '#5A5A5A' }} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Date</label>
                  <input
                    type="date"
                    data-testid="slot-date"
                    value={newSlot.date}
                    onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Time</label>
                  <input
                    type="time"
                    data-testid="slot-time"
                    value={newSlot.time}
                    onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={newSlot.recurring}
                    onChange={(e) => setNewSlot({ ...newSlot, recurring: e.target.checked, recurrence_pattern: e.target.checked ? 'weekly' : null })}
                    className="w-4 h-4 rounded border-gray-300 text-[#0F3D2E] focus:ring-[#0F3D2E]"
                  />
                  <label htmlFor="recurring" className="text-sm" style={{ color: '#5A5A5A' }}>
                    Make this a recurring weekly slot
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    data-testid="confirm-add-slot"
                    onClick={handleAddSlot}
                    disabled={addingSlot}
                    className="flex-1 h-11 rounded-full bg-[#0F3D2E] text-white font-medium transition-all hover:scale-105 disabled:opacity-50"
                  >
                    {addingSlot ? 'Adding...' : 'Add Slot'}
                  </button>
                  <button
                    onClick={() => setShowAddSlot(false)}
                    className="flex-1 h-11 rounded-full border font-medium transition-all hover:bg-gray-50"
                    style={{ borderColor: 'rgba(15, 61, 46, 0.2)', color: '#0F3D2E' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
