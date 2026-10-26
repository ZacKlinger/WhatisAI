import { useMemo, useState } from 'react';
import { Slider, Widget, palette, rng } from './chart';

/* Two models with fixed true accuracies are each evaluated on a benchmark
   of N questions, many times over. How often does the worse model "win"? */
export default function BenchmarkStats() {
  const [n, setN] = useState(200);
  const [pa, setPa] = useState(0.7);
  const [pb, setPb] = useState(0.73);
  const [seed, setSeed] = useState(1);
  const runs = 400;

  const sims = useMemo(() => {
    const r = rng(seed * 977 + n);
    const out: [number, number][] = [];
    for (let k = 0; k < runs; k++) {
      let a = 0, b = 0;
      for (let i = 0; i < n; i++) { if (r.next() < pa) a++; if (r.next() < pb) b++; }
      out.push([a / n, b / n]);
    }
    return out;
  }, [n, pa, pb, seed]);

  const flips = sims.filter(([a, b]) => (pb > pa ? a >= b : b >= a)).length / runs;
  const se = (p: number) => Math.sqrt((p * (1 - p)) / n);
  const ci = (p: number) => 1.96 * se(p);

  const bins = 40, lo = 0.45, hi = 1;
  const hist = (idx: 0 | 1) => {
    const h = Array(bins).fill(0);
    for (const s of sims) { const b = Math.floor(((s[idx] - lo) / (hi - lo)) * bins); if (b >= 0 && b < bins) h[b]++; }
    return h;
  };
  const ha = hist(0), hb = hist(1);
  const max = Math.max(...ha, ...hb, 1);

  return (
    <Widget title="Is model B really better?" kicker="Interactive · sampling error in evaluations"
      note={<>Every score carries noise of about ±1.96 × √(p(1−p)/n). Watch how often the worse model ties or wins across {runs} runs, then add questions.</>}>
      <svg viewBox="0 0 600 170" width="100%" role="img" aria-label="Distribution of simulated scores" style={{ background: 'var(--bg-soft)', borderRadius: 'var(--radius)' }}>
        {[ha, hb].map((h, k) => h.map((c, i) => (
          <rect key={`${k}-${i}`} x={20 + (i / bins) * 560} y={150 - (c / max) * 125} width={560 / bins - 1} height={(c / max) * 125}
            style={{ fill: palette[k], opacity: 0.55 }} />
        )))}
        {[0.5, 0.6, 0.7, 0.8, 0.9, 1].map((t) => (
          <text key={t} x={20 + ((t - lo) / (hi - lo)) * 560} y={166} textAnchor="middle" style={{ fontSize: 10.5, fill: 'var(--fg-3)' }}>{Math.round(t * 100)}%</text>
        ))}
        <text x={24} y={18} style={{ fontSize: 11, fill: palette[0] }}>Model A scores</text>
        <text x={120} y={18} style={{ fontSize: 11, fill: palette[1] }}>Model B scores</text>
      </svg>
      <div className="controls">
        <Slider label="Questions in benchmark" value={n} min={20} max={3000} step={10} onChange={setN} display={String(n)} />
        <Slider label="Model A true accuracy" value={pa} min={0.5} max={0.95} onChange={setPa} display={`${Math.round(pa * 100)}%`} />
        <Slider label="Model B true accuracy" value={pb} min={0.5} max={0.95} onChange={setPb} display={`${Math.round(pb * 100)}%`} />
      </div>
      <div className="grid grid-3" style={{ marginTop: 16, gap: 10 }}>
        <div className="card card-soft" style={{ padding: 14 }}>
          <div className="xsmall faint">Model A: 95% interval</div>
          <div className="tabular" style={{ fontWeight: 550 }}>{(pa * 100).toFixed(0)}% ± {(ci(pa) * 100).toFixed(1)}</div>
        </div>
        <div className="card card-soft" style={{ padding: 14 }}>
          <div className="xsmall faint">Model B: 95% interval</div>
          <div className="tabular" style={{ fontWeight: 550 }}>{(pb * 100).toFixed(0)}% ± {(ci(pb) * 100).toFixed(1)}</div>
        </div>
        <div className="card card-soft" style={{ padding: 14 }}>
          <div className="xsmall faint">Runs where the worse model ties or wins</div>
          <div className="tabular" style={{ fontWeight: 550, color: flips > 0.1 ? 'var(--bad)' : 'var(--good)' }}>{(flips * 100).toFixed(1)}%</div>
        </div>
      </div>
      <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setSeed((s) => s + 1)}>Re-run simulation</button>
    </Widget>
  );
}
