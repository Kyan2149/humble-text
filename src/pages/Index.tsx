import { useState, useCallback } from 'react';
import { AppSidebar, NavView } from '@/components/AppSidebar';
import { BibleReader } from '@/components/BibleReader';
import { NotesEditor } from '@/components/NotesEditor';
import { SearchView } from '@/components/SearchView';
import { TopicsView } from '@/components/TopicsView';
import { RightPanel } from '@/components/RightPanel';
import { useBible } from '@/hooks/useBible';
import { useNotes } from '@/hooks/useNotes';
import { getVerseKey } from '@/lib/bibleUtils';
import { BookOpen, Loader2, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type SplitMode = 'bible' | 'notes' | 'split';

const Index = () => {
  const { bible, loading } = useBible();
  const { notes, verseIndex, allTags, addNote, updateNote, deleteNote } = useNotes();

  const [navView, setNavView] = useState<NavView>('bible');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>('bible');
  const [showEditorPanel, setShowEditorPanel] = useState(true);

  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [activeVerse, setActiveVerse] = useState<string | null>(null);
  const [selectedVerseNum, setSelectedVerseNum] = useState<number | null>(null);

  const handleVerseClick = useCallback((book: string, chapter: number, verse: number) => {
    const key = getVerseKey(book, chapter, verse);
    setActiveVerse(prev => prev === key ? null : key);
    setSelectedVerseNum(prev => prev === verse && activeVerse === key ? null : verse);
  }, [activeVerse]);

  const handleRefClick = useCallback((book: string, chapter: number, verse: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setActiveVerse(getVerseKey(book, chapter, verse));
    setSelectedVerseNum(verse);
    if (splitMode !== 'split') {
      setNavView('bible');
      setSplitMode('bible');
    }
  }, [splitMode]);

  const handleNoteSelect = useCallback((noteId: string) => {
    setNavView('notes');
    if (splitMode !== 'split') setSplitMode('notes');
  }, [splitMode]);

  if (loading || !bible) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground font-serif">Loading the Word...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar
        activeView={navView}
        onViewChange={v => { setNavView(v); if (v === 'bible') setSplitMode('bible'); else if (v === 'notes') setSplitMode('notes'); }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with split controls */}
        <div className="border-b px-4 py-2 flex items-center gap-2 bg-background">
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            {[
              { mode: 'bible' as SplitMode, label: 'Bible', icon: BookOpen },
              { mode: 'split' as SplitMode, label: 'Split', icon: PanelLeft },
              { mode: 'notes' as SplitMode, label: 'Notes', icon: PanelLeftClose },
            ].map(({ mode, label }) => (
              <button key={mode} onClick={() => { setSplitMode(mode); if (mode === 'bible') setNavView('bible'); else if (mode === 'notes') setNavView('notes'); }}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  splitMode === mode ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Bible panel */}
          {(splitMode === 'bible' || splitMode === 'split') && (navView === 'bible' || splitMode === 'split') && (
            <div className={cn("flex flex-col overflow-hidden", splitMode === 'split' ? "flex-1 border-r" : "flex-1")}>
              <BibleReader
                bible={bible}
                selectedBook={selectedBook}
                selectedChapter={selectedChapter}
                onSelectBook={setSelectedBook}
                onSelectChapter={setSelectedChapter}
                verseIndex={verseIndex}
                notes={notes}
                onVerseClick={handleVerseClick}
                activeVerse={activeVerse}
              />
            </div>
          )}

          {/* Notes/Topics/Search panel */}
          {(splitMode === 'notes' || splitMode === 'split' || navView === 'notes' || navView === 'topics' || navView === 'search') &&
            !(splitMode === 'bible' && navView === 'bible') && (
            <div className={cn("flex flex-col overflow-hidden", splitMode === 'split' ? "flex-1" : "flex-1")}>
              {(navView === 'notes' || splitMode === 'split' || splitMode === 'notes') && navView !== 'topics' && navView !== 'search' && (
                <NotesEditor
                  notes={notes}
                  bible={bible}
                  onAddNote={addNote}
                  onUpdateNote={updateNote}
                  onDeleteNote={deleteNote}
                  onRefClick={handleRefClick}
                  showEditorPanel={showEditorPanel}
                  onToggleEditor={() => setShowEditorPanel(!showEditorPanel)}
                />
              )}
              {navView === 'topics' && (
                <TopicsView notes={notes} allTags={allTags} onNoteSelect={handleNoteSelect} />
              )}
              {navView === 'search' && (
                <SearchView bible={bible} notes={notes} onVerseClick={handleRefClick} onNoteSelect={handleNoteSelect} />
              )}
            </div>
          )}

          {/* Right panel for verse details */}
          {activeVerse && (
            <RightPanel
              bible={bible}
              activeVerse={activeVerse}
              selectedBook={selectedBook}
              selectedChapter={selectedChapter}
              selectedVerseNum={selectedVerseNum}
              verseIndex={verseIndex}
              notes={notes}
              onNoteClick={handleNoteSelect}
              onClose={() => { setActiveVerse(null); setSelectedVerseNum(null); }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
