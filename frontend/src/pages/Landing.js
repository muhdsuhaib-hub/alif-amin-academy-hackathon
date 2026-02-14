import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function Landing() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [scrollPosition, setScrollPosition] = useState(0);

  const opacity1 = useTransform(scrollY, [0, 400], [1, 0]);
  const opacity2 = useTransform(scrollY, [300, 700], [0, 1]);
  const opacity3 = useTransform(scrollY, [600, 1000], [0, 1]);
  const opacity4 = useTransform(scrollY, [900, 1300], [0, 1]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    navigate('/onboarding');
  };

  const handleLogin = () => {
    // Clear any onboarding data so user goes to login, not profile completion
    localStorage.removeItem('onboardingData');
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD]">
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-[17px] font-semibold tracking-tight text-[#0F3D2E]">Alif Amin Academy</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              data-testid="login-button"
              onClick={handleLogin}
              className="apple-btn-ghost"
            >
              Log In
            </button>
            <button
              data-testid="signup-button"
              onClick={handleGetStarted}
              className="apple-btn-primary"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ opacity: opacity1 }}
          >
            <h1 
              className="text-5xl sm:text-6xl md:text-8xl font-semibold tracking-tight leading-[1.05] mb-8 text-[#1D1D1F]"
            >
              Learn the Quran.
              <br />
              <span className="text-[#0F3D2E]">Calmly. Clearly.</span>
              <br />
              At Your Pace.
            </h1>
            
            <p className="text-lg md:text-xl mb-4 text-gray-500 font-normal">
              From Alif to Amin. Guided Every Step.
            </p>

            <motion.button
              data-testid="start-free-button"
              onClick={handleGetStarted}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="mt-12 apple-btn-primary !h-14 !px-10 !text-base"
            >
              Start Absolutely Free
            </motion.button>

            <p className="mt-4 text-sm text-gray-400">
              No card required
            </p>
          </motion.div>
        </div>
      </section>

      <motion.section 
        className="relative py-32 overflow-hidden"
        style={{ opacity: opacity2 }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-12"
          >
            <div className="space-y-6">
              <p className="text-xl md:text-2xl font-medium text-[#1D1D1F] tracking-tight">
                Guided for beginners and families
              </p>
              <div className="w-16 h-px mx-auto bg-gray-200"></div>
            </div>

            <div className="space-y-6">
              <p className="text-xl md:text-2xl font-medium text-[#1D1D1F] tracking-tight">
                Personalised after just 3 simple questions
              </p>
              <div className="w-16 h-px mx-auto bg-gray-200"></div>
            </div>

            <div className="space-y-6">
              <p className="text-xl md:text-2xl font-medium text-[#1D1D1F] tracking-tight">
                No payment or commitment upfront
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section 
        className="relative py-32 overflow-hidden bg-white" 
        style={{ opacity: opacity3 }}
      >
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-semibold text-center mb-20 tracking-tight text-[#0F3D2E]"
          >
            How It Starts
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { number: '1', title: 'Answer 3 simple questions', description: 'Tell us about yourself and your learning goals' },
              { number: '2', title: 'Get a personalised learning path', description: 'We match you with the perfect teacher and schedule' },
              { number: '3', title: 'Begin your free trial', description: 'Start learning with absolutely no commitment' }
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                className="text-center space-y-5"
              >
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-2xl font-semibold text-white bg-[#0F3D2E]">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-[#1D1D1F] tracking-tight">{step.title}</h3>
                <p className="text-[15px] text-gray-500 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-20">
            <motion.button
              data-testid="begin-trial-button"
              onClick={handleGetStarted}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="apple-btn-primary !h-14 !px-10 !text-base"
            >
              Begin Free Trial
            </motion.button>
          </div>
        </div>
      </motion.section>

      <motion.section 
        className="relative py-32 overflow-hidden"
        style={{ opacity: opacity4 }}
      >
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-16"
          >
            <div className="text-center space-y-8">
              <p className="text-lg md:text-xl text-gray-500 italic leading-relaxed">
                "A calm and respectful approach to learning. Perfect for our family."
              </p>
              <div className="w-16 h-px mx-auto bg-gray-200"></div>
            </div>

            <div className="text-center space-y-8">
              <p className="text-lg md:text-xl text-gray-500 italic leading-relaxed">
                "No pressure, just genuine guidance. Exactly what we needed."
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <footer className="py-12 border-t border-gray-200/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-[17px] font-semibold tracking-tight text-[#0F3D2E]">
              Alif Amin
            </div>
            
            <div className="flex gap-8 text-[13px] font-medium text-gray-500">
              <a href="#" className="hover:text-gray-700 transition-colors">About</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Contact</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Terms</a>
            </div>
          </div>

          <div className="text-center mt-8 text-[12px] text-gray-400">
            2025 Alif Amin. From Alif to Amin. Guided Every Step.
          </div>
        </div>
      </footer>
    </div>
  );
}
