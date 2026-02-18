import React, { useState, useEffect } from 'react';
import { TrendingUp, BookOpen, Award, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Card, { CardHeader, CardBody } from '../Card';
import Spinner from '../Spinner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-xl px-3 py-2 border border-black/5 shadow-lg text-xs">
      <p className="font-medium text-ink mb-1">{label}</p>
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

  if (loading) return <Spinner />;

  // Chart data — last 10 sessions, oldest first
  const chartData = progress.slice(0, 10).reverse().map((r, i) => ({
    session: `#${i + 1}`,
    Fluency: r.grading?.fluency_score || 0,
    Tajweed: r.grading?.tajweed_score || 0,
    Makhraj: r.grading?.makhraj_score || 0,
  }));

  // Summary stats
  const avgScore = (key) => {
    const scores = progress.filter(r => r.grading?.[key]).map(r => r.grading[key]);
    return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';
  };

  const recentActivity = progress.slice(0, 3);

  return (
    <div className="space-y-6" data-testid="progress-tracker">
      {/* Score Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Fluency', key: 'fluency_score', color: 'text-brand', bg: 'bg-brand/8' },
          { label: 'Tajweed', key: 'tajweed_score', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/8' },
          { label: 'Makhraj', key: 'makhraj_score', color: 'text-blue-600', bg: 'bg-blue-500/8' },
        ].map(({ label, key, color, bg }) => (
          <Card key={key} className="p-4">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2`}>
              <Award className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-caption text-ink-tertiary">{label}</p>
            <p className={`text-h2 font-semibold ${color} tabular-nums`} data-testid={`avg-${key}`}>{avgScore(key)}</p>
            <p className="text-caption text-ink-faint">avg / 10</p>
          </Card>
        ))}
      </div>

      {/* Score Trend Chart */}
      {chartData.length > 1 && (
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand" />
              <h3 className="text-h3 font-semibold text-ink">Score Trend</h3>
            </div>
            <p className="text-small text-ink-tertiary">Last {chartData.length} sessions</p>
          </CardHeader>
          <CardBody>
            <div className="h-48" data-testid="score-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="session" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="Fluency" stroke="#0F3D2E" strokeWidth={2.5} dot={{ r: 4, fill: '#0F3D2E' }} />
                  <Line type="monotone" dataKey="Tajweed" stroke="#D4AF37" strokeWidth={2.5} dot={{ r: 4, fill: '#D4AF37' }} />
                  <Line type="monotone" dataKey="Makhraj" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4, fill: '#3B82F6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-3">
              {[{ label: 'Fluency', color: '#0F3D2E' }, { label: 'Tajweed', color: '#D4AF37' }, { label: 'Makhraj', color: '#3B82F6' }].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="text-xs text-ink-secondary">{l.label}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand" />
            <h3 className="text-h3 font-semibold text-ink">Recent Classes</h3>
          </div>
        </CardHeader>
        <CardBody>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-10 h-10 mx-auto mb-2 text-ink-faint" />
              <p className="text-small text-ink-secondary">No classes yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((r) => (
                <div key={r.progress_id} className="flex items-center gap-4 p-3 rounded-xl bg-surface-warm" data-testid="recent-class-item">
                  <div className="w-10 h-10 rounded-xl bg-brand/8 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{r.surah_name}</p>
                    <p className="text-xs text-ink-tertiary">
                      Ayah {r.ayah_start}–{r.ayah_end} · {r.track_type?.split(' ')[0]}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1">
                      {[r.grading?.fluency_score, r.grading?.tajweed_score, r.grading?.makhraj_score].map((s, i) => (
                        <span key={i} className={`text-xs font-semibold px-1.5 py-0.5 rounded ${s >= 7 ? 'bg-green-100 text-green-700' : s >= 4 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {s || '—'}
                        </span>
                      ))}
                    </div>
                    <p className="text-caption text-ink-faint mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
