import { useState } from 'react';
import { Axis, Slider, Widget, linear, log, palette, path, useWidth } from './chart';

/* How sensitive are extrapolations to the doubling time? The task-length
   "time horizon" metric (METR) is used as the example. */
const fmtDur = (h: number) => {
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 40) return `${h.toFixed(h < 10 ? 1 : 0)} h`;
  if (h < 2000) return `${(h / 40).toFixed(1)} work-weeks`;
  return `${(h / 2000).toFixed(1)} work-years`;
};

export default function Doubling() {
  const [h0, setH0] = useState(4);
  const [months, setMonths] = useState(7);
  const [years, setYears] = useState(3);
  const [ref, width] = useWidth<HTMLDivElement>(600);
  const W = width, H = 250, m = { l: 64, r: 16, t: 14, b: 40 };
  const x = linear(0, 5, m.l, W - m.r);
  const y = log(0.1, 1e6, H - m.b, m.t);
  const proj = (dm: number) => Array.from({ length: 61 }, (_, i) => { const t = (i / 60) * 5; return [x(t), y(Math.min(1e6, h0 * 2 ** ((t * 12) / dm)))] as [number, number]; });
  const at = h0 * 2 ** ((years * 12) / months);

  return (
    <Widget title="The tyranny of the doubling time" kicker="Interactive · extrapolating a trend"
      note={<>Time horizon: the length of task, in skilled-human time, that an AI completes half the time. Small changes in doubling time compound into huge forecast gaps.</>}>
      <div ref={ref} style={{ background: 'var(--bg-soft)', borderRadius: 'var(--radius)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Projected time horizon">
          <Axis scale={y} orient="left" at={m.l} length={[H - m.b, m.t]} grid={W - m.r} ticks={[0.1, 1, 10, 100, 1e3, 1e4, 1e5, 1e6]} format={(v) => (v < 1 ? '6m' : v < 40 ? `${v}h` : v < 2000 ? `${Math.round(v / 40)}wk` : `${Math.round(v / 2000)}yr`)} />
          <Axis scale={x} orient="bottom" at={H - m.b} length={[m.l, W - m.r]} ticks={[0, 1, 2, 3, 4, 5]} label="years from now" />
          <path d={path(proj(4))} style={{ fill: 'none', stroke: 'var(--line-3)', strokeWidth: 1.5, strokeDasharray: '4 3' }} />
          <path d={path(proj(12))} style={{ fill: 'none', stroke: 'var(--line-3)', strokeWidth: 1.5, strokeDasharray: '4 3' }} />
          <path d={path(proj(months))} style={{ fill: 'none', stroke: palette[0], strokeWidth: 3 }} />
          <circle cx={x(years)} cy={y(Math.min(1e6, at))} r={7} style={{ fill: palette[1], stroke: 'var(--bg)', strokeWidth: 3 }} />
        </svg>
      </div>
      <div className="controls">
        <Slider label="Today's time horizon" value={h0} min={0.25} max={40} step={0.25} onChange={setH0} display={fmtDur(h0)} />
        <Slider label="Doubling time" value={months} min={3} max={18} step={0.5} onChange={setMonths} display={`${months} months`} />
        <Slider label="Years ahead" value={years} min={0.5} max={5} step={0.5} onChange={setYears} display={`${years} yr`} />
      </div>
      <div className="small muted" style={{ marginTop: 12 }}>
        If the trend held, in {years} years the horizon would be <strong style={{ color: 'var(--fg)' }}>{fmtDur(at)}</strong> ({(at / h0).toFixed(0)}× today). Dashed: 4- and 12-month doubling.
      </div>
    </Widget>
  );
}
