// Only these intentional events/properties may leave the browser. No DOM text,
// form values, account identifiers, answers, scores, or progress exports.
export const EVENTS = new Set([
  '$pageview', '$pageleave', 'navigation_clicked', 'outbound_clicked', 'reading_depth',
  'lesson_read', 'interactive_used', 'discovery_started', 'discovery_completed',
  'mastery_started', 'mastery_completed', 'placement_started', 'placement_completed',
  'review_started', 'review_completed', 'share_completed',
]);
const PROPERTIES = new Set([
  'token', 'distinct_id', '$device_id', '$session_id', '$window_id', '$lib', '$lib_version',
  '$browser', '$browser_version', '$os', '$os_version', '$device_type', '$screen_height',
  '$screen_width', '$viewport_height', '$viewport_width', '$is_identified', '$process_person_profile',
  '$current_url', '$pathname', '$host', '$referrer', '$referring_domain',
  'module_id', 'destination', 'widget', 'percent', 'method', 'duration_seconds',
]);

export function cleanUrl(value) {
  try {
    const parsed = new URL(value);
    return /^https?:$/.test(parsed.protocol) ? `${parsed.origin}${parsed.pathname}` : '';
  } catch { return ''; }
}

export function sanitizeEvent(event) {
  if (!event || !EVENTS.has(event.event)) return null;
  const properties = {};
  for (const [key, value] of Object.entries(event.properties ?? {})) {
    if (!PROPERTIES.has(key) || !['string', 'number', 'boolean'].includes(typeof value)) continue;
    if (key === '$current_url') properties[key] = cleanUrl(value);
    else if (key === '$referrer') {
      try { properties[key] = new URL(cleanUrl(value)).origin + '/'; } catch { properties[key] = ''; }
    } else properties[key] = typeof value === 'string' ? value.slice(0, 500) : value;
  }
  return { event: event.event, properties, timestamp: event.timestamp, uuid: event.uuid };
}
