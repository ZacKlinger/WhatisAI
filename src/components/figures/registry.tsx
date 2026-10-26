import type { ReactNode } from 'react';
import type { FigureSpec } from '@/lib/items';
import { Axis, fmtPow10, linear, log, palette, path } from '@/components/interactive/chart';

export interface FigureProps {
  selected?: string | null;
  onSelect?: (id: string) => void;
  /** Region id to reveal as correct. */
  reveal?: string;
  [k: string]: unknown;
}

/** A clickable region of a figure, used by hotspot questions. */
function Region({ id, children, fp, label }: { id: string; children: ReactNode; fp: FigureProps; label: string }) {
  const interactive = !!fp.onSelect;
  const isSel = fp.selected === id;
  const isAns = fp.reveal === id;
  const isWrongSel = fp.reveal !== undefined && isSel && !isAns;
  return (
    <g
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? label : undefined}
      aria-pressed={interactive ? isSel : undefined}
      onClick={() => fp.onSelect?.(id)}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          fp.onSelect?.(id);
        }
      }}
      style={{ cursor: interactive ? 'pointer' : 'default', outline: 'none' }}
      className={`fig-region${interactive ? ' is-interactive' : ''}`}
      data-state={isAns ? 'answer' : isWrongSel ? 'wrong' : isSel ? 'selected' : undefined}
    >
      {children}
    </g>
  );
}

function hl(fp: FigureProps, id: string) {
  const isSel = fp.selected === id;
  const isAns = fp.reveal === id;
  const isWrongSel = fp.reveal !== undefined && isSel && !isAns;
  return {
    fill: isAns ? 'var(--good)' : isWrongSel ? 'var(--bad)' : 'var(--fg)',
    opacity: isAns || isWrongSel ? 0.18 : isSel ? 0.12 : 0,
    stroke: isAns ? 'var(--good)' : isWrongSel ? 'var(--bad)' : isSel ? 'var(--fg)' : 'none',
  };
}

function HL({ fp, id, x, y, w, h, r = 10 }: { fp: FigureProps; id: string; x: number; y: number; w: number; h: number; r?: number }) {
  const s = hl(fp, id);
  return (
    <rect className="hl" x={x} y={y} width={w} height={h} rx={r}
      style={{ fill: s.fill, fillOpacity: undefined, opacity: s.opacity || undefined, transition: 'opacity .2s' }} />
  );
}

function Ring({ fp, id, x, y, w, h, r = 10 }: { fp: FigureProps; id: string; x: number; y: number; w: number; h: number; r?: number }) {
  const s = hl(fp, id);
  if (s.stroke === 'none') return null;
  return <rect x={x} y={y} width={w} height={h} rx={r} style={{ fill: 'none', stroke: s.stroke, strokeWidth: 2, pointerEvents: 'none' }} />;
}

function Frame({ children, w = 640, h = 300, label }: { children: ReactNode; w?: number; h?: number; label: string }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={label} style={{ maxHeight: 420, overflow: 'visible' }}>
      {children}
    </svg>
  );
}

const T = { fill: 'var(--fg-2)', fontSize: 12 } as const;
const TB = { fill: 'var(--fg)', fontSize: 13, fontWeight: 600 } as const;

/* ---------------- loss curves ---------------- */
function LossCurves(fp: FigureProps) {
  const W = 640, H = 300, m = { l: 56, r: 16, t: 16, b: 44 };
  const x = linear(0, 100, m.l, W - m.r);
  const y = linear(0, 2.6, H - m.b, m.t);
  const train = Array.from({ length: 101 }, (_, i) => [x(i), y(0.15 + 2.2 * Math.exp(-i / 18))] as [number, number]);
  const val = Array.from({ length: 101 }, (_, i) => [x(i), y(0.55 + 2.0 * Math.exp(-i / 16) + 0.000085 * Math.max(0, i - 32) ** 2.2)] as [number, number]);
  const regions: [string, number, number, string][] = [
    ['early', 0, 24, 'Early training'],
    ['sweet', 24, 48, 'Validation minimum'],
    ['late', 48, 100, 'Late training'],
  ];
  return (
    <Frame label="Training and validation loss over time" w={W} h={H}>
      <Axis scale={y} orient="left" at={m.l} length={[H - m.b, m.t]} label="loss" grid={W - m.r} ticks={[0, 0.5, 1, 1.5, 2, 2.5]} />
      <Axis scale={x} orient="bottom" at={H - m.b} length={[m.l, W - m.r]} label="training steps →" ticks={[0, 25, 50, 75, 100]} />
      {regions.map(([id, a, b, label]) => (
        <Region key={id} id={id} fp={fp} label={label}>
          <HL fp={fp} id={id} x={x(a)} y={m.t} w={x(b) - x(a)} h={H - m.b - m.t} r={6} />
          <rect x={x(a)} y={m.t} width={x(b) - x(a)} height={H - m.b - m.t} style={{ fill: 'transparent' }} />
          <Ring fp={fp} id={id} x={x(a)} y={m.t} w={x(b) - x(a)} h={H - m.b - m.t} r={6} />
        </Region>
      ))}
      <path d={path(train)} style={{ fill: 'none', stroke: palette[0], strokeWidth: 2.5, pointerEvents: 'none' }} />
      <path d={path(val)} style={{ fill: 'none', stroke: palette[1], strokeWidth: 2.5, pointerEvents: 'none' }} />
      <text x={x(80)} y={y(0.38)} style={{ ...T, fill: palette[0], pointerEvents: 'none' }}>training loss</text>
      <text x={x(76)} y={y(1.55)} style={{ ...T, fill: palette[1], pointerEvents: 'none' }}>validation loss</text>
    </Frame>
  );
}

