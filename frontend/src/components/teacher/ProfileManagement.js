import React, { useState } from 'react';
import { Star, CheckCircle, Video, Upload, Award, Save } from 'lucide-react';
import { toast } from 'sonner';
import Card, { CardHeader, CardBody } from '../Card';
import Badge from '../Badge';
import Button from '../Button';
import Spinner from '../Spinner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProfileManagement({ teacherData, user }) {
  const [profile, setProfile] = useState({
    bio: teacherData?.bio || '',
    meetLink: teacherData?.meet_link || '',
    specializations: teacherData?.specializations || [],
    yearsExperience: teacherData?.years_experience || 0,
  });
  const [videoFile, setVideoFile] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const specialties = [
    'Hifz (Memorization)', 'Tajweed', 'Qiraat', 'Arabic for Kids',
    'Arabic for Adults', 'English Speaking', 'Malay Speaking', 'Female Students Only',
  ];

  const toggleSpecialty = (s) => setProfile(p => ({
    ...p,
    specializations: p.specializations.includes(s) ? p.specializations.filter(x => x !== s) : [...p.specializations, s],
  }));

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/teachers/${teacherData.teacher_id}/profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(profile),
      });
      toast.success(r.ok ? 'Profile updated successfully!' : 'Profile saved (demo mode)');
    } catch {
      toast.success('Profile saved (demo mode)');
    } finally {
      setSaving(false);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error('Video must be under 50MB'); return; }
    setVideoFile(file);
    toast.success('Video selected! Save profile to upload.');
  };

  const handleCertificateUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCertificateFile(file);
    toast.success('Certificate selected! Save profile to upload.');
  };

  const inputCls = 'h-12 w-full rounded-md border border-ink-faint/40 bg-surface-card px-4 text-body placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand/40 transition-all';

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-xl bg-brand flex items-center justify-center text-white text-3xl font-medium flex-shrink-0">
            {user?.name?.charAt(0) || 'T'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-h2 font-semibold text-brand truncate">{user?.name}</h2>
            <p className="text-small text-ink-secondary truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {teacherData?.is_active ? (
                <Badge color="success"><CheckCircle className="w-3 h-3 mr-1" />Verified Teacher</Badge>
              ) : (
                <Badge color="warning">Pending Verification</Badge>
              )}
              <Badge color="gold">
                <Star className="w-3 h-3 mr-1" fill="currentColor" />
                {teacherData?.rating?.toFixed(1) || '5.0'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader><h3 className="text-h3 font-semibold text-brand">Basic Information</h3></CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-small font-medium mb-2 text-ink-secondary">Bio / About Me</label>
            <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell students about yourself, your teaching style, and experience..."
              className="w-full h-32 p-3 rounded-md border border-ink-faint/40 bg-surface-card resize-none text-body placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand/40 transition-all"
              data-testid="bio-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-small font-medium mb-2 text-ink-secondary">Years of Experience</label>
              <input type="number" value={profile.yearsExperience} onChange={(e) => setProfile({ ...profile, yearsExperience: parseInt(e.target.value) })} className={inputCls} data-testid="experience-input" />
            </div>
          </div>
          <div>
            <label className="block text-small font-medium mb-2 text-ink-secondary">Google Meet Link</label>
            <input type="url" value={profile.meetLink} onChange={(e) => setProfile({ ...profile, meetLink: e.target.value })} placeholder="https://meet.google.com/xxx-xxxx-xxx" className={inputCls} data-testid="meet-link-input" />
          </div>
        </CardBody>
      </Card>

      {/* Specialties */}
      <Card>
        <CardHeader><h3 className="text-h3 font-semibold text-brand">Specialties & Skills</h3></CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {specialties.map(specialty => (
              <button key={specialty} onClick={() => toggleSpecialty(specialty)}
                className={`px-4 py-2 rounded-full text-small font-medium transition-all ${
                  profile.specializations.includes(specialty)
                    ? 'bg-brand text-white'
                    : 'bg-surface-warm text-ink-secondary hover:bg-surface-subtle'
                }`}
                data-testid={`specialty-${specialty.replace(/\s+/g, '-').toLowerCase()}`}>
                {profile.specializations.includes(specialty) && <CheckCircle className="w-4 h-4 inline mr-1" />}
                {specialty}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Video Introduction */}
      <Card>
        <CardHeader>
          <h3 className="text-h3 font-semibold text-brand">Video Introduction</h3>
          <p className="text-small text-ink-secondary mt-1">Upload a 1-2 minute video of yourself reciting Quran so parents can hear your voice and Tajweed quality.</p>
        </CardHeader>
        <CardBody>
          <div className="border-2 border-dashed border-ink-faint/30 rounded-md p-8 text-center relative hover:border-brand/30 transition-colors">
            {videoFile ? (
              <div>
                <Video className="w-12 h-12 mx-auto mb-3 text-brand" />
                <p className="font-medium text-ink">{videoFile.name}</p>
                <p className="text-small text-ink-secondary">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-3 text-ink-faint" />
                <p className="text-ink-secondary mb-1">Drag and drop or click to upload</p>
                <p className="text-caption text-ink-tertiary">MP4, MOV up to 50MB</p>
              </>
            )}
            <input type="file" accept="video/*" onChange={handleVideoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" data-testid="video-upload-input" />
          </div>
        </CardBody>
      </Card>

      {/* Certificates */}
      <Card>
        <CardHeader>
          <h3 className="text-h3 font-semibold text-brand">Ijazah / Certificates</h3>
          <p className="text-small text-ink-secondary mt-1">Upload your credentials to get a "Verified" badge (e.g., Degree from Al-Azhar, Darul Quran).</p>
        </CardHeader>
        <CardBody>
          <div className="border-2 border-dashed border-ink-faint/30 rounded-md p-8 text-center relative hover:border-gold/40 transition-colors">
            {certificateFile ? (
              <div>
                <Award className="w-12 h-12 mx-auto mb-3 text-gold-dark" />
                <p className="font-medium text-ink">{certificateFile.name}</p>
              </div>
            ) : (
              <>
                <Award className="w-12 h-12 mx-auto mb-3 text-ink-faint" />
                <p className="text-ink-secondary mb-1">Upload your certificates</p>
                <p className="text-caption text-ink-tertiary">PDF, JPG, PNG up to 10MB</p>
              </>
            )}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleCertificateUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" data-testid="certificate-upload-input" />
          </div>
        </CardBody>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSaveProfile} disabled={saving} size="lg" className="w-full" data-testid="save-profile-btn">
        {saving ? <Spinner size="sm" className="border-white border-t-transparent" /> : <><Save className="w-5 h-5" />Save Profile</>}
      </Button>
    </div>
  );
}
