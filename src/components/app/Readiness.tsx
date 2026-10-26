import { isDone } from '@/lib/progress';
import { useHydrated, useProgress } from '@/lib/useProgress';

/** Shows whether the learner has covered the modules a document depends on. */
export default function Readiness({ requires, titles, base, compact }: { requires: string[]; titles: Record<string, string>; base: string; compact?: boolean }) {
  const p = useProgress();
  const hydrated = useHydrated();
  if (!requires.length) return null;
  if (!hydrated) return <span className="pill">{requires.length} module{requires.length > 1 ? 's' : ''} behind this</span>;
  const missing = requires.filter((id) => !isDone(p.modules[id]?.status));
  const ready = missing.length === 0;
  if (compact) {
    return ready
      ? <span className="pill pill-good">Ready to read</span>
      : <span className="pill">{requires.length - missing.length}/{requires.length} prerequisites</span>;
  }
  return (
    <div className={`feedback ${ready ? 'good' : ''}`} style={{ background: ready ? undefined : 'var(--bg-soft)' }}>
      <strong>{ready ? 'You are ready to read the source.' : `You have covered ${requires.length - missing.length} of ${requires.length} modules behind this.`}</strong>
      {!ready && (
        <span className="small">Read first: {missing.map((id, i) => (
          <span key={id}><a className="link" href={`${base}/learn/${id}/`}>{titles[id] ?? id}</a>{i < missing.length - 1 ? ', ' : ''}</span>
        ))}</span>
      )}
    </div>
  );
}
