import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, X, Clock, User, Video } from 'lucide-react';
import Modal from '../Modal';
import Input from '../Input';
import Select from '../Select';
import Button from '../Button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function BookingCalendar() {
  const [bookings, setBookings] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({
    student_id: '',
    teacher_id: '',
    start_time_utc: '',
    duration_minutes: 60,
    booking_type: 'paid',
    notes: ''
  });

  useEffect(() => {
    fetchBookings();
    fetchTeachers();
    fetchStudents();
  }, [selectedDate, filterTeacher, filterStudent]);

  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDate) {
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        params.append('start_date', startDate.toISOString());
        params.append('end_date', endDate.toISOString());
      }
      if (filterTeacher) params.append('teacher_id', filterTeacher);
      if (filterStudent) params.append('student_id', filterStudent);

      const response = await fetch(`${API}/admin/calendar/bookings?${params}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch(`${API}/teachers`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API}/admin/users/all?role=student&limit=100`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.users);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleCreateManualBooking = async () => {
    if (!newBooking.student_id || !newBooking.teacher_id || !newBooking.start_time_utc) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch(`${API}/admin/calendar/manual-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newBooking)
      });

      if (response.ok) {
        toast.success('Manual booking created successfully');
        setShowManualBooking(false);
        setNewBooking({
          student_id: '',
          teacher_id: '',
          start_time_utc: '',
          duration_minutes: 60,
          booking_type: 'paid',
          notes: ''
        });
        fetchBookings();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create booking');
      }
    } catch (error) {
      toast.error('Error creating booking');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await fetch(`${API}/admin/calendar/bookings/${bookingId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Booking cancelled successfully');
        fetchBookings();
      } else {
        toast.error('Failed to cancel booking');
      }
    } catch (error) {
      toast.error('Error cancelling booking');
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return { bg: 'rgba(46, 182, 160, 0.1)', text: '#2EB6A0' };
      case 'completed': return { bg: 'rgba(15, 61, 46, 0.1)', text: '#0F3D2E' };
      case 'cancelled': return { bg: 'rgba(231, 111, 81, 0.1)', text: '#E76F51' };
      default: return { bg: 'rgba(156, 163, 175, 0.1)', text: '#9CA3AF' };
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: '#1D1D1F',  }}>Master Calendar</h2>
          <p className="text-sm mt-1" style={{ color: '#5A5A5A',  }}>
            View and manage all class bookings
          </p>
        </div>
        <Button onClick={() => setShowManualBooking(true)}>
          <Plus className="w-4 h-4 mr-2 inline" />
          Manual Booking
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Input
          type="date"
          label="Select Date"
          value={selectedDate}
          onChange={setSelectedDate}
        />
        <Select
          label="Filter by Teacher"
          value={filterTeacher}
          onChange={setFilterTeacher}
          options={[
            { value: '', label: 'All Teachers' },
            ...teachers.map(t => ({ value: t.teacher_id, label: t.user?.name || 'Unknown' }))
          ]}
        />
        <Select
          label="Filter by Student"
          value={filterStudent}
          onChange={setFilterStudent}
          options={[
            { value: '', label: 'All Students' },
            ...students.map(s => ({ value: s.student_info?.student_id || '', label: s.name || 'Unknown' }))
          ]}
        />
      </div>

      {/* Bookings Grid */}
      <div className="bg-white rounded-2xl shadow-sm border" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3D2E]"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
            <p style={{ color: '#5A5A5A',  }}>No bookings found for selected date</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid gap-4">
              {bookings.map((booking, idx) => {
                const statusColors = getStatusColor(booking.status);
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border-l-4 hover:shadow-md transition-all"
                    style={{
                      borderLeftColor: statusColors.text,
                      backgroundColor: '#FDFBF7'
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" style={{ color: '#5A5A5A' }} />
                            <span className="text-sm font-semibold" style={{ color: '#1D1D1F',  }}>
                              {formatTime(booking.start_time_utc)} - {formatTime(booking.end_time_utc)}
                            </span>
                          </div>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                            style={{
                              backgroundColor: statusColors.bg,
                              color: statusColors.text,
                              
                            }}
                          >
                            {booking.status}
                          </span>
                          {booking.booking_type === 'trial' && (
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: 'rgba(200, 169, 81, 0.1)',
                                color: '#C8A951',
                                
                              }}
                            >
                              Trial
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Student</p>
                            <p className="text-sm font-medium" style={{ color: '#1D1D1F',  }}>
                              {booking.student?.user?.name || 'Unknown'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Teacher</p>
                            <p className="text-sm font-medium" style={{ color: '#1D1D1F',  }}>
                              {booking.teacher?.user?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>

                        {booking.meet_link && (
                          <div className="mt-3 flex items-center gap-2">
                            <Video className="w-4 h-4" style={{ color: '#0F3D2E' }} />
                            <a
                              href={booking.meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm hover:underline"
                              style={{ color: '#0F3D2E',  }}
                            >
                              Join Google Meet
                            </a>
                          </div>
                        )}
                      </div>

                      {booking.status === 'scheduled' && (
                        <button
                          onClick={() => handleCancelBooking(booking.booking_id)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-all"
                        >
                          <X className="w-5 h-5" style={{ color: '#E76F51' }} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Manual Booking Modal */}
      <Modal
        isOpen={showManualBooking}
        onClose={() => setShowManualBooking(false)}
        title="Create Manual Booking"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Student"
            value={newBooking.student_id}
            onChange={(val) => setNewBooking({ ...newBooking, student_id: val })}
            options={[
              { value: '', label: 'Select Student' },
              ...students.map(s => ({
                value: s.student_info?.student_id || '',
                label: `${s.name} (${s.email})`
              }))
            ]}
          />
          <Select
            label="Teacher"
            value={newBooking.teacher_id}
            onChange={(val) => setNewBooking({ ...newBooking, teacher_id: val })}
            options={[
              { value: '', label: 'Select Teacher' },
              ...teachers.map(t => ({
                value: t.teacher_id,
                label: t.user?.name || 'Unknown'
              }))
            ]}
          />
          <Input
            type="datetime-local"
            label="Start Time"
            value={newBooking.start_time_utc}
            onChange={(val) => setNewBooking({ ...newBooking, start_time_utc: new Date(val).toISOString() })}
            required
          />
          <Select
            label="Duration"
            value={newBooking.duration_minutes.toString()}
            onChange={(val) => setNewBooking({ ...newBooking, duration_minutes: parseInt(val) })}
            options={[
              { value: '30', label: '30 minutes' },
              { value: '60', label: '1 hour' },
              { value: '90', label: '1.5 hours' },
              { value: '120', label: '2 hours' }
            ]}
          />
          <Select
            label="Booking Type"
            value={newBooking.booking_type}
            onChange={(val) => setNewBooking({ ...newBooking, booking_type: val })}
            options={[
              { value: 'trial', label: 'Trial' },
              { value: 'paid', label: 'Paid' }
            ]}
          />
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#1D1D1F',  }}>
              Notes (Optional)
            </label>
            <textarea
              value={newBooking.notes}
              onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
              placeholder="Add any notes..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
              style={{
                borderColor: 'rgba(15, 61, 46, 0.2)',
                
              }}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreateManualBooking} className="flex-1">
              Create Booking
            </Button>
            <Button onClick={() => setShowManualBooking(false)} variant="secondary" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
