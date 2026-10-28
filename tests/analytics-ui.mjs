// Isolated build and intercepted network: never sends synthetic traffic to PostHog.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdtemp, cp, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve, join, extname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { gunzipSync } from 'node:zlib';
const run = promisify(execFile);
const root = await mkdtemp(join(tmpdir(), 'whatisai-analytics-'));
let browser, server;
const consentKey = 'whatisai:analytics-consent:v1';
try {
  for (const dir of ['src', 'scripts', 'data', 'public']) await cp(resolve(dir), join(root, dir), { recursive: true });
  for (const file of ['astro.config.mjs', 'tsconfig.json', 'package.json']) await cp(resolve(file), join(root, file));
  await symlink(resolve('node_modules'), join(root, 'node_modules'), 'dir');
  // Exercise delivery in headless Chrome; production retains the SDK bot filter.
  const analyticsPath = join(root, 'src/lib/analytics.ts');
  await writeFile(analyticsPath, (await readFile(analyticsPath, 'utf8')).replace('api_host: host,', 'api_host: host, opt_out_useragent_filter: true,'));
  await run(process.execPath, [resolve('node_modules/astro/astro.js'), 'build'], { cwd: root, env: { ...process.env,
    ASTRO_TELEMETRY_DISABLED: '1', PUBLIC_POSTHOG_KEY: 'phc_testonly', PUBLIC_POSTHOG_ALLOW_LOCALHOST: 'true',
  }, maxBuffer: 5_000_000 });
  const dist = join(root, 'dist');
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
  server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/WhatisAI\/?/, '');
      if (!extname(path)) path = path.replace(/\/?$/, '/index.html');
      const file = resolve(dist, path.replace(/^\//, ''));
      if (!file.startsWith(dist + '/')) return res.writeHead(403).end();
      res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' }).end(await readFile(file));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const contexts = [];
  async function setup(init) {
    const context = await browser.newContext({viewport:{width:390,height:844}});
    contexts.push(context);
    if (init) await context.addInitScript(init);
    const events = [], requests = [], errors = [];
    await context.route('**/*', async route => {
      const req = route.request();
      if (req.url().startsWith(origin)) return route.continue();
      requests.push(req.url());
      if (new URL(req.url()).hostname === 'us.i.posthog.com' && /^\/(i\/.*|e\/)$/.test(new URL(req.url()).pathname)) {
        let body = req.postDataBuffer();
        if (body?.[0] === 31 && body[1] === 139) body = gunzipSync(body);
        let parsed;
        try { parsed = JSON.parse(body.toString()); } catch { parsed = JSON.parse(Buffer.from(new URLSearchParams(body.toString()).get('data'), 'base64').toString()); }
        events.push(...(Array.isArray(parsed) ? parsed : parsed.batch ?? [parsed]));
        return route.fulfill({status:200, contentType:'application/json',body:'{"status":1}'});
      }
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console', msg=>{ if (['error','warning'].includes(msg.type())) console.log('browser:',msg.text()); });
    const visit = path => page.goto(`${origin}/WhatisAI/${path}`, { waitUntil:'networkidle' });
    return {context,page,events,requests,errors,visit};
  }
  async function until(predicate, label) {
    const end = Date.now()+12000;
    while (!predicate() && Date.now()<end) await new Promise(r=>setTimeout(r,100));
    assert(predicate(), label);
  }
  const a = await setup();
  await a.visit('?secret=never-send#private');
  await a.page.getByRole('button',{name:'Allow analytics',exact:true}).waitFor();
  assert.equal(a.requests.length,0,'no external analytics request before consent');
  assert(await a.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await a.page.screenshot({path:join(tmpdir(),'whatisai-analytics-consent.png')});
  await a.page.getByRole('button',{name:'Decline analytics',exact:true}).click();
  await a.visit('learn/generalization/');
  assert.equal(a.requests.length,0,'decline survives navigation');
  await a.page.getByRole('button',{name:'Analytics preferences',exact:true}).click();
  await a.page.getByRole('button',{name:'Allow analytics',exact:true}).click();
  try { await until(()=>a.events.some(e=>e.event==='$pageview'),'pageview delivered after consent'); } catch(e) { console.log({events:a.events,requests:a.requests,errors:a.errors,storage:await a.page.evaluate(()=>({...localStorage})),status:await a.page.locator('#analytics-status').textContent()}); throw e; }
  assert.equal(a.events.filter(e=>e.event==='$pageview').length,1,'single initial pageview');
  await a.page.getByRole('button',{name:'Mark as read',exact:true}).click();
  const slider = a.page.locator('[data-analytics-widget] input[type="range"]').first();
  await slider.focus(); await a.page.keyboard.press('ArrowRight'); await a.page.keyboard.press('ArrowLeft');
  await a.page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
  await until(()=>a.events.some(e=>e.event==='lesson_read') && a.events.some(e=>e.event==='interactive_used') && a.events.some(e=>e.event==='reading_depth'),'learning interactions delivered');
  assert.equal(a.events.filter(e=>e.event==='interactive_used').length,1,'widget activity deduplicated');
  await a.visit('?email=never-send#private');
  await until(()=>a.events.filter(e=>e.event==='$pageview').length >= 2,'second pageview delivered');
  if (await a.page.locator('.discovery').count()) {
  await a.page.locator('.discovery input[value="b"]').check();
  await a.page.getByRole('button',{name:'Reveal 40 new examples'}).click();
  await a.page.getByRole('button',{name:'What does this mean for me?'}).click();
  await until(()=>a.events.some(e=>e.event==='discovery_completed'),'discovery funnel delivered');
  assert(a.events.some(e=>e.event==='discovery_started'));
  }
  const payload = JSON.stringify(a.events);
  for(const secret of ['never-send','?email=','#private','"$set"','"$elements"','"score"','"answer"']) assert(!payload.includes(secret),`no sensitive property ${secret}`);
  assert(a.requests.every(url=>new URL(url).hostname === 'us.i.posthog.com' && /^\/(i\/.*|e\/)$/.test(new URL(url).pathname)),'no flags, replay, surveys or remote scripts');
  await a.page.getByRole('button',{name:'Analytics preferences',exact:true}).click();
  await a.page.getByRole('button',{name:'Decline analytics',exact:true}).click();
  await a.page.waitForLoadState('networkidle');
  assert.equal(await a.page.evaluate(()=>localStorage.getItem('ph_phc_testonly_posthog')),null,'withdrawal removes analytics identifier');
  const count = a.requests.length;
  await a.visit('path/');
  assert.equal(a.requests.length,count,'withdrawal stops future analytics');
  assert.deepEqual(a.errors,[]);
  for (const signal of ['doNotTrack','globalPrivacyControl']) {
    const b = await setup();
    await b.context.addInitScript(({signal,key})=>{
      localStorage.setItem(key,'accepted');
      Object.defineProperty(navigator,signal,{value:signal==='doNotTrack'?'1':true});
    },{signal,key:consentKey});
    await b.visit('');
    assert.equal(b.requests.length,0,`${signal} overrides saved consent`);
  }
  const blocked = await setup(()=>{
    Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}});
  });
  await blocked.visit('');
  await blocked.page.getByRole('button',{name:'Decline analytics',exact:true}).click();
  assert.equal(blocked.requests.length,0);
  assert.deepEqual(blocked.errors,[],'blocked storage does not break learning');
  for(const context of contexts) await context.close();
  console.log('PASS consent, decline persistence, pageviews, lesson/simulation/discovery events, scroll depth, payload privacy, withdrawal, DNT/GPC, blocked storage, mobile layout');
} finally {
  await browser?.close();
  if(server) await new Promise(r=>server.close(r));
  await rm(root,{recursive:true,force:true});
}
