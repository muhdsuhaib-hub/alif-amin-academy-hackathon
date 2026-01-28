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
    <div className="min-h-screen" style={{ backgroundColor: '#F7F5EF' }}>
      <nav className="fixed top-0 w-full z-50 glass-effect">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-semibold tracking-tight" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>Alif Amin Academy</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              data-testid="login-button"
              onClick={handleLogin}
              className="h-10 px-6 rounded-full text-sm font-medium transition-all hover:bg-opacity-5"
              style={{ color: '#0F3D2E', border: '1px solid rgba(15, 61, 46, 0.2)', fontFamily: 'Cal Sans', fontWeight: 500 }}
            >
              Log In
            </button>
            <button
              data-testid="signup-button"
              onClick={handleGetStarted}
              className="h-10 px-6 rounded-full text-white text-sm font-medium transition-all hover:scale-105"
              style={{ backgroundColor: '#0F3D2E', fontFamily: 'Cal Sans', fontWeight: 600 }}
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
              className="text-6xl md:text-8xl font-bold tracking-tight leading-tight mb-8"
              style={{ color: '#1F2933', fontFamily: 'Great Kingdom', letterSpacing: '-0.01em' }}
            >
              Learn the Quran.
              <br />
              <span style={{ color: '#0F3D2E' }}>Calmly. Clearly.</span>
              <br />
              At Your Pace.
            </h1>
            
            <p 
              className="text-xl md:text-2xl mb-4 font-medium tracking-wide"
              style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}
            >
              From Alif to Amin. Guided Every Step.
            </p>

            <motion.button
              data-testid="start-free-button"
              onClick={handleGetStarted}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-12 h-16 px-12 rounded-full text-white text-lg font-semibold shadow-soft"
              style={{ backgroundColor: '#0F3D2E', fontFamily: 'Cal Sans' }}
            >
              Start Absolutely Free
            </motion.button>

            <p className="mt-4 text-sm font-normal" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>
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
              <p className="text-2xl md:text-3xl font-medium" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                Guided for beginners and families
              </p>
              <div className="w-24 h-px mx-auto" style={{ backgroundColor: '#C8A951', opacity: 0.3 }}></div>
            </div>

            <div className="space-y-6">
              <p className="text-2xl md:text-3xl font-medium" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                Personalised after just 3 simple questions
              </p>
              <div className="w-24 h-px mx-auto" style={{ backgroundColor: '#C8A951', opacity: 0.3 }}></div>
            </div>

            <div className="space-y-6">
              <p className="text-2xl md:text-3xl font-medium" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                No payment or commitment upfront
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section 
        className="relative py-32 overflow-hidden" 
        style={{ backgroundColor: '#FFFFFF', opacity: opacity3 }}
      >
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-semibold text-center mb-20 tracking-tight"
            style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}
          >
            How It Starts
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              {
                number: '1',
                title: 'Answer 3 simple questions',
                description: 'Tell us about yourself and your learning goals'
              },
              {
                number: '2',
                title: 'Get a personalised learning path',
                description: 'We match you with the perfect teacher and schedule'
              },
              {
                number: '3',
                title: 'Begin your free trial',
                description: 'Start learning with absolutely no commitment'
              }
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                className="text-center space-y-6"
              >
                <div 
                  className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-white"
                  style={{ backgroundColor: '#0F3D2E', fontFamily: 'Cal Sans' }}
                >
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold" style={{ color: '#1F2933', fontFamily: 'Cal Sans' }}>
                  {step.title}
                </h3>
                <p className="text-base font-normal" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans', fontWeight: 300 }}>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-20">
            <motion.button
              data-testid="begin-trial-button"
              onClick={handleGetStarted}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="h-14 px-10 rounded-full text-white text-base font-semibold shadow-soft"
              style={{ backgroundColor: '#0F3D2E', fontFamily: 'Cal Sans' }}
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
              <p className="text-xl md:text-2xl font-normal italic" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans', fontWeight: 300 }}>
                "A calm and respectful approach to learning. Perfect for our family."
              </p>
              <div className="w-32 h-px mx-auto" style={{ backgroundColor: '#C8A951', opacity: 0.3 }}></div>
            </div>

            <div className="text-center space-y-8">
              <p className="text-xl md:text-2xl font-normal italic" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans', fontWeight: 300 }}>
                "No pressure, just genuine guidance. Exactly what we needed."
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <footer className="py-16 border-t" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-2xl font-semibold tracking-tight" style={{ color: '#0F3D2E', fontFamily: 'Cal Sans' }}>
              Alif Amin
            </div>
            
            <div className="flex gap-8 text-sm font-medium" style={{ color: '#5A5A5A', fontFamily: 'Cal Sans' }}>
              <a href="#" className="hover:opacity-70 transition-opacity">About</a>
              <a href="#" className="hover:opacity-70 transition-opacity">Contact</a>
              <a href="#" className="hover:opacity-70 transition-opacity">Privacy</a>
              <a href="#" className="hover:opacity-70 transition-opacity">Terms</a>
            </div>
          </div>

          <div className="text-center mt-8 text-sm font-normal" style={{ color: '#9CA3AF', fontFamily: 'Cal Sans', fontWeight: 300 }}>
            © 2025 Alif Amin. From Alif to Amin. Guided Every Step.
          </div>
        </div>
      </footer>
    </div>
  );
}
