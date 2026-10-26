import { useMemo, useState } from 'react';
import { Slider, Widget, palette } from './chart';

interface Props {
  context?: string;
  tokens?: string[];
  logits?: number[];
  showTopP?: boolean;
}

export function softmax(logits: number[], T: number): number[] {
  const t = Math.max(T, 1e-3);
  const z = logits.map((l) => l / t);
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export function entropyBits(p: number[]): number {
  return -p.reduce((s, v) => (v > 0 ? s + v * Math.log2(v) : s), 0);
}

export default function Softmax({
  context = 'The cat sat on the',
  tokens = [' mat', ' floor', ' sofa', ' roof', ' keyboard', ' moon'],
  logits = [4.1, 3.2, 2.9, 1.6, 1.2, -0.8],
  showTopP = true,
}: Props) {
  const [T, setT] = useState(1);
  const [topP, setTopP] = useState(1);
  const [samples, setSamples] = useState<string[]>([]);
  const probs = useMemo(() => softmax(logits, T), [logits, T]);

  const order = probs.map((p, i) => [p, i] as const).sort((a, b) => b[0] - a[0]);
  const nucleus = new Set<number>();
  let cum = 0;
  for (const [p, i] of order) {
    if (cum >= topP && nucleus.size > 0) break;
    nucleus.add(i);
    cum += p;
  }
  const kept = probs.map((p, i) => (nucleus.has(i) ? p : 0));
  const keptSum = kept.reduce((a, b) => a + b, 0);
  const final = kept.map((p) => p / keptSum);

  function sample(n = 1) {
    const out: string[] = [];
    for (let k = 0; k < n; k++) {
      let r = Math.random();
      let pick = 0;
      for (let i = 0; i < final.length; i++) {
        r -= final[i];
        if (r <= 0) { pick = i; break; }
      }
      out.push(tokens[pick]);
    }
    setSamples((s) => [...out, ...s].slice(0, 24));
  }

  const H = entropyBits(final);
  return (
    <Widget title="From scores to choices: softmax and temperature" kicker="Interactive · drag the sliders"
      note={<>Low temperature sharpens toward the top token; high temperature flattens toward random. Top-p keeps the smallest set of tokens adding up to p.</>}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: 14 }}>
        {context}<span style={{ background: 'var(--bg-muted)', borderRadius: 6, padding: '0 8px', marginLeft: 4, color: 'var(--fg-3)' }}>?</span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {tokens.map((t, i) => (
          <div key={t} style={{ display: 'grid', gridTemplateColumns: 'minmax(84px,auto) 1fr 64px', gap: 12, alignItems: 'center', opacity: nucleus.has(i) ? 1 : 0.35, transition: 'opacity .3s' }}>
            <span className="mono" style={{ fontSize: '0.9rem' }}>{JSON.stringify(t)}</span>
            <div style={{ height: 22, background: 'var(--bg-muted)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${final[i] * 100}%`, height: '100%', background: palette[i % 6], borderRadius: 6, transition: 'width .35s var(--ease)' }} />
            </div>
            <span className="mono tabular" style={{ fontSize: '0.82rem', textAlign: 'right' }}>{(final[i] * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
      <div className="controls">
        <Slider label="Temperature" value={T} min={0.05} max={3} step={0.05} onChange={setT} display={T.toFixed(2)} />
        {showTopP && <Slider label="Top-p (nucleus)" value={topP} min={0.1} max={1} step={0.05} onChange={setTopP} display={topP.toFixed(2)} />}
      </div>
      <div className="row" style={{ marginTop: 16, justifyContent: 'space-between' }}>
        <div className="row">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => sample(1)}>Sample once</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => sample(10)}>Sample 10</button>
        </div>
        <div className="small muted tabular">Entropy: <strong style={{ color: 'var(--fg)' }}>{H.toFixed(2)} bits</strong> · logits: <span className="mono">[{logits.map((l) => l.toFixed(1)).join(', ')}]</span></div>
      </div>
      {samples.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {samples.map((s, i) => <span key={i} className="pill mono" style={{ animation: i === 0 ? 'pop .3s var(--ease)' : undefined }}>{s.trim()}</span>)}
        </div>
      )}
    </Widget>
  );
}
