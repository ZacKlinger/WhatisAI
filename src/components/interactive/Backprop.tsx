import { useState } from 'react';
import { Slider, Widget, palette } from './chart';

/* A single neuron with a squared-error loss, as a computational graph.
   Forward: z = w·x + b, a = tanh(z), L = (a − y)². Backward: the chain rule,
   one local derivative at a time. */
export default function Backprop() {
  const [w, setW] = useState(0.8);
  const [b, setB] = useState(-0.2);
  const [phase, setPhase] = useState(0); // 0 none, 1 forward, 2 backward
  const x = 1.5, yT = 0.9;
  const z = w * x + b, a = Math.tanh(z), L = (a - yT) ** 2;
  const dL_da = 2 * (a - yT), da_dz = 1 - a * a, dL_dz = dL_da * da_dz, dL_dw = dL_dz * x, dL_db = dL_dz;

  const nodes = [
    { id: 'x', label: 'x', v: x, g: null, px: 60, py: 60 },
    { id: 'w', label: 'w', v: w, g: dL_dw, px: 60, py: 150 },
    { id: 'b', label: 'b', v: b, g: dL_db, px: 60, py: 240 },
    { id: 'z', label: 'z = w·x + b', v: z, g: dL_dz, px: 250, py: 150 },
    { id: 'a', label: 'a = tanh(z)', v: a, g: dL_da, px: 430, py: 150 },
    { id: 'L', label: 'L = (a − y)²', v: L, g: 1, px: 600, py: 150 },
  ];
  const edges: [string, string, string][] = [['x', 'z', ''], ['w', 'z', `∂z/∂w = x = ${x}`], ['b', 'z', '∂z/∂b = 1'], ['z', 'a', `∂a/∂z = 1 − a² = ${da_dz.toFixed(3)}`], ['a', 'L', `∂L/∂a = 2(a − y) = ${dL_da.toFixed(3)}`]];
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <Widget title="Backpropagation is the chain rule, applied patiently" kicker="Interactive · step forward, then backward"
      note={<>The forward pass computes each value from left to right. The backward pass starts from the loss and moves right to left, multiplying local slopes: ∂L/∂w = ∂L/∂a × ∂a/∂z × ∂z/∂w. Every parameter learns how much it is to blame for the error. A real network does exactly this through billions of nodes, and reuses each intermediate result so the whole backward pass costs about twice the forward pass.</>}>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox="0 0 700 300" width="100%" style={{ minWidth: 520, background: 'var(--bg-soft)', borderRadius: 'var(--radius)' }} role="img" aria-label="Computational graph">
          <defs>
            <marker id="bp-f" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--fg-3)' }} /></marker>
          </defs>
          {edges.map(([f, t, lbl]) => {
            const A = pos[f], B = pos[t];
            return (
              <g key={f + t}>
                <line x1={A.px + 40} y1={A.py} x2={B.px - 62} y2={B.py} style={{ stroke: phase === 2 ? palette[1] : 'var(--line-3)', strokeWidth: phase === 2 ? 2.5 : 1.5, transition: 'stroke .4s' }} markerEnd="url(#bp-f)" />
                {phase === 2 && lbl && <text x={(A.px + B.px) / 2 - 10} y={(A.py + B.py) / 2 - 10} textAnchor="middle" style={{ fontSize: 10.5, fill: palette[1] }}>{lbl}</text>}
              </g>
            );
          })}
          {nodes.map((n) => (
            <g key={n.id} transform={`translate(${n.px},${n.py})`}>
              <rect x={n.id.length > 1 || ['z', 'a', 'L'].includes(n.id) ? -62 : -38} y={-28} width={['z', 'a', 'L'].includes(n.id) ? 124 : 76} height={56} rx={14}
                style={{ fill: 'var(--bg-elev)', stroke: 'var(--line-2)' }} />
              <text y={-8} textAnchor="middle" style={{ fontSize: 12, fill: 'var(--fg-2)' }}>{n.label}</text>
              {phase >= 1 && <text y={10} textAnchor="middle" style={{ fontSize: 13, fontWeight: 650, fill: palette[0] }} className="tabular">{n.v.toFixed(3)}</text>}
              {phase >= 2 && n.g !== null && <text y={46} textAnchor="middle" style={{ fontSize: 11.5, fontWeight: 600, fill: palette[1] }}>∂L/∂{n.id} = {n.g.toFixed(3)}</text>}
            </g>
          ))}
          <text x={600} y={60} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--fg-3)' }}>target y = {yT}</text>
        </svg>
      </div>
      <div className="controls">
        <Slider label="Weight w" value={w} min={-2} max={2} onChange={setW} display={w.toFixed(2)} />
        <Slider label="Bias b" value={b} min={-2} max={2} onChange={setB} display={b.toFixed(2)} />
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setPhase(1)}>Forward pass</button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={phase < 1} onClick={() => setPhase(2)}>Backward pass</button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={phase < 2} onClick={() => { setW((v) => v - 0.5 * dL_dw); setB((v) => v - 0.5 * dL_db); }}>Apply one update (lr 0.5)</button>
        <span className="small muted">Loss {L.toFixed(4)}</span>
      </div>
    </Widget>
  );
}
