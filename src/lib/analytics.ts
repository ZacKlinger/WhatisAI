import config from '@/data/analytics.json';
import { cleanUrl, sanitizeEvent } from './analytics-data.mjs';
import type { PostHog } from 'posthog-js/dist/module.no-external';

const KEY = 'whatisai:analytics-consent:v1';
const token = import.meta.env.PUBLIC_POSTHOG_KEY ?? config.key;
const host = import.meta.env.PUBLIC_POSTHOG_HOST ?? config.host;
type Choice = 'accepted' | 'declined' | null;
type Event = 'navigation_clicked' | 'outbound_clicked' | 'reading_depth' | 'lesson_read' |
  'interactive_used' | 'discovery_started' | 'discovery_completed' | 'mastery_started' |
  'mastery_completed' | 'placement_started' | 'placement_completed' | 'review_started' |
  'review_completed' | 'share_completed';
let client: PostHog | undefined;
let loading: Promise<void> | undefined;
let consent: Choice = null;
let initialized = false;
let viewed = false;
let viewStarted = 0;
let left = false;

export function analyticsAvailable() {
  return typeof window !== 'undefined' && /^phc_[a-zA-Z0-9]+$/.test(token) &&
    ['https://us.i.posthog.com', 'https://eu.i.posthog.com'].includes(host) &&
    (import.meta.env.PUBLIC_POSTHOG_ALLOW_LOCALHOST === 'true' ||
      (!import.meta.env.DEV && !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)));
}

function privacySignal() {
  return navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

export function analyticsChoice(): Choice {
  if (typeof window === 'undefined') return null;
  if (privacySignal()) return 'declined';
  return consent;
}

function allowed() { return analyticsAvailable() && analyticsChoice() === 'accepted'; }
function context() {
  return { $current_url: cleanUrl(location.href), $pathname: location.pathname, $host: location.host };
}

async function start() {
  if (!allowed()) return;
  if (client) { client.opt_in_capturing({ captureEventName: false }); pageview(); return; }
  if (loading) return loading;
  loading = (async () => {
    try {
      // Bundled locally, loaded only after consent. No replay or remote extensions.
      const { default: posthog } = await import('posthog-js/dist/module.no-external');
      if (!allowed()) return;
      posthog.init(token, {
        api_host: host,
        persistence: 'localStorage',
        opt_out_persistence_by_default: true,
        person_profiles: 'never',
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_dead_clicks: false,
        capture_heatmaps: false,
        capture_performance: false,
        capture_exceptions: false,
        disable_session_recording: true,
        disable_surveys: true,
        advanced_disable_flags: true,
        save_campaign_params: false,
        save_referrer: false,
        ip: false,
        respect_dnt: true,
        before_send: (event) => allowed() ? sanitizeEvent(event) : null,
      });
      client = posthog;
      client.opt_in_capturing({ captureEventName: false });
      pageview();
    } catch (error) {
      if (import.meta.env.PUBLIC_POSTHOG_ALLOW_LOCALHOST === 'true') console.warn('Analytics initialization failed', error);
    }
    finally { loading = undefined; }
  })();
  return loading;
}

function pageview() {
  if (!allowed() || !client || viewed) return;
  viewed = true; left = false; viewStarted = Date.now();
  let referrer = '';
  try { referrer = new URL(document.referrer).origin + '/'; } catch {}
  client.capture('$pageview', { ...context(), $referrer: referrer, $referring_domain: referrer ? new URL(referrer).hostname : '$direct' });
}

export function trackAnalytics(event: Event, properties: Record<string, string | number> = {}) {
  if (!allowed()) return;
  // Capture the page now; never backfill events from before consent.
  const data = { ...properties, ...context() };
  if (client) client.capture(event, data);
  else void start().then(() => { if (allowed()) client?.capture(event, data); });
}

export function setAnalyticsChoice(choice: Exclude<Choice, null>) {
  consent = privacySignal() ? 'declined' : choice;
  try { localStorage.setItem(KEY, consent); } catch {}
  if (consent === 'accepted') void start();
  else {
    client?.opt_out_capturing();
    // Clear SDK persistence and unload its listeners after withdrawal.
    if (client) location.reload();
  }
  window.dispatchEvent(new Event('analytics-choice'));
}

export function initializeAnalytics() {
  if (initialized || !analyticsAvailable()) return;
  initialized = true;
  try { const saved = localStorage.getItem(KEY); consent = saved === 'accepted' || saved === 'declined' ? saved : null; } catch {}
  void start();
  window.addEventListener('storage', (event) => {
    if (event.key !== KEY && event.key !== null) return;
    consent = event.newValue === 'accepted' ? 'accepted' : event.newValue === 'declined' ? 'declined' : null;
    if (!allowed()) { client?.opt_out_capturing(); if (client) location.reload(); }
    else void start();
    window.dispatchEvent(new Event('analytics-choice'));
  });
  const widgets = new WeakSet<Element>();
  const interact = (event: globalThis.Event) => {
    if (!allowed() || !(event.target instanceof Element)) return;
    const control = event.target.closest('button,input,select,[role="button"]');
    const widget = control?.closest<HTMLElement>('[data-analytics-widget]');
    if (widget && !widgets.has(widget)) {
      widgets.add(widget);
      trackAnalytics('interactive_used', { widget: widget.dataset.analyticsWidget! });
    }
  };
  document.addEventListener('change', interact);
  document.addEventListener('click', (event) => {
    interact(event);
    if (!allowed() || !(event.target instanceof Element)) return;
    const anchor = event.target.closest('a');
    if (!anchor) return;
    const target = new URL(anchor.href, location.href);
    if (!/^https?:$/.test(target.protocol)) return;
    if (target.origin !== location.origin) trackAnalytics('outbound_clicked', { destination: target.hostname });
    else if (target.pathname !== location.pathname) trackAnalytics('navigation_clicked', { destination: target.pathname });
  });
  const depths = new Set<number>();
  window.addEventListener('scroll', () => {
    if (!allowed()) return;
    const distance = document.documentElement.scrollHeight - innerHeight;
    if (distance <= 0) return;
    const percent = Math.round(scrollY / distance * 100);
    for (const depth of [25, 50, 75, 100]) if (percent >= depth && !depths.has(depth)) {
      depths.add(depth); trackAnalytics('reading_depth', { percent: depth });
    }
  }, { passive: true });
  window.addEventListener('pagehide', () => {
    if (allowed() && viewed && !left) {
      left = true;
      client?.capture('$pageleave', { ...context(), duration_seconds: Math.round((Date.now() - viewStarted) / 1000) }, { transport: 'sendBeacon' });
    }
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) { viewed = false; depths.clear(); pageview(); }
  });
}
