import { useEffect, useRef, useState, type ReactNode } from 'react';

export type Scale = ((v: number) => number) & { invert: (px: number) => number; ticks: (n?: number) => number[] };

export function linear(d0: number, d1: number, r0: number, r1: number): Scale {
  const f = ((v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0)) as Scale;
  f.invert = (px) => d0 + ((px - r0) / (r1 - r0)) * (d1 - d0);
  f.ticks = (n = 5) => niceTicks(d0, d1, n);
  return f;
}

export function log(d0: number, d1: number, r0: number, r1: number): Scale {
  const l0 = Math.log10(d0);
  const l1 = Math.log10(d1);
  const f = ((v: number) => r0 + ((Math.log10(v) - l0) / (l1 - l0)) * (r1 - r0)) as Scale;
  f.invert = (px) => 10 ** (l0 + ((px - r0) / (r1 - r0)) * (l1 - l0));
  f.ticks = () => {
    const out: number[] = [];
    const step = Math.max(1, Math.ceil((Math.ceil(l1) - Math.floor(l0)) / 7));
    for (let e = Math.ceil(l0); e <= Math.floor(l1); e += step) out.push(10 ** e);
    return out;
  };
  return f;
}

export function niceTicks(a: number, b: number, n = 5): number[] {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const span = hi - lo || 1;
  const raw = span / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1.5 ? 2 : 1) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(Math.round(v / step) * step);
  return out;
}

export function sup(e: number): string {
  const map: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  return String(e).split('').map((c) => map[c] ?? c).join('');
}

export function fmtPow10(v: number): string {
  const e = Math.round(Math.log10(v));
  if (e >= -2 && e <= 3) return String(10 ** e);
  return `10${sup(e)}`;
}

export function fmtNum(v: number, digits = 2): string {
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a >= 1e4 || a < 1e-3) {
    const e = Math.floor(Math.log10(a));
    return `${(v / 10 ** e).toFixed(1)}×10${sup(e)}`;
  }
  return Number(v.toFixed(digits)).toString();
}

/** Track the rendered width of a container so SVG charts stay crisp and responsive. */
export function useWidth<T extends HTMLElement>(fallback = 640): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

interface AxisProps {
  scale: Scale;
  orient: 'bottom' | 'left';
  at: number;
  length: [number, number];
  ticks?: number[];
  format?: (v: number) => string;
  label?: string;
  grid?: number;
}

export function Axis({ scale, orient, at, length, ticks, format = (v) => String(v), label, grid }: AxisProps) {
  const ts = ticks ?? scale.ticks(5);
  const textStyle = { fill: 'var(--fg-3)', fontSize: 11 } as const;
  if (orient === 'bottom') {
    return (
      <g>
        <line x1={length[0]} x2={length[1]} y1={at} y2={at} style={{ stroke: 'var(--line-3)' }} />
        {ts.map((t) => (
          <g key={t} transform={`translate(${scale(t)},${at})`}>
            {grid !== undefined && <line y1={0} y2={grid - at} style={{ stroke: 'var(--grid)' }} />}
            <line y2={4} style={{ stroke: 'var(--line-3)' }} />
            <text y={17} textAnchor="middle" style={textStyle}>{format(t)}</text>
          </g>
        ))}
        {label && <text x={(length[0] + length[1]) / 2} y={at + 34} textAnchor="middle" style={{ fill: 'var(--fg-2)', fontSize: 11.5 }}>{label}</text>}
      </g>
    );
  }
  return (
    <g>
      <line y1={length[0]} y2={length[1]} x1={at} x2={at} style={{ stroke: 'var(--line-3)' }} />
      {ts.map((t) => (
        <g key={t} transform={`translate(${at},${scale(t)})`}>
          {grid !== undefined && <line x1={0} x2={grid - at} style={{ stroke: 'var(--grid)' }} />}
          <line x2={-4} style={{ stroke: 'var(--line-3)' }} />
          <text x={-8} dy="0.32em" textAnchor="end" style={textStyle}>{format(t)}</text>
        </g>
      ))}
      {label && (
        <text transform={`translate(${at - 44},${(length[0] + length[1]) / 2}) rotate(-90)`} textAnchor="middle" style={{ fill: 'var(--fg-2)', fontSize: 11.5 }}>{label}</text>
      )}
    </g>
  );
}

export function Widget({ title, kicker, children, note }: { title: string; kicker?: string; children: ReactNode; note?: ReactNode }) {
  return (
    <div className="widget not-prose">
      <div className="widget-head">
        <div className="widget-title">{title}</div>
        {kicker && <div className="widget-kicker">{kicker}</div>}
      </div>
      {children}
      {note && <div className="widget-note">{note}</div>}
    </div>
  );
}

export function Slider({ label, value, min, max, step = 0.01, onChange, display }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; display?: string;
}) {
  return (
    <div className="control">
      <label>
        <span>{label}</span>
        <output>{display ?? value}</output>
      </label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
    </div>
  );
}

export const palette = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];

export function path(points: [number, number][]): string {
  return points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('');
}

/** Gaussian noise from a seeded RNG, for deterministic demos. */
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  const next = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
  const normal = () => {
    const u = Math.max(1e-9, next());
    const v = next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return { next, normal };
}
