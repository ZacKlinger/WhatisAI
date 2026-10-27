import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFeed } from '../scripts/watch/lib.mjs';
import { fetchPageThumbnail, mediaFrontmatter, openGraphThumbnail, youtubeThumbnail } from '../scripts/watch/media.mjs';
import { normalizeThumbnail, publicHttpsUrl, sourceThumbnail } from '../src/lib/media.mjs';

const article = 'https://publisher.example.org/articles/ai';
const image = 'https://publisher.example.org/images/ai.jpg';
const preview = { url: image, sourceUrl: article, credit: 'Publisher', alt: '', provenance: 'feed' };

test('RSS thumbnails retain source, creator, relative image, and explicit license', () => {
  const [item] = parseFeed(`<rss><channel><item><title>AI</title><link>${article}</link><media:thumbnail url="/images/ai.jpg"/><media:credit>Artist &amp; Studio</media:credit><media:license href="https://creativecommons.org/licenses/by/4.0/"/></item></channel></rss>`, { publisher: 'Publisher' });
  assert.deepEqual(item.thumbnail, { ...preview, credit: 'Artist & Studio', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' });
});

test('Atom media groups, image enclosures, and podcast artwork are supported', () => {
  const [atom] = parseFeed(`<feed><entry><title>AI</title><link rel="self" href="https://publisher.example.org/feed"/><link rel="alternate" href="${article}"/><author><name>Creator</name></author><media:group><media:thumbnail url="${image}"/></media:group></entry></feed>`, { publisher: 'Publisher' });
  assert.equal(atom.thumbnail.credit, 'Creator');
  assert.equal(atom.thumbnail.sourceUrl, article);
  for (const tag of [`<enclosure url="${image}" type="image/jpeg"/>`, `<itunes:image href="${image}"/>`]) {
    assert.equal(parseFeed(`<rss><channel><item><title>AI</title><link>${article}</link>${tag}</item></channel></rss>`, { publisher: 'Publisher' })[0].thumbnail.url, image);
  }
});

test('missing, unsafe, opted-out, and non-image feed media stay absent', () => {
  for (const tag of ['', '<media:thumbnail url="javascript:alert(1)"/>', '<enclosure url="https://publisher.example.org/audio.mp3" type="audio/mpeg"/>']) {
    assert.equal(parseFeed(`<rss><channel><item><title>AI</title><link>${article}</link>${tag}</item></channel></rss>`, { publisher: 'Publisher' })[0].thumbnail, undefined);
  }
  assert.equal(parseFeed(`<rss><channel><item><link>${article}</link><media:thumbnail url="${image}"/></item></channel></rss>`, { publisher: 'Publisher', previews: false })[0].thumbnail, undefined);
});

test('only genuine YouTube video URLs generate provider previews', () => {
  assert.equal(youtubeThumbnail('https://www.youtube.com/watch?v=abcdefghijk', 'Creator').url, 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg');
  assert.equal(youtubeThumbnail('https://youtu.be/abcdefghijk', 'Creator').credit, 'Creator');
  for (const url of ['https://youtube.com.evil.org/watch?v=abcdefghijk', 'https://youtube.com/watch?v=bad', 'https://youtu.be/abcdefghijk/extra']) assert.equal(youtubeThumbnail(url, 'Creator'), null);
});

test('public HTTPS validation rejects executable, credentialed, local, and IP URLs', () => {
  for (const url of ['javascript:alert(1)', 'data:image/png;base64,abc', 'http://example.org/a', 'https://user:pass@example.org/a', 'https://example.org:8443/a', 'https://localhost/a', 'https://localhost./a', 'https://127.1/a', 'https://[::1]/a', 'https://metadata.google.internal/a']) assert.equal(publicHttpsUrl(url), null, url);
  assert.equal(normalizeThumbnail({ ...preview, credit: '' }), null);
  assert.equal(normalizeThumbnail({ ...preview, provenance: 'invented' }), null);
});

test('Open Graph respects publisher metadata, entities, alt text, and relative paths', () => {
  const result = openGraphThumbnail(`<head><meta content='../images/ai.jpg?a=1&amp;b=2' property='og:image'><meta name="og:image:alt" content="AI &quot;diagram&quot;"></head>`, article, 'Publisher');
  assert.equal(result.url, image + '?a=1&b=2');
  assert.equal(result.alt, 'AI "diagram"');
  assert.equal(result.provenance, 'opengraph');
  assert.equal(result.licenseUrl, undefined);
  assert.equal(openGraphThumbnail('<head></head><img src="https://example.org/a.jpg">', article, 'Publisher'), null);
  assert.equal(openGraphThumbnail('<head><!-- <meta property="og:image" content="https://example.org/a.jpg"> --></head>', article, 'Publisher'), null);
});

test('source association and serialized publication preserve valid metadata only', () => {
  assert.deepEqual(sourceThumbnail(preview, article), preview);
  assert.equal(sourceThumbnail(preview, 'https://publisher.example.org/other'), null);
  assert.deepEqual(sourceThumbnail({ ...preview, sourceUrl: 'https://publisher.example.org/other' }, article, { [article]: { thumbnail: preview } }), preview);
  assert.deepEqual(JSON.parse(mediaFrontmatter(preview).slice('thumbnail: '.length)), preview);
  assert.equal(mediaFrontmatter({ ...preview, url: 'file:///etc/passwd' }), '');
});

test('bounded fetch accepts designated HTML previews and resolves same-origin redirects', async () => {
  const calls = [];
  const result = await fetchPageThumbnail(article, 'Publisher', new Set(['https://publisher.example.org']), async (url) => {
    calls.push(url);
    return calls.length === 1 ? new Response(null, { status: 302, headers: { location: '/new/page' } }) : new Response('<head><meta property="og:image" content="./cover.jpg"></head>', { headers: { 'content-type': 'text/html' } });
  });
  assert.equal(result.url, 'https://publisher.example.org/new/cover.jpg');
  assert.equal(result.sourceUrl, article);
  assert.equal(calls.length, 2);
});

test('fetch rejects unapproved origins and redirect destinations before requesting them', async () => {
  let calls = 0;
  const fetcher = async () => { calls++; return new Response(null, { status: 302, headers: { location: 'https://127.0.0.1/private' } }); };
  assert.equal(await fetchPageThumbnail('https://other.example.org/a', 'Other', new Set(['https://publisher.example.org']), fetcher), null);
  assert.equal(calls, 0);
  assert.equal(await fetchPageThumbnail(article, 'Publisher', new Set(['https://publisher.example.org']), fetcher), null);
  assert.equal(calls, 1);
});

test('HTTP errors, non-HTML, oversized bodies, and network failures fall back without throwing', async () => {
  const failures = [
    () => new Response('no', { status: 404 }),
    () => new Response('not html', { headers: { 'content-type': 'application/pdf' } }),
    () => new Response('large', { headers: { 'content-type': 'text/html', 'content-length': '2000001' } }),
    () => new Response('x'.repeat(2_000_001), { headers: { 'content-type': 'text/html' } }),
    () => { throw new Error('network unavailable'); },
  ];
  for (const fetcher of failures) assert.equal(await fetchPageThumbnail(article, 'Publisher', new Set(['https://publisher.example.org']), fetcher), null);
});
