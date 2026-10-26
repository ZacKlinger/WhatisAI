import type { CalibrationPoint } from '@/lib/progress';
import { brier } from '@/lib/progress';
import { Axis, linear, palette, path } from './chart';

const LEVELS = [0.5, 0.7, 0.9, 0.99];

export function calibrationBins(points: CalibrationPoint[]) {
  return LEVELS.map((c) => {
    const pts = points.filter((p) => Math.abs(p.c - c) < 0.001);
    return { c, n: pts.length, acc: pts.length ? pts.filter((p) => p.ok).length / pts.length : null };
  });
}

export default function CalibrationChart({ points, size = 320 }: { points: CalibrationPoint[]; size?: number }) {
  const W = size, H = size, m = { l: 62, r: 14, t: 14, b: 44 };
  const x = linear(0.45, 1, m.l, W - m.r);
  const y = linear(0, 1, H - m.b, m.t);
  const bins = calibrationBins(points).filter((b) => b.acc !== null);
  const b = brier(points);
  const maxN = Math.max(1, ...bins.map((bb) => bb.n));
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: size }} role="img" aria-label="Your calibration">
        <Axis scale={y} orient="left" at={m.l} length={[H - m.b, m.t]} grid={W - m.r} ticks={[0, 0.25, 0.5, 0.75, 1]} format={(v) => `${v * 100}%`} label="actually correct" />
        <Axis scale={x} orient="bottom" at={H - m.b} length={[m.l, W - m.r]} ticks={LEVELS} format={(v) => String(Math.round(v * 100))} label="your stated confidence (%)" />
        <line x1={x(0.45)} y1={y(0.45)} x2={x(1)} y2={y(1)} style={{ stroke: 'var(--fg-3)', strokeDasharray: '4 4' }} />
        {bins.length > 1 && <path d={path(bins.map((bb) => [x(bb.c), y(bb.acc!)]))} style={{ fill: 'none', stroke: palette[0], strokeWidth: 2.5 }} />}
        {bins.map((bb) => (
          <g key={bb.c}>
            <circle cx={x(bb.c)} cy={y(bb.acc!)} r={4 + (bb.n / maxN) * 7} style={{ fill: palette[0], opacity: 0.85 }} />
            <text x={x(bb.c)} y={y(bb.acc!) - 14} textAnchor="middle" style={{ fontSize: 10.5, fill: 'var(--fg-2)' }}>n={bb.n}</text>
          </g>
        ))}
      </svg>
      <div className="small muted" style={{ marginTop: 6 }}>
        {points.length ? (
          <>Brier score <strong style={{ color: 'var(--fg)' }}>{b.toFixed(3)}</strong> across {points.length} answers (0 is perfect; always saying 50% scores 0.25). Points above the dashed line mean you were underconfident; below it, overconfident.</>
        ) : 'Wager on your answers to build this chart.'}
      </div>
    </div>
  );
}
