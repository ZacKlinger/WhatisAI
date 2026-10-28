import { useMemo, useState, type ReactNode } from 'react';
import { seededShuffle, type Item } from '@/lib/items';
import { Figure } from '@/components/figures/registry';
import { CONFIDENCES } from '@/lib/confidence';

export interface ItemResult {
  correct: boolean;
  /** Partial credit 0..1 for match/order items. */
  credit: number;
  confidence?: number;
}

interface Props {
  item: Item;
  seed?: string;
  /** Ask for a confidence wager before revealing the answer. */
  wager?: boolean;
  /** Show the explanation after answering. */
  explain?: boolean;
  onResult?: (r: ItemResult) => void;
  onNext?: () => void;
  nextLabel?: string;
  compact?: boolean;
}

const KEYS = 'ABCDEFGHIJ';
export { CONFIDENCES } from '@/lib/confidence';

function fmt(v: number, f?: string, unit?: string) {
  let s: string;
  if (f === 'sci' || (Math.abs(v) >= 1e6 && f !== 'int')) {
    const e = Math.floor(Math.log10(Math.abs(v)));
    const m = v / 10 ** e;
    s = `${m.toFixed(m < 10 ? 1 : 0)} × 10^${e}`;
  } else if (f === 'pct') s = `${Math.round(v)}%`;
  else if (f === 'dec') s = v.toFixed(2);
  else s = Math.round(v).toLocaleString();
  return unit ? `${s} ${unit}` : s;
}

function supify(s: string): ReactNode {
  const parts = s.split(/\^(-?\d+)/);
  return parts.map((p, i) => (i % 2 ? <sup key={i}>{p}</sup> : <span key={i}>{p}</span>));
}

