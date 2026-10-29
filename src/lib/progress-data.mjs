import { validGoal, MAX_GOALS } from './goals.mjs';
// Validate both downloaded backups and user-selected files before they reach the UI.
const record = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const finite = (v) => typeof v === 'number' && Number.isFinite(v);
const nonnegative = (v) => finite(v) && v >= 0;
const safeKey = (v) => typeof v === 'string' && v.length > 0 && v.length <= 160 && !['__proto__', 'constructor', 'prototype'].includes(v);
const strings = (v) => Array.isArray(v) && v.length <= 1000 && v.every(safeKey);
const map = (v, check) => record(v) && Object.keys(v).length <= 2000 && Object.entries(v).every(([k, x]) => safeKey(k) && check(x));

export function parseProgress(json) {
  if (typeof json !== 'string' || new TextEncoder().encode(json).length > 500_000) throw new Error('Progress file is too large.');
  const s = JSON.parse(json);
  const valid = record(s) && s.v === 1 &&
    map(s.modules, (m) => record(m) && ['started', 'completed', 'mastered', 'placed'].includes(m.status) && nonnegative(m.updatedAt) && (m.score === undefined || (finite(m.score) && m.score >= 0 && m.score <= 1))) &&
    map(s.review, (r) => record(r) && ['ease', 'interval', 'due', 'reps', 'lapses'].every((k) => nonnegative(r[k]))) &&
    Array.isArray(s.calibration) && s.calibration.length <= 600 && s.calibration.every((p) => record(p) && finite(p.c) && p.c >= 0 && p.c <= 1 && typeof p.ok === 'boolean' && nonnegative(p.t) && ['placement', 'mastery', 'review'].includes(p.src)) &&
    map(s.activity, (n) => Number.isSafeInteger(n) && n >= 0) &&
    (s.goals === undefined || (Array.isArray(s.goals) && s.goals.length <= MAX_GOALS && s.goals.every(validGoal) && new Set(s.goals.map((g) => g.id)).size === s.goals.length)) &&
    (s.lastModule === undefined || (safeKey(s.lastModule) && /^[a-z0-9-]+$/.test(s.lastModule))) &&
    (s.placement === undefined || (record(s.placement) && nonnegative(s.placement.takenAt) && strings(s.placement.placed) && strings(s.placement.probed) && strings(s.placement.misconceptions) && finite(s.placement.brier) && s.placement.brier >= 0 && s.placement.brier <= 1));
  if (!valid) throw new Error('This is not a valid WhatisAI progress file.');
  // Drop unknown root fields, including prototype-related keys.
  return { v: 1, modules: s.modules, review: s.review, calibration: s.calibration, activity: s.activity,
    ...(s.lastModule ? { lastModule: s.lastModule } : {}), ...(s.placement ? { placement: s.placement } : {}),
    ...(s.goals ? { goals: s.goals.map(({ id, kind, targetDate, createdAt, updatedAt }) => ({ id, kind, targetDate, createdAt, updatedAt })) } : {}) };
}

export const GUEST_KEY = 'whatisai:progress:v1';
export const SCOPE_KEY = 'whatisai:progress-owner';
export function progressKey(uid) {
  return uid ? `whatisai:account:${encodeURIComponent(uid)}:progress:v1` : GUEST_KEY;
}
