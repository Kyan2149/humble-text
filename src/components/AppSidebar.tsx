import { Book, FileText, Hash, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import logoImg from '/favicon.png';

export type NavView = 'bible' | 'notes' | 'topics' | 'search';

interface AppSidebarProps {
  activeView: NavView;
  onViewChange: (view: NavView) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: { id: NavView; label: string; icon: typeof Book }[] = [
  { id: 'bible', label: 'Bible', icon: Book },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'topics', label: 'Topics', icon: Hash },
  { id: 'search', label: 'Search', icon: Search },
];

export function AppSidebar({ activeView, onViewChange, collapsed, onToggleCollapse }: AppSidebarProps) {
  return (
    <aside className={cn(
      "flex flex-col border-r bg-sidebar transition-all duration-300 shrink-0",
      collapsed ? "w-16" : "w-56"
    )}>
      <div className="flex items-center gap-2 p-3 border-b border-sidebar-border">
        <img src={logoImg} alt="Logos Study" className="w-8 h-8 rounded" />
        {!collapsed && <span className="font-serif text-lg font-semibold text-sidebar-foreground">Logos Study</span>}
      </div>

      <nav className="flex-1 py-2 space-y-1 px-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeView === item.id
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <button
        onClick={onToggleCollapse}
        className="p-3 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4 mx-auto" /> : <ChevronLeft className="w-4 h-4 mx-auto" />}
      </button>
    </aside>
  );
}
