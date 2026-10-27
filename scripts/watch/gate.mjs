#!/usr/bin/env node
// Significance gate. Clusters the last three days of new items into stories,
// scores each story, writes a digest for the trend radar, and writes the
// candidates (if any) that might deserve a published signal.
// Exit code is always 0; the decision is reported via GITHUB_OUTPUT.
import { appendFile, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA, ROOT, assertNoSpend, daysAgo, jaccard, readJSON, today, tokens, writeJSON } from './lib.mjs';

assertNoSpend();

const THRESHOLD = Number(process.env.WATCH_THRESHOLD ?? 0.58);
const date = today();

// Load the inbox for today and the two previous days (stories often build over days).
const inbox = [];
for (let i = 0; i < 3; i++) inbox.push(...(await readJSON(join(DATA, 'inbox', `${daysAgo(i)}.json`), [])));

// URLs already covered by a published signal are never re-proposed.
const published = new Set();
const sigDir = join(ROOT, 'src/content/signals');
for (const f of await readdir(sigDir).catch(() => [])) {
  const body = await readFile(join(sigDir, f), 'utf8');
  for (const m of body.matchAll(/url:\s*(\S+)/g)) published.add(m[1]);
}
const rejected = new Set(Object.keys(await readJSON(join(DATA, 'rejected.json'), {})));

const STRONG = /system card|model card|\bintroducing\b|responsible scaling|preparedness framework|frontier safety|executive order|signed into law|final rule|\bregulation \(eu\)|\bai act\b|code of practice|export control|safety institute|international ai safety report|economic index|open[- ]weights?|state of the art|breakthrough|\b(gpt|claude|gemini|llama|grok|o\d)[- ]?\d/i;
const MEDIUM = /launch|release|announc|report|framework|policy|study|paper|evaluat|interpretab|alignment|agent|reasoning|jobs|employment|layoff|labor|data cent|chips?\b|lawsuit|ban|bill\b|senate|commission/i;

const items = inbox.filter((it) => !published.has(it.url));
const toks = items.map((it) => tokens(it.title));

// Greedy single-link clustering on title similarity.
const clusters = [];
items.forEach((it, i) => {
  let best = null;
  let bestSim = 0;
  for (const c of clusters) {
    const sim = Math.max(...c.members.map((j) => jaccard(toks[i], toks[j])));
    if (sim > bestSim) { bestSim = sim; best = c; }
  }
  if (best && bestSim >= 0.34) best.members.push(i);
  else clusters.push({ members: [i] });
});

const scored = clusters.map((c) => {
  const ms = c.members.map((i) => items[i]);
  const lead = ms.slice().sort((a, b) => b.weight - a.weight)[0];
  const sourcesN = new Set(ms.map((m) => m.source)).size;
  const authority = Math.max(...ms.map((m) => m.weight));
  const corroboration = sourcesN >= 4 ? 1 : sourcesN === 3 ? 0.7 : sourcesN === 2 ? 0.4 : 0;
  const blob = ms.map((m) => `${m.title} ${m.summary}`).join(' ');
  const impact = STRONG.test(blob) ? 1 : MEDIUM.test(blob) ? 0.5 : 0.15;
  const points = Math.max(0, ...ms.map((m) => m.engagement?.points ?? 0));
  const upvotes = Math.max(0, ...ms.map((m) => m.engagement?.upvotes ?? 0));
  const engagement = Math.min(1, Math.max(points / 600, upvotes / 80));
  const primary = ms.some((m) => (m.category === 'lab' || m.category === 'policy') && m.weight >= 0.85);
  let score = 0.35 * authority + 0.3 * corroboration + 0.25 * impact + 0.1 * engagement;
  if (primary && impact === 1) score = Math.max(score, 0.62);
  return {
    id: lead.id,
    title: lead.title,
    url: lead.url,
    score: Number(score.toFixed(3)),
    parts: { authority, corroboration, impact, engagement: Number(engagement.toFixed(2)) },
    categories: [...new Set(ms.map((m) => m.category))],
    format: lead.format,
    thumbnail: lead.thumbnail,
    items: ms.map((m) => ({ title: m.title, url: m.url, source: m.sourceName, category: m.category, published: m.published, summary: m.summary, engagement: m.engagement, docType: m.docType, thumbnail: m.thumbnail })),
  };
}).sort((a, b) => b.score - a.score);

// Digest of the day's most notable stories, used by the trend radar's "On the radar" list.
await writeJSON(join(DATA, 'digest', `${date}.json`), scored.slice(0, 25).map(({ items: its, ...rest }) => ({ ...rest, sources: [...new Set(its.map((i) => i.source))] })));

const candidates = scored.filter((c) => c.score >= THRESHOLD && !c.items.some((i) => rejected.has(i.url))).slice(0, 6);
await writeJSON(join(DATA, 'candidates.json'), { date, threshold: THRESHOLD, candidates });

console.log(`${items.length} items → ${clusters.length} stories; ${candidates.length} above threshold ${THRESHOLD}.`);
for (const c of candidates) console.log(`  ${c.score.toFixed(2)}  ${c.title}  [${c.items.length} item(s)]`);

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `has_candidates=${candidates.length > 0}\ntop_score=${scored[0]?.score ?? 0}\n`);
}
