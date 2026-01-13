import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import '@/App.css';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import BrowseTeachers from './pages/BrowseTeachers';
import BookClass from './pages/BookClass';
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
        navigate('/onboarding');
        return;
      }

      try {
        const response = await fetch(`${API}/auth/session-data`, {
          headers: { 'X-Session-ID': sessionId }
        });

        if (!response.ok) throw new Error('Session exchange failed');

        const data = await response.json();
        document.cookie = `session_token=${data.session_token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=none`;

        const roleRoutes = {
          student: '/student/dashboard',
          teacher: '/teacher/dashboard',
          admin: '/admin/dashboard'
        };

        navigate(roleRoutes[data.user.role] || '/student/dashboard', {
          state: { user: data.user },
          replace: true
        });
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

  return React.cloneElement(children, { user });
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
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
