import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef, useCallback } from 'react';
import type { BibleData } from '@/lib/bibleUtils';
import { parseReferences, getVerseRangeText, getVerseKey } from '@/lib/bibleUtils';
import { autoCorrectChunk } from '@/lib/autoCorrect';

interface Props {
  bible: BibleData | null;
  initialContent: string;
  onChange: (html: string) => void;
  onRefClick: (book: string, chapter: number, verse: number) => void;
  placeholder?: string;
}

// HTML escape
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function TiptapEditor({ bible, initialContent, onChange, onRefClick, placeholder }: Props) {
  const lastEnterRef = useRef<number>(0);
  const lastEnterFromRef = useRef<string>(''); // 'h1'|'h2'|'p'

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing...' }),
    ],
    content: hydrateInitial(initialContent),
    editorProps: {
      handleKeyDown(view, event) {
        // Auto convert "." at start of line to "- "
        if (event.key === '.') {
          const { $from } = view.state.selection;
          if ($from.parentOffset === 0) {
            event.preventDefault();
            view.dispatch(view.state.tr.insertText('- '));
            return true;
          }
        }

        // "/" at start of line -> turn line into heading (h1)
        if (event.key === '/') {
          const ed = (editor as Editor | null);
          const { $from } = view.state.selection;
          if (ed && $from.parentOffset === 0) {
            event.preventDefault();
            ed.chain().focus().setNode('heading', { level: 1 }).run();
            return true;
          }
        }

        // Hierarchy on Enter
        if (event.key === 'Enter' && !event.shiftKey) {
          const ed = (editor as Editor | null);
          if (!ed) return false;
          const { $from } = view.state.selection;
          const node = $from.parent;
          const nodeType = node.type.name;
          const level = nodeType === 'heading' ? node.attrs.level : 0;
          const current = level === 1 ? 'h1' : level === 2 ? 'h2' : 'p';

          const now = Date.now();
          const isDouble = now - lastEnterRef.current < 600 && lastEnterFromRef.current === current && node.content.size === 0;
          lastEnterRef.current = now;
          lastEnterFromRef.current = current;

          let next: 'h1' | 'h2' | 'p';
          if (isDouble) {
            // Double enter rules
            next = current === 'h1' ? 'p' : current === 'h2' ? 'h2' : 'h1';
          } else {
            next = current === 'h1' ? 'h2' : current === 'h2' ? 'p' : 'h2';
          }

          event.preventDefault();
          // Standard Enter split, then set node type
          ed.chain().focus().splitBlock().run();
          if (next === 'h1') ed.chain().focus().setNode('heading', { level: 1 }).run();
          else if (next === 'h2') ed.chain().focus().setNode('heading', { level: 2 }).run();
          else ed.chain().focus().setNode('paragraph').run();
          return true;
        }
        return false;
      },
      handleClick(_view, _pos, event) {
        const target = event.target as HTMLElement;
        const ref = target.closest('[data-verse-ref]') as HTMLElement | null;
        if (ref) {
          const book = ref.dataset.book!;
          const chapter = parseInt(ref.dataset.chapter!, 10);
          const verse = parseInt(ref.dataset.verse!, 10);
          onRefClick(book, chapter, verse);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      // Debounced ref detection
      scheduleRefScan(ed);
      onChange(ed.getHTML());
    },
  });

  // Debounced ref scan — replaces lowercase refs with inline italic verse text, capitalized with clickable ref
  const scanTimerRef = useRef<number | undefined>(undefined);
  const scheduleRefScan = useCallback((ed: Editor) => {
    if (!bible) return;
    if (scanTimerRef.current) window.clearTimeout(scanTimerRef.current);
    scanTimerRef.current = window.setTimeout(() => doRefScan(ed), 350);
  }, [bible]);

  const doRefScan = useCallback((ed: Editor) => {
    if (!bible) return;
    const html = ed.getHTML();
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    let changed = false;

    // Identify the currently-edited top-level block so we DEFER lowercase refs
    // until the caret leaves that line.
    const currentBlockIndex = ed.state.selection.$from.index(0);
    const currentBlockEl = tmp.children[currentBlockIndex] as HTMLElement | undefined;

    const walk = (node: Node) => {
      if (node.nodeType === 3) {
        const parent = node.parentElement;
        if (parent?.closest('[data-verse-inline],[data-verse-ref]')) return;
        const inCurrentBlock = !!(currentBlockEl && currentBlockEl.contains(node));
        const original = node.nodeValue || '';
        const corrected = autoCorrectChunk(original);
        const refs = parseReferences(corrected);
        // Filter: skip lowercase refs if caret is still on this line
        const activeRefs = refs.filter(r => r.isCapitalized || !inCurrentBlock);
        if (activeRefs.length === 0) {
          if (corrected !== original && !inCurrentBlock) {
            node.nodeValue = corrected;
            changed = true;
          }
          return;
        }
        // Build replacement HTML
        let out = '';
        let last = 0;
        for (const r of activeRefs) {
          const idx = corrected.indexOf(r.raw, last);
          if (idx < 0) continue;
          out += esc(corrected.slice(last, idx));
          // Capitalize the displayed reference so it renders as a clickable link.
          const displayRaw = capitalizeRef(r.raw);
          const pill = `<span data-verse-ref data-book="${esc(r.book)}" data-chapter="${r.chapter}" data-verse="${r.verseStart}" class="verse-ref-pill">${esc(displayRaw)}</span>`;
          if (r.isCapitalized) {
            out += pill;
          } else {
            const text = getVerseRangeText(bible, r);
            if (text) {
              out += `${pill}: <span data-verse-inline class="verse-inline">${esc(text)}</span>`;
            } else {
              out += pill;
            }
          }
          last = idx + r.raw.length;
        }
        out += esc(corrected.slice(last));
        const span = document.createElement('span');
        span.innerHTML = out;
        const frag = document.createDocumentFragment();
        while (span.firstChild) frag.appendChild(span.firstChild);
        node.parentNode?.replaceChild(frag, node);
        changed = true;
      } else {
        Array.from(node.childNodes).forEach(walk);
      }
    };
    walk(tmp);

    if (changed) {
      const newHtml = tmp.innerHTML;
      // Avoid infinite loop: only set if differs
      if (newHtml !== html) {
        const { from } = ed.state.selection;
        ed.commands.setContent(newHtml, { emitUpdate: false });
        // Try to restore caret near previous position
        try { ed.commands.setTextSelection(Math.min(from, ed.state.doc.content.size)); } catch {}
        onChange(newHtml);
      }
    }
  }, [bible, onChange]);

  // Reset content if the note id changes (prop change)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== initialContent) {
      editor.commands.setContent(hydrateInitial(initialContent), { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContent.slice(0, 20), editor]);

  return (
    <div className="tiptap-wrap flex-1 overflow-auto">
      <EditorContent editor={editor} className="tiptap-editor" />
    </div>
  );
}

function capitalizeRef(raw: string): string {
  // Uppercase the first alphabetic character (handles "1 cor 13:4" → "1 Cor 13:4")
  let done = false;
  return raw.replace(/[a-zA-Z]/, (c) => {
    if (done) return c;
    done = true;
    return c.toUpperCase();
  });
}

function hydrateInitial(content: string): string {
  if (!content) return '<h1></h1>';
  if (content.trim().startsWith('<')) return content;
  // Plain text → first line as h1, rest as paragraphs
  const lines = content.split('\n');
  const head = lines.shift() || '';
  return `<h1>${esc(head)}</h1>` + lines.map(l => l ? `<p>${esc(l)}</p>` : '<p></p>').join('');
}
