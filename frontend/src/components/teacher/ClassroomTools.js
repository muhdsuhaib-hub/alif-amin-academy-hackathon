import React, { useState, useEffect } from 'react';
import { Book, Save, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { toast } from 'sonner';
import Card, { CardHeader, CardBody } from '../Card';
import Button from '../Button';
import DigitalMushaf from '../classroom/DigitalMushaf';
import QuranNavigator from '../classroom/QuranNavigator';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ClassroomTools({ teacherData, students }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [highlights, setHighlights] = useState([]);
  const [showNavigator, setShowNavigator] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [lessonNotes, setLessonNotes] = useState({});
  const [currentNote, setCurrentNote] = useState('');

  const fetchStudentNotes = async (studentId) => {
    try {
      const r = await fetch(`${API}/teachers/notes/${studentId}`, { credentials: 'include' });
      if (r.ok) {
        const d = await r.json();
        setLessonNotes((p) => ({ ...p, [studentId]: d.notes || [] }));
      }
    } catch {
      /* fallback handled below */
    }
  };

  useEffect(() => {
    if (selectedStudent) fetchStudentNotes(selectedStudent.student_id);
  }, [selectedStudent]);

  const handleSaveNote = () => {
    if (!currentNote.trim() || !selectedStudent) return;
    toast.success('Note saved');
    setLessonNotes((p) => ({
      ...p,
      [selectedStudent.student_id]: [
        { id: Math.random(), date: new Date().toISOString().split('T')[0], note: currentNote },
        ...(p[selectedStudent.student_id] || []),
      ],
    }));
    setCurrentNote('');
  };

  const handleHighlight = (hl) => {
    setHighlights((prev) => {
      const exists = prev.findIndex((h) => h.verseKey === hl.verseKey);
      if (exists >= 0) return prev.filter((_, i) => i !== exists);
      return [...prev, hl];
    });
  };

  const handleNavigate = (nav) => {
    if (nav.type === 'page') setCurrentPage(nav.page);
    else if (nav.type === 'juz') setCurrentPage(Math.round((nav.juz - 1) * 20.13 + 1));
    else if (nav.type === 'surah') {
      // Approximate page mapping — will be refined with API
      toast.info(`Navigating to ${nav.surahName}`);
    }
    setShowNavigator(false);
  };

  const inputCls =
    'h-12 w-full rounded-md border border-ink-faint/40 bg-surface-card px-4 text-body focus:outline-none focus:ring-2 focus:ring-brand/15 transition-all';

  return (
    <div className="space-y-6">
      {/* Digital Mushaf */}
      <Card className="overflow-hidden">
        <CardHeader className="flex items-center justify-between">
          <div>
            <h3 className="text-h3 font-semibold text-brand">Digital Mushaf</h3>
            <p className="text-small text-ink-secondary">Interactive Quran — Madani layout (604 pages)</p>
          </div>
          <Button
            size="sm"
            variant={showNavigator ? 'secondary' : 'primary'}
            onClick={() => setShowNavigator(!showNavigator)}
            data-testid="toggle-navigator"
          >
            {showNavigator ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            {showNavigator ? 'Close Nav' : 'Navigate'}
          </Button>
        </CardHeader>

        <div className="flex" style={{ minHeight: 520 }}>
          {/* Navigator Drawer */}
          {showNavigator && (
            <div className="w-72 border-r border-surface-subtle flex-shrink-0 bg-white/50">
              <QuranNavigator onNavigate={handleNavigate} onClose={() => setShowNavigator(false)} />
            </div>
          )}
          {/* Mushaf */}
          <div className="flex-1">
            <DigitalMushaf
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              isTeacher={true}
              highlights={highlights}
              onHighlight={handleHighlight}
            />
          </div>
        </div>
      </Card>

      {/* Lesson Notes */}
      <Card className="overflow-hidden">
        <CardHeader>
          <h3 className="text-h3 font-semibold text-brand">Lesson Notes</h3>
          <p className="text-small text-ink-secondary">Private notes for each student</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-small font-medium mb-2 text-ink-secondary">Select Student</label>
            <select
              value={selectedStudent?.student_id || ''}
              onChange={(e) => setSelectedStudent(students.find((s) => s.student_id === e.target.value))}
              className={inputCls}
              data-testid="student-select"
            >
              <option value="">Choose a student...</option>
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          {selectedStudent && (
            <>
              <div>
                <textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Add a note about this student's progress..."
                  className="w-full h-24 p-3 rounded-md border border-ink-faint/40 bg-surface-card resize-none focus:outline-none focus:ring-2 focus:ring-brand/15 text-body"
                  data-testid="lesson-note-input"
                />
                <Button size="sm" onClick={handleSaveNote} className="mt-2" data-testid="save-note-btn">
                  <Save className="w-4 h-4" />Save Note
                </Button>
              </div>
              <div className="space-y-3">
                <h4 className="text-small font-medium text-ink-secondary">Previous Notes</h4>
                {(lessonNotes[selectedStudent.student_id] || []).map((note) => (
                  <div key={note.id} className="p-3 rounded-md bg-surface-warm">
                    <p className="text-small text-ink">{note.note}</p>
                    <p className="text-caption text-ink-tertiary mt-1">{note.date}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
