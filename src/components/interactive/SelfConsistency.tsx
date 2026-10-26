import { useMemo, useState } from 'react';
import { Axis, Slider, Widget, linear, palette, path, useWidth } from './chart';

/* Majority voting over k independent samples. If one sample is right with
   probability p (and wrong answers scatter across alternatives), the vote
   is right with a probability given by the binomial distribution. */
function binom(n: number, k: number) {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

export function majorityAccuracy(p: number, k: number, wrongWays = 4) {
  // Approximation: wrong answers split evenly among `wrongWays` alternatives;
  // the vote succeeds when correct votes exceed the largest wrong bucket (estimated as an even split).
  let acc = 0;
  for (let c = 0; c <= k; c++) {
    const prob = binom(k, c) * p ** c * (1 - p) ** (k - c);
    const rest = k - c;
    const maxWrong = Math.ceil(rest / wrongWays);
    if (c > maxWrong) acc += prob;
    else if (c === maxWrong && c > 0) acc += prob / 2;
  }
  return acc;
}

export default function SelfConsistency() {
  const [p, setP] = useState(0.45);
  const [k, setK] = useState(9);
  const [ref, width] = useWidth<HTMLDivElement>(600);
  const W = width, H = 240, m = { l: 50, r: 16, t: 14, b: 40 };
  const x = linear(1, 41, m.l, W - m.r);
  const y = linear(0, 1, H - m.b, m.t);
  const series = useMemo(() => [0.25, p, 0.7].map((pp) => Array.from({ length: 41 }, (_, i) => [i + 1, majorityAccuracy(pp, i + 1)] as [number, number])), [p]);

  return (
    <Widget title="Thinking longer by thinking more times" kicker="Interactive · test-time compute"
      note={<>Voting helps when the right answer beats any single wrong one. If the model is consistently wrong, more samples will not save it.</>}>
      <div ref={ref} style={{ background: 'var(--bg-soft)', borderRadius: 'var(--radius)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Accuracy versus number of samples">
          <Axis scale={y} orient="left" at={m.l} length={[H - m.b, m.t]} grid={W - m.r} ticks={[0, 0.25, 0.5, 0.75, 1]} format={(v) => `${v * 100}%`} label="accuracy" />
          <Axis scale={x} orient="bottom" at={H - m.b} length={[m.l, W - m.r]} ticks={[1, 5, 10, 20, 30, 40]} label="samples per question (k)" />
          {series.map((s, i) => <path key={i} d={path(s.map(([a, b]) => [x(a), y(b)]))} style={{ fill: 'none', stroke: i === 1 ? palette[0] : 'var(--line-3)', strokeWidth: i === 1 ? 3 : 1.5 }} />)}
          <circle cx={x(k)} cy={y(majorityAccuracy(p, k))} r={7} style={{ fill: palette[1], stroke: 'var(--bg)', strokeWidth: 3 }} />
        </svg>
      </div>
      <div className="controls">
        <Slider label="Single-attempt accuracy p" value={p} min={0.05} max={0.95} onChange={setP} display={`${Math.round(p * 100)}%`} />
        <Slider label="Samples k" value={k} min={1} max={41} step={2} onChange={setK} display={String(k)} />
      </div>
      <div className="small muted" style={{ marginTop: 12 }}>
        With <strong style={{ color: 'var(--fg)' }}>{k}</strong> votes, accuracy is <strong style={{ color: 'var(--fg)' }}>{(majorityAccuracy(p, k) * 100).toFixed(1)}%</strong> (from {Math.round(p * 100)}% for one attempt), at {k}× the inference cost.
        Grey: p = 25% and 70%. Wrong answers split among four options.
      </div>
    </Widget>
  );
}
