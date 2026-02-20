import React, { useState, useEffect } from 'react';
import { Users, BookOpen, TrendingUp, X, Clock, ChevronRight, Search, MessageSquare } from 'lucide-react';
import Spinner from '../Spinner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function ScoreBar({ label, value, color }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-500">{label}</span>
        <span className={`font-semibold ${color}`}>{value ?? '—'}<span className="text-slate-400 font-normal">/10</span></span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            color === 'text-emerald-700' ? 'bg-emerald-500' :
            color === 'text-amber-700' ? 'bg-amber-500' : 'bg-sky-500'
          }`}
          style={{ width: value ? `${(value / 10) * 100}%` : '0%' }}
        />
      </div>
    </div>
  );
}

function StudentDetailDrawer({ student, onClose }) {
  if (!student) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 animate-fade-in" onClick={onClose} />
      <div
        className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right"
        data-testid="student-detail-drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-700 flex items-center justify-center text-white font-semibold text-sm overflow-hidden flex-shrink-0">
              {student.picture
                ? <img src={student.picture} alt="" className="w-11 h-11 object-cover" />
                : student.student_name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{student.student_name}</h2>
              <p className="text-[11px] text-slate-400">{student.reading_level || 'Beginner'} &middot; {student.total_sessions || 0} sessions</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors" data-testid="close-student-drawer">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Scores */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />Progress Scores
            </h3>
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <ScoreBar label="Fluency" value={student.avg_fluency} color="text-emerald-700" />
              <ScoreBar label="Tajweed" value={student.avg_tajweed} color="text-amber-700" />
              <ScoreBar label="Makhraj" value={student.avg_makhraj} color="text-sky-700" />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100/50">
              <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-medium">Total Sessions</p>
              <p className="text-xl font-bold text-emerald-800 mt-1">{student.total_sessions || 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Last Session</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {student.last_session_date
                  ? new Date(student.last_session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '—'}
              </p>
            </div>
          </div>

          {/* Session Notes */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />Session Notes
            </h3>
            {(!student.notes || student.notes.length === 0) ? (
              <div className="text-center py-8 rounded-2xl bg-slate-50/80 border border-slate-100">
                <MessageSquare className="w-6 h-6 mx-auto mb-2 text-slate-200" />
                <p className="text-xs text-slate-400">No session notes recorded yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {student.notes.map((note, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition-colors">
                    <p className="text-sm text-slate-700 leading-relaxed">{note.comment}</p>
                    <div className="flex items-center gap-3 mt-2.5">
                      <span className="text-[10px] text-slate-400">
                        {note.date ? new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </span>
                      {(note.fluency || note.tajweed || note.makhraj) && (
                        <div className="flex items-center gap-2 text-[10px]">
                          {note.fluency && <span className="text-emerald-600">F:{note.fluency}</span>}
                          {note.tajweed && <span className="text-amber-600">T:{note.tajweed}</span>}
                          {note.makhraj && <span className="text-sky-600">M:{note.makhraj}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function StudentManagement({ teacherId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (teacherId) fetchStudents();
  }, [teacherId]);

  const fetchStudents = async () => {
    try {
      const r = await fetch(`${API}/booking/teacher-students/${teacherId}`, { credentials: 'include' });
      if (r.ok) {
        const data = await r.json();
        setStudents(data.students || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = students.filter(s =>
    s.student_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 flex justify-center"><Spinner /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto" data-testid="student-management">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">My Students</h2>
          <p className="text-xs text-slate-500 mt-0.5">{students.length} student{students.length !== 1 ? 's' : ''} in your roster</p>
        </div>
        {students.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all"
              data-testid="student-search-input"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm overflow-hidden">
        {students.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="text-sm font-medium text-slate-500">No students yet</p>
            <p className="text-xs text-slate-400 mt-1">Students will appear here after your first class session.</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider" data-testid="student-table-header">
              <div className="col-span-4">Student</div>
              <div className="col-span-2">Level</div>
              <div className="col-span-2 text-center">Sessions</div>
              <div className="col-span-3">Last Session</div>
              <div className="col-span-1"></div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-50" data-testid="student-table-body">
              {filtered.map((s) => (
                <button
                  key={s.student_id}
                  onClick={() => setSelectedStudent(s)}
                  className="w-full px-5 py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center hover:bg-emerald-50/30 transition-colors text-left group"
                  data-testid={`student-row-${s.student_id}`}
                >
                  {/* Name + Avatar */}
                  <div className="sm:col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
                      {s.picture
                        ? <img src={s.picture} alt="" className="w-10 h-10 object-cover" />
                        : s.student_name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate group-hover:text-emerald-800 transition-colors">{s.student_name}</p>
                      <div className="sm:hidden flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{s.reading_level || 'Beginner'}</span>
                        <span>&middot;</span>
                        <span>{s.total_sessions || 0} sessions</span>
                      </div>
                    </div>
                  </div>

                  {/* Level */}
                  <div className="hidden sm:block sm:col-span-2">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      {s.reading_level || s.current_level || 'Beginner'}
                    </span>
                  </div>

                  {/* Sessions Count */}
                  <div className="hidden sm:flex sm:col-span-2 justify-center">
                    <span className="text-sm font-semibold text-slate-800 tabular-nums">{s.total_sessions || 0}</span>
                  </div>

                  {/* Last Session */}
                  <div className="hidden sm:flex sm:col-span-3 items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {s.last_session_date
                      ? new Date(s.last_session_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                      : 'No sessions yet'}
                  </div>

                  {/* Arrow */}
                  <div className="hidden sm:flex sm:col-span-1 justify-end">
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>

            {filtered.length === 0 && search && (
              <div className="px-5 py-8 text-center">
                <p className="text-xs text-slate-400">No students matching "{search}"</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Drawer */}
      {selectedStudent && (
        <StudentDetailDrawer student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  );
}
