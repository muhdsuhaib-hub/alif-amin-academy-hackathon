import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Search, X, Loader2, Maximize2, Minimize2, Hash, Layers } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ─── Arabic numeral helper ───
function toArabicNum(n) {
  const d = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  return String(n).replace(/\d/g, c => d[c]);
}

const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
const QURAN_FONT = "'KFGQPC Uthmanic Script HAFS', 'Amiri', serif";

// ─── Error Boundary ───
class QuranV2ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(err, info) { console.error('QuranV2 Error:', err, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-[#FDFBF7]" data-testid="quran-v2-error">
          <div className="text-center px-8 py-12">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Unable to load Quran</h3>
            <p className="text-sm text-slate-500 mb-4 max-w-sm">An error occurred while loading the Quran viewer. The classroom session is unaffected.</p>
            <button onClick={() => this.setState({ hasError: false, error: null })}
              className="px-5 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors" data-testid="quran-v2-retry-btn">
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Navigation Drawer ───
function NavigationDrawer({ chapters, onNavigate, onClose, currentChapter, visible }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('surah');
  const listRef = useRef(null);

  const filtered = useMemo(() => {
    if (!chapters.length) return [];
    return chapters.filter(ch =>
      !search ||
      ch.name_simple?.toLowerCase().includes(search.toLowerCase()) ||
      ch.name_arabic?.includes(search) ||
      String(ch.id).includes(search)
    );
  }, [chapters, search]);

  // Scroll to current chapter
  useEffect(() => {
    if (visible && tab === 'surah' && listRef.current) {
      const el = listRef.current.querySelector(`[data-surah-id="${currentChapter}"]`);
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [visible, currentChapter, tab]);

  const tabs = [
    { id: 'surah', label: 'Surah', icon: BookOpen },
    { id: 'page', label: 'Page', icon: Hash },
    { id: 'juz', label: 'Juz', icon: Layers },
  ];

  return (
    <div className={`flex flex-col h-full bg-[#FDFBF7] transition-all duration-300 ${visible ? 'w-72 md:w-80' : 'w-0 overflow-hidden'}`}
      data-testid="quran-v2-nav-drawer">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/60">
        <h3 className="text-sm font-semibold text-stone-700 tracking-wide">Navigate</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors" data-testid="close-nav-drawer">
          <X className="w-4 h-4 text-stone-400" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-stone-200/60">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-xs font-medium tracking-wide transition-colors ${tab === t.id ? 'text-emerald-700 border-b-2 border-emerald-600' : 'text-stone-400 hover:text-stone-600'}`}
            data-testid={`nav-tab-${t.id}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      {tab === 'surah' && (
        <div className="px-4 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search surah..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-stone-100 border border-stone-200/80 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
              data-testid="nav-search-input" />
          </div>
        </div>
      )}

      {/* List */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2" data-testid="nav-list">
        {tab === 'surah' && filtered.map(ch => (
          <button key={ch.id} data-surah-id={ch.id}
            onClick={() => onNavigate({ type: 'surah', chapter: ch.id })}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group mb-0.5 ${currentChapter === ch.id ? 'bg-emerald-50 border border-emerald-200/60' : 'hover:bg-stone-50'}`}
            data-testid={`nav-surah-${ch.id}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${currentChapter === ch.id ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-500'}`}>
              {ch.id}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${currentChapter === ch.id ? 'text-emerald-800' : 'text-stone-700 group-hover:text-stone-900'}`}>{ch.name_simple}</p>
              <p className="text-[10px] text-stone-400">{ch.verses_count} ayahs &middot; {ch.revelation_place}</p>
            </div>
            <p className="text-base text-stone-400 group-hover:text-stone-600 flex-shrink-0" style={{ fontFamily: QURAN_FONT }}>{ch.name_arabic}</p>
          </button>
        ))}

        {tab === 'page' && (
          <div className="grid grid-cols-5 gap-1.5 py-2">
            {Array.from({ length: 604 }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => onNavigate({ type: 'page', page: p })}
                className="h-9 rounded-lg text-xs font-medium text-stone-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors bg-stone-50"
                data-testid={`nav-page-${p}`}>
                {p}
              </button>
            ))}
          </div>
        )}

        {tab === 'juz' && (
          <div className="space-y-1 py-2">
            {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
              <button key={j} onClick={() => onNavigate({ type: 'juz', juz: j })}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-50 text-left transition-all"
                data-testid={`nav-juz-${j}`}>
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-[11px] font-bold text-stone-500">{j}</div>
                <p className="text-sm font-medium text-stone-700">Juz {j}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Verse Renderer ───
function VerseWord({ word, verseKey, isTeacher, highlighterActive, isHighlighted, isFocused, onHighlight, onHover, onLeave }) {
  if (word.char_type_name === 'end') {
    return (
      <span className="inline-block mx-1.5 select-none align-middle"
        style={{ color: '#0d9488', fontSize: 'clamp(1rem, 2vw, 1.3rem)', fontFamily: QURAN_FONT }}
        data-testid={`verse-end-${verseKey}`}>
        ﴿{toArabicNum(parseInt(verseKey.split(':')[1]))}﴾
      </span>
    );
  }

  let wordClass = 'text-stone-800 hover:text-emerald-700';
  if (isHighlighted) wordClass = 'bg-rose-100 text-rose-900 rounded-md';
  else if (isFocused) wordClass = 'text-emerald-700 bg-emerald-50 rounded-md';

  return (
    <span
      className={`quran-v2-word inline-block cursor-pointer transition-all duration-150 mx-1 ${wordClass}`}
      style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)', fontFamily: QURAN_FONT }}
      onClick={() => isTeacher && highlighterActive && onHighlight?.(verseKey, word.position)}
      onMouseEnter={() => onHover?.(verseKey, word.position)}
      onMouseLeave={onLeave}
      data-testid={`word-v2-${verseKey}-${word.position}`}>
      {word.text_uthmani || word.text || ''}
    </span>
  );
}

// ─── Main Quran V2 Component ───
function QuranV2Core({
  isTeacher = false,
  highlighterActive = false,
  wordHighlights = {},
  onHighlightWord,
  onClearHighlights,
  onSyncEvent,
  syncState,
}) {
  const [chapters, setChapters] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(syncState?.chapter || 1);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chapterMeta, setChapterMeta] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [focusedVerse, setFocusedVerse] = useState(syncState?.focusedVerse || null);
  const [hoveredWord, setHoveredWord] = useState(null);
  const [showNav, setShowNav] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef(null);
  const verseRefs = useRef({});

  // Apply sync state from teacher (student side)
  useEffect(() => {
    if (!syncState || isTeacher) return;
    if (syncState.action === 'navigate' && syncState.chapter) {
      setCurrentChapter(syncState.chapter);
      if (syncState.page) setCurrentPage(syncState.page);
    }
    if (syncState.action === 'focus' && syncState.verseKey) {
      setFocusedVerse(syncState.verseKey);
      // Scroll to focused verse
      setTimeout(() => {
        const el = verseRefs.current[syncState.verseKey];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
    if (syncState.action === 'unfocus') {
      setFocusedVerse(null);
    }
    if (syncState.action === 'scroll' && syncState.scrollTop != null && contentRef.current) {
      contentRef.current.scrollTop = syncState.scrollTop;
    }
  }, [syncState, isTeacher]);

  // Fetch chapters on mount
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/quran/v2/chapters`);
        if (r.ok) {
          const d = await r.json();
          setChapters(d.chapters || []);
        }
      } catch (e) { console.error('Failed to fetch chapters:', e); }
    })();
  }, []);

