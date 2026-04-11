import { Note } from '@/lib/storage';
import type { BibleData } from '@/lib/bibleUtils';
import { getVerseKey } from '@/lib/bibleUtils';
import { X, LinkIcon, FileText } from 'lucide-react';

interface RightPanelProps {
  bible: BibleData;
  activeVerse: string | null;
  selectedBook: string;
  selectedChapter: number;
  selectedVerseNum: number | null;
  verseIndex: Record<string, string[]>;
  notes: Note[];
  onNoteClick: (noteId: string) => void;
  onClose: () => void;
}

export function RightPanel({ bible, activeVerse, selectedBook, selectedChapter, selectedVerseNum, verseIndex, notes, onNoteClick, onClose }: RightPanelProps) {
  if (!activeVerse || !selectedVerseNum) return null;

  const verseText = bible[selectedBook]?.[String(selectedChapter)]?.[String(selectedVerseNum)] || '';
  const noteIds = verseIndex[activeVerse] || [];
  const linkedNotes = notes.filter(n => noteIds.includes(n.id));

  return (
    <div className="w-72 border-l bg-card flex flex-col shrink-0 animate-fade-in">
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Verse Details</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div>
          <h3 className="font-serif text-base font-semibold text-primary">
            {selectedBook} {selectedChapter}:{selectedVerseNum}
          </h3>
          <p className="verse-text text-base mt-2">{verseText}</p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Referenced in ({linkedNotes.length})
          </h4>
          {linkedNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes reference this verse yet.</p>
          ) : (
            <div className="space-y-2">
              {linkedNotes.map(note => (
                <button key={note.id} onClick={() => onNoteClick(note.id)}
                  className="w-full text-left note-card !p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-sm font-medium truncate">{note.title || 'Untitled'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
