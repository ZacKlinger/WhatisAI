import { useEffect, useRef, useState } from 'react';
import { normalizeThumbnail } from '@/lib/media.mjs';

interface Props { thumbnail?: unknown; publisher: string; format?: string }

export default function MediaPreview({ thumbnail, publisher, format = 'article' }: Props) {
  const preview = normalizeThumbnail(thumbnail);
  const [failed, setFailed] = useState<string | null>(null);
  const image = useRef<HTMLImageElement>(null);
  const show = !!preview && failed !== preview.url;
  useEffect(() => {
    // An error may have fired before React hydrated, including from browser cache.
    if (image.current?.complete && image.current.naturalWidth === 0 && preview) setFailed(preview.url);
  }, [preview?.url]);
  const label = format === 'video' ? 'Video' : format === 'podcast' ? 'Podcast' : format === 'paper' || format === 'research' ? 'Research' : format === 'policy' ? 'Policy' : 'Source';
  return (
    <div className="media-preview" data-preview-state={show ? 'image' : 'fallback'}>
      <div className="media-visual">
        <div className="media-fallback">
          <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            {format === 'video' ? <><rect x="3" y="5" width="26" height="22" rx="4" /><path d="m13 11 8 5-8 5z" /></> : <><path d="M8 3h11l6 6v20H8zM19 3v7h6M12 16h9M12 21h9" /></>}
          </svg>
          <span>{label}</span>
          <span className="media-publisher">{publisher}</span>
        </div>
        {show && <img ref={image} src={preview.url} alt={preview.alt} width="640" height="360" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(preview.url)} />}
      </div>
      {show && <div className="media-credit">Preview: {preview.credit}</div>}
    </div>
  );
}
