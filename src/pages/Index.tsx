import { useState, useCallback, useEffect } from 'react';
import { AppSidebar, NavView } from '@/components/AppSidebar';
import { BibleReader } from '@/components/BibleReader';
import { NotesEditor } from '@/components/NotesEditor';
import { SearchView } from '@/components/SearchView';
import { TopicsView } from '@/components/TopicsView';
import { RightPanel } from '@/components/RightPanel';
import { SavedVersesView } from '@/components/SavedVersesView';
import { AuthModal } from '@/components/AuthModal';
import { MergePrompt } from '@/components/MergePrompt';
import { ProfilePage } from '@/components/ProfilePage';
import { ConnectionsGraph } from '@/components/ConnectionsGraph';
import { ImportNotes } from '@/components/ImportNotes';
import { GlobalSearchBar } from '@/components/GlobalSearchBar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useBible } from '@/hooks/useBible';
import { useCloudNotes } from '@/hooks/useCloudNotes';
import { getVerseKey } from '@/lib/bibleUtils';
import { pingStreak } from '@/lib/streak';
import { Loader2, BookOpen, PanelLeft, PanelLeftClose, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type SplitMode = 'bible' | 'notes' | 'split';

const Index = () => {
  const { bible, loading } = useBible();
  const cn_ = useCloudNotes();
  const {
    notes, verseIndex, allTags, folders, highlights, highlightMap,
    addNote, updateNote, deleteNote,
    addFolder, deleteFolder, renameFolder,
    toggleHighlight, updateHighlightColor,
    saveVersion, getVersions, restoreVersion,
    showMergePrompt, mergeLocalNotes, discardLocalNotes, setShowMergePrompt,
    isGuest,
  } = cn_;

  const [navView, setNavView] = useState<NavView>('bible');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>('bible');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [activeVerse, setActiveVerse] = useState<string | null>(null);
  const [selectedVerseNum, setSelectedVerseNum] = useState<number | null>(null);

  useEffect(() => { pingStreak(); }, []);

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
    setNavView('bible');
    if (splitMode === 'notes') setSplitMode('split');
  }, [splitMode]);

  const handleNoteSelect = useCallback((noteId: string) => {
    setSelectedNoteId(noteId);
    setNavView('notes');
  }, []);

  const handleSavedVerseClick = useCallback((verseKey: string) => {
    const parts = verseKey.split('-');
    const verse = parseInt(parts.pop()!, 10);
    const chapter = parseInt(parts.pop()!, 10);
    const book = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    handleRefClick(book, chapter, verse);
  }, [handleRefClick]);

  const handleInsertVotd = useCallback(async (text: string, ref: string) => {
    const note = await addNote();
    const html = `<h1>${ref}</h1><p>${text}</p>`;
    updateNote(note.id, { title: ref, content: html });
    setSelectedNoteId(note.id);
    setNavView('notes');
  }, [addNote, updateNote]);

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

  // What renders in the "secondary" pane (notes / topics / search / saved / graph / profile)
  const renderSecondary = () => {
    if (navView === 'topics') return <TopicsView notes={notes} allTags={allTags} onNoteSelect={handleNoteSelect} />;
    if (navView === 'search') return <SearchView bible={bible} notes={notes} onVerseClick={handleRefClick} onNoteSelect={handleNoteSelect} />;
    if (navView === 'saved') return (
      <SavedVersesView highlights={highlights} onVerseClick={handleSavedVerseClick}
        onRemove={vk => toggleHighlight(vk)} onColorChange={updateHighlightColor} />
    );
    if (navView === 'graph') return <ConnectionsGraph notes={notes} onNoteClick={handleNoteSelect} onVerseClick={handleSavedVerseClick} />;
    if (navView === 'profile') return (
      <ProfilePage bible={bible} noteCount={notes.length} highlightCount={highlights.length}
        onLoginClick={() => setShowAuthModal(true)}
        onSaveVotd={(vk) => toggleHighlight(vk)}
        onInsertVotd={handleInsertVotd}
        onOpenVerse={handleRefClick} />
    );
    // notes (default)
    return (
      <NotesEditor
        notes={notes} bible={bible} folders={folders}
        selectedNoteId={selectedNoteId} setSelectedNoteId={setSelectedNoteId}
        onAddNote={addNote} onUpdateNote={updateNote} onDeleteNote={deleteNote}
        onRefClick={handleRefClick}
        onAddFolder={addFolder} onDeleteFolder={deleteFolder} onRenameFolder={renameFolder}
        onSaveVersion={saveVersion} onGetVersions={getVersions} onRestoreVersion={restoreVersion}
        isGuest={isGuest}
        onImportClick={() => setShowImport(true)}
      />
    );
  };

  const showBible = navView === 'bible' || splitMode === 'split';
  const showSecondary = navView !== 'bible' || splitMode === 'notes' || splitMode === 'split';

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <AppSidebar activeView={navView}
          onViewChange={v => { setNavView(v); if (v === 'bible') setSplitMode('bible'); }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLoginClick={() => setShowAuthModal(true)} />
      </div>

      {/* Mobile drawer */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileSidebarOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-background shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end p-2"><button onClick={() => setMobileSidebarOpen(false)}><X className="w-5 h-5" /></button></div>
            <AppSidebar activeView={navView}
              onViewChange={v => { setNavView(v); setMobileSidebarOpen(false); if (v === 'bible') setSplitMode('bible'); }}
              collapsed={false} onToggleCollapse={() => {}}
              onLoginClick={() => { setShowAuthModal(true); setMobileSidebarOpen(false); }} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="border-b px-2 sm:px-4 py-2 flex items-center gap-2 bg-background">
          <button className="md:hidden p-2 -ml-1" onClick={() => setMobileSidebarOpen(true)} aria-label="Menu">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex gap-1 bg-muted rounded-lg p-0.5 shrink-0">
            {[
              { mode: 'bible' as SplitMode, label: 'Bible', icon: BookOpen },
              { mode: 'split' as SplitMode, label: 'Split', icon: PanelLeft },
              { mode: 'notes' as SplitMode, label: 'Notes', icon: PanelLeftClose },
            ].map(({ mode, label }) => (
              <button key={mode} onClick={() => {
                  setSplitMode(mode);
                  if (mode === 'bible') setNavView('bible');
                  else if (mode === 'notes') setNavView('notes');
                }}
                className={cn("px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-colors",
                  splitMode === mode ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}>
                {label}
              </button>
            ))}
          </div>

          <GlobalSearchBar bible={bible} notes={notes}
            onVerseClick={handleRefClick} onNoteSelect={handleNoteSelect} />

          {isGuest && (
            <span className="hidden sm:inline text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Guest</span>
          )}
        </div>

        {/*
          Layout rules:
          - Desktop: row layout, both panels side-by-side when split.
          - Mobile (portrait): stacked top/bottom — Bible on top, secondary on bottom when split.
          - Non-split: single panel fills.
        */}
        <div className={cn(
          "flex-1 flex overflow-hidden pb-14 md:pb-0",
          splitMode === 'split' ? "flex-col md:flex-row" : "flex-row",
        )}>
          {showBible && (
            <div className={cn(
              "flex flex-col overflow-hidden",
              splitMode === 'split'
                ? "flex-1 min-h-0 border-b md:border-b-0 md:border-r"
                : "flex-1",
              navView !== 'bible' && splitMode !== 'split' && "hidden",
            )}>
              <BibleReader
                bible={bible}
                selectedBook={selectedBook} selectedChapter={selectedChapter}
                onSelectBook={setSelectedBook} onSelectChapter={setSelectedChapter}
                verseIndex={verseIndex} notes={notes}
                onVerseClick={handleVerseClick} activeVerse={activeVerse}
                highlightMap={highlightMap}
                onToggleHighlight={toggleHighlight}
                onHighlightColorChange={updateHighlightColor}
              />
            </div>
          )}

          {showSecondary && navView !== 'bible' && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {renderSecondary()}
            </div>
          )}

          {activeVerse && navView === 'bible' && splitMode !== 'split' && (
            <RightPanel bible={bible} activeVerse={activeVerse}
              selectedBook={selectedBook} selectedChapter={selectedChapter}
              selectedVerseNum={selectedVerseNum}
              verseIndex={verseIndex} notes={notes}
              onNoteClick={handleNoteSelect}
              onClose={() => { setActiveVerse(null); setSelectedVerseNum(null); }} />
          )}
        </div>
      </div>

      <MobileBottomNav activeView={navView} onChange={(v) => {
        setNavView(v);
        if (v === 'bible') setSplitMode('bible');
        else if (v === 'notes') setSplitMode('notes');
      }} />

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <ImportNotes open={showImport} onClose={() => setShowImport(false)}
        folders={folders} onAddFolder={addFolder as any}
        onAddNote={addNote} onUpdateNote={updateNote} />
      {showMergePrompt && (
        <MergePrompt
          localNoteCount={(() => { try { const r = localStorage.getItem('logos-study-notes'); return r ? JSON.parse(r).length : 0; } catch { return 0; } })()}
          onMerge={mergeLocalNotes} onDiscard={discardLocalNotes}
          onDismiss={() => setShowMergePrompt(false)} />
      )}
    </div>
  );
};

export default Index;
