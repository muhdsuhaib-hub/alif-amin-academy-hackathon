import React, { useState } from 'react';
import { X, BookOpen, Star, Send, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../Button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TRACK_TYPES = [
  'Memorization (Hifz)',
  'Revision (Murajaah)',
  'Recitation (Nazra)',
];

const SURAHS = [
  'Al-Fatihah', 'Al-Baqarah', 'Aal-Imran', 'An-Nisa', 'Al-Maidah', 'Al-Anam',
  'Al-Araf', 'Al-Anfal', 'At-Tawbah', 'Yunus', 'Hud', 'Yusuf', 'Ar-Ra\'d',
  'Ibrahim', 'Al-Hijr', 'An-Nahl', 'Al-Isra', 'Al-Kahf', 'Maryam', 'Ta-Ha',
  'Al-Anbiya', 'Al-Hajj', 'Al-Mu\'minun', 'An-Nur', 'Al-Furqan', 'Ash-Shu\'ara',
  'An-Naml', 'Al-Qasas', 'Al-Ankabut', 'Ar-Rum', 'Luqman', 'As-Sajdah',
  'Al-Ahzab', 'Saba', 'Fatir', 'Ya-Sin', 'As-Saffat', 'Sad', 'Az-Zumar',
  'Ghafir', 'Fussilat', 'Ash-Shura', 'Az-Zukhruf', 'Ad-Dukhan', 'Al-Jathiyah',
  'Al-Ahqaf', 'Muhammad', 'Al-Fath', 'Al-Hujurat', 'Qaf', 'Adh-Dhariyat',
  'At-Tur', 'An-Najm', 'Al-Qamar', 'Ar-Rahman', 'Al-Waqi\'ah', 'Al-Hadid',
  'Al-Mujadilah', 'Al-Hashr', 'Al-Mumtahanah', 'As-Saff', 'Al-Jumu\'ah',
  'Al-Munafiqun', 'At-Taghabun', 'At-Talaq', 'At-Tahrim', 'Al-Mulk', 'Al-Qalam',
  'Al-Haqqah', 'Al-Ma\'arij', 'Nuh', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddathir',
  'Al-Qiyamah', 'Al-Insan', 'Al-Mursalat', 'An-Naba', 'An-Nazi\'at', 'Abasa',
  'At-Takwir', 'Al-Infitar', 'Al-Mutaffifin', 'Al-Inshiqaq', 'Al-Buruj',
  'At-Tariq', 'Al-A\'la', 'Al-Ghashiyah', 'Al-Fajr', 'Al-Balad', 'Ash-Shams',
  'Al-Layl', 'Ad-Duha', 'Ash-Sharh', 'At-Tin', 'Al-Alaq', 'Al-Qadr',
  'Al-Bayyinah', 'Az-Zalzalah', 'Al-Adiyat', 'Al-Qari\'ah', 'At-Takathur',
  'Al-Asr', 'Al-Humazah', 'Al-Fil', 'Quraysh', 'Al-Ma\'un', 'Al-Kawthar',
  'Al-Kafirun', 'An-Nasr', 'Al-Masad', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas',
];

const IQRA_BOOKS = [1, 2, 3, 4, 5, 6];

// ==================== SESSION REPORT MODAL (Teacher) ====================
export function SessionReportModal({ sessionId, onSubmitted, onClose, isTimeExpired = true }) {
  const [materialType, setMaterialType] = useState('quran');
  const [form, setForm] = useState({
    surah_name: '',
    ayah_start: 1,
    ayah_end: 1,
    iqra_book: 1,
    page_start: 1,
    page_end: 1,
    track_type: TRACK_TYPES[2],
    grading: { fluency_score: 5, tajweed_score: 5, makhraj_score: 5 },
    teacher_comments: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const setGrade = (key, val) =>
    setForm((p) => ({ ...p, grading: { ...p.grading, [key]: Math.min(10, Math.max(1, val)) } }));

  const handleSubmit = async () => {
    if (materialType === 'quran' && !form.surah_name) { toast.error('Please select a Surah'); return; }
    if (materialType === 'iqra' && !form.iqra_book) { toast.error('Please select an Iqra Book'); return; }
    setSubmitting(true);
    try {
      const payload = {
        material_type: materialType,
        track_type: form.track_type,
        grading: form.grading,
        teacher_comments: form.teacher_comments,
      };
      if (materialType === 'quran') {
        payload.surah_name = form.surah_name;
        payload.ayah_start = form.ayah_start || 1;
        payload.ayah_end = form.ayah_end || 1;
      } else {
        payload.iqra_book = form.iqra_book;
        payload.page_start = form.page_start || 1;
        payload.page_end = form.page_end || 1;
      }
      const res = await fetch(`${API}/classroom/session/${sessionId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Session report saved & earnings credited!');
        onSubmitted?.();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to save report');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'h-10 w-full rounded-xl bg-[#F5F5F7] border-none px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20';
  const selectCls = `${inputCls} appearance-none cursor-pointer`;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-modal-in" onClick={(e) => e.stopPropagation()} data-testid="session-report-modal">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-black/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">Session Report</h2>
              <p className="text-xs text-ink-tertiary mt-0.5">Mandatory — fill in before ending class</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
              <X className="w-5 h-5 text-ink-tertiary" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Material Type Toggle */}
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1.5">Material</label>
            <div className="flex gap-2" data-testid="material-toggle">
              {[{ id: 'quran', label: 'Quran' }, { id: 'iqra', label: 'Iqra' }].map((m) => (
                <button key={m.id} onClick={() => setMaterialType(m.id)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${materialType === m.id ? 'bg-brand text-white shadow-sm' : 'bg-[#F5F5F7] text-ink-secondary hover:bg-surface-subtle'}`}
                  data-testid={`material-${m.id}`}>
                  <BookOpen className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />{m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quran: Surah Selector */}
          {materialType === 'quran' && (
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">Surah Covered</label>
              <div className="relative">
                <select value={form.surah_name} onChange={(e) => setForm({ ...form, surah_name: e.target.value })} className={selectCls} data-testid="surah-select">
                  <option value="">Select Surah...</option>
                  {SURAHS.map((s, i) => <option key={i} value={s}>{i + 1}. {s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary pointer-events-none" />
              </div>
            </div>
          )}

          {/* Iqra: Book Selector */}
          {materialType === 'iqra' && (
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">Iqra Book</label>
              <div className="relative">
                <select value={form.iqra_book} onChange={(e) => setForm({ ...form, iqra_book: parseInt(e.target.value) })} className={selectCls} data-testid="iqra-book-select-report">
                  {IQRA_BOOKS.map((b) => <option key={b} value={b}>Iqra Book {b}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary pointer-events-none" />
              </div>
            </div>
          )}

          {/* Range Inputs — labels adapt to material type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">{materialType === 'quran' ? 'Ayah Start' : 'Page Start'}</label>
              <input type="text" inputMode="numeric"
                value={materialType === 'quran' ? form.ayah_start : form.page_start}
                onChange={(e) => { const v = e.target.value; const num = v === '' ? '' : (parseInt(v) || ''); setForm({ ...form, ...(materialType === 'quran' ? { ayah_start: num } : { page_start: num }) }); }}
                onFocus={(e) => e.target.select()} className={inputCls} data-testid="range-start" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">{materialType === 'quran' ? 'Ayah End' : 'Page End'}</label>
              <input type="text" inputMode="numeric"
                value={materialType === 'quran' ? form.ayah_end : form.page_end}
                onChange={(e) => { const v = e.target.value; const num = v === '' ? '' : (parseInt(v) || ''); setForm({ ...form, ...(materialType === 'quran' ? { ayah_end: num } : { page_end: num }) }); }}
                onFocus={(e) => e.target.select()} className={inputCls} data-testid="range-end" />
            </div>
          </div>

          {/* Track Type */}
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1.5">Track Type</label>
            <div className="flex gap-2">
              {TRACK_TYPES.map((t) => (
                <button key={t} onClick={() => setForm({ ...form, track_type: t })}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${form.track_type === t ? 'bg-brand text-white shadow-sm' : 'bg-[#F5F5F7] text-ink-secondary hover:bg-surface-subtle'}`}
                  data-testid={`track-${t.split(' ')[0].toLowerCase()}`}>
                  {t.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Grading Sliders */}
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-2">Grading (1–10)</label>
            <div className="space-y-3">
              {[
                { key: 'fluency_score', label: 'Fluency' },
                { key: 'tajweed_score', label: 'Tajweed' },
                { key: 'makhraj_score', label: 'Makhraj' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-ink-secondary w-16">{label}</span>
                  <input type="range" min={1} max={10} value={form.grading[key]}
                    onChange={(e) => setGrade(key, parseInt(e.target.value))}
                    className="flex-1 h-1.5 rounded-full appearance-none bg-surface-subtle accent-brand"
                    data-testid={`grade-${key}`} />
                  <span className="text-sm font-semibold text-brand w-6 text-right tabular-nums">{form.grading[key]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1.5">Tutor Notes</label>
            <textarea value={form.teacher_comments} onChange={(e) => setForm({ ...form, teacher_comments: e.target.value })}
              placeholder="Any observations, areas of improvement..."
              className="w-full h-20 p-3 rounded-xl bg-[#F5F5F7] border-none text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/20"
              data-testid="teacher-notes" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/5 bg-[#F5F5F7]/50">
          {!isTimeExpired && (
            <p className="text-xs text-amber-600 font-medium text-center mb-3" data-testid="time-lock-message">
              You can submit the final report and claim payment once the class time expires.
            </p>
          )}
          <Button onClick={handleSubmit} disabled={submitting || !isTimeExpired} className="w-full" data-testid="submit-report-btn">
            <Send className="w-4 h-4" />{submitting ? 'Saving...' : !isTimeExpired ? 'Locked — Class Still in Progress' : 'Submit Report & End Class'}
          </Button>
        </div>
      </div>
    </div>
  );
}


// ==================== RATE TEACHER MODAL (Student) ====================
export function RateTeacherModal({ sessionId, teacherName, onSubmitted, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Please select a rating'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/classroom/session/${sessionId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating, review }),
      });
      if (res.ok) {
        toast.success('Thank you for your feedback!');
        onSubmitted?.();
      } else {
        toast.error('Failed to submit rating');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-modal-in" onClick={(e) => e.stopPropagation()} data-testid="rate-teacher-modal">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-3">
            <Star className="w-7 h-7 text-brand" />
          </div>
          <h2 className="text-lg font-semibold text-ink">Rate Your Tutor</h2>
          <p className="text-xs text-ink-tertiary mt-1">How was your class with {teacherName}?</p>

          {/* Stars */}
          <div className="flex justify-center gap-2 my-5" data-testid="star-rating">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(s)}
                className="transition-transform hover:scale-110"
                data-testid={`star-${s}`}>
                <Star className={`w-9 h-9 transition-colors ${(hoverRating || rating) >= s ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-ink-faint'}`} />
              </button>
            ))}
          </div>

          {/* Review */}
          <textarea value={review} onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience (optional)..."
            className="w-full h-20 p-3 rounded-xl bg-[#F5F5F7] border-none text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 text-left"
            data-testid="review-input" />

          <Button onClick={handleSubmit} disabled={submitting} className="w-full mt-4" data-testid="submit-rating-btn">
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </div>
      </div>
    </div>
  );
}
