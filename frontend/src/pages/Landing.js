import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function Landing() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();

  const opacity1 = useTransform(scrollY, [0, 400], [1, 0]);
  const opacity2 = useTransform(scrollY, [300, 700], [0, 1]);
  const opacity3 = useTransform(scrollY, [600, 1000], [0, 1]);
  const opacity4 = useTransform(scrollY, [900, 1300], [0, 1]);

  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-surface-card/70 backdrop-blur-xl border-b border-ink-faint/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex justify-between items-center">
          <span className="text-body font-semibold tracking-tight text-brand">Alif Amin Academy</span>
          <div className="flex items-center gap-2">
            <button
              data-testid="login-button"
              onClick={() => { localStorage.removeItem('onboardingData'); navigate('/auth'); }}
              className="inline-flex items-center justify-center rounded-md font-medium text-small h-10 px-4 text-ink-secondary hover:bg-surface-subtle hover:text-ink transition-all duration-200 active:scale-[0.97]"
            >
              Log In
            </button>
            <button
              data-testid="signup-button"
              onClick={() => navigate('/onboarding')}
              className="inline-flex items-center justify-center rounded-md font-medium text-small h-11 px-6 bg-brand text-white hover:bg-brand-light shadow-apple-xs hover:shadow-apple-sm transition-all duration-200 active:scale-[0.97]"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ opacity: opacity1 }}>
            <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] font-semibold tracking-tight leading-[1.05] mb-8 text-ink">
              Learn the Quran.
              <br />
              <span className="text-brand">Calmly. Clearly.</span>
              <br />
              At Your Pace.
            </h1>
            <p className="text-lg md:text-xl mb-4 text-ink-secondary font-normal">
              From Alif to Amin. Guided Every Step.
            </p>
            <motion.button
              data-testid="start-free-button"
              onClick={() => navigate('/onboarding')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="mt-12 inline-flex items-center justify-center rounded-md font-medium text-body h-14 px-10 bg-brand text-white hover:bg-brand-light shadow-apple-xs hover:shadow-apple-sm transition-all duration-200"
            >
              Start Absolutely Free
            </motion.button>
            <p className="mt-4 text-small text-ink-tertiary">No card required</p>
          </motion.div>
        </div>
      </section>

      {/* Value Props */}
      <motion.section className="relative py-32 overflow-hidden" style={{ opacity: opacity2 }}>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="space-y-12">
            {['Guided for beginners and families', 'Personalised after just 3 simple questions', 'No payment or commitment upfront'].map((text, idx) => (
              <div key={idx} className="space-y-6">
                <p className="text-xl md:text-2xl font-medium text-ink tracking-tight">{text}</p>
                {idx < 2 && <div className="w-16 h-px mx-auto bg-ink-faint" />}
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* How It Starts */}
      <motion.section className="relative py-32 overflow-hidden bg-surface-card" style={{ opacity: opacity3 }}>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-semibold text-center mb-20 tracking-tight text-brand">
            How It Starts
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { number: '1', title: 'Answer 3 simple questions', description: 'Tell us about yourself and your learning goals' },
              { number: '2', title: 'Get a personalised learning path', description: 'We match you with the perfect teacher and schedule' },
              { number: '3', title: 'Begin your free trial', description: 'Start learning with absolutely no commitment' },
            ].map((step, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: idx * 0.2 }} className="text-center space-y-5">
                <div className="w-16 h-16 rounded-lg mx-auto flex items-center justify-center text-2xl font-semibold text-white bg-brand">
                  {step.number}
                </div>
                <h3 className="text-h3 text-ink">{step.title}</h3>
                <p className="text-body text-ink-secondary leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-20">
            <motion.button
              data-testid="begin-trial-button"
              onClick={() => navigate('/onboarding')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center rounded-md font-medium text-body h-14 px-10 bg-brand text-white hover:bg-brand-light shadow-apple-xs hover:shadow-apple-sm transition-all duration-200"
            >
              Begin Free Trial
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section className="relative py-32 overflow-hidden" style={{ opacity: opacity4 }}>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-16">
            {[
              '"A calm and respectful approach to learning. Perfect for our family."',
              '"No pressure, just genuine guidance. Exactly what we needed."',
            ].map((quote, idx) => (
              <div key={idx} className="text-center space-y-8">
                <p className="text-lg md:text-xl text-ink-secondary italic leading-relaxed">{quote}</p>
                {idx === 0 && <div className="w-16 h-px mx-auto bg-ink-faint" />}
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-12 border-t border-ink-faint/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="text-body font-semibold tracking-tight text-brand">Alif Amin</span>
            <div className="flex gap-8 text-small text-ink-secondary">
              {['About', 'Contact', 'Privacy', 'Terms'].map(link => (
                <a key={link} href="#" className="hover:text-ink transition-colors">{link}</a>
              ))}
            </div>
          </div>
          <div className="text-center mt-8 text-caption text-ink-tertiary">
            2025 Alif Amin. From Alif to Amin. Guided Every Step.
          </div>
        </div>
      </footer>
    </div>
  );
}
