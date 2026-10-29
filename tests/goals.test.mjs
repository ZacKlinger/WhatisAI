import test from 'node:test';
import assert from 'node:assert/strict';
import { goalPlan, goalTypes, localDate, validDate, MAX_GOALS } from '../src/lib/goals.mjs';
import { parseProgress } from '../src/lib/progress-data.mjs';

const goal = (overrides = {}) => ({ id: 'example-goal', kind: 'conversational', targetDate: '2026-11-09', createdAt: 1, updatedAt: 1, ...overrides });
const state = (goals) => ({ v: 1, modules: {}, review: {}, calibration: [], activity: {}, ...(goals === undefined ? {} : { goals }) });
const modules = [...goalTypes[0].modules, 'extra-lesson'].map((id) => ({ id, minutes: 20 }));

test('old backups remain valid; goals round-trip and unknown goal fields are dropped', () => {
  assert.deepEqual(parseProgress(JSON.stringify(state())), state());
  assert.deepEqual(parseProgress(JSON.stringify(state([goal({ unknown: 'discard' })]))), state([goal()]));
});

test('invalid, duplicate, and oversized goal lists cannot replace progress', () => {
  for (const goals of [null, {}, [null], [goal({ kind: 'invalid' })], [goal({ id: '../bad' })], [goal({ targetDate: '2026-02-30' })], [goal({ createdAt: -1 })], [goal({ updatedAt: 0 })], [goal(), goal()], Array.from({ length: MAX_GOALS + 1 }, (_, i) => goal({ id: `goal-${i}` }))]) {
    assert.throws(() => parseProgress(JSON.stringify(state(goals))));
  }
  assert.equal(parseProgress(JSON.stringify(state([goal({ targetDate: '2020-01-01' })]))).goals.length, 1, 'overdue goals survive restore');
});

test('calendar dates are strict, local, and unaffected by daylight-saving transitions', () => {
  assert(validDate('2028-02-29'));
  for (const invalid of ['2026-02-29', '2026-04-31', '2026-1-01', 'invalid', '2026-11-01T12:00:00Z']) assert(!validDate(invalid));
  assert.equal(localDate(new Date(2026, 9, 27, 23, 30)), '2026-10-27');
  assert.equal(goalPlan(goal({ targetDate: '2026-11-02' }), modules, {}, '2026-10-31').daysLeft, 2);
});

test('conversational goals credit mastery and placement, but never reading or failed checks', () => {
  const progress = { welcome: { status: 'placed' }, tokens: { status: 'mastered' }, inference: { status: 'completed' }, benchmarks: { status: 'started' } };
  const plan = goalPlan(goal(), modules, progress, '2026-10-27');
  assert.equal(plan.done, 2);
  assert.equal(plan.required.length, 8);
  assert.equal(plan.next.id, 'neural-networks');
  assert.equal(plan.remainingMinutes, 120);
  assert.equal(plan.weeklyMinutes, 60);
  assert.equal(plan.weeklyModules, 3);
  const mastery = goalPlan(goal({ kind: 'mastery' }), modules, progress, '2026-10-27');
  assert.equal(mastery.done, 1);
  assert.equal(mastery.required.length, modules.length);
  assert.equal(mastery.next.id, 'welcome');
});

test('due-today, overdue, and achieved goals have honest plans', () => {
  const today = goalPlan(goal({ targetDate: '2026-10-27' }), modules, {}, '2026-10-27');
  assert.equal(today.daysLeft, 0);
  assert.equal(today.weeklyMinutes, 160);
  const overdue = goalPlan(goal({ targetDate: '2026-10-26' }), modules, {}, '2026-10-27');
  assert.equal(overdue.weeklyMinutes, null);
  assert.equal(overdue.weeklyModules, null);
  const mastered = Object.fromEntries(modules.map((m) => [m.id, { status: 'mastered' }]));
  const met = goalPlan(goal(), modules, mastered, '2027-01-01');
  assert(met.achieved);
  assert.equal(met.next, undefined);
  assert.equal(met.remainingMinutes, 0);
  assert.throws(() => goalPlan(goal(), [], {}, '2026-10-27'), /missing/);
});

test('goal edits persist without awarding activity and remain isolated by profile', async () => {
  const values = new Map();
  globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  globalThis.window = { addEventListener() {} };
  const store = await import('../src/lib/progress.ts');
  try {
    store.saveGoal('conversational', localDate());
    const first = store.getState().goals[0];
    store.saveGoal('mastery', '2099-01-01', first.id);
    assert.equal(store.getState().goals.length, 1);
    assert.equal(store.getState().goals[0].createdAt, first.createdAt);
    assert.equal(store.getState().goals[0].kind, 'mastery');
    assert.deepEqual(store.getState().activity, {});
    assert.throws(() => store.saveGoal('mastery', '2000-01-01'));
    const exported = store.exportProgress();
    store.setProgressOwner('another-person');
    assert.equal(store.getState().goals, undefined);
    store.setProgressOwner(null);
    assert.equal(store.getState().goals[0].id, first.id);
    store.removeGoal(first.id);
    assert.deepEqual(store.getState().goals, []);
    store.importProgress(exported);
    assert.equal(store.getState().goals[0].id, first.id);
    store.resetProgress();
    assert.equal(store.getState().goals, undefined);
  } finally { delete globalThis.window; delete globalThis.localStorage; }
});
