import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, DollarSign, TrendingUp, TrendingDown, 
  LogOut, Clock, AlertCircle, CheckCircle, XCircle,
  BookOpen, UserPlus, CreditCard, BarChart3, Settings,
  Bell, Search, Filter, Download, UserCheck, Wallet, PiggyBank
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import UserManagement from '../components/admin/UserManagement';
import BookingCalendar from '../components/admin/BookingCalendar';
import FinancialReports from '../components/admin/FinancialReports';
import SupportTickets from '../components/admin/SupportTickets';
import SubscriptionManagement from '../components/admin/SubscriptionManagement';
import TeacherApprovals from '../components/admin/TeacherApprovals';
import NotificationBell from '../components/NotificationBell';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [liability, setLiability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [revenue, setRevenue] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchLiability();
    fetchRevenue();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API}/admin/stats`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiability = async () => {
    try {
      const response = await fetch(`${API}/admin/wallet/liability`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setLiability(data);
      }
    } catch (error) {
      console.error('Error fetching liability:', error);
    }
  };

  const fetchRevenue = async () => {
    try {
      const response = await fetch(`${API}/admin/revenue/recognition`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setRevenue(data);
      }
    } catch (error) {
      console.error('Error fetching revenue:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Mock data for charts
  const userGrowthData = [
    { month: 'Jan', users: 45 },
    { month: 'Feb', users: 52 },
    { month: 'Mar', users: 61 },
    { month: 'Apr', users: 73 },
    { month: 'May', users: 89 },
    { month: 'Jun', users: 98 }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 3200 },
    { month: 'Feb', revenue: 3800 },
    { month: 'Mar', revenue: 4100 },
    { month: 'Apr', revenue: 4600 },
    { month: 'May', revenue: 5200 },
    { month: 'Jun', revenue: 5800 }
  ];

  const attendanceData = [
    { day: 'Mon', rate: 92 },
    { day: 'Tue', rate: 88 },
    { day: 'Wed', rate: 95 },
    { day: 'Thu', rate: 90 },
    { day: 'Fri', rate: 87 },
    { day: 'Sat', rate: 94 },
    { day: 'Sun', rate: 91 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F3D2E]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F5EF' }}>
      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
        <div className="max-w-full mx-auto px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
                Alif Amin
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-[#0F3D2E] text-white font-medium" style={{ fontFamily: 'Cal Sans' }}>
                Admin
              </span>
            </div>
            
            {/* Tab Navigation */}
            <div className="hidden md:flex gap-1">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'approvals', label: 'Approvals', icon: UserCheck },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'bookings', label: 'Bookings', icon: Calendar },
                { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
                { id: 'finance', label: 'Finance', icon: DollarSign },
                { id: 'support', label: 'Support', icon: Bell }
              ].map(tab => (
                <button
                  key={tab.id}
                  data-testid={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: activeTab === tab.id ? 'rgba(15, 61, 46, 0.1)' : 'transparent',
                    color: activeTab === tab.id ? '#0F3D2E' : '#5A5A5A',
                    fontFamily: 'Cal Sans'
                  }}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell userId={user?.user_id} userRole="admin" />
            <div className="flex items-center gap-3 pl-4 border-l" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
              <div className="text-right">
                <p className="text-sm font-medium" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>{user?.name}</p>
                <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 h-9 px-4 rounded-full border transition-all hover:bg-gray-50"
                style={{ borderColor: 'rgba(15, 61, 46, 0.2)', color: '#0F3D2E', fontFamily: 'Cal Sans', fontWeight: 500 }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-full mx-auto px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>Total Active Users</p>
                    <p className="text-3xl font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                      {stats?.total_users || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(15, 61, 46, 0.1)' }}>
                    <Users className="w-6 h-6" style={{ color: '#0F3D2E' }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500" style={{ fontFamily: 'Cal Sans' }}>+12%</span>
                  <span className="text-sm" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>vs last month</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>Active Students</p>
                    <p className="text-3xl font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                      {stats?.total_students || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(200, 169, 81, 0.1)' }}>
                    <BookOpen className="w-6 h-6" style={{ color: '#C8A951' }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500" style={{ fontFamily: 'Cal Sans' }}>+8%</span>
                  <span className="text-sm" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>vs last month</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>Revenue (MTD)</p>
                    <p className="text-3xl font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                      RM {stats?.revenue_mtd?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(46, 182, 160, 0.1)' }}>
                    <DollarSign className="w-6 h-6" style={{ color: '#2EB6A0' }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500" style={{ fontFamily: 'Cal Sans' }}>+24%</span>
                  <span className="text-sm" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>vs last month</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>Conversion Rate</p>
                    <p className="text-3xl font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                      {stats?.conversion_rate || 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(231, 111, 81, 0.1)' }}>
                    <TrendingUp className="w-6 h-6" style={{ color: '#E76F51' }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500" style={{ fontFamily: 'Cal Sans' }}>+3.2%</span>
                  <span className="text-sm" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>vs last month</span>
                </div>
              </div>
            </div>

            {/* Mini Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>User Growth</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F3D2E" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0F3D2E" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: '12px', fontFamily: 'Cal Sans' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px', fontFamily: 'Cal Sans' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="users" stroke="#0F3D2E" fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: '12px', fontFamily: 'Cal Sans' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px', fontFamily: 'Cal Sans' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#2EB6A0" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>Attendance Rate</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" stroke="#9CA3AF" style={{ fontSize: '12px', fontFamily: 'Cal Sans' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px', fontFamily: 'Cal Sans' }} />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#C8A951" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Today's Highlights */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border mb-8" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
              <h3 className="text-xl font-semibold mb-6" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>Today&apos;s Highlights</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5" style={{ color: '#0F3D2E' }} />
                    <h4 className="text-lg font-medium" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>Classes Today</h4>
                  </div>
                  <div className="space-y-3">
                    {stats?.todays_classes?.slice(0, 3).map((booking, idx) => (
                      <div key={idx} className="p-3 rounded-lg" style={{ backgroundColor: '#F7F5EF' }}>
                        <p className="text-sm font-medium" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                          {new Date(booking.start_time_utc).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans', fontWeight: 300 }}>
                          Booking ID: {booking.booking_id.slice(0, 12)}...
                        </p>
                      </div>
                    )) || <p className="text-sm" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>No classes today</p>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5" style={{ color: '#C8A951' }} />
                    <h4 className="text-lg font-medium" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>Trials Expiring Soon</h4>
                  </div>
                  <div className="space-y-3">
                    {stats?.trial_students?.slice(0, 3).map((student, idx) => (
                      <div key={idx} className="p-3 rounded-lg" style={{ backgroundColor: '#FFF9E6' }}>
                        <p className="text-sm font-medium" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                          Student ID: {student.student_id.slice(0, 12)}...
                        </p>
                        <p className="text-xs" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans', fontWeight: 300 }}>
                          Level: {student.current_level}
                        </p>
                      </div>
                    )) || <p className="text-sm" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>No expiring trials</p>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <XCircle className="w-5 h-5" style={{ color: '#E76F51' }} />
                    <h4 className="text-lg font-medium" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>Failed Payments</h4>
                  </div>
                  <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#FFF0ED' }}>
                    <p className="text-2xl font-semibold mb-1" style={{ color: '#E76F51', fontFamily: 'Cal Sans' }}>0</p>
                    <p className="text-sm" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans', fontWeight: 300 }}>All payments successful</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <UserPlus className="w-5 h-5" style={{ color: '#0F3D2E' }} />
                  <p className="text-sm font-medium" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>New Sign-ups Today</p>
                </div>
                <p className="text-2xl font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                  {stats?.new_signups_today || 0}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5" style={{ color: '#C8A951' }} />
                  <p className="text-sm font-medium" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>Classes This Month</p>
                </div>
                <p className="text-2xl font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                  {stats?.bookings_this_month || 0}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-5 h-5" style={{ color: '#2EB6A0' }} />
                  <p className="text-sm font-medium" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>Completed Classes</p>
                </div>
                <p className="text-2xl font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                  {stats?.completed_bookings || 0}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5" style={{ color: '#E76F51' }} />
                  <p className="text-sm font-medium" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>Active Teachers</p>
                </div>
                <p className="text-2xl font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                  {stats?.total_teachers || 0}
                </p>
              </div>
            </div>

            {/* Credit Liability Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border mt-8" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)' }}>
                    <Wallet className="w-5 h-5" style={{ color: '#D4AF37' }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                      Credit Liability Tracker
                    </h3>
                    <p className="text-sm" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>
                      Outstanding wallet credits & tutor payout exposure
                    </p>
                  </div>
                </div>
                <button 
                  onClick={fetchLiability}
                  className="text-sm px-4 py-2 rounded-lg transition-all hover:bg-gray-50"
                  style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}
                >
                  Refresh
                </button>
              </div>

              {liability ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Paid Credits Outstanding */}
                  <div className="p-4 rounded-xl" style={{ backgroundColor: '#F7F5EF' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4" style={{ color: '#0F3D2E' }} />
                      <p className="text-xs font-medium" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans' }}>
                        Paid Credits Outstanding
                      </p>
                    </div>
                    <p className="text-2xl font-bold mb-1" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
                      {Math.floor(liability?.credit_liability?.total_paid_credits_outstanding || 0)}
                    </p>
                    <p className="text-sm" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans', fontWeight: 300 }}>
                      RM {(liability?.credit_liability?.paid_credits_monetary_value || 0).toLocaleString()} value
                    </p>
                  </div>

                  {/* Total Bonus Credits Outstanding */}
                  <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <PiggyBank className="w-4 h-4" style={{ color: '#D4AF37' }} />
                      <p className="text-xs font-medium" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans' }}>
                        Bonus Credits Outstanding
                      </p>
                    </div>
                    <p className="text-2xl font-bold mb-1" style={{ color: '#D4AF37', fontFamily: 'Cal Sans' }}>
                      {Math.floor(liability?.credit_liability?.total_bonus_credits_outstanding || 0)}
                    </p>
                    <p className="text-sm" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans', fontWeight: 300 }}>
                      RM {(liability?.marketing_liability?.bonus_credits_value || 0).toLocaleString()} marketing cost
                    </p>
                  </div>

                  {/* Estimated Tutor Payout */}
                  <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(231, 111, 81, 0.1)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4" style={{ color: '#E76F51' }} />
                      <p className="text-xs font-medium" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans' }}>
                        Tutor Payout Exposure
                      </p>
                    </div>
                    <p className="text-2xl font-bold mb-1" style={{ color: '#E76F51', fontFamily: 'Cal Sans' }}>
                      RM {(liability?.tutor_payout_exposure?.total_exposure || 0).toLocaleString()}
                    </p>
                    <p className="text-sm" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans', fontWeight: 300 }}>
                      If all credits used ({Math.round((liability?.base_rates?.tutor_rate || 0.8) * 100)}% payout rate)
                    </p>
                  </div>

                  {/* Total Revenue Collected */}
                  <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(46, 182, 160, 0.1)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4" style={{ color: '#2EB6A0' }} />
                      <p className="text-xs font-medium" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans' }}>
                        Total Top-up Revenue
                      </p>
                    </div>
                    <p className="text-2xl font-bold mb-1" style={{ color: '#2EB6A0', fontFamily: 'Cal Sans' }}>
                      RM {(liability?.wallet_summary?.total_topup_revenue || 0).toLocaleString()}
                    </p>
                    <p className="text-sm" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans', fontWeight: 300 }}>
                      From {liability?.wallet_summary?.wallets_with_balance || 0} active wallets
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3D2E]"></div>
                </div>
              )}

              {/* Additional Stats Row */}
              {liability && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <span className="text-sm" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>Platform Commission (potential)</span>
                    <span className="text-sm font-semibold" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
                      RM {(liability?.platform_commission?.potential_commission || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <span className="text-sm" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>Sessions Completed</span>
                    <span className="text-sm font-semibold" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
                      {liability?.historical_usage?.total_sessions_completed || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <span className="text-sm" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>Tutor Payouts Made</span>
                    <span className="text-sm font-semibold" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
                      RM {(liability?.historical_usage?.total_tutor_payouts_made || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Revenue Recognition Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border mt-8" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(46, 182, 160, 0.15)' }}>
                    <BarChart3 className="w-5 h-5" style={{ color: '#2EB6A0' }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                      Revenue Recognition
                    </h3>
                    <p className="text-sm" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>
                      Commission recognized only when sessions completed
                    </p>
                  </div>
                </div>
                <button 
                  onClick={fetchRevenue}
                  className="text-sm px-4 py-2 rounded-lg transition-all hover:bg-gray-50"
                  style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}
                >
                  Refresh
                </button>
              </div>

              {revenue ? (
                <>
                  {/* Main Revenue Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Cash Collected */}
                    <div className="p-5 rounded-xl border-2 border-[#2EB6A0]/20" style={{ backgroundColor: 'rgba(46, 182, 160, 0.05)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-5 h-5" style={{ color: '#2EB6A0' }} />
                        <p className="text-sm font-medium" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>
                          Cash Collected
                        </p>
                      </div>
                      <p className="text-3xl font-bold mb-1" style={{ color: '#2EB6A0', fontFamily: 'Cal Sans' }}>
                        RM {(revenue?.cash_flow?.total_cash_collected || 0).toLocaleString()}
                      </p>
                      <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans' }}>
                        From student top-ups
                      </p>
                      <div className="mt-3 pt-3 border-t border-[#2EB6A0]/20">
                        <p className="text-xs" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>
                          Last 30 days: <span className="font-semibold">RM {(revenue?.cash_flow?.last_30_days || 0).toLocaleString()}</span>
                        </p>
                      </div>
                    </div>

                    {/* Commission Earned */}
                    <div className="p-5 rounded-xl border-2 border-[#0F3D2E]/20" style={{ backgroundColor: 'rgba(15, 61, 46, 0.05)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-5 h-5" style={{ color: '#0F3D2E' }} />
                        <p className="text-sm font-medium" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>
                          Commission Earned
                        </p>
                      </div>
                      <p className="text-3xl font-bold mb-1" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
                        RM {(revenue?.revenue_recognition?.commission_earned || 0).toLocaleString()}
                      </p>
                      <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans' }}>
                        {Math.round((revenue?.revenue_recognition?.commission_rate || 0.2) * 100)}% of completed sessions
                      </p>
                      <div className="mt-3 pt-3 border-t border-[#0F3D2E]/20">
                        <p className="text-xs" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>
                          Last 30 days: <span className="font-semibold">RM {(revenue?.revenue_recognition?.last_30_days || 0).toLocaleString()}</span>
                        </p>
                      </div>
                    </div>

                    {/* Tutor Payable */}
                    <div className="p-5 rounded-xl border-2 border-[#E76F51]/20" style={{ backgroundColor: 'rgba(231, 111, 81, 0.05)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-5 h-5" style={{ color: '#E76F51' }} />
                        <p className="text-sm font-medium" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>
                          Tutor Payable
                        </p>
                      </div>
                      <p className="text-3xl font-bold mb-1" style={{ color: '#E76F51', fontFamily: 'Cal Sans' }}>
                        RM {(revenue?.tutor_payable?.total_payable || 0).toLocaleString()}
                      </p>
                      <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans' }}>
                        {Math.round((revenue?.tutor_payable?.payout_rate || 0.8) * 100)}% of completed sessions
                      </p>
                      <div className="mt-3 pt-3 border-t border-[#E76F51]/20">
                        <div className="flex justify-between text-xs" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>
                          <span>Paid: RM {(revenue?.tutor_payable?.already_paid || 0).toLocaleString()}</span>
                          <span className="font-semibold text-[#E76F51]">Pending: RM {(revenue?.tutor_payable?.pending_payment || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deferred Revenue & Accounting Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Deferred Revenue */}
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4" style={{ color: '#D4AF37' }} />
                        <p className="text-sm font-semibold" style={{ color: '#92400E', fontFamily: 'Cal Sans' }}>
                          Deferred Revenue (Liability)
                        </p>
                      </div>
                      <p className="text-2xl font-bold mb-2" style={{ color: '#92400E', fontFamily: 'Cal Sans' }}>
                        RM {(revenue?.deferred_revenue?.amount || 0).toLocaleString()}
                      </p>
                      <p className="text-xs mb-3" style={{ color: '#92400E', fontFamily: 'Cal Sans', opacity: 0.8 }}>
                        Cash collected but not yet earned
                      </p>
                      <div className="text-xs space-y-1" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>
                        <div className="flex justify-between">
                          <span>Cash Collected:</span>
                          <span>RM {(revenue?.deferred_revenue?.breakdown?.cash_collected || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>− Revenue Recognized:</span>
                          <span>RM {(revenue?.deferred_revenue?.breakdown?.minus_revenue_recognized || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-1 border-t border-amber-300">
                          <span>= Deferred:</span>
                          <span>RM {(revenue?.deferred_revenue?.breakdown?.equals_deferred || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Accounting Summary */}
                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#F7F5EF' }}>
                      <p className="text-sm font-semibold mb-3" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
                        Accounting Summary
                      </p>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>Gross Revenue (Sessions)</span>
                          <span className="text-sm font-semibold" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
                            RM {(revenue?.accounting_summary?.gross_revenue || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>Net Platform Revenue</span>
                          <span className="text-sm font-semibold" style={{ color: '#2EB6A0', fontFamily: 'Cal Sans' }}>
                            RM {(revenue?.accounting_summary?.net_platform_revenue || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>Marketing Cost (Bonus Used)</span>
                          <span className="text-sm font-semibold" style={{ color: '#E76F51', fontFamily: 'Cal Sans' }}>
                            RM {(revenue?.marketing_expense?.realized || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
                          <span className="text-sm" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>Sessions Completed</span>
                          <span className="text-sm font-semibold" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
                            {revenue?.session_summary?.total_completed || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Recognition Notice */}
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-800" style={{ fontFamily: 'Cal Sans' }}>
                        <strong>Revenue Recognition Policy:</strong> Platform commission is only recognized as earned revenue when sessions are completed. 
                        Cash collected from top-ups is held as deferred revenue (liability) until services are delivered.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3D2E]"></div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'approvals' && <TeacherApprovals />}

        {activeTab === 'users' && <UserManagement />}

        {activeTab === 'bookings' && <BookingCalendar />}

        {activeTab === 'subscriptions' && <SubscriptionManagement />}

        {activeTab === 'finance' && <FinancialReports />}

        {activeTab === 'support' && <SupportTickets />}
      </div>
    </div>
  );
}
