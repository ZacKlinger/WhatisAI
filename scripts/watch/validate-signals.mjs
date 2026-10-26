#!/usr/bin/env node
// Validate signal files written today. Invalid files are removed (and the
// story is recorded as rejected) so a malformed signal can never break the
// site build or publish something unlinked.
import { readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA, ROOT, assertNoSpend, readJSON, today, writeJSON } from './lib.mjs';

assertNoSpend();

const dir = join(ROOT, 'src/content/signals');
const modDir = join(ROOT, 'src/content/modules');
const moduleIds = new Set((await readdir(modDir)).filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, '')));
const KINDS = new Set(['research', 'model', 'policy', 'economy', 'safety', 'media', 'trend']);
const onlyNew = process.argv.includes('--new');
const date = today();
const rejected = await readJSON(join(DATA, 'rejected.json'), {});

let bad = 0;
let good = 0;
for (const f of (await readdir(dir)).filter((x) => x.endsWith('.md'))) {
  if (onlyNew && !f.startsWith(date)) continue;
  const body = await readFile(join(dir, f), 'utf8');
  const fm = body.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const errs = [];
  if (!fm) errs.push('missing frontmatter');
  else {
    const y = fm[1];
    const get = (k) => y.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1]?.trim();
    if (!get('title')) errs.push('title');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(get('date') ?? '')) errs.push('date');
    if (!KINDS.has(get('kind') ?? '')) errs.push('kind');
    const s = Number(get('significance'));
    if (!(s >= 1 && s <= 5)) errs.push('significance');
    if (!get('summary')) errs.push('summary');
    if (!/sources:\s*\n\s+- title:/.test(y) || !/url:\s*https?:\/\//.test(y)) errs.push('sources');
    const mods = (get('modules') ?? '[]').replace(/[[\]]/g, '').split(',').map((x) => x.trim()).filter(Boolean);
    const unknown = mods.filter((m) => !moduleIds.has(m));
    if (unknown.length) errs.push(`unknown modules: ${unknown.join(', ')}`);
    if (fm[2].trim().length < 120) errs.push('body too short');
  }
  if (errs.length) {
    bad++;
    console.error(`[invalid] ${f}: ${errs.join('; ')}`);
    if (onlyNew) {
      await rm(join(dir, f));
      // Key by the lead source URL so the gate never re-proposes this story.
      const lead = body.match(/url:\s*(https?:\/\/\S+)/)?.[1] ?? f;
      rejected[lead] = { date, file: f, errs };
    }
  } else good++;
}
await writeJSON(join(DATA, 'rejected.json'), rejected);
console.log(`${good} valid signal(s), ${bad} invalid.`);
if (bad && !onlyNew) process.exit(1);
