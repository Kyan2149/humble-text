import { useState } from 'react';
import { FolderOpen, FolderPlus, ChevronRight, ChevronDown, FileText, Trash2, Edit3, Check, X } from 'lucide-react';
import type { Folder } from '@/hooks/useCloudNotes';
import type { Note } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface FoldersViewProps {
  folders: Folder[];
  notes: Note[];
  onAddFolder: (name: string, parentId?: string | null) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onNoteSelect: (noteId: string) => void;
  onMoveNote: (noteId: string, folderId: string | null) => void;
}

export function FoldersView({ folders, notes, onAddFolder, onDeleteFolder, onRenameFolder, onNoteSelect, onMoveNote }: FoldersViewProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const rootFolders = folders.filter(f => !f.parent_id);
  const unfolderedNotes = notes.filter(n => !n.folderId);

  const toggleExpand = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const renderFolder = (folder: Folder, depth = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const childFolders = folders.filter(f => f.parent_id === folder.id);
    const folderNotes = notes.filter(n => n.folderId === folder.id);
    const isEditing = editingId === folder.id;

    return (
      <div key={folder.id} style={{ paddingLeft: depth * 16 }}>
        <div className="flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-muted transition-colors group">
          <button onClick={() => toggleExpand(folder.id)} className="shrink-0">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>
          <FolderOpen className="w-4 h-4 text-primary shrink-0" />
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                className="flex-1 text-sm bg-background border rounded px-1 py-0.5 outline-none"
                onKeyDown={e => { if (e.key === 'Enter') { onRenameFolder(folder.id, editName); setEditingId(null); } }} />
              <button onClick={() => { onRenameFolder(folder.id, editName); setEditingId(null); }}>
                <Check className="w-3.5 h-3.5 text-green-600" />
              </button>
              <button onClick={() => setEditingId(null)}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
            </div>
          ) : (
            <>
              <span className="text-sm font-medium truncate flex-1">{folder.name}</span>
              <span className="text-xs text-muted-foreground">{folderNotes.length}</span>
              <div className="hidden group-hover:flex items-center gap-0.5">
                <button onClick={() => { setEditingId(folder.id); setEditName(folder.name); }}
                  className="p-0.5 hover:text-primary"><Edit3 className="w-3 h-3" /></button>
                <button onClick={() => onDeleteFolder(folder.id)}
                  className="p-0.5 hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
              </div>
            </>
          )}
        </div>
        {isExpanded && (
          <div className="ml-2">
            {childFolders.map(cf => renderFolder(cf, depth + 1))}
            {folderNotes.map(note => (
              <button key={note.id} onClick={() => onNoteSelect(note.id)}
                className="w-full text-left flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted transition-colors text-sm"
                style={{ paddingLeft: (depth + 1) * 16 }}>
                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{note.title || 'Untitled'}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folders</span>
        <button onClick={() => setShowNewFolder(!showNewFolder)}
          className="text-muted-foreground hover:text-primary transition-colors">
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>

      {showNewFolder && (
        <div className="flex items-center gap-1 px-2 mb-2">
          <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} autoFocus
            placeholder="Folder name..."
            className="flex-1 text-sm bg-background border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
            onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); }} />
          <button onClick={handleCreateFolder} className="text-primary"><Check className="w-4 h-4" /></button>
          <button onClick={() => setShowNewFolder(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
      )}

      {rootFolders.map(f => renderFolder(f))}

      {unfolderedNotes.length > 0 && (
        <div className="pt-2 border-t mt-2">
          <span className="text-xs text-muted-foreground px-2">Unfiled ({unfolderedNotes.length})</span>
          {unfolderedNotes.map(note => (
            <button key={note.id} onClick={() => onNoteSelect(note.id)}
              className="w-full text-left flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted transition-colors text-sm">
              <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{note.title || 'Untitled'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
