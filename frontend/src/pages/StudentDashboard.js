import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Home, User, CreditCard, Bell, Menu, X, ChevronRight, 
  Video, Clock, Star, Search, ChevronLeft, MoreVertical, 
  BookOpen, ArrowRight, RefreshCw, AlertCircle, Check, LogOut,
  Edit2, Trash2, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import NotificationBell from '../components/NotificationBell';
import { WalletPage, BookingModal, CancelBookingDialog, EditBookingModal } from '../components/student';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Sidebar Navigation Component
const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'schedule', label: 'My Schedule', icon: Calendar },
    { id: 'wallet', label: 'Wallet', icon: CreditCard },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside className={`
        fixed top-0 left-0 h-full bg-white z-50 transition-transform duration-300 ease-in-out
        w-72 lg:translate-x-0 shadow-xl lg:shadow-none border-r
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <div className="h-16 flex items-center justify-between px-6 border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <span className="text-xl font-semibold" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
            Alif Amin
          </span>
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
          <button
            onClick={onLogout}
            data-testid="sidebar-logout"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

// Header Component
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

// Countdown Timer Hook
const useCountdownTimer = (targetTime) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [canJoin, setCanJoin] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const target = new Date(targetTime);
      const diff = target - now;
      if (diff <= 5 * 60 * 1000 && diff > -60 * 60 * 1000) {
        setCanJoin(true);
        setTimeLeft('Ready to join');
      } else if (diff > 0) {
        setCanJoin(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(hours > 0 ? `Starts in ${hours}h ${mins}m` : `Starts in ${mins}m`);
      } else {
        setCanJoin(false);
        setTimeLeft('Class ended');
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return { timeLeft, canJoin };
};

// Dashboard Home View
const DashboardHome = ({ bookings, onOpenBooking, onRefresh }) => {
  const upcomingBookings = bookings.filter(b => b.status === 'scheduled' && new Date(b.start_time_utc) > new Date());
  const pastBookings = bookings.filter(b => b.status === 'completed').slice(0, 3);
  const nextClass = upcomingBookings[0];

  const { timeLeft, canJoin } = nextClass
    ? { timeLeft: '', canJoin: false } // will use inline
    : { timeLeft: '', canJoin: false };

  return (
    <div className="p-4 lg:p-8 space-y-6" data-testid="dashboard-home">
      {/* Next Class Hero */}
      <section>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#0F3D2E' }}>Next Class</h2>
        {nextClass ? (
          <NextClassCard booking={nextClass} />
        ) : (
          <div className="bg-white rounded-2xl p-8 border text-center" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">No upcoming classes scheduled</p>
            <button
              onClick={onOpenBooking}
              data-testid="book-first-class-btn"
              className="px-6 py-3 rounded-xl bg-[#0F3D2E] text-white font-medium hover:opacity-90 transition-all"
            >
              Book Your First Class
            </button>
          </div>
        )}
      </section>

      {/* Quick Book CTA */}
      <section className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold" style={{ color: '#0F3D2E' }}>Book a New Class</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">Choose your teacher, date, time and session duration.</p>
        <button
          onClick={onOpenBooking}
          data-testid="quick-book-btn"
          className="w-full h-14 rounded-xl bg-[#D4AF37] text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" />
          Book a Session
        </button>
      </section>

      {/* Recent History */}
      <section className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#0F3D2E' }}>Recent Classes</h2>
        {pastBookings.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No past classes yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pastBookings.map((b) => (
              <div key={b.booking_id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm" style={{ color: '#1F2933' }}>
                      {new Date(b.start_time_utc).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-500">{b.teacher_name || 'Teacher'} &middot; {b.duration_minutes || 30} min</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Completed</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// Next Class Card with countdown
const NextClassCard = ({ booking }) => {
  const { timeLeft, canJoin } = useCountdownTimer(booking.start_time_utc);

  return (
    <div className="bg-gradient-to-br from-[#0F3D2E] to-[#1a5c47] rounded-2xl p-6 text-white relative overflow-hidden" data-testid="next-class-card">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm mb-1">Upcoming Session</p>
            <h3 className="text-2xl font-bold">{booking.teacher_name || 'Your Teacher'}</h3>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-sm">
            <Clock className="w-3.5 h-3.5" />
            {booking.duration_minutes || 30} min
          </div>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-white/70" />
            <span>{new Date(booking.start_time_utc).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/70" />
            <span>{new Date(booking.start_time_utc).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-sm">{timeLeft}</span>
          {booking.meet_link ? (
            <a
              href={canJoin ? booking.meet_link : '#'}
              target={canJoin ? '_blank' : '_self'}
              rel="noopener noreferrer"
              onClick={(e) => !canJoin && e.preventDefault()}
              data-testid="join-class-btn"
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                canJoin ? 'bg-[#22C55E] hover:bg-[#16a34a] cursor-pointer' : 'bg-white/20 cursor-not-allowed'
              }`}
            >
              <Video className="w-5 h-5" />
              {canJoin ? 'Join Class' : timeLeft}
            </a>
          ) : (
            <span className="text-white/60 text-sm">Link will be available soon</span>
          )}
        </div>
      </div>
    </div>
  );
};

