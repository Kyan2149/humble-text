import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { Mark, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { useEffect, useRef, useCallback } from 'react';
import { ImagePlus, Camera } from 'lucide-react';
import type { BibleData } from '@/lib/bibleUtils';
import { parseReferences, getVerseRangeText } from '@/lib/bibleUtils';
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

const VerseRefMark = Mark.create({
  name: 'verseRef',
  inclusive: false,
  addAttributes() {
    return {
      book: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-book'),
        renderHTML: (attributes) => attributes.book ? { 'data-book': attributes.book } : {},
      },
      chapter: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-chapter'),
        renderHTML: (attributes) => attributes.chapter ? { 'data-chapter': attributes.chapter } : {},
      },
      verse: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-verse'),
        renderHTML: (attributes) => attributes.verse ? { 'data-verse': attributes.verse } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-verse-ref]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-verse-ref': '', class: 'verse-ref-pill' }, HTMLAttributes), 0];
  },
});

const VerseInlineMark = Mark.create({
  name: 'verseInline',
  inclusive: false,
  parseHTML() {
    return [{ tag: 'span[data-verse-inline]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-verse-inline': '', class: 'verse-inline' }, HTMLAttributes), 0];
  },
});

export function TiptapEditor({ bible, initialContent, onChange, onRefClick, placeholder }: Props) {
  const lastEnterRef = useRef<number>(0);
  const lastEnterFromRef = useRef<string>(''); // 'h1'|'h2'|'p'
  const lastBlockIndexRef = useRef<number>(-1);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing...' }),
      Image.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: 'note-image' } }),
      VerseRefMark,
      VerseInlineMark,
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

        // "/" at start of empty line -> cycle node type
        // 1st `/` => h1, `//` => h2 (subheading), `///` => paragraph (body)
        // Useful on phones where Shift+Enter is unavailable.
        if (event.key === '/') {
          const ed = (editor as Editor | null);
          const { $from } = view.state.selection;
          const node = $from.parent;
          if (ed && $from.parentOffset === 0 && node.content.size === 0) {
            event.preventDefault();
            const nodeType = node.type.name;
            const level = nodeType === 'heading' ? node.attrs.level : 0;
            const current = level === 1 ? 'h1' : level === 2 ? 'h2' : 'p';
            const next = current === 'p' ? 'h1' : current === 'h1' ? 'h2' : 'p';
            if (next === 'h1') ed.chain().focus().setNode('heading', { level: 1 }).run();
            else if (next === 'h2') ed.chain().focus().setNode('heading', { level: 2 }).run();
            else ed.chain().focus().setNode('paragraph').run();
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
    onSelectionUpdate: ({ editor: ed }) => {
      // When caret moves to a different top-level block, run a scan so that
      // refs left behind in the previous block get processed (turned into links
      // / inline verse text). This is needed because onUpdate only fires on
      // content changes, not pure caret movement.
      try {
        const idx = ed.state.selection.$from.index(0);
        if (idx !== lastBlockIndexRef.current) {
          lastBlockIndexRef.current = idx;
          scheduleRefScan(ed);
        }
      } catch {}
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
      // Skip the entire block the caret is currently in — defer all processing
      // (autoCorrect + ref replacement) until the user moves to another line.
      // This prevents setContent from disrupting active typing (e.g. spurious
      // new lines while writing in a subheading).
      if (currentBlockEl && (node === currentBlockEl || (node.nodeType === 1 && currentBlockEl.contains(node as HTMLElement)))) {
        return;
      }
      if (node.nodeType === 3) {
        const parent = node.parentElement;
        if (parent?.closest('[data-verse-inline],[data-verse-ref]')) return;
        if (currentBlockEl && currentBlockEl.contains(node)) return;
        const original = node.nodeValue || '';
        const corrected = autoCorrectChunk(original);
        const refs = parseReferences(corrected);
        const activeRefs = refs;
        if (activeRefs.length === 0) {
          if (corrected !== original) {
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const insertImageFromFile = useCallback(async (file: File) => {
    if (!editor || !file.type.startsWith('image/')) return;
    try {
      const dataUrl = await compressImage(file, 1600, 0.85);
      editor.chain().focus().setImage({ src: dataUrl }).run();
    } catch (e) {
      console.error('Image insert failed', e);
    }
  }, [editor]);

  // Paste & drop image support
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of Array.from(items)) {
        if (it.type.startsWith('image/')) {
          const f = it.getAsFile();
          if (f) { e.preventDefault(); insertImageFromFile(f); return; }
        }
      }
    };
    const onDrop = (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
      if (imgs.length) { e.preventDefault(); imgs.forEach(insertImageFromFile); }
    };
    dom.addEventListener('paste', onPaste);
    dom.addEventListener('drop', onDrop);
    return () => {
      dom.removeEventListener('paste', onPaste);
      dom.removeEventListener('drop', onDrop);
    };
  }, [editor, insertImageFromFile]);

  return (
    <div className="tiptap-wrap flex-1 overflow-auto relative">
      <div className="sticky top-0 z-10 flex gap-2 px-2 py-1 bg-background/80 backdrop-blur border-b border-border">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-muted text-muted-foreground"
          title="Insert image"
        >
          <ImagePlus className="w-4 h-4" /> Image
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-muted text-muted-foreground"
          title="Take photo"
        >
          <Camera className="w-4 h-4" /> Camera
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            files.forEach(insertImageFromFile);
            e.target.value = '';
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            files.forEach(insertImageFromFile);
            e.target.value = '';
          }}
        />
      </div>
      <EditorContent editor={editor} className="tiptap-editor" />
    </div>
  );
}

async function compressImage(file: File, maxDim: number, quality: number): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  // Skip compression for small images or non-rasterizable types
  if (file.size < 200 * 1024 || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return dataUrl;
  }
  return new Promise<string>((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
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
