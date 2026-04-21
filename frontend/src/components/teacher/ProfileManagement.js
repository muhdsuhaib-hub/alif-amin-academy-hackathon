import React, { useState, useRef, useCallback } from 'react';
import { Camera, User, Mail, Globe, Save, BookOpen, FileText, Upload, X, Play, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { getTimezones } from '../../utils/timezones';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SPECIALTIES = ['Tajweed', 'Hifz', 'Arabic for Kids', 'Quran Recitation', 'Islamic Studies', 'Nooraniah', 'Qirat'];

function UploadZone({ accept, label, sublabel, icon: Icon, maxSizeMB, onUpload, uploading, progress, existingUrl, existingLabel, onRemove }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) onUpload(file);
  }, [onUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  return (
    <div className="space-y-3">
      {existingUrl && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
          {existingUrl.match(/\.(mp4|mov|webm)/) ? (
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Play className="w-4 h-4 text-emerald-700" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-emerald-700" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-emerald-800 truncate">{existingLabel || 'Uploaded'}</p>
            <a href={existingUrl} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 hover:underline truncate block">View file</a>
          </div>
          {onRemove && (
            <button onClick={onRemove} className="p-1.5 rounded-lg hover:bg-emerald-100 transition-colors" data-testid="remove-upload-btn">
              <Trash2 className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          )}
        </div>
      )}

      <div
        className={`relative p-6 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer
          ${dragOver ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20'}
          ${uploading ? 'pointer-events-none opacity-70' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        data-testid={`upload-zone-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }}
        />

        {uploading ? (
          <div className="space-y-3">
            <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-100 flex items-center justify-center">
              <Upload className="w-5 h-5 text-emerald-600 animate-pulse" />
            </div>
            <p className="text-xs font-medium text-emerald-700">Uploading...</p>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden max-w-48 mx-auto">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] text-slate-400">{progress}%</p>
          </div>
        ) : (
          <>
            <Icon className="w-7 h-7 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium text-slate-600">{label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{sublabel}</p>
            <p className="text-[10px] text-slate-400 mt-1">Drag & drop or click to browse (Max {maxSizeMB}MB)</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProfileManagement({ user, teacher, onRefresh, onUserUpdate }) {
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
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [certUploading, setCertUploading] = useState(false);
  const [certProgress, setCertProgress] = useState(0);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const toggleSpecialty = (spec) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  const uploadFile = async (file, endpoint, setUploading, setProgress) => {
    setUploading(true);
    setProgress(0);

    const formPayload = new FormData();
    formPayload.append('file', file);
    if (endpoint.includes('certificate')) {
      formPayload.append('label', file.name.replace(/\.[^.]+$/, ''));
    }

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API}${endpoint}`);
      xhr.withCredentials = true;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      const result = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try { reject(JSON.parse(xhr.responseText)); }
            catch { reject({ detail: 'Upload failed' }); }
          }
        };
        xhr.onerror = () => reject({ detail: 'Network error' });
        xhr.send(formPayload);
      });

      toast.success('File uploaded successfully');
      onRefresh?.();
      return result;
    } catch (err) {
      toast.error(err.detail || 'Upload failed');
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleVideoUpload = (file) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['mp4', 'mov', 'webm'].includes(ext)) {
      toast.error('Please upload MP4, MOV, or WebM files only');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video must be under 50MB');
      return;
    }
    uploadFile(file, '/teacher/upload/video-intro', setVideoUploading, setVideoProgress);
  };

  const handleCertUpload = (file) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      toast.error('Please upload PDF or image files only');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }
    uploadFile(file, '/teacher/upload/certificate', setCertUploading, setCertProgress);
  };

  const handleDeleteCert = async (certId) => {
    try {
      const r = await fetch(`${API}/teacher/certificate/${certId}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (r.ok) {
        toast.success('Certificate removed');
        onRefresh?.();
      }
    } catch { toast.error('Failed to remove certificate'); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userRes = await fetch(`${API}/auth/update-profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ name: formData.name, phone: formData.phone, timezone: formData.timezone, gender: formData.gender }),
      });
      if (userRes.ok) {
        const data = await userRes.json();
        if (data.user) onUserUpdate?.(data.user);
      }
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

  const timezones = getTimezones();

  const inputCls = 'h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pl-11 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all';
  const certificates = teacher?.certificates || [];

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
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Phone</label>
              <PhoneInput
                country="my"
                value={formData.phone}
                onChange={phone => handleChange('phone', `+${phone}`)}
                inputProps={{ 'data-testid': 'teacher-phone-input' }}
                inputStyle={{ height: '48px', width: '100%', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '14px', paddingLeft: '52px' }}
                buttonStyle={{ borderRadius: '16px 0 0 16px', border: '1px solid #e2e8f0', borderRight: 'none', background: 'white' }}
                dropdownStyle={{ borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
              />
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

      {/* Media & Credentials */}
      <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-6" data-testid="media-credentials-section">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Media & Credentials</h3>
        <p className="text-xs text-slate-400 mb-5">Upload your video introduction and teaching certificates to build trust with students.</p>

        <div className="space-y-5">
          {/* Video Intro */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Video Introduction</label>
            <UploadZone
              accept=".mp4,.mov,.webm"
              label="Video Intro"
              sublabel=".mp4, .mov, .webm"
              icon={BookOpen}
              maxSizeMB={50}
              onUpload={handleVideoUpload}
              uploading={videoUploading}
              progress={videoProgress}
              existingUrl={teacher?.video_intro}
              existingLabel="Video Introduction"
            />
          </div>

          {/* Certificates */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
              Certificates & Ijazah
              {certificates.length > 0 && <span className="ml-1 text-emerald-600">({certificates.length})</span>}
            </label>

            {/* Existing certificates list */}
            {certificates.length > 0 && (
              <div className="space-y-2 mb-3">
                {certificates.map((cert) => (
                  <div key={cert.cert_id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{cert.label || cert.original_filename || 'Certificate'}</p>
                      <a href={cert.url} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 hover:underline">View</a>
                    </div>
                    <button
                      onClick={() => handleDeleteCert(cert.cert_id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      data-testid={`delete-cert-${cert.cert_id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <UploadZone
              accept=".pdf,.jpg,.jpeg,.png"
              label="Upload Certificate"
              sublabel=".pdf, .jpg, .png"
              icon={FileText}
              maxSizeMB={10}
              onUpload={handleCertUpload}
              uploading={certUploading}
              progress={certProgress}
            />
          </div>
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
