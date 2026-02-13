import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Home, User, CreditCard, Bell, Menu, X, ChevronRight, 
  Video, Clock, Star, Search, ChevronLeft, MoreVertical, 
  BookOpen, ArrowRight, RefreshCw, AlertCircle, Check, LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import NotificationBell from '../components/NotificationBell';
import { WalletPage } from '../components/student';

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
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white z-50 transition-transform duration-300 ease-in-out
        w-72 lg:translate-x-0 shadow-xl lg:shadow-none border-r
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <span className="text-xl font-semibold" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
            Alif Amin
          </span>
          <button 
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* User Info */}
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

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-[#0F3D2E]/10 text-[#0F3D2E]' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#0F3D2E]' : 'text-gray-400'}`} />
                <span className={`font-medium ${isActive ? 'text-[#0F3D2E]' : ''}`}>{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0F3D2E]" />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <button
            onClick={onLogout}
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
      <button 
        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        onClick={onMenuClick}
      >
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

// Countdown Timer Component
const CountdownTimer = ({ targetTime }) => {
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
        if (hours > 0) {
          setTimeLeft(`Starts in ${hours}h ${mins}m`);
        } else {
          setTimeLeft(`Starts in ${mins}m`);
        }
      } else {
        setCanJoin(false);
        setTimeLeft('Class ended');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return { timeLeft, canJoin };
};

// Dashboard Home View
const DashboardHome = ({ dashboardData, navigate, onBookTeacher }) => {
  const nextClass = dashboardData?.upcoming_classes?.[0];
  const recentClasses = dashboardData?.past_classes?.slice(0, 3) || [];
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('20:00');

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const times = ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00', '19:00', '20:00', '21:00'];

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  };

  const { timeLeft, canJoin } = nextClass 
    ? CountdownTimer({ targetTime: nextClass.start_time_utc })
    : { timeLeft: '', canJoin: false };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Section A: Upcoming Class Hero Card */}
      <section>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#0F3D2E' }}>Next Class</h2>
        {nextClass ? (
          <div className="bg-gradient-to-br from-[#0F3D2E] to-[#1a5c47] rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white/70 text-sm mb-1">Upcoming Session</p>
                  <h3 className="text-2xl font-bold">{nextClass.teacher_name || 'Your Teacher'}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white/70" />
                  <span>{new Date(nextClass.start_time_utc).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/70" />
                  <span>{new Date(nextClass.start_time_utc).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">{timeLeft}</span>
                {nextClass.meet_link ? (
                  <a
                    href={canJoin ? nextClass.meet_link : '#'}
                    target={canJoin ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    onClick={(e) => !canJoin && e.preventDefault()}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                      canJoin 
                        ? 'bg-[#22C55E] hover:bg-[#16a34a] cursor-pointer' 
                        : 'bg-white/20 cursor-not-allowed'
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
        ) : (
          <div className="bg-white rounded-2xl p-8 border text-center" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">No upcoming classes scheduled</p>
            <button
              onClick={() => onBookTeacher()}
              className="px-6 py-3 rounded-xl bg-[#0F3D2E] text-white font-medium hover:opacity-90 transition-all"
            >
              Book Your First Class
            </button>
          </div>
        )}
      </section>

      {/* Section B: Quick Book Widget */}
      <section className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#0F3D2E' }}>Book a New Class</h2>
        
        {/* Date Picker */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-3">Select Date</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map((date, idx) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 w-16 py-3 rounded-xl text-center transition-all ${
                    isSelected 
                      ? 'bg-[#0F3D2E] text-white' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className={`text-xs ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                    {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className={`text-lg font-semibold ${isSelected ? '' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Picker */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-3">Select Time</p>
          <select 
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
            style={{ borderColor: 'rgba(15, 61, 46, 0.15)' }}
          >
            {times.map(time => (
              <option key={time} value={time}>
                {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </option>
            ))}
          </select>
        </div>

        {/* Find Teachers Button */}
        <button
          onClick={() => onBookTeacher(selectedDate, selectedTime)}
          className="w-full h-14 rounded-xl bg-[#D4AF37] text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
        >
          <Search className="w-5 h-5" />
          Find Available Teachers
        </button>
      </section>

      {/* Section C: Recent History */}
      <section className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: '#0F3D2E' }}>Recent Classes</h2>
          <button className="text-sm text-[#0F3D2E] font-medium">View All</button>
        </div>

        {recentClasses.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No past classes yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentClasses.map((classItem, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium" style={{ color: '#1F2933' }}>
                      {new Date(classItem.start_time_utc).toLocaleDateString('en-US', { 
                        weekday: 'short', month: 'short', day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-500">{classItem.teacher_name || 'Ustaz Ahmad'}</p>
                  </div>
                  <button 
                    onClick={() => onBookTeacher()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0F3D2E]/10 text-[#0F3D2E] text-sm font-medium hover:bg-[#0F3D2E]/20 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Rebook
                  </button>
                </div>
                
                {/* Teacher Notes */}
                <div className="p-3 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                  <p className="text-xs font-medium text-[#D4AF37] mb-1">Teacher Notes</p>
                  <p className="text-sm text-gray-700">
                    {classItem.notes || "Focus on Tajweed rules for Surah Al-Falak next time. Practice Qalqalah sounds."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// Booking Results Component
const BookingResults = ({ selectedDate, selectedTime, onBack, onBook }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Mock teachers data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setTeachers([
        { id: 1, name: 'Ustaz Ahmad', expertise: 'Hifz & Tajweed', rating: 4.9, reviews: 124, price: 80, avatar: 'A' },
        { id: 2, name: 'Ustazah Fatimah', expertise: 'Quran Reading', rating: 4.8, reviews: 98, price: 75, avatar: 'F' },
        { id: 3, name: 'Ustaz Muhammad', expertise: 'Tajweed', rating: 4.7, reviews: 86, price: 70, avatar: 'M' },
      ]);
      setLoading(false);
    }, 1000);
  }, [selectedDate, selectedTime]);

  const handleBookTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setShowConfirmModal(true);
  };

  const confirmBooking = () => {
    toast.success(`Booking confirmed with ${selectedTeacher.name}!`);
    setShowConfirmModal(false);
    onBook();
  };

  const formatDisplayDate = () => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('en-US', { 
      weekday: 'long', month: 'long', day: 'numeric' 
    });
  };

  const formatDisplayTime = () => {
    if (!selectedTime) return '';
    return new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString('en-US', { 
      hour: 'numeric', minute: '2-digit', hour12: true 
    });
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Context Bar */}
      <div className="bg-[#0F3D2E] text-white rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-white/70" />
          <span>
            Showing teachers available on <strong>{formatDisplayDate()}</strong> at <strong>{formatDisplayTime()}</strong>
          </span>
        </div>
        <button 
          onClick={onBack}
          className="text-sm text-white/80 hover:text-white underline"
        >
          Change Time
        </button>
      </div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F3D2E]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher) => (
            <div 
              key={teacher.id}
              className="bg-white rounded-2xl p-6 border hover:shadow-lg transition-all"
              style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-[#0F3D2E] flex items-center justify-center text-white text-xl font-semibold">
                  {teacher.avatar}
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: '#1F2933' }}>{teacher.name}</h3>
                  <p className="text-sm text-gray-500">{teacher.expertise}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-[#D4AF37] fill-current" />
                  <span className="font-medium">{teacher.rating}</span>
                  <span className="text-gray-400 text-sm">({teacher.reviews})</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold" style={{ color: '#0F3D2E' }}>RM {teacher.price}</p>
                  <p className="text-xs text-gray-400">per class</p>
                </div>
                <button
                  onClick={() => handleBookTeacher(teacher)}
                  className="px-5 py-2.5 rounded-xl bg-[#0F3D2E] text-white font-medium hover:opacity-90 transition-all"
                >
                  Book This Teacher
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4" style={{ color: '#0F3D2E' }}>Confirm Booking</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-[#0F3D2E] flex items-center justify-center text-white font-semibold">
                  {selectedTeacher.avatar}
                </div>
                <div>
                  <p className="font-medium">{selectedTeacher.name}</p>
                  <p className="text-sm text-gray-500">{selectedTeacher.expertise}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{formatDisplayDate()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{formatDisplayTime()}</span>
                </div>
              </div>

              <div className="p-4 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/20">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Class Fee</span>
                  <span className="font-semibold" style={{ color: '#0F3D2E' }}>RM {selectedTeacher.price}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Will be deducted from your wallet balance</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl border font-medium hover:bg-gray-50 transition-all"
                style={{ borderColor: 'rgba(15, 61, 46, 0.2)', color: '#0F3D2E' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmBooking}
                className="flex-1 py-3 rounded-xl bg-[#0F3D2E] text-white font-medium hover:opacity-90 transition-all"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// My Schedule Component
const MySchedule = ({ dashboardData }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(null);

  const allClasses = [
    ...(dashboardData?.upcoming_classes || []).map(c => ({ ...c, status: 'scheduled' })),
    ...(dashboardData?.past_classes || []).map(c => ({ ...c, status: 'completed' })),
  ];

  // Generate calendar days
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty slots for days before the first day
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const calendarDays = getDaysInMonth(currentMonth);

  const getClassesForDay = (day) => {
    if (!day) return [];
    return allClasses.filter(c => {
      const classDate = new Date(c.start_time_utc);
      return classDate.toDateString() === day.toDateString();
    });
  };

  const hasScheduledClass = (day) => {
    return getClassesForDay(day).some(c => c.status === 'scheduled');
  };

  const hasCancelledClass = (day) => {
    return getClassesForDay(day).some(c => c.status === 'cancelled');
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleAction = (action, classItem) => {
    setShowActionMenu(null);
    if (action === 'details') {
      setShowDetailsModal(classItem);
    } else if (action === 'reschedule') {
      toast.info('Reschedule feature coming soon');
    } else if (action === 'cancel') {
      if (confirm('Are you sure? Refunds are processed to your wallet.')) {
        toast.success('Class cancelled. Refund will be processed within 24 hours.');
      }
    }
  };

  const filteredClasses = selectedDay 
    ? getClassesForDay(selectedDay)
    : allClasses;

  return (
    <div className="p-4 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold" style={{ color: '#0F3D2E' }}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={idx} className="aspect-square" />;
              
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = selectedDay && day.toDateString() === selectedDay.toDateString();
              const hasClass = hasScheduledClass(day);
              const hasCancelled = hasCancelledClass(day);

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all ${
                    isSelected 
                      ? 'bg-[#0F3D2E] text-white' 
                      : isToday 
                        ? 'bg-[#0F3D2E]/10' 
                        : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-sm ${isSelected ? 'font-semibold' : ''}`}>
                    {day.getDate()}
                  </span>
                  <div className="flex gap-0.5 mt-1">
                    {hasClass && (
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#22C55E]'}`} />
                    )}
                    {hasCancelled && (
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-300' : 'bg-red-500'}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
              <span className="text-xs text-gray-500">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs text-gray-500">Cancelled</span>
            </div>
          </div>
        </div>

        {/* Agenda List */}
        <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#0F3D2E' }}>
            {selectedDay 
              ? selectedDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'All Classes'
            }
          </h3>

          {filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">No classes {selectedDay ? 'on this day' : 'scheduled'}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {filteredClasses.map((classItem, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-xl border relative ${
                    classItem.status === 'cancelled' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#1F2933' }}>
                        {new Date(classItem.start_time_utc).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(classItem.start_time_utc).toLocaleTimeString('en-US', {
                          hour: 'numeric', minute: '2-digit', hour12: true
                        })}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{classItem.teacher_name || 'Ustaz Ahmad'}</p>
                    </div>
                    
                    <div className="relative">
                      <button 
                        onClick={() => setShowActionMenu(showActionMenu === idx ? null : idx)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      
                      {showActionMenu === idx && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border py-1 z-10">
                          <button 
                            onClick={() => handleAction('details', classItem)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            View Details
                          </button>
                          {classItem.status === 'scheduled' && (
                            <>
                              <button 
                                onClick={() => handleAction('reschedule', classItem)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                              >
                                Reschedule
                              </button>
                              <button 
                                onClick={() => handleAction('cancel', classItem)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                Cancel Class
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                    classItem.status === 'scheduled' 
                      ? 'bg-[#22C55E]/20 text-[#22C55E]' 
                      : classItem.status === 'cancelled'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {classItem.status === 'scheduled' ? 'Upcoming' : classItem.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4" style={{ color: '#0F3D2E' }}>Class Details</h3>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                <p className="font-medium">
                  {new Date(showDetailsModal.start_time_utc).toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Teacher</p>
                <p className="font-medium">{showDetailsModal.teacher_name || 'Ustaz Ahmad'}</p>
              </div>

              {showDetailsModal.meet_link && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Meeting Link</p>
                  <a href={showDetailsModal.meet_link} target="_blank" rel="noopener noreferrer" className="text-[#0F3D2E] underline text-sm">
                    {showDetailsModal.meet_link}
                  </a>
                </div>
              )}

              {showDetailsModal.notes && (
                <div className="p-4 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/20">
                  <p className="text-sm text-[#D4AF37] font-medium mb-1">Teacher Notes</p>
                  <p className="text-sm text-gray-700">{showDetailsModal.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowDetailsModal(null)}
              className="w-full py-3 rounded-xl bg-[#0F3D2E] text-white font-medium hover:opacity-90 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Account Page Component
const AccountPage = ({ user }) => (
  <div className="p-4 lg:p-8">
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
            <input 
              type="text" 
              defaultValue={user?.name}
              className="w-full h-12 px-4 rounded-xl border bg-gray-50"
              style={{ borderColor: 'rgba(15, 61, 46, 0.15)' }}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Email</label>
            <input 
              type="email" 
              defaultValue={user?.email}
              disabled
              className="w-full h-12 px-4 rounded-xl border bg-gray-100 text-gray-500"
              style={{ borderColor: 'rgba(15, 61, 46, 0.15)' }}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Phone</label>
            <input 
              type="tel" 
              defaultValue={user?.phone || ''}
              className="w-full h-12 px-4 rounded-xl border bg-gray-50"
              style={{ borderColor: 'rgba(15, 61, 46, 0.15)' }}
            />
          </div>
        </div>

        <button className="w-full mt-6 h-12 rounded-xl bg-[#0F3D2E] text-white font-medium hover:opacity-90 transition-all">
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
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingMode, setBookingMode] = useState(null); // { date, time } when searching teachers

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API}/students/dashboard`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleBookTeacher = (date, time) => {
    if (date && time) {
      setBookingMode({ date, time });
    } else {
      setBookingMode({ date: new Date(), time: '20:00' });
    }
  };

  const getPageTitle = () => {
    if (bookingMode) return 'Find Teachers';
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
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setBookingMode(null);
        }}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="lg:ml-72">
        <Header 
          title={getPageTitle()}
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {bookingMode ? (
          <BookingResults 
            selectedDate={bookingMode.date}
            selectedTime={bookingMode.time}
            onBack={() => setBookingMode(null)}
            onBook={() => {
              setBookingMode(null);
              fetchDashboard();
            }}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardHome 
                dashboardData={dashboardData}
                navigate={navigate}
                onBookTeacher={handleBookTeacher}
              />
            )}
            {activeTab === 'schedule' && (
              <MySchedule dashboardData={dashboardData} />
            )}
            {activeTab === 'account' && (
              <AccountPage user={user} />
            )}
            {activeTab === 'wallet' && (
              <WalletPage user={user} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
