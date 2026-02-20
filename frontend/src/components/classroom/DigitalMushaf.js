import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Surah metadata (name, verses count, revelation)
const SURAH_NAMES = [
  '', 'Al-Fatihah', 'Al-Baqarah', 'Ali Imran', 'An-Nisa', 'Al-Ma\'idah', 'Al-An\'am',
  'Al-A\'raf', 'Al-Anfal', 'At-Tawbah', 'Yunus', 'Hud', 'Yusuf', 'Ar-Ra\'d',
  'Ibrahim', 'Al-Hijr', 'An-Nahl', 'Al-Isra', 'Al-Kahf', 'Maryam', 'Ta-Ha',
  'Al-Anbiya', 'Al-Hajj', 'Al-Mu\'minun', 'An-Nur', 'Al-Furqan', 'Ash-Shu\'ara',
  'An-Naml', 'Al-Qasas', 'Al-Ankabut', 'Ar-Rum', 'Luqman', 'As-Sajdah',
  'Al-Ahzab', 'Saba', 'Fatir', 'Ya-Sin', 'As-Saffat', 'Sad', 'Az-Zumar',
  'Ghafir', 'Fussilat', 'Ash-Shura', 'Az-Zukhruf', 'Ad-Dukhan', 'Al-Jathiyah',
  'Al-Ahqaf', 'Muhammad', 'Al-Fath', 'Al-Hujurat', 'Qaf', 'Adh-Dhariyat',
  'At-Tur', 'An-Najm', 'Al-Qamar', 'Ar-Rahman', 'Al-Waqi\'ah', 'Al-Hadid',
  'Al-Mujadila', 'Al-Hashr', 'Al-Mumtahina', 'As-Saff', 'Al-Jumu\'ah',
  'Al-Munafiqun', 'At-Taghabun', 'At-Talaq', 'At-Tahrim', 'Al-Mulk',
  'Al-Qalam', 'Al-Haqqah', 'Al-Ma\'arij', 'Nuh', 'Al-Jinn', 'Al-Muzzammil',
  'Al-Muddathir', 'Al-Qiyamah', 'Al-Insan', 'Al-Mursalat', 'An-Naba',
  'An-Nazi\'at', 'Abasa', 'At-Takwir', 'Al-Infitar', 'Al-Mutaffifin',
  'Al-Inshiqaq', 'Al-Buruj', 'At-Tariq', 'Al-A\'la', 'Al-Ghashiyah',
  'Al-Fajr', 'Al-Balad', 'Ash-Shams', 'Al-Layl', 'Ad-Duha', 'Ash-Sharh',
  'At-Tin', 'Al-Alaq', 'Al-Qadr', 'Al-Bayyinah', 'Az-Zalzalah',
  'Al-Adiyat', 'Al-Qari\'ah', 'At-Takathur', 'Al-Asr', 'Al-Humazah',
  'Al-Fil', 'Quraysh', 'Al-Ma\'un', 'Al-Kawthar', 'Al-Kafirun',
  'An-Nasr', 'Al-Masad', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas',
];

// Bismillah text
const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';

// Arabic numeral converter
function toArabicNum(n) {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(n).replace(/\d/g, d => digits[d]);
}

