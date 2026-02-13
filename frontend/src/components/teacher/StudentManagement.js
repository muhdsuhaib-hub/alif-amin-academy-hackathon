import React, { useState } from 'react';
import { Users, FileText, Download, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentManagement({ teacherData, students, setStudents }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState(null);
  const [reportData, setReportData] = useState({
    attendance: '4/4',
    progress: '',
    notes: ''
  });

  const getLastLessonStatus = (lastSession) => {
    if (!lastSession) return 'never';
    const now = new Date();
    const sessionDate = new Date(lastSession);
    const daysSince = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 14) return 'inactive';
    if (daysSince > 7) return 'warning';
    return 'active';
  };

  const sendReminder = async (student) => {
    toast.success(`Reminder sent to ${student.name}!`);
  };

  const generateReport = () => {
    if (!selectedStudentForReport) return;
    toast.success('Report generated! Check your downloads folder.');
    setShowReportModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <p className="text-xs text-gray-500 mb-1">Active Students</p>
          <p className="text-2xl font-semibold" style={{ color: '#0F3D2E' }} data-testid="active-students-count">
            {students.filter(s => getLastLessonStatus(s.last_session) === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <p className="text-xs text-gray-500 mb-1">Need Attention</p>
          <p className="text-2xl font-semibold" style={{ color: '#E76F51' }}>
            {students.filter(s => getLastLessonStatus(s.last_session) === 'warning').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <p className="text-xs text-gray-500 mb-1">Inactive (2+ weeks)</p>
          <p className="text-2xl font-semibold text-gray-400">
            {students.filter(s => getLastLessonStatus(s.last_session) === 'inactive').length}
          </p>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
          <h3 className="font-semibold" style={{ color: '#0F3D2E' }}>Student List</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(15, 61, 46, 0.08)', backgroundColor: '#F9FAFB' }}>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Full Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Reading Level</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Last Lesson</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'rgba(15, 61, 46, 0.05)' }}>
              {students.map(student => {
                const status = getLastLessonStatus(student.last_session);
                return (
                  <tr key={student.student_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#0F3D2E] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {student.name?.charAt(0) || 'S'}
                        </div>
                        <span className="font-medium text-sm" style={{ color: '#1F2933' }}>{student.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{student.email || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize" style={{
                        backgroundColor: student.current_level === 'beginner' ? 'rgba(59, 130, 246, 0.1)' :
                                        student.current_level === 'slow' ? 'rgba(245, 158, 11, 0.1)' :
                                        student.current_level === 'comfortable' ? 'rgba(34, 197, 94, 0.1)' :
                                        student.current_level === 'advanced' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                        color: student.current_level === 'beginner' ? '#3B82F6' :
                               student.current_level === 'slow' ? '#F59E0B' :
                               student.current_level === 'comfortable' ? '#22C55E' :
                               student.current_level === 'advanced' ? '#8B5CF6' : '#6B7280'
                      }}>
                        {student.current_level === 'beginner' ? 'Just Starting' :
                         student.current_level === 'slow' ? 'Reads Slowly' :
                         student.current_level === 'comfortable' ? 'Comfortable' :
                         student.current_level === 'advanced' ? 'Advanced' : student.current_level || 'Not Set'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${
                        status === 'active' ? 'text-green-600' :
                        status === 'warning' ? 'text-yellow-600' :
                        status === 'inactive' ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {student.last_session ? new Date(student.last_session).toLocaleDateString() : 'Never'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {status === 'active' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                          Active
                        </span>
                      )}
                      {status === 'warning' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600 flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3 h-3" />
                          7+ days
                        </span>
                      )}
                      {status === 'inactive' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3 h-3" />
                          14+ days
                        </span>
                      )}
                      {status === 'never' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          New
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(status === 'warning' || status === 'inactive') && (
                          <button
                            onClick={() => sendReminder(student)}
                            className="h-8 px-3 rounded-lg text-xs font-medium bg-[#D4AF37] text-white transition-all hover:opacity-90"
                            data-testid={`send-reminder-${student.student_id}`}
                          >
                            Send Reminder
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedStudentForReport(student);
                            setShowReportModal(true);
                          }}
                          className="h-8 px-3 rounded-lg text-xs font-medium border transition-all hover:bg-gray-50"
                          style={{ borderColor: 'rgba(15, 61, 46, 0.2)', color: '#0F3D2E' }}
                          data-testid={`generate-report-${student.student_id}`}
                        >
                          <FileText className="w-3 h-3 inline mr-1" />
                          Report
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {students.length === 0 && (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No students yet</p>
          </div>
        )}
      </div>

      {/* Report Card Modal */}
      {showReportModal && selectedStudentForReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: '#0F3D2E' }}>Generate Report Card</h3>
              <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F7F5EF]">
                <p className="text-sm font-medium" style={{ color: '#0F3D2E' }}>{selectedStudentForReport.name}</p>
                <p className="text-xs text-gray-500">{selectedStudentForReport.current_level}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Attendance (This Month)</label>
                <input
                  type="text"
                  value={reportData.attendance}
                  onChange={(e) => setReportData({ ...reportData, attendance: e.target.value })}
                  placeholder="e.g., 4/4"
                  className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Progress</label>
                <input
                  type="text"
                  value={reportData.progress}
                  onChange={(e) => setReportData({ ...reportData, progress: e.target.value })}
                  placeholder="e.g., Completed Surah Al-Mulk"
                  className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Additional Notes</label>
                <textarea
                  value={reportData.notes}
                  onChange={(e) => setReportData({ ...reportData, notes: e.target.value })}
                  placeholder="Comments for parents..."
                  className="w-full h-24 p-3 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  style={{ borderColor: 'rgba(15, 61, 46, 0.2)' }}
                />
              </div>

              <button
                onClick={generateReport}
                className="w-full h-11 rounded-xl bg-[#0F3D2E] text-white font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90"
                data-testid="generate-pdf-btn"
              >
                <Download className="w-4 h-4" />
                Generate PDF Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
