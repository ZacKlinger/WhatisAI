import { useEffect, useState } from 'react';
import { criticalValue, zeroHeights } from '@/lib/zeta.mjs';
import './zeta-trace.css';

// Equal units on both axes preserve the shape of the complex trace.
const x = (v: number) => 177 + v * 88;
const y = (v: number) => 183 - v * 88;
const position = (t: number) => {
  const [a, b] = criticalValue(t);
  return `${x(a).toFixed(2)},${y(b).toFixed(2)}`;
};
const samples = Array.from({ length: 801 }, (_, i) => position(i / 20));
const fullPath = 'M' + samples.join(' L');
const display = (v: number) => (Math.abs(v) < .0005 ? 0 : v).toFixed(3);

export default function ZetaTrace() {
  const [height, setHeight] = useState(27);
  const [ready, setReady] = useState(false);
  // The SVG is rendered into the page. Controls appear when React attaches.
  useEffect(() => setReady(true), []);
  const [real, imaginary] = criticalValue(height);
  const nextZero = zeroHeights.find(n => n > height + .00001);
  const index = zeroHeights.findIndex(n => Math.abs(n - height) < .00001);
  const trail = 'M' + samples.slice(0, Math.floor(height * 20) + 1).concat(position(height)).join(' L');
  const cx = x(real), cy = y(imaginary);
  return <figure className="zeta-trace">
    <svg viewBox="0 0 480 365" role="img" aria-labelledby="zeta-graph-title zeta-graph-description">
      <title id="zeta-graph-title">Riemann’s zeta function on the critical line</title>
      <desc id="zeta-graph-description">The horizontal axis is the real output and the vertical axis is the imaginary output. Each loop crossing the origin marks a zero.</desc>
      <defs>
        <pattern id="zeta-grid" width="44" height="44" x="1" y="7" patternUnits="userSpaceOnUse"><circle cx="0.8" cy="0.8" r=".85" fill="#b3c5f3" opacity=".35" /></pattern>
        <linearGradient id="zeta-spectrum" x1="0" y1="1" x2="1" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="#74d9f4" /><stop offset=".42" stopColor="#b5abff" /><stop offset=".72" stopColor="#efadcd" /><stop offset="1" stopColor="#ffda9a" />
        </linearGradient>
        <filter id="zeta-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.2" /></filter>
      </defs>
      <rect x="1" y="3" width="477" height="357" fill="url(#zeta-grid)" />
      <g stroke="#7081a6" strokeWidth=".8">
        <path d={`M15 ${y(0)}H461 M${x(0)} 12V348`} />
        {[-1, 1, 2, 3].map(n => <path key={n} d={`M${x(n)} ${y(0)-3}v6`} />)}
        {[-1, 1].map(n => <path key={n} d={`M${x(0)-3} ${y(n)}h6`} />)}
      </g>
      <g className="zeta-ticks" fill="#b6c4d8">
        {[-1, 1, 2, 3].map(n => <text key={n} x={x(n)} y={y(0)+17} textAnchor="middle">{n}</text>)}
        {[-1, 1].map(n => <text key={n} x={x(0)-8} y={y(n)+4} textAnchor="end">{n}</text>)}
        <text x="461" y={y(0)-8} textAnchor="end">Real</text><text x={x(0)+9} y="20">Imaginary</text>
      </g>
      <path d={fullPath} fill="none" stroke="#9198c8" strokeOpacity=".37" strokeWidth="1.1" />
      <path d={trail} fill="none" stroke="url(#zeta-spectrum)" strokeWidth="4.5" filter="url(#zeta-glow)" opacity=".6" />
      <path d={trail} fill="none" stroke="url(#zeta-spectrum)" strokeWidth="2" strokeLinecap="round" />
      <circle cx={x(0)} cy={y(0)} r="5" stroke="#f5f4ff" fill="#11162d" />
      <text x={x(0)-9} y={y(0)+19} textAnchor="end" className="zeta-ticks" fill="white">0</text>
      <circle cx={cx} cy={cy} r="10" fill="#ffdea9" opacity=".19" />
      <circle cx={cx} cy={cy} r="4" fill="#fff0ca" />
    </svg>
    <figcaption>Fix the real part of the input at ½ and vary its height t. The glowing point shows the output. At the center of the crosshairs, the function equals zero.</figcaption>
    {ready && <div className="zeta-controls">
      <div className="zeta-readout"><label htmlFor="zeta-height">Height <i>t</i></label>
        <output htmlFor="zeta-height">{height.toFixed(3)}</output>
        <span>{index < 0 ? `ζ ≈ ${display(real)} ${imaginary < 0 ? '−' : '+'} ${display(Math.abs(imaginary))}i` : `Zero ${index + 1} · ζ ≈ 0`}</span>
      </div>
      <input id="zeta-height" type="range" min="0" max="40" step=".001" value={height}
        onChange={e => setHeight(Number(e.target.value))} aria-valuetext={`Height ${height.toFixed(3)}, real output ${display(real)}, imaginary output ${display(imaginary)}`} />
      <div className="zeta-actions"><span>0 ≤ <i>t</i> ≤ 40</span><button type="button" onClick={() => setHeight(nextZero ?? zeroHeights[0])}>{nextZero ? 'Find next zero' : 'Return to first zero'}</button></div>
      <span className="sr-only" aria-live="polite">{index >= 0 ? `Zero ${index+1} at height ${height.toFixed(3)}` : ''}</span>
    </div>}
  </figure>;
}
