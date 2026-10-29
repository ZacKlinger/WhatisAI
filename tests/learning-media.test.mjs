import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { validateLearningMedia } from '../src/lib/learning-validation.mjs';
const resources = JSON.parse(readFileSync(new URL('../src/data/learning-resources.json', import.meta.url)));
const plans = JSON.parse(readFileSync(new URL('../src/data/learning-paths.json', import.meta.url)));
const ids = readdirSync(new URL('../src/content/modules/', import.meta.url)).filter((f) => f.endsWith('.mdx')).map((f) => f.slice(0, -4));
test('every lesson has a complete external-led plan with attributed sources and safe video identities', () => {
  assert.deepEqual(validateLearningMedia(resources, plans, ids), []);
});
test('incomplete coverage, unsafe sources, broken references, and text-heavy plans fail editorial validation', () => {
  const r = structuredClone(resources), p = structuredClone(plans);
  delete p.welcome;
  p.attention.steps[0].resource = 'missing';
  p.probability.practiceMinutes = 1000;
  r.neurons.url = 'javascript:alert(1)';
  r.neurons.youtubeId = 'bad-id';
  const errors = validateLearningMedia(r, p, ids).join('\n');
  for (const message of ['welcome: missing', 'attention: unknown', 'probability: less than 70%', 'neurons: requires HTTPS', 'neurons: invalid YouTube']) assert.ok(errors.includes(message), message);
});
test('practical AI fluency uses the official lessons for every D and the iteration loop', () => {
  assert.deepEqual(plans['ai-fluency'].steps.map((s) => s.resource), ['4d', 'delegation', 'description', 'discernment', 'loop', 'diligence']);
  for (const step of plans['ai-fluency'].steps) {
    assert.equal(new URL(resources[step.resource].url).hostname, 'academy.claude.com');
    assert.equal(resources[step.resource].licenseUrl, 'https://creativecommons.org/licenses/by-nc-sa/4.0/');
  }
});