/* ---------------- transformer block ---------------- */
function TransformerBlock(fp: FigureProps) {
  const W = 640, H = 420;
  const box = (id: string, label: string, sub: string, x0: number, y0: number, w: number, h: number, color: string) => (
    <Region id={id} fp={fp} label={label} key={id}>
      <rect x={x0} y={y0} width={w} height={h} rx={12} style={{ fill: `color-mix(in srgb, ${color} 16%, var(--bg-elev))`, stroke: `color-mix(in srgb, ${color} 55%, transparent)` }} />
      <HL fp={fp} id={id} x={x0} y={y0} w={w} h={h} r={12} />
      <text x={x0 + w / 2} y={y0 + h / 2 - 3} textAnchor="middle" style={TB}>{label}</text>
      <text x={x0 + w / 2} y={y0 + h / 2 + 14} textAnchor="middle" style={{ ...T, fontSize: 11 }}>{sub}</text>
      <Ring fp={fp} id={id} x={x0 - 3} y={y0 - 3} w={w + 6} h={h + 6} r={14} />
    </Region>
  );
  const cx = 300;
  return (
    <Frame label="Diagram of a transformer" w={W} h={H}>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--fg-3)' }} />
        </marker>
      </defs>
      {/* residual stream */}
      <Region id="residual" fp={fp} label="Residual stream">
        <rect x={cx - 14} y={46} width={28} height={300} rx={14} style={{ fill: 'transparent' }} />
        <HL fp={fp} id="residual" x={cx - 14} y={46} w={28} h={300} r={14} />
        <line x1={cx} y1={346} x2={cx} y2={52} style={{ stroke: 'var(--fg-3)', strokeWidth: 3 }} markerEnd="url(#arr)" />
        <text x={cx - 22} y={200} textAnchor="end" style={{ ...T, fontSize: 11 }} transform={`rotate(-90 ${cx - 22} 200)`}>residual stream</text>
        <Ring fp={fp} id="residual" x={cx - 16} y={44} w={32} h={304} r={16} />
      </Region>
      {box('embed', 'Embedding', 'tokens → vectors', cx - 90, 356, 180, 52, palette[5])}
      {box('norm', 'LayerNorm', 'rescale', cx + 40, 270, 120, 44, palette[2])}
      {box('attention', 'Attention', 'mix information across positions', cx + 40, 196, 250, 58, palette[0])}
      {box('mlp', 'MLP', 'transform each position', cx + 40, 108, 250, 58, palette[3])}
      {box('unembed', 'Unembedding', 'vector → next-token probabilities', cx - 120, 0, 240, 40, palette[4])}
      <path d={`M${cx},292 H${cx + 40}`} style={{ stroke: 'var(--fg-3)', fill: 'none' }} />
      <path d={`M${cx + 100},270 V254`} style={{ stroke: 'var(--fg-3)', fill: 'none' }} markerEnd="url(#arr)" />
      <path d={`M${cx + 40},225 H${cx + 8}`} style={{ stroke: 'var(--fg-3)', fill: 'none' }} markerEnd="url(#arr)" />
      <path d={`M${cx + 40},137 H${cx + 8}`} style={{ stroke: 'var(--fg-3)', fill: 'none' }} markerEnd="url(#arr)" />
      <text x={cx + 300} y={190} style={{ ...T, fontSize: 11 }} textAnchor="end">× N layers</text>
      <text x={30} y={230} style={{ ...T, fontSize: 11, maxWidth: 200 }}>each sublayer reads from</text>
      <text x={30} y={246} style={{ ...T, fontSize: 11 }}>and adds back into the stream</text>
    </Frame>
  );
}

/* ---------------- EU AI Act risk pyramid ---------------- */
function RiskPyramid(fp: FigureProps) {
  const W = 640, H = 340;
  const tiers: [string, string, string, string][] = [
    ['unacceptable', 'Unacceptable risk', 'prohibited', palette[4]],
    ['high', 'High risk', 'strict obligations', palette[1]],
    ['limited', 'Limited risk', 'transparency duties', palette[5]],
    ['minimal', 'Minimal risk', 'no new obligations', palette[2]],
  ];
  const top = 20, bottom = 320, cx = W / 2, half = 260;
  const hh = (bottom - top) / tiers.length;
  return (
    <Frame label="EU AI Act risk pyramid" w={W} h={H}>
      {tiers.map(([id, label, sub, color], i) => {
        const y0 = top + i * hh, y1 = y0 + hh - 4;
        const w0 = (half * (y0 - top)) / (bottom - top) + 30, w1 = (half * (y1 - top)) / (bottom - top) + 30;
        const s = hl(fp, id);
        const d = `M${cx - w0},${y0} L${cx + w0},${y0} L${cx + w1},${y1} L${cx - w1},${y1} Z`;
        return (
          <Region key={id} id={id} fp={fp} label={label}>
            <path d={d} style={{ fill: `color-mix(in srgb, ${color} 26%, var(--bg-elev))`, stroke: s.stroke !== 'none' ? s.stroke : `color-mix(in srgb, ${color} 60%, transparent)`, strokeWidth: s.stroke !== 'none' ? 2.5 : 1 }} />
            <path className="hl" d={d} style={{ fill: s.fill, opacity: s.opacity || undefined }} />
            <text x={cx} y={(y0 + y1) / 2 - 2} textAnchor="middle" style={TB}>{label}</text>
            <text x={cx} y={(y0 + y1) / 2 + 15} textAnchor="middle" style={{ ...T, fontSize: 11 }}>{sub}</text>
          </Region>
        );
      })}
    </Frame>
  );
}

