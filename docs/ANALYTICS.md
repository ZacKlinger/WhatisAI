# Visitor and interaction analytics

WhatisAI uses PostHog Cloud US. The public project token in `src/data/analytics.json` is an ingestion identifier, not a personal API credential. It works in the existing static GitHub Pages deployment without a backend or secret. Optional environment overrides are listed in `.env.example`; an explicitly empty `PUBLIC_POSTHOG_KEY` disables tracking.

- [Visitor reports](https://us.posthog.com/project/693178/web): visitors, sessions, popular pages, referring domains, browsers, and devices.
- [WhatisAI visitors and learning](https://us.posthog.com/project/693178/dashboard/2269885): visitor counts, sessions, return visits, referrals, learning activity, and mastery check completion.
- [Activity](https://us.posthog.com/project/693178/activity/events): confirm incoming events.
- [Product analytics](https://us.posthog.com/project/693178/insights): create trends and funnels from the events below.

## Keep it free

The project uses the **Free** plan, with no payment card. As verified during setup, it includes 1 million analytics events per month and stops ingestion at its free limit. Do not switch to pay-as-you-go or add a payment method. Session replay, surveys, feature flags, exception capture, performance capture, and automatic click/form capture are disabled in the integration. No paid service or server is required.

Official references: [pricing](https://posthog.com/pricing), [billing limits](https://posthog.com/docs/billing/limits-alerts), [SDK](https://posthog.com/docs/libraries/js).

## What is measured

Discovery and sharing events apply when those components are present. The analytics-only release instruments the existing lessons, simulations, mastery checks, placement, and review.

| Event | Meaning / properties |
| --- | --- |
| `$pageview`, `$pageleave` | Page opened/left; cleaned page path, referral domain; elapsed duration on leave |
| `navigation_clicked` | Navigation to another local page; destination path |
| `outbound_clicked` | External HTTP link; destination hostname only |
| `reading_depth` | 25/50/75/100% scroll thresholds, once each per page visit |
| `interactive_used` | First control interaction with each lesson simulation per page; static widget name |
| `discovery_started`, `discovery_completed` | Homepage challenge reveal and final takeaway |
| `lesson_read` | User chooses Mark as read; module ID |
| `mastery_started`, `mastery_completed` | Mastery attempt started/finished; module ID, no score |
| `placement_started`, `placement_completed` | Placement begun/finished; skipping all questions is not completion |
| `review_started`, `review_completed` | Review session begun/finished |
| `share_completed` | Successful native share or clipboard copy; method |

Visitors must opt in before the SDK initializes or sends data. Decline and withdrawal disable collection; Do Not Track and Global Privacy Control override opt-in. “Analytics preferences” is available at the bottom of every page. A random browser identifier is kept in local storage after consent; it is never connected to account identity. Outbound data passes an event/property allowlist; query strings, fragments, quiz answers, scores, goal dates, forms, and account details are excluded. Sessions are not recorded.

Counts cover consenting, unblocked browsers, not every person. Multiple browsers/devices or cleared storage can count one person more than once. Scroll depth indicates movement through the page, not proof of comprehension. Leaving a background tab open can increase elapsed duration. Collection begins after deployment; no historical visits can be recovered.

Useful funnels: `$pageview` → `discovery_started` → `discovery_completed`, and `$pageview` (lesson path) → `mastery_started` → `mastery_completed`. Break learning events down by `module_id` and interactive use by `widget`.

## Verification

Localhost and development builds are excluded by default. For an isolated local test, set `PUBLIC_POSTHOG_ALLOW_LOCALHOST=true` and use a test project token. Never send synthetic traffic to the live project. `npm run test:analytics` runs a temporary build, intercepts all external requests, and checks consent, network payloads, interactions, withdrawal, privacy signals, and blocked storage.

After deploying, open the live site, allow analytics, visit a lesson, and check Activity in PostHog. Blockers can suppress collection without breaking the site. Do not add a second analytics snippet or Firebase Analytics, which would double-count visits and bypass these controls.
