import React, { useState, useEffect } from 'react';
import { Search, BookOpen, X, Eraser } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function QuranNavigator({ onNavigate, onClose, onClearHighlights }) {
  const [chapters, setChapters] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/quran/chapters`);
        if (r.ok) {
          const data = await r.json();
          setChapters(data.chapters || []);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const filtered = chapters.filter(ch =>
    !search || ch.name_simple?.toLowerCase().includes(search.toLowerCase()) ||
    ch.name_arabic?.includes(search) || String(ch.id).includes(search)
  );

  return (
    <div className="flex flex-col h-full" data-testid="quran-navigator">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-semibold text-white">Surah Navigator</h3>
        </div>
        <div className="flex items-center gap-1">
          {onClearHighlights && (
            <button
              onClick={onClearHighlights}
              className="p-1.5 hover:bg-white/10 rounded-lg text-rose-400/60 hover:text-rose-400 transition-all"
              title="Clear All Highlights"
              data-testid="clear-highlights-btn"
            >
              <Eraser className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg" data-testid="close-navigator">
            <X className="w-4 h-4 text-white/40" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search surah..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            data-testid="surah-search"
          />
        </div>
      </div>

      {/* Surah List */}
      <div className="flex-1 overflow-y-auto px-2 py-1" data-testid="surah-list">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-white/30 text-sm">Loading...</div>
        ) : (
          filtered.map(ch => (
            <button
              key={ch.id}
              onClick={() => onNavigate?.({ type: 'surah', chapter: ch.id })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-left transition-all group"
              data-testid={`surah-item-${ch.id}`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-500 text-[11px] font-bold flex-shrink-0">
                {ch.id}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 font-medium truncate group-hover:text-white transition-colors">
                  {ch.name_simple}
                </p>
                <p className="text-[10px] text-white/30">{ch.verses_count} verses &middot; {ch.revelation_place}</p>
              </div>
              <p className="text-base text-white/40 group-hover:text-white/60 transition-colors flex-shrink-0" style={{ fontFamily: "'Amiri', serif" }}>
                {ch.name_arabic}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
