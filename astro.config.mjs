// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

// GitHub Pages serves this repo at /WhatisAI. Set SITE_BASE="/" when moving
// to a custom domain.
const base = process.env.SITE_BASE ?? '/WhatisAI';
const site = process.env.SITE_URL ?? 'https://zacklinger.github.io';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [react(), mdx()],
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
