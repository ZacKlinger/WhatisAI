import { useMemo, useState } from 'react';
import { HALO, Widget, palette, useWidth } from './chart';

/* A hand-built 2D "embedding" whose axes loosely mean royalty and gender,
   plus a cluster of foods, so similarity and analogy are visible. Real
   embeddings have hundreds or thousands of dimensions. */
const WORDS: Record<string, [number, number, number]> = {
  king: [0.75, 0.8, 0], queen: [-0.7, 0.8, 0], prince: [0.62, 0.48, 0], princess: [-0.58, 0.5, 0],
  man: [0.7, -0.15, 0], woman: [-0.68, -0.15, 0], boy: [0.55, -0.42, 0], girl: [-0.52, -0.42, 0],
  apple: [0.22, -0.82, 1], banana: [0.4, -1.0, 1], bread: [-0.02, -1.02, 1], cheese: [-0.3, -0.88, 1],
};
/** Where each label sits relative to its point, so the food cluster stays legible on narrow screens. */
const LABEL_SIDE: Record<string, 'left' | 'below'> = { cheese: 'left', bread: 'below' };
const COLORS = ['var(--c1)', 'var(--c3)'];

function cos(a: number[], b: number[]) {
  const dot = a[0] * b[0] + a[1] * b[1];
  const na = Math.hypot(a[0], a[1]);
  const nb = Math.hypot(b[0], b[1]);
  return dot / (na * nb || 1);
}

export default function VectorSpace({ analogy = true }: { analogy?: boolean }) {
  const [query, setQuery] = useState('king');
  const [mode, setMode] = useState<'similar' | 'analogy'>('similar');
  const [ref, width] = useWidth<HTMLDivElement>(600);
  const W = Math.min(width, 640);
  const H = Math.round(W * 0.78);
  const sx = (v: number) => W / 2 + v * (W / 2 - 40);
  const sy = (v: number) => H / 2 - v * (H / 2 - 40) + 20;

  const q = WORDS[query];
  const ranked = useMemo(
    () => Object.entries(WORDS).filter(([w]) => w !== query).map(([w, v]) => [w, cos([q[0], q[1]], [v[0], v[1]])] as const).sort((a, b) => b[1] - a[1]),
    [query, q],
  );

  const target = [WORDS.king[0] - WORDS.man[0] + WORDS.woman[0], WORDS.king[1] - WORDS.man[1] + WORDS.woman[1]];
  const nearest = Object.entries(WORDS).filter(([w]) => !['king', 'man', 'woman'].includes(w)).map(([w, v]) => [w, Math.hypot(v[0] - target[0], v[1] - target[1])] as const).sort((a, b) => a[1] - b[1])[0][0];

  return (
    <Widget title="Meaning as geometry" kicker="Interactive · click a word"
      note={<>Similar meanings point the same way (cosine similarity near 1). Directions carry meaning too: <em>man</em> → <em>woman</em> ≈ <em>king</em> → <em>queen</em>.</>}>
      {analogy && (
        <div className="chip-row" style={{ marginBottom: 12 }}>
          <button type="button" className="chip" aria-pressed={mode === 'similar'} onClick={() => setMode('similar')}>Similarity</button>
          <button type="button" className="chip" aria-pressed={mode === 'analogy'} onClick={() => setMode('analogy')}>Analogy: king − man + woman</button>
        </div>
      )}
      <div ref={ref} style={{ background: 'var(--bg-soft)', borderRadius: 'var(--radius)' }}>
        <svg viewBox={`0 0 ${W} ${H + 20}`} width="100%" role="img" aria-label="Two-dimensional word embedding">
          <defs>
            <marker id="vs-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--fg)' }} />
            </marker>
          </defs>
          <line x1={sx(-1.05)} x2={sx(1.05)} y1={sy(0)} y2={sy(0)} style={{ stroke: 'var(--grid)' }} />
          <line x1={sx(0)} x2={sx(0)} y1={sy(-1.1)} y2={sy(1.05)} style={{ stroke: 'var(--grid)' }} />
          {mode === 'similar' && (
            <line x1={sx(0)} y1={sy(0)} x2={sx(q[0])} y2={sy(q[1])} style={{ stroke: 'var(--fg)', strokeWidth: 2 }} markerEnd="url(#vs-arr)" />
          )}
          {mode === 'analogy' && (
            <g>
              <line x1={sx(WORDS.man[0])} y1={sy(WORDS.man[1])} x2={sx(WORDS.woman[0])} y2={sy(WORDS.woman[1])} style={{ stroke: palette[1], strokeWidth: 2, strokeDasharray: '5 4' }} markerEnd="url(#vs-arr)" />
              <line x1={sx(WORDS.king[0])} y1={sy(WORDS.king[1])} x2={sx(target[0])} y2={sy(target[1])} style={{ stroke: palette[1], strokeWidth: 2.5 }} markerEnd="url(#vs-arr)" />
              <circle cx={sx(target[0])} cy={sy(target[1])} r={16} style={{ fill: 'none', stroke: palette[1], strokeWidth: 2, strokeDasharray: '3 3' }} />
            </g>
          )}
          {Object.entries(WORDS).map(([w, v]) => {
            const active = mode === 'similar' ? w === query : ['king', 'man', 'woman', nearest].includes(w);
            const sim = mode === 'similar' && w !== query ? cos([q[0], q[1]], [v[0], v[1]]) : null;
            return (
              <g key={w} onClick={() => { setQuery(w); setMode('similar'); }} style={{ cursor: 'pointer' }} role="button" tabIndex={0} aria-label={w}
                onKeyDown={(e) => { if (e.key === 'Enter') { setQuery(w); setMode('similar'); } }}>
                <circle cx={sx(v[0])} cy={sy(v[1])} r={active ? 7 : 5} style={{ fill: COLORS[v[2]], opacity: sim === null || sim > 0.6 ? 1 : 0.45 }} />
                <text x={sx(v[0]) + (LABEL_SIDE[w] === 'left' ? -10 : LABEL_SIDE[w] === 'below' ? 0 : 10)} y={sy(v[1]) + (LABEL_SIDE[w] === 'below' ? 20 : 4)}
                  textAnchor={LABEL_SIDE[w] === 'left' ? 'end' : LABEL_SIDE[w] === 'below' ? 'middle' : 'start'}
                  style={{ fontSize: 13, fill: 'var(--fg)', fontWeight: active ? 650 : 450, ...HALO }}>{w}</text>
              </g>
            );
          })}
        </svg>
      </div>
      {mode === 'similar' ? (
        <div style={{ marginTop: 14 }}>
          <div className="small muted" style={{ marginBottom: 8 }}>Most similar to <strong style={{ color: 'var(--fg)' }}>{query}</strong> (cosine similarity):</div>
          <div className="chip-row">
            {ranked.slice(0, 5).map(([w, s]) => <span key={w} className="pill">{w} · <span className="mono">{s.toFixed(2)}</span></span>)}
            <span className="pill pill-outline">least: {ranked[ranked.length - 1][0]} · <span className="mono">{ranked[ranked.length - 1][1].toFixed(2)}</span></span>
          </div>
        </div>
      ) : (
        <div className="small" style={{ marginTop: 14 }}>
          king − man + woman lands nearest to <strong>{nearest}</strong>. Subtracting <em>man</em> and adding <em>woman</em> moves along the same direction that separates them, a direction the space has learned to mean something like gender.
        </div>
      )}
    </Widget>
  );
}
