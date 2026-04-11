import { useState, useMemo } from 'react';
import { BOOK_ORDER, getVerseKey } from '@/lib/bibleUtils';
import type { BibleData } from '@/lib/bibleUtils';
import type { Note } from '@/lib/storage';
import { ChevronDown, BookOpen, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BibleReaderProps {
  bible: BibleData;
  selectedBook: string;
  selectedChapter: number;
  onSelectBook: (book: string) => void;
  onSelectChapter: (ch: number) => void;
  verseIndex: Record<string, string[]>;
  notes: Note[];
  onVerseClick: (book: string, chapter: number, verse: number) => void;
  activeVerse: string | null;
}

export function BibleReader({
  bible, selectedBook, selectedChapter, onSelectBook, onSelectChapter,
  verseIndex, notes, onVerseClick, activeVerse
}: BibleReaderProps) {
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);

  const chapters = bible[selectedBook] ? Object.keys(bible[selectedBook]).map(Number).sort((a, b) => a - b) : [];
  const verses = bible[selectedBook]?.[String(selectedChapter)] || {};
  const sortedVerses = Object.keys(verses).map(Number).sort((a, b) => a - b);

  const otBooks = BOOK_ORDER.slice(0, 39);
  const ntBooks = BOOK_ORDER.slice(39);

  if (showBookPicker) {
    return (
      <div className="flex-1 overflow-auto animate-fade-in">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-4 border-b">
          <button onClick={() => setShowBookPicker(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to reading
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-serif text-lg font-semibold mb-3 text-muted-foreground">Old Testament</h3>
            <div className="space-y-0.5">
              {otBooks.filter(b => bible[b]).map(book => (
                <button key={book} onClick={() => { onSelectBook(book); onSelectChapter(1); setShowBookPicker(false); }}
                  className={cn("w-full text-left px-3 py-1.5 rounded text-sm hover:bg-muted transition-colors",
                    selectedBook === book && "bg-primary/10 text-primary font-medium"
                  )}>
                  {book}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold mb-3 text-muted-foreground">New Testament</h3>
            <div className="space-y-0.5">
              {ntBooks.filter(b => bible[b]).map(book => (
                <button key={book} onClick={() => { onSelectBook(book); onSelectChapter(1); setShowBookPicker(false); }}
                  className={cn("w-full text-left px-3 py-1.5 rounded text-sm hover:bg-muted transition-colors",
                    selectedBook === book && "bg-primary/10 text-primary font-medium"
                  )}>
                  {book}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showChapterPicker) {
    return (
      <div className="flex-1 overflow-auto animate-fade-in">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-4 border-b">
          <button onClick={() => setShowChapterPicker(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to reading
          </button>
          <h2 className="font-serif text-xl font-semibold mt-2">{selectedBook}</h2>
        </div>
        <div className="p-4 grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {chapters.map(ch => (
            <button key={ch} onClick={() => { onSelectChapter(ch); setShowChapterPicker(false); }}
              className={cn("aspect-square flex items-center justify-center rounded-lg text-sm font-medium hover:bg-muted transition-colors border",
                selectedChapter === ch ? "bg-primary text-primary-foreground border-primary" : "border-border"
              )}>
              {ch}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b px-4 py-3 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <button onClick={() => setShowBookPicker(true)} className="font-serif text-lg font-semibold hover:text-primary transition-colors flex items-center gap-1">
          {selectedBook} <ChevronDown className="w-4 h-4" />
        </button>
        <button onClick={() => setShowChapterPicker(true)} className="font-serif text-lg hover:text-primary transition-colors flex items-center gap-1">
          {selectedChapter} <ChevronDown className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        {/* Chapter nav */}
        <div className="flex gap-1">
          <button disabled={selectedChapter <= 1} onClick={() => onSelectChapter(selectedChapter - 1)}
            className="px-2 py-1 text-xs rounded border hover:bg-muted disabled:opacity-30 transition-colors">Prev</button>
          <button disabled={selectedChapter >= chapters[chapters.length - 1]} onClick={() => onSelectChapter(selectedChapter + 1)}
            className="px-2 py-1 text-xs rounded border hover:bg-muted disabled:opacity-30 transition-colors">Next</button>
        </div>
      </div>

      {/* Verses */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="max-w-2xl mx-auto">
          {sortedVerses.map(v => {
            const key = getVerseKey(selectedBook, selectedChapter, v);
            const refCount = verseIndex[key]?.length || 0;
            const isActive = activeVerse === key;
            return (
              <span
                key={v}
                onClick={() => onVerseClick(selectedBook, selectedChapter, v)}
                className={cn("verse-clickable inline", isActive && "verse-active")}
              >
                <sup className="verse-number">{v}</sup>
                <span className="verse-text">{verses[String(v)]}</span>
                {refCount > 0 && (
                  <span className="inline-flex items-center ml-1 px-1.5 py-0 text-[10px] rounded-full bg-primary/15 text-primary font-sans font-semibold">
                    {refCount}
                  </span>
                )}
                {' '}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
