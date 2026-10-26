import { useRef } from 'react';
import { exportProgress, importProgress, isDone, resetProgress } from '@/lib/progress';
import { useHydrated, useProgress } from '@/lib/useProgress';
import CalibrationChart from '@/components/interactive/CalibrationChart';

interface M { id: string; title: string; track: string }
interface T { id: string; numeral: string; title: string }

export default function ProgressDashboard({ modules, tracks, base }: { modules: M[]; tracks: T[]; base: string }) {
  const p = useProgress();
  const hydrated = useHydrated();
  const file = useRef<HTMLInputElement>(null);
  if (!hydrated) return <div style={{ minHeight: 300 }} />;

  const days = Array.from({ length: 84 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (83 - i));
    const k = d.toISOString().slice(0, 10);
    return [k, p.activity[k] ?? 0] as const;
  });
  const maxAct = Math.max(1, ...days.map(([, v]) => v));

  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      <div className="grid grid-2">
        <div className="card">
          <div className="h4" style={{ marginBottom: 12 }}>By track</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {tracks.map((t) => {
              const ms = modules.filter((m) => m.track === t.id);
              const done = ms.filter((m) => isDone(p.modules[m.id]?.status)).length;
              return (
                <div key={t.id}>
                  <div className="row small" style={{ justifyContent: 'space-between' }}><span>{t.numeral} · {t.title}</span><span className="muted tabular">{done}/{ms.length}</span></div>
                  <div className="bar" style={{ marginTop: 6 }}><span style={{ width: `${(done / ms.length) * 100}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <div className="h4" style={{ marginBottom: 12 }}>Calibration</div>
          <CalibrationChart points={p.calibration} size={300} />
        </div>
      </div>
      <div className="card">
        <div className="h4" style={{ marginBottom: 12 }}>Activity, last 12 weeks</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
          {Array.from({ length: 12 }, (_, w) => (
            <div key={w} style={{ display: 'grid', gap: 4 }}>
              {days.slice(w * 7, w * 7 + 7).map(([k, v]) => (
                <div key={k} title={`${k}: ${v}`} style={{ aspectRatio: '1', borderRadius: 4, background: v ? `color-mix(in srgb, var(--c3) ${20 + (v / maxAct) * 80}%, var(--bg-muted))` : 'var(--bg-muted)' }} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="h4" style={{ marginBottom: 6 }}>Your data</div>
        <p className="small muted" style={{ margin: '0 0 14px' }}>Saved in this browser only. Export to move devices.</p>
        <div className="row">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
            const blob = new Blob([exportProgress()], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `whatisai-progress-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
          }}>Export progress</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => file.current?.click()}>Import progress</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try { importProgress(await f.text()); } catch (err) { alert(String(err)); }
          }} />
          <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--bad)' }} onClick={() => { if (confirm('Erase all progress in this browser? This cannot be undone.')) resetProgress(); }}>Reset</button>
          {p.placement && <a className="btn btn-ghost btn-sm" href={`${base}/placement/`}>Retake placement</a>}
        </div>
      </div>
    </div>
  );
}
