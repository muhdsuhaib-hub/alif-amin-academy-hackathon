import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Eye, Circle, Radio, ChevronRight, Users, Clock, FileText, Play, Download } from 'lucide-react';
import { toast } from 'sonner';
import Card, { CardHeader, CardBody } from '../Card';
import Badge from '../Badge';
import Button from '../Button';
import Spinner from '../Spinner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SessionMonitor() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [detailSession, setDetailSession] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sPage, setSPage] = useState(1);
  const SP = 10;

  const fetchSessions = useCallback(async () => {
    try {
      const q = filter === 'all' ? '' : `?status=${filter}`;
      const res = await fetch(`${API}/classroom/admin/sessions${q}`, { credentials: 'include' });
      if (res.ok) { const d = await res.json(); setSessions(d.sessions || []); }
    } catch {}
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchSessions(); const iv = setInterval(fetchSessions, 15000); return () => clearInterval(iv); }, [fetchSessions]);

  const handleStealthJoin = async (session) => {
    try {
      const res = await fetch(`${API}/classroom/admin/stealth-join`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ room_name: session.meet_link_slug }),
      });
      if (res.ok) {
        toast.success('Joining in stealth mode...');
        navigate(`/classroom/${session.session_id}`);
      } else {
        toast.error('Failed to join');
      }
    } catch { toast.error('Connection error'); }
  };

  const handleStealthRecord = async (session) => {
    try {
      const res = await fetch(`${API}/classroom/session/${session.session_id}/recording/toggle`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ action: 'start' }),
      });
      if (res.ok) {
        const d = await res.json();
        toast.success(d.visible ? 'Recording started (visible)' : 'Stealth recording started');
      }
    } catch { toast.error('Failed to start recording'); }
  };

  const handleViewDetails = async (sessionId) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`${API}/classroom/admin/sessions/${sessionId}/details`, { credentials: 'include' });
      if (res.ok) { setDetailSession(await res.json()); }
    } catch { toast.error('Failed to load details'); }
    finally { setDetailLoading(false); }
  };

  const statusConfig = {
    live: { color: 'success', label: 'LIVE', icon: Radio },
    booked: { color: 'info', label: 'Booked', icon: Clock },
    completed: { color: 'neutral', label: 'Completed', icon: Circle },
    cancelled: { color: 'danger', label: 'Cancelled', icon: Circle },
  };

  const liveSessions = sessions.filter(s => s.status === 'live');
  const otherSessions = sessions.filter(s => s.status !== 'live');

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6" data-testid="session-monitor">
      {/* Filters */}
      <div className="flex items-center gap-2">
        {['all', 'live', 'booked', 'completed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
              filter === f ? 'bg-brand text-white' : 'bg-surface-warm text-ink-secondary hover:bg-surface-subtle'
            }`}
            data-testid={`filter-${f}`}>
            {f === 'live' && <Radio className="w-3 h-3 inline mr-1" />}{f}
          </button>
        ))}
      </div>

      {/* Live Sessions (Priority) */}
      {liveSessions.length > 0 && (
        <Card className="overflow-hidden border-green-200">
          <CardHeader className="bg-green-50/50">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-green-600 animate-pulse" />
              <h3 className="text-h3 font-semibold text-green-800">Live Now ({liveSessions.length})</h3>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {liveSessions.map((s) => (
              <div key={s.session_id} className="flex items-center gap-4 px-6 py-4 border-b border-surface-subtle last:border-0 hover:bg-green-50/30 transition-colors" data-testid={`live-session-${s.session_id}`}>
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{s.teacher_name} & {s.student_name}</p>
                  <p className="text-xs text-ink-tertiary">{new Date(s.start_time_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleStealthJoin(s)} data-testid={`stealth-join-${s.session_id}`}>
                    <Eye className="w-3.5 h-3.5" />Stealth Join
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

      {/* Session History */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-h3 font-semibold text-ink">Session History</h3>
            <span className="text-small text-ink-tertiary">{sessions.length} sessions</span>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-subtle bg-surface-warm">
                <th className="text-left px-4 py-3 text-caption font-medium text-ink-secondary">Status</th>
                <th className="text-left px-4 py-3 text-caption font-medium text-ink-secondary">Teacher</th>
                <th className="text-left px-4 py-3 text-caption font-medium text-ink-secondary">Student</th>
                <th className="text-left px-4 py-3 text-caption font-medium text-ink-secondary">Date / Time</th>
                <th className="text-right px-4 py-3 text-caption font-medium text-ink-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-subtle">
              {(() => { const all = filter === 'all' ? sessions : sessions; const tp = Math.max(1, Math.ceil(all.length / SP)); const sliced = all.slice((sPage - 1) * SP, sPage * SP); return sliced.map((s) => {
                const sc = statusConfig[s.status] || statusConfig.booked;
                return (
                  <tr key={s.session_id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="px-4 py-3">
                      <Badge color={sc.color}>{sc.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink">{s.teacher_name}</td>
                    <td className="px-4 py-3 text-sm text-ink">{s.student_name}</td>
                    <td className="px-4 py-3 text-sm text-ink-secondary">{new Date(s.start_time_utc).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleViewDetails(s.session_id)}
                        className="text-xs font-medium text-brand hover:underline" data-testid={`view-details-${s.session_id}`}>
                        Details <ChevronRight className="w-3 h-3 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sessions.length === 0 && (
          <div className="p-8 text-center">
            <Video className="w-12 h-12 mx-auto mb-3 text-ink-faint" />
            <p className="text-sm text-ink-secondary">No sessions found</p>
          </div>
        )}
      </Card>

      {/* Session Detail Modal */}
      {detailSession && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetailSession(null)}>
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="session-detail-modal">
            <div className="px-6 py-5 border-b border-black/5">
              <h2 className="text-lg font-semibold text-ink">Session Details</h2>
              <p className="text-xs text-ink-tertiary mt-0.5">{detailSession.session_id}</p>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Participants */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-surface-warm">
                  <p className="text-caption text-ink-tertiary">Teacher</p>
                  <p className="text-sm font-medium text-ink">{detailSession.teacher_name}</p>
                  <p className="text-xs text-ink-tertiary">{detailSession.teacher_email}</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-warm">
                  <p className="text-caption text-ink-tertiary">Student</p>
                  <p className="text-sm font-medium text-ink">{detailSession.student_name}</p>
                  <p className="text-xs text-ink-tertiary">{detailSession.student_email}</p>
                </div>
              </div>

              {/* Progress */}
              {detailSession.progress && (
                <div className="p-4 rounded-xl bg-brand/5 border border-brand/10">
                  <p className="text-sm font-semibold text-brand mb-2">Session Progress</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <p><span className="text-ink-tertiary">Surah:</span> {detailSession.progress.surah_name}</p>
                    <p><span className="text-ink-tertiary">Ayah:</span> {detailSession.progress.ayah_start}–{detailSession.progress.ayah_end}</p>
                    <p><span className="text-ink-tertiary">Track:</span> {detailSession.progress.track_type}</p>
                  </div>
                  {detailSession.progress.grading && (
                    <div className="flex gap-3 mt-2">
                      {Object.entries(detailSession.progress.grading).map(([k, v]) => (
                        <span key={k} className="text-xs font-medium px-2 py-1 rounded bg-white">{k.replace('_score', '')}: <span className="text-brand">{v}/10</span></span>
                      ))}
                    </div>
                  )}
                  {detailSession.progress.teacher_comments && <p className="text-xs text-ink-secondary mt-2 italic">"{detailSession.progress.teacher_comments}"</p>}
                </div>
              )}

              {/* Rating */}
              {detailSession.rating && (
                <div className="p-3 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/10">
                  <p className="text-sm font-semibold text-[#D4AF37]">Student Rating: {'★'.repeat(detailSession.rating.rating)}{'☆'.repeat(5 - detailSession.rating.rating)}</p>
                  {detailSession.rating.review && <p className="text-xs text-ink-secondary mt-1">"{detailSession.rating.review}"</p>}
                </div>
              )}

              {/* Recording */}
              {detailSession.recording_url && (
                <div className="p-3 rounded-xl bg-surface-warm flex items-center gap-3">
                  <Play className="w-5 h-5 text-brand" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">Recording Available</p>
                    <p className="text-xs text-ink-tertiary">Quality assurance playback</p>
                  </div>
                  <a href={detailSession.recording_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-brand text-white hover:bg-brand-light transition-all">
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Payment */}
              {detailSession.payment && (
                <div className="p-3 rounded-xl bg-surface-warm text-xs space-y-1">
                  <p className="text-sm font-semibold text-ink mb-1">Payment Record</p>
                  <p><span className="text-ink-tertiary">Credits Used:</span> {detailSession.payment.credits_used}</p>
                  <p><span className="text-ink-tertiary">Tutor Payout:</span> RM{detailSession.payment.tutor_payout}</p>
                  <p><span className="text-ink-tertiary">Platform Commission:</span> RM{detailSession.payment.platform_commission}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-black/5">
              <Button variant="secondary" onClick={() => setDetailSession(null)} className="w-full">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
