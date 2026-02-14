import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    userType: '',
    level: '',
    preference: ''
  });

  const handleAnswer = (field, value) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
    
    if (field === 'userType' && value === 'Teacher') {
      navigate('/teacher-signup');
      return;
    }
    
    setTimeout(() => {
      if (step < 2) {
        setStep(step + 1);
      } else {
        handleComplete();
      }
    }, 300);
  };

  const handleComplete = async () => {
    const onboardingData = {
      userType: answers.userType,
      level: answers.level,
      schedule: answers.preference
    };
    
    // Store onboarding data in localStorage as backup
    localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
    
    // Check if user is already authenticated
    try {
      const response = await fetch(`${API}/auth/me`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        // User is authenticated, complete onboarding
        const userData = await response.json();
        
        // Send onboarding data to backend
        await fetch(`${API}/auth/complete-onboarding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(onboardingData)
        });
        
        localStorage.removeItem('onboardingData');
        // Redirect to student dashboard
        navigate('/student/dashboard', { state: { user: userData } });
      } else {
        // User not authenticated, redirect to Auth page with onboarding data
        navigate('/auth', { 
          state: { 
            fromOnboarding: true, 
            onboardingData 
          },
          replace: true
        });
      }
    } catch (error) {
      // If error, redirect to Auth page with onboarding data
      navigate('/auth', { 
        state: { 
          fromOnboarding: true, 
          onboardingData 
        },
        replace: true
      });
    }
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
      title: "We'd love to know who you are",
      options: [
        { value: 'Student', label: 'Student', description: 'I want to learn myself' },
        { value: 'Parent', label: 'Parent of a student', description: 'For my child or children' },
        { value: 'Teacher', label: 'Teacher', description: 'I want to teach Quran' }
      ]
    },
    {
      title: 'Which best describes your Quran reading?',
      options: [
        { value: 'beginner', label: 'Just starting', description: 'Not confident yet' },
        { value: 'slow', label: 'Read slowly with mistakes', description: 'Need practice and correction' },
        { value: 'comfortable', label: 'Read comfortably', description: 'Want improvement' },
        { value: 'advanced', label: 'Read well', description: 'Want deeper understanding' }
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
  const fieldNames = ['userType', 'level', 'preference'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFD]">
      <div className="w-full max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 mb-12 text-[13px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <p className="text-xl font-semibold mb-2 text-[#0F3D2E] tracking-tight">
              Absolutely no payment required to begin.
            </p>
            <p className="text-[15px] text-gray-400">
              Just a few questions to personalise your experience.
            </p>
          </motion.div>
        )}

        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all ${
                  idx <= step ? 'bg-[#0F3D2E]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-[12px] text-gray-400">
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
            <h2 className="text-3xl md:text-4xl font-semibold mb-10 text-[#1D1D1F] tracking-tight">
              {currentQuestion.title}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => (
                <motion.button
                  key={option.value}
                  data-testid={`option-${option.value}`}
                  onClick={() => handleAnswer(fieldNames[step], option.value)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                  className={`w-full p-5 rounded-2xl text-left border transition-all ${
                    answers[fieldNames[step]] === option.value
                      ? 'border-[#0F3D2E] bg-[#0F3D2E]/[0.03]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                    
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold mb-1" style={{ color: '#1F2933' }}>
                        {option.label}
                      </h3>
                      {option.description && (
                        <p className="text-sm font-normal" style={{ color: '#5A5A5A', fontWeight: 300 }}>
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
