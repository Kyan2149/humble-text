import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { BibleData } from '@/lib/bibleUtils';
import { BOOK_ORDER, parseReferences } from '@/lib/bibleUtils';
import type { Note } from '@/lib/storage';

interface Props {
  bible: BibleData;
  notes: Note[];
  onVerseClick: (book: string, chapter: number, verse: number) => void;
  onNoteSelect: (noteId: string) => void;
}

export function GlobalSearchBar({ bible, notes, onVerseClick, onNoteSelect }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const results = useMemo(() => {
    if (q.length < 2) return { bible: [] as any[], notes: [] as Note[] };
    const lower = q.toLowerCase();

    // First, treat as reference: jump shortcut
    const refs = parseReferences(q + ' ');

    const bibleRes: { book: string; chapter: number; verse: number; text: string }[] = [];
    if (refs.length > 0) {
      const r = refs[0];
      const t = bible[r.book]?.[String(r.chapter)]?.[String(r.verseStart)];
      if (t) bibleRes.push({ book: r.book, chapter: r.chapter, verse: r.verseStart, text: t });
    } else if (q.length >= 3) {
      for (const book of BOOK_ORDER) {
        if (!bible[book]) continue;
        for (const [ch, verses] of Object.entries(bible[book])) {
          for (const [v, text] of Object.entries(verses)) {
            if (text.toLowerCase().includes(lower)) {
              bibleRes.push({ book, chapter: Number(ch), verse: Number(v), text });
              if (bibleRes.length >= 8) break;
            }
          }
          if (bibleRes.length >= 8) break;
        }
        if (bibleRes.length >= 8) break;
      }
    }

    const noteRes = notes.filter(n =>
      n.title.toLowerCase().includes(lower) ||
      n.content.toLowerCase().includes(lower)
    ).slice(0, 8);

    return { bible: bibleRes, notes: noteRes };
  }, [q, notes, bible]);

  return (
    <div ref={wrapRef} className="relative flex-1 max-w-md">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search Bible & notes... (try: john 3:16)"
        className="w-full pl-8 pr-8 py-1.5 text-sm rounded-lg bg-muted border border-transparent focus:bg-background focus:border-border focus:ring-2 focus:ring-ring outline-none"
      />
      {q && (
        <button onClick={() => { setQ(''); setOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {open && q.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg max-h-[60vh] overflow-auto z-50">
          {results.bible.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/50">Bible</div>
              {results.bible.map((r, i) => (
                <button key={i} onClick={() => { onVerseClick(r.book, r.chapter, r.verse); setOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-b-0">
                  <div className="text-xs font-semibold text-primary">{r.book} {r.chapter}:{r.verse}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{r.text}</div>
                </button>
              ))}
            </div>
          )}
          {results.notes.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/50">Notes</div>
              {results.notes.map(n => (
                <button key={n.id} onClick={() => { onNoteSelect(n.id); setOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-b-0">
                  <div className="font-medium">{n.title || 'Untitled'}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{n.content.replace(/<[^>]+>/g, ' ').slice(0, 80)}</div>
                </button>
              ))}
            </div>
          )}
          {results.bible.length === 0 && results.notes.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground text-center">No results.</div>
          )}
        </div>
      )}
    </div>
  );
}