/* ---------------- scaling: log-log ---------------- */
function ScalingLogLog(fp: FigureProps) {
  const W = 640, H = 300, m = { l: 60, r: 20, t: 16, b: 46 };
  const x = log(1e18, 1e26, m.l, W - m.r);
  const y = log(1.6, 6, H - m.b, m.t);
  const L = (c: number) => 1.69 + 1070 * c ** -0.155;
  const pts = [1e19, 1e20, 1e21, 1e22, 1e23, 1e24, 1e25].map((c, i) => [c, L(c) * (1 + (i % 2 ? 0.015 : -0.012))] as [number, number]);
  const fit = Array.from({ length: 60 }, (_, i) => {
    const c = 10 ** (18 + (i / 59) * 8);
    return [x(c), y(L(c))] as [number, number];
  });
  const showLinearY = fp.linearY === true;
  return (
    <Frame label="Loss falls as a power law in compute" w={W} h={H}>
      <Axis scale={y} orient="left" at={m.l} length={[H - m.b, m.t]} label={showLinearY ? 'loss' : 'loss (log scale)'} grid={W - m.r} ticks={[2, 3, 4, 5, 6]} />
      <Axis scale={x} orient="bottom" at={H - m.b} length={[m.l, W - m.r]} label="training compute, FLOP (log scale)" format={fmtPow10} />
      <path d={path(fit)} style={{ fill: 'none', stroke: palette[3], strokeWidth: 2, strokeDasharray: '5 4' }} />
      {pts.map(([c, l], i) => <circle key={i} cx={x(c)} cy={y(l)} r={5} style={{ fill: palette[0] }} />)}
    </Frame>
  );
}

/* ---------------- calibration curve ---------------- */
function Calibration(fp: FigureProps) {
  const W = 360, H = 320, m = { l: 52, r: 16, t: 16, b: 46 };
  const x = linear(0.5, 1, m.l, W - m.r);
  const y = linear(0.3, 1, H - m.b, m.t);
  const curve = (fp.curve as [number, number][]) ?? [[0.5, 0.48], [0.6, 0.5], [0.7, 0.55], [0.8, 0.6], [0.9, 0.64], [0.99, 0.7]];
  return (
    <Frame label="Calibration curve" w={W} h={H}>
      <Axis scale={y} orient="left" at={m.l} length={[H - m.b, m.t]} label="fraction actually correct" grid={W - m.r} ticks={[0.4, 0.6, 0.8, 1]} format={(v) => `${Math.round(v * 100)}%`} />
      <Axis scale={x} orient="bottom" at={H - m.b} length={[m.l, W - m.r]} label="stated confidence" ticks={[0.5, 0.6, 0.7, 0.8, 0.9, 1]} format={(v) => `${Math.round(v * 100)}%`} />
      <line x1={x(0.5)} y1={y(0.5)} x2={x(1)} y2={y(1)} style={{ stroke: 'var(--fg-3)', strokeDasharray: '4 4' }} />
      <text x={x(0.8)} y={y(0.84)} style={{ ...T, fontSize: 10.5 }} transform={`rotate(-38 ${x(0.8)} ${y(0.84)})`}>perfect calibration</text>
      <path d={path(curve.map(([a, b]) => [x(a), y(b)]))} style={{ fill: 'none', stroke: palette[1], strokeWidth: 2.5 }} />
      {curve.map(([a, b], i) => <circle key={i} cx={x(a)} cy={y(b)} r={4} style={{ fill: palette[1] }} />)}
    </Frame>
  );
}

/* ---------------- benchmark saturation ---------------- */
function Saturation(_: FigureProps) {
  const W = 640, H = 280, m = { l: 52, r: 110, t: 16, b: 44 };
  const x = linear(0, 6, m.l, W - m.r);
  const y = linear(0, 100, H - m.b, m.t);
  const s = (k: number, t0: number) => (t: number) => 100 / (1 + Math.exp(-k * (t - t0)));
  const series: [string, (t: number) => number, string][] = [
    ['Benchmark A', s(2.2, 1.2), palette[0]],
    ['Benchmark B', s(1.8, 2.8), palette[1]],
    ['Benchmark C', s(1.5, 4.6), palette[2]],
  ];
  return (
    <Frame label="Benchmarks saturating over time" w={W} h={H}>
      <Axis scale={y} orient="left" at={m.l} length={[H - m.b, m.t]} label="best score (%)" grid={W - m.r} ticks={[0, 25, 50, 75, 100]} />
      <Axis scale={x} orient="bottom" at={H - m.b} length={[m.l, W - m.r]} label="years since benchmark introduced" ticks={[0, 1, 2, 3, 4, 5, 6]} />
      <line x1={m.l} x2={W - m.r} y1={y(90)} y2={y(90)} style={{ stroke: 'var(--fg-3)', strokeDasharray: '3 4' }} />
      <text x={W - m.r + 6} y={y(90)} dy="0.32em" style={{ ...T, fontSize: 10.5 }}>human expert</text>
      {series.map(([name, f, c]) => (
        <g key={name}>
          <path d={path(Array.from({ length: 61 }, (_, i) => [x(i / 10), y(Math.max(2, f(i / 10)))] as [number, number]))} style={{ fill: 'none', stroke: c, strokeWidth: 2.5 }} />
          <text x={W - m.r + 6} y={y(f(6)) + (name.endsWith('A') ? -10 : name.endsWith('B') ? 4 : 18)} style={{ ...T, fill: c, fontSize: 11 }}>{name}</text>
        </g>
      ))}
    </Frame>
  );
}

