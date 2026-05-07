import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStreak, pingStreak } from '@/lib/streak';
import { Flame, User, LogIn, LogOut, FileText, Bookmark, GraduationCap, ChevronDown, ChevronRight } from 'lucide-react';
import { VerseOfDay } from './VerseOfDay';
import type { BibleData } from '@/lib/bibleUtils';

interface Props {
  bible: BibleData;
  noteCount: number;
  highlightCount: number;
  onLoginClick: () => void;
  onSaveVotd: (verseKey: string) => void;
  onInsertVotd: (text: string, ref: string) => void;
  onOpenVerse: (book: string, chapter: number, verse: number) => void;
}

export function ProfilePage({ bible, noteCount, highlightCount, onLoginClick, onSaveVotd, onInsertVotd, onOpenVerse }: Props) {
  const { user, isGuest, signOut } = useAuth();
  const [streak, setStreak] = useState(getStreak());

  useEffect(() => {
    setStreak(pingStreak());
  }, []);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 p-5 rounded-xl border bg-card">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-2xl font-semibold truncate">
              {isGuest ? 'Guest Mode' : (user?.email || 'Account')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isGuest ? 'Your data is saved locally on this device.' : 'Synced across devices.'}
            </p>
          </div>
          {isGuest ? (
            <button onClick={onLoginClick} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
              <LogIn className="w-4 h-4" /> Sign In
            </button>
          ) : (
            <button onClick={signOut} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat icon={Flame} label="Day Streak" value={streak.count} accent />
          <Stat icon={FileText} label="Notes" value={noteCount} />
          <Stat icon={Bookmark} label="Saved" value={highlightCount} />
        </div>

        <VerseOfDay bible={bible} onSave={onSaveVotd} onInsertToNote={onInsertVotd} onOpen={onOpenVerse} />

        <Tutorial />
      </div>
    </div>
  );
}

const TUTORIAL_SECTIONS: { title: string; items: string[] }[] = [
  {
    title: 'Writing notes',
    items: [
      'Type "/" at the start of a line to turn it into a heading.',
      'Press Enter to cycle: Heading → Subheading → Content.',
      'Press Enter twice on an empty line to jump up a level.',
      'Use Shift + Enter to add a line break without changing style.',
      'Type "." at the start of a line to start a bullet list.',
    ],
  },
  {
    title: 'Bible references',
    items: [
      'Type a lowercase reference like "mat 5:5" to insert the verse text inline.',
      'Type a capitalized reference like "Mat 5:5" to insert a clickable pill.',
      'Click any reference pill to jump to it in the Bible reader.',
    ],
  },
  {
    title: 'Folders & organization',
    items: [
      'Open the Folders panel from the Notes view to create folders.',
      'Folders can be nested — create folders inside folders.',
      'Move a note into a folder using the move button on each note.',
      'Import notes from Apple Notes or any folder — hierarchy is preserved.',
    ],
  },
  {
    title: 'Highlights & saved verses',
    items: [
      'Click a verse in the Bible reader to highlight or save it.',
      'Pick from 6 colors to organize highlights by theme.',
      'View all saved verses in the "Saved" tab.',
    ],
  },
  {
    title: 'Search & graph',
    items: [
      'Use the global search bar to search verses and notes together.',
      'Toggle Smart Search to find related themes (not just exact words).',
      'Open the Graph view to see how your notes and verses connect.',
    ],
  },
];

function Tutorial() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b">
        <GraduationCap className="w-5 h-5 text-primary" />
        <h2 className="font-serif text-lg font-semibold">Tutorial</h2>
      </div>
      <div className="divide-y">
        {TUTORIAL_SECTIONS.map((s, i) => {
          const isOpen = open === i;
          return (
            <div key={s.title}>
              <button onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                <span className="font-medium text-sm">{s.title}</span>
              </button>
              {isOpen && (
                <ul className="px-4 pb-4 pl-11 space-y-1.5 text-sm text-muted-foreground list-disc">
                  {s.items.map(it => <li key={it}>{it}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: typeof Flame; label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-4 text-center">
      <Icon className={`w-5 h-5 mx-auto mb-1 ${accent ? 'text-orange-500' : 'text-primary'}`} />
      <p className="text-2xl font-serif font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
