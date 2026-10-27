/** Build comparable windows from observed days, never from missing-day zeroes.
 * A full week and preceding four weeks are required before publishing lifts.
 * @param {Record<string, Record<string, number | boolean>>} termDays
 * @param {{term: string, modules: string[]}[]} watchlist
 * @param {string} date
 * @param {{id: string, name?: string, ok: boolean, count: number}[]} sources
 */
export function buildTrends(termDays, watchlist, date, sources = []) {
  const end = Date.parse(`${date}T00:00:00Z`);
  const days = Number.isFinite(end) ? Array.from({ length: 35 }, (_, i) => new Date(end - (34 - i) * 86400000).toISOString().slice(0, 10)) : [];
  const observed = (/** @type {string} */ day) => {
    const row = termDays[day];
    return row && row.__observed !== false && typeof row.__items === 'number' && Number.isFinite(row.__items) && row.__items >= 0;
  };
  const count = (/** @type {string} */ day, /** @type {string} */ key) => {
    const n = termDays[day]?.[key];
    return observed(day) && typeof n === 'number' && Number.isFinite(n) ? Math.max(0, n) : 0;
  };
  const recentDays = days.slice(-7);
  const baseDays = days.slice(0, 28);
  const recentObservedDays = recentDays.filter(observed).length;
  const baselineObservedDays = baseDays.filter(observed).length;
  const recentVol = recentDays.reduce((n, d) => n + count(d, '__items'), 0);
  const baseVol = baseDays.reduce((n, d) => n + count(d, '__items'), 0);
  const comparisonReady = recentObservedDays === 7 && baselineObservedDays === 28 && recentVol > 0 && baseVol > 0;
  const series = watchlist.map((w) => {
    const s = days.map((d) => count(d, w.term));
    const recent = s.slice(-7).reduce((a, b) => a + b, 0);
    const base = s.slice(0, 28).reduce((a, b) => a + b, 0);
    const share = recent / Math.max(1, recentVol);
    // Zero topic observations are valid within an otherwise observed baseline.
    const lift = comparisonReady ? Number(((share + 0.002) / (base / baseVol + 0.002)).toFixed(2)) : null;
    return { term: w.term, modules: w.modules, recent, base, share, lift, series: s.slice(-28) };
  });
  return {
    updated: date, windowDays: 7, baselineDays: 28,
    daysOfHistory: Object.keys(termDays).filter(observed).length,
    recentObservedDays, baselineObservedDays, comparisonReady,
    itemsLastWeek: recentVol,
    rising: series.filter((s) => s.lift !== null && s.recent >= 3 && s.lift >= 1.4).sort((a, b) => (b.lift ?? 0) - (a.lift ?? 0)).slice(0, 10),
    volume: series.filter((s) => s.recent > 0).sort((a, b) => b.recent - a.recent).slice(0, 14),
    sources,
  };
}

/** Accumulate newly deduplicated items so a repeat scrape cannot erase counts.
 * @param {Record<string, number | boolean>} previous
 * @param {Record<string, number>} counts
 * @param {number} items
 * @param {boolean} observed
 */
export function addObservation(previous, counts, items, observed) {
  const next = { ...previous };
  for (const [term, n] of Object.entries(counts)) next[term] = Number(previous[term] ?? 0) + n;
  next.__items = Number(previous.__items ?? 0) + items;
  next.__observed = previous.__observed === true || (previous.__observed !== false && typeof previous.__items === 'number') || observed;
  return next;
}
