import { useState } from 'react';
import { Slider, Widget } from './chart';

export default function Workday() {
  const [eligible, setEligible] = useState(120);
  const [review, setReview] = useState(30);
  const day = 480;
  const draft = eligible / 2;
  const total = day - eligible + draft + review;
  const scale = Math.max(day, total);
  const segments = [
    { label: 'Other work', minutes: day - eligible, color: 'var(--fg-3)' },
    { label: 'Assisted task', minutes: draft, color: 'var(--c1)' },
    { label: 'Checking', minutes: review, color: 'var(--c4)' },
  ];
  return <Widget title="Can a faster task make a longer workday?" kicker="Interactive · work and productivity"
    note="This example starts with an eight-hour day and assumes AI halves the time spent on one task. Adjust the task size and the checking time to test that assumption’s effect on the whole day.">
    <div className="small">Original workday · {day} min</div>
    <div style={{ width: `${100 * day / scale}%`, height: 18, borderRadius: 3, background: 'var(--fg-3)', marginBlock: '4px 16px' }} />
    <div className="small">With assistance · {total} min</div>
    <div aria-hidden="true" style={{ display: 'flex', borderRadius: 3, overflow: 'hidden', marginBlock: '4px 10px' }}>
      {segments.map(s => <span key={s.label} style={{ width: `${100 * s.minutes / scale}%`, height: 18, background: s.color }} />)}
    </div>
    <div className="row small muted" style={{ flexWrap: 'wrap' }}>{segments.map(s =>
      <span key={s.label}>{s.label} · {s.minutes} min</span>)}</div>
    <div className="controls">
      <Slider label="Original time on the task" min={30} max={360} step={10} value={eligible} display={`${eligible} min`} onChange={setEligible} />
      <Slider label="Time spent checking" min={0} max={180} step={5} value={review} display={`${review} min`} onChange={setReview} />
    </div>
    <output className="small">{total === day ? 'The workday takes the same time.' : `The workday is ${Math.abs(day - total)} minutes ${total < day ? 'shorter' : 'longer'}.`}</output>
  </Widget>;
}
