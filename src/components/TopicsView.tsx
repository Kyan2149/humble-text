import { useMemo } from 'react';
import { Hash, FileText, BookOpen } from 'lucide-react';
import type { Note } from '@/lib/storage';

interface TopicsViewProps {
  notes: Note[];
  allTags: string[];
  onNoteSelect: (noteId: string) => void;
}

export function TopicsView({ notes, allTags, onNoteSelect }: TopicsViewProps) {
  const tagGroups = useMemo(() => {
    const groups: Record<string, Note[]> = {};
    for (const tag of allTags) {
      groups[tag] = notes.filter(n => n.tags.includes(tag));
    }
    return groups;
  }, [notes, allTags]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3 flex items-center gap-2">
        <Hash className="w-5 h-5 text-primary" />
        <h2 className="font-serif text-lg font-semibold">Topics</h2>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {allTags.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Hash className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No topics yet. Add #tags to your notes!</p>
          </div>
        ) : allTags.map(tag => (
          <div key={tag}>
            <h3 className="flex items-center gap-2 font-semibold text-base mb-2">
              <span className="tag-pill text-sm">{tag}</span>
              <span className="text-xs text-muted-foreground">({tagGroups[tag]?.length || 0} notes)</span>
            </h3>
            <div className="space-y-1.5 pl-2">
              {tagGroups[tag]?.map(note => (
                <button key={note.id} onClick={() => onNoteSelect(note.id)}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{note.title || 'Untitled'}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
