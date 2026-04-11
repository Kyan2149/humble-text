import { useState, useMemo } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import type { BibleData } from '@/lib/bibleUtils';
import { BOOK_ORDER } from '@/lib/bibleUtils';
import type { Note } from '@/lib/storage';

interface SearchViewProps {
  bible: BibleData;
  notes: Note[];
  onVerseClick: (book: string, chapter: number, verse: number) => void;
  onNoteSelect: (noteId: string) => void;
}

export function SearchView({ bible, notes, onVerseClick, onNoteSelect }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'bible' | 'notes'>('bible');

  const bibleResults = useMemo(() => {
    if (!query || query.length < 3 || tab !== 'bible') return [];
    const q = query.toLowerCase();
    const results: { book: string; chapter: number; verse: number; text: string }[] = [];
    for (const book of BOOK_ORDER) {
      if (!bible[book]) continue;
      for (const [ch, verses] of Object.entries(bible[book])) {
        for (const [v, text] of Object.entries(verses)) {
          if (text.toLowerCase().includes(q)) {
            results.push({ book, chapter: Number(ch), verse: Number(v), text });
            if (results.length >= 50) return results;
          }
        }
      }
    }
    return results;
  }, [query, bible, tab]);

  const noteResults = useMemo(() => {
    if (!query || query.length < 2 || tab !== 'notes') return [];
    const q = query.toLowerCase();
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [query, notes, tab]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <SearchIcon className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-lg font-semibold">Search</h2>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search Bible text, notes, or tags..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border bg-muted/50 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1">
          {(['bible', 'notes'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {t === 'bible' ? 'Bible' : 'Notes'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {tab === 'bible' && bibleResults.map((r, i) => (
          <button key={i} onClick={() => onVerseClick(r.book, r.chapter, r.verse)}
            className="w-full text-left note-card !p-3">
            <p className="text-xs font-semibold text-primary">{r.book} {r.chapter}:{r.verse}</p>
            <p className="text-sm line-clamp-2 mt-1">{r.text}</p>
          </button>
        ))}
        {tab === 'notes' && noteResults.map(n => (
          <button key={n.id} onClick={() => onNoteSelect(n.id)}
            className="w-full text-left note-card !p-3">
            <p className="text-sm font-semibold">{n.title || 'Untitled'}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{n.content.slice(0, 100)}</p>
          </button>
        ))}
        {query.length >= 2 && tab === 'bible' && bibleResults.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No results found.</p>
        )}
        {query.length >= 2 && tab === 'notes' && noteResults.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No notes found.</p>
        )}
      </div>
    </div>
  );
}
