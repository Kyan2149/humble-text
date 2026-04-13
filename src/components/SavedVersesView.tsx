import { Bookmark, Palette, X } from 'lucide-react';
import type { Highlight } from '@/hooks/useCloudNotes';
import { cn } from '@/lib/utils';

const COLORS = ['yellow', 'green', 'blue', 'pink', 'orange', 'purple'];
const COLOR_MAP: Record<string, string> = {
  yellow: 'bg-yellow-200/60 dark:bg-yellow-900/40',
  green: 'bg-green-200/60 dark:bg-green-900/40',
  blue: 'bg-blue-200/60 dark:bg-blue-900/40',
  pink: 'bg-pink-200/60 dark:bg-pink-900/40',
  orange: 'bg-orange-200/60 dark:bg-orange-900/40',
  purple: 'bg-purple-200/60 dark:bg-purple-900/40',
};

interface SavedVersesViewProps {
  highlights: Highlight[];
  onVerseClick: (verseKey: string) => void;
  onRemove: (verseKey: string) => void;
  onColorChange: (verseKey: string, color: string) => void;
}

function parseVerseKey(key: string): { display: string; book: string; chapter: number; verse: number } {
  const parts = key.split('-');
  const verse = parseInt(parts.pop()!, 10);
  const chapter = parseInt(parts.pop()!, 10);
  const book = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  return { display: `${book} ${chapter}:${verse}`, book, chapter, verse };
}

export function SavedVersesView({ highlights, onVerseClick, onRemove, onColorChange }: SavedVersesViewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3 flex items-center gap-2">
        <Bookmark className="w-5 h-5 text-primary" />
        <h2 className="font-serif text-lg font-semibold">Saved Verses</h2>
        <span className="text-xs text-muted-foreground ml-auto">{highlights.length}</span>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {highlights.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No saved verses yet. Highlight verses in the reader!</p>
          </div>
        ) : highlights.map(h => {
          const parsed = parseVerseKey(h.verse_key);
          return (
            <div key={h.verse_key} className={cn("rounded-lg border p-3 transition-all", COLOR_MAP[h.color] || COLOR_MAP.yellow)}>
              <div className="flex items-center justify-between">
                <button onClick={() => onVerseClick(h.verse_key)}
                  className="font-serif font-semibold text-sm hover:text-primary transition-colors">
                  {parsed.display}
                </button>
                <div className="flex items-center gap-1">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => onColorChange(h.verse_key, c)}
                      className={cn("w-4 h-4 rounded-full border-2 transition-transform",
                        c === h.color ? 'scale-125 border-foreground' : 'border-transparent hover:scale-110',
                        c === 'yellow' && 'bg-yellow-400',
                        c === 'green' && 'bg-green-400',
                        c === 'blue' && 'bg-blue-400',
                        c === 'pink' && 'bg-pink-400',
                        c === 'orange' && 'bg-orange-400',
                        c === 'purple' && 'bg-purple-400',
                      )} />
                  ))}
                  <button onClick={() => onRemove(h.verse_key)} className="ml-1 text-muted-foreground hover:text-destructive">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { COLOR_MAP, COLORS };
