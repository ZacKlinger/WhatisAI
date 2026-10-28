#!/usr/bin/env node
// Fallback publisher used only when Claude is not configured. It publishes a
// story only at a very high significance bar, and writes an extractive signal
// (titles, source excerpts, links) rather than prose it cannot verify.
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA, ROOT, assertNoSpend, readJSON, today } from './lib.mjs';
import { mediaFrontmatter } from './media.mjs';

assertNoSpend();

const BAR = Number(process.env.HEURISTIC_BAR ?? 0.8);
const { candidates = [] } = await readJSON(join(DATA, 'candidates.json'), {});
const { terms } = await readJSON(join(ROOT, 'scripts/watch/watchlist.json'), { terms: [] });

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const yaml = (s) => JSON.stringify(String(s));

function kindOf(c) {
  const blob = c.items.map((i) => i.title).join(' ');
  if (c.categories.includes('policy')) return 'policy';
  if (/safety|alignment|misuse|jailbreak|interpretab/i.test(blob)) return 'safety';
  if (c.categories.includes('economy') || /jobs|labor|employment|productivity/i.test(blob)) return 'economy';
  if (/\b(gpt|claude|gemini|llama|grok|o\d)[- ]?\d|introducing|launch|release/i.test(blob)) return 'model';
  if (c.format === 'podcast' || c.format === 'video') return 'media';
  return 'research';
}

const date = today();
let n = 0;
for (const c of candidates.filter((x) => x.score >= BAR).slice(0, 2)) {
  const blob = c.items.map((i) => `${i.title} ${i.summary}`).join(' ');
  const modules = [...new Set(terms.filter((t) => new RegExp(t.re, 'i').test(blob)).flatMap((t) => t.modules))].slice(0, 4);
  const lead = c.items[0];
  const excerpt = (c.items.find((i) => i.summary)?.summary ?? '').slice(0, 280);
  const summary = excerpt || `Reported by ${[...new Set(c.items.map((i) => i.source))].join(', ')}.`;
  const sig = Math.min(5, Math.max(3, Math.round(c.score * 5)));
  const md = `---
title: ${yaml(lead.title)}
date: ${date}
kind: ${kindOf(c)}
significance: ${sig}
summary: ${yaml(summary)}
${mediaFrontmatter(lead.thumbnail)}sources:
${c.items.slice(0, 5).map((i) => `  - title: ${yaml(i.title)}\n    url: ${i.url}\n    publisher: ${yaml(i.source)}`).join('\n')}
modules: [${modules.join(', ')}]
tags: []
method: heuristic
---

This story was detected automatically: ${c.items.length} report${c.items.length > 1 ? 's' : ''} across ${new Set(c.items.map((i) => i.source)).size} source${new Set(c.items.map((i) => i.source)).size > 1 ? 's' : ''} in the last three days, with a significance score of ${c.score.toFixed(2)}. No summary has been written; read the sources below directly${modules.length ? ', and use the linked modules for background' : ''}.

${c.items.slice(0, 5).map((i) => `- **${i.source}:** [${i.title.replace(/[[\]]/g, '')}](${i.url})${i.summary ? `. ${i.summary.slice(0, 220)}` : ''}`).join('\n')}
`;
  await writeFile(join(ROOT, 'src/content/signals', `${date}-${slug(lead.title)}.md`), md);
  n++;
}
console.log(`Heuristic publisher wrote ${n} signal(s) (bar ${BAR}).`);
