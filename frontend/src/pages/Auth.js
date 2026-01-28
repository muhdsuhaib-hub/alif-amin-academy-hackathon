import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Mail, Lock, User, Phone, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Complete list of country codes with flags
const COUNTRY_CODES = [
  { code: '+93', flag: '🇦🇫', name: 'Afghanistan' },
  { code: '+355', flag: '🇦🇱', name: 'Albania' },
  { code: '+213', flag: '🇩🇿', name: 'Algeria' },
  { code: '+376', flag: '🇦🇩', name: 'Andorra' },
  { code: '+244', flag: '🇦🇴', name: 'Angola' },
  { code: '+54', flag: '🇦🇷', name: 'Argentina' },
  { code: '+374', flag: '🇦🇲', name: 'Armenia' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+43', flag: '🇦🇹', name: 'Austria' },
  { code: '+994', flag: '🇦🇿', name: 'Azerbaijan' },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+375', flag: '🇧🇾', name: 'Belarus' },
  { code: '+32', flag: '🇧🇪', name: 'Belgium' },
  { code: '+501', flag: '🇧🇿', name: 'Belize' },
  { code: '+229', flag: '🇧🇯', name: 'Benin' },
  { code: '+975', flag: '🇧🇹', name: 'Bhutan' },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+387', flag: '🇧🇦', name: 'Bosnia' },
  { code: '+267', flag: '🇧🇼', name: 'Botswana' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+673', flag: '🇧🇳', name: 'Brunei' },
  { code: '+359', flag: '🇧🇬', name: 'Bulgaria' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+257', flag: '🇧🇮', name: 'Burundi' },
  { code: '+855', flag: '🇰🇭', name: 'Cambodia' },
  { code: '+237', flag: '🇨🇲', name: 'Cameroon' },
  { code: '+1', flag: '🇨🇦', name: 'Canada' },
  { code: '+238', flag: '🇨🇻', name: 'Cape Verde' },
  { code: '+236', flag: '🇨🇫', name: 'Central African Republic' },
  { code: '+235', flag: '🇹🇩', name: 'Chad' },
  { code: '+56', flag: '🇨🇱', name: 'Chile' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+57', flag: '🇨🇴', name: 'Colombia' },
  { code: '+269', flag: '🇰🇲', name: 'Comoros' },
  { code: '+242', flag: '🇨🇬', name: 'Congo' },
  { code: '+506', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+385', flag: '🇭🇷', name: 'Croatia' },
  { code: '+53', flag: '🇨🇺', name: 'Cuba' },
  { code: '+357', flag: '🇨🇾', name: 'Cyprus' },
  { code: '+420', flag: '🇨🇿', name: 'Czech Republic' },
  { code: '+45', flag: '🇩🇰', name: 'Denmark' },
  { code: '+253', flag: '🇩🇯', name: 'Djibouti' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: '+503', flag: '🇸🇻', name: 'El Salvador' },
  { code: '+240', flag: '🇬🇶', name: 'Equatorial Guinea' },
  { code: '+291', flag: '🇪🇷', name: 'Eritrea' },
  { code: '+372', flag: '🇪🇪', name: 'Estonia' },
  { code: '+251', flag: '🇪🇹', name: 'Ethiopia' },
  { code: '+679', flag: '🇫🇯', name: 'Fiji' },
  { code: '+358', flag: '🇫🇮', name: 'Finland' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+241', flag: '🇬🇦', name: 'Gabon' },
  { code: '+220', flag: '🇬🇲', name: 'Gambia' },
  { code: '+995', flag: '🇬🇪', name: 'Georgia' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+30', flag: '🇬🇷', name: 'Greece' },
  { code: '+502', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+224', flag: '🇬🇳', name: 'Guinea' },
  { code: '+592', flag: '🇬🇾', name: 'Guyana' },
  { code: '+509', flag: '🇭🇹', name: 'Haiti' },
  { code: '+504', flag: '🇭🇳', name: 'Honduras' },
  { code: '+852', flag: '🇭🇰', name: 'Hong Kong' },
  { code: '+36', flag: '🇭🇺', name: 'Hungary' },
  { code: '+354', flag: '🇮🇸', name: 'Iceland' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+98', flag: '🇮🇷', name: 'Iran' },
  { code: '+964', flag: '🇮🇶', name: 'Iraq' },
  { code: '+353', flag: '🇮🇪', name: 'Ireland' },
  { code: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: '+225', flag: '🇨🇮', name: 'Ivory Coast' },
  { code: '+1876', flag: '🇯🇲', name: 'Jamaica' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: '+7', flag: '🇰🇿', name: 'Kazakhstan' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+996', flag: '🇰🇬', name: 'Kyrgyzstan' },
  { code: '+856', flag: '🇱🇦', name: 'Laos' },
  { code: '+371', flag: '🇱🇻', name: 'Latvia' },
  { code: '+961', flag: '🇱🇧', name: 'Lebanon' },
  { code: '+266', flag: '🇱🇸', name: 'Lesotho' },
  { code: '+231', flag: '🇱🇷', name: 'Liberia' },
  { code: '+218', flag: '🇱🇾', name: 'Libya' },
  { code: '+423', flag: '🇱🇮', name: 'Liechtenstein' },
  { code: '+370', flag: '🇱🇹', name: 'Lithuania' },
  { code: '+352', flag: '🇱🇺', name: 'Luxembourg' },
  { code: '+853', flag: '🇲🇴', name: 'Macau' },
  { code: '+261', flag: '🇲🇬', name: 'Madagascar' },
  { code: '+265', flag: '🇲🇼', name: 'Malawi' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+960', flag: '🇲🇻', name: 'Maldives' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+356', flag: '🇲🇹', name: 'Malta' },
  { code: '+222', flag: '🇲🇷', name: 'Mauritania' },
  { code: '+230', flag: '🇲🇺', name: 'Mauritius' },
  { code: '+52', flag: '🇲🇽', name: 'Mexico' },
  { code: '+373', flag: '🇲🇩', name: 'Moldova' },
  { code: '+377', flag: '🇲🇨', name: 'Monaco' },
  { code: '+976', flag: '🇲🇳', name: 'Mongolia' },
  { code: '+382', flag: '🇲🇪', name: 'Montenegro' },
  { code: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: '+258', flag: '🇲🇿', name: 'Mozambique' },
  { code: '+95', flag: '🇲🇲', name: 'Myanmar' },
  { code: '+264', flag: '🇳🇦', name: 'Namibia' },
  { code: '+977', flag: '🇳🇵', name: 'Nepal' },
  { code: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+64', flag: '🇳🇿', name: 'New Zealand' },
  { code: '+505', flag: '🇳🇮', name: 'Nicaragua' },
  { code: '+227', flag: '🇳🇪', name: 'Niger' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+850', flag: '🇰🇵', name: 'North Korea' },
  { code: '+389', flag: '🇲🇰', name: 'North Macedonia' },
  { code: '+47', flag: '🇳🇴', name: 'Norway' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+970', flag: '🇵🇸', name: 'Palestine' },
  { code: '+507', flag: '🇵🇦', name: 'Panama' },
  { code: '+675', flag: '🇵🇬', name: 'Papua New Guinea' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+51', flag: '🇵🇪', name: 'Peru' },
  { code: '+63', flag: '🇵🇭', name: 'Philippines' },
  { code: '+48', flag: '🇵🇱', name: 'Poland' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+1787', flag: '🇵🇷', name: 'Puerto Rico' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+40', flag: '🇷🇴', name: 'Romania' },
  { code: '+7', flag: '🇷🇺', name: 'Russia' },
  { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+221', flag: '🇸🇳', name: 'Senegal' },
  { code: '+381', flag: '🇷🇸', name: 'Serbia' },
  { code: '+248', flag: '🇸🇨', name: 'Seychelles' },
  { code: '+232', flag: '🇸🇱', name: 'Sierra Leone' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+421', flag: '🇸🇰', name: 'Slovakia' },
  { code: '+386', flag: '🇸🇮', name: 'Slovenia' },
  { code: '+677', flag: '🇸🇧', name: 'Solomon Islands' },
  { code: '+252', flag: '🇸🇴', name: 'Somalia' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+82', flag: '🇰🇷', name: 'South Korea' },
  { code: '+211', flag: '🇸🇸', name: 'South Sudan' },
  { code: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: '+94', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+249', flag: '🇸🇩', name: 'Sudan' },
  { code: '+597', flag: '🇸🇷', name: 'Suriname' },
  { code: '+46', flag: '🇸🇪', name: 'Sweden' },
  { code: '+41', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+963', flag: '🇸🇾', name: 'Syria' },
  { code: '+886', flag: '🇹🇼', name: 'Taiwan' },
  { code: '+992', flag: '🇹🇯', name: 'Tajikistan' },
  { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+66', flag: '🇹🇭', name: 'Thailand' },
  { code: '+670', flag: '🇹🇱', name: 'Timor-Leste' },
  { code: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: '+676', flag: '🇹🇴', name: 'Tonga' },
  { code: '+1868', flag: '🇹🇹', name: 'Trinidad and Tobago' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisia' },
  { code: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: '+993', flag: '🇹🇲', name: 'Turkmenistan' },
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+380', flag: '🇺🇦', name: 'Ukraine' },
  { code: '+971', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+598', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+998', flag: '🇺🇿', name: 'Uzbekistan' },
  { code: '+678', flag: '🇻🇺', name: 'Vanuatu' },
  { code: '+58', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+84', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+967', flag: '🇾🇪', name: 'Yemen' },
  { code: '+260', flag: '🇿🇲', name: 'Zambia' },
  { code: '+263', flag: '🇿🇼', name: 'Zimbabwe' }
];

// Custom Country Code Selector Component - shows only flag when collapsed
function CountryCodeSelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef(null);
  
  const selectedCountry = COUNTRY_CODES.find(c => c.code === value) || COUNTRY_CODES.find(c => c.code === '+60');
  
  const filteredCountries = COUNTRY_CODES.filter(country => 
    country.name.toLowerCase().includes(search.toLowerCase()) ||
    country.code.includes(search)
  );

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 px-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E] bg-white flex items-center gap-2 min-w-[90px]"
        style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
      >
        <span className="text-2xl leading-none">{selectedCountry.flag}</span>
        <span className="text-sm text-gray-600">{selectedCountry.code}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl border shadow-lg z-50 overflow-hidden" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
          <div className="p-2 border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
              style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredCountries.map((country) => (
              <button
                key={`${country.code}-${country.name}`}
                type="button"
                onClick={() => {
                  onChange(country.code);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                  value === country.code ? 'bg-[#0F3D2E]/5' : ''
                }`}
              >
                <span className="text-xl leading-none">{country.flag}</span>
                <span className="text-sm text-gray-800 flex-1 text-left">{country.name}</span>
                <span className="text-sm text-gray-500">{country.code}</span>
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
  const [mode, setMode] = useState('login'); // 'login', 'profile'
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
    countryCode: '+60',
    phoneNumber: '',
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

  const checkEmail = async (email) => {
    if (!email || !email.includes('@')) return;
    try {
      const response = await fetch(`${API}/auth/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setEmailExists(data.exists);
      setAuthProvider(data.auth_provider);
      if (data.exists && mode === 'profile') {
        toast.info('Account already exists! Please log in instead.');
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

    if (!formData.phoneNumber) {
      toast.error('Phone number is required');
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

    const fullPhone = `${formData.countryCode}${formData.phoneNumber}`;
    
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          phone: fullPhone,
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
            {mode === 'profile' ? 'Back to questions' : 'Back to home'}
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
                <p className="text-gray-500 mb-8">Log in to continue your learning journey</p>

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
                      'Log In'
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

                {/* Switch to Sign Up - goes to onboarding */}
                <p className="text-center mt-6 text-gray-500">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => navigate('/onboarding')}
                    className="font-medium hover:underline"
                    style={{ color: '#0F3D2E' }}
                  >
                    Sign up
                  </button>
                </p>
              </motion.div>
            )}

            {/* Profile Registration Form (for new students from onboarding) */}
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

                  {/* Email - Always show */}
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
                    {emailExists && (
                      <p className="text-xs text-amber-600 mt-1">
                        This email is already registered. <button onClick={() => setMode('login')} className="underline">Log in instead?</button>
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Phone Number *</label>
                    <div className="flex gap-2">
                      <CountryCodeSelector 
                        value={formData.countryCode}
                        onChange={(code) => setFormData({ ...formData, countryCode: code })}
                      />
                      <div className="relative flex-1">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setFormData({ ...formData, phoneNumber: value, phone: `${formData.countryCode}${value}` });
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

                  {/* Password - Always show */}
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

                  {/* Confirm Password - Always show */}
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

                {/* Back to onboarding */}
                <p className="text-center mt-6 text-gray-500">
                  <button
                    onClick={() => navigate('/onboarding')}
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
