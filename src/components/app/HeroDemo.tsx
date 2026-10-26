import { useEffect, useState } from 'react';

/* The hero's living sentence: a model "thinking" one token at a time, its
   candidate next tokens shimmering underneath. Purely illustrative. */
const SCRIPTS: { tokens: string[]; alts: [string, number][][] }[] = [
  {
    tokens: ['Learning', ' is', ' prediction', ',', ' and', ' prediction', ' is', ' understanding', '.'],
    alts: [[], [[' is', 0.62], [' requires', 0.21], [' means', 0.09]], [[' prediction', 0.34], [' change', 0.22], [' a', 0.19]], [[',', 0.51], ['.', 0.32], [' made', 0.06]], [[' and', 0.58], [' but', 0.18], [' so', 0.11]], [[' prediction', 0.41], [' compression', 0.29], [' every', 0.08]], [[' is', 0.71], [' becomes', 0.14], [' needs', 0.05]], [[' understanding', 0.37], [' compression', 0.31], [' power', 0.12]], [['.', 0.88], [' of', 0.05], [',', 0.03]]],
  },
  {
    tokens: ['Read', ' the', ' frontier', ' the', ' day', ' it', ' is', ' written', '.'],
    alts: [[], [[' the', 0.66], [' every', 0.12], [' a', 0.09]], [[' frontier', 0.28], [' paper', 0.26], [' room', 0.11]], [[' the', 0.36], [' as', 0.22], [' with', 0.18]], [[' day', 0.64], [' moment', 0.21], [' week', 0.08]], [[' it', 0.73], [' they', 0.09], [' that', 0.08]], [[' is', 0.58], [' was', 0.27], [' appears', 0.07]], [[' written', 0.44], [' published', 0.38], [' born', 0.06]], [['.', 0.91], [',', 0.04], ['!', 0.02]]],
  },
];

export default function HeroDemo() {
  const [s, setS] = useState(0);
  const [n, setN] = useState(1);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setN(SCRIPTS[0].tokens.length); return; }
    const id = window.setInterval(() => {
      setN((v) => {
        if (v < SCRIPTS[s].tokens.length) return v + 1;
        return v;
      });
    }, 900);
    return () => window.clearInterval(id);
  }, [s]);
  useEffect(() => {
    if (n >= SCRIPTS[s].tokens.length) {
      const id = window.setTimeout(() => { setS((v) => (v + 1) % SCRIPTS.length); setN(1); }, 3600);
      return () => window.clearTimeout(id);
    }
  }, [n, s]);

  const script = SCRIPTS[s];
  const alts = n < script.tokens.length ? script.alts[n] : [];
  return (
    <div className="hero-demo" aria-label="A language model generating a sentence one token at a time" role="img">
      {/* pre-wrap keeps each token's leading space but lets the sentence wrap, so the card grows taller instead of wider. */}
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.35rem, 2.6vw, 2rem)', letterSpacing: '-0.01em', lineHeight: 1.35, minHeight: '4.05em', overflowWrap: 'break-word' }}>
        {script.tokens.slice(0, n).map((t, i) => (
          <span key={`${s}-${i}`} style={{ animation: 'rise .5s var(--ease)', display: 'inline', whiteSpace: 'pre-wrap' }}>{t}</span>
        ))}
        <span style={{ display: 'inline-block', width: 3, height: '0.95em', background: 'currentColor', verticalAlign: '-0.1em', marginLeft: 3, animation: 'twinkle 1s infinite' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14, minHeight: 34, flexWrap: 'wrap' }}>
        {alts.map(([t, p], i) => (
          <span key={`${s}-${n}-${i}`} className="mono" style={{
            fontSize: 12.5, padding: '6px 10px', borderRadius: 999, animation: `pop .35s var(--ease) ${i * 0.06}s both`,
            background: i === 0 ? 'var(--bg-inverse)' : 'color-mix(in srgb, var(--bg) 60%, transparent)', color: i === 0 ? 'var(--fg-inverse)' : 'var(--fg)',
            backdropFilter: 'blur(8px)',
          }}>
            {JSON.stringify(t)} <span style={{ opacity: 0.6 }}>{Math.round(p * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