/* ---------------- confidence intervals ---------------- */
function ErrorBars(fp: FigureProps) {
  const W = 520, H = 220, m = { l: 120, r: 30, t: 20, b: 40 };
  const rows = (fp.rows as [string, number, number][]) ?? [['Model A', 71, 4], ['Model B', 74, 4]];
  const x = linear(55, 90, m.l, W - m.r);
  const band = (H - m.t - m.b) / rows.length;
  return (
    <Frame label="Two scores with 95% confidence intervals" w={W} h={H}>
      <Axis scale={x} orient="bottom" at={H - m.b} length={[m.l, W - m.r]} label="accuracy (%) with 95% CI" grid={m.t} ticks={[60, 70, 80, 90]} />
      {rows.map(([name, v, e], i) => {
        const cy = m.t + band * (i + 0.5);
        return (
          <g key={name}>
            <text x={m.l - 12} y={cy} dy="0.32em" textAnchor="end" style={TB}>{name}</text>
            <line x1={x(v - e)} x2={x(v + e)} y1={cy} y2={cy} style={{ stroke: palette[i], strokeWidth: 3 }} />
            <line x1={x(v - e)} x2={x(v - e)} y1={cy - 8} y2={cy + 8} style={{ stroke: palette[i], strokeWidth: 2 }} />
            <line x1={x(v + e)} x2={x(v + e)} y1={cy - 8} y2={cy + 8} style={{ stroke: palette[i], strokeWidth: 2 }} />
            <circle cx={x(v)} cy={cy} r={6} style={{ fill: palette[i] }} />
            <text x={x(v)} y={cy - 14} textAnchor="middle" style={{ ...T, fontSize: 11 }}>{v}%</text>
          </g>
        );
      })}
    </Frame>
  );
}

/* ---------------- compute trend (sourced data) ---------------- */
export const COMPUTE_POINTS: { name: string; year: number; flop: number; est: boolean }[] = [
  { name: 'AlexNet', year: 2012.7, flop: 4.7e17, est: true },
  { name: 'GPT-2', year: 2019.1, flop: 1.5e21, est: true },
  { name: 'GPT-3', year: 2020.4, flop: 3.14e23, est: false },
  { name: 'Chinchilla', year: 2022.2, flop: 5.76e23, est: false },
  { name: 'PaLM', year: 2022.3, flop: 2.5e24, est: false },
  { name: 'GPT-4', year: 2023.2, flop: 2.1e25, est: true },
  { name: 'Llama 3.1 405B', year: 2024.5, flop: 3.8e25, est: false },
];

function ComputeTrend(fp: FigureProps) {
  const W = 640, H = 320, m = { l: 60, r: 24, t: 18, b: 46 };
  const x = linear(2012, 2026, m.l, W - m.r);
  const y = log(1e17, 1e27, H - m.b, m.t);
  const showThresholds = fp.thresholds !== false;
  return (
    <Frame label="Training compute of notable models over time, log scale" w={W} h={H}>
      <Axis scale={y} orient="left" at={m.l} length={[H - m.b, m.t]} label="training FLOP (log)" grid={W - m.r} format={fmtPow10} ticks={[1e17, 1e19, 1e21, 1e23, 1e25, 1e27]} />
      <Axis scale={x} orient="bottom" at={H - m.b} length={[m.l, W - m.r]} ticks={[2012, 2014, 2016, 2018, 2020, 2022, 2024, 2026]} />
      {showThresholds && (
        <g>
          <line x1={m.l} x2={W - m.r} y1={y(1e25)} y2={y(1e25)} style={{ stroke: palette[4], strokeDasharray: '4 4' }} />
          <text x={m.l + 6} y={y(1e25) - 6} style={{ ...T, fill: palette[4], fontSize: 10.5 }}>10²⁵: EU AI Act systemic-risk presumption</text>
          <line x1={m.l} x2={W - m.r} y1={y(1e26)} y2={y(1e26)} style={{ stroke: palette[1], strokeDasharray: '4 4' }} />
          <text x={m.l + 6} y={y(1e26) - 6} style={{ ...T, fill: palette[1], fontSize: 10.5 }}>10²⁶: California SB 53 "frontier model"</text>
        </g>
      )}
      {COMPUTE_POINTS.map((p) => (
        <g key={p.name}>
          <circle cx={x(p.year)} cy={y(p.flop)} r={5.5} style={{ fill: p.est ? 'var(--bg)' : palette[0], stroke: palette[0], strokeWidth: 2 }} />
          <text x={x(p.year) + 9} y={y(p.flop) + 4} style={{ ...T, fontSize: 11 }}>{p.name}</text>
        </g>
      ))}
      <text x={W - m.r} y={H - 4} textAnchor="end" style={{ ...T, fontSize: 10 }}>● disclosed in paper · ○ third-party estimate (Epoch AI)</text>
    </Frame>
  );
}

