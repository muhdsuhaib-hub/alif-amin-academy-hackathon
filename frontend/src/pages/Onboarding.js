import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import Spinner from '../components/Spinner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const questions = [
  {
    title: "We'd love to know who you are",
    field: 'userType',
    options: [
      { label: 'Student', subtitle: 'I want to learn myself', value: 'Student' },
      { label: 'Parent of a student', subtitle: 'For my child or children', value: 'Parent' },
      { label: 'Teacher', subtitle: 'I want to teach Quran', value: 'Teacher' },
    ]
  },
  {
    title: 'Which best describes your Quran reading?',
    field: 'level',
    options: [
      { label: 'Just starting', subtitle: "Haven't learned Arabic yet", value: 'beginner' },
      { label: 'Read slowly with mistakes', subtitle: "Know some Arabic but need guidance", value: 'slow' },
      { label: 'Read comfortably', subtitle: 'Can read but want to improve', value: 'comfortable' },
      { label: 'Read well', subtitle: 'Looking for advanced tajweed', value: 'advanced' },
    ]
  },
  {
    title: 'What works best for your schedule?',
    field: 'preference',
    options: [
      { label: 'Fixed weekly schedule', subtitle: 'Same time every week', value: 'fixed' },
      { label: 'Flexible booking', subtitle: 'Book as I go', value: 'flexible' },
    ]
  }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [answers, setAnswers] = useState({ userType: '', level: '', preference: '' });

  const handleComplete = async (finalAnswers) => {
    setIsCompleting(true);
    const onboardingData = {
      userType: finalAnswers.userType,
      level: finalAnswers.level,
      schedule: finalAnswers.preference,
    };
    localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
    try {
      const response = await fetch(`${API}/auth/me`, { credentials: 'include' });
      if (response.ok) {
        const userData = await response.json();
        await fetch(`${API}/auth/complete-onboarding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(onboardingData),
        });
        localStorage.removeItem('onboardingData');
        navigate('/student/dashboard', { state: { user: userData } });
      } else {
        navigate('/auth', { state: { fromOnboarding: true, onboardingData }, replace: true });
      }
    } catch {
      navigate('/auth', { state: { fromOnboarding: true, onboardingData }, replace: true });
    }
  };

  const handleAnswer = (field, value) => {
    if (isCompleting) return;
    const updatedAnswers = { ...answers, [field]: value };
    setAnswers(updatedAnswers);

    if (field === 'userType' && value === 'Teacher') {
      navigate('/teacher-signup');
      return;
    }

    setTimeout(() => {
      if (step < 2) setStep(prev => prev + 1);
      else handleComplete(updatedAnswers);
    }, 300);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else navigate('/');
  };

  const current = questions[step];

  if (isCompleting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-body text-ink-secondary">Setting up your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-2xl mx-auto px-6 py-12">
        <button onClick={handleBack} className="flex items-center gap-2 mb-12 text-small font-medium text-ink-tertiary hover:text-ink-secondary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {step === 0 && (
          <div className="text-center mb-12">
            <p className="text-h3 font-semibold text-brand mb-2">Absolutely no payment required to begin.</p>
            <p className="text-body text-ink-secondary">Just a few questions to personalise your experience.</p>
          </div>
        )}

        {/* Progress */}
        <div className="flex gap-2 mb-2">
          {questions.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-brand' : 'bg-surface-muted'}`} />
          ))}
        </div>
        <p className="text-caption text-ink-tertiary mb-8">Question {step + 1} of {questions.length}</p>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            <h2 className="text-h1 text-ink mb-8">{current.title}</h2>
            <div className="space-y-3">
              {current.options.map((opt) => (
                <motion.button
                  key={opt.value}
                  data-testid={`option-${opt.value}`}
                  onClick={() => handleAnswer(current.field, opt.value)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-between p-5 rounded-lg border border-ink-faint/30 bg-surface-card text-left hover:border-brand/30 hover:shadow-apple-sm transition-all duration-200"
                >
                  <div>
                    <p className="text-body font-semibold text-ink">{opt.label}</p>
                    <p className="text-small text-ink-secondary">{opt.subtitle}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-ink-faint" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
