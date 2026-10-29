# WhatisAI

A professional learning environment with a path to mastery of AI: from first principles to fluently reading the frontier research corpus, meaning papers from Anthropic and OpenAI, system cards, and policy texts from bodies such as the European Commission, NIST, and the UK AI Security Institute.

It is adaptive (an optional placement exam, mastery checks, spaced review, and readiness tracking) and current (a daily watcher scrapes the field and publishes only when something significant happens).

## What's inside

| Area | What it is |
| --- | --- |
| **Discovery challenge** | A three-minute, account-free prediction → experiment → takeaway on the homepage. Uses the existing lesson’s seeded polynomial simulation, with text results, keyboard controls, and a credited research caveat. It does not call a model or award mastery. |
| **Explore** | Four intent-based routes at `/explore/`: understand AI, read research and safety, put AI to work, and anticipate change. Each links three existing lessons and a practical activity; module references are checked at build time. |
| **The path** | 10 tracks, 53 modules, about 24 hours. Prologue → Foundations (math from zero) → Learning Machines → Language Models → From Model to Assistant → Measuring Minds → Inside the Machine → AI and the Economy → Governing AI → The Frontier (guided readings). |
| **Interactives** | 20+ instruments: a neural network trained live in the browser, a BPE tokenizer that learns its merges live, an attention explorer, a Chinchilla scaling-law calculator, a real toy model of superposition, an RLHF rater game, and more. |
| **Assessment** | ~265 items: multiple choice, select-all, matching, ordering, log-scale estimates, and figure hotspots, every one with a confidence wager. |
| **Placement exam** | Optional. Binary-searches each track for the edge of your knowledge (about 3 questions per track), with confidence wagers, an "I don't know" option, and a constellation results map. |
| **Spaced review** | SM-2-style scheduling of every mastery item, plus a calibration record scored with the Brier score. |
| **Learning goals** | Set conversational or full-path mastery goals with target dates from Your progress. See verified lessons, a next lesson, and a weekly reading-time estimate. Edit dates as plans change; goals are included in progress exports and account cloud saves. |
| **Research library** | ~40 landmark documents, each listing the modules that make it readable. Documents unlock as you progress. |
| **Signals** | Significant developments, written by the watcher (or an editor) and linked to the modules that explain them. RSS at `/signals.xml`. |
| **Trend radar** | Rising topics, weekly volume, and an "On the radar" list of notable articles and media from the daily scrape. |
| **Method** | The research basis: backward design from the corpus, labor-market evidence, and learning science, with citations. |

Progress saves automatically in the browser, separately for guests and each Google account. Optional Firebase Authentication and Firestore add Google login, private cloud save/restore, and self-service deletion. Cloud saves are manual. See [docs/PUBLIC-LAUNCH.md](docs/PUBLIC-LAUNCH.md) for the free Spark setup, database rules, build variables, and launch checks. Without Firebase configuration, the site stays fully usable for guests.

Public pages include share controls, canonical URLs, Open Graph/Twitter previews, a sitemap at `/sitemap.xml`, and privacy information. Sharing never includes account details or progress.

## Visitor analytics

Optional PostHog analytics counts visits and learning interactions after visitor consent. The configured project uses the capped Free plan. See [docs/ANALYTICS.md](docs/ANALYTICS.md) for dashboard links, events, privacy controls, testing, and the no-cost setup.

## Running locally

```bash
npm ci
npm run dev        # http://localhost:4321/WhatisAI/
npm run build      # static site in dist/
```

Validation: `npm test` runs offline regression tests for the shared discovery simulation, trend history, media extraction/safety, and feed-to-publication metadata preservation. `npm run check`, `npm run validate`, and `npm run build` check types, signals, and the complete site. CI runs these checks.

For browser regressions, install Chromium with `npx playwright install chromium` (or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an installed Chromium), then run `npm run test:ui`. The test builds an isolated temporary copy with synthetic publisher previews, intercepts every external request, and checks keyboard prediction and replay, all four lesson routes, no-JavaScript navigation, desktop/mobile layouts, empty and repeated placement, low-confidence scoring, and successful/missing/broken/unsafe/opted-out image states. It does not publish fixtures or change production data. Screenshots go to the system temporary directory under `whatisai-ui-artifacts`, or `UI_ARTIFACT_DIR` when set.

The build runs a curriculum integrity check (`src/pages/curriculum.json.ts`): broken module references, malformed items, or hotspot questions on figures without clickable regions fail the build. While drafting, `CURRICULUM_LENIENT=1 npm run build` downgrades those errors to warnings. CI is always strict.

## Deploying (GitHub Pages)

1. In the repository's **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Push to `main`. `.github/workflows/deploy.yml` builds and deploys to `https://<user>.github.io/WhatisAI/`.

To use a custom domain, set `SITE_URL` and `SITE_BASE=/` in the deploy workflow's environment.

## The daily watcher

See [docs/WATCHER.md](docs/WATCHER.md) for how it works and how to turn on the Claude editor. In short: it scrapes ~28 public sources every morning for free, scores stories for significance, and publishes only when one clears the bar. **It is designed so that it can never spend money.**

## Adding content

- **A module:** add `src/content/modules/<id>.mdx` with the frontmatter schema in `src/content.config.ts`, and its mastery items in `src/data/items/t<N>.ts`. Run `python3 scripts/quote-frontmatter.py` if any frontmatter value contains a colon.
- **A signal:** add `src/content/signals/YYYY-MM-DD-slug.md` (see existing files), then `npm run validate`.
- **A library document:** add an entry to `src/data/corpus.ts`, listing the module ids it requires.
- **A figure for hotspot questions:** add it to `src/components/figures/registry.tsx` and to `hotspotFigures`.

## Stack

Astro 5 (static output) with React islands for interactivity and MDX for lessons. No CSS framework: the design system lives in `src/styles/global.css`, with light and dark themes and painterly gradient "auras." Fonts are self-hosted via Fontsource (Inter, Source Serif 4, JetBrains Mono).
