import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Users, Calendar, Star, Clock, Video, Award, Circle } from 'lucide-react';
import Card from '../Card';
import Badge from '../Badge';

export default function DashboardOverview({ teacherData, students, user, commissionInfo }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-brand to-brand-light rounded-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-h2 font-bold mb-2" data-testid="welcome-message">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-white/70 text-body">Here's your teaching overview for today</p>
          </div>
          {commissionInfo && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-white/20" data-testid="tier-badge">
              {commissionInfo.tier_level === 'elite' && <Award className="w-5 h-5" />}
              {commissionInfo.tier_level === 'rated' && <Star className="w-5 h-5" />}
              {commissionInfo.tier_level === 'new' && <Circle className="w-5 h-5" />}
              <div>
                <p className="text-small font-semibold">{commissionInfo.tier_name}</p>
                <p className="text-caption text-white/70">{Math.round((1 - commissionInfo.commission_rate) * 100)}% earnings rate</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, color: 'text-teal', value: `RM ${(teacherData?.estimated_earnings || 0).toFixed(0)}`, label: 'This Month', testId: 'monthly-earnings' },
          { icon: Users, color: 'text-gold-dark', value: students.length, label: 'Active Students', testId: 'student-count' },
          { icon: Calendar, color: 'text-coral', value: teacherData?.todays_classes?.length || 0, label: 'Classes Today', testId: 'classes-today' },
          { icon: Star, color: 'text-warning', value: (teacherData?.teacher?.rating || 5.0).toFixed(1), label: 'Your Rating', testId: 'teacher-rating', fill: true },
        ].map((stat) => (
          <Card key={stat.testId} className="p-4">
            <stat.icon className={`w-8 h-8 mb-2 ${stat.color}`} {...(stat.fill ? { fill: 'currentColor' } : {})} />
            <p className="text-h2 font-bold text-brand" data-testid={stat.testId}>{stat.value}</p>
            <p className="text-caption text-ink-secondary">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Today's Schedule */}
      <Card>
        <div className="px-6 py-4 border-b border-surface-subtle">
          <h3 className="text-h3 text-brand">Today's Schedule</h3>
        </div>
        <div className="p-6">
          {(!teacherData?.todays_classes || teacherData.todays_classes.length === 0) ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto mb-3 text-ink-faint" />
              <p className="text-ink-secondary">No classes scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teacherData.todays_classes.map((cls, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-md bg-surface-warm">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-10 rounded-full bg-brand" />
                    <div>
                      <p className="font-medium text-ink">{new Date(cls.start_time_utc).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                      <p className="text-caption text-ink-secondary">Student ID: {cls.student_id?.slice(0, 8)}...</p>
                    </div>
                  </div>
                  {cls.session_id ? (
                    <button onClick={() => navigate(`/classroom/${cls.session_id}`)} data-testid="join-class-btn"
                      className="h-9 px-4 rounded-md bg-brand text-white text-small font-medium flex items-center gap-2 hover:bg-brand-light transition-all">
                      <Video className="w-4 h-4" />Join
                    </button>
                  ) : cls.meet_link ? (
                    <a href={cls.meet_link} target="_blank" rel="noopener noreferrer" data-testid="join-class-btn"
                      className="h-9 px-4 rounded-md bg-brand text-white text-small font-medium flex items-center gap-2 hover:bg-brand-light transition-all">
                      <Video className="w-4 h-4" />Join
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
