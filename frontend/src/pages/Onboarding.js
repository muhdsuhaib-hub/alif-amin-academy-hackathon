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
    <div className="min-h-screen flex items-center justify-center" className="bg-[#FBFBFD]">
      <div className="w-full max-w-3xl mx-auto px-6 py-12">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 mb-12 text-sm font-medium"
          style={{ color: '#5A5A5A',  }}
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
            <p className="text-2xl font-medium mb-2" style={{ color: '#0F3D2E',  }}>
              Absolutely no payment required to begin.
            </p>
            <p className="text-lg font-normal" style={{ color: '#5A5A5A',  }}>
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
          <p className="text-sm" style={{ color: '#9CA3AF',  }}>
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
              className="text-4xl md:text-5xl font-semibold mb-12"
              style={{ color: '#1F2933',  }}
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
                    backgroundColor: answers[fieldNames[step]] === option.value ? 'rgba(15, 61, 46, 0.03)' : '#FFFFFF',
                    
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
