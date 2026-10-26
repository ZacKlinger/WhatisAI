import { useMemo, useState } from 'react';
import type { Item } from '@/lib/items';
import { brier, recordCalibration, savePlacement, type CalibrationPoint, type ModuleStatus } from '@/lib/progress';
import ItemView, { type ItemResult } from '@/components/quiz/ItemView';
import Constellation, { type CMod, type CTrack } from '@/components/interactive/Constellation';
import CalibrationChart from '@/components/interactive/CalibrationChart';

interface PTrack extends CTrack { aura: string; tagline: string }
interface PMod extends CMod { minutes: number }

interface Props {
  tracks: PTrack[];
  modules: PMod[];
  bank: Record<string, Item[]>;
  base: string;
}

type Rating = 0 | 1 | 2;
interface Search { trackId: string; lo: number; hi: number; mid: number; attempt: number; first: boolean }
interface LogEntry { module: string; correct: boolean; confidence: number | null; track: string }

const RATING_LABEL = ['New to me', 'Some familiarity', 'Comfortable'];

export default function Placement({ tracks, modules, bank, base }: Props) {
  const probeable = tracks.filter((t) => t.id !== 't9' && modules.some((m) => m.track === t.id));
  const byTrack = useMemo(() => Object.fromEntries(tracks.map((t) => [t.id, modules.filter((m) => m.track === t.id).sort((a, b) => a.order - b.order)])), [tracks, modules]);

  const [phase, setPhase] = useState<'intro' | 'assess' | 'run' | 'between' | 'results'>('intro');
  const [ratings, setRatings] = useState<Record<string, Rating>>(() => Object.fromEntries(probeable.map((t) => [t.id, 1 as Rating])));
  const [queue, setQueue] = useState<string[]>([]);
  const [search, setSearch] = useState<Search | null>(null);
  const [frontier, setFrontier] = useState<Record<string, number>>({});
  const [log, setLog] = useState<LogEntry[]>([]);
  const [points, setPoints] = useState<CalibrationPoint[]>([]);
  const [answered, setAnswered] = useState<ItemResult | null>(null);
  const [lastTrack, setLastTrack] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [probeN, setProbeN] = useState(0);

  const trackById = Object.fromEntries(tracks.map((t) => [t.id, t]));

  function initSearch(trackId: string): Search {
    const n = byTrack[trackId].length;
    const r = ratings[trackId] ?? 1;
    const mid = Math.min(n - 1, Math.max(0, Math.floor((n - 1) * (r === 2 ? 0.67 : r === 1 ? 0.34 : 0))));
    return { trackId, lo: 0, hi: n, mid, attempt: 0, first: true };
  }

  function start() {
    const q = probeable.filter((t) => ratings[t.id] > 0).map((t) => t.id);
    const skipped = Object.fromEntries(probeable.filter((t) => ratings[t.id] === 0).map((t) => [t.id, 0]));
    setFrontier(skipped);
    if (!q.length) { finish(skipped, []); return; }
    setQueue(q.slice(1));
    setSearch(initSearch(q[0]));
    setPhase('run');
  }

  const currentItem: Item | null = useMemo(() => {
    if (!search) return null;
    const mod = byTrack[search.trackId][search.mid];
    const items = bank[mod.id] ?? [];
    if (!items.length) return null;
    const preferred = items.filter((i) => i.placement);
    const ordered = [...preferred, ...items.filter((i) => !i.placement)];
    return ordered[search.attempt % ordered.length];
  }, [search, bank, byTrack]);

  function advance(s: Search, outcome: 'pass' | 'fail' | 'retry') {
    setProbeN((n) => n + 1);
    let next: Search = { ...s, first: false, attempt: 0 };
    if (outcome === 'retry') next = { ...s, attempt: s.attempt + 1, first: false };
    else if (outcome === 'pass') next.lo = s.mid + 1;
    else next.hi = s.mid;

    if (outcome !== 'retry') {
      if (next.lo >= next.hi) {
        const f = { ...frontier, [s.trackId]: next.lo };
        setFrontier(f);
        setLastTrack(s.trackId);
        if (queue.length) {
          setPhase('between');
          setSearch(null);
        } else {
          finish(f, log);
        }
        return;
      }
      next.mid = Math.floor((next.lo + next.hi - 1) / 2);
    }
    setSearch(next);
  }

  function onResult(r: ItemResult) {
    setAnswered(r);
    if (!search) return;
    const mod = byTrack[search.trackId][search.mid];
    const entry = { module: mod.id, correct: r.correct, confidence: r.confidence ?? null, track: search.trackId };
    setLog((l) => [...l, entry]);
    if (r.confidence !== undefined) {
      recordCalibration(r.confidence, r.correct, 'placement');
      setPoints((p) => [...p, { c: r.confidence!, ok: r.correct, t: Date.now(), src: 'placement' }]);
    }
  }

  function onNext() {
    if (!search || !answered) return;
    const r = answered;
    setAnswered(null);
    const hasBackup = (bank[byTrack[search.trackId][search.mid].id] ?? []).length > 1;
    if (r.correct && (r.confidence ?? 1) >= 0.7) return advance(search, 'pass');
    if (r.correct && search.attempt === 0 && hasBackup) return advance(search, 'retry');
    if (r.correct && search.attempt > 0) return advance(search, 'pass');
    return advance(search, 'fail');
  }

  function dontKnow() {
    if (!search) return;
    const mod = byTrack[search.trackId][search.mid];
    setLog((l) => [...l, { module: mod.id, correct: false, confidence: null, track: search.trackId }]);
    advance(search, 'fail');
  }

  function nextTrack() {
    const [t, ...rest] = queue;
    setQueue(rest);
    setSearch(initSearch(t));
    setPhase('run');
  }

  function finish(f: Record<string, number>, l: LogEntry[]) {
    const placed = Object.entries(f).flatMap(([tid, n]) => byTrack[tid].slice(0, n).map((m) => m.id));
    const misconceptions = [...new Set(l.filter((e) => !e.correct && (e.confidence ?? 0) >= 0.9).map((e) => e.module))];
    savePlacement({ takenAt: Date.now(), placed, probed: [...new Set(l.map((e) => e.module))], misconceptions, brier: brier(points) });
    setPhase('results');
  }

  /* ---------- views ---------- */

  if (phase === 'intro') {
    return (
      <div className="pl-intro aura aura-hero">
        <div className="pl-intro-inner">
          <div className="eyebrow" style={{ color: 'var(--fg)' }}>Placement exam · optional · about 10 to 15 minutes</div>
          <h1 className="display" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.4rem)', marginTop: 14 }}>Find the edge of what you know.</h1>
          <p className="lead" style={{ color: 'var(--fg)', opacity: 0.8, maxWidth: '54ch', marginTop: 18 }}>
            The exam searches each track for the boundary between what you have mastered and what you have not, usually in three questions or fewer per track.
            Modules behind your boundary are marked as placed, and your path begins where your knowledge ends.
          </p>
          <div className="grid grid-3" style={{ marginTop: 32, gap: 12 }}>
            {[
              ['Adaptive', 'Each answer halves the search. Get one right and the next question jumps ahead; miss one and it steps back.'],
              ['Wagered', 'Before each answer is revealed, bet your confidence. A confident miss is flagged as a likely misconception.'],
              ['Varied', 'Match concepts, order processes, estimate on log scales, click the right part of a figure, and choose.'],
            ].map(([t, d]) => (
              <div key={t} className="card" style={{ background: 'color-mix(in srgb, var(--bg) 62%, transparent)', backdropFilter: 'blur(14px)', borderColor: 'transparent' }}>
                <div className="h4">{t}</div>
                <div className="small muted" style={{ marginTop: 6 }}>{d}</div>
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 32 }}>
            <button type="button" className="btn btn-primary btn-lg" onClick={() => setPhase('assess')}>Begin</button>
            <a className="btn btn-lg" href={`${base}/path/`} style={{ background: 'color-mix(in srgb, var(--bg) 60%, transparent)' }}>Skip, start from the beginning</a>
          </div>
          <p className="small" style={{ marginTop: 18, opacity: 0.75, maxWidth: '60ch' }}>
            Honesty beats luck here. Every question offers "I don't know," which costs nothing. Guessing right with low confidence triggers a second question rather than a pass.
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'assess') {
    const probing = probeable.filter((t) => ratings[t.id] > 0).length;
    return (
      <div className="pl-wrap">
        <div className="eyebrow">Step 1 of 2</div>
        <h2 style={{ marginTop: 8 }}>How familiar is each track?</h2>
        <p className="muted" style={{ maxWidth: '60ch', marginTop: 10 }}>
          This only decides where to start searching. Tracks marked "New to me" are skipped entirely. You will still be tested on everything else, so a generous rating cannot place you past anything you do not know.
        </p>
        <div className="stack" style={{ ['--stack' as string]: '10px', marginTop: 24 }}>
          {probeable.map((t) => (
            <div key={t.id} className="card pl-rate">
              <div className={`pl-rate-swatch aura ${t.aura}`}><span>{t.numeral}</span></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{t.title}</div>
                <div className="small muted">{t.tagline} · {byTrack[t.id].length} modules</div>
              </div>
              <div className="chip-row pl-rate-opts" role="radiogroup" aria-label={`Familiarity with ${t.title}`}>
                {RATING_LABEL.map((l, i) => (
                  <button key={l} type="button" role="radio" aria-checked={ratings[t.id] === i} aria-pressed={ratings[t.id] === i} className="chip" onClick={() => setRatings((r) => ({ ...r, [t.id]: i as Rating }))}>{l}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 24, justifyContent: 'space-between' }}>
          <div className="small muted">Probing {probing} track{probing === 1 ? '' : 's'} · about {Math.max(1, Math.round(probing * 1.4))} minutes</div>
          <div className="row">
            <button type="button" className="btn btn-ghost" onClick={() => setRatings(Object.fromEntries(probeable.map((t) => [t.id, 1 as Rating])))}>Probe everything</button>
            <button type="button" className="btn btn-primary" onClick={start}>Start the exam</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'between' && lastTrack) {
    const t = trackById[lastTrack];
    const n = frontier[lastTrack] ?? 0;
    const total = byTrack[lastTrack].length;
    const nextT = trackById[queue[0]];
    return (
      <div className="pl-wrap" style={{ textAlign: 'center' }}>
        <div className={`pl-between aura ${t.aura}`}>
          <div className="eyebrow" style={{ color: 'var(--fg)' }}>Track {t.numeral} · {t.title}</div>
          <div className="display" style={{ fontSize: 'clamp(3rem, 9vw, 5.4rem)', margin: '10px 0' }}>{n} <span style={{ opacity: 0.45 }}>/ {total}</span></div>
          <div style={{ fontSize: '1.1rem' }}>{n === total ? 'You place past the entire track.' : n === 0 ? 'This track starts at the beginning for you.' : `You place past ${n} module${n > 1 ? 's' : ''}.`}</div>
          <TrackStrip mods={byTrack[lastTrack]} lo={n} hi={n} mid={-1} />
        </div>
        <button type="button" className="btn btn-primary btn-lg" style={{ marginTop: 28 }} onClick={nextTrack} autoFocus>
          Next: Track {nextT.numeral} · {nextT.title}
        </button>
      </div>
    );
  }

  if (phase === 'run' && search) {
    const t = trackById[search.trackId];
    const mods = byTrack[search.trackId];
    const tracksDone = probeable.filter((x) => ratings[x.id] > 0).findIndex((x) => x.id === search.trackId);
    const totalProbe = probeable.filter((x) => ratings[x.id] > 0).length;
    return (
      <div className="pl-wrap">
        <div className="pl-head">
          <div>
            <div className="eyebrow">Track {t.numeral} of the path · {tracksDone + 1} of {totalProbe} being probed</div>
            <div className="h3" style={{ marginTop: 4 }}>{t.title}</div>
          </div>
          <div className="small muted tabular" style={{ textAlign: 'right' }}>
            {log.length} answered{points.length >= 3 ? ` · calibration ${brier(points).toFixed(2)}` : ''}
          </div>
        </div>
        <TrackStrip mods={mods} lo={search.lo} hi={search.hi} mid={search.mid} />
        <div className="card" style={{ marginTop: 18, padding: 'clamp(18px, 3vw, 32px)' }}>
          <div className="xsmall faint" style={{ marginBottom: 10 }}>
            Probing: <strong style={{ color: 'var(--fg)' }}>{mods[search.mid].title}</strong>{search.attempt > 0 ? ' · a second question, since the first was a guess' : ''}
          </div>
          {currentItem ? (
            <ItemView key={`probe-${probeN}`} item={currentItem} wager onResult={onResult} onNext={onNext} nextLabel="Continue" />
          ) : (
            <div className="empty">No placement question exists for this module yet. <button className="link" type="button" onClick={dontKnow}>Skip it</button></div>
          )}
          {!answered && currentItem && (
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={dontKnow}>I don't know this yet</button>
          )}
        </div>
      </div>
    );
  }

  // results
  const placedIds = Object.entries(frontier).flatMap(([tid, n]) => byTrack[tid].slice(0, n).map((m) => m.id));
  const saved = modules.filter((m) => placedIds.includes(m.id)).reduce((s, m) => s + m.minutes, 0);
  const misconceptions = [...new Set(log.filter((e) => !e.correct && (e.confidence ?? 0) >= 0.9).map((e) => e.module))];
  const firstOpen = modules.find((m) => !placedIds.includes(m.id));
  const override: Record<string, ModuleStatus> = Object.fromEntries(placedIds.map((id) => [id, 'placed' as ModuleStatus]));
  const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
  const acc = log.length ? log.filter((e) => e.correct).length / log.length : 0;

  return (
    <div className="pl-wrap pl-results">
      <div className="eyebrow">Your placement</div>
      <h1 style={{ marginTop: 8 }}>{placedIds.length ? `You place past ${placedIds.length} module${placedIds.length > 1 ? 's' : ''}.` : 'Your path begins at the beginning.'}</h1>
      <p className="lead" style={{ marginTop: 12, maxWidth: '58ch' }}>
        {placedIds.length ? `That is about ${Math.round(saved / 60 * 10) / 10} hours of material you can skip. ` : ''}
        Placed modules glow on the map below. You can still open any of them, and their mastery checks will confirm or correct the placement.
      </p>
      <div className="card" style={{ marginTop: 28, padding: 'clamp(10px, 2vw, 22px)' }}>
        <Constellation modules={modules} tracks={tracks} base={base} statusOverride={override} highlight={placedIds} />
      </div>
      <div className="grid grid-3" style={{ marginTop: 18, alignItems: 'start' }}>
        <div className="card">
          <div className="xsmall faint">Questions answered</div>
          <div className="display" style={{ fontSize: '2.6rem' }}>{log.length}</div>
          <div className="small muted">{Math.round(acc * 100)}% correct, in about {minutes} minute{minutes > 1 ? 's' : ''}</div>
        </div>
        <div className="card">
          <div className="xsmall faint">Your calibration</div>
          <CalibrationChart points={points} size={260} />
        </div>
        <div className="card">
          <div className="xsmall faint">Confident misses</div>
          {misconceptions.length ? (
            <ul style={{ margin: '8px 0 0', paddingLeft: '1.1em' }} className="small">
              {misconceptions.map((id) => {
                const m = modules.find((x) => x.id === id)!;
                return <li key={id} style={{ marginBottom: 6 }}><a className="link" href={`${base}/learn/${id}/`}>{m.title}</a></li>;
              })}
            </ul>
          ) : <div className="small muted" style={{ marginTop: 8 }}>None. When you were sure, you were right, or you said so when you were not.</div>}
          {misconceptions.length > 0 && <div className="xsmall muted" style={{ marginTop: 8 }}>You were 90%+ sure and wrong here. These are worth reading first: a confident wrong belief blocks learning more than ignorance does.</div>}
        </div>
      </div>
      <div className="row" style={{ marginTop: 28 }}>
        {firstOpen && <a className="btn btn-primary btn-lg" href={`${base}/learn/${firstOpen.id}/`}>Start with {firstOpen.title}</a>}
        <a className="btn btn-ghost btn-lg" href={`${base}/path/`}>See my path</a>
        <button type="button" className="btn btn-ghost btn-lg" onClick={() => window.location.reload()}>Retake</button>
      </div>
    </div>
  );
}

function TrackStrip({ mods, lo, hi, mid }: { mods: PMod[]; lo: number; hi: number; mid: number }) {
  return (
    <div className="pl-strip" role="img" aria-label={`Search progress: ${lo} modules placed so far`}>
      {mods.map((m, i) => {
        const state = i < lo ? 'placed' : i >= hi ? 'learn' : i === mid ? 'probe' : 'unknown';
        return (
          <div key={m.id} className={`pl-node ${state}`} title={m.title}>
            <span className="pl-dot" />
            <span className="pl-label">{m.title}</span>
          </div>
        );
      })}
    </div>
  );
}
