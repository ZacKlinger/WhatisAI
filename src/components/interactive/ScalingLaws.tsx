import { useState } from 'react';
import { Axis, Slider, Widget, fmtNum, fmtPow10, linear, log, palette, path, useWidth } from './chart';

/* Chinchilla-style parametric loss: L(N, D) = E + A / N^α + B / D^β.
   Constants from the replication by Besiroglu et al. (2024), which corrected
   the original fit in Hoffmann et al. (2022). Training compute C ≈ 6·N·D. */
const E = 1.8172, A = 482.01, B = 2085.43, al = 0.3478, be = 0.3658;
export const chinchillaLoss = (N: number, D: number) => E + A / N ** al + B / D ** be;

export default function ScalingLaws() {
  const [logC, setLogC] = useState(23.76);
  const [logN, setLogN] = useState(11.45);
  const [ref, width] = useWidth<HTMLDivElement>(640);
  const C = 10 ** logC;
  const W = width, H = Math.max(260, Math.round(width * 0.5));
  const m = { l: 54, r: 18, t: 14, b: 44 };
  const x = log(1e8, 1e13, m.l, W - m.r);
  const y = linear(1.9, 3.6, H - m.b, m.t);

  const curve = (c: number) => Array.from({ length: 120 }, (_, i) => {
    const N = 10 ** (8 + (i / 119) * 5);
    return [N, chinchillaLoss(N, c / (6 * N))] as [number, number];
  }).filter(([, l]) => l < 3.6);

  const budgets = [logC - 1, logC, logC + 1];
  const opt = (c: number) => curve(c).reduce((b, p) => (p[1] < b[1] ? p : b), [0, 99]);
  const [Nopt, Lopt] = opt(C);
  const N = 10 ** logN;
  const D = C / (6 * N);
  const L = chinchillaLoss(N, D);
  const ratio = D / N;

  return (
    <Widget title="Spend a compute budget: the Chinchilla trade-off" kicker="Interactive · a fitted scaling law"
      note={<>Each curve fixes compute (≈ 6 × N × D). Its low point is the compute-optimal model, near <strong>20 tokens per parameter</strong>.</>}>
      <div ref={ref} style={{ background: 'var(--bg-soft)', borderRadius: 'var(--radius)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Loss versus model size at fixed compute">
          <Axis scale={y} orient="left" at={m.l} length={[H - m.b, m.t]} label="predicted loss" grid={W - m.r} ticks={[2, 2.4, 2.8, 3.2, 3.6]} />
          <Axis scale={x} orient="bottom" at={H - m.b} length={[m.l, W - m.r]} label="parameters N (log scale)" format={fmtPow10} grid={m.t} />
          {budgets.map((lc, i) => {
            const pts = curve(10 ** lc);
            const o = opt(10 ** lc);
            return (
              <g key={i}>
                <path d={path(pts.map(([n, l]) => [x(n), y(l)]))} style={{ fill: 'none', stroke: i === 1 ? palette[0] : 'var(--line-3)', strokeWidth: i === 1 ? 3 : 1.5 }} />
                <circle cx={x(o[0])} cy={y(o[1])} r={i === 1 ? 6 : 4} style={{ fill: i === 1 ? palette[2] : 'var(--fg-3)' }} />
                {pts.length > 0 && (
                  <text x={x(pts[pts.length - 1][0]) - 6} y={y(pts[pts.length - 1][1]) - 8} textAnchor="end" style={{ fontSize: 10.5, fill: i === 1 ? palette[0] : 'var(--fg-3)', fontWeight: i === 1 ? 600 : 400 }}>
                    {fmtNum(10 ** lc)} FLOP
                  </text>
                )}
              </g>
            );
          })}
          {L < 3.6 && <circle cx={x(N)} cy={y(L)} r={8} style={{ fill: palette[1], stroke: 'var(--bg)', strokeWidth: 3 }} />}
        </svg>
      </div>
      <div className="controls">
        <Slider label="Compute budget (FLOP)" value={logC} min={20} max={26} step={0.02} onChange={setLogC} display={fmtNum(C)} />
        <Slider label="Your model size N" value={logN} min={8} max={13} step={0.01} onChange={setLogN} display={`${fmtNum(N)} params`} />
      </div>
      <div className="grid grid-4" style={{ marginTop: 16, gap: 10 }}>
        {[
          ['Your loss', L.toFixed(3), L - Lopt < 0.01 ? 'var(--good)' : 'var(--fg)'],
          ['Training tokens D', fmtNum(D), 'var(--fg)'],
          ['Tokens per parameter', ratio >= 1 ? ratio.toFixed(1) : ratio.toFixed(2), Math.abs(Math.log10(ratio / 20)) < 0.25 ? 'var(--good)' : 'var(--fg)'],
          ['Optimal model at this budget', `${fmtNum(Nopt)} params`, 'var(--fg)'],
        ].map(([k, v, c]) => (
          <div key={k} className="card card-soft" style={{ padding: 14 }}>
            <div className="xsmall faint">{k}</div>
            <div className="tabular" style={{ fontSize: '1.15rem', fontWeight: 550, color: c }}>{v}</div>
          </div>
        ))}
      </div>
      <div className="small muted" style={{ marginTop: 12 }}>
        Try 5.8×10²³ FLOP: Gopher spent it on 280B parameters, Chinchilla on 70B with 4× the data. Chinchilla won.
      </div>
    </Widget>
  );
}
