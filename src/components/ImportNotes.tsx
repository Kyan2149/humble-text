import { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import type { Folder } from '@/hooks/useCloudNotes';
import type { Note } from '@/lib/storage';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  onAddFolder: (name: string, parentId?: string | null) => Promise<string | null>;
  onAddNote: (folderId?: string | null) => Promise<Note>;
  onUpdateNote: (id: string, updates: { title?: string; content?: string }) => void;
}

// Create folder hierarchy from path parts. Returns leaf folder id.
async function ensureFolderPath(
  parts: string[],
  folders: Folder[],
  cache: Record<string, string>,
  onAddFolder: (name: string, parentId?: string | null) => Promise<string | null>,
): Promise<string | null> {
  let parentId: string | null = null;
  let key = '';
  for (const p of parts) {
    key = key ? `${key}/${p}` : p;
    if (cache[key]) { parentId = cache[key]; continue; }
    const existing = folders.find(f => f.name === p && (f.parent_id || null) === parentId);
    if (existing) {
      parentId = existing.id;
    } else {
      const id = await onAddFolder(p, parentId);
      if (!id) return parentId;
      folders.push({ id, name: p, parent_id: parentId } as Folder);
      parentId = id;
    }
    cache[key] = parentId!;
  }
  return parentId;
}

export function ImportNotes({ open, onClose, folders, onAddFolder, onAddNote, onUpdateNote }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  if (!open) return null;

  const handleFiles = async (fileList: FileList) => {
    setImporting(true);
    const cache: Record<string, string> = {};
    let count = 0;
    try {
      for (const file of Array.from(fileList)) {
        // @ts-ignore — webkitRelativePath exists for folder picks
        const rel: string = file.webkitRelativePath || file.name;
        const parts = rel.split('/').filter(Boolean);
        const fileName = parts.pop()!;
        const folderId = parts.length ? await ensureFolderPath(parts, folders, cache, async (n, p) => {
          const id = crypto.randomUUID();
          await onAddFolder(n, p);
          // try to find newly added folder by name+parent
          const found = folders.find(f => f.name === n && (f.parent_id || null) === (p || null));
          return found?.id || id;
        }) : null;
        const text = await file.text();
        const title = fileName.replace(/\.[^.]+$/, '');
        const note = await onAddNote(folderId);
        onUpdateNote(note.id, { title, content: text });
        count++;
      }
      toast.success(`Imported ${count} note${count !== 1 ? 's' : ''}`);
      onClose();
    } catch (e: any) {
      toast.error('Import failed: ' + e.message);
    }
    setImporting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-serif text-xl font-semibold">Import Notes</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            Import .md, .txt, or any text files. Folder structure is preserved.
          </p>
          <button onClick={() => fileInput.current?.click()} disabled={importing}
            className="w-full flex items-center gap-2 justify-center px-4 py-3 rounded-lg border-2 border-dashed hover:bg-muted transition-colors">
            <Upload className="w-4 h-4" /> Select Files
          </button>
          <button onClick={() => folderInput.current?.click()} disabled={importing}
            className="w-full flex items-center gap-2 justify-center px-4 py-3 rounded-lg border-2 border-dashed hover:bg-muted transition-colors">
            <Upload className="w-4 h-4" /> Select Folder
          </button>
          <input ref={fileInput} type="file" multiple className="hidden"
            accept=".md,.txt,.markdown,text/*"
            onChange={e => e.target.files && handleFiles(e.target.files)} />
          <input ref={folderInput} type="file" multiple className="hidden"
            // @ts-ignore
            webkitdirectory="" directory=""
            onChange={e => e.target.files && handleFiles(e.target.files)} />
          {importing && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Importing...</p>}
        </div>
      </div>
    </div>
  );
}
