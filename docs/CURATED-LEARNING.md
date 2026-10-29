# Curated learning

The main lesson experience is an ordered sequence of external teaching, followed by a synthesis task and the existing mastery check. Original MDX explanations and simulations remain in expandable supporting notes. A link click or video play never awards mastery.

## Editorial contract

- `src/data/learning-resources.json` holds credited, canonical source URLs, formats, context/limitations, review dates, optional reading alternatives, and optional YouTube IDs.
- `src/data/learning-paths.json` holds explicit, module-specific selections, study budgets, focus instructions, and a synthesis question. There is no fallback that promotes arbitrary bibliography entries into teaching material.
- Every module needs at least two distinct sources and at least 70% of its suggested core study time allocated to external study. The plans currently cover 54 modules, including the new practical AI Fluency module.
- Study budgets include pauses, reading, or exploration of a named portion. They are not claimed runtimes. Optional local notes are extra. `getModules()` derives the displayed module time from the plan so routes, goals, and the path agree.
- Prefer a visual or hands-on entry point for foundations. Advanced guided-reading modules deliberately center papers and policy texts. Use the publisher's original account, and label historical examples and lab perspectives.
- Long lectures need a named topic/portion. Never invent timecodes. Whole-video assignments must allocate enough time to watch and pause.
- Choose publicly readable material. Course providers may require accounts to retain progress or issue badges; that is separate from WhatisAI. If source access changes, replace the assignment with a substantive equivalent.

## Source review: 2026-10-29

The catalog was checked against publisher pages, official course pages, research landing pages, and/or indexed publisher metadata. These checks establish source identity and topic fit; they do not certify uninterrupted playback, complete accessibility, every interactive control, or every geographic access condition. NBER landing pages were indexed but rejected direct automated fetching; public paper links are supplied as alternatives. The large Scaling Monosemanticity page exceeded the reader's size limit; its lab overview and publication identity were checked. The MLU visualization's text was not exposed to the reader. External-source functionality should be periodically rechecked by an editor; no scheduled monitor is created by this change.

## Karpathy selections: 2026-10-29

Karpathy now contributes seven distinct resources across thirteen lessons: the original introduction, five additional videos, and a training guide. 3Blue1Brown remains the visual foundation, and the six official 4D lessons remain the practical-use starting point. Karpathy's workflow demonstrations feed into the existing 4D practice and empirical workplace studies rather than replacing them.

Sources were checked against [his website](https://karpathy.ai/), the [Zero to Hero syllabus](https://karpathy.ai/zero-to-hero.html), the original YouTube video descriptions, and [his training guide](https://karpathy.github.io/2019/04/25/recipe/). Assigned time ranges match the creator's chapter boundaries, and study budgets allow for pauses. The selections span data preparation, base models, inference, tokenization, backpropagation, transformer blocks, supervised fine-tuning, RLHF, reasoning, tool use, and generalization.

The full lectures run roughly two to three and a half hours; only the specified excerpts are assigned. Python/PyTorch prerequisites are explicit for the transformer construction excerpt. Reading alternatives remain available, with their scope identified where they do not reproduce the video. Product demonstrations are labeled as historical examples. Metadata and chapter checks do not certify playback or captions in every region. Videos remain at the creator's source with the existing opt-in player; no video or transcript is copied into the repository.

## The 4Ds and licensing

Practical-use instruction begins with the official **AI Fluency: Framework and foundations** course:

- https://academy.claude.com/courses/ai-fluency-framework-foundations
- Framework creators and OER notice: https://aifluencyframework.org/
- Course creators: Rick Dakan, Joseph Feller, and Anthropic. Framework: Dakan and Feller.
- Course license: https://creativecommons.org/licenses/by-nc-sa/4.0/

The route uses Delegation, Description, Discernment, and Diligence and explicitly reinforces the Description–Discernment iteration. Diligence runs throughout the work. The course's actual videos, transcripts, diagrams, and exercises stay at the provider; the catalog links to them. Independent WhatisAI scenarios and checking prompts accompany the links. No official endorsement, equivalence, or course badge is claimed. No course asset is copied, rehosted, or relicensed in this repository.

The source license is **Attribution–NonCommercial–ShareAlike 4.0**. Linking learners to the public course is distinct from distributing adaptations. Before importing or adapting course assets, review attribution, change notices, noncommercial restrictions, and share-alike obligations; the license is not blanket permission for commercial reuse. This change does not apply that license to unrelated site code or existing materials.

## Playback and privacy

YouTube embeds are created only after the learner selects **Load video here**. They use the privacy-enhanced domain, have descriptive titles, and do not autoplay. Direct source links and illustrated alternatives are always present, including without JavaScript. External course videos are watched on the official lesson pages, which provide transcripts. The original notes remain accessible without JavaScript, and old heading links open their containing notes when JavaScript is available.

## Validation

`tests/learning-media.test.mjs` checks complete coverage, source attribution, external time share, safe URLs, valid embed identities, and the official 4D sequence. The same validator runs during the strict curriculum build, and the curriculum JSON exports the plans and catalog. Browser QA should cover a video lesson, a document lesson, the six-source 4D lesson, mobile layout, keyboard loading, no-JavaScript links, and old notes anchors. Provider playback itself is an external dependency; mocked tests do not prove it works.
