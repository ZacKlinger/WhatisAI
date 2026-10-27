#!/usr/bin/env node
// Backfill current signal/digest previews. No image files are copied; the cache
// stores attribution and publisher-designated preview URLs only.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA, ROOT, assertNoSpend, readJSON, today, writeJSON } from './lib.mjs';
import { fetchPageThumbnail, youtubeThumbnail } from './media.mjs';
import { publicHttpsUrl, sourceThumbnail } from '../../src/lib/media.mjs';
import { parse } from 'yaml';

assertNoSpend();
const { sources } = await readJSON(join(ROOT, 'scripts/watch/sources.json'), { sources: [] });
const enabled = sources.filter((s) => s.preview !== false);
const origins = new Set(enabled.map((s) => new URL(s.url).origin));
const blocked = new Set(sources.filter((s) => s.preview === false).map((s) => new URL(s.url).origin));
const cache = await readJSON(join(DATA, 'media.json'), {});
const targets = new Map();
const date = today();

function add(url, publisher, thumbnail) {
  const safe = publicHttpsUrl(url);
  if (!safe || blocked.has(new URL(safe).origin)) return;
  targets.set(safe, { publisher: publisher || new URL(safe).hostname, thumbnail });
}

// Existing editorial signals are included, so old content can gain previews.
for (const f of (await readdir(join(ROOT, 'src/content/signals'))).filter((f) => f.endsWith('.md')).sort().reverse()) {
  const body = await readFile(join(ROOT, 'src/content/signals', f), 'utf8');
  try {
    const frontmatter = parse(body.match(/^---\r?\n([^]*?)\r?\n---/)?.[1] ?? '') ?? {};
    for (const source of frontmatter.sources ?? []) add(source.url, source.publisher, frontmatter.thumbnail);
  } catch { console.warn(`Skipping malformed signal metadata: ${f}`); }
}
for (const folder of ['digest', 'inbox']) {
  const files = (await readdir(join(DATA, folder))).filter((f) => f.endsWith('.json')).sort().reverse().slice(0, 7);
  for (const f of files) for (const item of await readJSON(join(DATA, folder, f), [])) add(item.url, item.sourceName ?? item.sources?.[0], item.thumbnail);
}

let requests = 0, found = 0;
for (const [url, target] of targets) {
  const existing = cache[url];
  const supplied = sourceThumbnail(target.thumbnail, url);
  if (supplied) { cache[url] = { checkedAt: date, thumbnail: supplied }; continue; }
  const age = (Date.parse(date) - Date.parse(existing?.checkedAt ?? '')) / 86400000;
  if (Number.isFinite(age) && age >= 0 && age < (existing.thumbnail ? 30 : 7)) continue;
  let thumbnail = youtubeThumbnail(url, target.publisher);
  if (!thumbnail && origins.has(new URL(url).origin)) {
    if (requests >= 25) continue;
    requests++;
    thumbnail = await fetchPageThumbnail(url, target.publisher, origins);
  }
  cache[url] = { checkedAt: date, ...(thumbnail ? { thumbnail } : {}) };
  if (thumbnail) found++;
}
for (const url of Object.keys(cache)) if (!publicHttpsUrl(url) || blocked.has(new URL(url).origin)) delete cache[url];
const retained = Object.fromEntries(Object.entries(cache).sort((a, b) => b[1].checkedAt.localeCompare(a[1].checkedAt)).slice(0, 1000));
await writeJSON(join(DATA, 'media.json'), retained);
console.log(`Media: ${requests} page requests, ${found} previews found; unavailable previews use source cards.`);
