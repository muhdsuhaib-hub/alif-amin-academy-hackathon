import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';

const IslamicPattern = ({ className = '', opacity = 0.03 }) => (
  <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="islamic-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        <path
          d="M50,10 L60,30 L50,50 L40,30 Z M50,50 L60,70 L50,90 L40,70 Z M10,50 L30,60 L50,50 L30,40 Z M50,50 L70,60 L90,50 L70,40 Z"
          fill="none"
          stroke="#0F3D2E"
          strokeWidth="0.5"
          opacity={opacity}
        />
        <circle cx="50" cy="50" r="3" fill="#0F3D2E" opacity={opacity * 1.5} />
        <circle cx="10" cy="10" r="2" fill="#C8A951" opacity={opacity * 0.5} />
        <circle cx="90" cy="10" r="2" fill="#C8A951" opacity={opacity * 0.5} />
        <circle cx="10" cy="90" r="2" fill="#C8A951" opacity={opacity * 0.5} />
        <circle cx="90" cy="90" r="2" fill="#C8A951" opacity={opacity * 0.5} />
      </pattern>
    </defs>
    <rect width="200" height="200" fill="url(#islamic-pattern)" />
  </svg>
);

export default function Landing() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [scrollPosition, setScrollPosition] = useState(0);

  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

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
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F5EF' }}>
      <nav className="fixed top-0 w-full z-50 glass-effect">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-semibold tracking-tight" style={{ color: '#0F3D2E' }}>Alif Amin</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              data-testid="login-button"
              onClick={handleLogin}
              className="h-10 px-6 rounded-full text-sm font-medium transition-all hover:bg-opacity-5"
              style={{ color: '#0F3D2E', border: '1px solid rgba(15, 61, 46, 0.2)' }}
            >
              Log In
            </button>
            <button
              data-testid="signup-button"
              onClick={handleGetStarted}
              className="h-10 px-6 rounded-full text-white text-sm font-medium transition-all hover:scale-105"
              style={{ backgroundColor: '#0F3D2E' }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <motion.div
          className="absolute inset-0 opacity-100"
          style={{ y: y1 }}
        >
          <div className="absolute top-0 left-0 w-full h-full">
            <motion.div
              className="absolute top-20 left-10 w-96 h-96 animate-float"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2 }}
            >
              <IslamicPattern className="w-full h-full" opacity={0.04} />
            </motion.div>
            <motion.div
              className="absolute top-40 right-20 w-80 h-80 animate-rotate-slow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 0.5 }}
            >
              <IslamicPattern className="w-full h-full" opacity={0.03} />
            </motion.div>
            <motion.div
              className="absolute bottom-20 left-1/4 w-72 h-72"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 1 }}
              style={{ y: y2 }}
            >
              <IslamicPattern className="w-full h-full" opacity={0.025} />
            </motion.div>
          </div>
        </motion.div>

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ opacity }}
          >
            <h1 
              className="text-6xl md:text-8xl font-semibold tracking-tight leading-tight mb-8"
              style={{ color: '#1F2933', letterSpacing: '-0.03em' }}
            >
              Learn the Quran.
              <br />
              <span style={{ color: '#0F3D2E' }}>Calmly. Clearly.</span>
              <br />
              At Your Pace.
            </h1>
            
            <p 
              className="text-xl md:text-2xl mb-4 font-normal tracking-wide"
              style={{ color: '#5A5A5A' }}
            >
              From Alif to Amin. Guided Every Step.
            </p>

            <motion.button
              data-testid="start-free-button"
              onClick={handleGetStarted}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-12 h-16 px-12 rounded-full text-white text-lg font-medium shadow-soft"
              style={{ backgroundColor: '#0F3D2E' }}
            >
              Start Absolutely Free
            </motion.button>

            <p className="mt-4 text-sm font-normal" style={{ color: '#9CA3AF' }}>
              No card required
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-32 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-12"
          >
            <div className="space-y-6">
              <p className="text-2xl md:text-3xl font-normal" style={{ color: '#1F2933' }}>
                Guided for beginners and families
              </p>
              <div className="w-24 h-px mx-auto" style={{ backgroundColor: '#C8A951', opacity: 0.3 }}></div>
            </div>

            <div className="space-y-6">
              <p className="text-2xl md:text-3xl font-normal" style={{ color: '#1F2933' }}>
                Personalised after just 3 simple questions
              </p>
              <div className="w-24 h-px mx-auto" style={{ backgroundColor: '#C8A951', opacity: 0.3 }}></div>
            </div>

            <div className="space-y-6">
              <p className="text-2xl md:text-3xl font-normal" style={{ color: '#1F2933' }}>
                No payment or commitment upfront
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-32 relative" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-semibold text-center mb-20 tracking-tight"
            style={{ color: '#0F3D2E' }}
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
                  className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-semibold text-white"
                  style={{ backgroundColor: '#0F3D2E' }}
                >
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold" style={{ color: '#1F2933' }}>
                  {step.title}
                </h3>
                <p className="text-base font-normal" style={{ color: '#5A5A5A' }}>
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
              className="h-14 px-10 rounded-full text-white text-base font-medium shadow-soft"
              style={{ backgroundColor: '#0F3D2E' }}
            >
              Begin Free Trial
            </motion.button>
          </div>
        </div>
      </section>

      <section className="py-32 relative">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-16"
          >
            <div className="text-center space-y-8">
              <p className="text-xl md:text-2xl font-normal italic" style={{ color: '#5A5A5A' }}>
                "A calm and respectful approach to learning. Perfect for our family."
              </p>
              <div className="w-32 h-px mx-auto" style={{ backgroundColor: '#C8A951', opacity: 0.3 }}></div>
            </div>

            <div className="text-center space-y-8">
              <p className="text-xl md:text-2xl font-normal italic" style={{ color: '#5A5A5A' }}>
                "No pressure, just genuine guidance. Exactly what we needed."
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-16 border-t" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-2xl font-semibold tracking-tight" style={{ color: '#0F3D2E' }}>
              Alif Amin
            </div>
            
            <div className="flex gap-8 text-sm font-normal" style={{ color: '#5A5A5A' }}>
              <a href="#" className="hover:opacity-70 transition-opacity">About</a>
              <a href="#" className="hover:opacity-70 transition-opacity">Contact</a>
              <a href="#" className="hover:opacity-70 transition-opacity">Privacy</a>
              <a href="#" className="hover:opacity-70 transition-opacity">Terms</a>
            </div>
          </div>

          <div className="text-center mt-8 text-sm font-normal" style={{ color: '#9CA3AF' }}>
            © 2025 Alif Amin. From Alif to Amin. Guided Every Step.
          </div>
        </div>
      </footer>
    </div>
  );
}
