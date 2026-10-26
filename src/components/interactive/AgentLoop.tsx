import { useState } from 'react';
import { Widget, palette } from './chart';

type Step = { kind: 'user' | 'think' | 'tool' | 'result' | 'answer'; text: string; tool?: string };

const TRACE: Step[] = [
  { kind: 'user', text: 'How much training compute would a 70-billion-parameter model need if trained compute-optimally, and would it cross the EU AI Act’s systemic-risk threshold?' },
  { kind: 'think', text: 'Compute-optimal training is roughly 20 tokens per parameter, and compute is about 6 × parameters × tokens. I should compute that exactly rather than in my head, then check the threshold in the regulation itself.' },
  { kind: 'tool', tool: 'python', text: 'N = 70e9\nD = 20 * N\nC = 6 * N * D\nprint(f"{D:.2e} tokens, {C:.2e} FLOP")' },
  { kind: 'result', text: '1.40e+12 tokens, 5.88e+23 FLOP' },
  { kind: 'think', text: 'About 5.9×10²³ FLOP. Now the threshold. I recall 10²⁵ but I should verify in the primary text.' },
  { kind: 'tool', tool: 'search', text: 'EU AI Act Article 51 general-purpose AI systemic risk FLOP threshold' },
  { kind: 'result', text: 'Article 51(2): a GPAI model is presumed to have high-impact capabilities when the cumulative compute used for its training, measured in floating point operations, is greater than 10^25.' },
  { kind: 'think', text: '5.9×10²³ is about 17 times below 10²⁵. So the presumption does not apply, although the Commission can still designate a model on other criteria.' },
  { kind: 'answer', text: 'About 1.4 trillion training tokens and roughly 5.9×10²³ FLOP. That is well under the EU AI Act’s 10²⁵ FLOP presumption for systemic risk (Article 51), though the Commission can designate models on other grounds.' },
];

const STYLE: Record<Step['kind'], { label: string; color: string }> = {
  user: { label: 'User', color: 'var(--fg-2)' },
  think: { label: 'Model reasoning', color: palette[3] },
  tool: { label: 'Tool call', color: palette[0] },
  result: { label: 'Observation', color: palette[2] },
  answer: { label: 'Final answer', color: palette[1] },
};

export default function AgentLoop() {
  const [n, setN] = useState(1);
  return (
    <Widget title="Inside an agent loop" kicker="Interactive · step through a trace"
      note={<>An agent is a model in a loop. It reasons, decides to call a tool (run code, search, click a button), receives the result as new context, and continues until it can answer. The model itself never "runs" the tool: it emits a structured request, the surrounding software (the <em>harness</em> or <em>scaffold</em>) executes it, and the output is fed back as text. Everything an agent knows about the world arrives through that loop.</>}>
      <div className="stack" style={{ ['--stack' as string]: '10px' }}>
        {TRACE.slice(0, n).map((s, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '4px 1fr', gap: 12, animation: 'rise .35s var(--ease)' }}>
            <div style={{ background: STYLE[s.kind].color, borderRadius: 4 }} />
            <div>
              <div className="xsmall" style={{ color: STYLE[s.kind].color, fontWeight: 600, marginBottom: 3 }}>{STYLE[s.kind].label}{s.tool ? ` · ${s.tool}` : ''}</div>
              {s.kind === 'tool' || s.kind === 'result' ? (
                <pre className="mono" style={{ margin: 0, fontSize: '0.82rem', background: 'var(--bg-soft)', padding: '10px 12px', borderRadius: 10, whiteSpace: 'pre-wrap' }}>{s.text}</pre>
              ) : (
                <div style={{ fontSize: '0.95rem', fontStyle: s.kind === 'think' ? 'italic' : undefined, color: s.kind === 'think' ? 'var(--fg-2)' : undefined }}>{s.text}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="row" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-primary btn-sm" disabled={n >= TRACE.length} onClick={() => setN((v) => v + 1)}>Next step</button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={n >= TRACE.length} onClick={() => setN(TRACE.length)}>Show all</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setN(1)}>Restart</button>
        <span className="small muted">{n} / {TRACE.length}</span>
      </div>
    </Widget>
  );
}
