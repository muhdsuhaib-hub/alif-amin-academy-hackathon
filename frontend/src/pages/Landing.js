import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';

const SERIF = "'Libre Baskerville', serif";
const SANS = "'Bricolage Grotesque', sans-serif";

const GCS = 'https://storage.googleapis.com/alif-amin-assets/landing-page';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6 },
};

const stagger = (delay) => ({
  ...fadeUp,
  transition: { duration: 0.6, delay },
});

// ─── Section 1: Hero ───
function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden" data-testid="hero-section">
      <video autoPlay loop muted={true} playsInline className="absolute inset-0 w-full h-full object-cover z-0"
        src={`${GCS}/Hero%20Video%202.1.mp4`} />
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5" data-testid="navbar">
        <a href="/">
          <img src={`${GCS}/Green%20png%20bg.png`} alt="AlifAmin Logo" className="h-10 md:h-20 w-auto cursor-pointer" data-testid="nav-logo" />
        </a>
        <div className="flex items-center gap-4" style={{ fontFamily: SANS }}>
          <Link to="/auth" state={{ isLogin: true }} className="text-white text-sm font-medium hover:opacity-80 transition-opacity" data-testid="nav-login">Login</Link>
          <Link to="/onboarding" className="bg-[#0f2e24] text-white text-sm font-medium px-5 py-2 rounded-full hover:scale-105 transition-transform duration-300 inline-block" data-testid="nav-signup">Sign up</Link>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-20 flex-1 flex flex-col justify-end px-6 md:px-10 pb-2 md:pb-4">
        <div className="max-w-4xl">
          <motion.h1 {...stagger(0)} className="text-white leading-[1.1]" style={{ fontFamily: SERIF, fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }} data-testid="hero-heading">
            Learn The Quran.<br />
            <span className="italic">Calmly. Clearly.</span><br />
            At Your Pace.
          </motion.h1>
          <motion.p {...stagger(0.2)} className="text-white/80 mt-4 text-base md:text-lg" style={{ fontFamily: SANS }} data-testid="hero-sub">
            From Alif to Amin. Guided Every Step.
          </motion.p>
        </div>

        <motion.div {...stagger(0.4)} className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0 sm:justify-between">
          <div>{/* spacer on desktop */}</div>
          <div className="flex flex-col items-center">
            <Link to="/onboarding"
              className="bg-[#0f2e24] text-white text-sm md:text-base font-semibold px-8 py-3.5 rounded-2xl hover:scale-105 transition-transform duration-300 inline-block text-center"
              style={{ fontFamily: SANS }} data-testid="hero-cta">
              Begin Free Trial
            </Link>
            <span className="text-white/50 text-xs mt-2" style={{ fontFamily: SANS }}>No card required</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 2: Features & Benefits ───
