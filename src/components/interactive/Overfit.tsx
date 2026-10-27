import { useMemo, useState } from 'react';
import { fitPoly, evalPoly, makeGeneralizationData } from '@/lib/generalization.mjs';
import { Axis, HALO, Slider, Widget, linear, palette, path, useWidth } from './chart';

export default function Overfit() {
  const [deg, setDeg] = useState(3);
  const [reg, setReg] = useState(0);
  const { train, test } = useMemo(makeGeneralizationData, []);
  const lambda = reg === 0 ? 0 : 10 ** (reg - 6);
  const errs = useMemo(() => Array.from({ length: 12 }, (_, d) => {
    const w = fitPoly(train.map((p) => p[0]), train.map((p) => p[1]), d, lambda);
    const mse = (pts: [number, number][]) => pts.reduce((s, [x, y]) => s + (evalPoly(w, x) - y) ** 2, 0) / pts.length;
    return [mse(train), mse(test)] as [number, number];
  }), [train, test, lambda]);
  const w = fitPoly(train.map((p) => p[0]), train.map((p) => p[1]), deg, lambda);

  const [ref, width] = useWidth<HTMLDivElement>(640);
  const half = width >= 620;
  const W1 = half ? Math.round(width * 0.58) : width, H1 = 250;
  const x = linear(-1.8, 1.8, 30, W1 - 10), y = linear(-2.4, 2.4, H1 - 20, 10);
  const curve = Array.from({ length: 200 }, (_, i) => { const xv = -1.7 + (i / 199) * 3.4; return [x(xv), y(Math.max(-3, Math.min(3, evalPoly(w, xv))))] as [number, number]; });
  const W2 = half ? width - W1 - 16 : width, H2 = 250;
  const ex = linear(0, 11, 46, W2 - 10), ey = log10Scale(H2);

  return (
    <Widget title="Memorizing versus learning" kicker="Interactive · model complexity"
      note={<>Degree 1 underfits. Degree 11 threads every training point and fails on new data: training error falls while test error climbs.</>}>
      <div ref={ref} style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <svg viewBox={`0 0 ${W1} ${H1}`} width={W1} style={{ background: 'var(--bg-soft)', borderRadius: 'var(--radius)', maxWidth: '100%' }} role="img" aria-label="Polynomial fit">
          {test.map(([a, b], i) => <circle key={`t${i}`} cx={x(a)} cy={y(b)} r={3} style={{ fill: palette[1], opacity: 0.35 }} />)}
          <path d={path(curve)} style={{ fill: 'none', stroke: palette[0], strokeWidth: 3 }} />
          {train.map(([a, b], i) => <circle key={i} cx={x(a)} cy={y(b)} r={4.5} style={{ fill: 'var(--fg)' }} />)}
        </svg>
        <svg viewBox={`0 0 ${W2} ${H2}`} width={W2} style={{ background: 'var(--bg-soft)', borderRadius: 'var(--radius)', maxWidth: '100%' }} role="img" aria-label="Error versus model complexity">
          <Axis scale={ex} orient="bottom" at={H2 - 44} length={[46, W2 - 10]} ticks={[1, 3, 5, 7, 9, 11]} label="polynomial degree" />
          <path d={path(errs.slice(1).map(([tr], d) => [ex(d + 1), ey(tr)]))} style={{ fill: 'none', stroke: 'var(--fg)', strokeWidth: 2 }} />
          <path d={path(errs.slice(1).map(([, te], d) => [ex(d + 1), ey(te)]))} style={{ fill: 'none', stroke: palette[1], strokeWidth: 2.5 }} />
          <line x1={ex(deg)} x2={ex(deg)} y1={10} y2={H2 - 44} style={{ stroke: palette[0], strokeDasharray: '4 3' }} />
          <text x={52} y={22} style={{ fontSize: 11, fill: palette[1], ...HALO }}>error on new data</text>
          <text x={52} y={38} style={{ fontSize: 11, fill: 'var(--fg)', ...HALO }}>error on training data</text>
          <text x={10} y={H2 / 2} style={{ fontSize: 10.5, fill: 'var(--fg-3)' }} transform={`rotate(-90 14 ${H2 / 2})`}>error (log)</text>
        </svg>
      </div>
      <div className="controls">
        <Slider label="Model complexity (degree)" value={deg} min={1} max={11} step={1} onChange={setDeg} display={String(deg)} />
        <Slider label="Regularization" value={reg} min={0} max={6} step={1} onChange={setReg} display={reg === 0 ? 'off' : `λ = 10^${reg - 6}`} />
      </div>
      <div className="row small muted tabular" style={{ marginTop: 12, gap: 20 }}>
        <span>Training error: <strong style={{ color: 'var(--fg)' }}>{errs[deg][0].toFixed(3)}</strong></span>
        <span>Error on new data: <strong style={{ color: errs[deg][1] > 0.25 ? 'var(--bad)' : 'var(--good)' }}>{errs[deg][1].toFixed(3)}</strong></span>
      </div>
    </Widget>
  );
}

function log10Scale(H: number) {
  const lo = Math.log10(0.01), hi = Math.log10(10);
  return (v: number) => {
    const lv = Math.log10(Math.max(0.01, Math.min(10, v)));
    return H - 44 - ((lv - lo) / (hi - lo)) * (H - 54);
  };
}
