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
        <div className="h4" style={{ marginBottom: 6 }}>Your data</div>
        <p className="small muted" style={{ margin: '0 0 14px' }}>Saved automatically on this device. Export a copy, or use Your account to save and restore a private cloud copy.</p>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <a className="btn btn-secondary btn-sm" href={`${base}/account/`}>Your account</a>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
            const blob = new Blob([exportProgress()], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `whatisai-progress-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
          }}>Export progress</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => file.current?.click()}>Import progress</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try { importProgress(await f.text()); } catch (err) { alert(String(err)); }
          }} />
          <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--bad)' }} onClick={() => { if (confirm('Erase the current profile’s progress and goals on this device? Cloud saves are unchanged. This cannot be undone.')) resetProgress(); }}>Reset</button>
          {p.placement && <a className="btn btn-ghost btn-sm" href={`${base}/placement/`}>Retake placement</a>}
        </div>
      </div>
    </div>
  );
}
