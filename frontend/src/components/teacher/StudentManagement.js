import React, { useState, useEffect } from 'react';
import { Users, BookOpen, TrendingUp, X, Clock, ChevronRight } from 'lucide-react';
import Spinner from '../Spinner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function StudentDetailDrawer({ student, onClose }) {
  if (!student) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto animate-modal-in shadow-xl" onClick={e => e.stopPropagation()} data-testid="student-detail-drawer">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{student.student_name}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Scores */}
          <div>
            <h3 className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">Current Scores</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Fluency', value: student.avg_fluency, color: 'text-emerald-700' },
                { label: 'Tajweed', value: student.avg_tajweed, color: 'text-amber-700' },
                { label: 'Makhraj', value: student.avg_makhraj, color: 'text-blue-700' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl bg-slate-50 text-center">
                  <p className="text-[11px] text-slate-400">{s.label}</p>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Past Notes */}
          <div>
            <h3 className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">Past Notes</h3>
            {(!student.notes || student.notes.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-4">No notes yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {student.notes.map((note, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50">
                    <p className="text-sm text-slate-700">{note.comment}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{note.date ? new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentManagement({ teacherId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

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

  if (loading) return <div className="p-8 flex justify-center"><Spinner /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto" data-testid="student-management">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">My Students</h2>
          <p className="text-xs text-slate-500 mt-0.5">{students.length} student{students.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm overflow-hidden">
        {students.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-200" />
            <p className="text-xs text-slate-400">No students yet. They'll appear here after your first class.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {students.map((s) => (
              <button
                key={s.student_id}
                onClick={() => setSelectedStudent(s)}
                className="w-full px-5 py-4 flex items-center gap-3 hover:bg-slate-50/50 transition-colors text-left"
                data-testid={`student-row-${s.student_id}`}
              >
                <div className="w-10 h-10 rounded-2xl bg-emerald-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {s.student_name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{s.student_name}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{s.reading_level || 'Beginner'}</span>
                    {s.last_class_date && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(s.last_class_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    s.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {s.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <StudentDetailDrawer student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
}
