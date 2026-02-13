import React from 'react';
import { DollarSign, Users, Calendar, Star, Clock, Video, Award, Circle } from 'lucide-react';

export default function DashboardOverview({ teacherData, students, user, commissionInfo }) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-[#0F3D2E] to-[#1a5c47] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2" data-testid="welcome-message">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p className="opacity-80">Here's your teaching overview for today</p>
          </div>
          {commissionInfo && (
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              data-testid="tier-badge"
            >
              {commissionInfo.tier_level === 'elite' && <Award className="w-5 h-5" />}
              {commissionInfo.tier_level === 'rated' && <Star className="w-5 h-5" />}
              {commissionInfo.tier_level === 'new' && <Circle className="w-5 h-5" />}
              <div>
                <p className="text-sm font-semibold">{commissionInfo.tier_name}</p>
                <p className="text-xs opacity-80">{Math.round((1 - commissionInfo.commission_rate) * 100)}% earnings rate</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <DollarSign className="w-8 h-8 mb-2" style={{ color: '#2EB6A0' }} />
          <p className="text-2xl font-bold" style={{ color: '#0F3D2E' }} data-testid="monthly-earnings">RM {(teacherData?.estimated_earnings || 0).toFixed(0)}</p>
          <p className="text-xs text-gray-500">This Month</p>
        </div>
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <Users className="w-8 h-8 mb-2" style={{ color: '#D4AF37' }} />
          <p className="text-2xl font-bold" style={{ color: '#0F3D2E' }} data-testid="student-count">{students.length}</p>
          <p className="text-xs text-gray-500">Active Students</p>
        </div>
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <Calendar className="w-8 h-8 mb-2" style={{ color: '#E76F51' }} />
          <p className="text-2xl font-bold" style={{ color: '#0F3D2E' }} data-testid="classes-today">{teacherData?.todays_classes?.length || 0}</p>
          <p className="text-xs text-gray-500">Classes Today</p>
        </div>
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <Star className="w-8 h-8 mb-2" style={{ color: '#FBBF24' }} fill="#FBBF24" />
          <p className="text-2xl font-bold" style={{ color: '#0F3D2E' }} data-testid="teacher-rating">{(teacherData?.teacher?.rating || 5.0).toFixed(1)}</p>
          <p className="text-xs text-gray-500">Your Rating</p>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-2xl border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <h3 className="font-semibold" style={{ color: '#0F3D2E' }}>Today's Schedule</h3>
        </div>
        <div className="p-4">
          {(!teacherData?.todays_classes || teacherData.todays_classes.length === 0) ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No classes scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teacherData.todays_classes.map((cls, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#F7F5EF]">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-10 rounded-full bg-[#0F3D2E]"></div>
                    <div>
                      <p className="font-medium" style={{ color: '#1F2933' }}>
                        {new Date(cls.start_time_utc).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </p>
                      <p className="text-xs text-gray-500">Student ID: {cls.student_id?.slice(0, 8)}...</p>
                    </div>
                  </div>
                  {cls.meet_link && (
                    <a
                      href={cls.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-4 rounded-lg bg-[#0F3D2E] text-white text-sm font-medium flex items-center gap-2"
                      data-testid="join-class-btn"
                    >
                      <Video className="w-4 h-4" />
                      Join
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
