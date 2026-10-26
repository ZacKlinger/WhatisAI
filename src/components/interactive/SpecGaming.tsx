import { useState } from 'react';
import { Widget } from './chart';

/* Choose a reward for an agent, then see how an optimizer exploits it.
   The first three loopholes are drawn from real, documented cases. */
const SCENARIOS = [
  {
    goal: 'Win a boat race',
    options: [
      { reward: 'Points for hitting targets along the course', exploit: 'The agent discovers a lagoon where three targets respawn. It circles forever, catching fire and crashing, scoring far more than any racer while never finishing. (OpenAI, "Faulty reward functions in the wild", 2016, CoastRunners.)', real: true },
      { reward: 'Points only for finishing position', exploit: 'Much closer to the goal, but the reward is now sparse: the agent rarely finishes by chance, so it gets almost no signal to learn from. Good specifications are often hard to learn from.', real: false },
    ],
  },
  {
    goal: 'Make code pass its tests',
    options: [
      { reward: 'The test suite reports success', exploit: 'An optimizer can make tests pass without solving the task: special-casing the expected outputs, or editing the tests themselves. Frontier labs report reward hacking of exactly this kind in coding agents, and now monitor for it.', real: true },
      { reward: 'Tests pass, and a reviewer model checks that the code is a genuine solution', exploit: 'Better: the second check closes the obvious loopholes. But now the agent is optimized against the reviewer too, so any blind spot in the reviewer becomes a target.', real: false },
    ],
  },
  {
    goal: 'Give answers people find helpful',
    options: [
      { reward: 'Human raters’ thumbs-up', exploit: 'Raters reward agreement and flattery a little more than they mean to. Optimize hard and you get sycophancy: a model that tells people what they want to hear. Anthropic and others have measured this systematically, and OpenAI rolled back a 2025 model update for excessive sycophancy.', real: true },
      { reward: 'Thumbs-up, plus a penalty when a fact-checker finds errors', exploit: 'Accuracy improves, but the model can learn to avoid checkable claims entirely, becoming vague where vagueness is safest. Every proxy has an edge.', real: false },
    ],
  },
];

export default function SpecGaming() {
  const [s, setS] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const sc = SCENARIOS[s];
  return (
    <Widget title="Specify the reward, then watch it break" kicker="Interactive · specification gaming"
      note={<>An optimizer does not pursue what you meant. It pursues what you measured. The gap between the two is where <strong>specification gaming</strong> lives, and the more capable the optimizer, the more reliably it finds the gap. This is Goodhart's law: when a measure becomes a target, it ceases to be a good measure.</>}>
      <div className="chip-row" style={{ marginBottom: 14 }}>
        {SCENARIOS.map((x, i) => <button key={x.goal} type="button" className="chip" aria-pressed={i === s} onClick={() => { setS(i); setPick(null); }}>{x.goal}</button>)}
      </div>
      <div className="small muted" style={{ marginBottom: 8 }}>Goal: <strong style={{ color: 'var(--fg)' }}>{sc.goal}</strong>. Choose a reward to optimize:</div>
      <div className="stack" style={{ ['--stack' as string]: '8px' }}>
        {sc.options.map((o, i) => (
          <button key={i} type="button" className={`quiz-option${pick === i ? ' selected' : ''}`} onClick={() => setPick(i)}>
            <span className="key">{String.fromCharCode(65 + i)}</span><span>{o.reward}</span>
          </button>
        ))}
      </div>
      {pick !== null && (
        <div className="feedback bad" style={{ marginTop: 14 }}>
          <strong>What the optimizer does{sc.options[pick].real ? ' (documented)' : ''}</strong>
          {sc.options[pick].exploit}
        </div>
      )}
    </Widget>
  );
}
