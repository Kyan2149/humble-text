import { useState } from 'react';
import { FolderOpen, FolderPlus, ChevronRight, ChevronDown, FileText, Trash2, Edit3, Check, X, Plus, Move } from 'lucide-react';
import type { Folder } from '@/hooks/useCloudNotes';
import type { Note } from '@/lib/storage';

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
  const [addingChildOf, setAddingChildOf] = useState<string | null>(null);
  const [childName, setChildName] = useState('');
  const [movingNoteId, setMovingNoteId] = useState<string | null>(null);
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);

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

  const handleCreateChild = (parentId: string) => {
    if (childName.trim()) {
      onAddFolder(childName.trim(), parentId);
      setChildName('');
      setAddingChildOf(null);
      setExpandedFolders(prev => new Set(prev).add(parentId));
    }
  };

  const renderFolder = (folder: Folder, depth = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const childFolders = folders.filter(f => f.parent_id === folder.id);
    const folderNotes = notes.filter(n => n.folderId === folder.id);
    const isEditing = editingId === folder.id;

    return (
      <div key={folder.id} style={{ paddingLeft: depth * 12 }}>
        <div
          className="flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-muted transition-colors group"
          onDragOver={e => { if (draggingNoteId) { e.preventDefault(); } }}
          onDrop={e => { if (draggingNoteId) { e.preventDefault(); onMoveNote(draggingNoteId, folder.id); setDraggingNoteId(null); } }}
        >
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
                <button onClick={() => setAddingChildOf(folder.id)} title="New subfolder"
                  className="p-0.5 hover:text-primary"><Plus className="w-3 h-3" /></button>
                <button onClick={() => { setEditingId(folder.id); setEditName(folder.name); }} title="Rename"
                  className="p-0.5 hover:text-primary"><Edit3 className="w-3 h-3" /></button>
                <button onClick={() => onDeleteFolder(folder.id)} title="Delete"
                  className="p-0.5 hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
              </div>
            </>
          )}
        </div>
        {addingChildOf === folder.id && (
          <div className="flex items-center gap-1 px-2 py-1" style={{ paddingLeft: (depth + 1) * 12 + 12 }}>
            <input value={childName} onChange={e => setChildName(e.target.value)} autoFocus
              placeholder="Subfolder name..."
              className="flex-1 text-sm bg-background border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
              onKeyDown={e => { if (e.key === 'Enter') handleCreateChild(folder.id); if (e.key === 'Escape') setAddingChildOf(null); }} />
            <button onClick={() => handleCreateChild(folder.id)} className="text-primary"><Check className="w-4 h-4" /></button>
            <button onClick={() => setAddingChildOf(null)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
        )}
        {isExpanded && (
          <div>
            {childFolders.map(cf => renderFolder(cf, depth + 1))}
            {folderNotes.map(note => renderNote(note, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderNote = (note: Note, depth = 0) => (
    <div key={note.id}
      draggable
      onDragStart={() => setDraggingNoteId(note.id)}
      onDragEnd={() => setDraggingNoteId(null)}
      className="flex items-center gap-1 group hover:bg-muted rounded-lg"
      style={{ paddingLeft: depth * 12 }}
    >
      <button onClick={() => onNoteSelect(note.id)}
        className="flex-1 text-left flex items-center gap-2 py-1.5 px-2 text-sm min-w-0">
        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="truncate">{note.title || 'Untitled'}</span>
      </button>
      <div className="relative">
        <button onClick={() => setMovingNoteId(movingNoteId === note.id ? null : note.id)}
          className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary"
          title="Move to folder">
          <Move className="w-3.5 h-3.5" />
        </button>
        {movingNoteId === note.id && (
          <div className="absolute right-0 top-7 z-20 w-48 bg-popover border rounded-lg shadow-lg max-h-64 overflow-auto">
            <button onClick={() => { onMoveNote(note.id, null); setMovingNoteId(null); }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted">— Unfiled —</button>
            {folders.map(f => (
              <button key={f.id} onClick={() => { onMoveNote(note.id, f.id); setMovingNoteId(null); }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted truncate">
                {folderPath(f, folders)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folders</span>
        <button onClick={() => setShowNewFolder(!showNewFolder)} title="New folder"
          className="text-muted-foreground hover:text-primary transition-colors">
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>

      {showNewFolder && (
        <div className="flex items-center gap-1 px-2 mb-2">
          <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} autoFocus
            placeholder="Folder name..."
            className="flex-1 text-sm bg-background border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
            onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false); }} />
          <button onClick={handleCreateFolder} className="text-primary"><Check className="w-4 h-4" /></button>
          <button onClick={() => setShowNewFolder(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
      )}

      {rootFolders.map(f => renderFolder(f))}

      <div
        className="pt-2 border-t mt-2"
        onDragOver={e => { if (draggingNoteId) e.preventDefault(); }}
        onDrop={e => { if (draggingNoteId) { e.preventDefault(); onMoveNote(draggingNoteId, null); setDraggingNoteId(null); } }}
      >
        <span className="text-xs text-muted-foreground px-2">Unfiled ({unfolderedNotes.length})</span>
        {unfolderedNotes.map(note => renderNote(note))}
      </div>
    </div>
  );
}

function folderPath(f: Folder, all: Folder[]): string {
  const parts: string[] = [f.name];
  let p = f.parent_id;
  const seen = new Set<string>();
  while (p && !seen.has(p)) {
    seen.add(p);
    const par = all.find(x => x.id === p);
    if (!par) break;
    parts.unshift(par.name);
    p = par.parent_id;
  }
  return parts.join(' / ');
}