// My Schedule Component
const MySchedule = ({ bookings, onOpenBooking, onEdit, onCancel }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const calendarDays = getDaysInMonth(currentMonth);

  const getClassesForDay = (day) => {
    if (!day) return [];
    return bookings.filter(b => {
      const d = new Date(b.start_time_utc);
      return d.toDateString() === day.toDateString();
    });
  };

  const filteredClasses = selectedDay ? getClassesForDay(selectedDay) : bookings;

  return (
    <div className="p-4 lg:p-8" data-testid="my-schedule-page">
      {/* Book New button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: '#0F3D2E' }}>My Schedule</h2>
        <button
          onClick={onOpenBooking}
          data-testid="schedule-book-btn"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F3D2E] text-white font-medium text-sm hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Booking
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold" style={{ color: '#0F3D2E' }}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={idx} className="aspect-square" />;
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = selectedDay && day.toDateString() === selectedDay.toDateString();
              const dayClasses = getClassesForDay(day);
              const hasScheduled = dayClasses.some(c => c.status === 'scheduled');
              const hasCancelled = dayClasses.some(c => c.status === 'cancelled');

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all ${
                    isSelected ? 'bg-[#0F3D2E] text-white' : isToday ? 'bg-[#0F3D2E]/10' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-sm ${isSelected ? 'font-semibold' : ''}`}>{day.getDate()}</span>
                  <div className="flex gap-0.5 mt-1">
                    {hasScheduled && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#22C55E]'}`} />}
                    {hasCancelled && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-300' : 'bg-red-500'}`} />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" /><span className="text-xs text-gray-500">Scheduled</span></div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-xs text-gray-500">Cancelled</span></div>
          </div>
        </div>

        {/* Agenda */}
        <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#0F3D2E' }}>
            {selectedDay ? selectedDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'All Bookings'}
          </h3>

          {filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">No classes {selectedDay ? 'on this day' : 'found'}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredClasses.map((b) => (
                <ScheduleCard key={b.booking_id} booking={b} onEdit={onEdit} onCancel={onCancel} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Single schedule card with edit/cancel
const ScheduleCard = ({ booking, onEdit, onCancel }) => {
  const isScheduled = booking.status === 'scheduled';
  const isFuture = new Date(booking.start_time_utc) > new Date();

  return (
    <div
      className={`p-4 rounded-xl border ${
        booking.status === 'cancelled' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
      }`}
      data-testid={`schedule-card-${booking.booking_id}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-sm" style={{ color: '#1F2933' }}>
            {new Date(booking.start_time_utc).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(booking.start_time_utc).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            {' '}&middot; {booking.duration_minutes || 30} min
          </p>
          <p className="text-xs text-gray-400 mt-1">{booking.teacher_name || 'Teacher'}</p>
          {booking.credits_charged > 0 && (
            <p className="text-xs text-gray-400">{booking.credits_charged} credit{booking.credits_charged > 1 ? 's' : ''}</p>
          )}
        </div>

        {/* Status Badge + Actions */}
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            booking.status === 'scheduled' ? 'bg-[#22C55E]/20 text-[#22C55E]'
            : booking.status === 'cancelled' ? 'bg-red-100 text-red-600'
            : 'bg-gray-200 text-gray-600'
          }`}>
            {booking.status === 'scheduled' ? 'Upcoming' : booking.status === 'cancelled' ? 'Cancelled' : 'Completed'}
          </span>

          {isScheduled && isFuture && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(booking)}
                data-testid={`edit-btn-${booking.booking_id}`}
                className="p-1.5 hover:bg-white rounded-lg text-gray-500 hover:text-[#0F3D2E] transition-all"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onCancel(booking)}
                data-testid={`cancel-btn-${booking.booking_id}`}
                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-all"
                title="Cancel"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Account Page Component
const AccountPage = ({ user }) => (
  <div className="p-4 lg:p-8" data-testid="account-page">
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl p-6 border mb-6" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-[#0F3D2E] flex items-center justify-center text-white text-2xl font-semibold">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: '#1F2933' }}>{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Full Name</label>
            <input type="text" defaultValue={user?.name} className="w-full h-12 px-4 rounded-xl border bg-gray-50" style={{ borderColor: 'rgba(15, 61, 46, 0.15)' }} data-testid="account-name-input" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Email</label>
            <input type="email" defaultValue={user?.email} disabled className="w-full h-12 px-4 rounded-xl border bg-gray-100 text-gray-500" style={{ borderColor: 'rgba(15, 61, 46, 0.15)' }} data-testid="account-email-input" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Phone</label>
            <input type="tel" defaultValue={user?.phone || ''} className="w-full h-12 px-4 rounded-xl border bg-gray-50" style={{ borderColor: 'rgba(15, 61, 46, 0.15)' }} data-testid="account-phone-input" />
          </div>
        </div>
        <button className="w-full mt-6 h-12 rounded-xl bg-[#0F3D2E] text-white font-medium hover:opacity-90 transition-all" data-testid="save-account-btn">
          Save Changes
        </button>
      </div>
    </div>
  </div>
);

// Main Dashboard Component
export default function StudentDashboard({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  // Modal states
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

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'schedule': return 'My Schedule';
      case 'wallet': return 'Wallet & Credits';
      case 'account': return 'Account Settings';
      default: return 'Dashboard';
    }
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
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
      />

      <div className="lg:ml-72">
        <Header title={getPageTitle()} user={user} onMenuClick={() => setSidebarOpen(true)} />

        {activeTab === 'dashboard' && (
          <DashboardHome
            bookings={bookings}
            onOpenBooking={() => setBookingModalOpen(true)}
            onRefresh={fetchBookings}
          />
        )}
        {activeTab === 'schedule' && (
          <MySchedule
            bookings={bookings}
            onOpenBooking={() => setBookingModalOpen(true)}
            onEdit={(b) => setEditTarget(b)}
            onCancel={(b) => setCancelTarget(b)}
          />
        )}
        {activeTab === 'wallet' && <WalletPage user={user} />}
        {activeTab === 'account' && <AccountPage user={user} />}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onSuccess={fetchBookings}
        user={user}
      />

      {/* Cancel Dialog */}
      <CancelBookingDialog
        isOpen={!!cancelTarget}
        booking={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onSuccess={fetchBookings}
      />

      {/* Edit Modal */}
      <EditBookingModal
        isOpen={!!editTarget}
        booking={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={fetchBookings}
      />
    </div>
  );
}
