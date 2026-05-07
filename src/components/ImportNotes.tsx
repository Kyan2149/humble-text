import { useRef, useState } from 'react';
import { Upload, X, Loader2, Apple, FolderTree } from 'lucide-react';
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

// Convert Apple Notes .html export to readable HTML preserving headings/lists.
function appleHtmlToContent(html: string): { title: string; content: string } {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Remove scripts/styles
  doc.querySelectorAll('script,style,meta,link').forEach(n => n.remove());
  const body = doc.body;
  // First non-empty heading or line is the title
  const firstHeading = body.querySelector('h1, h2, h3, p, div');
  const title = (firstHeading?.textContent || '').trim().split('\n')[0].slice(0, 120) || 'Imported Note';
  // Extract clean inner HTML
  const content = body.innerHTML.trim();
  return { title, content };
}

export function ImportNotes({ open, onClose, folders, onAddFolder, onAddNote, onUpdateNote }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const appleInput = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  if (!open) return null;

  const handleFiles = async (fileList: FileList, mode: 'generic' | 'apple') => {
    setImporting(true);
    setProgress({ done: 0, total: fileList.length });
    const cache: Record<string, string> = {};
    let count = 0;
    try {
      for (const file of Array.from(fileList)) {
        // @ts-ignore — webkitRelativePath exists for folder picks
        const rel: string = file.webkitRelativePath || file.name;
        const parts = rel.split('/').filter(Boolean);
        const fileName = parts.pop()!;
        // For Apple Notes export, the top-level folder is usually "Notes" — keep hierarchy as-is
        const folderId = parts.length ? await ensureFolderPath(parts, folders, cache, onAddFolder) : null;
        const text = await file.text();
        const isHtml = mode === 'apple' || /\.html?$/i.test(fileName);
        const note = await onAddNote(folderId);
        if (isHtml) {
          const { title, content } = appleHtmlToContent(text);
          const cleanTitle = fileName.replace(/\.[^.]+$/, '') || title;
          onUpdateNote(note.id, { title: cleanTitle, content });
        } else {
          const title = fileName.replace(/\.[^.]+$/, '');
          // Convert plaintext: first line → h1, rest → paragraphs
          const lines = text.split('\n');
          const head = lines.shift() || title;
          const html = `<h1>${escape(head)}</h1>` + lines.map(l => l ? `<p>${escape(l)}</p>` : '<p></p>').join('');
          onUpdateNote(note.id, { title, content: html });
        }
        count++;
        setProgress({ done: count, total: fileList.length });
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
            Import notes from your computer or Apple Notes. Folder structure is preserved automatically.
          </p>

          <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground flex items-center gap-1.5">
              <Apple className="w-3.5 h-3.5" /> How to export from Apple Notes
            </p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Open <b>Notes</b> on your Mac.</li>
              <li>Select notes (or a whole folder) → <b>File → Export as HTML</b>.</li>
              <li>Save the resulting folder somewhere accessible.</li>
              <li>Click <b>Import Apple Notes Folder</b> below and select that folder.</li>
            </ol>
          </div>

          <button onClick={() => appleInput.current?.click()} disabled={importing}
            className="w-full flex items-center gap-2 justify-center px-4 py-3 rounded-lg border-2 border-dashed border-primary/40 hover:bg-primary/5 transition-colors text-primary">
            <Apple className="w-4 h-4" /> Import Apple Notes Folder
          </button>

          <button onClick={() => folderInput.current?.click()} disabled={importing}
            className="w-full flex items-center gap-2 justify-center px-4 py-3 rounded-lg border-2 border-dashed hover:bg-muted transition-colors">
            <FolderTree className="w-4 h-4" /> Import Folder (preserves hierarchy)
          </button>

          <button onClick={() => fileInput.current?.click()} disabled={importing}
            className="w-full flex items-center gap-2 justify-center px-4 py-3 rounded-lg border-2 border-dashed hover:bg-muted transition-colors">
            <Upload className="w-4 h-4" /> Import Individual Files
          </button>

          <input ref={fileInput} type="file" multiple className="hidden"
            accept=".md,.txt,.markdown,.html,.htm,text/*"
            onChange={e => e.target.files && handleFiles(e.target.files, 'generic')} />
          <input ref={folderInput} type="file" multiple className="hidden"
            // @ts-ignore
            webkitdirectory="" directory=""
            onChange={e => e.target.files && handleFiles(e.target.files, 'generic')} />
          <input ref={appleInput} type="file" multiple className="hidden"
            // @ts-ignore
            webkitdirectory="" directory=""
            accept=".html,.htm,.txt"
            onChange={e => e.target.files && handleFiles(e.target.files, 'apple')} />

          {importing && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Importing {progress.done} / {progress.total}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function escape(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
