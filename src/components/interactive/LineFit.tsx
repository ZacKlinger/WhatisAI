import { useEffect, useMemo, useRef, useState } from 'react';
import { Axis, Slider, Widget, linear, palette, rng, useWidth } from './chart';

/* A model with two parameters: prediction = w·x + b. Find the parameters
   that minimize the mean squared error over the data. */
export default function LineFit() {
  const data = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: 16 }, (_, i) => {
      const xv = 0.5 + i * 0.6 + r.next() * 0.3;
      return [xv, 1.2 + 0.85 * xv + r.normal() * 0.9] as [number, number];
    });
  }, []);
  const [w, setW] = useState(0.2);
  const [b, setB] = useState(4);
  const [showErr, setShowErr] = useState(true);
  const anim = useRef<number | null>(null);
  const [ref, width] = useWidth<HTMLDivElement>(600);
  const W = width, H = Math.max(240, Math.round(width * 0.48));
  const m = { l: 40, r: 14, t: 12, b: 32 };
  const x = linear(0, 10.5, m.l, W - m.r);
  const y = linear(0, 12, H - m.b, m.t);
  const mse = (ww: number, bb: number) => data.reduce((s, [xv, yv]) => s + (ww * xv + bb - yv) ** 2, 0) / data.length;
  const loss = mse(w, b);

  function autofit() {
    if (anim.current) cancelAnimationFrame(anim.current);
    let ww = w, bb = b, k = 0;
    const tick = () => {
      for (let s = 0; s < 4; s++) {
        let gw = 0, gb = 0;
        for (const [xv, yv] of data) { const e = ww * xv + bb - yv; gw += (2 * e * xv) / data.length; gb += (2 * e) / data.length; }
        ww -= 0.012 * gw; bb -= 0.05 * gb;
      }
      setW(ww); setB(bb);
      if (++k < 140) anim.current = requestAnimationFrame(tick);
    };
    anim.current = requestAnimationFrame(tick);
  }
  useEffect(() => () => { if (anim.current) cancelAnimationFrame(anim.current); }, []);

  return (
    <Widget title="Fitting a model by hand" kicker="Interactive · two parameters"
      note={<>This model is a line with two <strong>parameters</strong>: a slope <em>w</em> and an intercept <em>b</em>. The vertical gaps between prediction and data are the errors; squaring and averaging them gives the <strong>loss</strong>. Training is the search for parameters with the lowest loss. A frontier language model is the same idea with roughly a trillion knobs instead of two.</>}>
      <div ref={ref} style={{ background: 'var(--bg-soft)', borderRadius: 'var(--radius)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Scatter plot with an adjustable line">
          <Axis scale={x} orient="bottom" at={H - m.b} length={[m.l, W - m.r]} ticks={[0, 2, 4, 6, 8, 10]} grid={m.t} />
          <Axis scale={y} orient="left" at={m.l} length={[H - m.b, m.t]} ticks={[0, 4, 8, 12]} grid={W - m.r} />
          {showErr && data.map(([xv, yv], i) => (
            <line key={i} x1={x(xv)} x2={x(xv)} y1={y(yv)} y2={y(w * xv + b)} style={{ stroke: palette[4], strokeWidth: 1.5, opacity: 0.7 }} />
          ))}
          <line x1={x(0)} y1={y(b)} x2={x(10.5)} y2={y(w * 10.5 + b)} style={{ stroke: palette[0], strokeWidth: 3 }} />
          {data.map(([xv, yv], i) => <circle key={i} cx={x(xv)} cy={y(yv)} r={4.5} style={{ fill: 'var(--fg)' }} />)}
        </svg>
      </div>
      <div className="controls">
        <Slider label="Slope w" value={w} min={-1} max={2.5} onChange={setW} display={w.toFixed(2)} />
        <Slider label="Intercept b" value={b} min={-3} max={8} onChange={setB} display={b.toFixed(2)} />
      </div>
      <div className="row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
        <div className="row">
          <button type="button" className="btn btn-primary btn-sm" onClick={autofit}>Let it learn</button>
          <button type="button" className="chip" aria-pressed={showErr} onClick={() => setShowErr((s) => !s)}>Show errors</button>
        </div>
        <div className="small muted tabular">Mean squared error: <strong style={{ color: loss < 0.9 ? 'var(--good)' : 'var(--fg)', fontSize: '1rem' }}>{loss.toFixed(2)}</strong></div>
      </div>
    </Widget>
  );
}
