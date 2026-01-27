import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Mail, Lock, User, Phone, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login'); // 'login', 'register', 'profile'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailExists, setEmailExists] = useState(null);
  const [authProvider, setAuthProvider] = useState(null);
  
  // Get onboarding data from location state or localStorage
  const stateOnboardingData = location.state?.onboardingData || {};
  const storedData = typeof window !== 'undefined' ? localStorage.getItem('onboardingData') : null;
  const localOnboardingData = storedData ? JSON.parse(storedData) : {};
  const onboardingData = Object.keys(stateOnboardingData).length > 0 ? stateOnboardingData : localOnboardingData;
  const isFromOnboarding = location.state?.fromOnboarding || Object.keys(localOnboardingData).length > 0;
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    schedulePreference: onboardingData.schedule || '',
    readingLevel: onboardingData.level || '',
    goals: onboardingData.goals || []
  });

  // If coming from onboarding, go directly to profile registration
  useEffect(() => {
    if (isFromOnboarding) {
      setMode('profile');
    }
  }, [isFromOnboarding]);

  const handleGoogleLogin = () => {
    setLoading(true);
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const checkEmail = async (email) => {
    if (!email || !email.includes('@')) return;
    try {
      const response = await fetch(`${API}/auth/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setEmailExists(data.exists);
      setAuthProvider(data.auth_provider);
      if (data.exists && mode === 'register') {
        setMode('login');
        toast.info('Account found! Please login instead.');
      }
    } catch (error) {
      console.error('Error checking email:', error);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please enter email and password');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      
      // Set session cookie
      document.cookie = `session_token=${data.session_token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=none`;
      
      toast.success('Login successful!');
      navigate(data.redirect_to, { state: { user: data.user }, replace: true });
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.fullName) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          phone: formData.phone,
          role: 'student',
          schedule_preference: formData.schedulePreference,
          reading_level: formData.readingLevel,
          goals: formData.goals
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }
      
      // Set session cookie
      document.cookie = `session_token=${data.session_token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=none`;
      
      // Clear onboarding data from localStorage
      localStorage.removeItem('onboardingData');
      
      toast.success('Registration successful! Welcome to Alif Amin Academy!');
      navigate(data.redirect_to, { state: { user: data.user }, replace: true });
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F7F5EF' }}>
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F3D2E] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#D4AF37] transform -translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
              <BookOpen className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: 'Cal Sans' }}>Alif Amin Academy</span>
          </div>
          
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Cal Sans' }}>
            Begin Your Quran Journey Today
          </h1>
          <p className="text-lg opacity-80 mb-8">
            Learn from qualified teachers in personalized 1-on-1 sessions. 
            Start with a free trial class.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
              <span>Certified Quran teachers</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
              <span>Flexible scheduling</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
              <span>Progress tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button
            onClick={() => {
              if (mode === 'profile') {
                navigate('/onboarding');
              } else {
                navigate('/');
              }
            }}
            className="flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-70"
            style={{ color: '#5A5A5A' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#0F3D2E] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
              Alif Amin Academy
            </span>
          </div>

          <AnimatePresence mode="wait">
            {/* Login Form */}
            {mode === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-3xl font-bold mb-2" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
                  Welcome Back
                </h2>
                <p className="text-gray-500 mb-8">Sign in to continue your learning journey</p>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onBlur={(e) => checkEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full h-12 pl-12 pr-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                        style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                      />
                    </div>
                    {emailExists && authProvider === 'google' && (
                      <p className="text-xs text-amber-600 mt-1">This account uses Google login</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter your password"
                        className="w-full h-12 pl-12 pr-12 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                        style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-[#0F3D2E] text-white font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-sm text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Google Login */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full h-12 rounded-xl border flex items-center justify-center gap-3 font-medium transition-all hover:bg-gray-50 disabled:opacity-50"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)', color: '#1F2933' }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Switch to Register */}
                <p className="text-center mt-6 text-gray-500">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="font-medium hover:underline"
                    style={{ color: '#0F3D2E' }}
                  >
                    Sign up
                  </button>
                </p>
              </motion.div>
            )}

            {/* Register Form */}
            {mode === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-3xl font-bold mb-2" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
                  Create Account
                </h2>
                <p className="text-gray-500 mb-8">Start your Quran learning journey today</p>

                <form onSubmit={(e) => { e.preventDefault(); setMode('profile'); }} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onBlur={(e) => checkEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="w-full h-12 pl-12 pr-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                        style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Create a password (min 6 characters)"
                        required
                        minLength={6}
                        className="w-full h-12 pl-12 pr-12 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                        style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Confirm Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Confirm your password"
                        required
                        className="w-full h-12 pl-12 pr-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                        style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                      />
                    </div>
                  </div>

                  {/* Continue to Profile */}
                  <button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-[#0F3D2E] text-white font-medium transition-all hover:opacity-90"
                  >
                    Continue
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-sm text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Google Signup */}
                <button
                  onClick={handleGoogleLogin}
                  className="w-full h-12 rounded-xl border flex items-center justify-center gap-3 font-medium transition-all hover:bg-gray-50"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)', color: '#1F2933' }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </button>

                {/* Switch to Login */}
                <p className="text-center mt-6 text-gray-500">
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="font-medium hover:underline"
                    style={{ color: '#0F3D2E' }}
                  >
                    Sign in
                  </button>
                </p>
              </motion.div>
            )}

            {/* Profile Registration Form (for new students) */}
            {mode === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-3xl font-bold mb-2" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
                  Complete Your Profile
                </h2>
                <p className="text-gray-500 mb-8">Tell us a bit about yourself</p>

                <form onSubmit={handleEmailRegister} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Enter your full name"
                        required
                        className="w-full h-12 pl-12 pr-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                        style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                      />
                    </div>
                  </div>

                  {/* Email (if not already filled) */}
                  {!formData.email && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Enter your email"
                          required
                          className="w-full h-12 pl-12 pr-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                          style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Phone Number *</label>
                    <div className="flex gap-2">
                      <select
                        value={formData.countryCode || '+60'}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        className="h-12 px-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E] bg-white"
                        style={{ borderColor: 'rgba(15, 61, 46, 0.2)', minWidth: '100px' }}
                        required
                      >
                        <option value="+60">🇲🇾 +60</option>
                        <option value="+65">🇸🇬 +65</option>
                        <option value="+62">🇮🇩 +62</option>
                        <option value="+66">🇹🇭 +66</option>
                        <option value="+63">🇵🇭 +63</option>
                        <option value="+84">🇻🇳 +84</option>
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+92">🇵🇰 +92</option>
                        <option value="+880">🇧🇩 +880</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+966">🇸🇦 +966</option>
                        <option value="+974">🇶🇦 +974</option>
                        <option value="+973">🇧🇭 +973</option>
                        <option value="+968">🇴🇲 +968</option>
                        <option value="+965">🇰🇼 +965</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+61">🇦🇺 +61</option>
                      </select>
                      <div className="relative flex-1">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phoneNumber || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setFormData({ ...formData, phoneNumber: value, phone: `${formData.countryCode || '+60'}${value}` });
                          }}
                          placeholder="123456789"
                          required
                          pattern="[0-9]*"
                          inputMode="numeric"
                          className="w-full h-12 pl-12 pr-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                          style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Numbers only, no spaces or dashes</p>
                  </div>

                  {/* Password (if not already set from previous step) */}
                  {!formData.password && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Password *</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Create a password"
                            required
                            minLength={6}
                            className="w-full h-12 pl-12 pr-12 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                            style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Confirm Password *</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="Confirm your password"
                            required
                            className="w-full h-12 pl-12 pr-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                            style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-[#0F3D2E] text-white font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Create Account & Start Learning'
                    )}
                  </button>
                </form>

                {/* Back to register */}
                <p className="text-center mt-6 text-gray-500">
                  <button
                    onClick={() => setMode('register')}
                    className="font-medium hover:underline"
                    style={{ color: '#0F3D2E' }}
                  >
                    ← Back to previous step
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
