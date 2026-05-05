// Verse of the Day — deterministic by day-of-year from a curated list
import type { BibleData } from './bibleUtils';

const POOL: { book: string; chapter: number; verse: number }[] = [
  { book: 'John', chapter: 3, verse: 16 },
  { book: 'Psalms', chapter: 23, verse: 1 },
  { book: 'Philippians', chapter: 4, verse: 13 },
  { book: 'Romans', chapter: 8, verse: 28 },
  { book: 'Jeremiah', chapter: 29, verse: 11 },
  { book: 'Proverbs', chapter: 3, verse: 5 },
  { book: 'Isaiah', chapter: 41, verse: 10 },
  { book: 'Matthew', chapter: 6, verse: 33 },
  { book: 'Joshua', chapter: 1, verse: 9 },
  { book: 'Psalms', chapter: 46, verse: 10 },
  { book: 'Romans', chapter: 12, verse: 2 },
  { book: 'Galatians', chapter: 5, verse: 22 },
  { book: 'Hebrews', chapter: 11, verse: 1 },
  { book: 'James', chapter: 1, verse: 5 },
  { book: '1 Corinthians', chapter: 13, verse: 4 },
  { book: 'Ephesians', chapter: 2, verse: 8 },
  { book: '2 Timothy', chapter: 1, verse: 7 },
  { book: 'Matthew', chapter: 11, verse: 28 },
  { book: 'John', chapter: 14, verse: 6 },
  { book: 'Psalms', chapter: 119, verse: 105 },
  { book: 'Proverbs', chapter: 16, verse: 3 },
  { book: 'Romans', chapter: 5, verse: 8 },
  { book: 'Isaiah', chapter: 40, verse: 31 },
  { book: '1 John', chapter: 4, verse: 19 },
  { book: 'Matthew', chapter: 5, verse: 16 },
  { book: 'Psalms', chapter: 27, verse: 1 },
  { book: 'Romans', chapter: 10, verse: 9 },
  { book: 'Philippians', chapter: 4, verse: 6 },
  { book: 'Colossians', chapter: 3, verse: 23 },
  { book: 'Hebrews', chapter: 12, verse: 2 },
];

export function getVerseOfDay(bible: BibleData) {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const day = Math.floor((today.getTime() - start.getTime()) / 86400000);
  const ref = POOL[day % POOL.length];
  const text = bible[ref.book]?.[String(ref.chapter)]?.[String(ref.verse)] ?? '';
  return { ...ref, text };
}
