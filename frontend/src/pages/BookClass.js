import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, ArrowLeft, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function BookClass({ user }) {
  const navigate = useNavigate();
  const { teacherId } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingType, setBookingType] = useState('trial');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);

  useEffect(() => {
    fetchTeacherAndAvailability();
    fetchStudentProfile();
  }, [teacherId]);

  const fetchStudentProfile = async () => {
    try {
      const response = await fetch(`${API}/students/dashboard`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStudentProfile(data.student);
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
    }
  };

  const fetchTeacherAndAvailability = async () => {
    try {
      const [teacherRes, availRes] = await Promise.all([
        fetch(`${API}/teachers/${teacherId}`, { credentials: 'include' }),
        fetch(`${API}/teachers/${teacherId}/availability`, { credentials: 'include' })
      ]);

      if (teacherRes.ok) {
        const teacherData = await teacherRes.json();
        setTeacher(teacherData);
      }

      if (availRes.ok) {
        const availData = await availRes.json();
        setAvailability(availData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    setBooking(true);
    try {
      const response = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          student_id: user.user_id,
          teacher_id: teacherId,
          start_time_utc: selectedSlot.start_time_utc,
          end_time_utc: selectedSlot.end_time_utc,
          booking_type: bookingType
        })
      });

      if (response.ok) {
        toast.success('Class booked successfully!');
        navigate('/student/dashboard');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to book class');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to book class');
    } finally {
      setBooking(false);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F3D2E]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F5EF' }}>
      <nav className="bg-white border-b" style={{ borderColor: 'rgba(4, 78, 66, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              data-testid="back-button"
              onClick={() => navigate('/student/teachers')}
              className="flex items-center gap-2 text-[#0F3D2E]"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-8 h-8" style={{ color: '#0F3D2E' }} />
              <span className="text-2xl font-medium" style={{ color: '#0F3D2E' }}>Book Class</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {teacher && (
          <div className="bg-white rounded-3xl p-8 shadow-soft mb-8">
            <div className="flex items-center gap-6 mb-6">
              <img
                src={teacher.user?.picture || 'https://via.placeholder.com/100'}
                alt={teacher.user?.name}
                className="w-20 h-20 rounded-full"
              />
              <div>
                <h1 className="text-3xl font-medium mb-2" style={{ color: '#0F3D2E' }}>
                  {teacher.user?.name}
                </h1>
                <p style={{ color: '#5A5A5A' }}>{teacher.bio || 'Experienced Quran teacher'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl" style={{ backgroundColor: '#F7F3E8' }}>
              <div>
                <p className="text-sm mb-1" style={{ color: '#5A5A5A' }}>Experience</p>
                <p className="font-medium" style={{ color: '#0F3D2E' }}>{teacher.years_experience} years</p>
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: '#5A5A5A' }}>Hourly Rate</p>
                <p className="font-medium" style={{ color: '#0F3D2E' }}>RM {teacher.hourly_rate}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl p-8 shadow-soft mb-8">
          <h2 className="text-2xl font-medium mb-6" style={{ color: '#0F3D2E' }}>Select Booking Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              data-testid="booking-type-trial"
              onClick={() => setBookingType('trial')}
              className={`p-4 rounded-xl border-2 transition-all ${
                bookingType === 'trial'
                  ? 'border-[#0F3D2E] bg-[#0F3D2E] bg-opacity-5'
                  : 'border-gray-200 hover:border-[#0F3D2E] hover:border-opacity-30'
              }`}
            >
              <h3 className="text-lg font-medium mb-1" style={{ color: '#0F3D2E' }}>Free Trial</h3>
              <p className="text-sm" style={{ color: '#5A5A5A' }}>15-minute evaluation session</p>
            </button>
            <button
              data-testid="booking-type-paid"
              onClick={() => setBookingType('paid')}
              className={`p-4 rounded-xl border-2 transition-all ${
                bookingType === 'paid'
                  ? 'border-[#0F3D2E] bg-[#0F3D2E] bg-opacity-5'
                  : 'border-gray-200 hover:border-[#0F3D2E] hover:border-opacity-30'
              }`}
            >
              <h3 className="text-lg font-medium mb-1" style={{ color: '#0F3D2E' }}>Regular Class</h3>
              <p className="text-sm" style={{ color: '#5A5A5A' }}>1-hour lesson (RM {teacher?.hourly_rate})</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-soft">
          <h2 className="text-2xl font-medium mb-6" style={{ color: '#0F3D2E' }}>Available Time Slots</h2>

          {availability.length === 0 ? (
            <div data-testid="no-availability" className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
              <p style={{ color: '#5A5A5A' }}>No available time slots at the moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availability.slice(0, 10).map((slot, idx) => (
                <button
                  key={slot.slot_id}
                  data-testid={`time-slot-${idx}`}
                  onClick={() => setSelectedSlot(slot)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedSlot?.slot_id === slot.slot_id
                      ? 'border-[#0F3D2E] bg-[#0F3D2E] bg-opacity-5'
                      : 'border-gray-200 hover:border-[#0F3D2E] hover:border-opacity-30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Clock className="w-5 h-5" style={{ color: '#0F3D2E' }} />
                      <span className="font-medium" style={{ color: '#0F3D2E' }}>
                        {formatDateTime(slot.start_time_utc)}
                      </span>
                    </div>
                    {selectedSlot?.slot_id === slot.slot_id && (
                      <div className="w-6 h-6 rounded-full bg-[#0F3D2E] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {availability.length > 0 && (
            <button
              data-testid="confirm-booking-button"
              onClick={handleBooking}
              disabled={!selectedSlot || booking}
              className="w-full h-12 px-8 rounded-full bg-[#0F3D2E] text-white font-medium transition-all hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-6"
            >
              {booking ? 'Booking...' : 'Confirm Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
