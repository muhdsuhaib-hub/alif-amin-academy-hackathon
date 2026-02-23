import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Eye, Radio, ChevronRight, ChevronLeft, Clock, FileText, Filter, Calendar, X } from 'lucide-react';
import { toast } from 'sonner';
import Card, { CardHeader, CardBody } from '../Card';
import Badge from '../Badge';
import Button from '../Button';
import Spinner from '../Spinner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PAGE_SIZE = 20;

export default function SessionMonitor() {
  const navigate = useNavigate();
  const [liveSessions, setLiveSessions] = useState([]);
  const [historyData, setHistoryData] = useState({ bookings: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [page, setPage] = useState(0);
  const [reportModal, setReportModal] = useState(null);

  // Fetch teachers list for filter
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/teachers`, { credentials: 'include' });
        if (r.ok) setTeachers(await r.json());
      } catch {}
    })();
  }, []);

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch(`${API}/classroom/admin/sessions?status=live`, { credentials: 'include' });
      if (res.ok) { const d = await res.json(); setLiveSessions(d.sessions || []); }
    } catch {}
  }, []);

  const fetchHistory = useCallback(async (pageNum, statusFilter, teacherId, date) => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({ limit: PAGE_SIZE, offset: pageNum * PAGE_SIZE });
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (teacherId) params.append('teacher_id', teacherId);
      if (date) params.append('date', date);
      const res = await fetch(`${API}/admin/sessions/history?${params}`, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setHistoryData({ bookings: d.bookings || [], total: d.total || 0 });
      }
    } catch (e) { console.error(e); }
    finally { setHistoryLoading(false); setLoading(false); }
  }, []);

  // Live session polling disabled — UI torn down for rebuild.
  // handleStealthJoin and handleStealthRecord preserved below for WebRTC reuse.

  useEffect(() => {
    fetchHistory(0, filter, filterTeacher, filterDate);
    const historyPoll = setInterval(() => fetchHistory(page, filter, filterTeacher, filterDate), 30000);
    return () => { clearInterval(historyPoll); };
  }, [fetchHistory, filter, filterTeacher, filterDate]);

  const changePage = (p) => { setPage(p); fetchHistory(p, filter, filterTeacher, filterDate); };
  const handleFilterChange = (f) => { setFilter(f); setPage(0); fetchHistory(0, f, filterTeacher, filterDate); };
  const handleTeacherFilter = (tid) => { setFilterTeacher(tid); setPage(0); fetchHistory(0, filter, tid, filterDate); };
  const handleDateFilter = (d) => { setFilterDate(d); setPage(0); fetchHistory(0, filter, filterTeacher, d); };
  const clearFilters = () => { setFilter('all'); setFilterTeacher(''); setFilterDate(''); setPage(0); fetchHistory(0, 'all', '', ''); };

  const handleStealthJoin = async (session) => {
    try {
      const res = await fetch(`${API}/classroom/admin/stealth-join`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ room_name: session.meet_link_slug }),
      });
      if (res.ok) { toast.success('Joining in stealth mode...'); navigate(`/classroom/${session.session_id}`); }
      else toast.error('Failed to join');
    } catch { toast.error('Connection error'); }
  };

  const handleStealthRecord = async (session) => {
    try {
      const res = await fetch(`${API}/classroom/session/${session.session_id}/recording/toggle`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ action: 'start' }),
      });
      if (res.ok) toast.success('Recording started');
    } catch { toast.error('Failed to start recording'); }
  };

  const statusConfig = {
    live: { color: 'success', label: 'LIVE' },
    scheduled: { color: 'info', label: 'Scheduled' },
    completed: { color: 'neutral', label: 'Completed' },
    cancelled: { color: 'danger', label: 'Cancelled' },
    abandoned: { color: 'warning', label: 'Abandoned' },
  };

  const totalPages = Math.max(1, Math.ceil(historyData.total / PAGE_SIZE));
  const hasActiveFilters = filter !== 'all' || filterTeacher || filterDate;

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6" data-testid="session-monitor">
      {/* Status Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'scheduled', 'completed', 'cancelled', 'abandoned'].map((f) => (
          <button key={f} onClick={() => handleFilterChange(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
              filter === f ? 'bg-emerald-700 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
            }`}
            data-testid={`filter-${f}`}>
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">{historyData.total} sessions</span>
      </div>

      {/* Advanced Filters Row (#7) */}
      <div className="flex flex-wrap items-center gap-3 bg-white/70 rounded-2xl border border-slate-200/60 p-3" data-testid="advanced-filters">
        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <select
          value={filterTeacher}
          onChange={(e) => handleTeacherFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          data-testid="filter-teacher-select"
        >
          <option value="">All Teachers</option>
          {teachers.map(t => (
            <option key={t.teacher_id} value={t.teacher_id}>{t.user?.name || 'Unknown'}</option>
          ))}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => handleDateFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          data-testid="filter-date-input"
        />
        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors" data-testid="clear-filters">
            <X className="w-3 h-3" />Clear
          </button>
        )}
      </div>

      {/* Live Sessions — UI removed for rebuild. WebRTC functions (handleStealthJoin, handleStealthRecord) preserved. */}

      {/* Session History Table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Session History</h3>
          {historyLoading && <Spinner className="w-4 h-4" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]" data-testid="session-history-table">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Teacher</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Student</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date / Time</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Duration</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {historyData.bookings.map((b, i) => {
                const sc = statusConfig[b.status] || statusConfig.scheduled;
                return (
                  <tr key={b.booking_id || i} className="hover:bg-slate-50/50 transition-colors" data-testid={`history-row-${i}`}>
                    <td className="px-4 py-3"><Badge color={sc.color}>{sc.label}</Badge></td>
                    <td className="px-4 py-3 text-sm text-slate-900">{b.teacher_name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{b.student_name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{b.start_time_utc ? new Date(b.start_time_utc).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{b.duration_minutes || 30} min</td>
                    <td className="px-4 py-3 text-right">
                      {b.session_report ? (
                        <button
                          onClick={() => setReportModal(b.session_report)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
                          data-testid={`view-report-${i}`}
                        >
                          <FileText className="w-3 h-3" />View Report
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <button onClick={() => changePage(page - 1)} disabled={page === 0}
              className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-emerald-700 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
              data-testid="history-prev">
              <ChevronLeft className="w-3.5 h-3.5" />Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum = i;
                if (totalPages > 7) {
                  if (page < 4) pageNum = i;
                  else if (page > totalPages - 4) pageNum = totalPages - 7 + i;
                  else pageNum = page - 3 + i;
                }
                return (
                  <button key={pageNum} onClick={() => changePage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${page === pageNum ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                    data-testid={`history-page-${pageNum + 1}`}>
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>
            <button onClick={() => changePage(page + 1)} disabled={page >= totalPages - 1}
              className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-emerald-700 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
              data-testid="history-next">
              Next<ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {historyData.bookings.length === 0 && !historyLoading && (
          <div className="p-8 text-center">
            <Video className="w-10 h-10 mx-auto mb-2 text-slate-200" />
            <p className="text-sm text-slate-400">No sessions found</p>
          </div>
        )}
      </Card>

      {/* Session Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReportModal(null)}>
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="session-report-modal">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Session Report</h2>
              <button onClick={() => setReportModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {reportModal.summary && (
                <div className="p-4 rounded-xl bg-slate-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Summary</p>
                  <p className="text-sm text-slate-800">{reportModal.summary}</p>
                </div>
              )}
              {reportModal.tajweed_notes && (
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Tajweed Notes</p>
                  <p className="text-sm text-slate-700">{reportModal.tajweed_notes}</p>
                </div>
              )}
              {(reportModal.current_surah || reportModal.current_ayah) && (
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Progress</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {reportModal.current_surah && <p><span className="text-slate-500">Surah:</span> {reportModal.current_surah}</p>}
                    {reportModal.current_ayah && <p><span className="text-slate-500">Ayah:</span> {reportModal.current_ayah}</p>}
                    {reportModal.fluency_rating && <p><span className="text-slate-500">Fluency:</span> {reportModal.fluency_rating}</p>}
                  </div>
                </div>
              )}
              {reportModal.homework && (
                <div className="p-4 rounded-xl bg-slate-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Homework</p>
                  <p className="text-sm text-slate-700">{reportModal.homework}</p>
                </div>
              )}
              <div className="text-[11px] text-slate-400">
                Report ID: {reportModal.report_id || 'N/A'} | Created: {reportModal.created_at ? new Date(reportModal.created_at).toLocaleString() : 'N/A'}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setReportModal(null)} className="w-full">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
