import { useEffect } from 'react';
import { isDone, markStarted, setModuleStatus } from '@/lib/progress';
import { useHydrated, useProgress } from '@/lib/useProgress';

const LABEL = { started: 'In progress', completed: 'Completed', mastered: 'Mastered', placed: 'Placed out' } as const;

export default function ModuleStatus({ id, prerequisites, titles, base }: { id: string; prerequisites: string[]; titles: Record<string, string>; base: string }) {
  const progress = useProgress();
  const hydrated = useHydrated();
  useEffect(() => { markStarted(id); }, [id]);
  if (!hydrated) return <div style={{ height: 34 }} />;
  const s = progress.modules[id]?.status;
  const missing = prerequisites.filter((p) => !isDone(progress.modules[p]?.status));
  return (
    <div className="stack" style={{ ['--stack' as string]: '12px' }}>
      <div className="row">
        {s && <span className={`pill ${s === 'mastered' ? 'pill-good' : s === 'placed' ? '' : 'pill-info'}`} style={s === 'placed' ? { color: 'var(--c4)' } : undefined}>{LABEL[s]}</span>}
        {!isDone(s) && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModuleStatus(id, 'completed')}>Mark as read</button>}
        <a className="btn btn-ghost btn-sm" href="#mastery">Mastery check ↓</a>
      </div>
      {missing.length > 0 && (
        <div className="small muted">
          Builds on: {missing.map((p, i) => (
            <span key={p}><a className="link" href={`${base}/learn/${p}/`}>{titles[p] ?? p}</a>{i < missing.length - 1 ? ', ' : ''}</span>
          ))}. You can read on regardless; the path is a guide, not a gate.
        </div>
      )}
    </div>
  );
}
