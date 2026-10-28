import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, mkdir, readFile, writeFile, readdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';
import { parseFeed } from '../scripts/watch/lib.mjs';

test('publisher preview survives feed → inbox → gate → digest/candidate → signal → cache, including reruns', async () => {
  const root = await mkdtemp(join(tmpdir(), 'whatisai-pipeline-'));
  try {
    await cp(resolve('scripts/watch'), join(root, 'scripts/watch'), { recursive: true });
    await cp(resolve('src/lib'), join(root, 'src/lib'), { recursive: true });
    await symlink(resolve('node_modules'), join(root, 'node_modules'), 'dir');
    for (const folder of ['data/watch/inbox', 'data/watch/digest', 'src/content/signals', 'src/content/modules']) await mkdir(join(root, folder), { recursive: true });
    const date = new Date().toISOString().slice(0, 10);
    const write = (p, data) => writeFile(join(root, p), JSON.stringify(data));
    await write('scripts/watch/sources.json', { sources: [{ id: 'fixture', name: 'Fixture Lab', url: 'https://publisher.example.org/feed', preview: true }] });
    await write('scripts/watch/watchlist.json', { terms: [] });
    const [item] = parseFeed('<rss><channel><item><title>Introducing an AI system card</title><link>https://publisher.example.org/paper</link><description>A primary source with an image preview.</description><media:thumbnail url="https://publisher.example.org/cover.jpg"/></item></channel></rss>', { publisher: 'Fixture Lab' });
    const inbox = [{ ...item, id: 'fixture', source: 'fixture', sourceName: 'Fixture Lab', category: 'lab', weight: 1, format: 'article' }];
    await write(`data/watch/inbox/${date}.json`, inbox);
    const run = (name, args = []) => execFileSync(process.execPath, [join(root, `scripts/watch/${name}.mjs`), ...args], { cwd: root, env: { ...process.env, HEURISTIC_BAR: '0.5' }, encoding: 'utf8' });
    run('gate');
    const digest = JSON.parse(await readFile(join(root, `data/watch/digest/${date}.json`), 'utf8'));
    const candidates = JSON.parse(await readFile(join(root, 'data/watch/candidates.json'), 'utf8'));
    assert.deepEqual(digest[0].thumbnail, item.thumbnail);
    assert.deepEqual(candidates.candidates[0].items[0].thumbnail, item.thumbnail);
    run('publish-heuristic');
    const signals = await readdir(join(root, 'src/content/signals'));
    assert.equal(signals.length, 1);
    const signal = await readFile(join(root, 'src/content/signals', signals[0]), 'utf8');
    assert.deepEqual(parse(signal.split('---')[1]).thumbnail, item.thumbnail);
    run('validate-signals');
    const enrichment = run('enrich-media');
    assert.match(enrichment, /0 page requests/);
    const cachePath = join(root, 'data/watch/media.json');
    const firstCache = await readFile(cachePath, 'utf8');
    assert.deepEqual(JSON.parse(firstCache)[item.url].thumbnail, item.thumbnail);
    run('enrich-media');
    assert.equal(await readFile(cachePath, 'utf8'), firstCache);
    run('gate');
    assert.equal(JSON.parse(await readFile(join(root, 'data/watch/candidates.json'), 'utf8')).candidates.length, 0);
    // Opt-out purges stored previews without any external request.
    await write('scripts/watch/sources.json', { sources: [{ id: 'fixture', name: 'Fixture Lab', url: 'https://publisher.example.org/feed', preview: false }] });
    assert.match(run('enrich-media'), /0 page requests/);
    assert.deepEqual(JSON.parse(await readFile(cachePath, 'utf8')), {});
  } finally { await rm(root, { recursive: true, force: true }); }
});
