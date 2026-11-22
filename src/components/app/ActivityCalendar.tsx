import { useState } from 'react';
import { useHydrated, useProgress } from '@/lib/useProgress';
import { addDays } from '@/lib/goals.mjs';
import './activity.css';

type SourceNames = Record<string, { title: string; lesson: string }>;
const dayLabel = (date: string, weekday = false) => new Date(date + 'T12:00:00Z').toLocaleDateString(undefined,
  weekday ? { weekday: 'short', timeZone: 'UTC' } : { month: 'short', day: 'numeric', timeZone: 'UTC' });

export default function ActivityCalendar({ base, sources }: { base: string; sources?: SourceNames }) {
  const progress = useProgress();
  const hydrated = useHydrated();
  const [selected, select] = useState('');
  if (!hydrated) return null;
  const today = new Date().toISOString().slice(0, 10);
  const count = sources ? 84 : 7;
  const days: string[] = Array.from({ length: count }, (_, i) => addDays(today, i - count + 1));
  const active = days.filter(d => progress.activity[d] > 0);
  const lastWeek = days.slice(-7);
  const weekCount = lastWeek.filter(d => progress.activity[d] > 0).length;
  const summary = `${weekCount} of the last 7 days active`;
  const day = days.includes(selected) ? selected : active[active.length - 1] ?? today;
  const sourceKeys = Object.entries(progress.studiedSources ?? {}).filter(([, date]) => date === day).map(([key]) => key);

  if (!sources) return <a className="activity-strip" href={`${base}/progress/#activity`}>
    <span><strong>Your activity</strong><span className="small muted">{summary}</span></span>
    <span className="week-cells" aria-hidden="true">{lastWeek.map(d =>
      <span key={d} title={dayLabel(d)}><i data-level={progress.activity[d] ? 'active' : 'empty'} />{dayLabel(d, true)}</span>)}</span>
  </a>;
  return <div className="card activity-calendar">
    <h2 className="h4">Activity, last 12 weeks</h2>
    <p className="small muted">{summary} · Days shown in UTC</p>
    <div className="activity-grid" role="img" aria-label={`${active.length} active days in the last 12 weeks`}>
      {days.map(d => {
        const n = progress.activity[d] ?? 0;
        return <i key={d} title={`${dayLabel(d)} · ${n} activities`} data-level={n >= 5 ? 'busy' : n ? 'active' : 'empty'} />;
      })}
    </div>
    <label className="activity-date">Activity on
      <select value={day} onChange={e => select(e.target.value)}>{days.slice().reverse().map(d =>
        <option key={d} value={d}>{dayLabel(d)} · {progress.activity[d] ?? 0} activities</option>)}</select>
    </label>
    {sourceKeys.length > 0 ? <ul className="activity-sources">{sourceKeys.map(key => {
      const [lesson, resource] = key.split('/');
      const source = sources[key];
      return <li key={key}>{source ? <a className="link" href={`${base}/learn/${lesson}/#source-${resource}`}>{source.title}<small>{source.lesson}</small></a> : resource}</li>;
    })}</ul> : <p className="small muted">Sources you mark as studied on this day appear here.</p>}
  </div>;
}
