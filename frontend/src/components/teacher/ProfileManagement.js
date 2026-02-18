import React, { useState } from 'react';
import { Camera, User, Mail, Phone, Globe, Save, BookOpen, FileText } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SPECIALTIES = ['Tajweed', 'Hifz', 'Arabic for Kids', 'Quran Recitation', 'Islamic Studies', 'Nooraniah', 'Qirat'];

export default function ProfileManagement({ user, teacher, onRefresh }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    timezone: user?.timezone || 'Asia/Kuala_Lumpur',
    gender: user?.gender || '',
    bio: teacher?.bio || '',
    specializations: teacher?.specializations || [],
    years_experience: teacher?.years_experience || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const toggleSpecialty = (spec) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update user profile
      await fetch(`${API}/auth/update-profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ name: formData.name, phone: formData.phone, timezone: formData.timezone, gender: formData.gender }),
      });
      // Update teacher profile
      if (teacher?.teacher_id) {
        await fetch(`${API}/teacher/update-profile`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ bio: formData.bio, specializations: formData.specializations, years_experience: formData.years_experience }),
        });
      }
      toast.success('Profile updated successfully');
      onRefresh?.();
    } catch { toast.error('Failed to save profile'); }
    finally { setSaving(false); }
  };

  const timezones = [
    'Asia/Kuala_Lumpur', 'Asia/Singapore', 'Asia/Jakarta', 'Asia/Dubai',
    'Asia/Riyadh', 'Europe/London', 'America/New_York', 'America/Los_Angeles',
    'Australia/Sydney', 'UTC',
  ];

  const inputCls = 'h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pl-11 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all';

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-4" data-testid="teacher-profile-page">
      {/* Avatar */}
      <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-emerald-700 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {user?.picture ? <img src={user.picture} alt={user.name} className="w-20 h-20 object-cover" /> : user?.name?.charAt(0)?.toUpperCase() || 'T'}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm hover:bg-emerald-700 transition-colors" data-testid="teacher-avatar-upload" onClick={() => toast.info('Photo upload coming soon')}>
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Teacher</span>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-5">Personal Information</h3>
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Full Name</label>
            <User className="absolute left-4 top-[calc(50%+8px)] -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} className={inputCls} data-testid="teacher-name-input" />
          </div>
          <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Email</label>
            <Mail className="absolute left-4 top-[calc(50%+8px)] -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input type="email" value={user?.email || ''} disabled className={`${inputCls} bg-slate-50 text-slate-400 cursor-not-allowed`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Phone</label>
              <Phone className="absolute left-4 top-[calc(50%+8px)] -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+60 12 345 6789" className={inputCls} data-testid="teacher-phone-input" />
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Gender</label>
              <User className="absolute left-4 top-[calc(50%+8px)] -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select value={formData.gender} onChange={e => handleChange('gender', e.target.value)} className={inputCls} data-testid="teacher-gender-select">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Timezone</label>
            <Globe className="absolute left-4 top-[calc(50%+8px)] -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select value={formData.timezone} onChange={e => handleChange('timezone', e.target.value)} className={inputCls} data-testid="teacher-timezone-select">
              {timezones.map(tz => <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Professional Info */}
      <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-5">Professional</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Specialties</label>
            <div className="flex flex-wrap gap-2" data-testid="specialty-tags">
              {SPECIALTIES.map(spec => (
                <button
                  key={spec}
                  onClick={() => toggleSpecialty(spec)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    formData.specializations.includes(spec)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  data-testid={`specialty-${spec.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Bio</label>
            <textarea
              value={formData.bio}
              onChange={e => handleChange('bio', e.target.value)}
              placeholder="Tell students about your teaching experience..."
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all resize-none"
              data-testid="teacher-bio-input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Years of Experience</label>
            <input type="number" min="0" max="50" value={formData.years_experience} onChange={e => handleChange('years_experience', parseInt(e.target.value) || 0)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all" data-testid="teacher-experience-input" />
          </div>
        </div>
      </div>

      {/* Credentials */}
      <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-5">Credentials</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="p-5 rounded-2xl border border-dashed border-slate-300 text-center hover:border-emerald-300 hover:bg-emerald-50/30 transition-all" data-testid="video-intro-upload" onClick={() => toast.info('Video upload coming soon')}>
            <BookOpen className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium text-slate-500">Video Intro</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Upload MP4</p>
          </button>
          <button className="p-5 rounded-2xl border border-dashed border-slate-300 text-center hover:border-emerald-300 hover:bg-emerald-50/30 transition-all" data-testid="certificate-upload" onClick={() => toast.info('Certificate upload coming soon')}>
            <FileText className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium text-slate-500">Certificates (Ijazah)</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Upload PDF/Image</p>
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-12 rounded-2xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-60"
        data-testid="save-teacher-profile-btn"
      >
        <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
