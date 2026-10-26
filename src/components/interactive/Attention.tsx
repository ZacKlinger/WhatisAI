import { useState } from 'react';
import { Widget, palette } from './chart';

/* Hand-specified attention patterns that mirror heads researchers have
   actually found in trained models: a previous-token head, a head that
   resolves pronouns, and a head that attends to the first token. */
const SENTENCES = {
  tired: 'The animal did not cross the street because it was too tired'.split(' '),
  wide: 'The animal did not cross the street because it was too wide'.split(' '),
};

type HeadName = 'coreference' | 'previous' | 'first';

function weights(head: HeadName, tokens: string[], q: number, variant: 'tired' | 'wide'): number[] {
  const n = q + 1; // causal: a token only attends to itself and earlier tokens
  let raw = Array.from({ length: tokens.length }, (_, i) => (i < n ? 0.05 : 0));
  if (head === 'previous') raw = raw.map((v, i) => (i === q - 1 ? 3 : i === q ? 0.6 : v));
  if (head === 'first') raw = raw.map((v, i) => (i === 0 ? 3 : i < n ? 0.15 : 0));
  if (head === 'coreference') {
    const target = variant === 'tired' ? 1 : 6;
    const last = q === tokens.length - 1;
    raw = raw.map((v, i) => {
      if (i >= n) return 0;
      // At "it" the referent is still ambiguous: a causal model cannot see the later word yet.
      if (tokens[q] === 'it' && (i === 1 || i === 6)) return 2.2;
      // At the final adjective the ambiguity resolves, and the head binds it to its referent.
      if (last && i === target) return 4;
      if (last && tokens[i] === 'it') return 2.4;
      if (i === q) return 1.2;
      return v + (/^(animal|street)$/.test(tokens[i]) ? 0.5 : 0);
    });
  }
  const e = raw.map((v, i) => (i < n ? Math.exp(v) : 0));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export default function Attention() {
  const [variant, setVariant] = useState<'tired' | 'wide'>('tired');
  const tokens = SENTENCES[variant];
  const [q, setQ] = useState(11);
  const [head, setHead] = useState<HeadName>('coreference');
  const w = weights(head, tokens, q, variant);

  return (
    <Widget title="Attention: every word asks a question" kicker="Interactive · click any word"
      note={<>Each token produces a <strong>query</strong> ("what am I looking for?"), and every earlier token offers a <strong>key</strong> ("what do I contain?"). Query-key matches become attention weights that sum to 1, and the token gathers a weighted blend of the others' <strong>values</strong>. Different heads learn different questions. Click the last word and switch it between <em>tired</em> and <em>wide</em>: the pronoun-resolution head binds it to the animal or the street. Now click "it": because attention only looks backward, the model cannot yet know the referent, so attention splits between both candidates. Meaning is assembled over many positions and layers. These patterns are illustrative, modeled on heads found in trained models.</>}>
      <div className="chip-row" style={{ marginBottom: 10 }}>
        {(['coreference', 'previous', 'first'] as HeadName[]).map((h) => (
          <button key={h} type="button" className="chip" aria-pressed={head === h} onClick={() => setHead(h)}>
            {h === 'coreference' ? 'Head 5.2 · pronoun resolution' : h === 'previous' ? 'Head 0.1 · previous token' : 'Head 2.7 · first token'}
          </button>
        ))}
      </div>
      <div className="chip-row" style={{ marginBottom: 18 }}>
        <span className="small muted" style={{ alignSelf: 'center' }}>Last word:</span>
        <button type="button" className="chip" aria-pressed={variant === 'tired'} onClick={() => setVariant('tired')}>tired</button>
        <button type="button" className="chip" aria-pressed={variant === 'wide'} onClick={() => setVariant('wide')}>wide</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 6px', alignItems: 'flex-end', fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>
        {tokens.map((t, i) => {
          const wt = w[i];
          return (
            <button key={i} type="button" onClick={() => setQ(i)} aria-pressed={i === q}
              style={{
                position: 'relative', padding: '6px 9px', borderRadius: 10,
                background: i === q ? 'var(--bg-inverse)' : `color-mix(in srgb, ${palette[0]} ${Math.round(wt * 100)}%, var(--bg-soft))`,
                color: i === q ? 'var(--fg-inverse)' : wt > 0.5 ? '#fff' : 'var(--fg)',
                transition: 'background .3s',
                opacity: i > q ? 0.35 : 1,
              }}>
              {t}
              {i <= q && i !== q && <span className="mono" style={{ position: 'absolute', top: -14, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: 'var(--fg-3)' }}>{wt >= 0.01 ? wt.toFixed(2) : ''}</span>}
            </button>
          );
        })}
      </div>
      <div className="small muted" style={{ marginTop: 16 }}>
        Query: <strong style={{ color: 'var(--fg)' }}>"{tokens[q]}"</strong>. Faded words come later in the sentence; a language model's attention is <em>causal</em>, so a word can only look backward.
      </div>
    </Widget>
  );
}
