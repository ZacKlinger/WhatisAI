#!/usr/bin/env node
// Daily scrape: read every source, keep what is new, and update trend counts.
// Writes data/watch/{seen.json, inbox/DATE.json, terms.json, trends.json, health.json}.
import { join } from 'node:path';
import { AI_RE, DATA, ROOT, assertNoSpend, daysAgo, get, hash, parseFeed, parseLinks, readJSON, stripHtml, today, writeJSON } from './lib.mjs';

assertNoSpend();

const { sources } = await readJSON(join(ROOT, 'scripts/watch/sources.json'), { sources: [] });
const { terms: watchlist } = await readJSON(join(ROOT, 'scripts/watch/watchlist.json'), { terms: [] });
const seen = await readJSON(join(DATA, 'seen.json'), {});
const termDays = await readJSON(join(DATA, 'terms.json'), {});
const date = today();

async function fetchSource(src) {
  const body = await get(src.url, { accept: src.type === 'rss' ? 'application/rss+xml, application/atom+xml, application/xml, text/xml' : undefined });
  let items = [];
  if (src.type === 'rss') items = parseFeed(body);
  else if (src.type === 'html') items = parseLinks(body, src.url, src.pattern);
  else if (src.type === 'hf-daily') {
    items = JSON.parse(body).map((p) => ({
      title: p.title ?? p.paper?.title,
      url: `https://huggingface.co/papers/${p.paper?.id ?? p.id}`,
      published: p.publishedAt ?? p.paper?.publishedAt ?? '',
      summary: stripHtml(p.paper?.summary ?? p.summary ?? '').slice(0, 600),
      engagement: { upvotes: p.paper?.upvotes ?? p.upvotes ?? 0 },
    }));
  } else if (src.type === 'hn') {
    items = JSON.parse(body).hits.map((h) => ({
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      discussion: `https://news.ycombinator.com/item?id=${h.objectID}`,
      published: h.created_at,
      summary: '',
      engagement: { points: h.points ?? 0, comments: h.num_comments ?? 0 },
    }));
  } else if (src.type === 'fedreg') {
    items = JSON.parse(body).results.map((r) => ({
      title: r.title,
      url: r.html_url,
      published: r.publication_date,
      summary: stripHtml(r.abstract ?? '').slice(0, 600),
      docType: r.type,
      agencies: (r.agencies ?? []).map((a) => a.name).filter(Boolean),
    }));
  }
  return items
    .filter((it) => it.title && it.url)
    .filter((it) => !src.filter || AI_RE.test(`${it.title} ${it.summary}`))
    .map((it) => ({
      ...it,
      id: hash(it.url),
      source: src.id,
      sourceName: src.name,
      category: src.category,
      weight: src.weight,
      format: src.format ?? 'article',
      trendOnly: !!src.trendOnly,
    }));
}

const health = {};
const results = await Promise.allSettled(sources.map(fetchSource));
const all = [];
results.forEach((r, i) => {
  const src = sources[i];
  if (r.status === 'fulfilled') {
    health[src.id] = { ok: true, count: r.value.length };
    all.push(...r.value);
  } else {
    health[src.id] = { ok: false, error: String(r.reason?.message ?? r.reason).slice(0, 160) };
    console.warn(`[skip] ${src.name}: ${health[src.id].error}`);
  }
});

// Keep only items not seen before. On a source's very first run, mark its
// backlog as seen without treating it as news.
const knownSources = new Set(Object.values(seen).map((s) => s.source));
const fresh = [];
for (const it of all) {
  if (seen[it.id]) continue;
  seen[it.id] = { first: date, source: it.source };
  if (knownSources.has(it.source) || it.source === 'hf-papers' || it.source === 'hn') fresh.push(it);
}

// Forget items older than 120 days so the file stays small.
const cutoff = daysAgo(120);
for (const [k, v] of Object.entries(seen)) if (v.first < cutoff) delete seen[k];

// Trend counts for today, over everything fetched today that is new.
const counts = {};
for (const it of fresh) {
  const textBlob = `${it.title} ${it.summary}`;
  for (const w of watchlist) {
    if (new RegExp(w.re, 'i').test(textBlob)) counts[w.term] = (counts[w.term] ?? 0) + 1;
  }
}
termDays[date] = { ...(termDays[date] ?? {}), ...counts, __items: (termDays[date]?.__items ?? 0) + fresh.length };
for (const d of Object.keys(termDays)) if (d < daysAgo(90)) delete termDays[d];

// Trends: compare the last 7 days with the 28 before them, normalized by volume.
const days = Array.from({ length: 35 }, (_, i) => daysAgo(34 - i));
const vol = (d) => termDays[d]?.__items ?? 0;
const recentDays = days.slice(-7);
const baseDays = days.slice(0, 28);
const recentVol = recentDays.reduce((s, d) => s + vol(d), 0);
const baseVol = baseDays.reduce((s, d) => s + vol(d), 0);
const series = watchlist.map((w) => {
  const s = days.map((d) => termDays[d]?.[w.term] ?? 0);
  const recent = s.slice(-7).reduce((a, b) => a + b, 0);
  const base = s.slice(0, 28).reduce((a, b) => a + b, 0);
  const recentRate = recent / Math.max(1, recentVol);
  const baseRate = base / Math.max(1, baseVol);
  const lift = (recentRate + 0.002) / (baseRate + 0.002);
  return { term: w.term, modules: w.modules, recent, base, share: recentRate, lift: Number(lift.toFixed(2)), series: s.slice(-28) };
});
const trends = {
  updated: date,
  windowDays: 7,
  baselineDays: 28,
  daysOfHistory: Object.keys(termDays).length,
  itemsLastWeek: recentVol,
  rising: series.filter((s) => s.recent >= 3 && s.lift >= 1.4).sort((a, b) => b.lift - a.lift).slice(0, 10),
  volume: series.filter((s) => s.recent > 0).sort((a, b) => b.recent - a.recent).slice(0, 14),
  sources: Object.entries(health).map(([id, h]) => ({ id, name: sources.find((s) => s.id === id)?.name, ok: h.ok, count: h.count ?? 0 })),
};

await writeJSON(join(DATA, 'seen.json'), seen);
await writeJSON(join(DATA, 'terms.json'), termDays);
await writeJSON(join(DATA, 'inbox', `${date}.json`), fresh.filter((it) => !it.trendOnly));
await writeJSON(join(DATA, 'trends.json'), trends);
await writeJSON(join(DATA, 'health.json'), { date, sources: health });

const ok = Object.values(health).filter((h) => h.ok).length;
console.log(`Scraped ${all.length} items from ${ok}/${sources.length} sources; ${fresh.length} new (${fresh.filter((i) => !i.trendOnly).length} candidates for significance).`);
