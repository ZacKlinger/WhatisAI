import { useState } from 'react';
import { Widget, palette } from './chart';

/* Sort AI systems into the EU AI Act's risk tiers. */
const TIERS = [
  { id: 'unacceptable', label: 'Prohibited', color: palette[4], desc: 'Banned outright (Article 5).' },
  { id: 'high', label: 'High risk', color: palette[1], desc: 'Allowed with strict obligations: risk management, data governance, documentation, human oversight, conformity assessment.' },
  { id: 'limited', label: 'Transparency', color: palette[5], desc: 'Must disclose that people are dealing with AI or AI-generated content (Article 50).' },
  { id: 'minimal', label: 'Minimal', color: palette[2], desc: 'No new obligations under the Act.' },
] as const;

const SYSTEMS: { name: string; tier: (typeof TIERS)[number]['id']; why: string }[] = [
  { name: 'Social scoring of citizens by public authorities', tier: 'unacceptable', why: 'Social scoring that leads to detrimental treatment is a prohibited practice under Article 5.' },
  { name: 'CV-screening software that ranks job applicants', tier: 'high', why: 'Employment and worker management is an Annex III high-risk area.' },
  { name: 'A customer-service chatbot', tier: 'limited', why: 'People must be told they are interacting with an AI system (Article 50).' },
  { name: 'A spam filter', tier: 'minimal', why: 'Most AI systems, like spam filters and game AI, carry no new obligations.' },
  { name: 'Emotion recognition in the workplace', tier: 'unacceptable', why: 'Inferring emotions in workplaces and schools is prohibited, except for medical or safety reasons.' },
  { name: 'AI that scores credit applications', tier: 'high', why: 'Creditworthiness assessment of natural persons is listed in Annex III.' },
  { name: 'A system generating realistic synthetic video (deepfakes)', tier: 'limited', why: 'Deepfakes must be disclosed as artificially generated or manipulated.' },
  { name: 'AI used to grade university admission exams', tier: 'high', why: 'Education and vocational training access and assessment is an Annex III area.' },
];

export default function RiskClassifier() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [active, setActive] = useState(0);
  const score = Object.entries(answers).filter(([i, t]) => SYSTEMS[Number(i)].tier === t).length;
  const done = Object.keys(answers).length === SYSTEMS.length;

  return (
    <Widget title="Classify it under the EU AI Act" kicker="Interactive · sort eight real-world systems"
      note={<>The Act regulates <em>uses</em>, not technologies. The same model can power a minimal-risk spam filter and a high-risk hiring tool. Separately, general-purpose AI models carry their own obligations, with extra duties for models with systemic risk. Simplified for learning: real classification turns on precise legal definitions and exemptions.</>}>
      <div className="grid grid-2" style={{ gap: 18 }}>
        <div className="stack" style={{ ['--stack' as string]: '8px' }}>
          {SYSTEMS.map((s, i) => {
            const a = answers[i];
            const ok = a && a === s.tier;
            return (
              <button key={i} type="button" onClick={() => setActive(i)} className={`quiz-option${active === i ? ' selected' : ''}${a ? (ok ? ' correct' : ' wrong') : ''}`} style={{ padding: '10px 14px' }}>
                <span style={{ flex: 1 }}>{s.name}</span>
                {a && <span className="pill" style={{ background: 'transparent' }}>{TIERS.find((t) => t.id === a)!.label}</span>}
              </button>
            );
          })}
        </div>
        <div>
          <div className="small muted" style={{ marginBottom: 8 }}>Classify: <strong style={{ color: 'var(--fg)' }}>{SYSTEMS[active].name}</strong></div>
          <div className="stack" style={{ ['--stack' as string]: '8px' }}>
            {TIERS.map((t) => (
              <button key={t.id} type="button" className="quiz-option" style={{ borderLeft: `5px solid ${t.color}` }} onClick={() => {
                setAnswers((a) => ({ ...a, [active]: t.id }));
                const next = SYSTEMS.findIndex((_, i) => i !== active && answers[i] === undefined);
                if (next >= 0) setActive(next);
              }}>
                <span><strong>{t.label}</strong><br /><span className="small muted">{t.desc}</span></span>
              </button>
            ))}
          </div>
          {answers[active] && (
            <div className={`feedback ${answers[active] === SYSTEMS[active].tier ? 'good' : 'bad'}`} style={{ marginTop: 12 }}>
              <strong>{answers[active] === SYSTEMS[active].tier ? 'Right.' : `It is ${TIERS.find((t) => t.id === SYSTEMS[active].tier)!.label.toLowerCase()}.`}</strong>
              {SYSTEMS[active].why}
            </div>
          )}
          {done && <div className="small" style={{ marginTop: 12 }}>Score: <strong>{score} / {SYSTEMS.length}</strong></div>}
        </div>
      </div>
    </Widget>
  );
}
