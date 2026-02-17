import React, { useState, useMemo } from 'react';
import { Search, BookOpen, ChevronRight } from 'lucide-react';
import { useSurahs, TOTAL_PAGES } from '../../services/quranApi';

export default function QuranNavigator({ onNavigate, onClose }) {
  const { data: surahs = [], isLoading } = useSurahs();
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('surah'); // 'surah' | 'page' | 'juz'
  const [pageInput, setPageInput] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return surahs;
    const q = search.toLowerCase();
    return surahs.filter(
      (s) => s.name_simple.toLowerCase().includes(q) || s.name_arabic.includes(q) || String(s.id).includes(q)
    );
  }, [surahs, search]);

  const handlePageGo = () => {
    const p = parseInt(pageInput);
    if (p >= 1 && p <= TOTAL_PAGES) {
      onNavigate({ type: 'page', page: p });
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="quran-navigator">
      {/* Header */}
      <div className="px-4 py-3 border-b border-black/5">
        <h3 className="text-sm font-semibold text-ink mb-2">Navigate Quran</h3>
        <div className="flex gap-1 mb-3">
          {['surah', 'page', 'juz'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                mode === m ? 'bg-brand text-white' : 'bg-surface-subtle text-ink-secondary hover:bg-surface-warm'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === 'surah' && (
        <>
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search surah..."
                className="w-full h-9 pl-8 pr-3 rounded-lg bg-surface-subtle border-none text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                data-testid="surah-search"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-ink-tertiary">Loading...</div>
            ) : (
              filtered.map((surah) => (
                <button
                  key={surah.id}
                  onClick={() => onNavigate({ type: 'surah', surahId: surah.id, surahName: surah.name_simple })}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-subtle/70 transition-colors text-left"
                  data-testid={`surah-${surah.id}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-brand/8 flex items-center justify-center text-xs font-semibold text-brand flex-shrink-0">
                    {surah.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{surah.name_simple}</p>
                    <p className="text-xs text-ink-tertiary">{surah.verses_count} verses · {surah.revelation_place}</p>
                  </div>
                  <span className="text-base text-ink-secondary font-arabic" style={{ fontFamily: "'Amiri', serif" }}>
                    {surah.name_arabic}
                  </span>
                </button>
              ))
            )}
          </div>
        </>
      )}

      {mode === 'page' && (
        <div className="p-4 space-y-3">
          <p className="text-xs text-ink-secondary">Go to a specific Mushaf page (1–604)</p>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={TOTAL_PAGES}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              placeholder="Page number"
              className="flex-1 h-10 px-3 rounded-lg bg-surface-subtle border-none text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
              data-testid="page-input"
              onKeyDown={(e) => e.key === 'Enter' && handlePageGo()}
            />
            <button
              onClick={handlePageGo}
              className="h-10 px-4 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-light transition-all"
              data-testid="go-to-page"
            >
              Go
            </button>
          </div>
          <div className="grid grid-cols-5 gap-1.5 mt-4">
            {[1, 50, 100, 200, 300, 400, 500, 550, 600, 604].map((p) => (
              <button
                key={p}
                onClick={() => onNavigate({ type: 'page', page: p })}
                className="py-2 rounded-lg bg-surface-warm text-xs font-medium text-ink-secondary hover:bg-brand/10 hover:text-brand transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'juz' && (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
              <button
                key={juz}
                onClick={() => onNavigate({ type: 'juz', juz })}
                className="flex flex-col items-center gap-0.5 py-3 rounded-xl bg-surface-warm hover:bg-brand/10 hover:text-brand transition-all"
                data-testid={`juz-${juz}`}
              >
                <BookOpen className="w-4 h-4 text-ink-tertiary" />
                <span className="text-sm font-semibold text-ink">Juz {juz}</span>
                <span className="text-xs text-ink-tertiary">~Page {Math.round((juz - 1) * 20.13 + 1)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
