import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, ExternalLink } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function QuranComConnect() {
  const [status, setStatus] = useState({ connected: false, loading: true });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/quran/v2/oauth/status`, { credentials: 'include' });
        if (r.ok) {
          const data = await r.json();
          setStatus({ connected: data.connected, loading: false });
        } else {
          setStatus({ connected: false, loading: false });
        }
      } catch {
        setStatus({ connected: false, loading: false });
      }
    })();
  }, []);

  const handleConnect = () => {
    window.location.href = `${API}/quran/v2/oauth/login`;
  };

  if (status.loading) return null;

  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm p-6" data-testid="quran-com-connect">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-emerald-600" />
        <h3 className="text-sm font-semibold text-slate-900">Quran.com Account</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Connect your Quran.com account to sync bookmarks across devices and save your favourite ayahs.
      </p>
      {status.connected ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200/60" data-testid="qf-connected-badge">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">Connected to Quran.com</span>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          className="w-full h-12 rounded-2xl bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 transition-all active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer"
          data-testid="connect-quran-btn"
        >
          <ExternalLink className="w-4 h-4" />
          Connect to Quran.com
        </button>
      )}
    </div>
  );
}
