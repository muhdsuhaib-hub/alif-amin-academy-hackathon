import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, AlertCircle, CheckCircle, Video } from 'lucide-react';
import { toast } from 'sonner';
import NotificationBell from '../components/NotificationBell';
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

const SECTION_TITLES = {
  dashboard: 'Dashboard',
  wallet: 'Earnings Wallet',
  availability: 'Availability',
  classroom: 'Classroom Tools',
  students: 'Student Management',
  profile: 'Profile',
};

export default function TeacherDashboard({ user }) {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [students, setStudents] = useState([]);
  const [commissionInfo, setCommissionInfo] = useState(null);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchCommissionInfo = async (teacherId) => {
    try {
      const response = await fetch(`${API}/commission/tutor/${teacherId}`, { credentials: 'include' });
      if (response.ok) setCommissionInfo(await response.json());
    } catch (error) { console.error('Error fetching commission info:', error); }
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API}/teachers/dashboard`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        if (data.teacher?.approval_status === 'pending' || data.teacher?.is_active === false) setIsPendingApproval(true);
        if (data.teacher?.teacher_id && data.teacher?.is_active) {
          fetchStudents(data.teacher.teacher_id);
          fetchCommissionInfo(data.teacher.teacher_id);
        }
      }
    } catch (error) { console.error('Error fetching dashboard:', error); }
    finally { setLoading(false); }
  };

  const fetchStudents = async (teacherId) => {
    try {
      const response = await fetch(`${API}/teachers/${teacherId}/students`, { credentials: 'include' });
      if (response.ok) { const data = await response.json(); setStudents(data.students || []); }
    } catch (error) {
      setStudents([
        { student_id: '1', name: 'Ahmad bin Ali', current_level: "Iqra' Vol 4", last_session: '2026-01-25', status: 'active' },
        { student_id: '2', name: 'Sarah Abdullah', current_level: 'Juz 29', last_session: '2026-01-20', status: 'active' },
      ]);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
      document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      navigate('/');
    } catch (error) { console.error('Logout error:', error); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0F3D2E] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isPendingApproval) {
    return (
      <div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center p-4">
        <div className="apple-card p-10 max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#C8A951]/10 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-7 h-7 text-[#C8A951]" />
          </div>
          <h2 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight mb-2">Application Under Review</h2>
          <p className="text-gray-500 text-[15px] leading-relaxed mb-6">
            Thank you for registering! Your application is being reviewed by our team. You'll receive an email once approved.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-[#34C759]">
            <CheckCircle className="w-4 h-4" />
            <span>Profile created successfully</span>
          </div>
          <button onClick={handleLogout} className="mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFD]">
      <TeacherSidebar activeSection={activeSection} setActiveSection={setActiveSection} isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[260px]'} pb-20 lg:pb-24`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-gray-200/60">
          <div className="h-16 flex items-center justify-between px-4 lg:px-8">
            <h1 className="text-[17px] font-semibold text-[#1D1D1F] tracking-tight">
              {SECTION_TITLES[activeSection]}
            </h1>
            <div className="flex items-center gap-2">
              <NotificationBell userId={user?.user_id} userRole="teacher" />
              <button onClick={handleLogout} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                <LogOut className="w-[18px] h-[18px] text-gray-400" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 animate-fade-in-up">
          {activeSection === 'dashboard' && <DashboardOverview teacherData={dashboardData} students={students} user={user} commissionInfo={commissionInfo} />}
          {activeSection === 'wallet' && <EarningsWallet teacherData={dashboardData?.teacher} commissionInfo={commissionInfo} user={user} />}
          {activeSection === 'availability' && <AvailabilityCalendar teacherData={dashboardData?.teacher} />}
          {activeSection === 'classroom' && <ClassroomTools teacherData={dashboardData?.teacher} students={students} />}
          {activeSection === 'students' && <StudentManagement teacherData={dashboardData?.teacher} students={students} setStudents={setStudents} />}
          {activeSection === 'profile' && <ProfileManagement teacherData={dashboardData?.teacher} user={user} />}
        </main>

        {/* Bottom CTA Bar */}
        <div className="hidden lg:block fixed bottom-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/60 px-8 py-3" style={{ left: sidebarCollapsed ? '68px' : '260px' }}>
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
              <span className="text-sm text-gray-500">Ready for your next class</span>
            </div>
            <button
              onClick={() => {
                const meetLink = dashboardData?.teacher?.meet_link;
                if (meetLink) window.open(meetLink, '_blank');
                else toast.error('Please add your Google Meet link in Profile settings');
              }}
              data-testid="enter-classroom-btn"
              className="apple-btn-primary gap-2"
            >
              <Video className="w-4 h-4" />
              Enter Classroom
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
