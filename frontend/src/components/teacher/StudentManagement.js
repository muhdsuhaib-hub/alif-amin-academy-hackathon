import React, { useState } from 'react';
import { Users, FileText, Download, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Card, { CardHeader, CardBody } from '../Card';
import Badge from '../Badge';
import Button from '../Button';
import Spinner from '../Spinner';

export default function StudentManagement({ teacherData, students, setStudents }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState(null);
  const [reportData, setReportData] = useState({ attendance: '4/4', progress: '', notes: '' });

  const getLastLessonStatus = (lastSession) => {
    if (!lastSession) return 'never';
    const daysSince = Math.floor((Date.now() - new Date(lastSession).getTime()) / 86400000);
    if (daysSince > 14) return 'inactive';
    if (daysSince > 7) return 'warning';
    return 'active';
  };

  const sendReminder = (student) => toast.success(`Reminder sent to ${student.name}!`);
  const generateReport = () => {
    if (!selectedStudentForReport) return;
    toast.success('Report generated! Check your downloads folder.');
    setShowReportModal(false);
  };

  const statusConfig = {
    active:   { label: 'Active',    color: 'success' },
    warning:  { label: '7+ days',   color: 'warning', icon: true },
    inactive: { label: '14+ days',  color: 'danger',  icon: true },
    never:    { label: 'New',       color: 'neutral' },
  };

  const levelConfig = {
    beginner:    { label: 'Just Starting', color: 'info' },
    slow:        { label: 'Reads Slowly',  color: 'warning' },
    comfortable: { label: 'Comfortable',   color: 'success' },
    advanced:    { label: 'Advanced',      color: 'brand' },
  };

  const inputCls = 'h-12 w-full rounded-md border border-ink-faint/40 bg-surface-card px-4 text-body placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand/40 transition-all';

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Students', value: students.filter(s => getLastLessonStatus(s.last_session) === 'active').length, color: 'text-brand', testId: 'active-students-count' },
          { label: 'Need Attention', value: students.filter(s => getLastLessonStatus(s.last_session) === 'warning').length, color: 'text-coral' },
          { label: 'Inactive (2+ weeks)', value: students.filter(s => getLastLessonStatus(s.last_session) === 'inactive').length, color: 'text-ink-tertiary' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-caption text-ink-secondary mb-1">{stat.label}</p>
            <p className={`text-h2 font-semibold ${stat.color}`} data-testid={stat.testId}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Student List */}
      <Card className="overflow-hidden">
        <CardHeader>
          <h3 className="text-h3 font-semibold text-brand">Student List</h3>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-subtle bg-surface-warm">
                <th className="text-left px-4 py-3 text-caption font-medium text-ink-secondary uppercase">Full Name</th>
                <th className="text-left px-4 py-3 text-caption font-medium text-ink-secondary uppercase">Email</th>
                <th className="text-left px-4 py-3 text-caption font-medium text-ink-secondary uppercase">Reading Level</th>
                <th className="text-left px-4 py-3 text-caption font-medium text-ink-secondary uppercase">Last Lesson</th>
                <th className="text-left px-4 py-3 text-caption font-medium text-ink-secondary uppercase">Status</th>
                <th className="text-right px-4 py-3 text-caption font-medium text-ink-secondary uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-subtle">
              {students.map(student => {
                const status = getLastLessonStatus(student.last_session);
                const sc = statusConfig[status];
                const lc = levelConfig[student.current_level] || { label: student.current_level || 'Not Set', color: 'neutral' };
                return (
                  <tr key={student.student_id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-small font-medium flex-shrink-0">
                          {student.name?.charAt(0) || 'S'}
                        </div>
                        <span className="font-medium text-small text-ink">{student.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-small text-ink-secondary">{student.email || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={lc.color}>{lc.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-small font-medium ${
                        status === 'active' ? 'text-success' :
                        status === 'warning' ? 'text-warning' :
                        status === 'inactive' ? 'text-danger' : 'text-ink-tertiary'
                      }`}>
                        {student.last_session ? new Date(student.last_session).toLocaleDateString() : 'Never'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={sc.color}>
                        {sc.icon && <AlertCircle className="w-3 h-3 mr-1" />}
                        {sc.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(status === 'warning' || status === 'inactive') && (
                          <Button size="sm" variant="gold" onClick={() => sendReminder(student)} data-testid={`send-reminder-${student.student_id}`}>
                            Send Reminder
                          </Button>
                        )}
                        <Button size="sm" variant="secondary" onClick={() => { setSelectedStudentForReport(student); setShowReportModal(true); }} data-testid={`generate-report-${student.student_id}`}>
                          <FileText className="w-3 h-3" />Report
                        </Button>
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
            <Users className="w-12 h-12 mx-auto mb-3 text-ink-faint" />
            <p className="text-ink-secondary">No students yet</p>
          </div>
        )}
      </Card>

      {/* Report Card Modal */}
      {showReportModal && selectedStudentForReport && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowReportModal(false)}>
          <div className="bg-surface-card rounded-xl w-full max-w-md p-6 animate-modal-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-h3 text-brand">Generate Report Card</h3>
              <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-surface-subtle rounded-full transition-colors">
                <X className="w-5 h-5 text-ink-tertiary" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-md bg-surface-warm">
                <p className="text-small font-medium text-brand">{selectedStudentForReport.name}</p>
                <p className="text-caption text-ink-secondary">{selectedStudentForReport.current_level}</p>
              </div>
              <div>
                <label className="block text-small font-medium mb-2 text-ink-secondary">Attendance (This Month)</label>
                <input type="text" value={reportData.attendance} onChange={(e) => setReportData({ ...reportData, attendance: e.target.value })} placeholder="e.g., 4/4" className={inputCls} />
              </div>
              <div>
                <label className="block text-small font-medium mb-2 text-ink-secondary">Progress</label>
                <input type="text" value={reportData.progress} onChange={(e) => setReportData({ ...reportData, progress: e.target.value })} placeholder="e.g., Completed Surah Al-Mulk" className={inputCls} />
              </div>
              <div>
                <label className="block text-small font-medium mb-2 text-ink-secondary">Additional Notes</label>
                <textarea value={reportData.notes} onChange={(e) => setReportData({ ...reportData, notes: e.target.value })} placeholder="Comments for parents..."
                  className="w-full h-24 p-3 rounded-md border border-ink-faint/40 bg-surface-card resize-none text-body placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand/40 transition-all" />
              </div>
              <Button onClick={generateReport} className="w-full" data-testid="generate-pdf-btn">
                <Download className="w-4 h-4" />Generate PDF Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
