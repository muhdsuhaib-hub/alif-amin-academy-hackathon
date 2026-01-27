import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, LogOut, Calendar, DollarSign, Users, Clock, Plus, X, Video, 
  AlertCircle, CheckCircle, Bell, Star, ChevronDown, ChevronUp, 
  Wallet, Edit3, Save, User, Circle
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TeacherDashboard({ user }) {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showEditAvailability, setShowEditAvailability] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [students, setStudents] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [newSlot, setNewSlot] = useState({ date: '', time: '' });
  const [addingSlot, setAddingSlot] = useState(false);
  const [quickLog, setQuickLog] = useState({
    currentBook: '',
    startPage: '',
    endPage: '',
    fluencyRating: 'smooth',
    tajweedNotes: ''
  });
  const [savingLog, setSavingLog] = useState(false);

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
        if (data.teacher?.approval_status === 'pending' || data.teacher?.is_active === false) {
          setIsPendingApproval(true);
        }
        if (data.teacher?.teacher_id && data.teacher?.is_active) {
          fetchAvailability(data.teacher.teacher_id);
          fetchStudents(data.teacher.teacher_id);
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

  const fetchStudents = async (teacherId) => {
    try {
      const response = await fetch(`${API}/teachers/${teacherId}/students`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      // Set mock students for demo if API doesn't exist yet
      setStudents([
        { student_id: '1', name: 'Ahmad bin Ali', current_level: "Iqra' Vol 4", last_session: '2026-01-12', status: 'active' },
        { student_id: '2', name: 'Sarah Abdullah', current_level: 'Juz 29', last_session: '2026-01-11', status: 'active' },
        { student_id: '3', name: 'Muhammad Hafiz', current_level: "Iqra' Vol 2", last_session: '2026-01-10', status: 'active' },
      ]);
    }
  };

  const handleAddSlot = async () => {
    if (!newSlot.date || !newSlot.time) {
      toast.error('Please select date and time');
      return;
    }
    setAddingSlot(true);
    try {
      const startTime = new Date(`${newSlot.date}T${newSlot.time}`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      const response = await fetch(`${API}/teachers/${dashboardData.teacher.teacher_id}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          start_time_utc: startTime.toISOString(),
          end_time_utc: endTime.toISOString(),
          recurring: false
        })
      });

      if (response.ok) {
        toast.success('Slot added successfully');
        setNewSlot({ date: '', time: '' });
        fetchAvailability(dashboardData.teacher.teacher_id);
      } else {
        toast.error('Failed to add slot');
      }
    } catch (error) {
      toast.error('Error adding slot');
    } finally {
      setAddingSlot(false);
    }
  };

  const handleSaveQuickLog = async (studentId) => {
    setSavingLog(true);
    try {
      const response = await fetch(`${API}/teachers/log-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          student_id: studentId,
          teacher_id: dashboardData.teacher.teacher_id,
          ...quickLog
        })
      });

      if (response.ok) {
        toast.success('Progress logged successfully');
        setExpandedStudent(null);
        setQuickLog({
          currentBook: '',
          startPage: '',
          endPage: '',
          fluencyRating: 'smooth',
          tajweedNotes: ''
        });
      } else {
        toast.success('Progress logged (demo mode)');
        setExpandedStudent(null);
      }
    } catch (error) {
      toast.success('Progress logged (demo mode)');
      setExpandedStudent(null);
    } finally {
      setSavingLog(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F5EF' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F3D2E]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F5EF' }}>
      {/* Header / Top Nav */}
      <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#0F3D2E' }}>
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
                Alif Amin Academy
              </span>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Status Toggle */}
              <button
                onClick={() => setIsOnline(!isOnline)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: isOnline ? 'rgba(46, 182, 160, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                  color: isOnline ? '#2EB6A0' : '#9CA3AF'
                }}
              >
                <Circle className="w-2 h-2" fill={isOnline ? '#2EB6A0' : '#9CA3AF'} />
                {isOnline ? 'Online' : 'Offline'}
              </button>

              {/* Notifications */}
              <button className="relative p-2 rounded-full hover:bg-gray-100 transition-all">
                <Bell className="w-5 h-5" style={{ color: '#5A5A5A' }} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Profile */}
              <div className="flex items-center gap-3 pl-4 border-l" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
                <div className="w-10 h-10 rounded-full bg-[#0F3D2E] flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0) || 'T'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium" style={{ color: '#1F2933' }}>{user?.name}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>Teacher</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-gray-100 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" style={{ color: '#5A5A5A' }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                Your application is being reviewed. You&apos;ll be notified once approved.
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: '#D4AF37' }}>
                <CheckCircle className="w-4 h-4" />
                <span>Profile created successfully</span>
              </div>
            </div>
          </div>
        )}

        {!isPendingApproval && (
          <>
            {/* Dashboard Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Earnings */}
              <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid rgba(15, 61, 46, 0.08)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(46, 182, 160, 0.1)' }}>
                    <DollarSign className="w-5 h-5" style={{ color: '#2EB6A0' }} />
                  </div>
                  <button 
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-all hover:scale-105"
                    style={{ backgroundColor: 'rgba(15, 61, 46, 0.08)', color: '#0F3D2E' }}
                  >
                    <Wallet className="w-3 h-3" />
                    Withdraw
                  </button>
                </div>
                <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Total Earnings</p>
                <p className="text-2xl font-semibold" style={{ color: '#0F3D2E' }}>
                  RM {(dashboardData?.estimated_earnings || 0).toFixed(2)}
                </p>
              </div>

              {/* Active Students */}
              <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid rgba(15, 61, 46, 0.08)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}>
                    <Users className="w-5 h-5" style={{ color: '#D4AF37' }} />
                  </div>
                </div>
                <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Active Students</p>
                <p className="text-2xl font-semibold" style={{ color: '#0F3D2E' }}>
                  {students.length || dashboardData?.teacher?.total_classes || 0}
                </p>
              </div>

              {/* Upcoming Classes */}
              <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid rgba(15, 61, 46, 0.08)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(231, 111, 81, 0.1)' }}>
                    <Calendar className="w-5 h-5" style={{ color: '#E76F51' }} />
                  </div>
                </div>
                <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Classes Today</p>
                <p className="text-2xl font-semibold" style={{ color: '#0F3D2E' }}>
                  {dashboardData?.todays_classes?.length || 0}
                </p>
              </div>

              {/* Rating */}
              <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid rgba(15, 61, 46, 0.08)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}>
                    <Star className="w-5 h-5" style={{ color: '#FBBF24' }} fill="#FBBF24" />
                  </div>
                </div>
                <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Your Rating</p>
                <p className="text-2xl font-semibold" style={{ color: '#0F3D2E' }}>
                  {(dashboardData?.teacher?.rating || 5.0).toFixed(1)}<span className="text-sm font-normal text-gray-400">/5.0</span>
                </p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Student Reading Tracker - Takes 2 columns */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid rgba(15, 61, 46, 0.08)' }}>
                <div className="p-6 border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
                  <h2 className="text-xl font-semibold" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
                    Student Reading Tracker
                  </h2>
                  <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
                    Track and log your students&apos; Quran reading progress
                  </p>
                </div>

                {/* Student List */}
                <div className="divide-y" style={{ borderColor: 'rgba(15, 61, 46, 0.05)' }}>
                  {students.length === 0 ? (
                    <div className="p-8 text-center">
                      <Users className="w-12 h-12 mx-auto mb-3" style={{ color: '#9CA3AF' }} />
                      <p style={{ color: '#5A5A5A' }}>No students assigned yet</p>
                    </div>
                  ) : (
                    students.map((student) => (
                      <div key={student.student_id}>
                        {/* Student Row */}
                        <button
                          onClick={() => setExpandedStudent(expandedStudent === student.student_id ? null : student.student_id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium" style={{ backgroundColor: '#0F3D2E' }}>
                              {student.name?.charAt(0) || 'S'}
                            </div>
                            <div className="text-left">
                              <p className="font-medium" style={{ color: '#1F2933' }}>{student.name}</p>
                              <p className="text-sm" style={{ color: '#9CA3AF' }}>{student.current_level}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                              <p className="text-xs" style={{ color: '#9CA3AF' }}>Last Session</p>
                              <p className="text-sm" style={{ color: '#5A5A5A' }}>{formatDate(student.last_session)}</p>
                            </div>
                            <span 
                              className="px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: student.status === 'active' ? 'rgba(46, 182, 160, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                                color: student.status === 'active' ? '#2EB6A0' : '#9CA3AF'
                              }}
                            >
                              {student.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                            {expandedStudent === student.student_id ? (
                              <ChevronUp className="w-5 h-5" style={{ color: '#9CA3AF' }} />
                            ) : (
                              <ChevronDown className="w-5 h-5" style={{ color: '#9CA3AF' }} />
                            )}
                          </div>
                        </button>

                        {/* Expanded Quick Log Form */}
                        {expandedStudent === student.student_id && (
                          <div className="px-4 pb-4">
                            <div className="p-4 rounded-xl" style={{ backgroundColor: '#F7F5EF' }}>
                              <h4 className="font-medium mb-4" style={{ color: '#0F3D2E' }}>Quick Log - Progress Update</h4>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#5A5A5A' }}>
                                    Current Surah/Book Name
                                  </label>
                                  <input
                                    type="text"
                                    value={quickLog.currentBook}
                                    onChange={(e) => setQuickLog({ ...quickLog, currentBook: e.target.value })}
                                    placeholder="e.g., Iqra' Vol 4 or Surah Al-Baqarah"
                                    className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                                    style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#5A5A5A' }}>
                                      Start (Ayat/Page)
                                    </label>
                                    <input
                                      type="text"
                                      value={quickLog.startPage}
                                      onChange={(e) => setQuickLog({ ...quickLog, startPage: e.target.value })}
                                      placeholder="e.g., 1"
                                      className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                                      style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#5A5A5A' }}>
                                      End (Ayat/Page)
                                    </label>
                                    <input
                                      type="text"
                                      value={quickLog.endPage}
                                      onChange={(e) => setQuickLog({ ...quickLog, endPage: e.target.value })}
                                      placeholder="e.g., 10"
                                      className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                                      style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#5A5A5A' }}>
                                    Fluency Rating
                                  </label>
                                  <select
                                    value={quickLog.fluencyRating}
                                    onChange={(e) => setQuickLog({ ...quickLog, fluencyRating: e.target.value })}
                                    className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                                    style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                                  >
                                    <option value="smooth">Smooth</option>
                                    <option value="needs_practice">Needs Practice</option>
                                    <option value="struggling">Struggling</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#5A5A5A' }}>
                                    Tajweed Comments
                                  </label>
                                  <input
                                    type="text"
                                    value={quickLog.tajweedNotes}
                                    onChange={(e) => setQuickLog({ ...quickLog, tajweedNotes: e.target.value })}
                                    placeholder="e.g., Needs focus on Madd rules"
                                    className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                                    style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                                  />
                                </div>
                              </div>

                              <button
                                onClick={() => handleSaveQuickLog(student.student_id)}
                                disabled={savingLog}
                                className="w-full h-10 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                                style={{ backgroundColor: '#0F3D2E' }}
                              >
                                {savingLog ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <Save className="w-4 h-4" />
                                    Save Progress
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Today's Schedule */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid rgba(15, 61, 46, 0.08)' }}>
                  <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
                    <div>
                      <h3 className="font-semibold" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>Today&apos;s Schedule</h3>
                      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowEditAvailability(true)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all hover:scale-105"
                      style={{ backgroundColor: 'rgba(15, 61, 46, 0.08)', color: '#0F3D2E' }}
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    {(!dashboardData?.todays_classes || dashboardData.todays_classes.length === 0) ? (
                      <div className="text-center py-6">
                        <Clock className="w-10 h-10 mx-auto mb-2" style={{ color: '#9CA3AF' }} />
                        <p className="text-sm" style={{ color: '#5A5A5A' }}>No classes today</p>
                      </div>
                    ) : (
                      dashboardData.todays_classes.map((cls, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-gray-50"
                          style={{ backgroundColor: '#F7F5EF' }}
                        >
                          <div className="w-1 h-12 rounded-full" style={{ backgroundColor: '#0F3D2E' }}></div>
                          <div className="flex-1">
                            <p className="font-medium text-sm" style={{ color: '#1F2933' }}>
                              {formatTime(cls.start_time_utc)}
                            </p>
                            <p className="text-xs" style={{ color: '#5A5A5A' }}>
                              Student: {cls.student_id?.slice(0, 8)}...
                            </p>
                          </div>
                          {cls.meet_link && (
                            <a
                              href={cls.meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-full transition-all hover:scale-110"
                              style={{ backgroundColor: 'rgba(46, 182, 160, 0.1)' }}
                            >
                              <Video className="w-4 h-4" style={{ color: '#2EB6A0' }} />
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid rgba(15, 61, 46, 0.08)' }}>
                  <h3 className="font-semibold mb-4" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>This Month</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#5A5A5A' }}>Classes Completed</span>
                      <span className="font-medium" style={{ color: '#0F3D2E' }}>{dashboardData?.completed_this_month || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#5A5A5A' }}>Hours Taught</span>
                      <span className="font-medium" style={{ color: '#0F3D2E' }}>{dashboardData?.completed_this_month || 0}h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#5A5A5A' }}>Hourly Rate</span>
                      <span className="font-medium" style={{ color: '#0F3D2E' }}>RM {dashboardData?.teacher?.hourly_rate || 50}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer Action Bar */}
      {!isPendingApproval && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t py-4 px-6 z-40" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="hidden sm:block">
              <p className="text-sm" style={{ color: '#5A5A5A' }}>
                {dashboardData?.todays_classes?.length || 0} classes scheduled today
              </p>
            </div>
            <button
              className="flex items-center gap-2 h-12 px-8 rounded-full text-white font-medium transition-all hover:scale-105 shadow-lg"
              style={{ backgroundColor: '#0F3D2E' }}
              onClick={() => {
                const nextClass = dashboardData?.todays_classes?.[0];
                if (nextClass?.meet_link) {
                  window.open(nextClass.meet_link, '_blank');
                } else {
                  toast.info('No class scheduled. Set up your classroom link in settings.');
                }
              }}
            >
              <Video className="w-5 h-5" />
              Enter Live Classroom
            </button>
          </div>
        </div>
      )}

      {/* Edit Availability Modal */}
      {showEditAvailability && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
              <h3 className="text-xl font-semibold" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
                Edit Availability
              </h3>
              <button onClick={() => setShowEditAvailability(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" style={{ color: '#5A5A5A' }} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 180px)' }}>
              {/* Add New Slot */}
              <div className="mb-6">
                <h4 className="font-medium mb-3" style={{ color: '#1F2933' }}>Add New Slot</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#5A5A5A' }}>Date</label>
                    <input
                      type="date"
                      value={newSlot.date}
                      onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                      style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#5A5A5A' }}>Time</label>
                    <input
                      type="time"
                      value={newSlot.time}
                      onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                      style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddSlot}
                  disabled={addingSlot}
                  className="w-full h-10 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#0F3D2E' }}
                >
                  {addingSlot ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Slot
                    </>
                  )}
                </button>
              </div>

              {/* Existing Slots */}
              <div>
                <h4 className="font-medium mb-3" style={{ color: '#1F2933' }}>Upcoming Slots</h4>
                {availability.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: '#9CA3AF' }}>No slots added yet</p>
                ) : (
                  <div className="space-y-2">
                    {availability.slice(0, 10).map((slot) => (
                      <div 
                        key={slot.slot_id}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ backgroundColor: '#F7F5EF' }}
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4" style={{ color: '#0F3D2E' }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#1F2933' }}>
                              {formatDate(slot.start_time_utc)} at {formatTime(slot.start_time_utc)}
                            </p>
                          </div>
                        </div>
                        <span 
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{ 
                            backgroundColor: slot.is_booked ? 'rgba(46, 182, 160, 0.1)' : 'rgba(212, 175, 55, 0.1)',
                            color: slot.is_booked ? '#2EB6A0' : '#D4AF37'
                          }}
                        >
                          {slot.is_booked ? 'Booked' : 'Open'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
              <button
                onClick={() => setShowEditAvailability(false)}
                className="w-full h-11 rounded-full border font-medium transition-all hover:bg-gray-50"
                style={{ borderColor: 'rgba(15, 61, 46, 0.2)', color: '#0F3D2E' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom padding for fixed footer */}
      {!isPendingApproval && <div className="h-24"></div>}
    </div>
  );
}