export default function ItemView({ item, seed = item.id, wager = false, explain = true, onResult, onNext, nextLabel = 'Continue', compact }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ItemResult | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  // per-kind response state
  const [choice, setChoice] = useState<number | null>(null);
  const [multi, setMulti] = useState<number[]>([]);
  const rightShuffled = useMemo(
    () => (item.kind === 'match' ? seededShuffle(item.pairs.map((p) => p[1]), seed) : []),
    [item, seed],
  );
  const [pairs, setPairs] = useState<Record<number, number>>({});
  const [activeLeft, setActiveLeft] = useState<number | null>(null);
  const [order, setOrder] = useState<number[]>(() =>
    item.kind === 'order' ? seededShuffle(item.items.map((_, i) => i), seed + 'o') : [],
  );
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [est, setEst] = useState<number>(() => {
    if (item.kind !== 'estimate') return 0;
    return item.log ? Math.sqrt(item.min * item.max) : (item.min + item.max) / 2;
  });
  const [touchedEst, setTouchedEst] = useState(false);
  const [spot, setSpot] = useState<string | null>(null);

  const complete = (() => {
    switch (item.kind) {
      case 'mc': return choice !== null;
      case 'multi': return multi.length > 0;
      case 'match': return Object.keys(pairs).length === item.pairs.length;
      case 'order': return true;
      case 'estimate': return touchedEst;
      case 'hotspot': return spot !== null;
    }
  })();

  function grade(): ItemResult {
    switch (item.kind) {
      case 'mc': {
        const ok = choice === item.answer;
        return { correct: ok, credit: ok ? 1 : 0 };
      }
      case 'multi': {
        const a = new Set(item.answers);
        const ok = multi.length === a.size && multi.every((m) => a.has(m));
        const hits = multi.filter((m) => a.has(m)).length - multi.filter((m) => !a.has(m)).length;
        return { correct: ok, credit: Math.max(0, hits / a.size) };
      }
      case 'match': {
        let right = 0;
        item.pairs.forEach((p, i) => {
          if (rightShuffled[pairs[i]] === p[1]) right++;
        });
        return { correct: right === item.pairs.length, credit: right / item.pairs.length };
      }
      case 'order': {
        const right = order.filter((v, i) => v === i).length;
        return { correct: right === item.items.length, credit: right / item.items.length };
      }
      case 'estimate': {
        const ok = item.log
          ? Math.max(est / item.answer, item.answer / est) <= item.tolerance
          : Math.abs(est - item.answer) <= item.tolerance;
        return { correct: ok, credit: ok ? 1 : 0 };
      }
      case 'hotspot': {
        const ok = spot === item.answer;
        return { correct: ok, credit: ok ? 1 : 0 };
      }
    }
  }

  function submit(c?: number) {
    if (!complete || submitted) return;
    const r = { ...grade(), confidence: c };
    setResult(r);
    setSubmitted(true);
    if (c !== undefined) setConfidence(c);
    onResult?.(r);
  }

  const optionClass = (i: number, selected: boolean, isAnswer: boolean) => {
    if (!submitted) return `quiz-option${selected ? ' selected' : ''}`;
    if (isAnswer) return 'quiz-option correct';
    if (selected) return 'quiz-option wrong';
    return 'quiz-option';
  };

  const pairColors = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];

  let body: ReactNode = null;
  switch (item.kind) {
    case 'mc':
      body = (
        <div className="stack" style={{ ['--stack' as string]: '8px' }}>
          {item.choices.map((c, i) => (
            <button key={i} type="button" className={optionClass(i, choice === i, i === item.answer)} disabled={submitted} onClick={() => setChoice(i)} aria-pressed={choice === i}>
              <span className="key">{KEYS[i]}</span>
              <span>{c}</span>
            </button>
          ))}
        </div>
      );
      break;
    case 'multi':
      body = (
        <div className="stack" style={{ ['--stack' as string]: '8px' }}>
          <div className="xsmall faint">Select all that apply.</div>
          {item.choices.map((c, i) => {
            const sel = multi.includes(i);
            return (
              <button key={i} type="button" className={optionClass(i, sel, item.answers.includes(i))} disabled={submitted} aria-pressed={sel}
                onClick={() => setMulti((m) => (sel ? m.filter((x) => x !== i) : [...m, i]))}>
                <span className="key" style={{ borderRadius: 5 }}>{sel ? '✓' : ''}</span>
                <span>{c}</span>
              </button>
            );
          })}
        </div>
      );
      break;
    case 'match': {
      const usedRight = new Map<number, number>();
      Object.entries(pairs).forEach(([l, r]) => usedRight.set(r, Number(l)));
      body = (
        <div>
          <div className="xsmall faint" style={{ marginBottom: 10 }}>Tap an item, then its match.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="stack" style={{ ['--stack' as string]: '8px' }}>
              {item.pairs.map((p, i) => {
                const paired = pairs[i] !== undefined;
                const color = paired ? pairColors[i % pairColors.length] : undefined;
                const ok = submitted && rightShuffled[pairs[i]] === p[1];
                return (
                  <button key={i} type="button" disabled={submitted}
                    className={`quiz-option${activeLeft === i ? ' selected' : ''}${submitted ? (ok ? ' correct' : ' wrong') : ''}`}
                    style={{ borderLeft: color ? `4px solid ${color}` : undefined, minHeight: 52 }}
                    onClick={() => setActiveLeft(i)}>
                    <span>{p[0]}</span>
                  </button>
                );
              })}
            </div>
            <div className="stack" style={{ ['--stack' as string]: '8px' }}>
              {rightShuffled.map((r, j) => {
                const owner = usedRight.get(j);
                const color = owner !== undefined ? pairColors[owner % pairColors.length] : undefined;
                return (
                  <button key={j} type="button" disabled={submitted}
                    className="quiz-option"
                    style={{ borderRight: color ? `4px solid ${color}` : undefined, minHeight: 52, opacity: activeLeft === null && owner === undefined && !submitted ? 0.85 : 1 }}
                    onClick={() => {
                      if (activeLeft === null) return;
                      setPairs((ps) => {
                        const next: Record<number, number> = {};
                        for (const [l, rr] of Object.entries(ps)) if (rr !== j && Number(l) !== activeLeft) next[Number(l)] = rr;
                        next[activeLeft] = j;
                        return next;
                      });
                      const nextLeft = item.pairs.findIndex((_, i) => i !== activeLeft && pairs[i] === undefined);
                      setActiveLeft(nextLeft >= 0 ? nextLeft : null);
                    }}>
                    <span>{r}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {submitted && result && !result.correct && (
            <div className="small muted" style={{ marginTop: 12 }}>
              Correct pairs: {item.pairs.map((p, i) => <span key={i}><strong>{p[0]}</strong> → {p[1]}{i < item.pairs.length - 1 ? ' · ' : ''}</span>)}
            </div>
          )}
        </div>
      );
      break;
    }
    case 'order':
      body = (
        <div>
          <div className="xsmall faint" style={{ marginBottom: 10 }}>Drag or use the arrows. First goes on top.</div>
          <ol className="stack" style={{ ['--stack' as string]: '8px', listStyle: 'none', padding: 0, margin: 0 }}>
            {order.map((idx, pos) => {
              const ok = submitted && idx === pos;
              return (
                <li key={idx}
                  draggable={!submitted}
                  onDragStart={() => setDragIdx(pos)}
                  onDragOver={(e) => { e.preventDefault(); if (dragIdx === null || dragIdx === pos) return; setOrder((o) => { const n = o.slice(); const [m] = n.splice(dragIdx, 1); n.splice(pos, 0, m); return n; }); setDragIdx(pos); }}
                  onDragEnd={() => setDragIdx(null)}
                  className={`quiz-option${submitted ? (ok ? ' correct' : ' wrong') : ''}`}
                  style={{ cursor: submitted ? 'default' : 'grab', alignItems: 'center', opacity: dragIdx === pos ? 0.5 : 1 }}>
                  <span className="key">{pos + 1}</span>
                  <span style={{ flex: 1 }}>{item.items[idx]}</span>
                  {!submitted && (
                    <span style={{ display: 'flex', gap: 2 }}>
                      <button type="button" className="icon-btn" style={{ width: 30, height: 30 }} aria-label="Move up" disabled={pos === 0}
                        onClick={() => setOrder((o) => { const n = o.slice(); [n[pos - 1], n[pos]] = [n[pos], n[pos - 1]]; return n; })}>↑</button>
                      <button type="button" className="icon-btn" style={{ width: 30, height: 30 }} aria-label="Move down" disabled={pos === order.length - 1}
                        onClick={() => setOrder((o) => { const n = o.slice(); [n[pos + 1], n[pos]] = [n[pos], n[pos + 1]]; return n; })}>↓</button>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          {submitted && result && !result.correct && (
            <div className="small muted" style={{ marginTop: 12 }}>Correct order: {item.items.join(' → ')}</div>
          )}
        </div>
      );
      break;
    case 'estimate': {
      const toPos = (v: number) => (item.log ? (Math.log10(v) - Math.log10(item.min)) / (Math.log10(item.max) - Math.log10(item.min)) : (v - item.min) / (item.max - item.min));
      const fromPos = (p: number) => (item.log ? 10 ** (Math.log10(item.min) + p * (Math.log10(item.max) - Math.log10(item.min))) : item.min + p * (item.max - item.min));
      const pos = toPos(est);
      const ansPos = toPos(item.answer);
      body = (
        <div style={{ padding: '8px 4px' }}>
          <div style={{ textAlign: 'center', fontSize: '1.9rem', letterSpacing: '-0.03em', fontWeight: 500, marginBottom: 6 }} className="tabular">
            {supify(fmt(est, item.format, item.unit))}
          </div>
          <div style={{ position: 'relative' }}>
            <input type="range" min={0} max={1000} value={Math.round(pos * 1000)} disabled={submitted}
              aria-label="Your estimate"
              onChange={(e) => { setEst(fromPos(Number(e.target.value) / 1000)); setTouchedEst(true); }} />
            {submitted && (
              <div style={{ position: 'absolute', left: `calc(${ansPos * 100}% - 1px)`, top: -6, width: 2, height: 34, background: 'var(--good)', borderRadius: 2 }} aria-hidden="true" />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }} className="xsmall faint tabular">
            <span>{supify(fmt(item.min, item.format, item.unit))}</span>
            <span>{item.log ? 'log scale' : ''}</span>
            <span>{supify(fmt(item.max, item.format, item.unit))}</span>
          </div>
          {submitted && (
            <div className="small" style={{ marginTop: 10, textAlign: 'center' }}>
              Answer: <strong>{supify(fmt(item.answer, item.format, item.unit))}</strong>
              {item.log && <span className="muted"> · you were off by {Math.max(est / item.answer, item.answer / est).toFixed(1)}×</span>}
            </div>
          )}
        </div>
      );
      break;
    }
    case 'hotspot':
      body = (
        <div>
          <div className="xsmall faint" style={{ marginBottom: 8 }}>Click your answer on the figure.</div>
          <Figure spec={item.figure} selected={spot} onSelect={submitted ? undefined : setSpot} reveal={submitted ? item.answer : undefined} />
        </div>
      );
      break;
  }

  return (
    <div className="item-view" style={{ animation: 'rise 0.4s var(--ease)' }}>
      <div style={{ fontSize: compact ? '1.02rem' : '1.12rem', lineHeight: 1.5, letterSpacing: '-0.012em', fontWeight: 500, marginBottom: 14 }}>
        {item.prompt}
      </div>
      {item.figure && item.kind !== 'hotspot' && (
        <div style={{ marginBottom: 14 }}>
          <Figure spec={item.figure} />
        </div>
      )}
      {body}

      {!submitted && (
        <div style={{ marginTop: 18 }}>
          {wager ? (
            <div style={{ opacity: complete ? 1 : 0.45, transition: 'opacity .3s' }}>
              <div className="small muted" style={{ marginBottom: 8 }}>How likely is your whole answer to be correct?</div>
              <div className="chip-row">
                {CONFIDENCES.map((c) => (
                  <button key={c} type="button" className="chip" disabled={!complete} onClick={() => submit(c)}>
                    {c === 0.99 ? 'Certain · 99%' : `${Math.round(c * 100)}%`}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-primary" disabled={!complete} onClick={() => submit()}>Check answer</button>
          )}
        </div>
      )}

      {submitted && result && (
        <div style={{ marginTop: 18 }} className="stack">
          <div className={`feedback ${result.correct ? 'good' : 'bad'}`}>
            <strong>
              {result.correct ? 'Correct.' : result.credit > 0 ? `Partly right (${Math.round(result.credit * 100)}%).` : 'Not quite.'}
              {confidence !== null && (
                <span style={{ fontWeight: 400 }} className="muted">
                  {' '}You wagered {Math.round(confidence * 100)}%.
                  {!result.correct && confidence >= 0.9 ? ' A confident miss.' : ''}
                  {result.correct && confidence <= 0.5 ? ' A correct answer at lower confidence.' : ''}
                </span>
              )}
            </strong>
            {explain && <span>{item.explain}</span>}
          </div>
          {onNext && (
            <button type="button" className="btn btn-primary" onClick={onNext} autoFocus>{nextLabel}</button>
          )}
        </div>
      )}
    </div>
  );
}
