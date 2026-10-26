import type { APIContext } from 'astro';
import { getSignals } from '@/lib/curriculum';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function GET(ctx: APIContext) {
  const signals = await getSignals();
  const site = new URL(import.meta.env.BASE_URL, ctx.site).toString().replace(/\/$/, '');
  const items = signals.slice(0, 50).map((s) => `
    <item>
      <title>${esc(s.data.title)}</title>
      <link>${site}/signals/${s.id}/</link>
      <guid>${site}/signals/${s.id}/</guid>
      <pubDate>${s.data.date.toUTCString()}</pubDate>
      <category>${s.data.kind}</category>
      <description>${esc(s.data.summary)}</description>
    </item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>WhatisAI Signals</title>
    <link>${site}/signals/</link>
    <description>The developments in AI that actually matter.</description>${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
