import React, { useState, useEffect } from 'react';
import { Calendar, Globe, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AvailabilityCalendar({ teacherData }) {
  const [availability, setAvailability] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    recurring: false,
    days: []
  });
  const [userTimezone, setUserTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (teacherData?.teacher_id) {
      fetchAvailability();
    }
  }, [teacherData]);

  const fetchAvailability = async () => {
    try {
      const response = await fetch(`${API}/teachers/${teacherData.teacher_id}/availability`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setAvailability(data || []);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const handleAddAvailability = async () => {
    if (!newSlot.startDate || !newSlot.startTime || !newSlot.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const start = new Date(newSlot.startDate);
      const end = newSlot.endDate ? new Date(newSlot.endDate) : start;
      
      let currentDate = new Date(start);
      while (currentDate <= end) {
        const startDateTime = new Date(`${currentDate.toISOString().split('T')[0]}T${newSlot.startTime}`);
        const endDateTime = new Date(`${currentDate.toISOString().split('T')[0]}T${newSlot.endTime}`);

        await fetch(`${API}/teachers/${teacherData.teacher_id}/availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            start_time_utc: startDateTime.toISOString(),
            end_time_utc: endDateTime.toISOString(),
            recurring: newSlot.recurring
          })
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      toast.success('Availability slots added successfully!');
      setShowAddModal(false);
      setNewSlot({ startDate: '', endDate: '', startTime: '', endTime: '', recurring: false, days: [] });
      fetchAvailability();
    } catch (error) {
      toast.error('Failed to add availability');
    } finally {
      setLoading(false);
    }
  };

  const convertToLocalTime = (utcTime) => {
    const date = new Date(utcTime);
    return date.toLocaleString('en-US', { 
      timeZone: userTimezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const convertToLocalDate = (utcTime) => {
    const date = new Date(utcTime);
    return date.toLocaleDateString('en-US', { 
      timeZone: userTimezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Timezone Info */}
      <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
        <Globe className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Your Timezone: {userTimezone}</p>
          <p className="text-xs text-blue-700">All times are automatically converted for students in different timezones</p>
        </div>
      </div>

      {/* Add Availability Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: '#0F3D2E' }}>Your Availability</h3>
          <p className="text-sm text-gray-500">Set when you're available for classes</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#0F3D2E] text-white font-medium transition-all hover:opacity-90"
          data-testid="add-availability-btn"
        >
          <Plus className="w-4 h-4" />
          Add Availability
        </button>
      </div>

      {/* Availability Grid */}
      <div className="bg-white rounded-2xl border overflow-hidden" >
        <div className="p-4 border-b" >
          <h4 className="font-medium" style={{ color: '#1D1D1F' }}>Upcoming Available Slots</h4>
        </div>
        
        {availability.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No availability set</p>
            <p className="text-sm text-gray-400 mt-1">Add your available time slots to start receiving bookings</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(15, 61, 46, 0.05)' }}>
            {availability.slice(0, 15).map((slot, idx) => (
              <div key={slot.slot_id || idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F7F5EF] flex flex-col items-center justify-center">
                    <span className="text-xs font-medium" style={{ color: '#0F3D2E' }}>
                      {convertToLocalDate(slot.start_time_utc).split(' ')[0]}
                    </span>
                    <span className="text-lg font-bold" style={{ color: '#0F3D2E' }}>
                      {new Date(slot.start_time_utc).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: '#1D1D1F' }}>
                      {convertToLocalTime(slot.start_time_utc)} - {convertToLocalTime(slot.end_time_utc)}
                    </p>
                    <p className="text-xs text-gray-500">{convertToLocalDate(slot.start_time_utc)}</p>
                  </div>
                </div>
                <span 
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    slot.is_booked 
                      ? 'bg-green-50 text-green-600' 
                      : 'bg-yellow-50 text-yellow-600'
                  }`}
                >
                  {slot.is_booked ? 'Booked' : 'Available'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Availability Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: '#0F3D2E' }}>Add Availability</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={newSlot.startDate}
                    onChange={(e) => setNewSlot({ ...newSlot, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="apple-input"
                    
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">End Date (Optional)</label>
                  <input
                    type="date"
                    value={newSlot.endDate}
                    onChange={(e) => setNewSlot({ ...newSlot, endDate: e.target.value })}
                    min={newSlot.startDate || new Date().toISOString().split('T')[0]}
                    className="apple-input"
                    
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Start Time</label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="apple-input"
                    
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">End Time</label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="apple-input"
                    
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F5EF]">
                <p className="text-sm font-medium mb-3" style={{ color: '#0F3D2E' }}>Quick Select Time Slots</p>
                <div className="flex flex-wrap gap-2">
                  {['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00', '20:00-22:00'].map((slot) => (
                    <button
                      key={slot}
                      onClick={() => {
                        const [start, end] = slot.split('-');
                        setNewSlot({ ...newSlot, startTime: start, endTime: end });
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-[#0F3D2E] hover:text-white"
                      style={{ backgroundColor: 'white', color: '#0F3D2E', border: '1px solid rgba(15, 61, 46, 0.2)' }}
                    >
                      {slot.replace('-', ' - ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={newSlot.recurring}
                  onChange={(e) => setNewSlot({ ...newSlot, recurring: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-[#0F3D2E] focus:ring-[#0F3D2E]"
                />
                <label htmlFor="recurring" className="text-sm text-gray-700">
                  Make this a recurring weekly slot
                </label>
              </div>

              <button
                onClick={handleAddAvailability}
                disabled={loading}
                className="w-full h-11 rounded-xl bg-[#0F3D2E] text-white font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                data-testid="save-availability-btn"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Availability
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
