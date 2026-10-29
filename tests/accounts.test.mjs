import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProgress, progressKey, GUEST_KEY } from '../src/lib/progress-data.mjs';

const valid = () => ({ v: 1, modules: { welcome: { status: 'mastered', updatedAt: 1, score: 1 } }, review: {}, calibration: [{ c: .8, ok: true, t: 1, src: 'mastery' }], activity: { '2026-10-27': 2 }, lastModule: 'welcome' });
test('valid progress round-trips and unknown root fields are dropped', () => {
  const s = valid();
  assert.deepEqual(parseProgress(JSON.stringify({ ...s, unknown: 'discard' })), s);
});
test('invalid and oversized imports are rejected before reaching the store', () => {
  for (const bad of [null, {}, { ...valid(), modules: [] }, { ...valid(), lastModule: '../../account' }, { ...valid(), review: { x: { ease: -1 } } }, { ...valid(), calibration: [{ c: 10, ok: true, t: 1, src: 'mastery' }] }, { ...valid(), activity: { day: 'bad' } }, { ...valid(), modules: JSON.parse('{"__proto__":{"status":"started","updatedAt":1}}') }]) {
    assert.throws(() => parseProgress(JSON.stringify(bad)));
  }
  assert.throws(() => parseProgress(' '.repeat(500001)));
});
test('guest and account storage keys cannot collide', () => {
  assert.equal(progressKey(null), GUEST_KEY);
  assert.notEqual(progressKey('alice'), progressKey('bob'));
  assert.notEqual(progressKey('alice'), GUEST_KEY);
  assert.notEqual(progressKey('a/b'), progressKey('a%2Fb'));
});

test('switching users cannot reuse previous in-memory or persisted progress', async () => {
  const values = new Map();
  globalThis.localStorage = { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: (k) => values.delete(k) };
  const handlers = new Map();
  globalThis.window = { addEventListener: (name, fn) => handlers.set(name, fn) };
  const store = await import('../src/lib/progress.ts');
  store.importProgress(JSON.stringify(valid()));
  store.setProgressOwner('alice');
  assert.deepEqual(store.getState().modules, {});
  store.copyGuestProgress();
  assert.equal(store.getState().modules.welcome.status, 'mastered');
  store.setProgressOwner('bob');
  assert.deepEqual(store.getState().modules, {});
  assert.equal(localStorage.getItem(progressKey('alice')), null);
  store.setModuleStatus('learning', 'started');
  store.setProgressOwner(null);
  assert.equal(store.getState().modules.welcome.status, 'mastered');
  assert.equal(store.getState().modules.learning, undefined);
  assert.equal(localStorage.getItem(progressKey('bob')), null);
  assert.throws(() => store.importProgress('{"v":1}'));
  assert.equal(store.getState().modules.welcome.status, 'mastered');
  store.setProgressOwner('alice');
  store.setModuleStatus('example', 'started');
  localStorage.removeItem(progressKey('alice'));
  handlers.get('storage')({ key: progressKey('alice'), newValue: null });
  assert.deepEqual(store.getState().modules, {});
  delete globalThis.window; delete globalThis.localStorage;
});
