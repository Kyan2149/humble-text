import { useState, useEffect } from 'react';
import { History, RotateCcw, X } from 'lucide-react';
import type { NoteVersion } from '@/hooks/useCloudNotes';

interface VersionHistoryProps {
  noteId: string;
  getVersions: (noteId: string) => Promise<NoteVersion[]>;
  onRestore: (noteId: string, version: NoteVersion) => void;
  onClose: () => void;
}

export function VersionHistory({ noteId, getVersions, onRestore, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);

  useEffect(() => {
    setLoading(true);
    getVersions(noteId).then(v => { setVersions(v); setLoading(false); });
  }, [noteId, getVersions]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Version History</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
        ) : versions.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm text-muted-foreground">No versions saved yet</p>
            <p className="text-xs text-muted-foreground mt-1">Save versions manually to keep history</p>
          </div>
        ) : (
          <div className="divide-y">
            {versions.map(v => (
              <div key={v.id}
                className={`p-3 cursor-pointer hover:bg-muted transition-colors ${selectedVersion?.id === v.id ? 'bg-muted' : ''}`}
                onClick={() => setSelectedVersion(v)}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(v.created_at).toLocaleDateString()} {new Date(v.created_at).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); onRestore(noteId, v); }}
                    className="text-xs text-primary hover:underline flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Restore
                  </button>
                </div>
                <p className="text-sm font-medium mt-1 truncate">{v.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{v.content.slice(0, 100)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedVersion && (
        <div className="border-t p-4 bg-muted/50 max-h-48 overflow-auto">
          <h4 className="text-xs font-semibold text-muted-foreground mb-1">Preview</h4>
          <p className="text-sm font-serif font-semibold mb-1">{selectedVersion.title}</p>
          <p className="text-xs whitespace-pre-wrap">{selectedVersion.content}</p>
        </div>
      )}
    </div>
  );
}
