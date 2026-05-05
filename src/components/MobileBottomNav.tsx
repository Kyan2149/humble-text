import { Book, FileText, Search, User, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavView } from './AppSidebar';

interface Props {
  activeView: NavView;
  onChange: (v: NavView) => void;
}

const items: { id: NavView; label: string; icon: typeof Book }[] = [
  { id: 'bible', label: 'Bible', icon: Book },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'graph', label: 'Web', icon: Network },
  { id: 'profile', label: 'Profile', icon: User },
];

export function MobileBottomNav({ activeView, onChange }: Props) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background border-t flex items-stretch h-14 pb-[env(safe-area-inset-bottom)]">
      {items.map(it => (
        <button key={it.id} onClick={() => onChange(it.id)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
            activeView === it.id ? "text-primary" : "text-muted-foreground"
          )}>
          <it.icon className="w-5 h-5" />
          {it.label}
        </button>
      ))}
    </nav>
  );
}