/* ---------------- 1D loss landscape ---------------- */
function Landscape(fp: FigureProps) {
  const W = 640, H = 260, m = { l: 30, r: 20, t: 20, b: 30 };
  const f = (t: number) => 0.6 * Math.sin(2.4 * t) + 0.12 * (t - 0.4) ** 2 + 1.6;
  const x = linear(-3.2, 3.6, m.l, W - m.r);
  const y = linear(0.4, 3.6, H - m.b, m.t);
  const pts = Array.from({ length: 200 }, (_, i) => { const t = -3.2 + (i / 199) * 6.8; return [x(t), y(f(t))] as [number, number]; });
  const marks: [string, number, string][] = [['A', -1.95, 'Point A'], ['B', 0.65, 'Point B'], ['C', 1.95, 'Point C']];
  return (
    <Frame label="A one-dimensional loss landscape" w={W} h={H}>
      <path d={path(pts)} style={{ fill: 'none', stroke: palette[0], strokeWidth: 2.5 }} />
      {marks.map(([id, t, label]) => {
        const s = hl(fp, id);
        return (
          <Region key={id} id={id} fp={fp} label={label}>
            <circle cx={x(t)} cy={y(f(t))} r={22} style={{ fill: 'transparent' }} />
            <circle cx={x(t)} cy={y(f(t))} r={9} style={{ fill: s.stroke !== 'none' ? s.stroke : palette[1] }} />
            <text x={x(t)} y={y(f(t)) - 16} textAnchor="middle" style={TB}>{id}</text>
          </Region>
        );
      })}
      <text x={m.l} y={H - 6} style={{ ...T, fontSize: 11 }}>parameter value →</text>
      <text x={m.l} y={14} style={{ ...T, fontSize: 11 }}>↑ loss</text>
    </Frame>
  );
}

/* ---------------- generic document anatomy ---------------- */
function DocAnatomy(fp: FigureProps) {
  const sections = (fp.sections as { id: string; label: string; h: number; lines?: number }[]) ?? [];
  const title = (fp.title as string) ?? 'Document';
  const W = 520;
  let yy = 70;
  const blocks = sections.map((s) => {
    const b = { ...s, y: yy };
    yy += s.h + 10;
    return b;
  });
  const H = yy + 20;
  return (
    <Frame label={`Anatomy of a ${title}`} w={W} h={H}>
      <rect x={10} y={10} width={W - 20} height={H - 20} rx={14} style={{ fill: 'var(--bg-elev)', stroke: 'var(--line-2)' }} />
      <rect x={40} y={30} width={260} height={14} rx={4} style={{ fill: 'var(--fg)', opacity: 0.8 }} />
      <text x={W - 40} y={42} textAnchor="end" style={{ ...T, fontSize: 11 }}>{title}</text>
      {blocks.map((b) => (
        <Region key={b.id} id={b.id} fp={fp} label={b.label}>
          <rect x={30} y={b.y} width={W - 60} height={b.h} rx={8} style={{ fill: 'var(--bg-soft)' }} />
          <HL fp={fp} id={b.id} x={30} y={b.y} w={W - 60} h={b.h} r={8} />
          {Array.from({ length: b.lines ?? Math.max(1, Math.floor((b.h - 24) / 12)) }, (_, i) => (
            <rect key={i} x={44} y={b.y + 26 + i * 12} width={(W - 100) * (0.6 + ((i * 37) % 40) / 100)} height={5} rx={2.5} style={{ fill: 'var(--line-2)' }} />
          ))}
          <text x={44} y={b.y + 17} style={{ ...T, fontSize: 11.5, fill: 'var(--fg)' }}>{b.label}</text>
          <Ring fp={fp} id={b.id} x={28} y={b.y - 2} w={W - 56} h={b.h + 4} r={9} />
        </Region>
      ))}
    </Frame>
  );
}

/* ---------------- pipeline (stages) ---------------- */
function Pipeline(fp: FigureProps) {
  const stages = (fp.stages as { id: string; label: string; sub: string }[]) ?? [];
  const W = 680, H = 150, gap = 18;
  const w = (W - gap * (stages.length - 1) - 20) / stages.length;
  return (
    <Frame label="A pipeline of stages" w={W} h={H}>
      {stages.map((s, i) => {
        const x0 = 10 + i * (w + gap);
        return (
          <g key={s.id}>
            <Region id={s.id} fp={fp} label={s.label}>
              <rect x={x0} y={30} width={w} height={90} rx={14} style={{ fill: `color-mix(in srgb, ${palette[i % 6]} 15%, var(--bg-elev))`, stroke: `color-mix(in srgb, ${palette[i % 6]} 50%, transparent)` }} />
              <HL fp={fp} id={s.id} x={x0} y={30} w={w} h={90} r={14} />
              <text x={x0 + w / 2} y={68} textAnchor="middle" style={TB}>{s.label}</text>
              <text x={x0 + w / 2} y={88} textAnchor="middle" style={{ ...T, fontSize: 10.5 }}>{s.sub}</text>
              <Ring fp={fp} id={s.id} x={x0 - 3} y={27} w={w + 6} h={96} r={16} />
            </Region>
            {i < stages.length - 1 && <path d={`M${x0 + w + 3},75 l${gap - 6},0`} style={{ stroke: 'var(--fg-3)', strokeWidth: 2 }} />}
          </g>
        );
      })}
    </Frame>
  );
}

