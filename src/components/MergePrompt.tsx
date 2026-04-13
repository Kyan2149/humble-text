import { AlertTriangle, Merge, Trash2 } from 'lucide-react';

interface MergePromptProps {
  localNoteCount: number;
  onMerge: () => void;
  onDiscard: () => void;
  onDismiss: () => void;
}

export function MergePrompt({ localNoteCount, onMerge, onDiscard, onDismiss }: MergePromptProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border rounded-xl shadow-2xl w-full max-w-md mx-4 animate-fade-in p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <AlertTriangle className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-serif text-lg font-semibold">Local Notes Found</h2>
        </div>

        <p className="text-sm text-muted-foreground">
          You have <strong>{localNoteCount}</strong> local note{localNoteCount !== 1 ? 's' : ''} from guest mode.
          Would you like to merge them with your account?
        </p>

        <div className="flex flex-col gap-2">
          <button onClick={onMerge}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors">
            <Merge className="w-4 h-4" /> Merge with Account
          </button>
          <button onClick={onDiscard}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors text-muted-foreground">
            <Trash2 className="w-4 h-4" /> Discard Local Notes
          </button>
          <button onClick={onDismiss}
            className="text-xs text-muted-foreground hover:text-foreground text-center py-1">
            Decide later
          </button>
        </div>
      </div>
    </div>
  );
}
