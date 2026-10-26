import { useMemo, useState } from 'react';
import { Slider, Widget, palette } from './chart';

/* Byte-pair encoding, learned live from a small corpus. Real tokenizers use
   the same algorithm over terabytes of text and vocabularies of 100k+. */
const CORPUS = `the model reads the text and predicts the next token . the transformer learns patterns in language .
language models learn from text on the internet . the training data shapes what the model knows .
learning is prediction . prediction is compression . the researchers trained the model on more data and the model learned more .
tokens are pieces of words . common words become single tokens and rare words split into pieces .
the policy requires developers to publish safety frameworks . the framework describes the evaluations and the mitigations .
interpretability researchers study the features inside the network . reading the paper requires understanding the methods .`;

type Merge = [string, string];

function learnMerges(corpus: string, n: number): Merge[] {
  const words = corpus.split(/\s+/).filter(Boolean);
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  let vocab = [...freq.entries()].map(([w, c]) => [['▁', ...w.split('')], c] as [string[], number]);
  const merges: Merge[] = [];
  for (let k = 0; k < n; k++) {
    const pairs = new Map<string, number>();
    for (const [syms, c] of vocab) {
      for (let i = 0; i < syms.length - 1; i++) {
        const key = syms[i] + '\u0000' + syms[i + 1];
        pairs.set(key, (pairs.get(key) ?? 0) + c);
      }
    }
    let best = '';
    let bestC = 1;
    for (const [p, c] of pairs) if (c > bestC) { best = p; bestC = c; }
    if (!best) break;
    const [a, b] = best.split('\u0000');
    merges.push([a, b]);
    vocab = vocab.map(([syms, c]) => {
      const out: string[] = [];
      for (let i = 0; i < syms.length; i++) {
        if (i < syms.length - 1 && syms[i] === a && syms[i + 1] === b) { out.push(a + b); i++; } else out.push(syms[i]);
      }
      return [out, c];
    });
  }
  return merges;
}

function encodeWord(w: string, merges: Merge[]): string[] {
  let syms = ['▁', ...w.split('')];
  for (const [a, b] of merges) {
    if (syms.length < 2) break;
    const out: string[] = [];
    for (let i = 0; i < syms.length; i++) {
      if (i < syms.length - 1 && syms[i] === a && syms[i + 1] === b) { out.push(a + b); i++; } else out.push(syms[i]);
    }
    syms = out;
  }
  // attach the lone word-boundary marker to the following symbol for display
  if (syms[0] === '▁' && syms.length > 1) syms = ['▁' + syms[1], ...syms.slice(2)];
  return syms;
}

export default function Tokenizer({ initial = 'The researchers trained the transformer on unbelievably large datasets.' }: { initial?: string }) {
  const [text, setText] = useState(initial);
  const [nMerges, setNMerges] = useState(120);
  const allMerges = useMemo(() => learnMerges(CORPUS.toLowerCase(), 300), []);
  const merges = allMerges.slice(0, nMerges);
  const tokens = useMemo(() => {
    const parts = text.toLowerCase().match(/[a-z0-9']+|[^\sa-z0-9']/g) ?? [];
    return parts.flatMap((p) => encodeWord(p, merges));
  }, [text, merges]);
  const vocabSize = new Set(CORPUS.toLowerCase().replace(/\s/g, '').split('')).size + 1 + merges.length;

  return (
    <Widget title="How text becomes tokens" kicker="Interactive · byte-pair encoding, learned live"
      note={<>Byte-pair encoding starts from single characters and repeatedly merges the most frequent adjacent pair in a training corpus into a new token. Slide the merge count: with zero merges every character is its own token; with more merges, common words and word pieces become single tokens while rare words stay fragmented. The ▁ marks the start of a word. This toy learned from {CORPUS.split(/\s+/).length} words; production tokenizers learn from billions.</>}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} aria-label="Text to tokenize" style={{ resize: 'vertical', fontSize: '1rem' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 14, minHeight: 40 }}>
        {tokens.map((t, i) => (
          <span key={i} className="mono" style={{
            padding: '3px 6px', borderRadius: 6, fontSize: '0.92rem', whiteSpace: 'pre',
            background: `color-mix(in srgb, ${palette[i % 6]} 18%, transparent)`, borderBottom: `2px solid ${palette[i % 6]}`,
          }}>{t}</span>
        ))}
      </div>
      <div className="controls">
        <Slider label="Merges learned" value={nMerges} min={0} max={allMerges.length} step={1} onChange={setNMerges} display={String(nMerges)} />
      </div>
      <div className="row small muted tabular" style={{ marginTop: 12, gap: 20 }}>
        <span>Characters: <strong style={{ color: 'var(--fg)' }}>{text.length}</strong></span>
        <span>Tokens: <strong style={{ color: 'var(--fg)' }}>{tokens.length}</strong></span>
        <span>Characters per token: <strong style={{ color: 'var(--fg)' }}>{(text.length / Math.max(1, tokens.length)).toFixed(2)}</strong></span>
        <span>Vocabulary size: <strong style={{ color: 'var(--fg)' }}>{vocabSize}</strong></span>
      </div>
      {nMerges > 0 && (
        <div className="xsmall faint" style={{ marginTop: 10 }}>
          First merges learned: {allMerges.slice(0, 8).map(([a, b]) => `${a}+${b}`).join(' · ')}
        </div>
      )}
    </Widget>
  );
}
