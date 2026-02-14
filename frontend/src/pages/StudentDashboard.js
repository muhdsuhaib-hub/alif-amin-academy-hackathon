import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Wallet, Calendar, User } from 'lucide-react';
import { PageLoader } from '../components/Spinner';
import LayoutShell from '../components/layout/LayoutShell';
import { DashboardHome, WalletPage, MySchedule, AccountPage, BookingModal, StudentSidebar } from '../components/student';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MENU_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'account', label: 'Account', icon: User },
];

const TAB_TITLES = {
  home: 'Dashboard',
  wallet: 'Wallet',
  schedule: 'My Schedule',
  account: 'Account',
};

export default function StudentDashboard({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${API}/bookings/student?user_id=${user?.user_id}`, { credentials: 'include' });
      if (res.ok) { const data = await res.json(); setBookings(data.bookings || []); }
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  }, [user?.user_id]);

  useEffect(() => { if (user?.user_id) fetchBookings(); }, [user?.user_id, fetchBookings]);

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
      document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      navigate('/');
    } catch (e) { console.error('Logout error:', e); }
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <LayoutShell menuItems={MENU_ITEMS} activeTab={activeTab} setActiveTab={setActiveTab} tabTitles={TAB_TITLES} user={user} userRole="student" onLogout={handleLogout}>
        {activeTab === 'home' && <DashboardHome bookings={bookings} onOpenBooking={() => setShowBookingModal(true)} />}
        {activeTab === 'wallet' && <WalletPage user={user} />}
        {activeTab === 'schedule' && <MySchedule bookings={bookings} onRefresh={fetchBookings} onEdit={setEditingBooking} onOpenBooking={() => setShowBookingModal(true)} />}
        {activeTab === 'account' && <AccountPage user={user} />}
      </LayoutShell>
      <BookingModal isOpen={showBookingModal || !!editingBooking} onClose={() => { setShowBookingModal(false); setEditingBooking(null); }} editBooking={editingBooking} user={user} existingBookings={bookings.filter(b => b.status === 'scheduled')} teachers={[]} selectedTeacher={editingBooking?.teacher_id || (bookings.find(b => b.teacher_id) || {}).teacher_id || null} onSuccess={fetchBookings} />
    </>
  );
}