function Features() {
  const { scrollYProgress } = useScroll();
  const imgY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  const features = [
    { title: 'Designed for Beginners & Families', desc: 'Structured guidance from first letter to confident recitation.' },
    { title: 'Personalised in 60 Seconds', desc: 'Answer 3 simple questions. We build your learning path instantly.' },
    { title: 'Start Free. No Commitment.', desc: 'Explore before you decide \u2014 always.' },
  ];

  return (
    <section className="bg-[#fbfaf6] text-[#0f2e24]" data-testid="features-section">
      {/* Top Bar */}
      <motion.div {...fadeUp} className="border-t border-b border-[#0f2e24]/10 py-8 md:py-10 px-6 md:px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 md:divide-x md:divide-[#0f2e24]/10 text-center">
          {features.map((f, i) => (
            <div key={i} className="px-4 md:px-8">
              <p className="font-bold text-sm md:text-base" style={{ fontFamily: SANS }}>{f.title}</p>
              <p className="text-xs md:text-sm text-[#0f2e24]/60 mt-1" style={{ fontFamily: SANS }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left: Image */}
          <motion.div {...fadeUp}>
            <motion.img
              src={`${GCS}/Section%202.jpg`}
              alt="Student learning Quran"
              className="rounded-3xl object-cover w-full shadow-xl"
              style={{ y: imgY }}
              data-testid="features-image"
            />
          </motion.div>

          {/* Right: Text */}
          <motion.div {...stagger(0.15)} className="relative">
            <div className="bg-[#f3f2ee] rounded-3xl p-8 md:p-10">
              <p className="text-2xl md:text-3xl lg:text-[2rem] leading-snug" style={{ fontFamily: SERIF }} data-testid="features-quote">
                Illuminate <strong>homes with the light of The Quran</strong> by connecting students with expert tutors through a seamless, high-quality online experience.
              </p>
              <div className="w-12 h-px bg-[#0f2e24]/20 my-8" />
              <div className="space-y-1">
                <p className="italic text-lg md:text-xl" style={{ fontFamily: SERIF }}>Where technology serves tradition.</p>
                <p className="italic text-lg md:text-xl" style={{ fontFamily: SERIF }}>Where teachers are valued.</p>
                <p className="italic text-lg md:text-xl" style={{ fontFamily: SERIF }}>Where students are inspired.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 3: Dedicated For You ───
function Dedicated() {
  const { scrollYProgress } = useScroll();
  const vid1Y = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const vid2Y = useTransform(scrollYProgress, [0, 1], [0, -20]);

  return (
    <section className="bg-[#fbfaf6] text-[#0f2e24] pb-20 md:pb-28" data-testid="dedicated-section">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header + Content grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 md:gap-12">
          {/* Left: Big title */}
          <motion.div {...fadeUp}>
            <h2 className="text-5xl md:text-6xl lg:text-7xl leading-[1.1]" style={{ fontFamily: SERIF }} data-testid="dedicated-heading">
              We are<br /><span className="italic text-[#0f2e24]">dedicated for<br />you</span>
            </h2>
          </motion.div>

          {/* Right: 2-column cards with left vertical border */}
          <div className="border-l border-[#0f2e24]/15 pl-6 md:pl-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              {/* Students */}
              <motion.div {...stagger(0.1)}>
                <motion.video autoPlay loop muted playsInline
                  src={`${GCS}/Students.mp4`}
                  className="rounded-2xl object-cover w-full aspect-video shadow-lg mb-5"
                  style={{ y: vid1Y }}
                  data-testid="students-video" />
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: SANS }}>Students</h3>
                <p className="text-sm leading-relaxed text-[#0f2e24]/80" style={{ fontFamily: SANS }}>
                  Every learner is unique.
                </p>
                <p className="text-sm leading-relaxed text-[#0f2e24]/80 mt-3" style={{ fontFamily: SANS }}>
                  Whether you are:
                </p>
                <ul className="list-disc list-inside text-sm leading-relaxed text-[#0f2e24]/80 mt-1 ml-1 space-y-0.5" style={{ fontFamily: SANS }}>
                  <li>A parent searching for a patient teacher for your child</li>
                  <li>An adult refining Tajweed</li>
                </ul>
                <p className="text-sm leading-relaxed text-[#0f2e24]/80 mt-3" style={{ fontFamily: SANS }}>
                  We provide a personalised learning path and connect you with carefully vetted professionals who match your goals, pace, and schedule.
                </p>
                <p className="text-sm italic text-[#0f2e24]/60 mt-4" style={{ fontFamily: SANS }}>
                  Structured. Guided. Peace of mind.
                </p>
              </motion.div>

              {/* Tutors */}
              <motion.div {...stagger(0.2)}>
                <motion.video autoPlay loop muted playsInline
                  src={`${GCS}/Tutor.mp4`}
                  className="rounded-2xl object-cover w-full aspect-video shadow-lg mb-5"
                  style={{ y: vid2Y }}
                  data-testid="tutors-video" />
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: SANS }}>Tutors</h3>
                <p className="text-sm leading-relaxed text-[#0f2e24]/80" style={{ fontFamily: SANS }}>
                  We empower educators to focus on what truly matters &mdash; teaching.
                </p>
                <p className="text-sm leading-relaxed text-[#0f2e24]/80 mt-3" style={{ fontFamily: SANS }}>
                  AlifAmin handles scheduling, payments, and administration so you can dedicate your energy to delivering meaningful lessons.
                </p>
                <ul className="list-disc list-inside text-sm leading-relaxed text-[#0f2e24]/80 mt-3 ml-1 space-y-0.5" style={{ fontFamily: SANS }}>
                  <li>Your knowledge becomes impact.</li>
                  <li>Your expertise becomes sustainable income.</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 4: Join Us CTA ───
function JoinUs() {
  const cols = [
    {
      title: 'Student',
      p1: 'Begin your Quran journey with confidence.',
      p2: 'Matched with verified tutors \u2014 at your pace.',
      btn: 'Free Trial',
      link: '/onboarding',
    },
    {
      title: 'Tutor',
      p1: 'Teach with purpose. Earn with dignity.',
      p2: 'We handle the rest.',
      btn: 'Sign up',
      link: '/teacher-signup',
    },
    {
      title: 'Spread the word',
      p1: 'Help more homes connect to the Quran.',
      p2: 'Share AlifAmin with those you care about.',
      btn: 'Share page',
      action: () => { if (navigator.share) navigator.share({ title: 'AlifAmin', url: window.location.href }); },
    },
  ];

  return (
    <section className="bg-[#0f2e24] text-[#fbfaf6] py-16 md:py-24" data-testid="joinus-section">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <motion.div {...fadeUp} className="flex items-start justify-between">
          <div>
            <h2 className="text-5xl md:text-6xl lg:text-7xl leading-[1.1]" style={{ fontFamily: SERIF }} data-testid="joinus-heading">
              Join Us
            </h2>
            <p className="italic text-2xl md:text-3xl lg:text-4xl mt-4 leading-snug" style={{ fontFamily: SERIF }} data-testid="joinus-sub">
              Students Learn.<br />Tutors Earn.
            </p>
          </div>
          <img src={`${GCS}/White%20png%20bg.png`} alt="AlifAmin Logo" className="h-12 md:h-18 w-auto opacity-90 flex-shrink-0" data-testid="joinus-logo" />
        </motion.div>

        {/* Divider */}
        <div className="w-full h-px bg-white/20 mt-10 mb-12" />

        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x md:divide-white/15">
          {cols.map((c, i) => (
            <motion.div key={i} {...stagger(i * 0.12)} className="md:px-8 first:md:pl-0 last:md:pr-0">
              <h3 className="italic text-2xl md:text-3xl mb-4" style={{ fontFamily: SERIF }}>{c.title}</h3>
              <p className="text-sm text-[#fbfaf6]/80 leading-relaxed" style={{ fontFamily: SANS }}>{c.p1}</p>
              <p className="text-sm text-[#fbfaf6]/80 leading-relaxed mt-3" style={{ fontFamily: SANS }}>{c.p2}</p>
              {c.link ? (
                <Link to={c.link}
                  className="mt-6 inline-block bg-black text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:scale-105 transition-transform duration-300 text-center"
                  style={{ fontFamily: SANS }} data-testid={`joinus-btn-${i}`}>
                  {c.btn}
                </Link>
              ) : (
                <button onClick={c.action}
                  className="mt-6 bg-black text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:scale-105 transition-transform duration-300"
                  style={{ fontFamily: SANS }} data-testid={`joinus-btn-${i}`}>
                  {c.btn}
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 5: Footer ───
function Footer() {
  return (
    <footer className="bg-[#fbfaf6] text-[#0f2e24] py-16 md:py-24" data-testid="footer-section">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Center quotes */}
        <motion.div {...fadeUp} className="max-w-3xl mx-auto text-center space-y-8">
          <p className="text-xl md:text-2xl leading-relaxed" style={{ fontFamily: SERIF }}>
            &ldquo;A world where anyone, anywhere, can access the divine wisdom of the Al Quran with a single click.
          </p>
          <p className="text-xl md:text-2xl leading-relaxed" style={{ fontFamily: SERIF }}>
            A place where modern technology strengthens timeless tradition.
          </p>
          <p className="text-xl md:text-2xl leading-relaxed" style={{ fontFamily: SERIF }}>
            A platform where every home can be illuminated with knowledge.&rdquo;
          </p>
          <p className="italic text-lg text-right pr-4 md:pr-0" style={{ fontFamily: SERIF }} data-testid="footer-brand">AlifAmin.com</p>
        </motion.div>

        {/* Bottom bar */}
        <div className="mt-20 md:mt-28 flex flex-col md:flex-row justify-between items-start md:items-center gap-6" style={{ fontFamily: SANS }}>
          {/* Social */}
          <div>
            <p className="text-sm font-medium mb-2">Social</p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 border border-[#0f2e24]/30 rounded-lg flex items-center justify-center hover:bg-[#0f2e24]/5 transition-colors" aria-label="Facebook" data-testid="social-fb">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#0f2e24]"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 border border-[#0f2e24]/30 rounded-lg flex items-center justify-center hover:bg-[#0f2e24]/5 transition-colors" aria-label="Instagram" data-testid="social-ig">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-[#0f2e24]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
              </a>
              <a href="#" className="w-8 h-8 border border-[#0f2e24]/30 rounded-lg flex items-center justify-center hover:bg-[#0f2e24]/5 transition-colors" aria-label="LinkedIn" data-testid="social-li">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#0f2e24]"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 md:gap-8 text-sm">
            <Link to="/about" className="hover:underline underline-offset-4">About</Link>
            <Link to="/contact" className="hover:underline underline-offset-4">Contact</Link>
            <Link to="/privacy" className="hover:underline underline-offset-4">Privacy</Link>
            <Link to="/terms" className="hover:underline underline-offset-4">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Landing Page ───
export default function Landing() {
  return (
    <div className="min-h-screen bg-[#fbfaf6] overflow-x-hidden" data-testid="landing-page">
      <Hero />
      <Features />
      <Dedicated />
      <JoinUs />
      <Footer />
    </div>
  );
}