/* ---------------- attention heatmap ---------------- */
function AttentionMap(fp: FigureProps) {
  const tokens = (fp.tokens as string[]) ?? [];
  const weights = (fp.weights as number[]) ?? [];
  const query = (fp.query as number) ?? tokens.length - 1;
  const W = 680, H = 150;
  const cw = (W - 20) / tokens.length;
  return (
    <Frame label="Attention weights from one token to the others" w={W} h={H}>
      {tokens.map((t, i) => {
        const id = `tok-${i}`;
        const s = hl(fp, id);
        const wgt = weights[i] ?? 0;
        return (
          <Region key={id} id={id} fp={fp} label={t}>
            <rect x={10 + i * cw + 2} y={40} width={cw - 4} height={50} rx={8}
              style={{ fill: `color-mix(in srgb, var(--c1) ${Math.round(wgt * 100)}%, var(--bg-soft))`, stroke: s.stroke !== 'none' ? s.stroke : i === query ? 'var(--fg)' : 'var(--line)', strokeWidth: s.stroke !== 'none' || i === query ? 2 : 1 }} />
            <text x={10 + i * cw + cw / 2} y={70} textAnchor="middle" style={{ ...TB, fontSize: 12.5, fill: wgt > 0.55 ? '#fff' : 'var(--fg)' }}>{t}</text>
            {fp.showWeights !== false && <text x={10 + i * cw + cw / 2} y={110} textAnchor="middle" style={{ ...T, fontSize: 10.5 }}>{wgt ? wgt.toFixed(2) : ''}</text>}
          </Region>
        );
      })}
      <text x={10} y={24} style={{ ...T, fontSize: 11 }}>Outlined token is the query. Shading shows how much attention it pays to each token.</text>
    </Frame>
  );
}

/* ---------------- superposition arrows ---------------- */
function SuperpositionFig(fp: FigureProps) {
  const n = (fp.n as number) ?? 5;
  const W = 300, H = 300, c = 150, r = 110;
  return (
    <Frame label={`${n} features packed into 2 dimensions`} w={W} h={H}>
      <circle cx={c} cy={c} r={r} style={{ fill: 'none', stroke: 'var(--line-2)', strokeDasharray: '3 5' }} />
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        return (
          <g key={i}>
            <line x1={c} y1={c} x2={c + r * Math.cos(a)} y2={c + r * Math.sin(a)} style={{ stroke: palette[i % 6], strokeWidth: 3 }} />
            <circle cx={c + r * Math.cos(a)} cy={c + r * Math.sin(a)} r={6} style={{ fill: palette[i % 6] }} />
            <text x={c + (r + 18) * Math.cos(a)} y={c + (r + 18) * Math.sin(a)} dy="0.32em" textAnchor="middle" style={TB}>f{i + 1}</text>
          </g>
        );
      })}
    </Frame>
  );
}

/* ---------------- productivity forest plot (sourced) ---------------- */
export const PRODUCTIVITY_STUDIES: { study: string; setting: string; effect: number; label: string; src: string }[] = [
  { study: 'Brynjolfsson, Li & Raymond', setting: 'Customer support agents (field study)', effect: 14, label: '+14% issues resolved per hour', src: 'QJE 2025' },
  { study: 'Noy & Zhang', setting: 'Professional writing tasks (experiment)', effect: 40, label: '−40% time taken', src: 'Science 2023' },
  { study: 'Dell’Acqua et al. (BCG)', setting: 'Consulting tasks inside the frontier', effect: 25.1, label: '25.1% faster', src: 'HBS WP 2023' },
  { study: 'Peng et al.', setting: 'Coding task with GitHub Copilot (RCT)', effect: 55.8, label: '55.8% faster', src: 'arXiv 2023' },
  { study: 'METR (Becker et al.)', setting: 'Experienced open-source developers (RCT)', effect: -19, label: '19% slower', src: 'arXiv 2025' },
];

function Forest(_: FigureProps) {
  const W = 680, rowH = 46, m = { l: 300, r: 30, t: 20, b: 40 };
  const H = m.t + m.b + rowH * PRODUCTIVITY_STUDIES.length;
  const x = linear(-30, 60, m.l, W - m.r);
  return (
    <Frame label="Effect sizes from AI productivity studies" w={W} h={H}>
      <Axis scale={x} orient="bottom" at={H - m.b} length={[m.l, W - m.r]} grid={m.t} ticks={[-20, 0, 20, 40, 60]} format={(v) => `${v > 0 ? '+' : ''}${v}%`} label="speed or throughput gain (as reported)" />
      <line x1={x(0)} x2={x(0)} y1={m.t} y2={H - m.b} style={{ stroke: 'var(--fg-3)' }} />
      {PRODUCTIVITY_STUDIES.map((s, i) => {
        const cy = m.t + rowH * (i + 0.5);
        const color = s.effect < 0 ? palette[4] : palette[0];
        return (
          <g key={s.study}>
            <text x={10} y={cy - 5} style={{ ...TB, fontSize: 12 }}>{s.study}</text>
            <text x={10} y={cy + 11} style={{ ...T, fontSize: 10.5 }}>{s.setting}</text>
            <line x1={x(0)} x2={x(s.effect)} y1={cy} y2={cy} style={{ stroke: color, strokeWidth: 8, strokeLinecap: 'round', opacity: 0.85 }} />
            <text x={x(s.effect) + (s.effect < 0 ? -8 : 8)} y={cy} dy="0.32em" textAnchor={s.effect < 0 ? 'end' : 'start'} style={{ ...T, fontSize: 10.5 }}>{s.label}</text>
          </g>
        );
      })}
    </Frame>
  );
}

/* ---------------- Economic Index occupation shares (sourced) ---------------- */
export const AEI_2025: [string, number][] = [
  ['Computer & mathematical', 37.2],
  ['Arts & media', 10.3],
  ['Education & library', 9.3],
  ['Office & administrative', 7.9],
  ['Life, physical & social science', 6.4],
  ['Business & financial', 5.9],
];

