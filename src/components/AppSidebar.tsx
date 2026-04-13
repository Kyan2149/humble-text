import { Book, FileText, Hash, Search, ChevronLeft, ChevronRight, Bookmark, User, LogOut, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import logoImg from '/favicon.png';

export type NavView = 'bible' | 'notes' | 'topics' | 'search' | 'saved';

interface AppSidebarProps {
  activeView: NavView;
  onViewChange: (view: NavView) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLoginClick: () => void;
}

const navItems: { id: NavView; label: string; icon: typeof Book }[] = [
  { id: 'bible', label: 'Bible', icon: Book },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'topics', label: 'Topics', icon: Hash },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'saved', label: 'Saved', icon: Bookmark },
];

export function AppSidebar({ activeView, onViewChange, collapsed, onToggleCollapse, onLoginClick }: AppSidebarProps) {
  const { user, isGuest, signOut } = useAuth();

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

      {/* User section */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        {isGuest ? (
          <button onClick={onLoginClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
            <LogIn className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Sign In</span>}
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 px-3 py-2 text-sm">
              <User className="w-5 h-5 shrink-0 text-primary" />
              {!collapsed && (
                <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
              )}
            </div>
            <button onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors">
              <LogOut className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </>
        )}
        {isGuest && !collapsed && (
          <p className="text-[10px] text-muted-foreground px-3 leading-tight">
            Guest Mode — data saved locally
          </p>
        )}
      </div>

      <button
        onClick={onToggleCollapse}
        className="p-3 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4 mx-auto" /> : <ChevronLeft className="w-4 h-4 mx-auto" />}
      </button>
    </aside>
  );
}
