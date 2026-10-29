// The curriculum graph as JSON (used by the watcher's editor and by external
// tools), and a build-time integrity check: a broken reference fails the build.
import { getModules, getSignals } from '@/lib/curriculum';
import { corpus } from '@/data/corpus';
import { items } from '@/data/items';
import { tracks } from '@/data/tracks';
import { goalTypes } from '@/lib/goals.mjs';
import { figures, hotspotFigures } from '@/components/figures/registry';

export async function GET() {
  const modules = await getModules();
  const ids = new Set(modules.map((m) => m.id));
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const goal of goalTypes) {
    for (const id of goal.modules ?? []) if (!ids.has(id)) errors.push(`goal ${goal.id}: unknown module "${id}"`);
  }

  for (const m of modules) {
    for (const p of m.data.prerequisites) if (!ids.has(p)) errors.push(`${m.id}: unknown prerequisite "${p}"`);
    const its = items[m.id] ?? [];
    if (its.length < 3) warnings.push(`${m.id}: only ${its.length} mastery items`);
  }
  for (const key of Object.keys(items)) if (!ids.has(key)) errors.push(`items: bank for unknown module "${key}"`);
  for (const d of corpus) {
    for (const r of d.requires) if (!ids.has(r)) errors.push(`corpus ${d.id}: unknown module "${r}"`);
    if (d.guided && !ids.has(d.guided)) errors.push(`corpus ${d.id}: unknown guided module "${d.guided}"`);
  }
  for (const s of await getSignals()) for (const m of s.data.modules) if (!ids.has(m)) errors.push(`signal ${s.id}: unknown module "${m}"`);

  for (const [mod, list] of Object.entries(items)) {
    const seen = new Set<string>();
    for (const it of list) {
      const where = `${mod}/${it.id}`;
      if (seen.has(it.id)) errors.push(`${where}: duplicate item id`);
      seen.add(it.id);
      if (it.figure && !figures[it.figure.id]) errors.push(`${where}: unknown figure "${it.figure.id}"`);
      switch (it.kind) {
        case 'mc': if (it.answer < 0 || it.answer >= it.choices.length) errors.push(`${where}: answer out of range`); break;
        case 'multi': if (!it.answers.length || it.answers.some((a) => a < 0 || a >= it.choices.length)) errors.push(`${where}: answers out of range`); break;
        case 'match': if (it.pairs.length < 2) errors.push(`${where}: needs at least 2 pairs`); break;
        case 'order': if (it.items.length < 3) errors.push(`${where}: needs at least 3 items`); break;
        case 'estimate': if (it.answer < it.min || it.answer > it.max) errors.push(`${where}: answer outside slider range`); break;
        case 'hotspot': if (!hotspotFigures.has(it.figure.id)) errors.push(`${where}: figure "${it.figure.id}" has no clickable regions`); break;
      }
    }
  }

  if (warnings.length) console.warn(`[curriculum] ${warnings.length} warning(s):\n  ${warnings.join('\n  ')}`);
  if (errors.length) {
    const msg = `[curriculum] integrity check failed:\n  ${errors.join('\n  ')}`;
    // CURRICULUM_LENIENT=1 lets work-in-progress content build locally; CI is always strict.
    if (process.env.CURRICULUM_LENIENT === '1') console.warn(msg);
    else throw new Error(msg);
  }

  const body = {
    generated: new Date().toISOString(),
    tracks: tracks.map((t) => ({ id: t.id, title: t.title, modules: modules.filter((m) => m.data.track === t.id).map((m) => m.id) })),
    modules: modules.map((m) => ({ id: m.id, title: m.data.title, track: m.data.track, summary: m.data.summary, prerequisites: m.data.prerequisites, keyTerms: m.data.keyTerms.map((k) => k.term) })),
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json' } });
}
