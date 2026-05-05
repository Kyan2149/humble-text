import { useMemo, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { Note } from '@/lib/storage';
import { Network } from 'lucide-react';

interface Props {
  notes: Note[];
  onNoteClick: (id: string) => void;
  onVerseClick: (verseKey: string) => void;
}

interface Node { id: string; type: 'note' | 'verse'; label: string; }
interface Link { source: string; target: string; }

export function ConnectionsGraph({ notes, onNoteClick, onVerseClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setSize({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const data = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const verseSet = new Set<string>();
    for (const n of notes) {
      nodes.push({ id: 'n:' + n.id, type: 'note', label: n.title || 'Untitled' });
      for (const vk of n.referencedVerses) {
        if (!verseSet.has(vk)) {
          verseSet.add(vk);
          nodes.push({ id: 'v:' + vk, type: 'verse', label: vk.replace(/-/g, ' ') });
        }
        links.push({ source: 'n:' + n.id, target: 'v:' + vk });
      }
    }
    return { nodes, links };
  }, [notes]);

  if (data.nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
        <Network className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">No connections yet. Reference verses in your notes to build the web.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 relative bg-card overflow-hidden">
      <ForceGraph2D
        graphData={data}
        width={size.w}
        height={size.h}
        nodeRelSize={5}
        linkColor={() => 'rgba(180,140,90,0.3)'}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const isNote = node.type === 'note';
          const r = isNote ? 6 : 4;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = isNote ? 'hsl(30, 60%, 42%)' : 'hsl(210, 60%, 50%)';
          ctx.fill();
          if (globalScale > 1.2) {
            ctx.font = `${10 / globalScale + 4}px sans-serif`;
            ctx.fillStyle = 'hsl(30, 15%, 25%)';
            ctx.textAlign = 'center';
            ctx.fillText(node.label.slice(0, 30), node.x, node.y + r + 8);
          }
        }}
        onNodeClick={(node: any) => {
          if (node.type === 'note') onNoteClick(node.id.slice(2));
          else onVerseClick(node.id.slice(2));
        }}
      />
      <div className="absolute top-3 left-3 bg-background/90 backdrop-blur rounded-lg px-3 py-2 text-xs space-y-1 border">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary" /> Notes</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{background: 'hsl(210,60%,50%)'}} /> Verses</div>
      </div>
    </div>
  );
}
