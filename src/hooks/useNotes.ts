import { useState, useCallback, useEffect, useMemo } from 'react';
import { Note, loadNotes, saveNotes, createNote, buildVerseIndex, extractTags } from '@/lib/storage';
import { parseReferences, getVerseKey } from '@/lib/bibleUtils';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  const verseIndex = useMemo(() => buildVerseIndex(notes), [notes]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [notes]);

  const addNote = useCallback(() => {
    const note = createNote();
    setNotes(prev => [note, ...prev]);
    return note;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => {
    setNotes(prev => prev.map(n => {
      if (n.id !== id) return n;
      const updated = { ...n, ...updates, updatedAt: Date.now() };
      // Re-extract tags and references
      const tags = extractTags(updated.content);
      const refs = parseReferences(updated.content);
      const verseKeys: string[] = [];
      for (const ref of refs) {
        for (let v = ref.verseStart; v <= ref.verseEnd; v++) {
          verseKeys.push(getVerseKey(ref.book, ref.chapter, v));
        }
      }
      updated.tags = tags;
      updated.referencedVerses = [...new Set(verseKeys)];
      return updated;
    }));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  return { notes, verseIndex, allTags, addNote, updateNote, deleteNote };
}
