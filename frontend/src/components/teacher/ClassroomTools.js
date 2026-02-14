import React, { useState, useEffect } from 'react';
import { Book, Save, Edit3, X, ChevronDown, Pointer } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../Card';

export default function ClassroomTools({ teacherData, students }) {
  const [showMushaf, setShowMushaf] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPointerActive, setIsPointerActive] = useState(false);
  const [pointerPosition, setPointerPosition] = useState({ x: 50, y: 50 });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [lessonNotes, setLessonNotes] = useState({});
  const [currentNote, setCurrentNote] = useState('');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  const fetchStudentNotes = async (studentId) => {
    try { const r = await fetch(`${API}/teachers/notes/${studentId}`, { credentials: 'include' }); if (r.ok) { const d = await r.json(); setLessonNotes(p => ({ ...p, [studentId]: d.notes || [] })); } }
    catch { setLessonNotes(p => ({ ...p, [studentId]: [{ id: 1, date: '2026-01-15', note: "Student struggles with Makhraj of letter 'Ain'" }, { id: 2, date: '2026-01-14', note: 'Good progress on Madd rules' }] })); }
  };
  useEffect(() => { if (selectedStudent) fetchStudentNotes(selectedStudent.student_id); }, [selectedStudent]);

  const handleSaveNote = async () => {
    if (!currentNote.trim() || !selectedStudent) return;
    toast.success('Note saved'); setLessonNotes(p => ({ ...p, [selectedStudent.student_id]: [{ id: Math.random(), date: new Date().toISOString().split('T')[0], note: currentNote }, ...(p[selectedStudent.student_id] || [])] })); setCurrentNote('');
  };
  const handlePointerMove = (e) => { if (!isPointerActive) return; const r = e.currentTarget.getBoundingClientRect(); setPointerPosition({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); };

  const inputCls = 'h-12 w-full rounded-md border border-ink-faint/40 bg-surface-card px-4 text-body focus:outline-none focus:ring-2 focus:ring-brand/15 transition-all';

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-subtle flex items-center justify-between">
          <div><h3 className="text-h3 text-brand">Digital Mushaf</h3><p className="text-small text-ink-secondary">Interactive Quran with live pointer</p></div>
          <button onClick={() => setShowMushaf(true)} data-testid="open-mushaf-btn" className="flex items-center gap-2 h-10 px-4 rounded-md bg-brand text-white font-medium text-small transition-all hover:bg-brand-light"><Book className="w-4 h-4" />Open Mushaf</button>
        </div>
        <div className="p-6 bg-surface-warm">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[{ v: '604', l: 'Total Pages' }, { v: '114', l: 'Surahs' }, { v: '30', l: 'Juz' }].map(s => (
              <div key={s.l}><p className="text-h2 font-bold text-brand">{s.v}</p><p className="text-caption text-ink-secondary">{s.l}</p></div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-subtle"><h3 className="text-h3 text-brand">Lesson Notes</h3><p className="text-small text-ink-secondary">Private notes for each student</p></div>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-small font-medium mb-2 text-ink-secondary">Select Student</label>
            <select value={selectedStudent?.student_id || ''} onChange={(e) => setSelectedStudent(students.find(s => s.student_id === e.target.value))} className={inputCls} data-testid="student-select">
              <option value="">Choose a student...</option>
              {students.map(s => <option key={s.student_id} value={s.student_id}>{s.name}</option>)}
            </select>
          </div>
          {selectedStudent && (
            <>
              <div className="mb-4">
                <textarea value={currentNote} onChange={(e) => setCurrentNote(e.target.value)} placeholder="Add a note about this student's progress..." className="w-full h-24 p-3 rounded-md border border-ink-faint/40 resize-none focus:outline-none focus:ring-2 focus:ring-brand/15 text-body" data-testid="lesson-note-input" />
                <button onClick={handleSaveNote} data-testid="save-note-btn" className="mt-2 flex items-center gap-2 h-9 px-4 rounded-md bg-brand text-white text-small font-medium transition-all hover:bg-brand-light"><Save className="w-4 h-4" />Save Note</button>
              </div>
              <div className="space-y-3">
                <h4 className="text-small font-medium text-ink-secondary">Previous Notes</h4>
                {(lessonNotes[selectedStudent.student_id] || []).map(note => (
                  <div key={note.id} className="p-3 rounded-md bg-surface-warm"><p className="text-small text-ink">{note.note}</p><p className="text-caption text-ink-tertiary mt-1">{note.date}</p></div>
                ))}
              </div>
            </>
          )}
        </div>
      </Card>

      {showMushaf && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="w-full h-full flex flex-col">
            <div className="bg-brand text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setShowMushaf(false)} className="p-2 hover:bg-white/10 rounded-md"><X className="w-5 h-5" /></button>
                <h3 className="font-semibold">Digital Mushaf - Uthmani Script</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsPointerActive(!isPointerActive)} className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-all ${isPointerActive ? 'bg-gold text-brand' : 'bg-white/20'}`}><Edit3 className="w-4 h-4" />{isPointerActive ? 'Pointer ON' : 'Enable Pointer'}</button>
                <div className="flex items-center gap-2 bg-white/20 rounded-md px-3 py-2"><button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className="p-1 hover:bg-white/20 rounded"><ChevronDown className="w-4 h-4 rotate-90" /></button><span className="w-16 text-center">Page {currentPage}</span><button onClick={() => setCurrentPage(Math.min(604, currentPage + 1))} className="p-1 hover:bg-white/20 rounded"><ChevronDown className="w-4 h-4 -rotate-90" /></button></div>
              </div>
            </div>
            <div className="flex-1 bg-surface-warm flex items-center justify-center relative cursor-crosshair" onMouseMove={handlePointerMove}>
              <div className="w-[600px] h-[800px] bg-white shadow-apple-lg rounded-md p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-caption text-ink-tertiary">Page {currentPage}</div>
                <div className="text-right leading-loose" style={{ direction: 'rtl', fontFamily: 'Amiri, serif' }}>
                  {['\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650', '\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u0651\u064E\u0647\u0650 \u0631\u064E\u0628\u0651\u0650 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E \uFD3F\u0661\uFD3E', '\u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650 \uFD3F\u0662\uFD3E', '\u0645\u064E\u0627\u0644\u0650\u0643\u0650 \u064A\u064E\u0648\u0652\u0645\u0650 \u0627\u0644\u062F\u0651\u0650\u064A\u0646\u0650 \uFD3F\u0663\uFD3E', '\u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E \u0646\u064E\u0639\u0652\u0628\u064F\u062F\u064F \u0648\u064E\u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E \u0646\u064E\u0633\u0652\u062A\u064E\u0639\u0650\u064A\u0646\u064F \uFD3F\u0664\uFD3E', '\u0627\u0647\u0652\u062F\u0650\u0646\u064E\u0627 \u0627\u0644\u0635\u0651\u0650\u0631\u064E\u0627\u0637\u064E \u0627\u0644\u0652\u0645\u064F\u0633\u0652\u062A\u064E\u0642\u0650\u064A\u0645\u064E \uFD3F\u0665\uFD3E'].map((v, i) => <p key={i} className={`text-xl mb-3 text-ink ${i === 0 ? 'text-2xl mb-4' : ''}`}>{v}</p>)}
                </div>
                {isPointerActive && (
                  <div className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${pointerPosition.x}%`, top: `${pointerPosition.y}%`, transition: 'all 0.1s ease-out' }}>
                    <div className="w-6 h-6 bg-coral rounded-full opacity-80 animate-pulse" /><div className="absolute top-0 left-0 w-6 h-6 bg-coral rounded-full animate-ping" />
                  </div>
                )}
              </div>
              {isPointerActive && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-brand text-white px-4 py-2 rounded-md text-small">Move your cursor to point at specific text. Students see your pointer in real-time.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
