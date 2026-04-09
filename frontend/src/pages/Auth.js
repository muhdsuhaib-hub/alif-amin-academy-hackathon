import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Mail, Lock, User, Phone, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Spinner from '../components/Spinner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COUNTRY_CODES = [
  { code: '+93', flag: '\u{1F1E6}\u{1F1EB}', name: 'Afghanistan' },
  { code: '+355', flag: '\u{1F1E6}\u{1F1F1}', name: 'Albania' },
  { code: '+213', flag: '\u{1F1E9}\u{1F1FF}', name: 'Algeria' },
  { code: '+61', flag: '\u{1F1E6}\u{1F1FA}', name: 'Australia' },
  { code: '+973', flag: '\u{1F1E7}\u{1F1ED}', name: 'Bahrain' },
  { code: '+880', flag: '\u{1F1E7}\u{1F1E9}', name: 'Bangladesh' },
  { code: '+55', flag: '\u{1F1E7}\u{1F1F7}', name: 'Brazil' },
  { code: '+1', flag: '\u{1F1E8}\u{1F1E6}', name: 'Canada' },
  { code: '+86', flag: '\u{1F1E8}\u{1F1F3}', name: 'China' },
  { code: '+20', flag: '\u{1F1EA}\u{1F1EC}', name: 'Egypt' },
  { code: '+33', flag: '\u{1F1EB}\u{1F1F7}', name: 'France' },
  { code: '+49', flag: '\u{1F1E9}\u{1F1EA}', name: 'Germany' },
  { code: '+91', flag: '\u{1F1EE}\u{1F1F3}', name: 'India' },
  { code: '+62', flag: '\u{1F1EE}\u{1F1E9}', name: 'Indonesia' },
  { code: '+98', flag: '\u{1F1EE}\u{1F1F7}', name: 'Iran' },
  { code: '+964', flag: '\u{1F1EE}\u{1F1F6}', name: 'Iraq' },
  { code: '+962', flag: '\u{1F1EF}\u{1F1F4}', name: 'Jordan' },
  { code: '+254', flag: '\u{1F1F0}\u{1F1EA}', name: 'Kenya' },
  { code: '+965', flag: '\u{1F1F0}\u{1F1FC}', name: 'Kuwait' },
  { code: '+961', flag: '\u{1F1F1}\u{1F1E7}', name: 'Lebanon' },
  { code: '+218', flag: '\u{1F1F1}\u{1F1FE}', name: 'Libya' },
  { code: '+60', flag: '\u{1F1F2}\u{1F1FE}', name: 'Malaysia' },
  { code: '+212', flag: '\u{1F1F2}\u{1F1E6}', name: 'Morocco' },
  { code: '+234', flag: '\u{1F1F3}\u{1F1EC}', name: 'Nigeria' },
  { code: '+968', flag: '\u{1F1F4}\u{1F1F2}', name: 'Oman' },
  { code: '+92', flag: '\u{1F1F5}\u{1F1F0}', name: 'Pakistan' },
  { code: '+970', flag: '\u{1F1F5}\u{1F1F8}', name: 'Palestine' },
  { code: '+63', flag: '\u{1F1F5}\u{1F1ED}', name: 'Philippines' },
  { code: '+974', flag: '\u{1F1F6}\u{1F1E6}', name: 'Qatar' },
  { code: '+966', flag: '\u{1F1F8}\u{1F1E6}', name: 'Saudi Arabia' },
  { code: '+65', flag: '\u{1F1F8}\u{1F1EC}', name: 'Singapore' },
  { code: '+252', flag: '\u{1F1F8}\u{1F1F4}', name: 'Somalia' },
  { code: '+27', flag: '\u{1F1FF}\u{1F1E6}', name: 'South Africa' },
  { code: '+249', flag: '\u{1F1F8}\u{1F1E9}', name: 'Sudan' },
  { code: '+963', flag: '\u{1F1F8}\u{1F1FE}', name: 'Syria' },
  { code: '+90', flag: '\u{1F1F9}\u{1F1F7}', name: 'Turkey' },
  { code: '+256', flag: '\u{1F1FA}\u{1F1EC}', name: 'Uganda' },
  { code: '+971', flag: '\u{1F1E6}\u{1F1EA}', name: 'United Arab Emirates' },
  { code: '+44', flag: '\u{1F1EC}\u{1F1E7}', name: 'United Kingdom' },
  { code: '+1', flag: '\u{1F1FA}\u{1F1F8}', name: 'United States' },
  { code: '+967', flag: '\u{1F1FE}\u{1F1EA}', name: 'Yemen' },
];

function CountryCodeSelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef(null);
  const selectedCountry = COUNTRY_CODES.find(c => c.code === value) || COUNTRY_CODES.find(c => c.code === '+60');
  const filteredCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search)
  );

  React.useEffect(() => {
    const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 px-3 rounded-md border border-ink-faint/40 focus:outline-none focus:ring-2 focus:ring-brand/15 bg-surface-card flex items-center gap-2 min-w-[90px]"
      >
        <span className="text-2xl leading-none">{selectedCountry.flag}</span>
        <span className="text-small text-ink-secondary">{selectedCountry.code}</span>
        <svg className={`w-4 h-4 text-ink-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-surface-card rounded-md border border-ink-faint/30 shadow-apple-md z-50 overflow-hidden">
          <div className="p-2 border-b border-surface-subtle">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..." autoFocus
              className="w-full h-9 px-3 rounded-sm border border-ink-faint/30 text-small focus:outline-none focus:ring-2 focus:ring-brand/15" />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredCountries.map((country) => (
              <button key={`${country.code}-${country.name}`} type="button"
                onClick={() => { onChange(country.code); setIsOpen(false); setSearch(''); }}
                className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-surface-subtle transition-colors ${value === country.code ? 'bg-brand/5' : ''}`}>
                <span className="text-xl leading-none">{country.flag}</span>
                <span className="text-small text-ink flex-1 text-left">{country.name}</span>
                <span className="text-small text-ink-secondary">{country.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailExists, setEmailExists] = useState(null);
  const [authProvider, setAuthProvider] = useState(null);

  const stateOnboardingData = location.state?.onboardingData || {};
  const storedData = typeof window !== 'undefined' ? localStorage.getItem('onboardingData') : null;
  const localOnboardingData = storedData ? JSON.parse(storedData) : {};
  const onboardingData = Object.keys(stateOnboardingData).length > 0 ? stateOnboardingData : localOnboardingData;
  const isFromOnboarding = location.state?.fromOnboarding || Object.keys(localOnboardingData).length > 0;
  const isExplicitLogin = location.state?.isLogin === true;

  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', fullName: '',
    phone: '', countryCode: '+60', phoneNumber: '',
    schedulePreference: onboardingData.schedule || '',
    readingLevel: onboardingData.level || '',
    userType: onboardingData.userType || 'Student',
    goals: onboardingData.goals || [],
  });

  useEffect(() => { if (isExplicitLogin) setMode('login'); else if (isFromOnboarding) setMode('profile'); }, [isFromOnboarding, isExplicitLogin]);

  const handleGoogleLogin = (isSignup = false) => {
    setLoading(true);
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/google/callback`;
    const statePayload = isSignup ? encodeURIComponent(JSON.stringify({
      user_type: formData.userType || onboardingData.userType || 'Student',
      level: formData.readingLevel || onboardingData.level || '',
      schedule: formData.schedulePreference || onboardingData.schedule || '',
    })) : '';
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('email profile')}&access_type=offline&prompt=consent${statePayload ? `&state=${statePayload}` : ''}`;
  };

  const checkEmail = async (email) => {
    if (!email || !email.includes('@')) return;
    try {
      const response = await fetch(`${API}/auth/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setEmailExists(data.exists); setAuthProvider(data.auth_provider);
      if (data.exists && mode === 'profile') toast.info('Account already exists! Please log in instead.');
    } catch (e) { console.error('Error checking email:', e); }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) { toast.error('Please enter email and password'); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email, password: formData.password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Login failed');
      document.cookie = `session_token=${data.session_token}; path=/; max-age=${7*24*60*60}; secure; samesite=none`;
      toast.success('Login successful!');
      navigate(data.redirect_to, { state: { user: data.user }, replace: true });
    } catch (error) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.fullName) { toast.error('Please fill in all required fields'); return; }
    if (!formData.phoneNumber) { toast.error('Phone number is required'); return; }
    if (formData.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (formData.password !== formData.confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password, full_name: formData.fullName, phone: `${formData.countryCode}${formData.phoneNumber}`, role: formData.userType === 'Tutor' ? 'teacher' : 'student', user_type: formData.userType, schedule_preference: formData.schedulePreference, reading_level: formData.readingLevel, goals: formData.goals }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Registration failed');
      document.cookie = `session_token=${data.session_token}; path=/; max-age=${7*24*60*60}; secure; samesite=none`;
      localStorage.removeItem('onboardingData');
      toast.success('Registration successful! Welcome to Alif Amin Academy!');
      navigate(data.redirect_to, { state: { user: data.user }, replace: true });
    } catch (error) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  const inputCls = "h-12 w-full rounded-md border border-ink-faint/40 bg-surface-card px-4 text-body placeholder:text-ink-tertiary focus:outline-none focus:ring-1 focus:ring-[#0f2e24] focus:border-[#0f2e24] transition-all duration-200 font-['Bricolage_Grotesque']";

  return (
    <div className="min-h-screen flex bg-[#fbfaf6]">
      {/* Left Side Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#fbfaf6] relative overflow-hidden flex-col p-10 xl:p-14">
        <img src="https://storage.googleapis.com/alif-amin-assets/landing-page/Green%20png%20bg.png" className="h-20 w-auto mb-auto self-start" alt="Logo" />
        <img src="https://storage.googleapis.com/alif-amin-assets/landing-page/Login.jpg" className="max-w-md w-full object-cover shadow-2xl rounded-3xl mx-auto" alt="Community" />
        <h1 className="font-['Libre_Baskerville'] text-[#0f2e24] text-4xl md:text-5xl leading-tight mt-auto">Explore the Book<br />of Wisdom.</h1>
      </div>

      {/* Right Side Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8 bg-white" style={{ boxShadow: '-10px 0 30px rgba(0,0,0,0.03)', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        <div className="w-full max-w-[400px]">
          <button onClick={() => mode === 'profile' ? navigate('/onboarding') : navigate('/')}
            className="flex items-center gap-2 text-small font-medium mb-8 text-ink-tertiary hover:text-[#0f2e24] transition-colors font-['Bricolage_Grotesque']">
            <ArrowLeft className="w-3.5 h-3.5" />
            {mode === 'profile' ? 'Back to questions' : 'Back to home'}
          </button>

          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <img src="https://storage.googleapis.com/alif-amin-assets/landing-page/Green%20png%20bg.png" className="h-8 w-auto" alt="Logo" />
          </div>

          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-h1 text-[#0f2e24] mb-1.5 font-['Bricolage_Grotesque']">Welcome Back</h2>
                <p className="text-ink-tertiary text-body mb-8 font-['Bricolage_Grotesque']">Log in to continue your learning journey</p>
                <form onSubmit={handleEmailLogin} className="space-y-5">
                  <div>
                    <label className="block text-small font-medium text-ink-secondary mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
                      <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} onBlur={(e) => checkEmail(e.target.value)} placeholder="Enter your email" className={`${inputCls} pl-11`} />
                    </div>
                    {emailExists && authProvider === 'google' && <p className="text-caption text-warning mt-1.5">This account uses Google login</p>}
                  </div>
                  <div>
                    <label className="block text-small font-medium text-ink-secondary mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
                      <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Enter your password" className={`${inputCls} pl-11 pr-11`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
                        {showPassword ? <EyeOff className="w-4 h-4 text-ink-tertiary" /> : <Eye className="w-4 h-4 text-ink-tertiary" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full h-12 rounded-md bg-[#0f2e24] text-white font-medium hover:bg-[#0f2e24]/90 transition-all duration-200 flex items-center justify-center font-['Bricolage_Grotesque']">
                    {loading ? <Spinner size="sm" className="border-white border-t-transparent" /> : 'Log In'}
                  </button>
                </form>
                <div className="flex items-center gap-4 my-7"><div className="flex-1 h-px bg-surface-muted" /><span className="text-small text-ink-tertiary font-['Bricolage_Grotesque']">or</span><div className="flex-1 h-px bg-surface-muted" /></div>
                <button onClick={() => handleGoogleLogin(false)} disabled={loading} className="w-full h-12 rounded-md bg-surface-card text-ink border border-ink-faint/40 font-medium hover:bg-surface-subtle hover:border-ink-tertiary transition-all duration-200 flex items-center justify-center gap-3 font-['Bricolage_Grotesque']">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </button>
                <p className="text-center mt-6 text-ink-secondary text-body font-['Bricolage_Grotesque']">
                  Don&apos;t have an account?{' '}
                  <button onClick={() => navigate('/onboarding')} className="font-medium text-[#0f2e24] hover:underline">Sign up</button>
                </p>
              </motion.div>
            )}

            {mode === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-h1 text-[#0f2e24] mb-2 font-['Bricolage_Grotesque']">Complete Your Profile</h2>
                <p className="text-ink-secondary text-body mb-8 font-['Bricolage_Grotesque']">Tell us a bit about yourself</p>
                <form onSubmit={handleEmailRegister} className="space-y-4">
                  <div>
                    <label className="block text-small font-medium text-ink-secondary mb-2">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
                      <input type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Enter your full name" required className={`${inputCls} pl-11`} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-small font-medium text-ink-secondary mb-2">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
                      <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} onBlur={(e) => checkEmail(e.target.value)} placeholder="Enter your email" required className={`${inputCls} pl-11`} />
                    </div>
                    {emailExists && <p className="text-caption text-warning mt-1">This email is already registered. <button onClick={() => setMode('login')} className="underline">Log in instead?</button></p>}
                  </div>
                  <div>
                    <label className="block text-small font-medium text-ink-secondary mb-2">Phone Number *</label>
                    <div className="flex gap-2">
                      <CountryCodeSelector value={formData.countryCode} onChange={(code) => setFormData({...formData, countryCode: code})} />
                      <div className="relative flex-1">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
                        <input type="tel" value={formData.phoneNumber} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g,''); setFormData({...formData, phoneNumber: v, phone: `${formData.countryCode}${v}`}); }} placeholder="123456789" required pattern="[0-9]*" inputMode="numeric" className={`${inputCls} pl-11`} />
                      </div>
                    </div>
                    <p className="text-caption text-ink-tertiary mt-1">Numbers only, no spaces or dashes</p>
                  </div>
                  <div>
                    <label className="block text-small font-medium text-ink-secondary mb-2">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
                      <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Create a password (min 6 characters)" required minLength={6} className={`${inputCls} pl-11 pr-11`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">{showPassword ? <EyeOff className="w-4 h-4 text-ink-tertiary" /> : <Eye className="w-4 h-4 text-ink-tertiary" />}</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-small font-medium text-ink-secondary mb-2">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
                      <input type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} placeholder="Confirm your password" required className={`${inputCls} pl-11`} />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full h-12 rounded-md bg-[#0f2e24] text-white font-medium hover:bg-[#0f2e24]/90 transition-all duration-200 flex items-center justify-center font-['Bricolage_Grotesque']">
                    {loading ? <Spinner size="sm" className="border-white border-t-transparent" /> : 'Create Account & Start Learning'}
                  </button>
                </form>
                <div className="flex items-center gap-4 my-7"><div className="flex-1 h-px bg-surface-muted" /><span className="text-small text-ink-tertiary font-['Bricolage_Grotesque']">or</span><div className="flex-1 h-px bg-surface-muted" /></div>
                <button onClick={() => handleGoogleLogin(true)} disabled={loading} className="w-full h-12 rounded-md bg-surface-card text-ink border border-ink-faint/40 font-medium hover:bg-surface-subtle hover:border-ink-tertiary transition-all duration-200 flex items-center justify-center gap-3 font-['Bricolage_Grotesque']">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </button>
                <p className="text-center mt-6 text-ink-secondary text-body font-['Bricolage_Grotesque']">
                  <button onClick={() => navigate('/onboarding')} className="font-medium text-[#0f2e24] hover:underline">Back to previous step</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
