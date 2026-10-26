import { useEffect, useState, useSyncExternalStore } from 'react';
import { getServerState, getState, subscribe, type State } from './progress';

export function useProgress(): State {
  return useSyncExternalStore(subscribe, getState, getServerState);
}

/** True after the first client render, so progress-dependent UI can avoid hydration mismatch. */
export function useHydrated(): boolean {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
