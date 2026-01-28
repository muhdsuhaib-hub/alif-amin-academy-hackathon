import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);
    
    const clientId = '106062879766-o4frbkk9tuhlmve4tc51g9hrpnu94dhf.apps.googleusercontent.com';
    const redirectUri = `${BACKEND_URL}/api/auth/google/callback`;
    const scope = 'email profile';
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent`;
    
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F5EF' }}>
      <div className="max-w-md w-full mx-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-8 text-sm font-medium"
          style={{ color: '#5A5A5A' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="bg-white rounded-3xl p-10 shadow-soft">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold mb-2 tracking-tight" style={{ color: '#0F3D2E' }}>
              Admin Access
            </h1>
            <p className="text-sm font-normal" style={{ color: '#5A5A5A' }}>
              Alif Amin Academy
            </p>
          </div>

          <button
            data-testid="admin-google-login-button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-12 px-8 rounded-full text-white font-medium transition-all hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
            style={{ backgroundColor: '#0F3D2E' }}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p className="text-xs text-center mt-6 font-normal" style={{ color: '#9CA3AF' }}>
            This area is for staff and administrators only
          </p>
        </div>
      </div>
    </div>
  );
}
