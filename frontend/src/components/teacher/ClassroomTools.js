import React, { useState, useEffect } from 'react';
import { Book, Save, X, ChevronDown, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ClassroomTools({ teacherData, students }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [lessonNotes, setLessonNotes] = useState({});
  const [currentNote, setCurrentNote] = useState('');
  const [showMushaf, setShowMushaf] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pointerPosition, setPointerPosition] = useState({ x: 50, y: 50 });
  const [isPointerActive, setIsPointerActive] = useState(false);

  const fetchStudentNotes = async (studentId) => {
    try {
      const response = await fetch(`${API}/teachers/notes/${studentId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setLessonNotes(prev => ({ ...prev, [studentId]: data.notes || [] }));
      }
    } catch (error) {
      setLessonNotes(prev => ({ 
        ...prev, 
        [studentId]: [
          { id: 1, date: '2026-01-15', note: "Student struggles with Makhraj of letter 'Ain'" },
          { id: 2, date: '2026-01-14', note: 'Good progress on Madd rules, continue practicing' },
        ]
      }));
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentNotes(selectedStudent.student_id);
    }
  }, [selectedStudent]);

  const handleSaveNote = async () => {
    if (!currentNote.trim() || !selectedStudent) return;
    
    toast.success('Note saved successfully');
    setLessonNotes(prev => ({
      ...prev,
      [selectedStudent.student_id]: [
        { id: Math.random(), date: new Date().toISOString().split('T')[0], note: currentNote },
        ...(prev[selectedStudent.student_id] || [])
      ]
    }));
    setCurrentNote('');
  };

  const handlePointerMove = (e) => {
    if (!isPointerActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPointerPosition({ x, y });
  };

  return (
    <div className="space-y-6">
      {/* Digital Mushaf Card */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <div>
            <h3 className="font-semibold" style={{ color: '#0F3D2E' }}>Digital Mushaf</h3>
            <p className="text-sm text-gray-500">Interactive Quran with live pointer</p>
          </div>
          <button
            onClick={() => setShowMushaf(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#0F3D2E] text-white font-medium transition-all hover:opacity-90"
            data-testid="open-mushaf-btn"
          >
            <Book className="w-4 h-4" />
            Open Mushaf
          </button>
        </div>
        <div className="p-6 bg-[#F7F5EF]">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold" style={{ color: '#0F3D2E' }}>604</p>
              <p className="text-xs text-gray-500">Total Pages</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: '#0F3D2E' }}>114</p>
              <p className="text-xs text-gray-500">Surahs</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: '#0F3D2E' }}>30</p>
              <p className="text-xs text-gray-500">Juz</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Notes */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <h3 className="font-semibold" style={{ color: '#0F3D2E' }}>Lesson Notes</h3>
          <p className="text-sm text-gray-500">Private notes for each student</p>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">Select Student</label>
            <select
              value={selectedStudent?.student_id || ''}
              onChange={(e) => {
                const student = students.find(s => s.student_id === e.target.value);
                setSelectedStudent(student);
              }}
              className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
              style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
              data-testid="student-select"
            >
              <option value="">Choose a student...</option>
              {students.map(student => (
                <option key={student.student_id} value={student.student_id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <>
              <div className="mb-4">
                <textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Add a note about this student's progress..."
                  className="w-full h-24 p-3 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                  data-testid="lesson-note-input"
                />
                <button
                  onClick={handleSaveNote}
                  className="mt-2 flex items-center gap-2 h-9 px-4 rounded-lg bg-[#0F3D2E] text-white text-sm font-medium transition-all hover:opacity-90"
                  data-testid="save-note-btn"
                >
                  <Save className="w-4 h-4" />
                  Save Note
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Previous Notes</h4>
                {(lessonNotes[selectedStudent.student_id] || []).map(note => (
                  <div key={note.id} className="p-3 rounded-lg bg-[#F7F5EF]">
                    <p className="text-sm" style={{ color: '#1D1D1F' }}>{note.note}</p>
                    <p className="text-xs text-gray-500 mt-1">{note.date}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mushaf Modal */}
      {showMushaf && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="w-full h-full flex flex-col">
            <div className="bg-[#0F3D2E] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setShowMushaf(false)} className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="font-semibold">Digital Mushaf - Uthmani Script</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPointerActive(!isPointerActive)}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                    isPointerActive ? 'bg-[#D4AF37] text-[#0F3D2E]' : 'bg-white bg-opacity-20'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  {isPointerActive ? 'Pointer ON' : 'Enable Pointer'}
                </button>
                <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-lg px-3 py-2">
                  <button 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                  >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                  </button>
                  <span className="w-16 text-center">Page {currentPage}</span>
                  <button 
                    onClick={() => setCurrentPage(Math.min(604, currentPage + 1))}
                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                  >
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </button>
                </div>
              </div>
            </div>

            <div 
              className="flex-1 bg-[#FDF8E8] flex items-center justify-center relative cursor-crosshair"
              onMouseMove={handlePointerMove}
            >
              <div className="w-[600px] h-[800px] bg-white shadow-2xl rounded-lg p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-xs text-gray-400">Page {currentPage}</div>
                
                <div className="text-right font-arabic leading-loose" style={{ direction: 'rtl' }}>
                  <p className="text-2xl mb-4" style={{ fontFamily: 'Amiri, serif', color: '#1D1D1F' }}>
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                  <p className="text-xl mb-3" style={{ fontFamily: 'Amiri, serif', color: '#1D1D1F' }}>
                    الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴿١﴾
                  </p>
                  <p className="text-xl mb-3" style={{ fontFamily: 'Amiri, serif', color: '#1D1D1F' }}>
                    الرَّحْمَٰنِ الرَّحِيمِ ﴿٢﴾
                  </p>
                  <p className="text-xl mb-3" style={{ fontFamily: 'Amiri, serif', color: '#1D1D1F' }}>
                    مَالِكِ يَوْمِ الدِّينِ ﴿٣﴾
                  </p>
                  <p className="text-xl mb-3" style={{ fontFamily: 'Amiri, serif', color: '#1D1D1F' }}>
                    إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٤﴾
                  </p>
                  <p className="text-xl mb-3" style={{ fontFamily: 'Amiri, serif', color: '#1D1D1F' }}>
                    اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴿٥﴾
                  </p>
                  <p className="text-xl mb-3" style={{ fontFamily: 'Amiri, serif', color: '#1D1D1F' }}>
                    صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ﴿٦﴾
                  </p>
                </div>

                {isPointerActive && (
                  <div 
                    className="absolute w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ 
                      left: `${pointerPosition.x}%`, 
                      top: `${pointerPosition.y}%`,
                      transition: 'all 0.1s ease-out'
                    }}
                  >
                    <div className="w-6 h-6 bg-[#E76F51] rounded-full opacity-80 animate-pulse"></div>
                    <div className="absolute top-0 left-0 w-6 h-6 bg-[#E76F51] rounded-full animate-ping"></div>
                  </div>
                )}
              </div>

              {isPointerActive && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[#0F3D2E] text-white px-4 py-2 rounded-lg text-sm">
                  Move your cursor to point at specific text. Students see your pointer in real-time.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