function AEIBars(_: FigureProps) {
  const W = 640, rowH = 34, m = { l: 230, r: 50, t: 10, b: 30 };
  const H = m.t + m.b + rowH * AEI_2025.length;
  const x = linear(0, 40, m.l, W - m.r);
  return (
    <Frame label="Share of Claude conversations by occupational category" w={W} h={H}>
      {AEI_2025.map(([name, v], i) => {
        const cy = m.t + rowH * (i + 0.5);
        return (
          <g key={name}>
            <text x={m.l - 10} y={cy} dy="0.32em" textAnchor="end" style={{ ...T, fill: 'var(--fg)' }}>{name}</text>
            <rect x={m.l} y={cy - 11} width={x(v) - m.l} height={22} rx={6} style={{ fill: i === 0 ? palette[0] : `color-mix(in srgb, ${palette[0]} 55%, var(--bg-muted))` }} />
            <text x={x(v) + 8} y={cy} dy="0.32em" style={{ ...T, fontSize: 11.5 }}>{v}%</text>
          </g>
        );
      })}
      <text x={m.l} y={H - 6} style={{ ...T, fontSize: 10 }}>Source: Anthropic Economic Index, February 2025 (share of conversations mapped to O*NET tasks)</text>
    </Frame>
  );
}

/* ---------------- neural network diagram ---------------- */
function NetDiagram(fp: FigureProps) {
  const layers = (fp.layers as number[]) ?? [3, 4, 4, 2];
  const W = 560, H = 260;
  const xs = layers.map((_, i) => 60 + (i * (W - 120)) / (layers.length - 1));
  const ys = (n: number) => Array.from({ length: n }, (_, j) => H / 2 + (j - (n - 1) / 2) * 52);
  const ids = ['input', ...layers.slice(1, -1).map((_, i) => `hidden${i}`), 'output'];
  return (
    <Frame label="A small neural network" w={W} h={H}>
      <Region id="weights" fp={fp} label="Connections (weights)">
        {layers.slice(0, -1).map((n, i) =>
          ys(n).flatMap((y0, a) => ys(layers[i + 1]).map((y1, b) => (
            <line key={`${i}-${a}-${b}`} x1={xs[i]} y1={y0} x2={xs[i + 1]} y2={y1}
              style={{ stroke: fp.reveal === 'weights' ? 'var(--good)' : fp.selected === 'weights' ? 'var(--fg)' : 'var(--line-3)', strokeWidth: 6, strokeOpacity: 0.001 }} />
          ))),
        )}
        {layers.slice(0, -1).map((n, i) =>
          ys(n).flatMap((y0, a) => ys(layers[i + 1]).map((y1, b) => (
            <line key={`v${i}-${a}-${b}`} x1={xs[i]} y1={y0} x2={xs[i + 1]} y2={y1}
              style={{ stroke: fp.reveal === 'weights' ? 'var(--good)' : fp.selected === 'weights' ? 'var(--fg)' : 'var(--line-3)', strokeWidth: 1.2, pointerEvents: 'none' }} />
          ))),
        )}
      </Region>
      {layers.map((n, i) => {
        const id = ids[i];
        const s = hl(fp, id);
        return (
          <Region key={id} id={id} fp={fp} label={id === 'input' ? 'Input layer' : id === 'output' ? 'Output layer' : 'Hidden layer'}>
            <rect x={xs[i] - 26} y={ys(n)[0] - 26} width={52} height={ys(n)[n - 1] - ys(n)[0] + 52} rx={26} style={{ fill: 'transparent', stroke: s.stroke, strokeWidth: 2 }} />
            {ys(n).map((y, j) => <circle key={j} cx={xs[i]} cy={y} r={14} style={{ fill: `color-mix(in srgb, ${palette[i % 6]} 30%, var(--bg-elev))`, stroke: palette[i % 6], strokeWidth: 2 }} />)}
          </Region>
        );
      })}
    </Frame>
  );
}

/* ---------------- jagged frontier ---------------- */
function JaggedFrontier(fp: FigureProps) {
  const W = 560, H = 300, c = { x: 280, y: 150 };
  const pts = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const r = 100 + ((i * 53) % 7) * 11 - (i % 3 === 0 ? 30 : 0);
    return [c.x + r * Math.cos(a), c.y + r * 0.8 * Math.sin(a)] as [number, number];
  });
  const d = path([...pts, pts[0]]) + 'Z';
  const tasks: [string, number, number, string][] = [
    ['in1', c.x - 30, c.y - 20, 'Draft a market memo'],
    ['in2', c.x + 40, c.y + 30, 'Summarize interviews'],
    ['out1', c.x + 128, c.y - 92, 'Diagnose a subtle data error'],
    ['in3', c.x - 70, c.y + 50, 'Brainstorm product names'],
  ];
  return (
    <Frame label="The jagged frontier of AI capability" w={W} h={H}>
      <path d={d} style={{ fill: 'color-mix(in srgb, var(--c3) 16%, transparent)', stroke: 'var(--c3)', strokeWidth: 2 }} />
      <text x={c.x} y={c.y + 4} textAnchor="middle" style={{ ...T, fontSize: 11 }}>inside the frontier</text>
      {tasks.map(([id, x0, y0, label]) => {
        const s = hl(fp, id);
        return (
          <Region key={id} id={id} fp={fp} label={label}>
            <circle cx={x0} cy={y0} r={16} style={{ fill: 'transparent' }} />
            <circle cx={x0} cy={y0} r={7} style={{ fill: s.stroke !== 'none' ? s.stroke : 'var(--fg)' }} />
            <text x={x0 + 12} y={y0 - 10} style={{ ...T, fontSize: 11, fill: 'var(--fg)' }}>{label}</text>
          </Region>
        );
      })}
    </Frame>
  );
}

