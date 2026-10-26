import { getCollection, type CollectionEntry } from 'astro:content';
import { tracks } from '@/data/tracks';

export type ModuleEntry = CollectionEntry<'modules'>;

const trackIndex = Object.fromEntries(tracks.map((t, i) => [t.id, i]));

export async function getModules(): Promise<ModuleEntry[]> {
  const all = await getCollection('modules');
  return all.sort((a, b) => trackIndex[a.data.track] - trackIndex[b.data.track] || a.data.order - b.data.order);
}

export function moduleSummary(m: ModuleEntry) {
  return {
    id: m.id,
    title: m.data.title,
    track: m.data.track,
    order: m.data.order,
    summary: m.data.summary,
    minutes: m.data.minutes,
    level: m.data.level,
    prerequisites: m.data.prerequisites,
  };
}

export type ModuleSummary = ReturnType<typeof moduleSummary>;

export async function getSignals() {
  const all = await getCollection('signals');
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
