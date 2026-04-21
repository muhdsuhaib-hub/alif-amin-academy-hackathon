import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Calendar, DollarSign, Users, User, Clock } from 'lucide-react';
import { PageLoader } from '../components/Spinner';
import LayoutShell from '../components/layout/LayoutShell';
import { DashboardOverview, EarningsWallet, AvailabilityCalendar, StudentManagement, ProfileManagement } from '../components/teacher';
import TeacherSessions from '../components/teacher/TeacherSessions';
import SupportModal from '../components/SupportModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MENU_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'sessions', label: 'Sessions', icon: Clock },
  { id: 'availability', label: 'Availability', icon: Calendar },
  { id: 'earnings', label: 'Earnings', icon: DollarSign },
  { id: 'students', label: 'My Students', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
];

const TAB_TITLES = {
  home: 'Dashboard',
  sessions: 'My Sessions',
  availability: 'Availability Manager',
  earnings: 'Earnings & Wallet',
  students: 'My Students',
  profile: 'Profile Settings',
};

export default function TeacherDashboard({ user, onUserUpdate }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/teacher/dashboard-data`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
        // Check if teacher is still pending approval
        const teacher = data?.teacher;
        if (teacher && (teacher.approval_status === 'pending' || teacher.is_active === false)) {
          setIsPending(true);
        }
      }
    } catch (error) { console.error('Dashboard data error:', error); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (user?.user_id) fetchDashboardData();
  }, [user?.user_id, fetchDashboardData]);

  // #6: Background polling for dashboard data (new bookings, class updates)
  useEffect(() => {
    if (!user?.user_id) return;
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [user?.user_id, fetchDashboardData]);

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
      document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      navigate('/');
    } catch (e) { console.error('Logout error:', e); }
  };

  if (loading) return <PageLoader />;

  const teacherId = dashboardData?.teacher?.teacher_id;

  // Block restricted tabs for pending teachers
  const RESTRICTED_TABS = ['availability', 'earnings', 'students'];
  const handleTabChange = (tab) => {
    if (isPending && RESTRICTED_TABS.includes(tab)) {
      return; // Block navigation for pending teachers
    }
    setActiveTab(tab);
  };

  // Pending approval locked screen
  const PendingScreen = () => (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center" data-testid="teacher-pending-screen">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-6">
        <Calendar className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Application Under Review</h2>
      <p className="text-sm text-slate-500 max-w-md mb-6">
        Your teaching application is pending Admin approval. You will receive an email once your profile has been verified. Thank you for your patience.
      </p>
      <div className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold">
        Status: Pending Approval
      </div>
    </div>
  );

  return (
    <>
      <LayoutShell
        menuItems={MENU_ITEMS}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        tabTitles={TAB_TITLES}
        user={user}
        userRole="teacher"
        roleBadge={isPending ? 'Pending' : 'Tutor'}
        onLogout={handleLogout}
        onOpenSupport={() => setShowSupportModal(true)}
      >
        {isPending && RESTRICTED_TABS.includes(activeTab) ? <PendingScreen /> : (
          <>
            {activeTab === 'home' && (isPending ? <PendingScreen /> : <DashboardOverview dashboardData={dashboardData} onNavigateTab={handleTabChange} />)}
            {activeTab === 'sessions' && <TeacherSessions />}
            {activeTab === 'availability' && <AvailabilityCalendar teacherId={teacherId} />}
            {activeTab === 'earnings' && <EarningsWallet dashboardData={dashboardData} user={user} onRefresh={fetchDashboardData} />}
            {activeTab === 'students' && <StudentManagement teacherId={teacherId} />}
            {activeTab === 'profile' && <ProfileManagement user={user} teacher={dashboardData?.teacher} onRefresh={fetchDashboardData} onUserUpdate={onUserUpdate} />}
          </>
        )}
      </LayoutShell>
      <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} user={user} />
    </>
  );
}