/* ---------------- softmax bars ---------------- */
function Bars(fp: FigureProps) {
  const labels = (fp.labels as string[]) ?? [];
  const values = (fp.values as number[]) ?? [];
  const W = 560, rowH = 30, m = { l: 110, r: 60, t: 6, b: 6 };
  const H = m.t + m.b + rowH * labels.length;
  const max = Math.max(...values, 1e-9);
  const x = linear(0, (fp.max as number) ?? max, m.l, W - m.r);
  return (
    <Frame label="Bar chart" w={W} h={H}>
      {labels.map((l, i) => {
        const cy = m.t + rowH * (i + 0.5);
        return (
          <g key={l}>
            <text x={m.l - 10} y={cy} dy="0.32em" textAnchor="end" style={{ ...T, fill: 'var(--fg)', fontFamily: 'var(--font-mono)' }}>{l}</text>
            <rect x={m.l} y={cy - 10} width={Math.max(1, x(values[i]) - m.l)} height={20} rx={5} style={{ fill: palette[i % 6] }} />
            <text x={x(values[i]) + 8} y={cy} dy="0.32em" style={{ ...T, fontSize: 11 }}>{(fp.format as string) === 'pct' ? `${(values[i] * 100).toFixed(1)}%` : values[i]}</text>
          </g>
        );
      })}
    </Frame>
  );
}

/* ---------------- exponential on two axes ---------------- */
function ExpTwoAxes(_: FigureProps) {
  const W = 680, H = 250, m = { t: 26, b: 40 };
  const data = Array.from({ length: 11 }, (_, i) => [i, 4 ** i] as [number, number]);
  const left = { l: 50, r: 320 }, right = { l: 400, r: 670 };
  const x1 = linear(0, 10, left.l, left.r), y1 = linear(0, 4 ** 10, H - m.b, m.t);
  const x2 = linear(0, 10, right.l, right.r), y2 = log(1, 4 ** 10 * 2, H - m.b, m.t);
  return (
    <Frame label="The same exponential on linear and log axes" w={W} h={H}>
      <text x={left.l} y={14} style={TB}>Linear axis</text>
      <text x={right.l} y={14} style={TB}>Log axis</text>
      <line x1={left.l} x2={left.r} y1={H - m.b} y2={H - m.b} style={{ stroke: 'var(--line-3)' }} />
      <line x1={left.l} x2={left.l} y1={m.t} y2={H - m.b} style={{ stroke: 'var(--line-3)' }} />
      <line x1={right.l} x2={right.r} y1={H - m.b} y2={H - m.b} style={{ stroke: 'var(--line-3)' }} />
      <Axis scale={y2} orient="left" at={right.l} length={[H - m.b, m.t]} format={fmtPow10} ticks={[1, 1e2, 1e4, 1e6]} grid={right.r} />
      <path d={path(data.map(([a, b]) => [x1(a), y1(b)]))} style={{ fill: 'none', stroke: palette[0], strokeWidth: 2.5 }} />
      <path d={path(data.map(([a, b]) => [x2(a), y2(b)]))} style={{ fill: 'none', stroke: palette[0], strokeWidth: 2.5 }} />
      {data.map(([a, b]) => <circle key={a} cx={x2(a)} cy={y2(b)} r={3.5} style={{ fill: palette[0] }} />)}
      <text x={(left.l + left.r) / 2} y={H - 12} textAnchor="middle" style={{ ...T, fontSize: 11 }}>years →</text>
      <text x={(right.l + right.r) / 2} y={H - 12} textAnchor="middle" style={{ ...T, fontSize: 11 }}>years →</text>
    </Frame>
  );
}

export const figures: Record<string, (p: FigureProps) => ReactNode> = {
  'loss-curves': LossCurves,
  'transformer-block': TransformerBlock,
  'risk-pyramid': RiskPyramid,
  'scaling-loglog': ScalingLogLog,
  calibration: Calibration,
  saturation: Saturation,
  'error-bars': ErrorBars,
  'compute-trend': ComputeTrend,
  landscape: Landscape,
  'doc-anatomy': DocAnatomy,
  pipeline: Pipeline,
  'attention-map': AttentionMap,
  superposition: SuperpositionFig,
  forest: Forest,
  'aei-bars': AEIBars,
  'net-diagram': NetDiagram,
  'jagged-frontier': JaggedFrontier,
  bars: Bars,
  'exp-two-axes': ExpTwoAxes,
};

export function Figure({ spec, selected, onSelect, reveal }: { spec: FigureSpec; selected?: string | null; onSelect?: (id: string) => void; reveal?: string }) {
  const F = figures[spec.id];
  if (!F) return <div className="empty small">Missing figure: {spec.id}</div>;
  return (
    <div className="figure-frame" style={{ background: 'var(--bg-soft)', borderRadius: 'var(--radius)', padding: '14px 12px' }}>
      {F({ ...(spec.props ?? {}), selected, onSelect, reveal })}
    </div>
  );
}

/** Standalone figure for use directly in lessons. */
export default function StaticFigure({ id, caption, ...props }: { id: string; caption?: string; [k: string]: unknown }) {
  return (
    <figure className="not-prose" style={{ margin: '2em 0' }}>
      <Figure spec={{ id, props }} />
      {caption && <figcaption style={{ fontSize: '0.86rem', color: 'var(--fg-2)', marginTop: 10 }}>{caption}</figcaption>}
    </figure>
  );
}
