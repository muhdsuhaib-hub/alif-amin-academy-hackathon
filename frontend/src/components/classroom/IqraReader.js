import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Loader2 } from 'lucide-react';

const GCS_BASE = 'https://storage.googleapis.com/alif-amin-assets/iqra';
const BOOKS = [1, 2, 3, 4, 5, 6];
const PAGES_PER_BOOK = { 1: 35, 2: 35, 3: 35, 4: 35, 5: 35, 6: 35 };

export default function IqraReader({ isTeacher, onSyncEvent, syncState }) {
  const [currentBook, setCurrentBook] = useState(syncState?.book || 1);
  const [currentPage, setCurrentPage] = useState(syncState?.page || 1);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  const maxPages = PAGES_PER_BOOK[currentBook] || 35;

  // Apply sync from teacher (student side)
  useEffect(() => {
    if (!syncState || isTeacher) return;
    if (syncState.book) setCurrentBook(syncState.book);
    if (syncState.page) setCurrentPage(syncState.page);
  }, [syncState, isTeacher]);

  const emitSync = useCallback((book, page) => {
    if (isTeacher && onSyncEvent) {
      onSyncEvent({ book, page });
    }
  }, [isTeacher, onSyncEvent]);

  const changeBook = useCallback((book) => {
    setCurrentBook(book);
    setCurrentPage(1);
    setImgLoading(true);
    setImgError(false);
    emitSync(book, 1);
  }, [emitSync]);

  const changePage = useCallback((page) => {
    if (page < 1 || page > maxPages) return;
    setCurrentPage(page);
    setImgLoading(true);
    setImgError(false);
    emitSync(currentBook, page);
  }, [currentBook, maxPages, emitSync]);

  const imgSrc = `${GCS_BASE}/book${currentBook}/${currentPage}.png`;

  return (
    <div className="h-full flex flex-col bg-[#FDFBF7] pb-32" data-testid="iqra-reader">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-stone-200/60 bg-[#FDFBF7]">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          {/* Left: Prev */}
          <button onClick={() => changePage(currentPage - 1)} disabled={currentPage <= 1}
            className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 disabled:opacity-20 transition-all"
            data-testid="iqra-prev-page">
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Center: Book selector + page info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <select
                value={currentBook}
                onChange={(e) => changeBook(Number(e.target.value))}
                className="bg-stone-100 border border-stone-200/80 text-sm text-stone-700 font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                data-testid="iqra-book-select">
                {BOOKS.map(b => (
                  <option key={b} value={b}>Iqra Book {b}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-stone-400 tabular-nums" data-testid="iqra-page-info">
              Page {currentPage} / {maxPages}
            </span>
          </div>

          {/* Right: Next */}
          <button onClick={() => changePage(currentPage + 1)} disabled={currentPage >= maxPages}
            className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 disabled:opacity-20 transition-all"
            data-testid="iqra-next-page">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Viewer */}
      <div className="flex-1 flex items-center justify-center overflow-auto px-4 py-6">
        {imgLoading && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        )}
        {imgError ? (
          <div className="text-center px-8 py-12" data-testid="iqra-error">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Page not available</h3>
            <p className="text-sm text-slate-500 mb-4">Book {currentBook}, Page {currentPage} could not be loaded.</p>
            <button onClick={() => { setImgError(false); setImgLoading(true); }}
              className="px-5 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
              data-testid="iqra-retry-btn">
              Retry
            </button>
          </div>
        ) : (
          <img
            key={imgSrc}
            src={imgSrc}
            alt={`Iqra Book ${currentBook} - Page ${currentPage}`}
            className="object-contain w-full max-h-[75vh] rounded-lg select-none"
            onLoad={() => setImgLoading(false)}
            onError={() => { setImgLoading(false); setImgError(true); }}
            draggable={false}
            data-testid="iqra-page-image"
          />
        )}
      </div>
    </div>
  );
}
