import { useQuery, useQueryClient } from '@tanstack/react-query';

const QURAN_API = 'https://api.quran.com/api/v4';

// Fetch verses by Mushaf page number (1-604)
async function fetchPageVerses(pageNumber) {
  const res = await fetch(
    `${QURAN_API}/verses/by_page/${pageNumber}?language=en&words=false&fields=text_uthmani,verse_key,chapter_id,verse_number&per_page=50`
  );
  if (!res.ok) throw new Error(`Failed to fetch page ${pageNumber}`);
  const data = await res.json();
  return {
    page: pageNumber,
    verses: data.verses || [],
    pagination: data.pagination,
  };
}

// Fetch list of all Surahs
async function fetchSurahs() {
  const res = await fetch(`${QURAN_API}/chapters?language=en`);
  if (!res.ok) throw new Error('Failed to fetch surahs');
  const data = await res.json();
  return data.chapters || [];
}

// Hook: Get verses for a specific Mushaf page
export function useQuranPage(pageNumber) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['quran-page', pageNumber],
    queryFn: () => fetchPageVerses(pageNumber),
    staleTime: Infinity, // Quran text never changes
    gcTime: 1000 * 60 * 60, // Cache 1 hour
    enabled: pageNumber >= 1 && pageNumber <= 604,
  });

  // Pre-fetch next 2 pages in background
  if (pageNumber < 603) {
    queryClient.prefetchQuery({
      queryKey: ['quran-page', pageNumber + 1],
      queryFn: () => fetchPageVerses(pageNumber + 1),
      staleTime: Infinity,
    });
  }
  if (pageNumber < 602) {
    queryClient.prefetchQuery({
      queryKey: ['quran-page', pageNumber + 2],
      queryFn: () => fetchPageVerses(pageNumber + 2),
      staleTime: Infinity,
    });
  }

  return query;
}

// Hook: Get all Surahs
export function useSurahs() {
  return useQuery({
    queryKey: ['quran-surahs'],
    queryFn: fetchSurahs,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

// Utility: Get page number for a specific surah/ayah
// (Approximate mapping — the API returns page_number in verse data)
export function getJuzForPage(page) {
  return Math.ceil(page / 20.13); // ~604 pages / 30 juz
}

export const TOTAL_PAGES = 604;
export const TOTAL_SURAHS = 114;
export const TOTAL_JUZ = 30;
