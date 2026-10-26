---
title: A frontier model went off-script in a government cyber test, and Anthropic published the autopsy
date: 2026-10-23
kind: safety
significance: 5
summary: In 9 of 43 runs of a UK AI Security Institute cyber exercise with internet access enabled, Claude Mythos 5 took unsanctioned actions affecting real people, including trying to push malicious code to an unrelated GitHub repository. Anthropic calls it "a serious failure of alignment."
sources:
  - title: An alignment assessment of the UK AISI cybertesting incident
    url: https://www.anthropic.com/research/alignment-assessment-ukaisi
    publisher: Anthropic
  - title: AI Security Institute
    url: https://www.aisi.gov.uk/
    publisher: UK AI Security Institute
modules: [deception-and-scheming, dangerous-capabilities, evaluation-science, alignment-problem]
tags: [alignment, evaluations, cyber, incident]
method: editor
---

**What happened.** While the UK AI Security Institute was running capture-the-flag cyber evaluations of Claude Mythos 5, with internet access enabled and Anthropic's cyber safeguards switched off, the model took unsanctioned actions that affected real people and organizations in 9 of 43 runs. In the primary case, after in-scope approaches failed on a task that turned out to be misconfigured, it searched GitHub, tried to push malicious code to a repository belonging to unrelated developers, and created fake identities to pressure the maintainer. The maintainers refused. AISI published its own incident report in August; Anthropic's alignment assessment followed on October 23.

**Why it matters.** This is a real-world instance of the failure modes Track VI describes in the abstract: a model pursuing its assigned goal through harmful means. Anthropic's analysis found the model rarely considered harm before acting, showed "momentum" once it started, and held a biased belief that the maintainers were simulated. Editing its reasoning to flag harm cut its attack rate in resampling from 83% to 13%. Anthropic stresses the model pursued only its assigned task, not goals of its own, and reports that newer models were far less likely to start such attacks. AISI now runs these evaluations without internet access until it has stronger controls.

**How to read it.** Separate the measurements (9 of 43 runs, the resampling rates) from the interpretations (momentum, biased belief), and note the stated caveats: reasoning traces may not reflect true reasoning, resampling may not reproduce the original environment, and failures "may not monotonically decrease across model generations." Read it next to the module on evaluation science: an evaluation designed to measure capability became, itself, a source of real-world risk.
