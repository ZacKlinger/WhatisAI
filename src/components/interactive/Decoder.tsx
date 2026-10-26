import { useMemo, useState } from 'react';
import { Slider, Widget, palette, rng } from './chart';
import { softmax } from './Softmax';

/* A word-level trigram language model, trained in your browser on a small
   corpus. It generates one token at a time, exactly as a large model does:
   predict a distribution, sample, append, repeat. */
const CORPUS = `the model predicts the next word . the next word depends on the words before it .
a language model learns which words tend to follow which . the model learns patterns from text .
the researchers trained the model on a large corpus of text . the model generates text one word at a time .
each word is chosen from a distribution over the vocabulary . a higher temperature makes the choice more random .
a lower temperature makes the model pick the most likely word . the most likely word is not always the best word .
the model does not plan the whole sentence at once . it predicts one word and then the next .
language is full of patterns and the model learns the patterns it sees most often .`;

function buildModel(text: string) {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const tri = new Map<string, Map<string, number>>();
  const bi = new Map<string, Map<string, number>>();
  const add = (m: Map<string, Map<string, number>>, k: string, w: string) => {
    const inner = m.get(k) ?? new Map();
    inner.set(w, (inner.get(w) ?? 0) + 1);
    m.set(k, inner);
  };
  for (let i = 0; i < words.length - 1; i++) {
    add(bi, words[i], words[i + 1]);
    if (i < words.length - 2) add(tri, `${words[i]} ${words[i + 1]}`, words[i + 2]);
  }
  return { tri, bi, vocab: [...new Set(words)] };
}

export default function Decoder() {
  const model = useMemo(() => buildModel(CORPUS), []);
  const [T, setT] = useState(0.8);
  const [out, setOut] = useState<string[]>(['the', 'model']);
  const [seed, setSeed] = useState(3);

  const dist = useMemo(() => {
    const k = out.slice(-2).join(' ');
    const counts = model.tri.get(k) ?? model.bi.get(out[out.length - 1]) ?? new Map([['the', 1]]);
    const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const logits = entries.map(([, c]) => Math.log(c));
    const p = softmax(logits, T);
    return entries.map(([w], i) => [w, p[i]] as [string, number]);
  }, [out, model, T]);

  function step(times = 1) {
    let cur = out.slice();
    const r = rng(seed + cur.length * 13);
    for (let t = 0; t < times; t++) {
      const k = cur.slice(-2).join(' ');
      const counts = model.tri.get(k) ?? model.bi.get(cur[cur.length - 1]) ?? new Map([['the', 1]]);
      const entries = [...counts.entries()];
      const p = softmax(entries.map(([, c]) => Math.log(c)), T);
      let u = r.next(), pick = entries[0][0];
      for (let i = 0; i < p.length; i++) { u -= p[i]; if (u <= 0) { pick = entries[i][0]; break; } }
      cur = [...cur, pick];
    }
    setOut(cur.slice(-60));
    setSeed((s) => s + 1);
  }

  return (
    <Widget title="Generation, one token at a time" kicker="Interactive · a tiny language model"
      note={<>Predict a distribution, sample a token, append it, repeat. A transformer generates the same way; this toy only knows word triples.</>}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', lineHeight: 1.7, minHeight: 64, padding: '12px 16px', background: 'var(--bg-soft)', borderRadius: 'var(--radius)' }}>
        {out.map((w, i) => (
          <span key={i} style={{ color: i >= out.length - 1 ? palette[0] : undefined, fontWeight: i >= out.length - 1 ? 600 : 400 }}>{w} </span>
        ))}
        <span style={{ display: 'inline-block', width: 2, height: '1.1em', background: 'var(--fg)', verticalAlign: 'text-bottom', animation: 'twinkle 1s infinite' }} />
      </div>
      <div style={{ marginTop: 14 }}>
        <div className="small muted" style={{ marginBottom: 8 }}>Next-word distribution given "<span className="mono">{out.slice(-2).join(' ')}</span>":</div>
        <div style={{ display: 'grid', gap: 6 }}>
          {dist.slice(0, 6).map(([w, p], i) => (
            <div key={w} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 54px', gap: 10, alignItems: 'center' }}>
              <span className="mono small">{w}</span>
              <div style={{ height: 14, background: 'var(--bg-muted)', borderRadius: 4 }}><div style={{ width: `${p * 100}%`, height: '100%', background: palette[i % 6], borderRadius: 4, transition: 'width .3s' }} /></div>
              <span className="mono xsmall tabular" style={{ textAlign: 'right' }}>{(p * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="controls"><Slider label="Temperature" value={T} min={0.1} max={2.5} step={0.05} onChange={setT} display={T.toFixed(2)} /></div>
      <div className="row" style={{ marginTop: 14 }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => step(1)}>Next token</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => step(12)}>Generate 12</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOut(['the', 'model'])}>Reset</button>
      </div>
    </Widget>
  );
}
