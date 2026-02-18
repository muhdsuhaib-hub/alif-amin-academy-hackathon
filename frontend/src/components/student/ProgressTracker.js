import React, { useState, useEffect } from 'react';
import { TrendingUp, BookOpen, Award, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Spinner from '../Spinner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-xl px-3 py-2 border border-slate-200/50 shadow-lg text-xs">
      <p className="font-medium text-slate-900 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-semibold">{p.value}/10</span></p>
      ))}
    </div>
  );
};

export default function ProgressTracker({ studentId }) {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      try {
        const res = await fetch(`${API}/classroom/student/${studentId}/progress`, { credentials: 'include' });
        if (res.ok) { const d = await res.json(); setProgress(d.progress || []); }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [studentId]);

  if (loading) return <div className="p-8 flex justify-center"><Spinner /></div>;

  const chartData = progress.slice(0, 10).reverse().map((r, i) => ({
    session: `#${i + 1}`,
    Fluency: r.grading?.fluency_score || 0,
    Tajweed: r.grading?.tajweed_score || 0,
    Makhraj: r.grading?.makhraj_score || 0,
  }));

  const avgScore = (key) => {
    const scores = progress.filter(r => r.grading?.[key]).map(r => r.grading[key]);
    return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';
  };

  const recentActivity = progress.slice(0, 5);

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-4" data-testid="progress-tracker">
      {/* Score Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Fluency', key: 'fluency_score', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', valueColor: 'text-emerald-700' },
          { label: 'Tajweed', key: 'tajweed_score', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', valueColor: 'text-amber-700' },
          { label: 'Makhraj', key: 'makhraj_score', iconBg: 'bg-blue-50', iconColor: 'text-blue-600', valueColor: 'text-blue-700' },
        ].map(({ label, key, iconBg, iconColor, valueColor }) => (
          <div key={key} className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-4">
            <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
              <Award className={`w-4 h-4 ${iconColor}`} />
            </div>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold ${valueColor} tabular-nums mt-0.5`} data-testid={`avg-${key}`}>{avgScore(key)}</p>
            <p className="text-[11px] text-slate-400">avg / 10</p>
          </div>
        ))}
      </div>

      {/* Score Trend Chart */}
      {chartData.length > 1 && (
        <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900">Score Trend</h3>
            <span className="text-xs text-slate-400 ml-auto">Last {chartData.length} sessions</span>
          </div>
          <div className="px-5 py-5">
            <div className="h-48" data-testid="score-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="session" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="Fluency" stroke="#059669" strokeWidth={2.5} dot={{ r: 4, fill: '#059669' }} />
                  <Line type="monotone" dataKey="Tajweed" stroke="#D97706" strokeWidth={2.5} dot={{ r: 4, fill: '#D97706' }} />
                  <Line type="monotone" dataKey="Makhraj" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: '#2563EB' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-5 mt-3">
              {[{ label: 'Fluency', color: '#059669' }, { label: 'Tajweed', color: '#D97706' }, { label: 'Makhraj', color: '#2563EB' }].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="text-xs text-slate-500">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-900">Recent Classes</h3>
        </div>
        <div className="p-5">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-200" />
              <p className="text-xs text-slate-400">No classes completed yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((r) => (
                <div key={r.progress_id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors" data-testid="recent-class-item">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{r.surah_name || 'Quran Lesson'}</p>
                    <p className="text-xs text-slate-500">
                      {r.ayah_start && r.ayah_end ? `Ayah ${r.ayah_start}–${r.ayah_end}` : r.track_type || 'Session'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1">
                      {[r.grading?.fluency_score, r.grading?.tajweed_score, r.grading?.makhraj_score].map((s, i) => (
                        <span key={i} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          s >= 7 ? 'bg-emerald-50 text-emerald-700' :
                          s >= 4 ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {s || '—'}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
