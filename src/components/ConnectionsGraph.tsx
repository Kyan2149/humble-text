import { useMemo, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { Note } from '@/lib/storage';
import { Network, Sliders, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface Props {
  notes: Note[];
  onNoteClick: (id: string) => void;
  onVerseClick: (verseKey: string) => void;
}

interface Node { id: string; type: 'note' | 'verse'; label: string; }
interface Link { source: string; target: string; }

export function ConnectionsGraph({ notes, onNoteClick, onVerseClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [showControls, setShowControls] = useState(false);

  // Force-tunable parameters
  const [charge, setCharge] = useState(-120);     // repulsion (negative)
  const [linkDist, setLinkDist] = useState(60);   // ideal link length
  const [linkStr, setLinkStr] = useState(0.3);    // link spring strength
  const [centerStr, setCenterStr] = useState(0.05); // pull toward center
  const [velDecay, setVelDecay] = useState(0.4);  // friction

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

  // Apply forces whenever sliders change
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const charge_ = fg.d3Force('charge');
    if (charge_ && charge_.strength) charge_.strength(charge);
    const link_ = fg.d3Force('link');
    if (link_) {
      if (link_.distance) link_.distance(linkDist);
      if (link_.strength) link_.strength(linkStr);
    }
    const center_ = fg.d3Force('center');
    if (center_ && center_.strength) center_.strength(centerStr);
    fg.d3VelocityDecay(velDecay);
    fg.d3ReheatSimulation();
  }, [charge, linkDist, linkStr, centerStr, velDecay, data]);

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
        ref={fgRef}
        graphData={data}
        width={size.w}
        height={size.h}
        nodeRelSize={5}
        d3VelocityDecay={velDecay}
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

      <button
        onClick={() => setShowControls(s => !s)}
        className="absolute top-3 right-3 bg-background/90 backdrop-blur border rounded-lg p-2 hover:bg-muted"
        title="Force controls"
      >
        {showControls ? <X className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
      </button>

      {showControls && (
        <div className="absolute top-14 right-3 bg-background/95 backdrop-blur border rounded-lg p-4 w-64 max-w-[calc(100vw-1.5rem)] shadow-lg space-y-4 text-xs">
          <div className="font-semibold text-sm">Force controls</div>

          <ForceSlider label="Repulsion" value={-charge} min={0} max={500} step={10}
            display={String(charge)} onChange={v => setCharge(-v)} />

          <ForceSlider label="Link distance" value={linkDist} min={10} max={300} step={5}
            display={String(linkDist)} onChange={setLinkDist} />

          <ForceSlider label="Link strength" value={Math.round(linkStr * 100)} min={0} max={100} step={1}
            display={linkStr.toFixed(2)} onChange={v => setLinkStr(v / 100)} />

          <ForceSlider label="Center pull" value={Math.round(centerStr * 100)} min={0} max={100} step={1}
            display={centerStr.toFixed(2)} onChange={v => setCenterStr(v / 100)} />

          <ForceSlider label="Friction" value={Math.round(velDecay * 100)} min={5} max={95} step={1}
            display={velDecay.toFixed(2)} onChange={v => setVelDecay(v / 100)} />

          <button
            className="w-full mt-2 px-2 py-1.5 rounded border hover:bg-muted"
            onClick={() => { setCharge(-120); setLinkDist(60); setLinkStr(0.3); setCenterStr(0.05); setVelDecay(0.4); }}
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  );
}

function ForceSlider({ label, value, min, max, step, display, onChange }:
  { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{display}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step}
        onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}
