import { Sparkles, Bookmark, FilePlus } from 'lucide-react';
import { useMemo } from 'react';
import type { BibleData } from '@/lib/bibleUtils';
import { getVerseOfDay } from '@/lib/votd';
import { getVerseKey } from '@/lib/bibleUtils';

interface Props {
  bible: BibleData;
  onSave: (verseKey: string) => void;
  onInsertToNote: (text: string, ref: string) => void;
  onOpen: (book: string, chapter: number, verse: number) => void;
}

export function VerseOfDay({ bible, onSave, onInsertToNote, onOpen }: Props) {
  const v = useMemo(() => getVerseOfDay(bible), [bible]);
  const refStr = `${v.book} ${v.chapter}:${v.verse}`;
  const key = getVerseKey(v.book, v.chapter, v.verse);

  return (
    <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-accent/5 p-5 space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="w-4 h-4" />
        <h3 className="font-serif font-semibold">Verse of the Day</h3>
      </div>
      <button onClick={() => onOpen(v.book, v.chapter, v.verse)} className="block text-left w-full group">
        <p className="font-serif text-lg leading-relaxed group-hover:text-primary transition-colors">
          "{v.text}"
        </p>
        <p className="text-xs font-medium text-primary mt-2">— {refStr}</p>
      </button>
      <div className="flex gap-2 pt-2">
        <button onClick={() => onSave(key)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-background border text-xs hover:bg-muted">
          <Bookmark className="w-3.5 h-3.5" /> Save
        </button>
        <button onClick={() => onInsertToNote(v.text, refStr)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:bg-primary/90">
          <FilePlus className="w-3.5 h-3.5" /> Insert to Note
        </button>
      </div>
    </div>
  );
}
