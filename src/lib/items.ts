/** Assessment items shared by mastery checks, spaced review, and the placement exam. */

export interface FigureSpec {
  /** Key in the figure registry (src/components/figures/registry.tsx). */
  id: string;
  props?: Record<string, unknown>;
}

interface Base {
  id: string;
  prompt: string;
  explain: string;
  figure?: FigureSpec;
  /** Prefer this item when the placement exam probes the module. */
  placement?: boolean;
}

export interface MCItem extends Base {
  kind: 'mc';
  choices: string[];
  answer: number;
}

export interface MultiItem extends Base {
  kind: 'multi';
  choices: string[];
  answers: number[];
}

export interface MatchItem extends Base {
  kind: 'match';
  /** Correct pairs, left to right. The right column is shuffled when shown. */
  pairs: [string, string][];
}

export interface OrderItem extends Base {
  kind: 'order';
  /** Items in their correct order. Shuffled when shown. */
  items: string[];
}

export interface EstimateItem extends Base {
  kind: 'estimate';
  min: number;
  max: number;
  log?: boolean;
  answer: number;
  /** For log scales, the allowed multiplicative error (e.g. 3 = within 3x). Otherwise absolute. */
  tolerance: number;
  unit?: string;
  format?: 'sci' | 'int' | 'pct' | 'dec';
}

export interface HotspotItem extends Base {
  kind: 'hotspot';
  figure: FigureSpec;
  /** Region id inside the figure that is correct. */
  answer: string;
}

export type Item = MCItem | MultiItem | MatchItem | OrderItem | EstimateItem | HotspotItem;

export type ItemBank = Record<string, Item[]>;

export function itemKey(moduleId: string, itemId: string): string {
  return `${moduleId}/${itemId}`;
}

/** Deterministic shuffle so server and client agree on first render. */
export function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
