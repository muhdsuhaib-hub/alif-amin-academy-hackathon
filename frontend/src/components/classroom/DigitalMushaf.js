import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Pointer, Highlighter, Maximize2, Minimize2 } from 'lucide-react';
import { useQuranPage, TOTAL_PAGES, getJuzForPage } from '../../services/quranApi';
import Spinner from '../Spinner';

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: 'rgba(250, 204, 21, 0.35)' },
  { name: 'Green', value: 'rgba(34, 197, 94, 0.35)' },
];

export default function DigitalMushaf({
  currentPage: externalPage,
  onPageChange,
  isTeacher = false,
  pointerPosition,
  highlights = [],
  onPointerMove,
  onHighlight,
  onAyahClick,
}) {
  const [localPage, setLocalPage] = useState(1);
  const page = externalPage ?? localPage;
  const setPage = onPageChange ?? setLocalPage;

  const [isPointerMode, setIsPointerMode] = useState(false);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0].value);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState(null);
  const mushafRef = useRef(null);

  const { data, isLoading, error } = useQuranPage(page);

  const goNext = useCallback(() => {
    if (page < TOTAL_PAGES) setPage(page + 1);
  }, [page, setPage]);

  const goPrev = useCallback(() => {
    if (page > 1) setPage(page - 1);
  }, [page, setPage]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') goPrev(); // RTL: right = prev
      if (e.key === 'ArrowLeft') goNext();  // RTL: left = next
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  const handleMouseMove = useCallback((e) => {
    if (!isPointerMode || !isTeacher || !onPointerMove) return;
    const rect = mushafRef.current?.getBoundingClientRect();
    if (!rect) return;
    onPointerMove({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, [isPointerMode, isTeacher, onPointerMove]);

  const handleAyahClick = (verse) => {
    if (isHighlightMode && isTeacher && onHighlight) {
      onHighlight({ verseKey: verse.verse_key, color: highlightColor });
    } else {
      setSelectedAyah(verse.verse_key === selectedAyah ? null : verse.verse_key);
      if (onAyahClick) onAyahClick(verse);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      mushafRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Group verses by chapter for bismillah headers
  const groupedVerses = (data?.verses || []).reduce((acc, v) => {
    const chId = v.chapter_id;
    if (!acc[chId]) acc[chId] = [];
    acc[chId].push(v);
    return acc;
  }, {});

  return (
    <div
      ref={mushafRef}
      className={`relative flex flex-col bg-[#FBF9F1] rounded-2xl overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
      data-testid="digital-mushaf"
    >
      {/* Floating Teacher Toolbar */}
      {isTeacher && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg"
          data-testid="teacher-toolbar"
        >
          <button
            onClick={() => { setIsPointerMode(!isPointerMode); setIsHighlightMode(false); }}
            className={`p-2 rounded-xl transition-all ${isPointerMode ? 'bg-brand text-white shadow-md' : 'hover:bg-black/5 text-ink-secondary'}`}
            title="Laser Pointer"
            data-testid="pointer-toggle"
          >
            <Pointer className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setIsHighlightMode(!isHighlightMode); setIsPointerMode(false); }}
            className={`p-2 rounded-xl transition-all ${isHighlightMode ? 'bg-brand text-white shadow-md' : 'hover:bg-black/5 text-ink-secondary'}`}
            title="Highlighter"
            data-testid="highlight-toggle"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          {isHighlightMode && (
            <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-black/10">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setHighlightColor(c.value)}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${highlightColor === c.value ? 'border-brand scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c.value.replace('0.35', '1') }}
                  title={c.name}
                />
              ))}
            </div>
          )}
          <div className="w-px h-5 bg-black/10 mx-1" />
          <button onClick={goPrev} disabled={page <= 1} className="p-2 rounded-xl hover:bg-black/5 disabled:opacity-30 text-ink-secondary" data-testid="prev-page">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-ink-secondary min-w-[60px] text-center tabular-nums">{page} / {TOTAL_PAGES}</span>
          <button onClick={goNext} disabled={page >= TOTAL_PAGES} className="p-2 rounded-xl hover:bg-black/5 disabled:opacity-30 text-ink-secondary" data-testid="next-page">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-black/10 mx-1" />
          <button onClick={toggleFullscreen} className="p-2 rounded-xl hover:bg-black/5 text-ink-secondary" data-testid="fullscreen-toggle">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Mushaf Content */}
      <div
        className={`flex-1 overflow-y-auto px-6 py-16 ${isPointerMode ? 'cursor-crosshair' : isHighlightMode ? 'cursor-cell' : ''}`}
        onMouseMove={handleMouseMove}
        style={{ direction: 'rtl', fontFamily: "'Amiri', 'Scheherazade New', serif" }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-danger">Failed to load page. Please try again.</div>
        ) : (
          <div className="max-w-[640px] mx-auto">
            {Object.entries(groupedVerses).map(([chapterId, verses]) => (
              <div key={chapterId}>
                {/* Bismillah for new surah (skip for Al-Fatiha page & At-Tawbah) */}
                {verses[0]?.verse_number === 1 && parseInt(chapterId) !== 9 && (
                  <div className="text-center my-6 py-3 border-y border-[#D4AF37]/30">
                    <span className="text-xl text-[#5C4A2A]">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</span>
                  </div>
                )}
                {/* Verses */}
                <div className="leading-[2.8] text-xl text-[#2C1810]">
                  {verses.map((verse) => {
                    const isHighlighted = highlights.some((h) => h.verseKey === verse.verse_key);
                    const hl = highlights.find((h) => h.verseKey === verse.verse_key);
                    return (
                      <span
                        key={verse.verse_key}
                        onClick={() => handleAyahClick(verse)}
                        data-testid={`ayah-${verse.verse_key}`}
                        className={`inline cursor-pointer transition-colors rounded px-0.5 ${
                          selectedAyah === verse.verse_key ? 'bg-brand/15' : ''
                        } ${isHighlightMode && isTeacher ? 'hover:bg-yellow-200/40' : 'hover:bg-black/5'}`}
                        style={isHighlighted ? { backgroundColor: hl?.color || HIGHLIGHT_COLORS[0].value } : undefined}
                      >
                        {verse.text_uthmani}{' '}
                        <span className="text-sm text-[#D4AF37] font-sans">﴿{verse.verse_number.toLocaleString('ar-EG')}﴾</span>{' '}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Remote Pointer Overlay (visible to student) */}
        {pointerPosition && !isTeacher && (
          <div
            className="absolute pointer-events-none z-20"
            style={{
              left: `${pointerPosition.x}%`,
              top: `${pointerPosition.y}%`,
              transform: 'translate(-50%, -50%)',
              transition: 'all 80ms ease-out',
            }}
          >
            <div className="w-5 h-5 bg-red-500 rounded-full opacity-80 animate-pulse shadow-lg" />
            <div className="absolute inset-0 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-40" />
          </div>
        )}
      </div>

      {/* Bottom Page Info (non-teacher / student view) */}
      {!isTeacher && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-white/60 backdrop-blur-md border-t border-black/5">
          <button onClick={goPrev} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-black/5 disabled:opacity-30" data-testid="student-prev-page">
            <ChevronRight className="w-4 h-4 text-ink-secondary" />
          </button>
          <span className="text-xs text-ink-tertiary font-medium tabular-nums">
            Page {page} · Juz {getJuzForPage(page)}
          </span>
          <button onClick={goNext} disabled={page >= TOTAL_PAGES} className="p-1.5 rounded-lg hover:bg-black/5 disabled:opacity-30" data-testid="student-next-page">
            <ChevronLeft className="w-4 h-4 text-ink-secondary" />
          </button>
        </div>
      )}
    </div>
  );
}
