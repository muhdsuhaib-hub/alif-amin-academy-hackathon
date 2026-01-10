import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Calendar, Video, Award, ArrowRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Landing() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <nav className="fixed top-0 w-full z-50 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8" style={{ color: '#044E42' }} />
            <span className="text-2xl font-medium" style={{ color: '#044E42' }}>Al-Ilm Academy</span>
          </div>
          <button
            data-testid="nav-login-button"
            onClick={() => navigate('/login')}
            className="h-10 px-6 rounded-full border-2 border-[#044E42] text-[#044E42] font-medium hover:bg-[#044E42] hover:text-white transition-all"
          >
            Login
          </button>
        </div>
      </nav>

      <section className="min-h-screen flex items-center relative overflow-hidden pt-20">
        <div 
          className="absolute inset-0 opacity-20" 
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1600616677773-0fbd06bd2727?crop=entropy&cs=srgb&fm=jpg&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-7xl font-medium tracking-tight leading-tight mb-6" style={{ color: '#044E42' }}>
                Learn Quran with Expert Teachers
              </h1>
              <p className="text-lg md:text-xl leading-relaxed mb-8" style={{ color: '#5A5A5A' }}>
                Connect with qualified Quran teachers for personalized 1-on-1 video lessons. Choose your teacher, schedule at your convenience, and progress at your own pace.
              </p>
              <div className="flex gap-4">
                <button
                  data-testid="get-started-button"
                  onClick={handleGetStarted}
                  className="h-12 px-8 rounded-full bg-[#044E42] text-white font-medium transition-all hover:scale-105 hover:shadow-lg active:scale-95 flex items-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  data-testid="book-trial-button"
                  onClick={handleGetStarted}
                  className="h-12 px-8 rounded-full bg-[#D4AF37] bg-opacity-10 text-[#044E42] font-medium transition-all hover:bg-opacity-20"
                >
                  Book Free Trial
                </button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1618190405497-00f284b5dda5?crop=entropy&cs=srgb&fm=jpg&q=85"
                alt="Student learning Quran"
                className="rounded-3xl shadow-soft w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 relative" style={{ backgroundColor: '#F7F3E8' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-4" style={{ color: '#044E42' }}>
              Why Choose Al-Ilm Academy?
            </h2>
            <p className="text-lg" style={{ color: '#5A5A5A' }}>
              Premium Quran education designed for modern families
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="w-12 h-12" />,
                title: 'Expert Teachers',
                description: 'Learn from qualified and experienced Quran teachers with proven track records.'
              },
              {
                icon: <Calendar className="w-12 h-12" />,
                title: 'Flexible Scheduling',
                description: 'Choose times that work for you. Our teachers are available across multiple time zones.'
              },
              {
                icon: <Video className="w-12 h-12" />,
                title: '1-on-1 Video Lessons',
                description: 'Personalized attention through live video sessions with integrated digital Quran.'
              },
              {
                icon: <Award className="w-12 h-12" />,
                title: 'Track Progress',
                description: 'Monitor your learning journey with detailed progress tracking and teacher feedback.'
              },
              {
                icon: <BookOpen className="w-12 h-12" />,
                title: 'Digital Mushaf',
                description: 'Follow along with our integrated digital Quran reader during your lessons.'
              },
              {
                icon: <ArrowRight className="w-12 h-12" />,
                title: 'Free Trial',
                description: 'Start with a complimentary 15-minute evaluation session before committing.'
              }
            ].map((feature, idx) => (
              <div 
                key={idx}
                data-testid={`feature-card-${idx}`}
                className="p-8 rounded-3xl bg-white border border-[#044E42] border-opacity-5 shadow-soft hover:shadow-hover transition-all duration-300 group"
              >
                <div className="mb-4" style={{ color: '#D4AF37' }}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-medium mb-3" style={{ color: '#044E42' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#5A5A5A' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-4" style={{ color: '#044E42' }}>
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Sign Up', description: 'Create your account in seconds with Google' },
              { step: '2', title: 'Choose Teacher', description: 'Browse our qualified teachers and pick your favorite' },
              { step: '3', title: 'Schedule Class', description: 'Book a time slot that fits your schedule' },
              { step: '4', title: 'Start Learning', description: 'Join your live video class and begin your journey' }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-medium text-white"
                  style={{ backgroundColor: '#044E42' }}
                >
                  {item.step}
                </div>
                <h3 className="text-xl font-medium mb-2" style={{ color: '#044E42' }}>
                  {item.title}
                </h3>
                <p className="text-sm" style={{ color: '#5A5A5A' }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24" style={{ backgroundColor: '#044E42' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-6 text-white">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-lg mb-8 text-white text-opacity-90">
            Join hundreds of students learning Quran with Al-Ilm Academy
          </p>
          <button
            data-testid="cta-get-started-button"
            onClick={handleGetStarted}
            className="h-12 px-8 rounded-full bg-[#D4AF37] text-[#044E42] font-medium transition-all hover:scale-105 hover:shadow-glow active:scale-95"
          >
            Get Started Today
          </button>
        </div>
      </section>

      <footer className="py-12 border-t" style={{ borderColor: 'rgba(4, 78, 66, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-6 h-6" style={{ color: '#044E42' }} />
            <span className="text-xl font-medium" style={{ color: '#044E42' }}>Al-Ilm Academy</span>
          </div>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            © 2025 Al-Ilm Academy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
