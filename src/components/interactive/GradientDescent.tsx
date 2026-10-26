import { useEffect, useRef, useState } from 'react';
import { Slider, Widget, linear, palette, path, useWidth } from './chart';

const f = (t: number) => 0.6 * Math.sin(2.4 * t) + 0.12 * (t - 0.4) ** 2 + 1.6;
const df = (t: number) => 0.6 * 2.4 * Math.cos(2.4 * t) + 0.24 * (t - 0.4);

export default function GradientDescent() {
  const [lr, setLr] = useState(0.12);
  const [start, setStart] = useState(-2.9);
  const [trail, setTrail] = useState<number[]>([-2.9]);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);
  const [ref, width] = useWidth<HTMLDivElement>(640);
  const W = width, H = Math.max(230, Math.round(width * 0.42));
  const x = linear(-3.4, 3.8, 24, W - 16);
  const y = linear(0.4, 4.2, H - 26, 14);
  const curve = Array.from({ length: 240 }, (_, i) => { const t = -3.4 + (i / 239) * 7.2; return [x(t), y(f(t))] as [number, number]; });

  const cur = trail[trail.length - 1];
  const diverged = !Number.isFinite(cur) || cur < -3.4 || cur > 3.8;

  function step() {
    setTrail((tr) => {
      const t = tr[tr.length - 1];
      if (!Number.isFinite(t) || t < -3.4 || t > 3.8) return tr;
      const next = t - lr * df(t);
      return [...tr, next].slice(-80);
    });
  }

  useEffect(() => {
    if (!running) return;
    timer.current = window.setInterval(step, 140);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [running, lr]);

  useEffect(() => { if (diverged || (trail.length > 60)) setRunning(false); }, [diverged, trail.length]);

  const reset = (s = start) => { setRunning(false); setTrail([s]); };
  const grad = Number.isFinite(cur) ? df(cur) : 0;

  return (
    <Widget title="Rolling downhill: gradient descent" kicker="Interactive · set a learning rate, then run"
      note={<>Too small a learning rate crawls; too large overshoots. Try other starting points: descent only finds the valley it starts in.</>}>
      <div ref={ref} style={{ background: 'var(--bg-soft)', borderRadius: 'var(--radius)', cursor: 'crosshair' }}
        onClick={(e) => {
          const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const t = x.invert(((e.clientX - r.left) / r.width) * W);
          setStart(t);
          reset(t);
        }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Loss curve with a ball descending">
          <path d={path(curve)} style={{ fill: 'none', stroke: palette[0], strokeWidth: 2.5 }} />
          {trail.slice(0, -1).map((t, i) => Number.isFinite(t) && (
            <circle key={i} cx={x(t)} cy={y(f(t))} r={3} style={{ fill: palette[1], opacity: 0.25 + (0.6 * i) / trail.length }} />
          ))}
          {trail.length > 1 && <path d={path(trail.filter(Number.isFinite).map((t) => [x(t), y(f(t))]))} style={{ fill: 'none', stroke: palette[1], strokeWidth: 1, opacity: 0.5 }} />}
          {!diverged && (
            <g>
              <line x1={x(cur - 0.45)} y1={y(f(cur) - 0.45 * grad)} x2={x(cur + 0.45)} y2={y(f(cur) + 0.45 * grad)} style={{ stroke: 'var(--fg-3)', strokeDasharray: '4 3' }} />
              <circle cx={x(cur)} cy={y(f(cur))} r={9} style={{ fill: palette[1], stroke: 'var(--bg)', strokeWidth: 3 }} />
            </g>
          )}
          <text x={28} y={H - 8} style={{ fontSize: 11, fill: 'var(--fg-3)' }}>parameter →   (click anywhere to move the starting point)</text>
        </svg>
      </div>
      <div className="controls">
        <Slider label="Learning rate" value={lr} min={0.01} max={1.2} step={0.01} onChange={(v) => { setLr(v); }} display={lr.toFixed(2)} />
      </div>
      <div className="row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
        <div className="row">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => { if (diverged) reset(); setRunning((r) => !r); }}>{running ? 'Pause' : 'Run'}</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={step} disabled={running || diverged}>One step</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => reset()}>Reset</button>
        </div>
        <div className="small muted tabular">
          {diverged ? <span style={{ color: 'var(--bad)' }}>Diverged: the steps overshot and flew off the curve.</span> : <>step {trail.length - 1} · loss <strong style={{ color: 'var(--fg)' }}>{f(cur).toFixed(3)}</strong> · slope {grad.toFixed(2)}</>}
        </div>
      </div>
    </Widget>
  );
}
