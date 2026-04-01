import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Loader2 } from 'lucide-react';

const GCS_BASE = 'https://storage.googleapis.com/alif-amin-assets/iqra';
const BOOKS = [1, 2, 3, 4, 5, 6];
const PAGES_PER_BOOK = { 1: 35, 2: 35, 3: 35, 4: 35, 5: 35, 6: 35 };

export default function IqraReader({ isTeacher, onSyncEvent, syncState, onPointerMove, pointerPos }) {
  const [currentBook, setCurrentBook] = useState(syncState?.book || 1);
  const [currentPage, setCurrentPage] = useState(syncState?.page || 1);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [pointerVisible, setPointerVisible] = useState(false);
  const imgContainerRef = useRef(null);
  const pointerTimerRef = useRef(null);

  const maxPages = PAGES_PER_BOOK[currentBook] || 35;

  // Apply sync from teacher (student side)
  useEffect(() => {
    if (!syncState || isTeacher) return;
    if (syncState.book) setCurrentBook(syncState.book);
    if (syncState.page) setCurrentPage(syncState.page);
  }, [syncState, isTeacher]);

  // Show pointer on student side when receiving coords, hide after inactivity
  useEffect(() => {
    if (isTeacher || !pointerPos) return;
    setPointerVisible(true);
    clearTimeout(pointerTimerRef.current);
    pointerTimerRef.current = setTimeout(() => setPointerVisible(false), 2000);
    return () => clearTimeout(pointerTimerRef.current);
  }, [pointerPos, isTeacher]);

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

  // Teacher: emit pointer % coords on mouse move over image container
  const handleMouseMove = useCallback((e) => {
    if (!isTeacher || !imgContainerRef.current) return;
    const rect = imgContainerRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    onPointerMove?.({ x: xPct, y: yPct });
  }, [isTeacher, onPointerMove]);

  const handleMouseLeave = useCallback(() => {
    if (isTeacher) onPointerMove?.(null);
  }, [isTeacher, onPointerMove]);

  const imgSrc = `${GCS_BASE}/book${currentBook}/${currentPage}.png`;

  return (
    <div className="h-full flex flex-col bg-[#FDFBF7] pb-32" data-testid="iqra-reader">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-stone-200/60 bg-[#FDFBF7]">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          <button onClick={() => isTeacher && changePage(currentPage - 1)} disabled={currentPage <= 1 || !isTeacher}
            className={`p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 disabled:opacity-20 transition-all ${!isTeacher ? 'cursor-not-allowed opacity-30' : ''}`}
            data-testid="iqra-prev-page">
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <select
                value={currentBook}
                onChange={(e) => isTeacher && changeBook(Number(e.target.value))}
                disabled={!isTeacher}
                className={`bg-stone-100 border border-stone-200/80 text-sm text-stone-700 font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${isTeacher ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
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

          <button onClick={() => isTeacher && changePage(currentPage + 1)} disabled={currentPage >= maxPages || !isTeacher}
            className={`p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 disabled:opacity-20 transition-all ${!isTeacher ? 'cursor-not-allowed opacity-30' : ''}`}
            data-testid="iqra-next-page">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Viewer with pointer overlay */}
      <div
        ref={imgContainerRef}
        className="relative flex-1 flex items-center justify-center overflow-auto px-4 py-6"
        onMouseMove={isTeacher ? handleMouseMove : undefined}
        onMouseLeave={isTeacher ? handleMouseLeave : undefined}
        data-testid="iqra-image-container">

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

        {/* Laser Pointer (student side only) */}
        {!isTeacher && pointerVisible && pointerPos && (
          <div
            className="absolute w-4 h-4 rounded-full bg-emerald-500/50 pointer-events-none z-20 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pointerPos.x}%`, top: `${pointerPos.y}%` }}
            data-testid="iqra-laser-pointer">
            <div className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />
          </div>
        )}
      </div>
    </div>
  );
}
