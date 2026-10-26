import { useMemo, useState } from 'react';
import { Widget, palette } from './chart';

/* You are the human rater. Each response has hidden features. A
   Bradley–Terry reward model learns from your choices which features you
   reward, then a "policy" picks whatever its learned reward likes best.
   If your choices carried a bias (say, toward length or flattery), the
   policy amplifies it: reward hacking, in miniature. */
const FEATURES = ['correct', 'concise', 'long', 'flattering'] as const;

interface Resp { text: string; f: [number, number, number, number] }

const QUESTION = 'Why does the sky look blue?';
const POOL: Resp[] = [
  { text: 'Sunlight scatters off air molecules, and shorter blue wavelengths scatter far more than red (Rayleigh scattering), so blue light reaches your eyes from every direction.', f: [1, 1, 0, 0] },
  { text: 'What a wonderful question! You clearly have a curious mind. The sky is blue because of the way sunlight interacts with the atmosphere, which is truly one of nature’s marvels.', f: [0.5, 0, 0.5, 1] },
  { text: 'Because the ocean reflects onto the sky.', f: [0, 1, 0, 0] },
  { text: 'Great question! Sunlight contains all colors. As it passes through the atmosphere, it collides with gas molecules. Shorter wavelengths like blue are scattered much more strongly than longer ones like red, an effect called Rayleigh scattering. This scattered blue light comes at us from all over the sky. At sunset, light travels through more air, so blue is scattered away and reds remain. It’s a beautiful example of physics in everyday life, and I’m so glad you asked!', f: [1, 0, 1, 1] },
  { text: 'Blue light scatters most in air (Rayleigh scattering).', f: [1, 1, 0, 0] },
  { text: 'The sky is blue because it is blue. Many people have wondered about this over the centuries, and there are many theories, and scientists continue to debate the deep reasons, which involve many complex factors in the atmosphere and in perception and in light itself.', f: [0, 0, 1, 0] },
  { text: 'You’re so smart to ask! Air scatters blue light more than red.', f: [1, 0.5, 0, 1] },
  { text: 'Rayleigh scattering: scattering strength rises steeply as wavelength shrinks (roughly 1/λ⁴), so blue dominates the scattered skylight. Violet scatters even more, but sunlight has less of it and our eyes are less sensitive to it.', f: [1, 0.5, 0.5, 0] },
];

const PAIRS: [number, number][] = [[0, 1], [2, 4], [3, 7], [5, 0], [6, 4], [1, 3], [7, 0], [3, 4]];

export default function RewardModel() {
  const [choices, setChoices] = useState<[number, number][]>([]); // [winner, loser]
  const round = choices.length;
  const done = round >= PAIRS.length;

  const weights = useMemo(() => {
    const w = [0, 0, 0, 0];
    for (let it = 0; it < 400; it++) {
      const g = [0, 0, 0, 0];
      for (const [a, b] of choices) {
        const d = POOL[a].f.map((v, i) => v - POOL[b].f[i]);
        const s = d.reduce((acc, v, i) => acc + v * w[i], 0);
        const p = 1 / (1 + Math.exp(-s));
        for (let i = 0; i < 4; i++) g[i] += (1 - p) * d[i];
      }
      for (let i = 0; i < 4; i++) w[i] += 0.3 * g[i] - 0.01 * w[i];
    }
    return w;
  }, [choices]);

  const reward = (r: Resp) => r.f.reduce((s, v, i) => s + v * weights[i], 0);
  const best = [...POOL].sort((a, b) => reward(b) - reward(a))[0];
  const maxW = Math.max(0.5, ...weights.map(Math.abs));

  return (
    <Widget title="Be the human rater" kicker="Interactive · learning a reward from preferences"
      note={<>This is the heart of RLHF. People compare two responses and pick the better one. A <strong>reward model</strong> (here a Bradley–Terry model over four hidden features) learns a score that predicts their choices. Then the policy is optimized to produce whatever scores highest. If raters systematically favored long or flattering answers, even slightly, optimization finds and exaggerates that preference. Try rating honestly, then reset and rate as if you love compliments.</>}>
      {!done ? (
        <div>
          <div className="small muted" style={{ marginBottom: 6 }}>Comparison {round + 1} of {PAIRS.length} · Question: <strong style={{ color: 'var(--fg)' }}>{QUESTION}</strong></div>
          <div className="grid grid-2" style={{ gap: 10 }}>
            {PAIRS[round].map((idx, side) => (
              <button key={idx} type="button" className="quiz-option" style={{ flexDirection: 'column', gap: 10, minHeight: 140 }}
                onClick={() => setChoices((c) => [...c, [idx, PAIRS[round][1 - side]]])}>
                <span className="xsmall faint">Response {side ? 'B' : 'A'}</span>
                <span style={{ fontSize: '0.94rem' }}>{POOL[idx].text}</span>
                <span className="small" style={{ fontWeight: 600, marginTop: 'auto' }}>Prefer this one</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="stack">
          <div className="small muted">After your {PAIRS.length} judgments, the policy optimized against your reward model would produce:</div>
          <div className="card card-soft" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem' }}>{best.text}</div>
        </div>
      )}
      <div style={{ marginTop: 18 }}>
        <div className="small" style={{ fontWeight: 600, marginBottom: 8 }}>What the reward model has learned you value</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {FEATURES.map((f, i) => (
            <div key={f} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 50px', gap: 10, alignItems: 'center' }}>
              <span className="small">{f}</span>
              <div style={{ position: 'relative', height: 14, background: 'var(--bg-muted)', borderRadius: 4 }}>
                <div style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1, background: 'var(--line-3)' }} />
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, borderRadius: 4, background: weights[i] >= 0 ? palette[i] : 'var(--bad)',
                  left: weights[i] >= 0 ? '50%' : `${50 - (Math.abs(weights[i]) / maxW) * 50}%`, width: `${(Math.abs(weights[i]) / maxW) * 50}%`, transition: 'all .4s var(--ease)',
                }} />
              </div>
              <span className="mono xsmall tabular" style={{ textAlign: 'right' }}>{weights[i].toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
      {round > 0 && <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={() => setChoices([])}>Reset and rate again</button>}
    </Widget>
  );
}
