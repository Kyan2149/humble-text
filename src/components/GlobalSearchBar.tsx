import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import type { BibleData } from '@/lib/bibleUtils';
import { BOOK_ORDER, parseReferences } from '@/lib/bibleUtils';
import type { Note } from '@/lib/storage';
import { expandQuery, scoreText } from '@/lib/themes';

interface Props {
  bible: BibleData;
  notes: Note[];
  onVerseClick: (book: string, chapter: number, verse: number) => void;
  onNoteSelect: (noteId: string) => void;
}

interface BibleHit {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  score: number;
}

const HARD_CAP = 500;

export function GlobalSearchBar({ bible, notes, onVerseClick, onNoteSelect }: Props) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [smart, setSmart] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 180);
    return () => clearTimeout(t);
  }, [q]);

  const results = useMemo(() => {
    if (debounced.length < 2) return { bible: [] as BibleHit[], notes: [] as Note[], terms: [] as string[] };
    const original = debounced.toLowerCase().trim();
    const terms = smart ? expandQuery(original) : [original];

    const refs = parseReferences(debounced + ' ');
    const bibleRes: BibleHit[] = [];
    if (refs.length > 0) {
      const r = refs[0];
      const t = bible[r.book]?.[String(r.chapter)]?.[String(r.verseStart)];
      if (t) bibleRes.push({ book: r.book, chapter: r.chapter, verse: r.verseStart, text: t, score: 1000 });
    }

    if (debounced.length >= 3) {
      outer: for (const book of BOOK_ORDER) {
        if (!bible[book]) continue;
        for (const [ch, verses] of Object.entries(bible[book])) {
          for (const [v, text] of Object.entries(verses)) {
            const lower = text.toLowerCase();
            let matched = false;
            for (const t of terms) {
              if (t && lower.includes(t)) { matched = true; break; }
            }
            if (matched) {
              const score = scoreText(text, terms, original);
              bibleRes.push({ book, chapter: Number(ch), verse: Number(v), text, score });
              if (bibleRes.length >= HARD_CAP) break outer;
            }
          }
        }
      }
    }
    bibleRes.sort((a, b) => b.score - a.score);

    const noteRes = notes
      .map(n => {
        const blob = (n.title + ' ' + n.content).toLowerCase();
        let s = 0;
        for (const t of terms) if (t && blob.includes(t)) s += t === original ? 5 : 1;
        return { n, s };
      })
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map(x => x.n);

    return { bible: bibleRes, notes: noteRes, terms };
  }, [debounced, notes, bible, smart]);

  const highlight = (text: string) => {
    if (!results.terms.length) return text;
    const sorted = [...results.terms].filter(Boolean).sort((a, b) => b.length - a.length);
    if (!sorted.length) return text;
    const escaped = sorted.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const re = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(re);
    return parts.map((p, i) =>
      sorted.some(s => s.toLowerCase() === p.toLowerCase())
        ? <mark key={i} className="bg-primary/20 text-foreground rounded px-0.5">{p}</mark>
        : <span key={i}>{p}</span>
    );
  };

  return (
    <div ref={wrapRef} className="relative flex-1 max-w-md">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search Bible & notes... (try: love, john 3:16)"
        className="w-full pl-8 pr-16 py-1.5 text-sm rounded-lg bg-muted border border-transparent focus:bg-background focus:border-border focus:ring-2 focus:ring-ring outline-none"
      />
      <button
        onClick={() => setSmart(s => !s)}
        title={smart ? 'Smart search ON (related themes)' : 'Smart search OFF (exact match)'}
        className={`absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${smart ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <Sparkles className="w-3.5 h-3.5" />
      </button>
      {q && (
        <button onClick={() => { setQ(''); setOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {open && debounced.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg max-h-[70vh] flex flex-col z-50 overflow-hidden">
          {smart && results.terms.length > 1 && (
            <div className="px-3 py-1.5 text-[10px] text-muted-foreground bg-muted/40 border-b flex flex-wrap gap-1 items-center shrink-0">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="font-semibold">Related:</span>
              {results.terms.slice(0, 10).filter(t => t !== debounced.toLowerCase().trim()).map(t => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-background border">{t}</span>
              ))}
            </div>
          )}
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {results.bible.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/80 backdrop-blur sticky top-0 z-10 flex justify-between">
                  <span>Bible</span>
                  <span>{results.bible.length}{results.bible.length >= HARD_CAP ? '+' : ''} results</span>
                </div>
                {results.bible.map((r, i) => (
                  <button key={i} onClick={() => { onVerseClick(r.book, r.chapter, r.verse); setOpen(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-b-0">
                    <div className="text-xs font-semibold text-primary">{r.book} {r.chapter}:{r.verse}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{highlight(r.text)}</div>
                  </button>
                ))}
              </div>
            )}
            {results.notes.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/80 backdrop-blur sticky top-0 z-10 flex justify-between">
                  <span>Notes</span>
                  <span>{results.notes.length} results</span>
                </div>
                {results.notes.map(n => (
                  <button key={n.id} onClick={() => { onNoteSelect(n.id); setOpen(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-b-0">
                    <div className="font-medium">{highlight(n.title || 'Untitled')}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{highlight(n.content.replace(/<[^>]+>/g, ' ').slice(0, 160))}</div>
                  </button>
                ))}
              </div>
            )}
            {results.bible.length === 0 && results.notes.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">No results.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
