# WhatisAI

A professional learning environment with a path to mastery of AI: from first principles to fluently reading the frontier research corpus, meaning papers from Anthropic and OpenAI, system cards, and policy texts from bodies such as the European Commission, NIST, and the UK AI Security Institute.

It is adaptive (an optional placement exam, mastery checks, spaced review, and readiness tracking) and current (a daily watcher scrapes the field and publishes only when something significant happens).

## What's inside

| Area | What it is |
| --- | --- |
| **The path** | 10 tracks, 53 modules, about 24 hours. Prologue → Foundations (math from zero) → Learning Machines → Language Models → From Model to Assistant → Measuring Minds → Inside the Machine → AI and the Economy → Governing AI → The Frontier (guided readings). |
| **Interactives** | 20+ instruments: a neural network trained live in the browser, a BPE tokenizer that learns its merges live, an attention explorer, a Chinchilla scaling-law calculator, a real toy model of superposition, an RLHF rater game, and more. |
| **Assessment** | ~265 items: multiple choice, select-all, matching, ordering, log-scale estimates, and figure hotspots, every one with a confidence wager. |
| **Placement exam** | Optional. Binary-searches each track for the edge of your knowledge (about 3 questions per track), with confidence wagers, an "I don't know" option, and a constellation results map. |
| **Spaced review** | SM-2-style scheduling of every mastery item, plus a calibration record scored with the Brier score. |
| **Research library** | ~40 landmark documents, each listing the modules that make it readable. Documents unlock as you progress. |
| **Signals** | Significant developments, written by the watcher (or an editor) and linked to the modules that explain them. RSS at `/signals.xml`. |
| **Trend radar** | Rising topics, weekly volume, and an "On the radar" list of notable articles and media from the daily scrape. |
| **Method** | The research basis: backward design from the corpus, labor-market evidence, and learning science, with citations. |

Progress is stored in the browser (`localStorage`) behind a `StorageAdapter` interface (`src/lib/progress.ts`), so it can later be swapped for an account-backed store when WhatisAI becomes a public product. Learners can export and import their progress from `/progress/`.

## Running locally

```bash
npm ci
npm run dev        # http://localhost:4321/WhatisAI/
npm run build      # static site in dist/
```

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
