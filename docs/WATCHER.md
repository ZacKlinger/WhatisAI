# The daily watcher

Every morning at 11:17 UTC, `.github/workflows/watch.yml` reads the field and decides whether anything deserves a published signal. Most days, the answer is no.

## What it does

1. **Scrape** (`scripts/watch/scrape.mjs`). Reads the sources in `scripts/watch/sources.json`: frontier labs, arXiv, Hugging Face Daily Papers, METR, Epoch AI, the US Federal Register, the European Commission, the UK AI Security Institute, NIST, NBER, Stanford's Digital Economy Lab, journalism, podcasts, and Hacker News. Each item is fingerprinted; only never-seen items count as news. On a source's first run, its backlog is marked as seen rather than treated as news. A failing source is logged and skipped.
2. **Measure trends.** Counts mentions of the ~30 topics in `scripts/watch/watchlist.json` and compares each topic's share of the last 7 days with the previous 28. Output: `data/watch/trends.json`.
3. **Gate** (`scripts/watch/gate.mjs`). Clusters the last three days of items into stories and scores each:
   `0.35 × source authority + 0.30 × corroboration + 0.25 × impact markers + 0.10 × engagement`,
   with a floor for primary lab or policy sources that carry strong impact markers (a system card, a law taking effect). The top stories go into a daily digest (`data/watch/digest/`), which feeds the trend radar's "On the radar" list. Stories above the threshold (default 0.58) become candidates.
4. **Edit.** If there are candidates:
   - With a Claude subscription token configured, **Claude** reads `scripts/watch/JUDGE_PROMPT.md`, opens the primary sources, verifies facts, decides whether anything truly matters, and writes at most two signals.
   - Without it, a stricter **heuristic publisher** writes an extractive signal (titles, excerpts, links, no unverified prose) only for stories scoring at least 0.8.
5. **Validate** (`scripts/watch/validate-signals.mjs --new`). Malformed signals, or signals linking to modules that do not exist, are deleted and their stories recorded as rejected, so they are never re-proposed.
6. **Commit and deploy.** Watcher data and any new signals are committed to `main`. The site redeploys only when a signal was published, or on Sundays to refresh the trend radar.

## Turning on the Claude editor

The editor uses your Claude **subscription**, through the official `anthropics/claude-code-action`, never a pay-per-use API key.

1. On your computer, with Claude Code installed and logged in to your Pro or Max account, run:
   ```bash
   claude setup-token
   ```
2. In the repository, go to **Settings → Secrets and variables → Actions → New repository secret**. Name it `CLAUDE_CODE_OAUTH_TOKEN` and paste the token.
3. Optionally, run the workflow manually from the **Actions** tab ("Daily watcher" → "Run workflow").

## Why it can never spend money

The watcher has several independent locks:

| Lock | Where |
| --- | --- |
| Scraping uses only public, unauthenticated feeds. No paid API is ever called. | `scripts/watch/*.mjs` |
| Every script refuses to run if `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or other paid-API credentials are present in its environment. | `assertNoSpend()` in `scripts/watch/lib.mjs` |
| The workflow fails immediately if an `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` secret exists in the repository. | "Zero-spend guard" step in `watch.yml` |
| The Claude step passes only `claude_code_oauth_token` (your subscription), never `anthropic_api_key`. | `watch.yml` |
| Claude runs only on days with candidates, on the Sonnet model, with at most 30 turns and a restricted tool list. | `watch.yml` |
| Every job has a timeout. This repository is public, so GitHub Actions minutes are free. | `watch.yml`, `deploy.yml` |

**One setting is yours to check:** in your Claude account's billing settings, keep **extra usage** turned off. Then subscription usage cannot overflow into paid usage. If a heavy day exhausts your plan's limits, the editor step simply fails and the watcher still commits its scrape data.

## Tuning

- **Sources:** edit `scripts/watch/sources.json`. Set `filter: true` on general feeds so only AI-related items are kept, and `trendOnly: true` for high-volume feeds that should inform trends but never become signals.
- **Topics:** edit `scripts/watch/watchlist.json`, including the modules each topic links to.
- **Thresholds:** `WATCH_THRESHOLD` (gate, default 0.58) and `HEURISTIC_BAR` (fallback publisher, default 0.8) can be set as workflow environment variables.
- **Editorial bar:** edit `scripts/watch/JUDGE_PROMPT.md`.
