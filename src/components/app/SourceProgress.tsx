import { setSourceStudied } from '@/lib/progress';
import { useHydrated, useProgress } from '@/lib/useProgress';

export function SourceCheck({ moduleId, resource, title }: { moduleId: string; resource: string; title: string }) {
  const progress = useProgress();
  const hydrated = useHydrated();
  if (!hydrated) return null;
  const studied = !!progress.studiedSources?.[`${moduleId}/${resource}`];
  return <button type="button" className="btn btn-secondary btn-sm" aria-pressed={studied}
    aria-label={`Mark as studied · ${title}`}
    onClick={() => setSourceStudied(moduleId, resource, !studied)}>{studied ? '✓ Studied · Undo' : 'Mark as studied'}</button>;
}

export function LessonBookmark({ moduleId, resources }: { moduleId: string; resources: string[] }) {
  const progress = useProgress();
  const hydrated = useHydrated();
  if (!hydrated) return null;
  const remaining = resources.filter(id => !progress.studiedSources?.[`${moduleId}/${id}`]);
  const done = resources.length - remaining.length;
  return <div className="lesson-bookmark">
    <span aria-live="polite">{done} of {resources.length} sources studied</span>
    <progress aria-label="Sources studied" value={done} max={resources.length} />
    {done > 0 && <a className="link" href={remaining.length ? `#source-${remaining[0]}` : '#visual-practice'}>
      {remaining.length ? 'Resume at next source' : 'Continue to practice'}</a>}
  </div>;
}
