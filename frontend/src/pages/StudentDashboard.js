import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Wallet, Calendar, User, TrendingUp } from 'lucide-react';
import { PageLoader } from '../components/Spinner';
import LayoutShell from '../components/layout/LayoutShell';
import { DashboardHome, WalletPage, MySchedule, AccountPage, BookingModal } from '../components/student';
import ProgressTracker from '../components/student/ProgressTracker';
import SupportModal from '../components/SupportModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MENU_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'account', label: 'Account', icon: User },
];

const TAB_TITLES = {
  home: 'Dashboard',
  progress: 'My Progress',
  wallet: 'Wallet',
  schedule: 'My Schedule',
  account: 'Account',
};

export default function StudentDashboard({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [dashboardData, setDashboardData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [studentId, setStudentId] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/students/dashboard-data`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
        setStudentId(data.student?.student_id);
        // Merge upcoming + past for booking-dependent tabs
        const all = [...(data.upcoming_classes || []), ...(data.past_classes || [])];
        setBookings(all);
      }
    } catch (error) { console.error('Dashboard data error:', error); }
    finally { setLoading(false); }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${API}/booking/my-bookings`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (error) { console.error('Bookings error:', error); }
  }, []);

  useEffect(() => {
    if (user?.user_id) {
      fetchDashboardData();
    }
  }, [user?.user_id, fetchDashboardData]);

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
      document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      navigate('/');
    } catch (e) { console.error('Logout error:', e); }
  };

  const handleBookingSuccess = () => {
    fetchDashboardData();
    fetchBookings();
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <LayoutShell menuItems={MENU_ITEMS} activeTab={activeTab} setActiveTab={setActiveTab} tabTitles={TAB_TITLES} user={user} userRole="student" onLogout={handleLogout} onOpenSupport={() => setShowSupportModal(true)}>
        {activeTab === 'home' && (
          <DashboardHome
            dashboardData={dashboardData}
            onOpenBooking={() => setShowBookingModal(true)}
            onNavigateTab={setActiveTab}
          />
        )}
        {activeTab === 'progress' && <ProgressTracker studentId={studentId} />}
        {activeTab === 'wallet' && <WalletPage user={user} />}
        {activeTab === 'schedule' && <MySchedule bookings={bookings} onRefresh={fetchBookings} onEdit={setEditingBooking} onOpenBooking={() => setShowBookingModal(true)} />}
        {activeTab === 'account' && <AccountPage user={user} />}
      </LayoutShell>
      <BookingModal
        isOpen={showBookingModal || !!editingBooking}
        onClose={() => { setShowBookingModal(false); setEditingBooking(null); }}
        editBooking={editingBooking}
        user={user}
        existingBookings={bookings.filter(b => b.status === 'scheduled')}
        teachers={[]}
        selectedTeacher={editingBooking?.teacher_id || null}
        onSuccess={handleBookingSuccess}
      />
    </>
  );
}
