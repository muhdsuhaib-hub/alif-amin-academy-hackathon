import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@/App.css';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import BrowseTeachers from './pages/BrowseTeachers';
import BookClass from './pages/BookClass';
import TeacherSignup from './pages/TeacherSignup';
import Auth from './pages/Auth';
import ClassroomPage from './pages/ClassroomPage';
import { Toaster } from './components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        navigate('/auth');
        return;
      }

      // Check if this is a pending teacher signup
      const isPendingTeacher = localStorage.getItem('pendingTeacherSignup') === 'true';

      try {
        const response = await fetch(`${API}/auth/session-data`, {
          headers: { 'X-Session-ID': sessionId }
        });

        if (!response.ok) throw new Error('Session exchange failed');

        const data = await response.json();
        document.cookie = `session_token=${data.session_token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=none`;

        // Handle pending teacher signup - create teacher application
        if (isPendingTeacher && data.user.role !== 'admin' && data.user.role !== 'teacher') {
          localStorage.removeItem('pendingTeacherSignup');
          
          // Call backend to register as pending teacher
          const teacherResponse = await fetch(`${API}/auth/register-teacher`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });

          if (teacherResponse.ok) {
            // Navigate to teacher dashboard (pending approval state)
            navigate('/teacher/dashboard', {
              state: { user: { ...data.user, role: 'teacher' }, pendingApproval: true },
              replace: true
            });
            return;
          }
        }

        // Clear any pending signup flag
        localStorage.removeItem('pendingTeacherSignup');

        // Check if user already has a role
        if (data.user.role === 'admin') {
          // Admin goes directly to admin dashboard
          navigate('/admin/dashboard', {
            state: { user: data.user },
            replace: true
          });
        } else if (data.user.role === 'teacher') {
          // Teacher goes to teacher dashboard
          navigate('/teacher/dashboard', {
            state: { user: data.user },
            replace: true
          });
        } else if (data.user.role === 'student') {
          // Check if student profile exists
          const studentCheck = await fetch(`${API}/students/dashboard`, {
            credentials: 'include'
          });
          
          if (studentCheck.ok) {
            // Student with profile goes to dashboard
            navigate('/student/dashboard', {
              state: { user: data.user },
              replace: true
            });
          } else {
            // New student goes to onboarding
            navigate('/onboarding', {
              state: { user: data.user },
              replace: true
            });
          }
        } else {
          // New user without role goes to onboarding
          navigate('/onboarding', {
            state: { user: data.user },
            replace: true
          });
        }
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/onboarding');
      }
    };

    processSession();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F3D2E] mx-auto mb-4"></div>
        <p className="text-[#5A5A5A]">Authenticating...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.user) {
      setUser(location.state.user);
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await fetch(`${API}/auth/me`, {
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Not authenticated');

        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        navigate('/onboarding');
      }
    };

    checkAuth();
  }, [navigate, location.state]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F3D2E]"></div>
      </div>
    );
  }

  if (isAuthenticated && allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return React.cloneElement(children, { user, onUserUpdate: setUser });
}

function AppRouter() {
  const location = useLocation();

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/teacher-signup" element={<TeacherSignup />} />
      <Route path="/auth/admin" element={<AdminLogin />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      <Route path="/student/dashboard" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/student/teachers" element={
        <ProtectedRoute allowedRoles={['student']}>
          <BrowseTeachers />
        </ProtectedRoute>
      } />
      
      <Route path="/student/book/:teacherId" element={
        <ProtectedRoute allowedRoles={['student']}>
          <BookClass />
        </ProtectedRoute>
      } />
      
      <Route path="/teacher/dashboard" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/classroom/:sessionId" element={
        <ProtectedRoute allowedRoles={['teacher', 'student', 'admin']}>
          <ClassroomPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, refetchOnWindowFocus: false } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </QueryClientProvider>
  );
}

export default App;
