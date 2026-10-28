import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { normalizeThumbnail } from './lib/media.mjs';

const thumbnail = z.object({
  url: z.string(), sourceUrl: z.string(), credit: z.string(),
  alt: z.string().default(''),
  provenance: z.enum(['feed', 'opengraph', 'youtube', 'editor']),
  licenseUrl: z.string().optional(),
}).refine((value) => normalizeThumbnail(value) !== null, 'Thumbnail requires public HTTPS URLs and attribution');

const source = z.object({
  title: z.string(),
  org: z.string(),
  year: z.number().int(),
  url: z.string().url(),
  authors: z.string().optional(),
  note: z.string().optional(),
});

const modules = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/modules' }),
  schema: z.object({
    title: z.string(),
    track: z.enum(['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9']),
    order: z.number().int(),
    summary: z.string(),
    minutes: z.number().int(),
    level: z.number().int().min(1).max(5),
    prerequisites: z.array(z.string()).default([]),
    objectives: z.array(z.string()).min(2),
    keyTerms: z.array(z.object({ term: z.string(), def: z.string() })).default([]),
    sources: z.array(source).default([]),
    updated: z.coerce.date(),
  }),
});

const signals = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/signals' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    kind: z.enum(['research', 'model', 'policy', 'economy', 'safety', 'media', 'trend']),
    significance: z.number().int().min(1).max(5),
    summary: z.string(),
    sources: z.array(z.object({ title: z.string(), url: z.string().url(), publisher: z.string() })).min(1),
    modules: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    method: z.enum(['claude', 'heuristic', 'editor']).default('editor'),
    thumbnail: thumbnail.optional(),
  }),
});

export const collections = { modules, signals };
