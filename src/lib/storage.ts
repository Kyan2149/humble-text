export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  referencedVerses: string[]; // verse keys like "matthew-5-5"
  createdAt: number;
  updatedAt: number;
  folderId?: string | null;
}

const NOTES_KEY = 'logos-study-notes';

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNotes(notes: Note[]): void {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function createNote(title: string = 'Untitled Note'): Note {
  return {
    id: crypto.randomUUID(),
    title,
    content: '',
    tags: [],
    referencedVerses: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function buildVerseIndex(notes: Note[]): Record<string, string[]> {
  const index: Record<string, string[]> = {};
  for (const note of notes) {
    for (const vk of note.referencedVerses) {
      if (!index[vk]) index[vk] = [];
      if (!index[vk].includes(note.id)) index[vk].push(note.id);
    }
  }
  return index;
}

export function extractTags(content: string): string[] {
  const matches = content.match(/#[a-zA-Z]\w*/g);
  return matches ? [...new Set(matches)] : [];
}
