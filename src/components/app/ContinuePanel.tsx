import { brier, dueReviews, isDone, streakDays } from '@/lib/progress';
import { useHydrated, useProgress } from '@/lib/useProgress';
import { goalPlan } from '@/lib/goals.mjs';

interface M { id: string; title: string; track: string; minutes: number }

export default function ContinuePanel({ modules, base, returningOnly = false }: { modules: M[]; base: string; returningOnly?: boolean }) {
  const p = useProgress();
  const hydrated = useHydrated();
  if (!hydrated) return returningOnly ? null : <div style={{ minHeight: 180 }} />;

  const done = modules.filter((m) => isDone(p.modules[m.id]?.status));
  const mastered = modules.filter((m) => p.modules[m.id]?.status === 'mastered');
  const next = (p.lastModule && !isDone(p.modules[p.lastModule]?.status) ? modules.find((m) => m.id === p.lastModule) : undefined) ?? modules.find((m) => !isDone(p.modules[m.id]?.status));
  const due = dueReviews().length;
  const streak = streakDays(p.activity);
  const pct = Math.round((done.length / modules.length) * 100);
  const fresh = Object.keys(p.modules).length === 0;
  const b = brier(p.calibration);
  const plans = [...(p.goals ?? [])].sort((a, b) => a.targetDate.localeCompare(b.targetDate)).map((g) => ({ goal: g, plan: goalPlan(g, modules, p.modules) }));
  const currentGoal = plans.find(({ plan }) => !plan.achieved) ?? plans[0];
  const goalSummary = currentGoal ? <a className="card card-soft hoverable" style={{ display: 'block', marginBottom: 20 }} href={`${base}/progress/#goals`}>
    <div className="xsmall faint">Your learning goal · {currentGoal.plan.achieved ? 'Goal met' : currentGoal.plan.daysLeft < 0 ? 'Choose a new target date' : currentGoal.plan.daysLeft === 0 ? 'Due today' : `${currentGoal.plan.daysLeft} days left`}</div>
    <div style={{ fontWeight: 550 }}>{currentGoal.plan.type.title}</div>
    <div className="small muted">{currentGoal.plan.done} of {currentGoal.plan.required.length} lessons verified · View your plan →</div>
  </a> : <a className="arrow-link small" style={{ display: 'inline-block', marginBottom: 20 }} href={`${base}/progress/#goals`}>Set a learning goal</a>;

  if (fresh) {
    if (returningOnly) return currentGoal ? goalSummary : null;
    return (
      <>{goalSummary}
      <div className="grid grid-3">
        {[
          ['01', 'Place out', 'Skip what you already know. About 15 minutes.', `${base}/placement/`, 'Placement exam'],
          ['02', 'Learn', `${modules.length} modules, each ending in a mastery check.`, `${base}/path/`, 'See the path'],
          ['03', 'Stay current', 'Major developments, linked to the modules that explain them.', `${base}/signals/`, 'Signals'],
        ].map(([n, t, d, href, cta]) => (
          <a key={n} href={href} className="card hoverable" style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 180 }}>
            <span className="mono xsmall faint">{n}</span>
            <span className="h3">{t}</span>
            <span className="muted small" style={{ flex: 1 }}>{d}</span>
            <span className="arrow-link small">{cta}</span>
          </a>
        ))}
      </div>
      </>
    );
  }

  return (
    <>{goalSummary}
    <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 24, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
          <circle cx="42" cy="42" r="36" style={{ fill: 'none', stroke: 'var(--bg-muted)', strokeWidth: 8 }} />
          <circle cx="42" cy="42" r="36" transform="rotate(-90 42 42)" style={{ fill: 'none', stroke: 'var(--fg)', strokeWidth: 8, strokeLinecap: 'round', strokeDasharray: `${(pct / 100) * 226} 226`, transition: 'stroke-dasharray .8s var(--ease)' }} />
          <text x="42" y="47" textAnchor="middle" style={{ fontSize: 17, fontWeight: 600, fill: 'var(--fg)' }}>{pct}%</text>
        </svg>
        <div>
          <div className="xsmall faint">Your path</div>
          <div style={{ fontWeight: 550 }}>{done.length} of {modules.length} modules</div>
          <div className="small muted">{mastered.length} mastered{streak > 1 ? ` · ${streak}-day streak` : ''}</div>
        </div>
      </div>
      {next && (
        <a href={`${base}/learn/${next.id}/`} className="card card-soft hoverable" style={{ padding: 16 }}>
          <div className="xsmall faint">Continue</div>
          <div style={{ fontWeight: 550 }}>{next.title}</div>
          <div className="small muted">{next.minutes} min</div>
        </a>
      )}
      <a href={`${base}/review/`} className="card card-soft hoverable" style={{ padding: 16 }}>
        <div className="xsmall faint">Spaced review</div>
        <div style={{ fontWeight: 550 }}>{due ? `${due} card${due > 1 ? 's' : ''} due` : 'Nothing due'}</div>
        {Number.isFinite(b) && <div className="small muted">Calibration (Brier) {b.toFixed(3)}</div>}
      </a>
    </div>
    </>
  );
}
