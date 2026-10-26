import { useEffect, useState } from 'react';
import { Widget, palette, rng } from './chart';

/* A faithful miniature of Anthropic's "Toy Models of Superposition" (2022):
   5 features squeezed through 2 dimensions, reconstructed as
   x' = ReLU(Wᵀ W x + b). Trained live with Adam. When features are dense,
   the model keeps only the 2 most important. When they are sparse, it packs
   all 5 into a pentagon and tolerates interference. */
const n = 5, m = 2;
const importance = Array.from({ length: n }, (_, i) => 0.75 ** i);

function train(sparsity: number, seed = 11) {
  const r = rng(seed);
  const W = Array.from({ length: m }, () => Array.from({ length: n }, () => r.normal() * 0.4));
  const b = Array(n).fill(0);
  const mW = W.map((row) => row.map(() => 0)), vW = W.map((row) => row.map(() => 0));
  const mb = Array(n).fill(0), vb = Array(n).fill(0);
  const lr = 0.02, b1 = 0.9, b2 = 0.999, eps = 1e-8;
  const steps = 2500, batch = 128;
  for (let t = 1; t <= steps; t++) {
    const gW = W.map((row) => row.map(() => 0));
    const gb = Array(n).fill(0);
    for (let k = 0; k < batch; k++) {
      const x = Array.from({ length: n }, () => (r.next() < sparsity ? 0 : r.next()));
      const h = [0, 1].map((j) => W[j].reduce((s, w, i) => s + w * x[i], 0));
      const pre = Array.from({ length: n }, (_, i) => W[0][i] * h[0] + W[1][i] * h[1] + b[i]);
      const out = pre.map((v) => Math.max(0, v));
      const dOut = out.map((o, i) => 2 * importance[i] * (o - x[i]) * (pre[i] > 0 ? 1 : 0));
      const dh = [0, 1].map((j) => dOut.reduce((s, d, i) => s + d * W[j][i], 0));
      for (let i = 0; i < n; i++) {
        gb[i] += dOut[i];
        for (let j = 0; j < m; j++) gW[j][i] += dOut[i] * h[j] + dh[j] * x[i];
      }
    }
    const c1 = 1 - b1 ** t, c2 = 1 - b2 ** t;
    for (let i = 0; i < n; i++) {
      const g = gb[i] / batch;
      mb[i] = b1 * mb[i] + (1 - b1) * g; vb[i] = b2 * vb[i] + (1 - b2) * g * g;
      b[i] -= (lr * (mb[i] / c1)) / (Math.sqrt(vb[i] / c2) + eps);
      for (let j = 0; j < m; j++) {
        const gg = gW[j][i] / batch;
        mW[j][i] = b1 * mW[j][i] + (1 - b1) * gg; vW[j][i] = b2 * vW[j][i] + (1 - b2) * gg * gg;
        W[j][i] -= (lr * (mW[j][i] / c1)) / (Math.sqrt(vW[j][i] / c2) + eps);
      }
    }
  }
  return { W, b };
}

const LEVELS = [0, 0.7, 0.9, 0.97];

export default function Superposition() {
  const [level, setLevel] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof train> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBusy(true);
    const id = window.setTimeout(() => { setResult(train(LEVELS[level])); setBusy(false); }, 30);
    return () => window.clearTimeout(id);
  }, [level]);

  const S = 300, c = S / 2, scale = 95;
  const norms = result ? Array.from({ length: n }, (_, i) => Math.hypot(result.W[0][i], result.W[1][i])) : [];
  const represented = norms.filter((v) => v > 0.5).length;

  return (
    <Widget title="Superposition: more features than dimensions" kicker="Interactive · a real toy model, trained as you watch"
      note={<>Five features must pass through a space of only two dimensions. Each arrow shows the direction the model assigns to one feature (longer means better represented; feature 1 matters most). With dense features, the model represents only as many as it has dimensions. Raise sparsity, so each feature is rarely active, and the geometry changes in steps: first features pair up as opposite (antipodal) arrows, four features in two dimensions; then all five pack into a pentagon, the model accepting a little interference because features seldom collide. This is why individual neurons in real models are often <em>polysemantic</em>.</>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 18, alignItems: 'center' }}>
        <div style={{ background: 'var(--bg-soft)', borderRadius: 'var(--radius)', position: 'relative' }}>
          <svg viewBox={`0 0 ${S} ${S}`} width="100%" role="img" aria-label="Feature directions in two dimensions" style={{ opacity: busy ? 0.4 : 1, transition: 'opacity .3s' }}>
            <circle cx={c} cy={c} r={scale} style={{ fill: 'none', stroke: 'var(--line-2)', strokeDasharray: '3 5' }} />
            <line x1={c - 130} x2={c + 130} y1={c} y2={c} style={{ stroke: 'var(--grid)' }} />
            <line y1={c - 130} y2={c + 130} x1={c} x2={c} style={{ stroke: 'var(--grid)' }} />
            {result && Array.from({ length: n }, (_, i) => {
              const vx = result.W[0][i] * scale, vy = -result.W[1][i] * scale;
              return (
                <g key={i}>
                  <line x1={c} y1={c} x2={c + vx} y2={c + vy} style={{ stroke: palette[i], strokeWidth: 3.5, strokeLinecap: 'round' }} />
                  <circle cx={c + vx} cy={c + vy} r={5} style={{ fill: palette[i] }} />
                  {norms[i] > 0.15 && <text x={c + vx * 1.18} y={c + vy * 1.18} dy="0.32em" textAnchor="middle" style={{ fontSize: 12, fontWeight: 650, fill: 'var(--fg)' }}>f{i + 1}</text>}
                </g>
              );
            })}
          </svg>
          {busy && <div className="small muted" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>training…</div>}
        </div>
        <div className="stack" style={{ ['--stack' as string]: '14px' }}>
          <div>
            <div className="small muted" style={{ marginBottom: 6 }}>Feature sparsity (chance a feature is zero)</div>
            <div className="chip-row">
              {LEVELS.map((s, i) => <button key={s} type="button" className="chip" aria-pressed={level === i} onClick={() => setLevel(i)}>{Math.round(s * 100)}%</button>)}
            </div>
          </div>
          <div className="card card-soft" style={{ padding: 16 }}>
            <div className="xsmall faint">Features represented in 2 dimensions</div>
            <div style={{ fontSize: '2rem', fontWeight: 500, letterSpacing: '-0.03em' }} className="tabular">{busy ? '…' : represented} <span className="small muted">of 5</span></div>
          </div>
          <div className="small muted">Feature importance falls from f1 (1.00) to f5 ({importance[4].toFixed(2)}). Bars below show each feature's representation strength.</div>
          <div style={{ display: 'grid', gap: 6 }}>
            {norms.map((v, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 8, alignItems: 'center' }}>
                <span className="mono xsmall">f{i + 1}</span>
                <div style={{ height: 10, background: 'var(--bg-muted)', borderRadius: 5 }}><div style={{ width: `${Math.min(100, v * 90)}%`, height: '100%', background: palette[i], borderRadius: 5, transition: 'width .4s' }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Widget>
  );
}
