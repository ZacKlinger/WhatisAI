import { useState } from 'react';
import { Slider, Widget, palette } from './chart';

const PRESETS: Record<string, [number, number, number, number]> = {
  Identity: [1, 0, 0, 1],
  'Scale ×2': [2, 0, 0, 2],
  'Rotate 45°': [Math.SQRT1_2, -Math.SQRT1_2, Math.SQRT1_2, Math.SQRT1_2],
  Shear: [1, 0.8, 0, 1],
  Stretch: [1.6, 0, 0, 0.6],
  Collapse: [1, 1, 0.5, 0.5],
};

// The letter F, so orientation and reflection are visible.
const SHAPE: [number, number][] = [[0, 0], [0, 2], [1.2, 2], [1.2, 1.6], [0.4, 1.6], [0.4, 1.2], [1, 1.2], [1, 0.8], [0.4, 0.8], [0.4, 0]];

export default function MatrixTransform() {
  const [m, setM] = useState<[number, number, number, number]>([1, 0, 0, 1]);
  const [a, b, c, d] = m;
  const S = 300;
  const unit = 34;
  const o = S / 2;
  const tx = (x: number, y: number): [number, number] => [o + (a * x + b * y) * unit, o - (c * x + d * y) * unit];
  const det = a * d - b * c;

  const grid: string[] = [];
  for (let i = -4; i <= 4; i++) {
    const p1 = tx(i, -4), p2 = tx(i, 4), q1 = tx(-4, i), q2 = tx(4, i);
    grid.push(`M${p1[0]},${p1[1]}L${p2[0]},${p2[1]}`, `M${q1[0]},${q1[1]}L${q2[0]},${q2[1]}`);
  }
  const shape = SHAPE.map(([x, y]) => tx(x, y)).map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join('') + 'Z';
  const e1 = tx(1, 0), e2 = tx(0, 1);
  const set = (i: number) => (v: number) => setM((mm) => { const n = mm.slice() as typeof mm; n[i] = v; return n; });

  return (
    <Widget title="A matrix is a transformation of space" kicker="Interactive · edit the four numbers"
      note={<>Column one is where <span style={{ color: palette[0] }}>→</span> lands; column two is where <span style={{ color: palette[1] }}>↑</span> lands. A determinant of zero collapses space onto a line.</>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 18, alignItems: 'center' }}>
        <div style={{ background: 'var(--bg-soft)', borderRadius: 'var(--radius)' }}>
          <svg viewBox={`0 0 ${S} ${S}`} width="100%" role="img" aria-label="Transformed grid">
            <defs><clipPath id="mt-clip"><rect width={S} height={S} rx={14} /></clipPath></defs>
            <g clipPath="url(#mt-clip)">
              <path d={grid.join('')} style={{ stroke: 'var(--line-2)', fill: 'none' }} />
              <path d={shape} style={{ fill: `color-mix(in srgb, ${palette[3]} 35%, transparent)`, stroke: palette[3], strokeWidth: 2 }} />
              <line x1={o} y1={o} x2={e1[0]} y2={e1[1]} style={{ stroke: palette[0], strokeWidth: 3.5 }} />
              <line x1={o} y1={o} x2={e2[0]} y2={e2[1]} style={{ stroke: palette[1], strokeWidth: 3.5 }} />
              <circle cx={o} cy={o} r={3} style={{ fill: 'var(--fg)' }} />
            </g>
          </svg>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', margin: '4px 0 16px', fontFamily: 'var(--font-mono)', fontSize: '1.05rem' }}>
            <span style={{ fontSize: '2.6rem', fontWeight: 200, color: 'var(--fg-3)' }}>[</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '6px 18px', textAlign: 'right' }}>
              <span style={{ color: palette[0] }}>{a.toFixed(2)}</span><span style={{ color: palette[1] }}>{b.toFixed(2)}</span>
              <span style={{ color: palette[0] }}>{c.toFixed(2)}</span><span style={{ color: palette[1] }}>{d.toFixed(2)}</span>
            </div>
            <span style={{ fontSize: '2.6rem', fontWeight: 200, color: 'var(--fg-3)' }}>]</span>
          </div>
          <div className="controls" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 0 }}>
            <Slider label="a" value={a} min={-2} max={2} onChange={set(0)} display={a.toFixed(2)} />
            <Slider label="b" value={b} min={-2} max={2} onChange={set(1)} display={b.toFixed(2)} />
            <Slider label="c" value={c} min={-2} max={2} onChange={set(2)} display={c.toFixed(2)} />
            <Slider label="d" value={d} min={-2} max={2} onChange={set(3)} display={d.toFixed(2)} />
          </div>
          <div className="small" style={{ marginTop: 12 }}>
            Determinant: <strong className="mono">{det.toFixed(2)}</strong>{' '}
            <span className="muted">{Math.abs(det) < 0.02 ? '· space collapsed to a line' : det < 0 ? '· orientation flipped (a mirror image)' : `· areas scale by ${Math.abs(det).toFixed(2)}×`}</span>
          </div>
          <div className="chip-row" style={{ marginTop: 12 }}>
            {Object.entries(PRESETS).map(([k, v]) => <button key={k} type="button" className="chip" onClick={() => setM(v)}>{k}</button>)}
          </div>
        </div>
      </div>
    </Widget>
  );
}
