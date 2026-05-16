import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, BookOpen, Star, FileText } from 'lucide-react';
import { SessionReportModal } from '../classroom/EndClassModals';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function PastSessionCard({ session, onOpenReport }) {
  const reviewed = session.tutor_reviewed;
  return (
    <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm" data-testid={`tutor-past-card-${session.booking_id}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-slate-900">
            {new Date(session.start_time_utc).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date(session.start_time_utc).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} &middot; {session.duration_minutes || 30} min
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{session.student_name || 'Student'}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            {session.status === 'missed' ? 'Missed' : 'Completed'}
          </span>
          <div className="flex items-center gap-1.5">
            {reviewed ? (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-600 text-[11px] font-medium" data-testid={`tutor-reviewed-badge-${session.booking_id}`}>
                <CheckCircle className="w-3 h-3" />Report Submitted
              </span>
            ) : session.session_id ? (
              <button
                onClick={() => onOpenReport(session)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500 text-white text-[11px] font-semibold hover:bg-amber-600 active:scale-95 transition-all cursor-pointer"
                data-testid={`tutor-report-btn-${session.booking_id}`}
              >
                <FileText className="w-3 h-3" />Submit Report
              </button>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-400 text-[11px] font-medium">
                <FileText className="w-3 h-3" />No Session
              </span>
            )}
            {session.student_reviewed ? (
              <span className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-50 text-slate-500 text-[10px]">
                <Star className="w-2.5 h-2.5" />Rated
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeacherSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportSession, setReportSession] = useState(null);

  const fetchPastSessions = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/booking/past-sessions`, { credentials: 'include' });
      if (r.ok) {
        const data = await r.json();
        setSessions(data.sessions || []);
      }
    } catch (e) { console.error('Past sessions fetch error:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPastSessions(); }, [fetchPastSessions]);

  const handleReportSubmitted = () => {
    if (reportSession) {
      setSessions(prev => prev.map(s =>
        s.booking_id === reportSession.booking_id ? { ...s, tutor_reviewed: true } : s
      ));
    }
    setReportSession(null);
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto" data-testid="teacher-sessions-page">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">My Sessions</h2>
        <p className="text-xs text-slate-500 mt-0.5">{sessions.length} past sessions</p>
      </div>

      <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Past Sessions</h3>
        {loading ? (
          <div className="text-center py-12">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-200 animate-pulse" />
            <p className="text-xs text-slate-400">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12" data-testid="tutor-past-empty">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <h4 className="text-sm font-semibold text-slate-600 mb-1">No past sessions yet</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">Once you complete your first class, your session history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {sessions.map(s => (
              <PastSessionCard key={s.booking_id} session={s} onOpenReport={setReportSession} />
            ))}
          </div>
        )}
      </div>

      {reportSession && (
        <SessionReportModal
          sessionId={reportSession.session_id}
          onSubmitted={handleReportSubmitted}
          onClose={() => setReportSession(null)}
          isTimeExpired={true}
        />
      )}
    </div>
  );
}
