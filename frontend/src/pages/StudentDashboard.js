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

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'schedule', label: 'My Schedule', icon: Calendar },
  { id: 'wallet', label: 'Wallet', icon: CreditCard },
  { id: 'account', label: 'Account', icon: User },
];

const TAB_TITLES = {
  dashboard: 'Dashboard',
  schedule: 'My Schedule',
  wallet: 'Wallet & Credits',
  account: 'Account Settings',
};

// Apple-style Sidebar
const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, user, onLogout }) => (
  <>
    {isOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={() => setIsOpen(false)} />}
    <aside className={`
      fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
      w-[272px] lg:translate-x-0 flex flex-col
      bg-white/80 backdrop-blur-xl border-r border-gray-200/60
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="h-16 flex items-center justify-between px-6">
        <span className="text-[17px] font-semibold text-[#0F3D2E] tracking-tight">Alif Amin</span>
        <button className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors" onClick={() => setIsOpen(false)}>
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0F3D2E] to-[#1a5c44] flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#1D1D1F] tracking-tight">{user?.name}</p>
            <p className="text-[12px] text-gray-400">Student</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
              data-testid={`sidebar-${item.id}`}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#0F3D2E]/[0.07] text-[#0F3D2E]'
                  : 'text-gray-500 hover:bg-gray-100/70 hover:text-gray-700'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-[#0F3D2E]' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 mt-auto">
        <div className="h-px bg-gray-100 mb-3" />
        <button onClick={onLogout} data-testid="sidebar-logout" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all duration-200">
          <LogOut className="w-[18px] h-[18px]" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>

    {/* Mobile Bottom Tab Bar */}
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/80 backdrop-blur-xl border-t border-gray-200/60 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? 'text-[#0F3D2E]' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  </>
);

// Apple-style Header
const Header = ({ title, subtitle, user, onMenuClick }) => (
  <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-gray-200/60">
    <div className="h-16 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors" onClick={onMenuClick}>
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-[17px] font-semibold text-[#1D1D1F] tracking-tight">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell userId={user?.user_id} userRole="student" />
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0F3D2E] to-[#1a5c44] flex items-center justify-center text-white text-[13px] font-semibold">
          {user?.name?.charAt(0) || 'S'}
        </div>
      </div>
    </div>
  </header>
);

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
    } catch (e) { console.error('Error fetching bookings:', e); }
    finally { setLoading(false); }
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
      <div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0F3D2E] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFD]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} user={user} onLogout={handleLogout} />

      <div className="lg:ml-[272px] pb-20 lg:pb-0">
        <Header title={TAB_TITLES[activeTab] || 'Dashboard'} user={user} onMenuClick={() => setSidebarOpen(true)} />

        <main className="animate-fade-in-up">
          {activeTab === 'dashboard' && <DashboardHome bookings={bookings} onOpenBooking={() => setBookingModalOpen(true)} />}
          {activeTab === 'schedule' && <MySchedule bookings={bookings} onOpenBooking={() => setBookingModalOpen(true)} onEdit={setEditTarget} onCancel={setCancelTarget} />}
          {activeTab === 'wallet' && <WalletPage user={user} />}
          {activeTab === 'account' && <AccountPage user={user} />}
        </main>
      </div>

      <BookingModal isOpen={bookingModalOpen} onClose={() => setBookingModalOpen(false)} onSuccess={fetchBookings} user={user} />
      <CancelBookingDialog isOpen={!!cancelTarget} booking={cancelTarget} onClose={() => setCancelTarget(null)} onSuccess={fetchBookings} />
      <EditBookingModal isOpen={!!editTarget} booking={editTarget} onClose={() => setEditTarget(null)} onSuccess={fetchBookings} />
    </div>
  );
}
