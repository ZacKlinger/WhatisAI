import { brier, dueReviews, isDone, streakDays } from '@/lib/progress';
import { useHydrated, useProgress } from '@/lib/useProgress';

interface M { id: string; title: string; track: string; minutes: number }

export default function ContinuePanel({ modules, base }: { modules: M[]; base: string }) {
  const p = useProgress();
  const hydrated = useHydrated();
  if (!hydrated) return <div style={{ minHeight: 180 }} />;

  const done = modules.filter((m) => isDone(p.modules[m.id]?.status));
  const mastered = modules.filter((m) => p.modules[m.id]?.status === 'mastered');
  const next = (p.lastModule && !isDone(p.modules[p.lastModule]?.status) ? modules.find((m) => m.id === p.lastModule) : undefined) ?? modules.find((m) => !isDone(p.modules[m.id]?.status));
  const due = dueReviews().length;
  const streak = streakDays(p.activity);
  const pct = Math.round((done.length / modules.length) * 100);
  const fresh = Object.keys(p.modules).length === 0;
  const b = brier(p.calibration);

  if (fresh) {
    return (
      <div className="grid grid-3">
        {[
          ['01', 'Find your starting point', 'An optional, adaptive placement exam probes each track and skips you past what you already know. About fifteen minutes.', `${base}/placement/`, 'Take the placement'],
          ['02', 'Walk the path', `${modules.length} modules, from what a function is to how frontier labs evaluate dangerous capabilities. Every module ends in a mastery check.`, `${base}/path/`, 'See the path'],
          ['03', 'Stay at the frontier', 'A watcher reads the field every morning and publishes only what matters, linked to the modules that explain it.', `${base}/signals/`, 'Read the signals'],
        ].map(([n, t, d, href, cta]) => (
          <a key={n} href={href} className="card hoverable" style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 220 }}>
            <span className="mono xsmall faint">{n}</span>
            <span className="h3">{t}</span>
            <span className="muted small" style={{ flex: 1 }}>{d}</span>
            <span className="arrow-link small">{cta}</span>
          </a>
        ))}
      </div>
    );
  }

  return (
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
        <div className="small muted">{Number.isFinite(b) ? `Calibration (Brier) ${b.toFixed(3)}` : 'Builds as you answer'}</div>
      </a>
    </div>
  );
}
