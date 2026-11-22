import assert from 'node:assert/strict';
import test from 'node:test';
import { criticalValue, zeroHeights } from '../src/lib/zeta.mjs';

test('the critical-line trace reproduces known values and its six positive zeros', () => {
  assert.ok(Math.abs(criticalValue(0)[0] + 1.46035450881) < 1e-9);
  assert.equal(criticalValue(0)[1], 0);
  for (const t of zeroHeights) assert.ok(Math.hypot(...criticalValue(t)) < 1e-6);
  for (let t = 0; t <= 40; t += .05) assert.ok(criticalValue(t).every(Number.isFinite));
});
