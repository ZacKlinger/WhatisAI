import { parseProgress, GUEST_KEY, SCOPE_KEY, progressKey } from './progress-data.mjs';
import { validGoal, localDate, MAX_GOALS } from './goals.mjs';
/**
 * Learner progress. Everything the app remembers about a learner flows
 * through this store. Persistence is delegated to an adapter so the
 * localStorage implementation used today can be swapped for an account-backed
 * one when WhatisAI becomes a public product.
 */

export type ModuleStatus = 'started' | 'completed' | 'mastered' | 'placed';

export interface ModuleProgress {
  status: ModuleStatus;
  updatedAt: number;
  /** Best mastery-check score, 0..1. */
  score?: number;
}

export interface ReviewCard {
  ease: number;
  /** Days until next review. */
  interval: number;
  due: number;
  reps: number;
  lapses: number;
}

export interface CalibrationPoint {
  /** Stated confidence 0.1..0.99. */
  c: number;
  ok: boolean;
  t: number;
  src: 'placement' | 'mastery' | 'review';
}

export interface PlacementResult {
  takenAt: number;
  placed: string[];
  probed: string[];
  misconceptions: string[];
  brier: number;
}

export interface LearningGoal {
  id: string;
  kind: 'conversational' | 'mastery';
  targetDate: string;
  createdAt: number;
  updatedAt: number;
}

export interface State {
  v: 1;
  modules: Record<string, ModuleProgress>;
  review: Record<string, ReviewCard>;
  calibration: CalibrationPoint[];
  placement?: PlacementResult;
  activity: Record<string, number>;
  lastModule?: string;
  goals?: LearningGoal[];
}

export interface StorageAdapter {
  load(): State | null;
  save(state: State): void;
  clear(): void;
}

let owner: string | null = null;
let KEY = GUEST_KEY;
try { owner = globalThis.localStorage?.getItem(SCOPE_KEY) ?? null; KEY = progressKey(owner); } catch {}