export default function DigitalMushaf({
  currentChapter = 1,
  onChapterChange,
  isTeacher,
  highlighterActive,
  wordHighlights = {},
  onHighlightWord,
  pointerPosition,
  onPointerMove,
}) {
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chapterMeta, setChapterMeta] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredWord, setHoveredWord] = useState(null);
  const contentRef = useRef(null);

  // Fetch verses from backend proxy
  const fetchVerses = useCallback(async (chapter, page = 1) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/quran/verses/${chapter}?page=${page}&per_page=50`);
      if (r.ok) {
        const data = await r.json();
        setVerses(data.verses || []);
        setTotalPages(data.pagination?.total_pages || 1);
        setCurrentPage(data.pagination?.current_page || 1);
        setChapterMeta({
          id: chapter,
          name: SURAH_NAMES[chapter] || `Surah ${chapter}`,
          versesCount: data.pagination?.total_records || 0,
        });
      }
    } catch (e) {
      console.error('Failed to fetch verses:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (currentChapter >= 1 && currentChapter <= 114) {
      fetchVerses(currentChapter, 1);
    }
  }, [currentChapter, fetchVerses]);

  const handlePrevChapter = () => {
    if (currentChapter > 1) onChapterChange?.(currentChapter - 1);
  };
  const handleNextChapter = () => {
    if (currentChapter < 114) onChapterChange?.(currentChapter + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) fetchVerses(currentChapter, currentPage - 1);
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) fetchVerses(currentChapter, currentPage + 1);
  };

  const handleWordClick = (verseKey, wordPos) => {
    if (isTeacher && highlighterActive) {
      onHighlightWord?.(verseKey, wordPos);
    }
  };

  const isWordHighlighted = (verseKey, wordPos) => {
    const key = `${verseKey}:${wordPos}`;
    return !!wordHighlights[key];
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 overflow-hidden" data-testid="digital-mushaf">
      {/* Surah Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/5 bg-slate-800/50">
        <button
          onClick={handlePrevChapter}
          disabled={currentChapter <= 1}
          className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/80 disabled:opacity-20 transition-all"
          data-testid="prev-chapter-btn"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center min-w-0">
          <p className="text-white text-sm md:text-base font-semibold" data-testid="surah-name">
            {chapterMeta?.name || `Surah ${currentChapter}`}
          </p>
          <p className="text-white/30 text-[10px] md:text-xs">
            Surah {currentChapter} &middot; {chapterMeta?.versesCount || ''} Verses
            {totalPages > 1 && ` · Page ${currentPage}/${totalPages}`}
          </p>
        </div>

        <button
          onClick={handleNextChapter}
          disabled={currentChapter >= 114}
          className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/80 disabled:opacity-20 transition-all"
          data-testid="next-chapter-btn"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Highlighter Active Indicator */}
      {isTeacher && highlighterActive && (
        <div className="flex-shrink-0 px-4 py-1.5 bg-rose-500/10 border-b border-rose-500/20 text-center" data-testid="highlighter-active-bar">
          <span className="text-[11px] font-medium text-rose-400">Tajweed Highlighter Active — Click any word to highlight</span>
        </div>
      )}

      {/* Main Mushaf Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto" data-testid="mushaf-content">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
            {/* Bismillah (show for all chapters except At-Tawbah) */}
            {currentChapter !== 9 && currentPage === 1 && (
              <div className="text-center mb-8 md:mb-12" data-testid="bismillah">
                <p
                  className="text-2xl md:text-3xl text-emerald-400/80 leading-loose"
                  style={{ fontFamily: "'KFGQPC Uthmanic Script HAFS', 'Amiri', serif" }}
                  dir="rtl"
                >
                  {BISMILLAH}
                </p>
                <div className="w-32 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent mx-auto mt-4" />
              </div>
            )}

            {/* Verses with Word-Level Rendering */}
            <div
              dir="rtl"
              className="text-right leading-[3.5rem] md:leading-[4.5rem]"
              style={{ fontFamily: "'KFGQPC Uthmanic Script HAFS', 'Amiri', serif" }}
              data-testid="verses-container"
            >
              {verses.map((verse) => (
                <span key={verse.verse_key} className="inline" data-testid={`verse-${verse.verse_key}`}>
                  {(verse.words || []).map((word) => {
                    if (word.char_type_name === 'end') {
                      // Verse number marker
                      return (
                        <span
                          key={`${verse.verse_key}-end`}
                          className="inline-flex items-center justify-center mx-1 text-emerald-500/60 text-lg md:text-xl select-none"
                          data-verse-key={verse.verse_key}
                          data-word-type="end"
                          data-testid={`verse-end-${verse.verse_key}`}
                        >
                          ﴿{toArabicNum(verse.verse_number)}﴾
                        </span>
                      );
                    }
                    const highlighted = isWordHighlighted(verse.verse_key, word.position);
                    const isHovered = hoveredWord === `${verse.verse_key}:${word.position}`;
                    return (
                      <span
                        key={`${verse.verse_key}-w${word.position}`}
                        className={`
                          quran-word inline cursor-pointer transition-colors duration-150 px-0.5
                          text-3xl md:text-4xl lg:text-5xl
                          ${highlighted
                            ? 'bg-rose-200/90 text-rose-900 rounded-lg'
                            : isHovered && isTeacher && highlighterActive
                              ? 'text-emerald-400'
                              : 'text-white/90'
                          }
                        `}
                        data-verse-key={verse.verse_key}
                        data-word-position={word.position}
                        data-testid={`word-${verse.verse_key}-${word.position}`}
                        onClick={() => handleWordClick(verse.verse_key, word.position)}
                        onMouseEnter={() => isTeacher && highlighterActive && setHoveredWord(`${verse.verse_key}:${word.position}`)}
                        onMouseLeave={() => setHoveredWord(null)}
                      >
                        {word.text_uthmani || word.text || ''}
                      </span>
                    );
                  })}
                  {/* Small gap between verses */}
                  <span className="inline-block w-2" />
                </span>
              ))}
            </div>

            {/* Pagination within chapter */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-white/5">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10 disabled:opacity-20 transition-all"
                  data-testid="prev-page-btn"
                >
                  Previous
                </button>
                <span className="text-xs text-white/30">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10 disabled:opacity-20 transition-all"
                  data-testid="next-page-btn"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
