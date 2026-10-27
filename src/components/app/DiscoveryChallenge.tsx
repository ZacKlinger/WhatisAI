import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { evalPoly, runGeneralization } from '@/lib/generalization.mjs';
import '@/styles/discovery.css';

const models = [
  { id: 'a', name: 'Model A', description: 'A smoother curve', degree: 3 },
  { id: 'b', name: 'Model B', description: 'A curve that fits every training point', degree: 11 },
] as const;
const experimentA = runGeneralization(3);
const experimentB = runGeneralization(11);
const number = (n: number) => n < 0.001 ? '< 0.001' : n.toLocaleString('en-US', { maximumFractionDigits: 3 });
const applications = [
  { id: 'use', title: 'At work', question: 'Does it help on fresh tasks like mine?', action: 'Try a small set of representative tasks the workflow was not tuned on. Compare quality, time, and the effort of checking mistakes.', journey: 'use' },
  { id: 'research', title: 'Reading research', question: 'Were these examples used to choose the model?', action: 'Look for separate training, validation, and test data. Check whether the reported result was used repeatedly to choose settings.', journey: 'research' },
  { id: 'anticipate', title: 'Following trends', question: 'What evidence would show this transfers to my field?', action: 'Look for performance on relevant new tasks, then consider adoption costs and constraints. A better benchmark score alone does not establish workplace impact.', journey: 'anticipate' },
];

