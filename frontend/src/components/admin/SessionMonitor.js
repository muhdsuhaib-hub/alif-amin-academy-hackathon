import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Eye, Circle, Radio, ChevronRight, ChevronLeft, Users, Clock, FileText, Play, Download } from 'lucide-react';
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
  const [page, setPage] = useState(0);
  const [detailSession, setDetailSession] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch live sessions (polling)
  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch(`${API}/classroom/admin/sessions?status=live`, { credentials: 'include' });
      if (res.ok) { const d = await res.json(); setLiveSessions(d.sessions || []); }
    } catch {}
  }, []);

  // Fetch paginated session history from bookings
  const fetchHistory = useCallback(async (pageNum, statusFilter) => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({ limit: PAGE_SIZE, offset: pageNum * PAGE_SIZE });
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      const res = await fetch(`${API}/admin/sessions/history?${params}`, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setHistoryData({ bookings: d.bookings || [], total: d.total || 0 });
      }
    } catch (e) { console.error(e); }
    finally { setHistoryLoading(false); setLoading(false); }
  }, []);

  useEffect(() => { fetchLive(); fetchHistory(0, filter); const iv = setInterval(fetchLive, 15000); return () => clearInterval(iv); }, [fetchLive, fetchHistory, filter]);

  const changePage = (p) => { setPage(p); fetchHistory(p, filter); };
  const changeFilter = (f) => { setFilter(f); setPage(0); fetchHistory(0, f); };

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
      if (res.ok) { const d = await res.json(); toast.success(d.visible ? 'Recording started (visible)' : 'Stealth recording started'); }
    } catch { toast.error('Failed to start recording'); }
  };

  const handleViewDetails = async (sessionId) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`${API}/classroom/admin/sessions/${sessionId}/details`, { credentials: 'include' });
      if (res.ok) setDetailSession(await res.json());
    } catch { toast.error('Failed to load details'); }
    finally { setDetailLoading(false); }
  };

  const statusConfig = {
    live: { color: 'success', label: 'LIVE' },
    scheduled: { color: 'info', label: 'Scheduled' },
    completed: { color: 'neutral', label: 'Completed' },
    cancelled: { color: 'danger', label: 'Cancelled' },
  };

  const totalPages = Math.max(1, Math.ceil(historyData.total / PAGE_SIZE));

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6" data-testid="session-monitor">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'scheduled', 'completed', 'cancelled'].map((f) => (
          <button key={f} onClick={() => changeFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
              filter === f ? 'bg-emerald-700 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
            }`}
            data-testid={`filter-${f}`}>
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">{historyData.total} total sessions</span>
      </div>

      {/* Live Sessions (Priority) */}
      {liveSessions.length > 0 && (
        <Card className="overflow-hidden border-green-200">
          <CardHeader className="bg-green-50/50">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-green-600 animate-pulse" />
              <h3 className="text-sm font-semibold text-green-800">Live Now ({liveSessions.length})</h3>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {liveSessions.map((s) => (
              <div key={s.session_id} className="flex items-center gap-4 px-6 py-4 border-b border-green-100 last:border-0 hover:bg-green-50/30 transition-colors" data-testid={`live-session-${s.session_id}`}>
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{s.teacher_name} & {s.student_name}</p>
                  <p className="text-xs text-slate-400">{new Date(s.start_time_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleStealthJoin(s)} data-testid={`stealth-join-${s.session_id}`}>
                    <Eye className="w-3.5 h-3.5" />Stealth
                  </Button>
                  <Button size="sm" variant="gold" onClick={() => handleStealthRecord(s)} data-testid={`stealth-record-${s.session_id}`}>
                    <Radio className="w-3.5 h-3.5" />Record
                  </Button>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Session History Table (Server-side paginated) */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Session History</h3>
          {historyLoading && <Spinner className="w-4 h-4" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]" data-testid="session-history-table">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Teacher</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Student</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date / Time</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Duration</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Details</th>
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
                        <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Report Available</span>
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

        {/* Server-side Pagination */}
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

      {/* Session Detail Modal */}
      {detailSession && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetailSession(null)}>
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="session-detail-modal">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Session Details</h2>
              <p className="text-xs text-slate-400 mt-0.5">{detailSession.session_id}</p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-50"><p className="text-[11px] text-slate-400">Teacher</p><p className="text-sm font-medium text-slate-900">{detailSession.teacher_name}</p></div>
                <div className="p-3 rounded-xl bg-slate-50"><p className="text-[11px] text-slate-400">Student</p><p className="text-sm font-medium text-slate-900">{detailSession.student_name}</p></div>
              </div>
              {detailSession.progress && (
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <p className="text-sm font-semibold text-emerald-800 mb-2">Session Progress</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <p><span className="text-slate-500">Surah:</span> {detailSession.progress.surah_name}</p>
                    <p><span className="text-slate-500">Ayah:</span> {detailSession.progress.ayah_start}-{detailSession.progress.ayah_end}</p>
                  </div>
                </div>
              )}
              {detailSession.rating && (
                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                  <p className="text-sm font-semibold text-amber-700">Rating: {'★'.repeat(detailSession.rating.rating)}{'☆'.repeat(5 - detailSession.rating.rating)}</p>
                  {detailSession.rating.review && <p className="text-xs text-slate-500 mt-1 italic">"{detailSession.rating.review}"</p>}
                </div>
              )}
              {detailSession.payment && (
                <div className="p-3 rounded-xl bg-slate-50 text-xs space-y-1">
                  <p className="text-sm font-semibold text-slate-900 mb-1">Payment</p>
                  <p><span className="text-slate-400">Credits:</span> {detailSession.payment.credits_used}</p>
                  <p><span className="text-slate-400">Tutor Payout:</span> RM{detailSession.payment.tutor_payout}</p>
                  <p><span className="text-slate-400">Platform Fee:</span> RM{detailSession.payment.platform_commission}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setDetailSession(null)} className="w-full">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
