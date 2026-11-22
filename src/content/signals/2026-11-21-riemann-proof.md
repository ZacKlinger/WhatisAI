---
title: Independent checkers verify an AI-assisted proof of the Riemann hypothesis
date: 2026-11-21
kind: research
significance: 5
summary: Levent Alpöge developed a proof with Claude and released it in Lean. The Lean and Mathlib communities checked both the mathematical statement and the proof.
sources:
  - title: Lean verification of the Riemann Hypothesis
    url: https://leanprover-community.github.io/blog/posts/riemann-hypothesis/
    publisher: Lean and Mathlib communities
  - title: A remark on the Riemann hypothesis
    url: https://alpo.ge/remark.pdf
    publisher: Levent Alpöge
  - title: Riemann Hypothesis
    url: https://www.claymath.org/millennium/riemann-hypothesis/
    publisher: Clay Mathematics Institute
  - title: Zeros of the Riemann zeta function
    url: https://www.lmfdb.org/zeros/zeta/
    publisher: L-functions and Modular Forms Database
modules: [reasoning-models, evaluation-science]
tags: [mathematics, verification, reasoning]
method: editor
---

How unevenly can prime numbers be distributed? Riemann connected that question to the locations where his zeta function equals zero. His hypothesis says every nontrivial zero has real part exactly one half. On a map of complex inputs, those points all lie on one vertical line.

On November 20, Levent Alpöge released a proof in Lean, a language that lets people express mathematical arguments precisely enough for a computer to check. He describes a collaboration with Claude over several weeks, including a step where the model suggested how to link two parts of the argument.

On November 21, the Lean and Mathlib communities explained how they checked the result. They compared the theorem in the release with Mathlib’s established definition of the Riemann hypothesis. Several independently implemented checkers then accepted the exported proof. That pairing matters. Even a correct derivation would answer the wrong question if the formal statement differed from the intended one.

The homepage lets you trace a few zeros yourself. Each crossing illustrates what the theorem says. The formal proof covers every nontrivial zero, including those beyond the reach of the visualization.
