# The homepage

The homepage opens with the next lesson and a direct start or resume link. A new learner starts with the first lesson in curriculum order. An unfinished saved goal takes priority when available. The panel shows progress, links to the full path and goal planner, and offers review when the plan is complete. The first lesson is accessible with JavaScript disabled.

Below the plan, a featured Signal connects to a visual, an intuition question, and a lesson.

To feature another story:

1. Verify its primary source and add or update the Signal in `src/content/signals/`.
2. Update `src/data/homeFeature.ts` as one unit: Signal ID, headline, context, visual counts, question and answer explanations, and lesson ID. Keep the explanation suitable for a first-time visitor.
3. The current visual is a count of affected runs out of a total. If a different story needs a different visual, update the figure in `src/pages/index.astro` too. Do not reuse this chart for unrelated data.
4. Update `lessonAnchor` (`the-agent-loop` for the current feature) and the agent-loop illustration if the topic changes. The guided-learning time comes from the curriculum; do not replace it with a shorter marketing estimate.
5. Update the story-specific assertions in `tests/ui.mjs`, then run `npm run check`, `npm run build`, `npm run test:ui`, and `npm run test:analytics`.

The date and source link come from the selected Signal. Other stories are the three most recent remaining Signals. The homepage does not claim a daily refresh or automatically publish new features.

The question uses the existing consent-controlled discovery events with `widget: story-question`. Answers and correctness are not sent or saved, and completing it does not mark a lesson mastered. The lesson and source remain available without answering; JavaScript-disabled visitors receive a static explanation.

The original curve-fitting experiment lives at `/discover/`.

The homepage uses `BaseLayout` with `quiet` navigation and footer. Other pages retain the full navigation. The count graphic and test context are available under “The test in numbers” to keep the initial view focused.
