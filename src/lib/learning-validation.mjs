/** Validate the editorial contract without making build-time network requests. */
export function validateLearningMedia(resources, plans, moduleIds) {
  const errors = [];
  const ids = new Set(moduleIds);
  const https = (value) => {
    try { const u = new URL(value); return u.protocol === 'https:' && !!u.hostname && !u.username && !u.password; }
    catch { return false; }
  };
  for (const [id, r] of Object.entries(resources)) {
    for (const field of ['title', 'creator', 'kind', 'note', 'reviewed']) {
      if (typeof r[field] !== 'string' || !r[field].trim()) errors.push(`${id}: missing ${field}`);
    }
    if (!https(r.url)) errors.push(`${id}: requires HTTPS source URL`);
    for (const field of ['alternativeUrl', 'licenseUrl']) if (r[field] && !https(r[field])) errors.push(`${id}: invalid ${field}`);
    if (r.youtubeId && (!/^[\w-]{11}$/.test(r.youtubeId) || r.url !== `https://www.youtube.com/watch?v=${r.youtubeId}`)) errors.push(`${id}: invalid YouTube identity`);
    if (r.youtubeId && !r.alternativeUrl) errors.push(`${id}: video needs a reading alternative`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.reviewed ?? '') || !Number.isFinite(Date.parse(r.reviewed))) errors.push(`${id}: invalid review date`);
  }
  for (const id of ids) if (!plans[id]) errors.push(`${id}: missing curated plan`);
  for (const [id, plan] of Object.entries(plans)) {
    if (!ids.has(id)) errors.push(`${id}: plan has no module`);
    if (!Array.isArray(plan.steps) || plan.steps.length < 2) { errors.push(`${id}: needs two curated steps`); continue; }
    const seen = new Set();
    let external = 0;
    for (const step of plan.steps) {
      if (!resources[step.resource]) errors.push(`${id}: unknown resource ${step.resource}`);
      if (seen.has(step.resource)) errors.push(`${id}: duplicate resource`);
      seen.add(step.resource);
      if (!Number.isInteger(step.minutes) || step.minutes < 1) errors.push(`${id}: invalid study time`);
      if (typeof step.focus !== 'string' || step.focus.trim().length < 30) errors.push(`${id}: missing specific assignment`);
      external += step.minutes;
    }
    if (!Number.isInteger(plan.practiceMinutes) || plan.practiceMinutes < 1) errors.push(`${id}: invalid practice time`);
    if (external / (external + plan.practiceMinutes) < 0.7) errors.push(`${id}: less than 70% external study time`);
    if (typeof plan.reflection !== 'string' || plan.reflection.trim().length < 30) errors.push(`${id}: missing synthesis task`);
  }
  return errors;
}
