import { useEffect, useMemo, useRef, useState } from 'react';
import { Widget, rng } from './chart';

type Dataset = 'circle' | 'xor' | 'spiral' | 'line';

function makeData(kind: Dataset, n = 200): [number, number, number][] {
  const r = rng(kind.length * 31 + 5);
  const out: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    if (kind === 'spiral') {
      const cls = i % 2;
      const t = (i / n) * 3.2 + r.next() * 0.15;
      const a = t * 2.1 + cls * Math.PI;
      out.push([t * Math.cos(a) * 0.3 + r.normal() * 0.03, t * Math.sin(a) * 0.3 + r.normal() * 0.03, cls]);
      continue;
    }
    const x = r.next() * 2 - 1;
    const y = r.next() * 2 - 1;
    let cls = 0;
    if (kind === 'circle') cls = x * x + y * y < 0.42 ? 1 : 0;
    if (kind === 'xor') cls = x * y > 0 ? 1 : 0;
    if (kind === 'line') cls = y > 0.6 * x + 0.1 ? 1 : 0;
    out.push([x, y, cls]);
  }
  return out;
}

/* A tiny fully-connected network trained with plain gradient descent:
   2 inputs → hidden layer(s) of tanh units → 1 sigmoid output. */
class Net {
  sizes: number[];
  W: number[][][];
  B: number[][];
  constructor(sizes: number[], seed = 3) {
    this.sizes = sizes;
    const r = rng(seed);
    this.W = sizes.slice(1).map((n, l) => Array.from({ length: n }, () => Array.from({ length: sizes[l] }, () => r.normal() * Math.sqrt(1 / sizes[l]))));
    this.B = sizes.slice(1).map((n) => Array(n).fill(0));
  }
  forward(x: number[]) {
    const acts = [x];
    for (let l = 0; l < this.W.length; l++) {
      const prev = acts[l];
      const last = l === this.W.length - 1;
      acts.push(this.W[l].map((row, j) => {
        const z = row.reduce((s, w, i) => s + w * prev[i], this.B[l][j]);
        return last ? 1 / (1 + Math.exp(-z)) : Math.tanh(z);
      }));
    }
    return acts;
  }
  train(data: [number, number, number][], lr: number) {
    let loss = 0;
    const gW = this.W.map((L) => L.map((row) => row.map(() => 0)));
    const gB = this.B.map((L) => L.map(() => 0));
    for (const [x, y, t] of data) {
      const acts = this.forward([x, y]);
      const out = acts[acts.length - 1][0];
      loss += -(t * Math.log(out + 1e-9) + (1 - t) * Math.log(1 - out + 1e-9));
      let delta = [out - t];
      for (let l = this.W.length - 1; l >= 0; l--) {
        const prev = acts[l];
        for (let j = 0; j < delta.length; j++) {
          gB[l][j] += delta[j];
          for (let i = 0; i < prev.length; i++) gW[l][j][i] += delta[j] * prev[i];
        }
        if (l > 0) {
          delta = prev.map((a, i) => (1 - a * a) * delta.reduce((s, d, j) => s + d * this.W[l][j][i], 0));
        }
      }
    }
    const n = data.length;
    for (let l = 0; l < this.W.length; l++) {
      for (let j = 0; j < this.W[l].length; j++) {
        this.B[l][j] -= (lr * gB[l][j]) / n;
        for (let i = 0; i < this.W[l][j].length; i++) this.W[l][j][i] -= (lr * gW[l][j][i]) / n;
      }
    }
    return loss / n;
  }
  params() {
    return this.W.reduce((s, L) => s + L.length * L[0].length, 0) + this.B.reduce((s, L) => s + L.length, 0);
  }
}