  // Fetch verses when chapter/page changes
  const fetchVerses = useCallback(async (chapter, page = 1) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/quran/v2/verses/by_chapter/${chapter}?page=${page}&per_page=50`);
      if (r.ok) {
        const data = await r.json();
        setVerses(data.verses || []);
        setTotalPages(data.pagination?.total_pages || 1);
        setCurrentPage(data.pagination?.current_page || 1);
        const ch = chapters.find(c => c.id === chapter);
        setChapterMeta({
          id: chapter,
          name: ch?.name_simple || `Surah ${chapter}`,
          nameArabic: ch?.name_arabic || '',
          versesCount: data.pagination?.total_records || ch?.verses_count || 0,
          revelationPlace: ch?.revelation_place || '',
        });
      }
    } catch (e) { console.error('Failed to fetch verses:', e); }
    setLoading(false);
  }, [chapters]);

  useEffect(() => {
    if (currentChapter >= 1 && currentChapter <= 114) {
      fetchVerses(currentChapter, 1);
    }
  }, [currentChapter, fetchVerses]);

  // Navigation handlers
  const navigateTo = useCallback((chapter, page = 1) => {
    setCurrentChapter(chapter);
    setFocusedVerse(null);
    if (isTeacher) {
      onSyncEvent?.({ action: 'navigate', chapter, page });
    }
  }, [isTeacher, onSyncEvent]);

  const handleNavAction = useCallback((nav) => {
    if (nav.type === 'surah') navigateTo(nav.chapter);
    else if (nav.type === 'page') {
      // For page nav, use the page endpoint
      // For now, map to chapter (full page-nav needs by_page endpoint)
      navigateTo(Math.min(114, Math.ceil(nav.page / 5.3)));
    } else if (nav.type === 'juz') {
      // Approximate: Juz 1 -> ch1, Juz 30 -> ch78
      const juzToChapter = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,20,21,23,25,27,29,31,34,36,38,46,49,67,78];
      navigateTo(juzToChapter[Math.min(nav.juz, 30)] || 1);
    }
    setShowNav(false);
  }, [navigateTo]);

  const handlePrevChapter = () => { if (currentChapter > 1) navigateTo(currentChapter - 1); };
  const handleNextChapter = () => { if (currentChapter < 114) navigateTo(currentChapter + 1); };

  const handlePageChange = (page) => {
    fetchVerses(currentChapter, page);
    if (isTeacher) onSyncEvent?.({ action: 'navigate', chapter: currentChapter, page });
  };

  // Verse click-to-focus
  const handleVerseFocus = useCallback((verseKey) => {
    const newFocused = focusedVerse === verseKey ? null : verseKey;
    setFocusedVerse(newFocused);
    if (isTeacher) {
      onSyncEvent?.(newFocused ? { action: 'focus', verseKey: newFocused } : { action: 'unfocus' });
    }
  }, [focusedVerse, isTeacher, onSyncEvent]);

  // Teacher scroll sync (throttled)
  const scrollTimerRef = useRef(null);
  const handleScroll = useCallback(() => {
    if (!isTeacher || !contentRef.current) return;
    clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      onSyncEvent?.({ action: 'scroll', scrollTop: contentRef.current?.scrollTop || 0 });
    }, 200);
  }, [isTeacher, onSyncEvent]);

  const handleWordHover = useCallback((vk, pos) => {
    setHoveredWord(`${vk}:${pos}`);
    if (isTeacher) {
      onSyncEvent?.({ action: 'hover', verseKey: vk, wordPos: pos });
    }
  }, [isTeacher, onSyncEvent]);

  return (
    <div className={`h-full w-full max-w-full overflow-x-hidden flex bg-[#FDFBF7] transition-all duration-300 ${expanded ? 'fixed inset-0 z-50' : ''}`}
      data-testid="quran-v2-viewer">

      {/* Navigation Drawer */}
      <NavigationDrawer
        chapters={chapters}
        onNavigate={handleNavAction}
        onClose={() => setShowNav(false)}
        currentChapter={currentChapter}
        visible={showNav}
      />

      {/* Mobile Nav Overlay */}
      {showNav && (
        <div className="md:hidden fixed inset-0 z-40 flex" data-testid="mobile-nav-overlay">
          <div className="w-80 bg-[#FDFBF7] shadow-2xl overflow-hidden">
            <NavigationDrawer chapters={chapters} onNavigate={handleNavAction} onClose={() => setShowNav(false)} currentChapter={currentChapter} visible={true} />
          </div>
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowNav(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Surah Header Bar */}
        <div className="flex-shrink-0 border-b border-stone-200/60 bg-[#FDFBF7]">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
            {/* Left: Nav toggle + Prev */}
            <div className="flex items-center gap-1.5">
              {isTeacher && (
                <button onClick={() => setShowNav(!showNav)}
                  className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-all hidden md:flex"
                  data-testid="toggle-nav-btn">
                  <BookOpen className="w-4.5 h-4.5" />
                </button>
              )}
              <button onClick={() => setShowNav(!showNav)}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-all md:hidden"
                data-testid="toggle-nav-mobile-btn">
                <BookOpen className="w-4.5 h-4.5" />
              </button>
              <button onClick={handlePrevChapter} disabled={currentChapter <= 1}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 disabled:opacity-20 transition-all"
                data-testid="prev-chapter-v2">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Center: Surah title */}
            <div className="text-center min-w-0 px-4">
              <div className="flex items-center justify-center gap-3">
                {chapterMeta?.nameArabic && (
                  <p className="text-lg text-stone-400 hidden sm:block" style={{ fontFamily: QURAN_FONT }}>{chapterMeta.nameArabic}</p>
                )}
                <div>
                  <p className="text-stone-800 text-sm md:text-base font-semibold tracking-wide" data-testid="surah-name-v2">
                    {chapterMeta?.name || `Surah ${currentChapter}`}
                  </p>
                  <p className="text-stone-400 text-[10px] md:text-xs">
                    Surah {currentChapter} &middot; {chapterMeta?.versesCount || ''} Ayahs
                    {chapterMeta?.revelationPlace && ` \u00B7 ${chapterMeta.revelationPlace}`}
                    {totalPages > 1 && ` \u00B7 Page ${currentPage}/${totalPages}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Next + Expand */}
            <div className="flex items-center gap-1.5">
              <button onClick={handleNextChapter} disabled={currentChapter >= 114}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 disabled:opacity-20 transition-all"
                data-testid="next-chapter-v2">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={() => setExpanded(!expanded)}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-all hidden md:flex"
                data-testid="toggle-expand">
                {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Highlighter bar */}
          {isTeacher && highlighterActive && (
            <div className="px-4 py-1.5 bg-rose-50 border-t border-rose-200/60 text-center" data-testid="highlighter-bar-v2">
              <span className="text-[11px] font-medium text-rose-600">Tajweed Highlighter Active — Click any word to highlight</span>
              {onClearHighlights && (
                <button onClick={onClearHighlights} className="ml-3 text-[11px] font-semibold text-rose-500 hover:text-rose-700 underline" data-testid="clear-highlights-v2">Clear All</button>
              )}
            </div>
          )}
        </div>

        {/* Quran Content */}
        <div ref={contentRef} onScroll={handleScroll} className="flex-1 overflow-y-auto" data-testid="quran-v2-content">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-stone-400">Loading verses...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col w-full max-w-4xl mx-auto px-4 md:px-12 py-8 md:py-14">
              {/* Bismillah */}
              {currentChapter !== 9 && currentPage === 1 && (
                <div className="text-center mb-10 md:mb-16" data-testid="bismillah-v2">
                  <p style={{ fontFamily: QURAN_FONT, fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: '#0d9488', lineHeight: '2.2' }} dir="rtl">
                    {BISMILLAH}
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-5">
                    <div className="h-px w-16 bg-gradient-to-r from-transparent to-stone-300" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <div className="h-px w-16 bg-gradient-to-l from-transparent to-stone-300" />
                  </div>
                </div>
              )}

              {/* Verses — Block layout, one ayah per row */}
              <div className="flex flex-col w-full" data-testid="verses-container-v2">
                {verses.map(verse => {
                  const vk = verse.verse_key;
                  const isFocused = focusedVerse === vk;
                  return (
                    <div
                      key={vk}
                      ref={el => { verseRefs.current[vk] = el; }}
                      className={`w-full block py-10 border-b-2 border-gray-200 transition-colors ${isFocused ? 'bg-emerald-50/70' : 'hover:bg-emerald-50/50'}`}
                      onClick={() => { if (!highlighterActive) handleVerseFocus(vk); }}
                      data-testid={`verse-v2-${vk}`}>
                      <div
                        className="block text-right w-full break-words whitespace-normal"
                        dir="rtl"
                        style={{ textRendering: 'optimizeLegibility', lineHeight: '2.5' }}>
                        {(verse.words || []).map(word => (
                          <VerseWord
                            key={`${vk}-w${word.position}`}
                            word={word}
                            verseKey={vk}
                            isTeacher={isTeacher}
                            highlighterActive={highlighterActive}
                            isHighlighted={!!wordHighlights[`${vk}:${word.position}`]}
                            isFocused={isFocused && hoveredWord === `${vk}:${word.position}`}
                            onHighlight={onHighlightWord}
                            onHover={handleWordHover}
                            onLeave={() => setHoveredWord(null)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12 pt-8 border-t border-stone-200/60" data-testid="pagination-v2">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}
                    className="px-4 py-2 rounded-full bg-stone-100 text-stone-500 text-sm font-medium hover:bg-stone-200 disabled:opacity-20 transition-all"
                    data-testid="prev-page-v2">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button key={page} onClick={() => handlePageChange(page)}
                        className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${currentPage === page ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
                        data-testid={`page-btn-${page}`}>
                        {page}
                      </button>
                    );
                  })}
                  {totalPages > 7 && <span className="text-stone-300 text-sm px-1">...</span>}
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}
                    className="px-4 py-2 rounded-full bg-stone-100 text-stone-500 text-sm font-medium hover:bg-stone-200 disabled:opacity-20 transition-all"
                    data-testid="next-page-v2">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Bottom spacer for breathing room */}
              <div className="h-16" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Exported Wrapper with ErrorBoundary ───
export default function QuranV2(props) {
  return (
    <QuranV2ErrorBoundary>
      <QuranV2Core {...props} />
    </QuranV2ErrorBoundary>
  );
}
