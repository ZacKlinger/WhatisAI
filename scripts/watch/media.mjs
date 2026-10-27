// Publisher-designated previews only. No image downloads, rehosting, or API keys.
import { normalizeThumbnail, publicHttpsUrl } from '../../src/lib/media.mjs';

const text = (v) => typeof v === 'string' ? v : v?.['#text'] ?? '';
const list = (v) => v == null ? [] : Array.isArray(v) ? v : [v];

export function feedThumbnail(item, sourceUrl, publisher) {
  const group = item['media:group'] ?? {};
  const candidates = [
    ...list(item['media:thumbnail']), ...list(group['media:thumbnail']),
    ...list(item['media:content']).filter((x) => x['@medium'] === 'image' || String(x['@type']).startsWith('image/')),
    ...list(group['media:content']).filter((x) => x['@medium'] === 'image' || String(x['@type']).startsWith('image/')),
    ...list(item.enclosure).filter((x) => String(x['@type']).startsWith('image/')),
    ...list(item['itunes:image']),
  ];
  const credit = text(item['media:credit']) || text(group['media:credit']) || text(item.author?.name) || text(item['dc:creator']) || publisher;
  for (const c of candidates) {
    const result = normalizeThumbnail({ url: publicHttpsUrl(c?.['@url'] ?? c?.['@href'], sourceUrl), sourceUrl, credit, alt: '', provenance: 'feed', licenseUrl: item['media:license']?.['@href'] ?? group['media:license']?.['@href'] });
    if (result) return result;
  }
  return null;
}

export function youtubeThumbnail(sourceUrl, publisher) {
  const safe = publicHttpsUrl(sourceUrl);
  if (!safe) return null;
  const u = new URL(safe);
  let id;
  if (u.hostname === 'youtu.be') id = u.pathname.slice(1);
  else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(u.hostname)) {
    id = u.pathname === '/watch' ? u.searchParams.get('v') : u.pathname.match(/^\/(?:shorts|embed)\/([^/]+)$/)?.[1];
  }
  if (!id || !/^[\w-]{11}$/.test(id)) return null;
  return normalizeThumbnail({ url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, sourceUrl: safe, credit: publisher, alt: '', provenance: 'youtube' });
}

function decode(s) {
  return s.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const n = entity.toLowerCase().startsWith('&#x') ? parseInt(entity.slice(3, -1), 16) : Number(entity.slice(2, -1));
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
  });
}

export function openGraphThumbnail(html, sourceUrl, publisher) {
  const meta = new Map();
  // Read metadata only, never arbitrary body images or executable markup.
  const head = html.split(/<\/head\s*>/i)[0].replace(/<!--[^]*?-->|<script\b[^>]*>[^]*?<\/script\s*>/gi, '');
  for (const tag of head.match(/<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi) ?? []) {
    const attrs = {};
    for (const a of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) attrs[a[1].toLowerCase()] = decode(a[2] ?? a[3] ?? a[4]);
    const key = (attrs.property ?? attrs.name ?? '').toLowerCase();
    if (key && attrs.content && !meta.has(key)) meta.set(key, attrs.content);
  }
  return normalizeThumbnail({
    url: publicHttpsUrl(meta.get('og:image:secure_url') ?? meta.get('og:image') ?? meta.get('twitter:image'), sourceUrl),
    sourceUrl, credit: publisher, alt: meta.get('og:image:alt') ?? meta.get('twitter:image:alt') ?? '', provenance: 'opengraph',
  });
}

/** Exact configured origins only; redirects are checked before making a request.
 * Injected fetch is for deterministic offline regression tests.
 */
export async function fetchPageThumbnail(sourceUrl, publisher, allowedOrigins, fetcher = fetch) {
  let current = publicHttpsUrl(sourceUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    for (let hop = 0; hop < 4; hop++) {
      if (!current || !allowedOrigins.has(new URL(current).origin)) return null;
      const response = await fetcher(current, { redirect: 'manual', signal: controller.signal, headers: { Accept: 'text/html', 'User-Agent': 'WhatisAI-watcher/1.0 (educational link previews)' } });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        await response.body?.cancel();
        current = publicHttpsUrl(location, current);
        continue;
      }
      if (!response.ok || !/text\/html|application\/xhtml\+xml/i.test(response.headers.get('content-type') ?? '') || Number(response.headers.get('content-length')) > 2_000_000) {
        await response.body?.cancel();
        return null;
      }
      if (!response.body) return null;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let html = '', bytes = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > 2_000_000) return null;
          html += decoder.decode(value, { stream: true });
          if (/<\/head\s*>/i.test(html)) break;
        }
      } finally { await reader.cancel(); }
      // Resolve relative images against the final page but keep the original attribution URL.
      const preview = openGraphThumbnail(html, current, publisher);
      return preview ? { ...preview, sourceUrl: publicHttpsUrl(sourceUrl) } : null;
    }
  } catch { return null; }
  finally { clearTimeout(timer); }
  return null;
}

export function mediaFrontmatter(thumbnail) {
  const safe = normalizeThumbnail(thumbnail);
  return safe ? `thumbnail: ${JSON.stringify(safe)}\n` : '';
}
