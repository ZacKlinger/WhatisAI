// Shared utilities for the daily watcher. No paid APIs are ever called from
// this code: only public, unauthenticated HTTP GET requests.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { feedThumbnail } from './media.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DATA = join(ROOT, 'data', 'watch');

/**
 * Zero-spend guard. The watcher must never be able to bill anyone. If a paid
 * API credential is present in the environment, refuse to run at all rather
 * than risk a code path (ours or a dependency's) picking it up.
 */
export function assertNoSpend() {
  const forbidden = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEY', 'AWS_ACCESS_KEY_ID', 'AZURE_OPENAI_API_KEY'];
  const found = forbidden.filter((k) => process.env[k]);
  if (found.length) {
    console.error(`Refusing to run: paid API credential(s) present in environment: ${found.join(', ')}.`);
    console.error('The watcher is designed to cost nothing. Remove these variables from the workflow.');
    process.exit(2);
  }
}

export const today = () => new Date().toISOString().slice(0, 10);
export const daysAgo = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};
export const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 16);

export async function readJSON(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}

export async function writeJSON(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2) + '\n');
}

const UA = 'WhatisAI-watcher/1.0 (+https://github.com/ZacKlinger/WhatisAI; educational, once daily)';

export async function get(url, { timeout = 20000, accept } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: accept ?? '*/*' }, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@', textNodeName: '#text', processEntities: true, htmlEntities: true });

const text = (v) => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return text(v[0]);
  if (typeof v === 'object') return text(v['#text'] ?? v['@href'] ?? '');
  return '';
};

export const stripHtml = (s) =>
  String(s ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;|&ndash;/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

/** Parse RSS 2.0, Atom, or RDF into a common shape. */
export function parseFeed(body, { publisher = '', previews = true } = {}) {
  const doc = xml.parse(body);
  const channel = doc.rss?.channel ?? doc['rdf:RDF'] ?? null;
  const atom = doc.feed ?? null;
  const raw = channel ? [].concat(channel.item ?? doc['rdf:RDF']?.item ?? []) : atom ? [].concat(atom.entry ?? []) : [];
  return raw.map((it) => {
    let link = text(it.link);
    if (Array.isArray(it.link)) {
      const alt = it.link.find((l) => (l['@rel'] ?? 'alternate') === 'alternate') ?? it.link[0];
      link = alt?.['@href'] ?? text(alt);
    } else if (it.link && typeof it.link === 'object' && it.link['@href']) link = it.link['@href'];
    const url = link || text(it.guid) || text(it.id);
    const thumbnail = previews ? feedThumbnail(it, url, publisher) : null;
    return {
      title: stripHtml(text(it.title)),
      url,
      ...(thumbnail ? { thumbnail } : {}),
      published: text(it.pubDate) || text(it.published) || text(it.updated) || text(it['dc:date']) || '',
      summary: stripHtml(text(it.description) || text(it.summary) || text(it['content:encoded']) || text(it.content)).slice(0, 600),
    };
  });
}

/** Extract article links matching a path pattern from an HTML listing page. */
export function parseLinks(body, baseUrl, pattern) {
  const re = new RegExp(`<a[^>]+href=["'](${pattern})["'][^>]*>([\\s\\S]*?)</a>`, 'gi');
  const out = new Map();
  let m;
  while ((m = re.exec(body))) {
    const href = new URL(m[1], baseUrl).toString().split('#')[0];
    const title = stripHtml(m[2]);
    if (title.length < 12 || title.length > 220) continue;
    const prev = out.get(href);
    if (!prev || title.length > prev.title.length) out.set(href, { title, url: href, published: '', summary: '' });
  }
  return [...out.values()];
}

const STOP = new Set(
  'a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with you your yours yourself yourselves new says said via using use used how why what into across amid among within without per vs versus also may might one two three first last next year years week weeks today latest update updates report reports new now get gets got make makes made way ways things thing show shows shown study'.split(' '),
);

export function tokens(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\-\s.]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^[.\-]+|[.\-]+$/g, ''))
    .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w));
}

export function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter || 1);
}

export const AI_RE = /\b(ai|a\.i\.|artificial intelligence|machine learning|language model|llms?|neural|chatgpt|openai|anthropic|claude|gemini|deepmind|gpt-?\d|frontier model|generative|algorithm(ic)?|automation|chatbot|deep learning|transformer|agents?|copilot|nvidia|data cent(er|re)s?)\b/i;