function Curve({ degree, showNew = false, regularization = 0, label }: { degree: number; showNew?: boolean; regularization?: number; label: string }) {
  const clip = useId();
  const result = useMemo(() => runGeneralization(degree, regularization), [degree, regularization]);
  const x = (v: number) => 18 + (v + 1.8) / 3.6 * 324;
  const y = (v: number) => 156 - (v + 2.4) / 4.8 * 138;
  const curve = Array.from({ length: 180 }, (_, i) => {
    const a = -1.7 + i / 179 * 3.4;
    return `${i ? 'L' : 'M'}${x(a).toFixed(2)},${y(Math.max(-4, Math.min(4, evalPoly(result.weights, a)))).toFixed(2)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 360 174" role="img" aria-label={label} className="discovery-chart">
      <desc>Filled dots are the 12 training examples.{showNew ? ' Hollow circles are 40 new examples. Error values are also provided as text below.' : ' The line is a model fitted to those examples.'}</desc>
      <defs><clipPath id={clip}><rect x="12" y="8" width="336" height="154" rx="8" /></clipPath></defs>
      <g clipPath={`url(#${clip})`}>
        <path d={`M18 ${y(0)}H342`} className="discovery-axis" />
        <path d={curve} className="discovery-curve" />
        {showNew && result.test.map(([a, b], i) => <circle key={`new-${i}`} cx={x(a)} cy={y(b)} r="3.5" className="discovery-new" />)}
        {result.train.map(([a, b], i) => <circle key={i} cx={x(a)} cy={y(b)} r="4" className="discovery-training" />)}
      </g>
    </svg>
  );
}

export default function DiscoveryChallenge({ base }: { base: string }) {
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [degree, setDegree] = useState(3);
  const [smooth, setSmooth] = useState(false);
  const [application, setApplication] = useState('use');
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  const experiment = useMemo(() => runGeneralization(degree, smooth ? 0.1 : 0), [degree, smooth]);
  const selected = applications.find((a) => a.id === application)!;
  const name = useId();
  useEffect(() => {
    if (step !== previousStep.current) { heading.current?.focus(); previousStep.current = step; }
  }, [step]);

  function reset() { setPrediction(''); setDegree(3); setSmooth(false); setApplication('use'); setStep(0); }

  return (
    <section className="discovery" aria-label="Three-minute discovery challenge" data-step={step}>
      <div className="discovery-top"><span className="eyebrow">Try it · about 3 minutes</span><span className="xsmall muted">{step + 1} / 3</span></div>
      <ol className="discovery-steps" aria-label="Challenge steps">
        {['Predict', 'Explore', 'Take it with you'].map((s, i) => <li key={s} aria-current={i === step ? 'step' : undefined}>{s}</li>)}
      </ol>
      <h2 ref={heading} tabIndex={-1} className="discovery-title">{step === 0 ? 'Can a perfect fit be a bad sign?' : step === 1 ? 'A perfect fit can miss the pattern.' : 'You now have a better question.'}</h2>

      {step === 0 && <>
        <p className="small muted">Both models learned from the same 12 examples. Which will make smaller errors on examples they have not seen?</p>
        <fieldset className="discovery-choices">
          <legend className="sr-only">Make a prediction</legend>
          {models.map((m) => <label key={m.id} className={`discovery-choice ${prediction === m.id ? 'is-selected' : ''}`}>
            <span className="discovery-choice-title"><input type="radio" name={name} value={m.id} checked={prediction === m.id} onChange={() => setPrediction(m.id)} /><strong>{m.name}</strong></span>
            <Curve degree={m.degree} label={`${m.name}: ${m.description}`} />
            <span className="small">{m.description}</span>
            <span className="xsmall muted">Training error: {number(m.id === 'a' ? experimentA.trainingError : experimentB.trainingError)}</span>
          </label>)}
          <label className="discovery-unsure"><input type="radio" name={name} value="unsure" checked={prediction === 'unsure'} onChange={() => setPrediction('unsure')} /> I’d want to test them first</label>
        </fieldset>
        <p className="xsmall muted">The filled dots are training examples. Error is average squared error; lower is better.</p>
        <button className="btn btn-primary discovery-main" type="button" disabled={!prediction} onClick={() => setStep(1)}>Reveal 40 new examples</button>
      </>}

      {step === 1 && <>
        <p className="small muted" role="status">{prediction === 'a' ? 'Your prediction matched this result. ' : prediction === 'b' ? 'The near-perfect training fit was tempting. ' : 'Testing is the right way to check. '}Model A made smaller errors on these new examples. Model B also fitted the noise in its training data.</p>
        <table className="discovery-results"><caption>Same 40 new examples · average squared error</caption><thead><tr><th scope="col">Model</th><th scope="col">Training</th><th scope="col">New examples</th></tr></thead><tbody>
          <tr><th scope="row">A · smoother</th><td>{number(experimentA.trainingError)}</td><td>{number(experimentA.newError)}</td></tr>
          <tr><th scope="row">B · flexible</th><td>{number(experimentB.trainingError)}</td><td>{number(experimentB.newError)}</td></tr>
        </tbody></table>
        <div className="discovery-experiment">
          <div className="row" style={{ justifyContent: 'space-between' }}><strong className="small">Try changing the curve</strong><span className="xsmall muted">● training · ○ new</span></div>
          <Curve degree={degree} regularization={smooth ? 0.1 : 0} showNew label={`Your curve at flexibility ${degree}, with training and new examples`} />
          <label htmlFor={`${name}-flex`} className="discovery-slider-label">Curve flexibility <output>{degree} / 11</output></label>
          <input id={`${name}-flex`} type="range" min="1" max="11" step="1" value={degree} onChange={(e) => setDegree(Number(e.target.value))} />
          <label className="discovery-unsure"><input type="checkbox" checked={smooth} onChange={(e) => setSmooth(e.target.checked)} /> Prefer smoother curves (regularization)</label>
          <p className="small discovery-error" aria-live="polite">New-example error: <strong>{number(experiment.newError)}</strong></p>
          <p className="xsmall muted">Some predictions can go outside the chart; the error includes them. These same examples are reused while you explore, so they serve as validation data, not a fresh final test.</p>
        </div>
        <button className="btn btn-primary discovery-main" type="button" onClick={() => setStep(2)}>What does this mean for me?</button>
      </>}

      {step === 2 && <>
        <p className="small muted">Learning a pattern that works on new examples is called <strong>generalization</strong>. A score on familiar examples cannot establish that on its own.</p>
        <div className="chip-row" role="group" aria-label="Apply this discovery">{applications.map((a) => <button key={a.id} className="chip" type="button" aria-pressed={application === a.id} onClick={() => setApplication(a.id)}>{a.title}</button>)}</div>
        <div className="discovery-takeaway" aria-live="polite"><h3 className="h3">{selected.question}</h3><p className="small muted">{selected.action}</p></div>
        <a className="btn btn-primary discovery-main" href={`${base}/explore/#${selected.journey}`}>Explore this direction</a>
        <a className="discovery-next link small" href={`${base}/learn/generalization/`}>Go deeper into learning versus memorizing</a>
        <details className="discovery-source"><summary>Related research, with an important limit</summary><p className="small muted">This small demo illustrates classical overfitting. It does not show that bigger AI models are always worse. In <a className="link" href="https://arxiv.org/abs/1912.02292" target="_blank" rel="noopener noreferrer">Deep Double Descent</a>, Nakkiran and coauthors (2019) studied how error can fall again as neural networks grow. Our demo is not a reproduction of that study.</p></details>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>Replay the same example</button>
      </>}
      <p className="discovery-note">Small curve-fitting simulation, calculated in your browser. This is not a language model. No account needed.</p>
    </section>
  );
}
