import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGeneralizationData, runGeneralization } from '../src/lib/generalization.mjs';

test('the prediction reveal is supported by errors on the same unseen examples', () => {
  const a = runGeneralization(3), b = runGeneralization(11);
  assert.equal(a.train.length, 12);
  assert.equal(a.test.length, 40);
  assert.deepEqual(a.test, b.test);
  assert.deepEqual(a.train, b.train);
  assert(b.trainingError < 0.001);
  assert(b.trainingError < a.trainingError);
  assert(a.newError < b.newError);
  // Retain the original lesson's seeded example when sharing its math.
  assert(Math.abs(a.newError - 0.15716837612) < 1e-8);
});

test('all challenge controls produce finite results and replay does not mutate examples', () => {
  const original = makeGeneralizationData();
  for (let degree = 1; degree <= 11; degree++) for (const lambda of [0, 0.1]) {
    const result = runGeneralization(degree, lambda);
    assert(result.weights.every(Number.isFinite));
    assert(Number.isFinite(result.trainingError) && result.trainingError >= 0);
    assert(Number.isFinite(result.newError) && result.newError >= 0);
    result.train[0][1] = 999;
  }
  assert.deepEqual(makeGeneralizationData(), original);
  assert(runGeneralization(11, 0.1).newError < runGeneralization(11).newError);
});
