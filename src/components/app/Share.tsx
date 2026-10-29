import { useState } from 'react';
export default function Share({ href, title }: { href: string; title: string }) {
  const [message, setMessage] = useState('');
  const [manual, setManual] = useState(false);
  async function share() {
    setMessage(''); setManual(false);
    if (navigator.share) {
      try { await navigator.share({ title, url: href }); return; }
      catch (error) { if ((error as Error).name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(href); setMessage('Link copied.'); }
    catch { setManual(true); setMessage('Copy this link to share:'); }
  }
  return <div className="share-control"><button type="button" className="btn btn-secondary btn-sm" onClick={() => void share()} aria-label="Share this page">Share this page ↗</button><span className="small muted" role="status">{message}</span>{manual && <input aria-label="Link to share" readOnly value={href} onFocus={(e) => e.target.select()} />}</div>;
}
