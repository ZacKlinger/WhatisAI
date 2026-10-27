import test from 'node:test';
import assert from 'node:assert/strict';
import { addObservation, buildTrends } from '../src/lib/trends.mjs';

const date = '2026-10-27';
const topics = [{ term: 'Agents', modules: ['agents-and-tools'] }];
const days = Array.from({ length: 35 }, (_, i) => new Date(Date.parse(`${date}T00:00:00Z`) - (34 - i) * 86400000).toISOString().slice(0, 10));
const history = () => Object.fromEntries(days.map((d, i) => [d, { __items: 10, Agents: i < 28 ? 1 : 5 }]));

test('one-day startup retains counts but publishes no trend multiples', () => {
  const result = buildTrends({ [date]: { __items: 53, Agents: 20 } }, topics, date);
  assert.equal(result.comparisonReady, false);
  assert.deepEqual(result.rising, []);
  assert.equal(result.volume[0].lift, null);
  assert.equal(result.volume[0].recent, 20);
});

test('empty and all-zero windows remain unassessed', () => {
  assert.equal(buildTrends({}, topics, '').comparisonReady, false);
  for (const rows of [{}, Object.fromEntries(days.map((d) => [d, { __items: 0 }]))]) {
    const result = buildTrends(rows, topics, date);
    assert.equal(result.comparisonReady, false);
    assert.deepEqual(result.rising, []);
  }
});

test('a complete, observed baseline enables meaningful comparisons', () => {
  const result = buildTrends(history(), topics, date);
  assert.equal(result.comparisonReady, true);
  assert.equal(result.baselineObservedDays, 28);
  assert.equal(result.recentObservedDays, 7);
  assert.equal(result.rising[0].lift, 4.92);
});

test('holes, failed observations, and old history cannot stand in for coverage', () => {
  for (const missing of [days[0], days[34]]) {
    const rows = history(); delete rows[missing]; rows['2025-01-01'] = { __items: 100 };
    assert.equal(buildTrends(rows, topics, date).comparisonReady, false);
  }
  const rows = history(); rows[days[0]].__observed = false;
  assert.equal(buildTrends(rows, topics, date).comparisonReady, false);
});

test('repeated daily observations preserve earlier counts without double counting empty reruns', () => {
  const first = addObservation({}, { Agents: 2 }, 4, true);
  const next = addObservation(first, { Agents: 1, Evaluation: 2 }, 3, true);
  assert.deepEqual(next, { Agents: 3, Evaluation: 2, __items: 7, __observed: true });
  assert.deepEqual(addObservation(next, {}, 0, false), next);
  assert.equal(addObservation({}, {}, 0, false).__observed, false);
});
