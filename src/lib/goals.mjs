export const goalTypes = [
  {
    id: 'conversational',
    title: 'Conversational in AI',
    description: 'Explain how AI learns and generates answers, discuss useful applications, and question capability claims.',
    evidence: 'Pass the mastery checks for eight core lessons, or place out of them.',
    modules: ['welcome', 'neural-networks', 'tokens', 'inference', 'agents-and-tools', 'benchmarks', 'evidence-on-work', 'governance-landscape'],
  },
  {
    id: 'mastery',
    title: 'Master the full path',
    description: 'Build from first principles to reading frontier research, safety evaluations, and policy documents.',
    evidence: 'Pass every module’s mastery check (80% or higher). Placement alone does not count toward this goal.',
    modules: null,
  },
];

export const MAX_GOALS = 12;
const DAY = 86_400_000;

/** A local calendar date, independent of UTC offset or daylight-saving changes. */
export function localDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01') return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

export function validGoal(g) {
  return g !== null && typeof g === 'object' && !Array.isArray(g) &&
    typeof g.id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(g.id) &&
    goalTypes.some((type) => type.id === g.kind) && validDate(g.targetDate) &&
    Number.isFinite(g.createdAt) && g.createdAt >= 0 &&
    Number.isFinite(g.updatedAt) && g.updatedAt >= g.createdAt;
}

/** @template {{id: string, minutes: number}} M
 * @param {{kind: string, targetDate: string}} goal
 * @param {M[]} modules
 * @param {Record<string, {status: string}>} progress
 * @param {string} today
 */
export function goalPlan(goal, modules, progress, today = localDate()) {
  const type = goalTypes.find((t) => t.id === goal.kind);
  if (!type || !validDate(goal.targetDate) || !validDate(today)) throw new Error('Invalid learning goal.');
  const required = type.modules ? type.modules.map((id) => {
    const module = modules.find((m) => m.id === id);
    if (!module) throw new Error(`Goal lesson is missing: ${id}`);
    return module;
  }) : modules;
  const remaining = required.filter((m) => {
    const status = progress[m.id]?.status;
    return status !== 'mastered' && !(goal.kind === 'conversational' && status === 'placed');
  });
  const daysLeft = Math.round((Date.parse(`${goal.targetDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY);
  const remainingMinutes = remaining.reduce((sum, m) => sum + m.minutes, 0);
  // Include today as an available study day. Past targets have no suggested pace.
  const weeks = Math.max(1, (daysLeft + 1) / 7);
  return {
    type, required, remaining, next: remaining[0], daysLeft,
    done: required.length - remaining.length,
    achieved: required.length > 0 && remaining.length === 0,
    remainingMinutes,
    weeklyMinutes: daysLeft < 0 ? null : Math.ceil(remainingMinutes / weeks),
    weeklyModules: daysLeft < 0 ? null : Math.ceil(remaining.length / weeks),
  };
}
