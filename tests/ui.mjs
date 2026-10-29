// Runs against an isolated copy, with synthetic publisher assets and no external requests.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdtemp, cp, mkdir, readFile, writeFile, rm, symlink, access } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve, join, extname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
const root = await mkdtemp(join(tmpdir(), 'whatisai-ui-'));
const artifacts = process.env.UI_ARTIFACT_DIR ?? join(tmpdir(), 'whatisai-ui-artifacts');
await mkdir(artifacts, { recursive: true });
let browser, server;
try {
  for (const dir of ['src', 'scripts', 'data', 'public']) await cp(resolve(dir), join(root, dir), { recursive: true });
  for (const file of ['astro.config.mjs', 'tsconfig.json', 'package.json']) await writeFile(join(root, file), await readFile(resolve(file)));
  await symlink(resolve('node_modules'), join(root, 'node_modules'), 'dir');
  const source = 'https://publisher.example.org';
  const thumbnail = (url, sourceUrl) => ({ url, sourceUrl, credit: 'Fixture Creator', alt: 'Synthetic test preview', provenance: 'feed' });
  const fixtures = ['success', 'cached', 'broken', 'missing', 'unsafe', 'optout'];
  const cache = {};
  for (const name of fixtures) {
    const sourceUrl = `${name === 'optout' ? 'https://disabled.example.org' : source}/${name}`;
    const thumb = ['success', 'broken', 'optout'].includes(name) ? `thumbnail: ${JSON.stringify(thumbnail(`${source}/${name}.png`, sourceUrl))}\n` : '';
    await writeFile(join(root, `src/content/signals/2026-10-28-fixture-${name}.md`), `---\ntitle: Preview fixture ${name}\ndate: 2026-10-28\nkind: media\nsignificance: 3\nsummary: Synthetic publisher preview used only in an isolated regression build.\nsources:\n  - title: Fixture source\n    url: ${sourceUrl}\n    publisher: Fixture Publisher\nmodules: []\ntags: []\nmethod: editor\n${thumb}---\nThis synthetic source exercises attributed preview rendering and fallback states. It is created only in a temporary test checkout and is never published.\n`);
    if (name === 'cached') cache[sourceUrl] = { checkedAt: '2026-10-28', thumbnail: thumbnail(`${source}/success.png`, sourceUrl) };
    if (name === 'unsafe') cache[sourceUrl] = { checkedAt: '2026-10-28', thumbnail: thumbnail('javascript:alert(1)', sourceUrl) };
  }
  await writeFile(join(root, 'data/watch/media.json'), JSON.stringify(cache));
  const sources = JSON.parse(await readFile(join(root, 'scripts/watch/sources.json'), 'utf8'));
  sources.sources.push({ id: 'disabled-fixture', name: 'Fixture Publisher', url: 'https://disabled.example.org/feed', preview: false });
  await writeFile(join(root, 'scripts/watch/sources.json'), JSON.stringify(sources));
  await run(process.execPath, [resolve('node_modules/astro/astro.js'), 'build'], { cwd: root, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, maxBuffer: 5_000_000 });
  const dist = join(root, 'dist');
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' };
  server = createServer(async (req, res) => {
    try {
      let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/WhatisAI\/?/, '');
      if (!extname(pathname)) pathname = pathname.replace(/\/?$/, '/index.html');
      const file = resolve(dist, pathname.replace(/^\//, ''));
      if (!file.startsWith(dist + '/')) { res.writeHead(403).end(); return; }
      const body = await readFile(file); res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' }).end(body);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (!executablePath) { try { await access('/usr/bin/chromium'); executablePath = '/usr/bin/chromium'; } catch {} }
  browser = await chromium.launch({ executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const requests = [], errors = [];
  let failSuccess = false;
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4V8AAAAASUVORK5CYII=', 'base64');
  await context.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith(base + '/')) return route.continue();
    requests.push(url);
    if (url === source + '/success.png' && !failSuccess) return route.fulfill({ status: 200, contentType: 'image/png', body: png });
    return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  const visit = (path) => page.goto(`${base}/WhatisAI/${path}`, { waitUntil: 'networkidle' });
  const shot = (name) => page.screenshot({ path: join(artifacts, name + '.png') });
  // Public account, metadata, sharing, and small-screen navigation.
  await visit('account/');
  await page.getByText('Account sign-in is coming soon.', { exact: false }).waitFor();
  assert(await page.getByRole('button', { name: 'Continue with Google' }).isDisabled());
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex,follow');
  await shot('account-desktop');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text) => { window.__shared = text; } }, configurable: true });
  });
  await page.getByRole('button', { name: 'Share this page' }).click();
  assert.equal(await page.evaluate(() => window.__shared), 'https://zacklinger.github.io/WhatisAI/');
  await visit('learn/welcome/?private=never-share');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('blocked'); } }, configurable: true });
  });
  await page.getByRole('button', { name: 'Share this page' }).click();
  assert.equal(await page.getByLabel('Link to share').inputValue(), 'https://zacklinger.github.io/WhatisAI/learn/welcome/');
  assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), 'https://zacklinger.github.io/WhatisAI/learn/welcome/');
  assert.equal((await context.request.get(`${base}/WhatisAI/social-card.png`)).status(), 200);
  const sitemap = await (await context.request.get(`${base}/WhatisAI/sitemap.xml`)).text();
  assert(sitemap.includes('/learn/welcome/'));
  assert(!sitemap.includes('/account/'));
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 850 });
    await visit('account/');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Account overflow at ${width}`);
    assert(await page.locator('.account-link').isVisible());
    if (width === 390) await shot('account-mobile');
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => localStorage.removeItem('whatisai:progress:v1'));
  console.log('PASS guest account state, private-page noindex, share privacy/fallback, social image, sitemap and responsive account navigation');
  // A first-time visitor can predict, experiment, find a useful next step, and replay.
  await visit('');
  const challenge = page.getByRole('region', { name: 'Three-minute discovery challenge' });
  const progressBefore = await page.evaluate(() => localStorage.getItem('whatisai:progress:v1'));
  const reveal = challenge.getByRole('button', { name: 'Reveal 40 new examples' });
  assert(await reveal.isDisabled());
  await shot('discovery-start-desktop');
  await challenge.locator('input[value="b"]').focus();
  await page.keyboard.press('Space');
  await reveal.focus(); await page.keyboard.press('Enter');
  await challenge.getByText(/near-perfect training fit was tempting/).waitFor();
  assert.equal(await page.locator(':focus').textContent(), 'A perfect fit can miss the pattern.');
  const flexibility = challenge.getByRole('slider', { name: 'Curve flexibility' });
  await flexibility.focus(); await page.keyboard.press('End');
  await challenge.locator('.discovery-error').filter({ hasText: '3,097.22' }).waitFor();
  await challenge.getByRole('checkbox').check();
  await challenge.locator('.discovery-error').filter({ hasText: '5.851' }).waitFor();
  await challenge.scrollIntoViewIfNeeded(); await shot('discovery-explore-desktop');
  await challenge.getByRole('button', { name: 'What does this mean for me?' }).click();
  for (const [label, id] of [['Reading research', 'research'], ['Following trends', 'anticipate'], ['At work', 'use']]) {
    await challenge.getByRole('button', { name: label, exact: true }).click();
    assert.equal(await challenge.getByRole('link', { name: 'Explore this direction' }).getAttribute('href'), `/WhatisAI/explore/#${id}`);
  }
  await challenge.getByText('Related research, with an important limit', { exact: true }).click();
  assert.equal(await challenge.getByRole('link', { name: 'Deep Double Descent' }).getAttribute('href'), 'https://arxiv.org/abs/1912.02292');
  await shot('discovery-takeaway-desktop');
  for (const choice of ['a', 'unsure']) {
    await challenge.getByRole('button', { name: 'Replay the same example' }).click();
    assert(await reveal.isDisabled());
    assert.equal(await challenge.locator('input:checked').count(), 0);
    await challenge.locator(`input[value="${choice}"]`).check(); await reveal.click();
    await challenge.getByText(choice === 'a' ? /Your prediction matched/ : /Testing is the right way/).waitFor();
    assert.equal(await flexibility.inputValue(), '3');
    assert.equal(await challenge.getByRole('checkbox').isChecked(), false);
    await challenge.getByRole('button', { name: 'What does this mean for me?' }).click();
  }
  assert.equal(await page.evaluate(() => localStorage.getItem('whatisai:progress:v1')), progressBefore);
  const directions = await page.locator('.intent-link').evaluateAll((links) => links.map((a) => a.getAttribute('href')));
  assert.equal(directions.length, 4);
  for (const direction of directions) {
    await page.goto(base + direction, { waitUntil: 'networkidle' });
    const route = page.locator(new URL(base + direction).hash);
    assert.equal(await route.locator('.journey-steps a').count(), 3);
    for (const link of await route.locator('.journey-steps a').all()) {
      assert.equal((await context.request.get(base + await link.getAttribute('href'))).status(), 200);
    }
  }
  console.log('PASS keyboard prediction, reveal, controls, all takeaways, replay, unchanged progress, and four working lesson routes');
  await visit('trends/');
  await page.getByText('Collecting history', { exact: true }).waitFor();
  assert.equal(await page.getByText(/× usual share/).count(), 0);
  await shot('trend-history');
  console.log('PASS insufficient-baseline UI');

  // Goals work before a first lesson, survive reloads/backups, and remain editable.
  await page.setViewportSize({ width: 320, height: 844 });
  await visit('path/');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'path goal link overflow');
  await page.getByRole('link', { name: 'Set a learning goal', exact: true }).click();
  await page.getByRole('region', { name: 'Your goals', exact: true }).waitFor();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit('progress/');
  const goalsPanel = page.getByRole('region', { name: 'Your goals', exact: true });
  await goalsPanel.getByRole('button', { name: 'Add a goal' }).click();
  await goalsPanel.getByLabel('Target date', { exact: true }).fill('2099-01-01');
  await goalsPanel.getByRole('button', { name: 'Save goal', exact: true }).click();
  await goalsPanel.getByText('Goal saved.', { exact: true }).waitFor();
  const goalBackup = await page.evaluate(() => localStorage.getItem('whatisai:progress:v1'));
  assert.equal(JSON.parse(goalBackup).goals.length, 1);
  assert.deepEqual(JSON.parse(goalBackup).activity, {});
  await page.reload({ waitUntil: 'networkidle' });
  await goalsPanel.getByRole('heading', { name: 'Conversational in AI', exact: true }).waitFor();
  await shot('goals-desktop');
  await visit('');
  await page.getByRole('link', { name: /Your learning goal/ }).click();
  await goalsPanel.getByRole('button', { name: 'Edit Conversational in AI goal' }).click();
  await goalsPanel.getByLabel('I want to…').selectOption('mastery');
  await goalsPanel.getByLabel('Target date', { exact: true }).fill('2099-02-01');
  await goalsPanel.getByRole('button', { name: 'Save changes' }).click();
  await goalsPanel.getByRole('heading', { name: 'Master the full path' }).waitFor();
  const editedGoal = await page.evaluate(() => JSON.parse(localStorage.getItem('whatisai:progress:v1')).goals[0]);
  assert.equal(editedGoal.id, JSON.parse(goalBackup).goals[0].id);
  assert.equal(editedGoal.targetDate, '2099-02-01');
  await goalsPanel.getByRole('button', { name: 'Add a goal' }).click();
  await goalsPanel.getByLabel('Target date', { exact: true }).fill('2099-01-01');
  await goalsPanel.getByRole('button', { name: 'Save goal', exact: true }).click();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await goalsPanel.scrollIntoViewIfNeeded();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `goal overflow at ${width}`);
    await shot(`goals-${width}`);
  }
  await page.emulateMedia({ colorScheme: 'dark' });
  await goalsPanel.getByRole('button', { name: 'Edit Conversational in AI goal' }).click();
  await shot('goals-editor-dark-mobile');
  await goalsPanel.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.emulateMedia({ colorScheme: 'light' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  page.once('dialog', (dialog) => dialog.accept());
  await goalsPanel.getByRole('button', { name: 'Remove Conversational in AI goal' }).click();
  assert.equal(await goalsPanel.getByRole('article').count(), 1);
  await page.locator('input[type="file"]').setInputFiles({ name: 'goal-backup.json', mimeType: 'application/json', buffer: Buffer.from(goalBackup) });
  await goalsPanel.getByRole('heading', { name: 'Conversational in AI', exact: true }).waitFor();
  const overdueGoal = JSON.parse(goalBackup);
  overdueGoal.goals[0].targetDate = '2000-01-01';
  await page.locator('input[type="file"]').setInputFiles({ name: 'overdue.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(overdueGoal)) });
  await goalsPanel.getByText('Target date passed', { exact: true }).waitFor();
  await shot('goals-overdue');
  const curriculum = await (await context.request.get(`${base}/WhatisAI/curriculum.json`)).json();
  overdueGoal.modules = Object.fromEntries(curriculum.modules.map((m) => [m.id, { status: 'mastered', updatedAt: 1, score: 1 }]));
  await page.locator('input[type="file"]').setInputFiles({ name: 'achieved.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(overdueGoal)) });
  await goalsPanel.getByText('Goal met', { exact: true }).waitFor();
  assert.equal(await goalsPanel.getByRole('progressbar').getAttribute('value'), '8');
  await shot('goals-achieved');
  await page.evaluate(() => localStorage.removeItem('whatisai:progress:v1'));
  console.log('PASS goal creation, edit, multiple goals, reload, homepage link, import, removal, overdue/achieved states, and mobile layouts');

  // Skip all tracks, then take a real assessment, then skip again on a retake.
  await visit('placement/');
  const saved = { v: 1, modules: { welcome: { status: 'mastered', updatedAt: 1, score: 1 } }, review: {}, calibration: [], activity: {}, placement: { takenAt: 1, placed: [], probed: ['welcome'], misconceptions: [], brier: 0.2 } };
  await page.evaluate((s) => localStorage.setItem('whatisai:progress:v1', JSON.stringify(s)), saved);
  await page.reload({ waitUntil: 'networkidle' });
  async function rateAllNew() {
    await page.getByRole('button', { name: 'Begin', exact: true }).click();
    for (const radio of await page.getByRole('radio', { name: 'New to me', exact: true }).all()) await radio.click();
  }
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('whatisai:progress:v1')));
  await rateAllNew(); await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('heading', { name: 'Choose where to begin.' }).waitFor();
  assert.equal(await page.getByText(/0% correct/).count(), 0);
  assert.deepEqual((await stored()).placement, saved.placement);
  await page.getByText('Questions answered', { exact: true }).scrollIntoViewIfNeeded(); await shot('unassessed');
  await page.getByRole('button', { name: 'Retake', exact: true }).click();
  await rateAllNew(); await page.getByRole('radio', { name: 'Some familiarity', exact: true }).first().click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: /Is this impressive/ }).click();
  await page.getByRole('button', { name: '25%', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByText(/0% correct, in about/).waitFor();
  const assessed = (await stored()).placement;
  assert.deepEqual(assessed.probed, ['welcome']);
  assert.equal((await stored()).calibration.at(-1).c, 0.25);
  assert.equal((await stored()).modules.welcome.status, 'mastered');
  await page.getByRole('button', { name: 'Retake', exact: true }).click();
  await rateAllNew(); await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('heading', { name: 'Choose where to begin.' }).waitFor();
  assert.deepEqual((await stored()).placement, assessed);
  await page.getByRole('button', { name: 'Retake', exact: true }).click();
  await rateAllNew(); await page.getByRole('radio', { name: 'Some familiarity', exact: true }).first().click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: "I don't know", exact: true }).click();
  await page.getByText(/0% correct, in about/).waitFor();
  assert.deepEqual((await stored()).placement.probed, ['welcome']);
  console.log('PASS empty, assessed-zero, retake, low-confidence, and final-dont-know persistence');

  for (const name of fixtures) {
    await visit(`signals/2026-10-28-fixture-${name}/`);
    const preview = page.locator('.source-preview .media-preview');
    await preview.scrollIntoViewIfNeeded();
    if (name === 'success' || name === 'cached') {
      await page.waitForFunction(() => document.querySelector('.source-preview img')?.naturalWidth > 0);
      assert.match(await preview.innerText(), /Preview: Fixture Creator/);
      assert.equal(await preview.locator('img').getAttribute('referrerpolicy'), 'no-referrer');
    } else await preview.locator('img').waitFor({ state: 'detached' });
    assert.equal(await preview.getAttribute('data-preview-state'), ['success', 'cached'].includes(name) ? 'image' : 'fallback');
    await shot(`preview-${name}`);
  }
  assert(!requests.some((url) => url.includes('optout.png') || url.startsWith('javascript:')));
  failSuccess = true;
  await visit('signals/2026-10-28-fixture-success/');
  await page.locator('.source-preview').scrollIntoViewIfNeeded();
  await page.locator('.source-preview img').waitFor({ state: 'detached' });
  failSuccess = false;
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.source-preview').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.source-preview img')?.naturalWidth > 0);
  console.log('PASS attributed, cached, missing, broken, unsafe, opted-out, and retried previews');

  for (const width of [1440, 900, 390, 320]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const path of ['', 'explore/', 'trends/', 'signals/', 'signals/2026-10-28-fixture-success/', 'placement/']) {
      await visit(path);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}: ${path}`);
    }
    await visit(''); await shot(`homepage-${width}`);
    if (width <= 920) {
      await page.getByRole('button', { name: 'Open menu' }).click();
      await page.locator('#mobile-menu').getByRole('link', { name: 'Explore', exact: true }).click();
      await page.getByRole('heading', { name: 'What do you want to make sense of?' }).waitFor();
      await shot(`explore-${width}`);
      await visit('');
    }
    await challenge.screenshot({ path: join(artifacts, `challenge-start-${width}.png`) });
    await challenge.locator('input[value="a"]').check(); await reveal.click();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `challenge result overflow at ${width}`);
    await challenge.scrollIntoViewIfNeeded(); await shot(`discovery-result-${width}`);
    await challenge.getByRole('button', { name: 'What does this mean for me?' }).click();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `takeaway overflow at ${width}`);
    await challenge.screenshot({ path: join(artifacts, `challenge-takeaway-${width}.png`) });
  }
  await page.emulateMedia({ colorScheme: 'dark' });
  await visit(''); await challenge.scrollIntoViewIfNeeded(); await shot('discovery-dark-mobile');
  // The existing lesson still uses the same shared simulation.
  await visit('learn/generalization/');
  const lessonSlider = page.getByRole('slider', { name: 'Model complexity (degree)' });
  await lessonSlider.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('input[aria-label="Model complexity (degree)"]')?.closest('astro-island')?.hasAttribute('ssr'));
  await lessonSlider.fill('11');
  await page.getByText('3097.220', { exact: true }).waitFor();
  const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await noJS.route('**/*', (route) => route.request().url().startsWith(base + '/') ? route.continue() : route.abort());
  const staticPage = await noJS.newPage();
  await staticPage.goto(`${base}/WhatisAI/`);
  // Playwright's text engine excludes noscript; check its rendered paragraph directly.
  const fallback = staticPage.locator('noscript p');
  assert(await fallback.isVisible());
  assert.match(await fallback.innerText(), /The interactive challenge needs JavaScript/);
  await staticPage.locator('.intent-link').first().click();
  assert.equal(await staticPage.locator('.journey-steps a').count(), 12);
  await noJS.close();
  console.log('PASS mobile navigation, dark theme render, existing shared lesson, and no-JavaScript routes');
  assert.deepEqual(errors, []);
  console.log(`PASS desktop/mobile layouts; no page errors. Screenshots: ${artifacts}`);
} finally {
  await browser?.close();
  if (server) { server.closeAllConnections(); await new Promise((r) => server.close(r)); }
  await rm(root, { recursive: true, force: true });
}
