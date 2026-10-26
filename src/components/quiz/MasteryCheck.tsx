import { useState } from 'react';
import type { Item } from '@/lib/items';
import { itemKey } from '@/lib/items';
import { enrollReview, recordCalibration, setModuleStatus } from '@/lib/progress';
import { useHydrated, useProgress } from '@/lib/useProgress';
import ItemView, { type ItemResult } from './ItemView';

interface Props {
  moduleId: string;
  items: Item[];
  nextHref?: string;
  nextTitle?: string;
}

const PASS = 0.8;

export default function MasteryCheck({ moduleId, items, nextHref, nextTitle }: Props) {
  const progress = useProgress();
  const hydrated = useHydrated();
  const [phase, setPhase] = useState<'intro' | 'run' | 'done'>('intro');
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<ItemResult[]>([]);
  const [attempt, setAttempt] = useState(0);

  const status = hydrated ? progress.modules[moduleId]?.status : undefined;
  const best = hydrated ? progress.modules[moduleId]?.score : undefined;

  if (!items.length) return null;

  function onResult(r: ItemResult) {
    setResults((rs) => [...rs, r]);
    if (r.confidence !== undefined) recordCalibration(r.confidence, r.correct, 'mastery');
  }

  function next() {
    if (idx + 1 < items.length) setIdx(idx + 1);
    else finish();
  }

  function finish() {
    const all = results;
    const score = all.reduce((s, r) => s + r.credit, 0) / items.length;
    setModuleStatus(moduleId, score >= PASS ? 'mastered' : 'completed', score);
    enrollReview(items.map((it) => itemKey(moduleId, it.id)));
    setPhase('done');
  }

  if (phase === 'intro') {
    return (
      <div className="widget" id="mastery">
        <div className="widget-head">
          <div>
            <div className="widget-kicker">Mastery check · {items.length} questions</div>
            <div className="h3" style={{ marginTop: 4 }}>Prove it to yourself</div>
          </div>
          {status === 'mastered' && <span className="pill pill-good">Mastered{best ? ` · ${Math.round(best * 100)}%` : ''}</span>}
          {status === 'placed' && <span className="pill" style={{ color: 'var(--c4)' }}>Placed out</span>}
        </div>
        <p className="muted" style={{ margin: '0 0 16px' }}>
          Score {Math.round(PASS * 100)}% or more to master this module. For each answer you will wager a confidence. Over time this
          builds a calibration record, the habit frontier researchers prize most: knowing what you know. Every question then joins your
          spaced-review deck so it returns just before you would forget it.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => { setPhase('run'); setIdx(0); setResults([]); setAttempt((a) => a + 1); }}>
          {status === 'mastered' ? 'Retake' : 'Begin the check'}
        </button>
      </div>
    );
  }

  if (phase === 'run') {
    const item = items[idx];
    return (
      <div className="widget" id="mastery">
        <div className="widget-head">
          <div className="widget-kicker">Question {idx + 1} of {items.length}</div>
          <div className="bar" style={{ width: 140 }}><span style={{ width: `${(idx / items.length) * 100}%` }} /></div>
        </div>
        <ItemView key={`${item.id}-${attempt}`} item={item} seed={`${item.id}-${attempt}`} wager onResult={onResult} onNext={next}
          nextLabel={idx + 1 < items.length ? 'Next question' : 'See results'} />
      </div>
    );
  }

  const score = results.reduce((s, r) => s + r.credit, 0) / items.length;
  const passed = score >= PASS;
  const confidentMisses = results.filter((r) => !r.correct && (r.confidence ?? 0) >= 0.9).length;
  return (
    <div className={`widget aura ${passed ? 'aura-t2' : 'aura-t4'}`} id="mastery" style={{ borderColor: 'transparent' }}>
      <div className="widget-kicker">Result</div>
      <div className="display" style={{ fontSize: 'clamp(2.4rem,6vw,3.6rem)', margin: '6px 0 4px' }}>{Math.round(score * 100)}%</div>
      <p style={{ margin: '0 0 16px', maxWidth: '52ch' }}>
        {passed
          ? 'Mastered. The questions now live in your review deck and will return at widening intervals.'
          : 'Not yet mastered, and that is useful information. Revisit the sections behind the questions you missed, then retake. The questions are in your review deck either way.'}
        {confidentMisses > 0 && ` You had ${confidentMisses} confident miss${confidentMisses > 1 ? 'es' : ''}: those mark beliefs worth re-examining.`}
      </p>
      <div className="row">
        {nextHref && <a href={nextHref} className="btn btn-primary">Next: {nextTitle}</a>}
        <button type="button" className="btn btn-secondary" onClick={() => setPhase('intro')}>Retake</button>
      </div>
    </div>
  );
}
