import { useMemo, useState } from 'react';
import { useHydrated, useProgress } from '@/lib/useProgress';
import { isDone, type ModuleStatus } from '@/lib/progress';

export interface CMod { id: string; title: string; track: string; order: number; prerequisites: string[] }
export interface CTrack { id: string; numeral: string; title: string }

interface Props {
  modules: CMod[];
  tracks: CTrack[];
  base: string;
  /** Override statuses (used to animate placement results). */
  statusOverride?: Record<string, ModuleStatus>;
  highlight?: string[];
  compact?: boolean;
}

const TRACK_COLORS = ['#f2a65a', '#5b8cff', '#2fbf8f', '#9b7bff', '#ff7a59', '#3fb8d0', '#ff6fa3', '#d9a521', '#6f8fff', '#e86fd1'];

/** Break a track title into lines short enough to fit its column. */
function wrapTitle(title: string, max = 12): string[] {
  const lines: string[] = [];
  for (const word of title.split(' ')) {
    const last = lines[lines.length - 1];
    if (last && (last + ' ' + word).length <= max) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

export default function Constellation({ modules, tracks, base, statusOverride, highlight = [], compact }: Props) {
  const progress = useProgress();
  const hydrated = useHydrated();
  const [hover, setHover] = useState<string | null>(null);

  const W = 1200;
  const colW = W / tracks.length;
  const layout = useMemo(() => {
    const pos: Record<string, { x: number; y: number; t: number }> = {};
    tracks.forEach((t, ti) => {
      const mods = modules.filter((m) => m.track === t.id).sort((a, b) => a.order - b.order);
      const cx = colW * ti + colW / 2;
      const offset = Math.sin(ti * 1.3) * 26;
      mods.forEach((m, i) => {
        const jitter = Math.sin((ti + 1) * (i + 2) * 2.17) * (colW * 0.22);
        pos[m.id] = { x: cx + jitter, y: 108 + offset + i * (compact ? 40 : 50), t: ti };
      });
    });
    return pos;
  }, [modules, tracks, colW, compact]);
  const H = Math.max(...Object.values(layout).map((p) => p.y)) + 50;

  const statusOf = (id: string): ModuleStatus | undefined => statusOverride?.[id] ?? (hydrated ? progress.modules[id]?.status : undefined);
  const nextUp = useMemo(() => {
    if (!hydrated && !statusOverride) return null;
    const sorted = modules.slice().sort((a, b) => (a.track === b.track ? a.order - b.order : a.track.localeCompare(b.track)));
    return sorted.find((m) => !isDone(statusOf(m.id)))?.id ?? null;
  }, [modules, progress, hydrated, statusOverride]);

  const hovered = hover ? modules.find((m) => m.id === hover) : null;

  return (
    <div style={{ position: 'relative' }} className="scroll-x">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 960, display: 'block' }} role="img" aria-label="Constellation map of every module">
        <defs>
          <radialGradient id="cst-glow">
            <stop offset="0" stopColor="white" stopOpacity="0.9" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        {tracks.map((t, ti) => (
          <g key={t.id}>
            <text x={colW * ti + colW / 2} y={20} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--fg-3)', letterSpacing: '0.04em' }}>{t.numeral}</text>
            <text x={colW * ti + colW / 2} y={37} textAnchor="middle" style={{ fontSize: 12, fill: 'var(--fg-2)', fontWeight: 550 }}>
              {wrapTitle(t.title).map((line, li) => <tspan key={li} x={colW * ti + colW / 2} dy={li ? 14 : 0}>{line}</tspan>)}
            </text>
          </g>
        ))}
        {/* prerequisite edges */}
        {modules.flatMap((m) => m.prerequisites.filter((p) => layout[p]).map((p) => {
          const a = layout[p], b = layout[m.id];
          const lit = hover === m.id || hover === p;
          const mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - 30;
          return (
            <path key={`${p}-${m.id}`} d={`M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`}
              style={{ fill: 'none', stroke: lit ? 'var(--fg)' : 'var(--line-2)', strokeWidth: lit ? 1.5 : 1, opacity: lit ? 0.8 : a.t === b.t ? 0.9 : 0.45, transition: 'all .25s' }} />
          );
        }))}
        {modules.map((m) => {
          const p = layout[m.id];
          const s = statusOf(m.id);
          const color = TRACK_COLORS[p.t % TRACK_COLORS.length];
          const done = isDone(s);
          const r = done ? 8 : s === 'started' ? 7 : 5.5;
          const isNext = nextUp === m.id;
          const isHl = highlight.includes(m.id);
          return (
            <a key={m.id} href={`${base}/learn/${m.id}/`} onMouseEnter={() => setHover(m.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(m.id)} onBlur={() => setHover(null)} aria-label={m.title}>
              {(done || isHl) && <circle cx={p.x} cy={p.y} r={r * 3.2} style={{ fill: color, opacity: 0.18 }} />}
              {isNext && <circle cx={p.x} cy={p.y} r={14} style={{ fill: 'none', stroke: 'var(--fg)', strokeWidth: 1.5, strokeDasharray: '3 3' }}>
                <animateTransform attributeName="transform" type="rotate" from={`0 ${p.x} ${p.y}`} to={`360 ${p.x} ${p.y}`} dur="12s" repeatCount="indefinite" />
              </circle>}
              <circle cx={p.x} cy={p.y} r={r}
                style={{
                  fill: done ? color : s === 'started' ? `color-mix(in srgb, ${color} 45%, var(--bg))` : 'var(--bg)',
                  stroke: s === 'placed' ? 'var(--c4)' : color, strokeWidth: done ? 0 : 2, transition: 'all .4s',
                }} />
              {s === 'mastered' && <circle cx={p.x} cy={p.y} r={2.6} style={{ fill: 'var(--bg)' }} />}
              <circle cx={p.x} cy={p.y} r={18} style={{ fill: 'transparent', cursor: 'pointer' }} />
            </a>
          );
        })}
      </svg>
      {hovered && (
        <div style={{
          position: 'absolute', pointerEvents: 'none', left: `${(layout[hovered.id].x / W) * 100}%`, top: `${(layout[hovered.id].y / H) * 100}%`,
          transform: 'translate(-50%, calc(-100% - 18px))', background: 'var(--bg-inverse)', color: 'var(--fg-inverse)', padding: '6px 10px', borderRadius: 8, fontSize: 12.5, whiteSpace: 'nowrap', zIndex: 2, boxShadow: 'var(--shadow)',
        }}>
          {hovered.title}{statusOf(hovered.id) ? ` · ${statusOf(hovered.id)}` : ''}
        </div>
      )}
      {!compact && (
        <div className="row xsmall muted" style={{ justifyContent: 'center', gap: 18, marginTop: 8 }}>
          <span className="row" style={{ gap: 6 }}><span className="status-dot" /> not started</span>
          <span className="row" style={{ gap: 6 }}><span className="status-dot started" /> in progress</span>
          <span className="row" style={{ gap: 6 }}><span className="status-dot completed" /> completed</span>
          <span className="row" style={{ gap: 6 }}><span className="status-dot mastered" /> mastered</span>
          <span className="row" style={{ gap: 6 }}><span className="status-dot placed" /> placed out</span>
          <span className="row" style={{ gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px dashed var(--fg)' }} /> next up</span>
        </div>
      )}
    </div>
  );
}
