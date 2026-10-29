import { useEffect, useRef, useState } from 'react';
import { goalPlan, goalTypes, localDate, MAX_GOALS } from '@/lib/goals.mjs';
import { removeGoal, saveGoal, type LearningGoal } from '@/lib/progress';
import { useHydrated, useProgress } from '@/lib/useProgress';
import '@/styles/goals.css';

interface Module { id: string; title: string; minutes: number }
const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

export default function GoalPlanner({ modules, base }: { modules: Module[]; base: string }) {
  const progress = useProgress();
  const hydrated = useHydrated();
  const [editing, setEditing] = useState<LearningGoal | 'new' | null>(null);
  const [message, setMessage] = useState('');
  const [today, setToday] = useState(localDate);
  const addButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(localDate()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const goals = progress.goals ?? [];

  function closeEditor() { setEditing(null); requestAnimationFrame(() => addButton.current?.focus()); }

  return <section id="goals" className="card goal-planner" aria-labelledby="goals-title">
    <div className="goal-heading">
      <div>
        <div className="widget-kicker">A destination for your learning</div>
        <h2 id="goals-title" className="h3">Your goals</h2>
        <p className="muted small">Choose what you want to be able to do, and when.</p>
      </div>
      {hydrated && <button ref={addButton} className="btn btn-primary btn-sm" type="button" disabled={editing !== null || goals.length >= MAX_GOALS} onClick={() => { setMessage(''); setEditing('new'); }}>Add a goal</button>}
    </div>
    <p role="status" className="small goal-notice">{message}</p>
    {!hydrated ? <p className="muted small">Loading your goals…</p> : <>
      {!goals.length && !editing && <div className="goal-empty card-soft">
        <p className="h4">“I want to be conversational by…”</p>
        <p className="muted small">Turn that intention into a plan. Set a date to see the lessons to work through and a weekly study estimate.</p>
      </div>}
      {editing && <GoalForm key={editing === 'new' ? 'new' : editing.id} goal={editing === 'new' ? undefined : editing} today={today} modules={modules} progress={progress.modules} onCancel={closeEditor} onSave={(kind, targetDate) => {
        saveGoal(kind, targetDate, editing === 'new' ? undefined : editing.id);
        setMessage(editing === 'new' ? 'Goal saved.' : 'Goal updated.');
        closeEditor();
      }} />}
      <div className="goal-list">
        {goals.map((goal) => {
          const plan = goalPlan(goal, modules, progress.modules, today);
          return <article className="goal-card" key={goal.id} aria-labelledby={`goal-${goal.id}`}>
            <div className="goal-heading">
              <div>
                <h3 className="h4" id={`goal-${goal.id}`}>{plan.type.title}</h3>
                <p className="small muted">Target: <time dateTime={goal.targetDate}>{dateLabel(goal.targetDate)}</time></p>
              </div>
              <span className={`pill ${plan.achieved ? 'pill-good' : ''}`}>{plan.achieved ? 'Goal met' : plan.daysLeft < 0 ? 'Target date passed' : plan.daysLeft === 0 ? 'Due today' : `${plan.daysLeft} days left`}</span>
            </div>
            <p className="small muted">{plan.type.description}</p>
            <div className="goal-progress-label small"><span>{plan.done} of {plan.required.length} lessons verified</span><strong>{Math.round(plan.done / plan.required.length * 100)}%</strong></div>
            <progress className="goal-progress" value={plan.done} max={plan.required.length} aria-label={`${plan.type.title} progress`} />
            {plan.achieved ? <p className="small">You’ve met this goal’s learning checks. Keep the ideas fresh with <a className="text-link" href={`${base}/review/`}>spaced review</a>.</p>
              : plan.daysLeft < 0 ? <p className="small">Your progress still counts. Choose a new date to rebuild your weekly plan.</p>
              : <p className="small"><strong>About {plan.weeklyMinutes} min {plan.daysLeft < 7 ? (plan.daysLeft === 0 ? 'today' : 'before your target date') : 'per week'}</strong><br /><span className="muted">Based on remaining lesson reading times. Allow extra time for practice, checks, and review.</span></p>}
            <div className="row goal-actions">
              {plan.next && <a className="btn btn-primary btn-sm btn-wrap" href={`${base}/learn/${plan.next.id}/${['completed', 'placed'].includes(progress.modules[plan.next.id]?.status) ? '#mastery' : ''}`}>Next: {plan.next.title}</a>}
              <button className="btn btn-secondary btn-sm" type="button" disabled={editing !== null} aria-label={`Edit ${plan.type.title} goal`} onClick={() => { setMessage(''); setEditing(goal); }}>Edit</button>
              <button className="btn btn-ghost btn-sm" type="button" disabled={editing !== null} aria-label={`Remove ${plan.type.title} goal`} onClick={() => {
                if (confirm(`Remove “${plan.type.title}”? Your lesson progress will be kept.`)) { removeGoal(goal.id); setMessage('Goal removed. Your lesson progress is unchanged.'); addButton.current?.focus(); }
              }}>Remove</button>
            </div>
            <details className="goal-details">
              <summary className="small">What counts toward this goal?</summary>
              <p className="small muted">{plan.type.evidence} These checks are learning milestones, not a certification of real-world expertise.</p>
              <ol className="small">{plan.required.map((m) => <li key={m.id}><a className="text-link" href={`${base}/learn/${m.id}/`}>{m.title}</a><span className="muted"> · {plan.remaining.some((r) => r.id === m.id) ? 'To verify' : 'Verified'}</span></li>)}</ol>
            </details>
          </article>;
        })}
      </div>
      <p className="xsmall muted goal-footnote">Goals are saved with your progress on this device and included in exports and cloud saves from Your account.</p>
    </>}
  </section>;
}

function GoalForm({ goal, today, modules, progress, onCancel, onSave }: {
  goal?: LearningGoal; today: string; modules: Module[]; progress: Record<string, { status: string }>;
  onCancel: () => void; onSave: (kind: LearningGoal['kind'], date: string) => void;
}) {
  const [kind, setKind] = useState<LearningGoal['kind']>(goal?.kind ?? 'conversational');
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '');
  const [error, setError] = useState('');
  const select = useRef<HTMLSelectElement>(null);
  useEffect(() => { select.current?.focus(); }, []);
  const type = goalTypes.find((t) => t.id === kind)!;
  const plan = goalPlan({ kind, targetDate: today }, modules, progress, today);
  return <form className="goal-form card-soft" onSubmit={(event) => {
    event.preventDefault();
    try { onSave(kind, targetDate); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save your goal.'); }
  }}>
    <div className="goal-fields">
      <label>I want to…<select ref={select} value={kind} onChange={(event) => setKind(event.target.value as LearningGoal['kind'])}>{goalTypes.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
      <label>Target date<input type="date" required min={goal?.targetDate && goal.targetDate < today ? goal.targetDate : today} max="9999-12-31" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></label>
    </div>
    <p className="small muted">{type.description}</p>
    <p className="small">{type.evidence} {plan.remaining.length} of {plan.required.length} lessons still to verify.</p>
    <div role="alert" className="small goal-error">{error}</div>
    <div className="row goal-actions"><button className="btn btn-primary btn-sm" type="submit">{goal ? 'Save changes' : 'Save goal'}</button><button className="btn btn-ghost btn-sm" type="button" onClick={onCancel}>Cancel</button></div>
  </form>;
}
