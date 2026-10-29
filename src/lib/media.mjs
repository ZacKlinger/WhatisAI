/** @typedef {{url: string, sourceUrl: string, credit: string, alt: string, provenance: 'feed' | 'opengraph' | 'youtube' | 'editor', licenseUrl?: string}} Thumbnail */

/** Only public HTTPS URLs may be used as previews or attribution links.
 * @param {unknown} value
 * @param {string} [base]
 */
export function publicHttpsUrl(value, base) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const u = new URL(value, base);
    const host = u.hostname.toLowerCase().replace(/\.$/, '');
    if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) return null;
    if (!host.includes('.') || host.includes(':') || /^[\d.]+$/.test(host) || /(?:^|\.)(?:localhost|local|internal|home|lan|test|invalid)$/.test(host) || host.endsWith('.localhost')) return null;
    u.hostname = host;
    u.hash = '';
    return u.href;
  } catch { return null; }
}

/** Validate persisted metadata again at the rendering boundary.
 * @param {unknown} value
 * @returns {Thumbnail | null}
 */
export function normalizeThumbnail(value) {
  if (!value || typeof value !== 'object') return null;
  const t = /** @type {Record<string, unknown>} */ (value);
  const url = publicHttpsUrl(t.url);
  const sourceUrl = publicHttpsUrl(t.sourceUrl);
  if (!url || !sourceUrl || typeof t.credit !== 'string' || !t.credit.trim()) return null;
  if (!['feed', 'opengraph', 'youtube', 'editor'].includes(String(t.provenance))) return null;
  const licenseUrl = publicHttpsUrl(t.licenseUrl);
  return { url, sourceUrl, credit: t.credit.trim().slice(0, 200), alt: typeof t.alt === 'string' ? t.alt.slice(0, 300) : '', provenance: /** @type {Thumbnail['provenance']} */ (t.provenance), ...(licenseUrl ? { licenseUrl } : {}) };
}

/** A thumbnail must describe the source being linked, never another cluster member.
 * @param {unknown} explicit
 * @param {string} sourceUrl
 * @param {Record<string, {checkedAt?: string, thumbnail?: unknown}>} cache
 */
export function sourceThumbnail(explicit, sourceUrl, cache = {}) {
  const key = publicHttpsUrl(sourceUrl);
  return [explicit, cache[key ?? '']?.thumbnail].map(normalizeThumbnail).find((candidate) => candidate && candidate.sourceUrl === key) ?? null;
}
