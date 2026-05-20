import React, { useState } from 'react';
import { Camera, User, Mail, Globe, Lock, Save } from 'lucide-react';
import { toast } from 'sonner';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { getTimezones } from '../../utils/timezones';
import QuranComConnect from '../QuranComConnect';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AccountPage({ user, onUserUpdate }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    timezone: user?.timezone || 'Asia/Kuala_Lumpur',
    gender: user?.gender || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/auth/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (r.ok) {
        const data = await r.json();
        toast.success('Profile updated successfully');
        if (data.user) onUserUpdate?.(data.user);
      } else {
        toast.error('Failed to update profile');
      }
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  const timezones = getTimezones();

  const inputCls = 'h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pl-11 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all';

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto" data-testid="account-page">
      {/* Profile Header */}
      <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-emerald-700 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-20 h-20 object-cover" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'S'
              )}
            </div>
            <button
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm hover:bg-emerald-700 transition-colors"
              data-testid="avatar-upload-btn"
              onClick={() => toast.info('Photo upload coming soon')}
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              Student
            </span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-6 mb-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-5">Personal Information</h3>
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Full Name</label>
            <User className="absolute left-4 top-[calc(50%+8px)] -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              className={inputCls}
              data-testid="account-name-input"
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Email</label>
            <Mail className="absolute left-4 top-[calc(50%+8px)] -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className={`${inputCls} bg-slate-50 text-slate-400 cursor-not-allowed`}
              data-testid="account-email-input"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Phone</label>
            <PhoneInput
              country="my"
              value={formData.phone}
              onChange={phone => handleChange('phone', `+${phone}`)}
              inputProps={{ 'data-testid': 'account-phone-input' }}
              containerClass="phone-input-container"
              inputClass="phone-input-field"
              buttonClass="phone-input-flag"
              inputStyle={{
                height: '48px',
                width: '100%',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                paddingLeft: '52px',
              }}
              buttonStyle={{
                borderRadius: '16px 0 0 16px',
                border: '1px solid #e2e8f0',
                borderRight: 'none',
                background: 'white',
              }}
              dropdownStyle={{
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              }}
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Gender</label>
            <User className="absolute left-4 top-[calc(50%+8px)] -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={formData.gender}
              onChange={e => handleChange('gender', e.target.value)}
              className={inputCls}
              data-testid="account-gender-select"
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Timezone</label>
            <Globe className="absolute left-4 top-[calc(50%+8px)] -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={formData.timezone}
              onChange={e => handleChange('timezone', e.target.value)}
              className={inputCls}
              data-testid="account-timezone-select"
            >
              {timezones.map(tz => {
                let label = tz.replace(/_/g, ' ');
                try {
                  const off = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts().find(p => p.type === 'timeZoneName')?.value;
                  if (off) label += ` (${off})`;
                } catch { /* ignore */ }
                return <option key={tz} value={tz}>{label}</option>;
              })}
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 h-12 rounded-2xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-60"
          data-testid="save-account-btn"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Quran.com Integration */}
      <QuranComConnect />

      {/* Password Section */}
      <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-5">Security</h3>
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Current Password</label>
            <Lock className="absolute left-4 top-[calc(50%+8px)] -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input type="password" placeholder="Enter current password" className={inputCls} data-testid="current-password-input" />
          </div>
          <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">New Password</label>
            <Lock className="absolute left-4 top-[calc(50%+8px)] -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input type="password" placeholder="Enter new password" className={inputCls} data-testid="new-password-input" />
          </div>
        </div>
        <button
          className="w-full mt-6 h-12 rounded-2xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all active:scale-[0.97]"
          data-testid="change-password-btn"
          onClick={() => toast.info('Password change coming soon')}
        >
          Update Password
        </button>
      </div>
    </div>
  );
}
