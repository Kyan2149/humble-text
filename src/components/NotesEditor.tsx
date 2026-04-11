import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Note } from '@/lib/storage';
import { parseReferences, formatRef, getVerseRangeText } from '@/lib/bibleUtils';
import type { BibleData } from '@/lib/bibleUtils';
import { Plus, Trash2, Eye, Edit3, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerseHoverCard } from './VerseHoverCard';

interface NotesEditorProps {
  notes: Note[];
  bible: BibleData | null;
  onAddNote: () => Note;
  onUpdateNote: (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => void;
  onDeleteNote: (id: string) => void;
  onRefClick: (book: string, chapter: number, verse: number) => void;
  showEditorPanel: boolean;
  onToggleEditor: () => void;
}

export function NotesEditor({ notes, bible, onAddNote, onUpdateNote, onDeleteNote, onRefClick, showEditorPanel, onToggleEditor }: NotesEditorProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const selectedNote = notes.find(n => n.id === selectedNoteId);

  if (!selectedNote) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-lg font-semibold">Notes</h2>
          </div>
          <button onClick={() => { const n = onAddNote(); setSelectedNoteId(n.id); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> New Note
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {notes.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No notes yet. Create your first note!</p>
            </div>
          ) : notes.map(note => (
            <div key={note.id} onClick={() => setSelectedNoteId(note.id)} className="note-card">
              <h3 className="font-serif font-semibold text-base">{note.title || 'Untitled'}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{note.content.slice(0, 120) || 'Empty note'}</p>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {note.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <NoteDetail
      note={selectedNote}
      bible={bible}
      onBack={() => setSelectedNoteId(null)}
      onUpdate={onUpdateNote}
      onDelete={() => { onDeleteNote(selectedNote.id); setSelectedNoteId(null); }}
      onRefClick={onRefClick}
      showEditor={showEditorPanel}
      onToggleEditor={onToggleEditor}
    />
  );
}

function NoteDetail({
  note, bible, onBack, onUpdate, onDelete, onRefClick, showEditor, onToggleEditor
}: {
  note: Note;
  bible: BibleData | null;
  onBack: () => void;
  onUpdate: (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => void;
  onDelete: () => void;
  onRefClick: (book: string, chapter: number, verse: number) => void;
  showEditor: boolean;
  onToggleEditor: () => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onUpdate(note.id, { title: val }), 300);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onUpdate(note.id, { content: val }), 300);
  };

  const renderedContent = useMemo(() => {
    if (!bible) return content;
    const refs = parseReferences(content);
    if (refs.length === 0) return null;

    const parts: { type: 'text' | 'ref-link' | 'ref-inline'; value: string; ref?: typeof refs[0] }[] = [];
    let lastIndex = 0;

    // Sort refs by position in content
    const refPositions = refs.map(ref => {
      const idx = content.indexOf(ref.raw, lastIndex);
      return { ref, index: idx >= 0 ? idx : content.indexOf(ref.raw) };
    }).sort((a, b) => a.index - b.index);

    for (const { ref, index } of refPositions) {
      if (index < 0) continue;
      if (index > lastIndex) {
        parts.push({ type: 'text', value: content.slice(lastIndex, index) });
      }
      if (ref.isCapitalized) {
        parts.push({ type: 'ref-link', value: formatRef(ref), ref });
      } else {
        const text = getVerseRangeText(bible, ref);
        parts.push({ type: 'ref-inline', value: text || ref.raw, ref });
      }
      lastIndex = index + ref.raw.length;
    }
    if (lastIndex < content.length) {
      parts.push({ type: 'text', value: content.slice(lastIndex) });
    }

    return parts;
  }, [content, bible]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3 flex items-center gap-2">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
        <div className="flex-1" />
        <button onClick={onToggleEditor} className={cn(
          "p-2 rounded-lg transition-colors",
          showEditor ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
        )}>
          {showEditor ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
        </button>
        <button onClick={onDelete} className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {showEditor && (
          <div className="flex-1 flex flex-col overflow-auto editor-area m-2 mr-1">
            <input
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Note title..."
              className="text-xl font-serif font-semibold bg-transparent border-none outline-none mb-3 placeholder:text-muted-foreground/50"
            />
            <textarea
              value={content}
              onChange={e => handleContentChange(e.target.value)}
              placeholder="Write your notes here... Use references like Mat 5:5 or john 3:16"
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder:text-muted-foreground/50 font-sans min-h-[200px]"
            />
          </div>
        )}

        {/* Preview */}
        <div className={cn("flex-1 overflow-auto preview-area m-2", showEditor && "ml-1")}>
          <h1 className="text-xl font-serif font-semibold mb-3">{title || 'Untitled'}</h1>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {note.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}
            </div>
          )}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {Array.isArray(renderedContent) ? renderedContent.map((part, i) => {
              if (part.type === 'text') return <span key={i}>{part.value}</span>;
              if (part.type === 'ref-link' && part.ref) {
                return (
                  <VerseHoverCard key={i} bible={bible!} refData={part.ref}>
                    <button
                      onClick={() => onRefClick(part.ref!.book, part.ref!.chapter, part.ref!.verseStart)}
                      className="ref-link inline-flex items-center gap-0.5 px-1 py-0 rounded bg-primary/5"
                    >
                      [{part.value}]
                    </button>
                  </VerseHoverCard>
                );
              }
              if (part.type === 'ref-inline') {
                return (
                  <span key={i} className="italic text-muted-foreground border-l-2 border-primary/30 pl-2 py-1 my-1 block">
                    {part.value}
                  </span>
                );
              }
              return null;
            }) : (
              <span>{content}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
