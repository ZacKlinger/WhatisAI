import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanUrl, sanitizeEvent } from '../src/lib/analytics-data.mjs';

test('analytics discards answers, identity, form data, campaigns and unknown events', () => {
  const result = sanitizeEvent({ event: 'mastery_completed', $set: { email: 'private@example.com' }, properties: {
    module_id: 'welcome', distinct_id: 'random-browser-id', score: 1, answer: 'private',
    email: 'private@example.com', $set: { name: 'private' }, $initial_current_url: 'https://example.com/?secret=1',
    utm_campaign: 'private', $current_url: 'https://example.com/WhatisAI/?secret=1#private',
    $referrer: 'https://referrer.example/private?email=secret#token',
  } });
  assert.deepEqual(result.properties, { module_id: 'welcome', distinct_id: 'random-browser-id',
    $current_url: 'https://example.com/WhatisAI/', $referrer: 'https://referrer.example/' });
  assert.equal(result.$set, undefined);
  assert.equal(sanitizeEvent({ event: '$autocapture', properties: { $elements: ['input'] } }), null);
  assert.equal(sanitizeEvent({ event: '$identify', properties: {} }), null);
  assert.equal(sanitizeEvent({ event: '$snapshot', properties: {} }), null);
});

test('URLs never retain credentials, fragments, or query strings', () => {
  assert.equal(cleanUrl('https://name:password@example.com/path/?token=abc#email'), 'https://example.com/path/');
  for (const bad of ['javascript:alert(1)', 'data:text/html,secret', 'not a URL']) assert.equal(cleanUrl(bad), '');
});
