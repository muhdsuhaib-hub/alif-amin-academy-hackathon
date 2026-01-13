import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    userType: '',
    level: '',
    learner: '',
    preference: ''
  });

  const handleAnswer = (field, value) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
    
    if (field === 'userType' && value === 'Teacher') {
      navigate('/teacher-signup');
      return;
    }
    
    setTimeout(() => {
      if (step < 3) {
        setStep(step + 1);
      } else {
        handleComplete();
      }
    }, 300);
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding', JSON.stringify(answers));
    
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigate('/');
    }
  };

  const questions = [
    {
      title: 'Who are you?',
      options: [
        { value: 'Student', label: 'Student', description: 'I want to learn myself' },
        { value: 'Parent', label: 'Parent of a student', description: 'For my child or children' },
        { value: 'Teacher', label: 'Teacher', description: 'I want to teach Quran' }
      ]
    },
    {
      title: 'Current Quran reading level?',
      options: [
        { value: 'beginner', label: 'Just starting', description: 'Not confident yet' },
        { value: 'slow', label: 'Read slowly with mistakes', description: 'Need practice and correction' },
        { value: 'comfortable', label: 'Read comfortably', description: 'Want improvement' },
        { value: 'advanced', label: 'Read well', description: 'Want deeper understanding' }
      ]
    },
    {
      title: 'Who will be learning?',
      options: [
        { value: 'myself', label: 'Myself', description: '' },
        { value: 'child', label: 'My child / children', description: '' },
        { value: 'other', label: 'Someone else', description: '' }
      ]
    },
    {
      title: 'Class preference?',
      options: [
        { value: 'fixed', label: 'Fixed schedule', description: 'Same time every week' },
        { value: 'flexible', label: 'Flexible timing', description: 'Book as needed' }
      ]
    }
  ];

  const currentQuestion = questions[step];
  const fieldNames = ['userType', 'level', 'learner', 'preference'];

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F5EF' }}>
      <div className="w-full max-w-3xl mx-auto px-6 py-12">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 mb-12 text-sm font-medium"
          style={{ color: '#5A5A5A' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <p className="text-2xl font-light mb-2" style={{ color: '#0F3D2E' }}>
              Absolutely no payment required to begin.
            </p>
            <p className="text-lg font-light" style={{ color: '#5A5A5A' }}>
              Just a few questions to personalise your experience.
            </p>
          </motion.div>
        )}

        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className="h-1 flex-1 rounded-full transition-all"
                style={{
                  backgroundColor: idx <= step ? '#0F3D2E' : 'rgba(15, 61, 46, 0.1)'
                }}
              />
            ))}
          </div>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            Question {step + 1} of {questions.length}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <h2 
              className="text-4xl md:text-5xl font-light mb-12"
              style={{ color: '#1F2933' }}
            >
              {currentQuestion.title}
            </h2>

            <div className="space-y-4">
              {currentQuestion.options.map((option, idx) => (
                <motion.button
                  key={option.value}
                  data-testid={`option-${option.value}`}
                  onClick={() => handleAnswer(fieldNames[step], option.value)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full p-6 rounded-2xl text-left border-2 transition-all"
                  style={{
                    borderColor: answers[fieldNames[step]] === option.value ? '#0F3D2E' : 'rgba(15, 61, 46, 0.1)',
                    backgroundColor: answers[fieldNames[step]] === option.value ? 'rgba(15, 61, 46, 0.03)' : '#FFFFFF'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-medium mb-1" style={{ color: '#1F2933' }}>
                        {option.label}
                      </h3>
                      {option.description && (
                        <p className="text-sm" style={{ color: '#5A5A5A' }}>
                          {option.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#0F3D2E' }} />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
