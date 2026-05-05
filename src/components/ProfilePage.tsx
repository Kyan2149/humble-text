import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStreak, pingStreak } from '@/lib/streak';
import { Flame, User, LogIn, LogOut, FileText, Bookmark } from 'lucide-react';
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
