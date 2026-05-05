import { useState } from 'react';
import { Note } from '@/lib/storage';
import type { BibleData } from '@/lib/bibleUtils';
import type { Folder, NoteVersion } from '@/hooks/useCloudNotes';
import { Plus, Trash2, FileText, History, Save, FolderOpen, Upload, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FoldersView } from './FoldersView';
import { VersionHistory } from './VersionHistory';
import { TiptapEditor } from './TiptapEditor';

interface NotesEditorProps {
  notes: Note[];
  bible: BibleData | null;
  folders: Folder[];
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  onAddNote: (folderId?: string | null) => Promise<Note>;
  onUpdateNote: (id: string, updates: Partial<Pick<Note, 'title' | 'content'>> & { folderId?: string | null }) => void;
  onDeleteNote: (id: string) => void;
  onRefClick: (book: string, chapter: number, verse: number) => void;
  onAddFolder: (name: string, parentId?: string | null) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onSaveVersion: (noteId: string) => void;
  onGetVersions: (noteId: string) => Promise<NoteVersion[]>;
  onRestoreVersion: (noteId: string, version: NoteVersion) => void;
  isGuest: boolean;
  onImportClick?: () => void;
}

export function NotesEditor(props: NotesEditorProps) {
  const { notes, selectedNoteId, setSelectedNoteId } = props;
  const selectedNote = notes.find(n => n.id === selectedNoteId);

  if (!selectedNote) return <NoteList {...props} />;
  return <NoteDetail key={selectedNote.id} note={selectedNote} {...props} onBack={() => setSelectedNoteId(null)} />;
}

function NoteList({
  notes, folders, onAddNote, onUpdateNote,
  onAddFolder, onDeleteFolder, onRenameFolder, setSelectedNoteId, onImportClick,
}: NotesEditorProps) {
  const [showFolders, setShowFolders] = useState(false);
  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-lg font-semibold">Notes</h2>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowFolders(!showFolders)}
            className={cn("p-2 rounded-lg transition-colors", showFolders ? "bg-muted" : "text-muted-foreground hover:text-foreground")}>
            <FolderOpen className="w-4 h-4" />
          </button>
          {onImportClick && (
            <button onClick={onImportClick} title="Import notes"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <Upload className="w-4 h-4" />
            </button>
          )}
          <button onClick={async () => { const n = await onAddNote(); setSelectedNoteId(n.id); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {showFolders && (
          <div className="p-3 border-b">
            <FoldersView folders={folders} notes={notes}
              onAddFolder={onAddFolder} onDeleteFolder={onDeleteFolder} onRenameFolder={onRenameFolder}
              onNoteSelect={setSelectedNoteId}
              onMoveNote={(noteId, folderId) => onUpdateNote(noteId, { folderId })} />
          </div>
        )}
        <div className="p-4 space-y-2">
          {notes.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No notes yet. Create your first note!</p>
            </div>
          ) : (!showFolders ? notes : []).map(note => (
            <div key={note.id} onClick={() => setSelectedNoteId(note.id)} className="note-card">
              <h3 className="font-serif font-semibold text-base">{note.title || 'Untitled'}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {note.content.replace(/<[^>]+>/g, ' ').slice(0, 120) || 'Empty note'}
              </p>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {note.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NoteDetail({
  note, bible, onBack, onUpdateNote, onDeleteNote, onRefClick,
  onSaveVersion, onGetVersions, onRestoreVersion, isGuest,
}: NotesEditorProps & { note: Note; onBack: () => void }) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-2 flex items-center gap-1">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground p-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1" />
        {!isGuest && (
          <>
            <button onClick={() => onSaveVersion(note.id)} title="Save version"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground"><Save className="w-4 h-4" /></button>
            <button onClick={() => setShowHistory(!showHistory)} title="History"
              className={cn("p-2 rounded-lg", showHistory ? "bg-muted" : "text-muted-foreground hover:text-foreground")}>
              <History className="w-4 h-4" />
            </button>
          </>
        )}
        <button onClick={() => { onDeleteNote(note.id); onBack(); }}
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          <TiptapEditor
            bible={bible}
            initialContent={note.content || `<h1>${escapeHtml(note.title || '')}</h1>`}
            placeholder="Heading..."
            onChange={(html) => {
              // Extract title from first h1
              const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
              const title = (m ? m[1].replace(/<[^>]+>/g, '').trim() : '') || 'Untitled Note';
              onUpdateNote(note.id, { content: html, title });
            }}
            onRefClick={onRefClick}
          />
        </div>

        {showHistory && !isGuest && (
          <div className="w-72 border-l shrink-0">
            <VersionHistory noteId={note.id} getVersions={onGetVersions}
              onRestore={onRestoreVersion} onClose={() => setShowHistory(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
