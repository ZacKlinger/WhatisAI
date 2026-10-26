import { useMemo, useState } from 'react';
import type { Item } from '@/lib/items';
import { dueReviews, getState, gradeReview, recordCalibration } from '@/lib/progress';
import { useHydrated, useProgress } from '@/lib/useProgress';
import ItemView from '@/components/quiz/ItemView';

interface Props { bank: Record<string, Item[]>; titles: Record<string, string>; base: string }

export default function ReviewQueue({ bank, titles, base }: Props) {
  const progress = useProgress();
  const hydrated = useHydrated();
  const [session, setSession] = useState<string[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const lookup = useMemo(() => {
    const m = new Map<string, Item>();
    for (const [mod, items] of Object.entries(bank)) for (const it of items) m.set(`${mod}/${it.id}`, it);
    return m;
  }, [bank]);

  if (!hydrated) return <div style={{ minHeight: 240 }} />;
  const deck = Object.entries(progress.review).filter(([k]) => lookup.has(k));
  const due = dueReviews().filter((k) => lookup.has(k));
  const upcoming = deck.filter(([, c]) => c.due > Date.now()).sort((a, b) => a[1].due - b[1].due);

  const begin = (keys: string[]) => { setSession(keys.slice(0, 20)); setIdx(0); setCorrect(0); };

  if (session && idx < session.length) {
    const key = session[idx];
    const item = lookup.get(key)!;
    const mod = key.split('/')[0];
    return (
      <div className="card" style={{ padding: 'clamp(18px,3vw,32px)' }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="xsmall faint">Card {idx + 1} of {session.length} · from <a className="link" href={`${base}/learn/${mod}/`}>{titles[mod] ?? mod}</a></div>
          <div className="bar" style={{ width: 140 }}><span style={{ width: `${(idx / session.length) * 100}%` }} /></div>
        </div>
        <ItemView key={key + idx} item={item} seed={key + getState().review[key]?.reps} wager
          onResult={(r) => { gradeReview(key, r.correct, r.confidence ?? 0.7); recordCalibration(r.confidence ?? 0.7, r.correct, 'review'); if (r.correct) setCorrect((c) => c + 1); }}
          onNext={() => setIdx((i) => i + 1)} nextLabel={idx + 1 < session.length ? 'Next card' : 'Finish'} />
      </div>
    );
  }

  if (session && idx >= session.length) {
    return (
      <div className="card aura aura-t2" style={{ borderColor: 'transparent', padding: 'clamp(24px,4vw,48px)' }}>
        <div className="eyebrow" style={{ color: 'var(--fg)' }}>Session complete</div>
        <div className="display" style={{ fontSize: 'clamp(2.4rem,6vw,3.6rem)', margin: '8px 0' }}>{correct} / {session.length}</div>
        <p style={{ maxWidth: '50ch' }}>Cards you knew confidently move further into the future. Cards you missed return tomorrow. This is how knowledge becomes durable.</p>
        <button type="button" className="btn btn-primary" onClick={() => setSession(null)}>Done</button>
      </div>
    );
  }

  return (
    <div className="grid grid-2">
      <div className="card" style={{ padding: 'clamp(22px,3vw,36px)' }}>
        <div className="xsmall faint">Due now</div>
        <div className="display" style={{ fontSize: 'clamp(3rem,8vw,4.6rem)' }}>{due.length}</div>
        <p className="muted small" style={{ marginTop: 4 }}>{deck.length} cards in your deck in total.</p>
        <div className="row" style={{ marginTop: 18 }}>
          <button type="button" className="btn btn-primary" disabled={!due.length} onClick={() => begin(due)}>Review due cards</button>
          <button type="button" className="btn btn-ghost" disabled={!deck.length} onClick={() => begin(deck.map(([k]) => k).sort(() => Math.random() - 0.5))}>Practice anyway</button>
        </div>
        {!deck.length && <p className="small muted" style={{ marginTop: 16 }}>Your deck is empty. Every mastery check you take adds its questions here.</p>}
      </div>
      <div className="card">
        <div className="xsmall faint" style={{ marginBottom: 10 }}>Coming up</div>
        {upcoming.length ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {upcoming.slice(0, 8).map(([k, c]) => (
              <li key={k} className="row small" style={{ justifyContent: 'space-between' }}>
                <span className="muted">{titles[k.split('/')[0]] ?? k}</span>
                <span className="mono xsmall">{new Date(c.due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </li>
            ))}
          </ul>
        ) : <div className="small muted">Nothing scheduled yet.</div>}
      </div>
    </div>
  );
}
