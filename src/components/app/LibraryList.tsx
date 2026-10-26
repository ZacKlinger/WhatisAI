import { useMemo, useState } from 'react';
import type { CorpusDoc } from '@/data/corpus';
import { isDone } from '@/lib/progress';
import { useHydrated, useProgress } from '@/lib/useProgress';

const KINDS = ['all', 'paper', 'system card', 'framework', 'policy', 'report'] as const;

export default function LibraryList({ docs, titles, base }: { docs: CorpusDoc[]; titles: Record<string, string>; base: string }) {
  const p = useProgress();
  const hydrated = useHydrated();
  const [kind, setKind] = useState<(typeof KINDS)[number]>('all');
  const [org, setOrg] = useState('all');
  const [onlyReady, setOnlyReady] = useState(false);
  const [q, setQ] = useState('');
  const orgs = useMemo(() => {
    const groups = ['Anthropic', 'OpenAI', 'Google', 'Policy bodies', 'Researchers'];
    return ['all', ...groups];
  }, []);
  const orgGroup = (d: CorpusDoc) => {
    if (d.org.includes('Anthropic')) return 'Anthropic';
    if (d.org.includes('OpenAI')) return 'OpenAI';
    if (d.org.includes('Google')) return 'Google';
    if (['policy'].includes(d.kind) || /European|NIST|White House|California|OECD|Summit|International panel/.test(d.org)) return 'Policy bodies';
    return 'Researchers';
  };
  const missing = (d: CorpusDoc) => d.requires.filter((id) => !isDone(p.modules[id]?.status));
  const shown = docs
    .filter((d) => kind === 'all' || d.kind === kind)
    .filter((d) => org === 'all' || orgGroup(d) === org)
    .filter((d) => !q || `${d.title} ${d.org} ${d.summary}`.toLowerCase().includes(q.toLowerCase()))
    .filter((d) => !onlyReady || (hydrated && missing(d).length === 0))
    .sort((a, b) => b.year - a.year);
  const readyCount = hydrated ? docs.filter((d) => missing(d).length === 0).length : 0;

  return (
    <div>
      <div className="lib-filters">
        <input type="search" placeholder="Search the corpus" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the corpus" style={{ maxWidth: 320 }} />
        <div className="chip-row">
          {KINDS.map((k) => <button key={k} type="button" className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{k === 'all' ? 'All types' : k}</button>)}
        </div>
        <div className="chip-row">
          {orgs.map((o) => <button key={o} type="button" className="chip" aria-pressed={org === o} onClick={() => setOrg(o)}>{o === 'all' ? 'All sources' : o}</button>)}
          <button type="button" className="chip" aria-pressed={onlyReady} onClick={() => setOnlyReady((v) => !v)}>Ready to read{hydrated ? ` · ${readyCount}` : ''}</button>
        </div>
      </div>
      <div className="grid" style={{ gap: 12, marginTop: 20 }}>
        {shown.map((d) => {
          const miss = hydrated ? missing(d) : d.requires;
          const ready = hydrated && miss.length === 0;
          return (
            <div key={d.id} className="card lib-card">
              <div className="lib-main">
                <div className="row xsmall muted" style={{ gap: 8 }}>
                  <span className="pill">{d.kind}</span><span>{d.org}</span><span>· {d.year}</span>
                </div>
                <a href={d.url} target="_blank" rel="noopener" className="lib-title">{d.title}</a>
                <p className="small muted" style={{ margin: 0 }}>{d.summary}</p>
                {d.guided && <a className="arrow-link small" href={`${base}/learn/${d.guided}/`}>Guided reading available</a>}
              </div>
              <div className="lib-side">
                {ready ? <span className="pill pill-good">Ready to read</span> : <span className="pill">{d.requires.length - miss.length}/{d.requires.length} prerequisites</span>}
                <div className="xsmall muted" style={{ marginTop: 8 }}>
                  {d.requires.map((id) => (
                    <a key={id} href={`${base}/learn/${id}/`} className="lib-req" data-done={hydrated && !miss.includes(id)}>{titles[id] ?? id}</a>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {shown.length === 0 && <div className="empty">Nothing matches. {onlyReady ? 'Complete more modules to unlock documents.' : ''}</div>}
      </div>
    </div>
  );
}