export default function NeuralPlayground() {
  const [kind, setKind] = useState<Dataset>('circle');
  const [hidden, setHidden] = useState(4);
  const [layers, setLayers] = useState(1);
  const [running, setRunning] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState<number | null>(null);
  const data = useMemo(() => makeData(kind), [kind]);
  const netRef = useRef<Net>(new Net([2, 4, 1]));
  const canvas = useRef<HTMLCanvasElement>(null);

  const reset = () => {
    netRef.current = new Net([2, ...Array(layers).fill(hidden), 1], Math.floor(Math.random() * 1000));
    setEpoch(0);
    setLoss(null);
    draw();
  };

  useEffect(reset, [kind, hidden, layers]);

  function draw() {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const N = 60;
    const S = c.width;
    const cell = S / N;
    const dark = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() === '#000000';
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const x = (i / N) * 2 - 1;
        const y = 1 - (j / N) * 2;
        const p = netRef.current.forward([x, y]).at(-1)![0];
        const a = Math.abs(p - 0.5) * 2;
        const [r, g, b] = p > 0.5 ? [47, 107, 255] : [226, 98, 43];
        ctx.fillStyle = `rgba(${r},${g},${b},${0.08 + a * (dark ? 0.42 : 0.32)})`;
        ctx.fillRect(i * cell, j * cell, cell + 1, cell + 1);
      }
    }
    for (const [x, y, t] of data) {
      ctx.beginPath();
      ctx.arc(((x + 1) / 2) * S, ((1 - y) / 2) * S, S / 110, 0, Math.PI * 2);
      ctx.fillStyle = t ? '#2f6bff' : '#e2622b';
      ctx.strokeStyle = dark ? '#000' : '#fff';
      ctx.lineWidth = S / 360;
      ctx.fill();
      ctx.stroke();
    }
  }

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const loop = () => {
      let l = 0;
      for (let k = 0; k < 6; k++) l = netRef.current.train(data, 0.9);
      setLoss(l);
      setEpoch((e) => e + 6);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, data]);

  useEffect(() => {
    const onTheme = () => draw();
    window.addEventListener('themechange', onTheme);
    return () => window.removeEventListener('themechange', onTheme);
  });

  const acc = useMemo(() => {
    if (loss === null) return null;
    const ok = data.filter(([x, y, t]) => (netRef.current.forward([x, y]).at(-1)![0] > 0.5 ? 1 : 0) === t).length;
    return ok / data.length;
  }, [loss, data]);

  return (
    <Widget title="Train a neural network in your browser" kicker="Interactive · real backpropagation"
      note={<>The colored background is the network's belief at every point: blue for one class, orange for the other, deeper color for more confidence. A network with no hidden units can only draw a straight boundary. Add hidden units and it can bend that boundary into circles and spirals. This is the universal approximation idea, made visible. Every frame runs real forward and backward passes on {data.length} points.</>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 18 }}>
        <canvas ref={canvas} width={480} height={480} style={{ width: '100%', aspectRatio: '1', borderRadius: 'var(--radius)', background: 'var(--bg-soft)' }} aria-label="Decision boundary of the network" />
        <div className="stack" style={{ ['--stack' as string]: '16px' }}>
          <div>
            <div className="small muted" style={{ marginBottom: 6 }}>Dataset</div>
            <div className="chip-row">
              {(['line', 'circle', 'xor', 'spiral'] as Dataset[]).map((k) => (
                <button key={k} type="button" className="chip" aria-pressed={kind === k} onClick={() => { setRunning(false); setKind(k); }}>{k}</button>
              ))}
            </div>
          </div>
          <div className="control">
            <label><span>Hidden units per layer</span><output>{hidden}</output></label>
            <input type="range" min={1} max={12} step={1} value={hidden} onChange={(e) => { setRunning(false); setHidden(Number(e.target.value)); }} aria-label="Hidden units" />
          </div>
          <div>
            <div className="small muted" style={{ marginBottom: 6 }}>Hidden layers</div>
            <div className="chip-row">
              {[1, 2, 3].map((n) => <button key={n} type="button" className="chip" aria-pressed={layers === n} onClick={() => { setRunning(false); setLayers(n); }}>{n}</button>)}
            </div>
          </div>
          <div className="row">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Train'}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setRunning(false); reset(); }}>Reinitialize</button>
          </div>
          <div className="small muted tabular" style={{ lineHeight: 1.9 }}>
            <div>Parameters: <strong style={{ color: 'var(--fg)' }}>{netRef.current.params()}</strong></div>
            <div>Epoch: <strong style={{ color: 'var(--fg)' }}>{epoch}</strong></div>
            <div>Loss: <strong style={{ color: 'var(--fg)' }}>{loss === null ? '–' : loss.toFixed(3)}</strong></div>
            <div>Accuracy: <strong style={{ color: acc && acc > 0.95 ? 'var(--good)' : 'var(--fg)' }}>{acc === null ? '–' : `${Math.round(acc * 100)}%`}</strong></div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