export const localAdapter: StorageAdapter = {
  load() {
    try {
      const raw = globalThis.localStorage?.getItem(KEY);
      return raw ? (parseProgress(raw) as State) : null;
    } catch {
      return null;
    }
  },
  save(state) {
    try {
      globalThis.localStorage?.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked: progress lives only in memory this session */
    }
  },
  clear() {
    try {
      globalThis.localStorage?.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};

const empty = (): State => ({ v: 1, modules: {}, review: {}, calibration: [], activity: {} });

let adapter: StorageAdapter = localAdapter;
let state: State = empty();
let loaded = false;
const listeners = new Set<() => void>();

function ensureLoaded() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  const s = adapter.load();
  state = s && s.v === 1 ? { ...empty(), ...s } : empty();
}

// One listener for the lifetime of the page; account changes never reuse old state.
if (typeof window !== 'undefined') window.addEventListener('storage', (event) => {
  if (event.key === SCOPE_KEY || event.key === null) {
    owner = event.newValue;
    KEY = progressKey(owner);
  } else if (event.key !== KEY) return;
  loaded = false;
  ensureLoaded();
  emit();
});

export function setProgressOwner(uid: string | null) {
  if (owner && owner !== uid) {
    try { localStorage.removeItem(progressKey(owner)); } catch {}
  }
  owner = uid;
  KEY = progressKey(uid);
  try {
    if (uid) localStorage.setItem(SCOPE_KEY, uid);
    else localStorage.removeItem(SCOPE_KEY);
  } catch {}
  state = empty();
  loaded = false;
  ensureLoaded();
  emit();
}

export function copyGuestProgress() {
  const raw = localStorage.getItem(GUEST_KEY);
  if (!raw) throw new Error('No guest progress was found on this device.');
  importProgress(raw);
}

export const getProgressOwner = () => owner;

function emit() {
  for (const l of listeners) l();
}

function commit(mutator: (draft: State) => void, learningActivity = true) {
  ensureLoaded();
  const draft: State = structuredClone(state);
  mutator(draft);
  const day = new Date().toISOString().slice(0, 10);
  if (learningActivity) draft.activity[day] = (draft.activity[day] ?? 0) + 1;
  state = draft;
  adapter.save(state);
  emit();
}

export function useAdapter(next: StorageAdapter) {
  adapter = next;
  loaded = false;
  ensureLoaded();
  emit();
}

export function subscribe(fn: () => void) {
  ensureLoaded();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState(): State {
  ensureLoaded();
  return state;
}

const SERVER_STATE = empty();
export function getServerState(): State {
  return SERVER_STATE;
}

const rank: Record<ModuleStatus, number> = { started: 1, placed: 2, completed: 3, mastered: 4 };

export function setModuleStatus(id: string, status: ModuleStatus, score?: number) {
  commit((d) => {
    const prev = d.modules[id];
    const keep = prev && rank[prev.status] > rank[status] ? prev.status : status;
    d.modules[id] = {
      status: keep,
      updatedAt: Date.now(),
      score: Math.max(prev?.score ?? 0, score ?? 0) || undefined,
    };
    if (status !== 'placed') d.lastModule = id;
  });
}

export function markStarted(id: string) {
  const prev = getState().modules[id];
  if (prev) {
    if (getState().lastModule !== id) commit((d) => void (d.lastModule = id));
    return;
  }
  setModuleStatus(id, 'started');
}

export function isDone(status?: ModuleStatus) {
  return status === 'completed' || status === 'mastered' || status === 'placed';
}

export function saveGoal(kind: LearningGoal['kind'], targetDate: string, id?: string) {
  const goals = getState().goals ?? [];
  const previous = id ? goals.find((g) => g.id === id) : undefined;
  if (id && !previous) throw new Error('This goal is no longer available.');
  if (!previous && goals.length >= MAX_GOALS) throw new Error(`You can keep up to ${MAX_GOALS} goals. Remove one to add another.`);
  const now = Date.now();
  const goal: LearningGoal = { id: previous?.id ?? crypto.randomUUID(), kind, targetDate, createdAt: previous?.createdAt ?? now, updatedAt: now };
  if (!validGoal(goal)) throw new Error('Choose a goal and a valid target date.');
  if (targetDate < localDate() && targetDate !== previous?.targetDate) throw new Error('Choose today or a future target date.');
  commit((d) => { d.goals = previous ? (d.goals ?? []).map((g) => g.id === id ? goal : g) : [...(d.goals ?? []), goal]; }, false);
}

export function removeGoal(id: string) {
  commit((d) => { d.goals = (d.goals ?? []).filter((g) => g.id !== id); }, false);
}

export function recordCalibration(c: number, ok: boolean, src: CalibrationPoint['src']) {
  commit((d) => {
    d.calibration.push({ c, ok, t: Date.now(), src });
    if (d.calibration.length > 600) d.calibration = d.calibration.slice(-600);
  });
}

export function savePlacement(result: PlacementResult) {
  commit((d) => {
    d.placement = result;
    for (const id of result.placed) {
      const prev = d.modules[id];
      if (!prev || rank[prev.status] < rank.placed) d.modules[id] = { status: 'placed', updatedAt: Date.now() };
    }
  });
}

const DAY = 86_400_000;

/** Add items to the review deck (no-op for items already in it). */
export function enrollReview(keys: string[]) {
  commit((d) => {
    for (const k of keys) {
      if (!d.review[k]) d.review[k] = { ease: 2.5, interval: 1, due: Date.now() + DAY, reps: 0, lapses: 0 };
    }
  });
}

/**
 * SM-2 style update. quality: 0 (forgot) .. 5 (effortless). Confidence feeds
 * quality so a lucky guess is not rewarded like real recall.
 */
export function gradeReview(key: string, correct: boolean, confidence: number) {
  commit((d) => {
    const card = d.review[key] ?? { ease: 2.5, interval: 1, due: Date.now(), reps: 0, lapses: 0 };
    const q = correct ? (confidence >= 0.9 ? 5 : confidence >= 0.7 ? 4 : 3) : confidence >= 0.9 ? 0 : 1;
    if (q < 3) {
      card.lapses += 1;
      card.reps = 0;
      card.interval = 1;
    } else {
      card.reps += 1;
      card.interval = card.reps === 1 ? 1 : card.reps === 2 ? 4 : Math.round(card.interval * card.ease);
    }
    card.ease = Math.max(1.3, card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    card.due = Date.now() + card.interval * DAY;
    d.review[key] = card;
  });
}

export function dueReviews(now = Date.now()): string[] {
  const s = getState();
  return Object.entries(s.review)
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([k]) => k);
}

export function resetProgress() {
  adapter.clear();
  state = empty();
  emit();
}

export function exportProgress(): string {
  return JSON.stringify(getState(), null, 2);
}

export function importProgress(json: string) {
  const parsed = parseProgress(json) as State;
  state = { ...empty(), ...parsed };
  adapter.save(state);
  emit();
}

/** Brier score: mean squared gap between confidence and outcome. 0 is perfect, 0.25 is a coin. */
export function brier(points: CalibrationPoint[]): number {
  if (!points.length) return NaN;
  return points.reduce((s, p) => s + (p.c - (p.ok ? 1 : 0)) ** 2, 0) / points.length;
}

export function streakDays(activity: Record<string, number>): number {
  let n = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (activity[key]) {
      n++;
      d.setUTCDate(d.getUTCDate() - 1);
    } else if (n === 0 && key === new Date().toISOString().slice(0, 10)) {
      d.setUTCDate(d.getUTCDate() - 1);
    } else break;
  }
  return n;
}
