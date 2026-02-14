import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Star, ArrowLeft, Users } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function BrowseTeachers({ user }) {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch(`${API}/teachers`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F3D2E]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" className="bg-[#FBFBFD]">
      <nav className="bg-white border-b" style={{ borderColor: 'rgba(4, 78, 66, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              data-testid="back-button"
              onClick={() => navigate('/student/dashboard')}
              className="flex items-center gap-2 text-[#0F3D2E]"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-8 h-8" style={{ color: '#0F3D2E' }} />
              <span className="text-2xl font-medium" style={{ color: '#0F3D2E' }}>Browse Teachers</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-medium mb-2" style={{ color: '#0F3D2E' }}>Our Expert Teachers</h1>
          <p className="text-gray-500">Choose your preferred teacher and schedule your class</p>
        </div>

        {teachers.length === 0 ? (
          <div data-testid="no-teachers" className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4" className="text-gray-400" />
            <p className="text-gray-500">No teachers available at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((teacher, idx) => (
              <div
                key={teacher.teacher_id}
                data-testid={`teacher-card-${idx}`}
                className="bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-hover transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={teacher.user?.picture || 'https://via.placeholder.com/80'}
                      alt={teacher.user?.name}
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <h3 className="text-xl font-medium" style={{ color: '#0F3D2E' }}>
                        {teacher.user?.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" style={{ color: '#D4AF37' }} fill="#D4AF37" />
                        <span className="text-sm" className="text-gray-500">
                          {teacher.rating.toFixed(1)} ({teacher.total_classes} classes)
                        </span>
                      </div>
                    </div>
                  </div>

                  {teacher.bio && (
                    <p className="text-sm mb-4" className="text-gray-500">
                      {teacher.bio}
                    </p>
                  )}

                  {teacher.specializations && teacher.specializations.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {teacher.specializations.map((spec, i) => (
                          <span
                            key={i}
                            className="text-xs px-3 py-1 rounded-full"
                            style={{ backgroundColor: '#F7F3E8', color: '#0F3D2E' }}
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-sm" className="text-gray-500">
                      <span className="font-medium">Experience:</span> {teacher.years_experience} years
                    </p>
                  </div>

                  <button
                    data-testid={`book-button-${idx}`}
                    onClick={() => navigate(`/student/book/${teacher.teacher_id}`)}
                    className="w-full h-10 px-6 rounded-full bg-[#0F3D2E] text-white font-medium transition-all hover:scale-105 hover:shadow-lg active:scale-95"
                  >
                    Book Class
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
