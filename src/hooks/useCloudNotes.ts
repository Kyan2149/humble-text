import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { buildVerseIndex, extractTags, type Note, loadNotes, saveNotes } from '@/lib/storage';
import { parseReferences, getVerseKey } from '@/lib/bibleUtils';
import { toast } from 'sonner';

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
}

export interface Highlight {
  id: string;
  verse_key: string;
  color: string;
  note: string | null;
}

export interface NoteVersion {
  id: string;
  note_id: string;
  title: string;
  content: string;
  tags: string[];
  referenced_verses: string[];
  created_at: string;
}

function computeVerseKeys(content: string): string[] {
  const refs = parseReferences(content);
  const keys: string[] = [];
  for (const ref of refs) {
    for (let v = ref.verseStart; v <= ref.verseEnd; v++) {
      keys.push(getVerseKey(ref.book, ref.chapter, v));
    }
  }
  return [...new Set(keys)];
}

export function useCloudNotes() {
  const { user, isGuest } = useAuth();

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [showMergePrompt, setShowMergePrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load from localStorage for guest mode
  useEffect(() => {
    if (isGuest) {
      setNotes(loadNotes());
      setFolders([]);
      setHighlights(loadHighlightsLocal());
    }
  }, [isGuest]);

  // Save to localStorage in guest mode
  useEffect(() => {
    if (isGuest) {
      saveNotes(notes);
    }
  }, [notes, isGuest]);

  useEffect(() => {
    if (isGuest) {
      saveHighlightsLocal(highlights);
    }
  }, [highlights, isGuest]);

  // Load from Supabase when logged in
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchCloudData().finally(() => setLoading(false));

    // Check for local notes to merge
    const localNotes = loadNotes();
    if (localNotes.length > 0) {
      setShowMergePrompt(true);
    }
  }, [user]);

  const fetchCloudData = async () => {
    if (!user) return;
    const [notesRes, foldersRes, highlightsRes] = await Promise.all([
      supabase.from('notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
      supabase.from('folders').select('*').eq('user_id', user.id).order('name'),
      supabase.from('highlights').select('*').eq('user_id', user.id),
    ]);

    if (notesRes.data) {
      setNotes(notesRes.data.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        tags: n.tags || [],
        referencedVerses: n.referenced_verses || [],
        createdAt: new Date(n.created_at).getTime(),
        updatedAt: new Date(n.updated_at).getTime(),
        folderId: n.folder_id,
      })));
    }
    if (foldersRes.data) setFolders(foldersRes.data);
    if (highlightsRes.data) setHighlights(highlightsRes.data.map(h => ({
      id: h.id, verse_key: h.verse_key, color: h.color, note: h.note,
    })));
  };

  // Merge local notes into cloud
  const mergeLocalNotes = useCallback(async () => {
    if (!user) return;
    const localNotes = loadNotes();
    for (const note of localNotes) {
      const tags = extractTags(note.content);
      const verseKeys = computeVerseKeys(note.content);
      await supabase.from('notes').insert({
        user_id: user.id,
        title: note.title,
        content: note.content,
        tags,
        referenced_verses: verseKeys,
      });
    }
    // Merge highlights
    const localHL = loadHighlightsLocal();
    for (const h of localHL) {
      await supabase.from('highlights').upsert({
        user_id: user.id,
        verse_key: h.verse_key,
        color: h.color,
        note: h.note,
      }, { onConflict: 'user_id,verse_key' });
    }
    // Clear local
    saveNotes([]);
    saveHighlightsLocal([]);
    setShowMergePrompt(false);
    await fetchCloudData();
    toast.success(`Merged ${localNotes.length} notes to your account`);
  }, [user]);

  const discardLocalNotes = useCallback(() => {
    saveNotes([]);
    saveHighlightsLocal([]);
    setShowMergePrompt(false);
  }, []);

  const verseIndex = useMemo(() => buildVerseIndex(notes), [notes]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [notes]);

  // Note CRUD
  const addNote = useCallback(async (folderId?: string | null) => {
    const tempNote: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled Note',
      content: '',
      tags: [],
      referencedVerses: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      folderId: folderId || null,
    };

    // Optimistic
    setNotes(prev => [tempNote, ...prev]);

    if (user) {
      const { data } = await supabase.from('notes').insert({
        user_id: user.id,
        title: tempNote.title,
        folder_id: folderId || null,
      }).select().single();
      if (data) {
        setNotes(prev => prev.map(n => n.id === tempNote.id ? { ...n, id: data.id } : n));
        return { ...tempNote, id: data.id };
      }
    }
    return tempNote;
  }, [user]);

  const updateNote = useCallback(async (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'folderId'>>) => {
    setNotes(prev => prev.map(n => {
      if (n.id !== id) return n;
      const updated = { ...n, ...updates, updatedAt: Date.now() };
      if (updates.content !== undefined) {
        updated.tags = extractTags(updated.content);
        updated.referencedVerses = computeVerseKeys(updated.content);
      }
      return updated;
    }));

    if (user) {
      const note = notes.find(n => n.id === id);
      const content = updates.content ?? note?.content ?? '';
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.content !== undefined) {
        dbUpdates.content = updates.content;
        dbUpdates.tags = extractTags(content);
        dbUpdates.referenced_verses = computeVerseKeys(content);
      }
      if (updates.folderId !== undefined) dbUpdates.folder_id = updates.folderId;
      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from('notes').update(dbUpdates).eq('id', id);
      }
    }
  }, [user, notes]);

  const deleteNote = useCallback(async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (user) {
      await supabase.from('notes').delete().eq('id', id);
    }
  }, [user]);

  // Version history
  const saveVersion = useCallback(async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || !user) return;
    await supabase.from('note_versions').insert({
      note_id: noteId,
      user_id: user.id,
      title: note.title,
      content: note.content,
      tags: note.tags,
      referenced_verses: note.referencedVerses,
    });
    toast.success('Version saved');
  }, [user, notes]);

  const getVersions = useCallback(async (noteId: string): Promise<NoteVersion[]> => {
    if (!user) return [];
    const { data } = await supabase.from('note_versions')
      .select('*')
      .eq('note_id', noteId)
      .order('created_at', { ascending: false });
    return data || [];
  }, [user]);

  const restoreVersion = useCallback(async (noteId: string, version: NoteVersion) => {
    await updateNote(noteId, { title: version.title, content: version.content });
    toast.success('Version restored');
  }, [updateNote]);

  // Folders
  const addFolder = useCallback(async (name: string, parentId?: string | null) => {
    const tempId = crypto.randomUUID();
    const folder: Folder = { id: tempId, name, parent_id: parentId || null };
    setFolders(prev => [...prev, folder]);

    if (user) {
      const { data } = await supabase.from('folders').insert({
        user_id: user.id,
        name,
        parent_id: parentId || null,
      }).select().single();
      if (data) {
        setFolders(prev => prev.map(f => f.id === tempId ? { ...f, id: data.id } : f));
      }
    }
  }, [user]);

  const deleteFolder = useCallback(async (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: null } : n));
    if (user) {
      await supabase.from('folders').delete().eq('id', id);
    }
  }, [user]);

  const renameFolder = useCallback(async (id: string, name: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
    if (user) {
      await supabase.from('folders').update({ name }).eq('id', id);
    }
  }, [user]);

  // Highlights
  const toggleHighlight = useCallback(async (verseKey: string, color: string = 'yellow') => {
    const existing = highlights.find(h => h.verse_key === verseKey);
    if (existing) {
      setHighlights(prev => prev.filter(h => h.verse_key !== verseKey));
      if (user) {
        await supabase.from('highlights').delete().eq('id', existing.id);
      }
    } else {
      const newH: Highlight = { id: crypto.randomUUID(), verse_key: verseKey, color, note: null };
      setHighlights(prev => [...prev, newH]);
      if (user) {
        const { data } = await supabase.from('highlights').insert({
          user_id: user.id,
          verse_key: verseKey,
          color,
        }).select().single();
        if (data) {
          setHighlights(prev => prev.map(h => h.id === newH.id ? { ...h, id: data.id } : h));
        }
      }
    }
  }, [user, highlights]);

  const updateHighlightColor = useCallback(async (verseKey: string, color: string) => {
    setHighlights(prev => prev.map(h => h.verse_key === verseKey ? { ...h, color } : h));
    if (user) {
      await supabase.from('highlights').update({ color }).eq('user_id', user.id).eq('verse_key', verseKey);
    }
  }, [user]);

  const highlightMap = useMemo(() => {
    const map: Record<string, Highlight> = {};
    for (const h of highlights) map[h.verse_key] = h;
    return map;
  }, [highlights]);

  return {
    notes, verseIndex, allTags, folders, highlights, highlightMap,
    addNote, updateNote, deleteNote,
    addFolder, deleteFolder, renameFolder,
    toggleHighlight, updateHighlightColor,
    saveVersion, getVersions, restoreVersion,
    showMergePrompt, mergeLocalNotes, discardLocalNotes,
    setShowMergePrompt,
    loading,
    isGuest,
  };
}

// Local storage helpers for highlights
const HL_KEY = 'logos-study-highlights';
function loadHighlightsLocal(): Highlight[] {
  try {
    const raw = localStorage.getItem(HL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveHighlightsLocal(highlights: Highlight[]): void {
  localStorage.setItem(HL_KEY, JSON.stringify(highlights));
}
