import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Wallet, Calendar, Book, Users, User, AlertCircle, CheckCircle, Video } from 'lucide-react';
import { toast } from 'sonner';
import { PageLoader } from '../components/Spinner';
import LayoutShell from '../components/layout/LayoutShell';
import {
  EarningsWallet, AvailabilityCalendar, ClassroomTools,
  StudentManagement, ProfileManagement, DashboardOverview
} from '../components/teacher';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'wallet', label: 'Earnings', icon: Wallet },
  { id: 'availability', label: 'Availability', icon: Calendar },
  { id: 'classroom', label: 'Classroom', icon: Book },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
];

const TAB_TITLES = {
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
  const [students, setStudents] = useState([]);
  const [commissionInfo, setCommissionInfo] = useState(null);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchCommissionInfo = async (teacherId) => {
    try { const r = await fetch(`${API}/commission/tutor/${teacherId}`, { credentials: 'include' }); if (r.ok) setCommissionInfo(await r.json()); } catch (e) { console.error(e); }
  };

  const fetchDashboard = async () => {
    try {
      const r = await fetch(`${API}/teachers/dashboard`, { credentials: 'include' });
      if (r.ok) {
        const data = await r.json();
        setDashboardData(data);
        if (data.teacher?.approval_status === 'pending' || data.teacher?.is_active === false) setIsPendingApproval(true);
        if (data.teacher?.teacher_id && data.teacher?.is_active) { fetchStudents(data.teacher.teacher_id); fetchCommissionInfo(data.teacher.teacher_id); }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchStudents = async (teacherId) => {
    try { const r = await fetch(`${API}/teachers/${teacherId}/students`, { credentials: 'include' }); if (r.ok) { const d = await r.json(); setStudents(d.students || []); } }
    catch { setStudents([ { student_id: '1', name: 'Ahmad bin Ali', current_level: "Iqra' Vol 4", last_session: '2026-01-25', status: 'active' }, { student_id: '2', name: 'Sarah Abdullah', current_level: 'Juz 29', last_session: '2026-01-20', status: 'active' } ]); }
  };

  const handleLogout = async () => {
    try { await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }); document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; navigate('/'); } catch (e) { console.error(e); }
  };

  if (loading) return <PageLoader />;

  if (isPendingApproval) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-surface-card rounded-lg border border-ink-faint/20 shadow-apple-sm p-10 max-w-md text-center">
          <div className="w-16 h-16 rounded-lg bg-gold/10 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-7 h-7 text-gold" />
          </div>
          <h2 className="text-h2 text-ink mb-2">Application Under Review</h2>
          <p className="text-ink-secondary text-body leading-relaxed mb-6">Thank you for registering! Your application is being reviewed. You'll receive an email once approved.</p>
          <div className="flex items-center justify-center gap-2 text-small text-success"><CheckCircle className="w-4 h-4" /><span>Profile created successfully</span></div>
          <button onClick={handleLogout} className="mt-6 text-small text-ink-tertiary hover:text-ink-secondary transition-colors">Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <LayoutShell menuItems={MENU_ITEMS} activeTab={activeSection} setActiveTab={setActiveSection} tabTitles={TAB_TITLES} user={user} userRole="teacher" onLogout={handleLogout}>
      <div className="p-4 lg:p-8">
        {activeSection === 'dashboard' && <DashboardOverview teacherData={dashboardData} students={students} user={user} commissionInfo={commissionInfo} />}
        {activeSection === 'wallet' && <EarningsWallet teacherData={dashboardData?.teacher} commissionInfo={commissionInfo} user={user} />}
        {activeSection === 'availability' && <AvailabilityCalendar teacherData={dashboardData?.teacher} />}
        {activeSection === 'classroom' && <ClassroomTools teacherData={dashboardData?.teacher} students={students} />}
        {activeSection === 'students' && <StudentManagement teacherData={dashboardData?.teacher} students={students} setStudents={setStudents} />}
        {activeSection === 'profile' && <ProfileManagement teacherData={dashboardData?.teacher} user={user} />}
      </div>

      {/* Bottom CTA Bar - Desktop */}
      <div className="hidden lg:block fixed bottom-0 right-0 bg-surface-card/80 backdrop-blur-xl border-t border-ink-faint/20 px-8 py-3" style={{ left: 'var(--sidebar-width)' }}>
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-success animate-pulse" /><span className="text-small text-ink-secondary">Ready for your next class</span></div>
          <button onClick={() => { const meetLink = dashboardData?.teacher?.meet_link; if (meetLink) window.open(meetLink, '_blank'); else toast.error('Please add your Google Meet link in Profile settings'); }}
            data-testid="enter-classroom-btn" className="inline-flex items-center justify-center rounded-md font-medium text-small h-11 px-6 bg-brand text-white hover:bg-brand-light shadow-apple-xs transition-all duration-200 active:scale-[0.97] gap-2">
            <Video className="w-4 h-4" />Enter Classroom
          </button>
        </div>
      </div>
    </LayoutShell>
  );
}
