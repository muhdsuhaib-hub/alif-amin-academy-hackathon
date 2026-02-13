import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Calendar, CreditCard, User, Menu, X, LogOut } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import {
  WalletPage,
  BookingModal,
  CancelBookingDialog,
  EditBookingModal,
  DashboardHome,
  MySchedule,
  AccountPage,
} from '../components/student';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Sidebar Navigation
const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'schedule', label: 'My Schedule', icon: Calendar },
    { id: 'wallet', label: 'Wallet', icon: CreditCard },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}
      <aside className={`
        fixed top-0 left-0 h-full bg-white z-50 transition-transform duration-300 ease-in-out
        w-72 lg:translate-x-0 shadow-xl lg:shadow-none border-r
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <div className="h-16 flex items-center justify-between px-6 border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <span className="text-xl font-semibold" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>Alif Amin</span>
          <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setIsOpen(false)}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0F3D2E] flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: '#1F2933' }}>{user?.name}</p>
              <p className="text-xs text-gray-500">Student</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
                data-testid={`sidebar-${item.id}`}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive ? 'bg-[#0F3D2E]/10 text-[#0F3D2E]' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#0F3D2E]' : 'text-gray-400'}`} />
                <span className={`font-medium ${isActive ? 'text-[#0F3D2E]' : ''}`}>{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0F3D2E]" />}
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <button onClick={onLogout} data-testid="sidebar-logout" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

// Header
const Header = ({ title, user, onMenuClick }) => (
  <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-8" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
    <div className="flex items-center gap-4">
      <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={onMenuClick}>
        <Menu className="w-5 h-5 text-gray-600" />
      </button>
      <div>
        <p className="text-xs text-gray-400 hidden sm:block">Student Portal</p>
        <h1 className="text-lg font-semibold" style={{ color: '#0F3D2E' }}>{title}</h1>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <NotificationBell userId={user?.user_id} userRole="student" />
      <div className="w-9 h-9 rounded-full bg-[#0F3D2E] flex items-center justify-center text-white font-medium">
        {user?.name?.charAt(0) || 'S'}
      </div>
    </div>
  </header>
);

const TAB_TITLES = {
  dashboard: 'Dashboard',
  schedule: 'My Schedule',
  wallet: 'Wallet & Credits',
  account: 'Account Settings',
};

export default function StudentDashboard({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${API}/booking/my-bookings`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (e) {
      console.error('Error fetching bookings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
      document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      navigate('/');
    } catch (e) { console.error('Logout error:', e); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F5EF' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F3D2E]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F5EF' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} user={user} onLogout={handleLogout} />

      <div className="lg:ml-72">
        <Header title={TAB_TITLES[activeTab] || 'Dashboard'} user={user} onMenuClick={() => setSidebarOpen(true)} />

        {activeTab === 'dashboard' && <DashboardHome bookings={bookings} onOpenBooking={() => setBookingModalOpen(true)} />}
        {activeTab === 'schedule' && <MySchedule bookings={bookings} onOpenBooking={() => setBookingModalOpen(true)} onEdit={setEditTarget} onCancel={setCancelTarget} />}
        {activeTab === 'wallet' && <WalletPage user={user} />}
        {activeTab === 'account' && <AccountPage user={user} />}
      </div>

      <BookingModal isOpen={bookingModalOpen} onClose={() => setBookingModalOpen(false)} onSuccess={fetchBookings} user={user} />
      <CancelBookingDialog isOpen={!!cancelTarget} booking={cancelTarget} onClose={() => setCancelTarget(null)} onSuccess={fetchBookings} />
      <EditBookingModal isOpen={!!editTarget} booking={editTarget} onClose={() => setEditTarget(null)} onSuccess={fetchBookings} />
    </div>
  );
}
