import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, AlertCircle, CheckCircle, Bell, Video } from 'lucide-react';
import { toast } from 'sonner';
import NotificationBell from '../components/NotificationBell';

// Import modular components
import {
  TeacherSidebar,
  EarningsWallet,
  AvailabilityCalendar,
  ClassroomTools,
  StudentManagement,
  ProfileManagement,
  DashboardOverview
} from '../components/teacher';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TeacherDashboard({ user }) {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [students, setStudents] = useState([]);
  const [commissionInfo, setCommissionInfo] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchCommissionInfo = async (teacherId) => {
    try {
      const response = await fetch(`${API}/commission/tutor/${teacherId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCommissionInfo(data);
      }
    } catch (error) {
      console.error('Error fetching commission info:', error);
    }
  };

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
          fetchStudents(data.teacher.teacher_id);
          fetchCommissionInfo(data.teacher.teacher_id);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
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
      // Mock students for demo
      setStudents([
        { student_id: '1', name: 'Ahmad bin Ali', current_level: "Iqra' Vol 4", last_session: '2026-01-25', status: 'active' },
        { student_id: '2', name: 'Sarah Abdullah', current_level: 'Juz 29', last_session: '2026-01-20', status: 'active' },
        { student_id: '3', name: 'Muhammad Hafiz', current_level: "Iqra' Vol 2", last_session: '2026-01-10', status: 'active' },
      ]);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F5EF' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F3D2E]"></div>
      </div>
    );
  }

  // Pending approval view
  if (isPendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F7F5EF' }}>
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
          <div className="w-16 h-16 rounded-full bg-[#D4AF37] bg-opacity-10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" style={{ color: '#D4AF37' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#0F3D2E' }}>Application Under Review</h2>
          <p className="text-gray-500 mb-6">
            Thank you for registering! Your application is being reviewed by our team. 
            You'll receive an email once approved.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#2EB6A0' }}>
            <CheckCircle className="w-4 h-4" />
            <span>Profile created successfully</span>
          </div>
          <button
            onClick={handleLogout}
            className="mt-6 text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F5EF' }}>
      {/* Sidebar */}
      <TeacherSidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        isCollapsed={sidebarCollapsed} 
        setIsCollapsed={setSidebarCollapsed} 
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white border-b px-6 py-4" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold" style={{ color: '#0F3D2E' }}>
                {activeSection === 'dashboard' && 'Dashboard'}
                {activeSection === 'wallet' && 'Earnings Wallet'}
                {activeSection === 'availability' && 'Availability'}
                {activeSection === 'classroom' && 'Classroom Tools'}
                {activeSection === 'students' && 'Student Management'}
                {activeSection === 'profile' && 'Profile'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell userId={user?.user_id} userRole="teacher" />
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all"
              >
                <LogOut className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {activeSection === 'dashboard' && (
            <DashboardOverview 
              teacherData={dashboardData} 
              students={students} 
              user={user} 
              commissionInfo={commissionInfo} 
            />
          )}
          
          {activeSection === 'wallet' && (
            <EarningsWallet 
              teacherData={dashboardData?.teacher} 
              commissionInfo={commissionInfo} 
              user={user} 
            />
          )}
          
          {activeSection === 'availability' && (
            <AvailabilityCalendar teacherData={dashboardData?.teacher} />
          )}
          
          {activeSection === 'classroom' && (
            <ClassroomTools 
              teacherData={dashboardData?.teacher} 
              students={students} 
            />
          )}
          
          {activeSection === 'students' && (
            <StudentManagement 
              teacherData={dashboardData?.teacher} 
              students={students} 
              setStudents={setStudents} 
            />
          )}
          
          {activeSection === 'profile' && (
            <ProfileManagement 
              teacherData={dashboardData?.teacher} 
              user={user} 
            />
          )}
        </div>

        {/* Footer with Join Classroom CTA */}
        <div className="fixed bottom-0 right-0 left-0 bg-white border-t p-4" style={{ 
          marginLeft: sidebarCollapsed ? '64px' : '256px',
          borderColor: 'rgba(15, 61, 46, 0.1)' 
        }}>
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-gray-600">Ready for your next class</span>
            </div>
            <button
              onClick={() => {
                const meetLink = dashboardData?.teacher?.meet_link;
                if (meetLink) {
                  window.open(meetLink, '_blank');
                } else {
                  toast.error('Please add your Google Meet link in Profile settings');
                }
              }}
              className="h-11 px-6 rounded-xl bg-[#0F3D2E] text-white font-medium flex items-center gap-2 transition-all hover:opacity-90"
              data-testid="enter-classroom-btn"
            >
              <Video className="w-5 h-5" />
              Enter Live Classroom
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
