import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Calendar, DollarSign, Users, User } from 'lucide-react';
import { PageLoader } from '../components/Spinner';
import LayoutShell from '../components/layout/LayoutShell';
import { DashboardOverview, EarningsWallet, AvailabilityCalendar, StudentManagement, ProfileManagement } from '../components/teacher';
import SupportModal from '../components/SupportModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MENU_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'availability', label: 'Availability', icon: Calendar },
  { id: 'earnings', label: 'Earnings', icon: DollarSign },
  { id: 'students', label: 'My Students', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
];

const TAB_TITLES = {
  home: 'Dashboard',
  availability: 'Availability Manager',
  earnings: 'Earnings & Wallet',
  students: 'My Students',
  profile: 'Profile Settings',
};

export default function TeacherDashboard({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/teacher/dashboard-data`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (error) { console.error('Dashboard data error:', error); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (user?.user_id) fetchDashboardData();
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

  return (
    <>
      <LayoutShell
        menuItems={MENU_ITEMS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabTitles={TAB_TITLES}
        user={user}
        userRole="teacher"
        roleBadge="Teacher"
        onLogout={handleLogout}
        onOpenSupport={() => setShowSupportModal(true)}
      >
        {activeTab === 'home' && <DashboardOverview dashboardData={dashboardData} onNavigateTab={setActiveTab} />}
        {activeTab === 'availability' && <AvailabilityCalendar teacherId={teacherId} />}
        {activeTab === 'earnings' && <EarningsWallet dashboardData={dashboardData} user={user} onRefresh={fetchDashboardData} />}
        {activeTab === 'students' && <StudentManagement teacherId={teacherId} />}
        {activeTab === 'profile' && <ProfileManagement user={user} teacher={dashboardData?.teacher} onRefresh={fetchDashboardData} />}
      </LayoutShell>
      <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} user={user} />
    </>
  );
}
