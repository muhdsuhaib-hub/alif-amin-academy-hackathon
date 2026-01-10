import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import '@/App.css';
import Landing from './pages/Landing';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
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
        navigate('/login');
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
        navigate('/login');
      }
    };

    processSession();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#044E42] mx-auto mb-4"></div>
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
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate, location.state]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#044E42]"></div>
      </div>
    );
  }

  if (isAuthenticated && allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return React.cloneElement(children, { user });
}

function LoginPage() {
  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-3xl p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-medium mb-2" style={{ color: '#044E42' }}>Al-Ilm Academy</h1>
            <p className="text-[#5A5A5A]">Welcome back</p>
          </div>

          <button
            data-testid="google-login-button"
            onClick={handleGoogleLogin}
            className="w-full h-12 px-8 rounded-full bg-[#044E42] text-white font-medium transition-all hover:scale-105 hover:shadow-lg active:scale-95 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-xs text-[#9CA3AF] text-center mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

function AppRouter() {
  const location = useLocation();

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginPage />} />
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
