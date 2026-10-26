import { useState } from 'react';
import { Widget, palette } from './chart';

const OUTCOMES = ['A', 'B', 'C', 'D'];

function normalize(v: number[]) {
  const s = v.reduce((a, b) => a + b, 0) || 1;
  return v.map((x) => x / s);
}

export default function Entropy() {
  const [truth, setTruth] = useState([0.7, 0.15, 0.1, 0.05]);
  const [model, setModel] = useState([0.25, 0.25, 0.25, 0.25]);
  const p = normalize(truth);
  const q = normalize(model);
  const H = -p.reduce((s, v) => (v > 0 ? s + v * Math.log2(v) : s), 0);
  const CE = -p.reduce((s, v, i) => (v > 0 ? s + v * Math.log2(Math.max(q[i], 1e-9)) : s), 0);
  const KL = CE - H;
  const ppl = 2 ** CE;

  const Editor = ({ vals, set, label, color }: { vals: number[]; set: (v: number[]) => void; label: string; color: string }) => (
    <div>
      <div className="small" style={{ fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 140 }}>
        {vals.map((v, i) => {
          const pn = normalize(vals)[i];
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <span className="mono xsmall">{(pn * 100).toFixed(0)}%</span>
              <div style={{ width: '100%', height: `${pn * 100}%`, minHeight: 2, background: color, borderRadius: '6px 6px 2px 2px', transition: 'height .2s' }} />
              <span className="mono small">{OUTCOMES[i]}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 6 }}>
        {vals.map((v, i) => (
          <input key={i} type="range" min={0} max={1} step={0.01} value={v} aria-label={`${label} ${OUTCOMES[i]}`}
            onChange={(e) => { const n = vals.slice(); n[i] = Number(e.target.value); set(n); }} />
        ))}
      </div>
    </div>
  );

  return (
    <Widget title="Surprise, measured in bits" kicker="Interactive · entropy and cross-entropy"
      note={<>Cross-entropy never drops below entropy. The gap, the <em>KL divergence</em>, is the cost of a wrong model. Language models are trained to shrink it.</>}>
      <div className="grid grid-2" style={{ gap: 24 }}>
        <Editor vals={truth} set={setTruth} label="The true distribution (the world)" color={palette[2]} />
        <Editor vals={model} set={setModel} label="Your model's prediction" color={palette[0]} />
      </div>
      <div className="grid grid-4" style={{ marginTop: 18, gap: 10 }}>
        {[
          ['Entropy H(p)', `${H.toFixed(3)} bits`],
          ['Cross-entropy H(p, q)', `${CE.toFixed(3)} bits`],
          ['KL divergence (the gap)', `${KL.toFixed(3)} bits`],
          ['Perplexity 2^H(p,q)', ppl.toFixed(2)],
        ].map(([k, v], i) => (
          <div key={k} className="card card-soft" style={{ padding: 14 }}>
            <div className="xsmall faint">{k}</div>
            <div className="tabular" style={{ fontSize: '1.15rem', fontWeight: 550, color: i === 2 && KL < 0.01 ? 'var(--good)' : 'var(--fg)' }}>{v}</div>
          </div>
        ))}
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModel(truth.slice())}>Make the model perfect</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModel([0.25, 0.25, 0.25, 0.25])}>Uniform guess</button>
      </div>
    </Widget>
  );
}
