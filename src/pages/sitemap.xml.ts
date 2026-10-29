import type { APIRoute } from 'astro';
import { getModules, getSignals } from '@/lib/curriculum';
import { url } from '@/lib/url';

export const GET: APIRoute = async ({ site }) => {
  const [modules, signals] = await Promise.all([getModules(), getSignals()]);
  const paths = ['/', '/explore/', '/path/', '/library/', '/glossary/', '/method/', '/signals/', '/trends/', '/privacy/',
    ...modules.map((m) => `/learn/${m.id}/`), ...signals.map((s) => `/signals/${s.id}/`)];
  const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${escape(new URL(url(path), site).href)}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
