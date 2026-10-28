import media from '../../data/watch/media.json';
import sources from '../../scripts/watch/sources.json';
import { publicHttpsUrl, sourceThumbnail } from './media.mjs';

const blockedOrigins = new Set(sources.sources.filter((s) => 'preview' in s && s.preview === false).map((s) => new URL(s.url).origin));

export function previewFor(explicit: unknown, sourceUrl: string) {
  const safe = publicHttpsUrl(sourceUrl);
  if (!safe || blockedOrigins.has(new URL(safe).origin)) return null;
  return sourceThumbnail(explicit, safe, media);
}
