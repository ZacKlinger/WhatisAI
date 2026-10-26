import type { ItemBank } from '@/lib/items';

export const t0: ItemBank = {
  welcome: [
    {
      kind: 'mc', id: 'fluency', placement: true,
      prompt: 'Which question best captures what a fluent reader asks of a new AI paper?',
      choices: ['Is this impressive?', 'Did a famous lab write it?', 'What would have to be true for this to be wrong?', 'How many citations does it have?'],
      answer: 2,
      explain: 'Fluency is judging evidence: identifying the claim, how it was measured, how strong the evidence is, and what could overturn it.',
    },
    {
      kind: 'match', id: 'institutions',
      prompt: 'Match each institution to the kind of document it most characteristically produces.',
      pairs: [
        ['Frontier lab', 'System card for a new model'],
        ['Independent evaluator (e.g. METR)', 'External measurement of model capabilities'],
        ['European Commission AI Office', 'Enforcement guidance for a law'],
        ['Labor economists', 'Studies using payroll or trial data'],
      ],
      explain: 'Each institution has distinct access and incentives. Knowing who wrote a document is the first step in reading it.',
    },
    {
      kind: 'mc', id: 'retrieval',
      prompt: 'Why does every module end in a test rather than a summary to re-read?',
      choices: ['Tests are easier to grade', 'Recalling information strengthens memory more than re-reading it', 'Summaries are usually inaccurate', 'Testing is required for certification'],
      answer: 1,
      explain: 'Retrieval practice is among the most robust findings in learning science. Re-reading feels effective but produces weaker long-term retention.',
    },
    {
      kind: 'mc', id: 'calibration',
      prompt: 'A reader says "90% sure" on 50 answers and gets 30 of them right. What does this show?',
      choices: ['They are well calibrated', 'They are overconfident', 'They are underconfident', 'Nothing, the sample is too small to say anything'],
      answer: 1,
      explain: '30 of 50 is 60% correct at a stated 90%. Their confidence runs well ahead of their accuracy: overconfidence.',
    },
  ],
  'history-of-ai': [
    {
      kind: 'order', id: 'eras', placement: true,
      prompt: 'Order these milestones from earliest to latest.',
      items: ['The Dartmouth workshop names the field', 'Backpropagation is popularized', 'AlexNet wins ImageNet', 'The transformer is published', 'ChatGPT is released'],
      explain: '1956, 1986, 2012, 2017, 2022.',
    },
    {
      kind: 'mc', id: 'bitter',
      prompt: 'What is the central claim of Rich Sutton’s "The Bitter Lesson"?',
      choices: [
        'AI will never match human intuition',
        'General methods that scale with computation beat methods built on human knowledge',
        'Symbolic AI will eventually return to dominance',
        'Neural networks are a dead end',
      ],
      answer: 1,
      explain: 'Across chess, speech, and vision, general methods leveraging computation have repeatedly overtaken hand-engineered knowledge.',
    },
    {
      kind: 'mc', id: 'chatgpt',
      prompt: 'What mainly distinguished ChatGPT from the raw GPT-3 model before it?',
      choices: ['A completely new architecture', 'Additional training to follow instructions and match human preferences', 'Access to the live internet', 'Hundreds of times more parameters'],
      answer: 1,
      explain: 'ChatGPT came from the same family of models after instruction tuning and reinforcement learning from human feedback. The architecture was not new.',
    },
    {
      kind: 'multi', id: 'drivers',
      prompt: 'Which developments made the deep learning revolution of the 2010s possible?',
      choices: ['Internet-scale datasets', 'Cheap parallel computation on GPUs', 'Better hand-written rules', 'Algorithmic refinements that made deep networks trainable'],
      answers: [0, 1, 3],
      explain: 'Data, compute, and trainable deep networks arrived together. Hand-written rules were the approach deep learning displaced.',
    },
    {
      kind: 'mc', id: 'reasoning',
      prompt: 'Reasoning models introduced a second way to scale performance. What is it?',
      choices: ['Training on more languages', 'Spending more computation at the moment of answering', 'Using larger vocabularies', 'Running on newer chips'],
      answer: 1,
      explain: 'Reasoning models are trained to think at length before answering, so performance can improve with inference-time compute as well as training compute.',
    },
  ],
  'reading-the-corpus': [
    {
      kind: 'order', id: 'passes', placement: true,
      prompt: 'Put the steps of a three-pass reading in order.',
      items: ['Read title, abstract, headings, figures, and conclusion', 'Read the body, studying figures and noting unfamiliar references', 'Attempt to reconstruct the work and challenge its assumptions'],
      explain: 'Each pass is deeper, and each is a decision point about whether the next is worth the time.',
    },
    {
      kind: 'hotspot', id: 'limits',
      prompt: 'Where in a paper are you most likely to find the reasons to be cautious about its result?',
      figure: { id: 'doc-anatomy', props: { title: 'research paper', sections: [
        { id: 'abstract', label: 'Abstract', h: 40 },
        { id: 'intro', label: 'Introduction and contributions', h: 56 },
        { id: 'method', label: 'Method', h: 56 },
        { id: 'results', label: 'Results', h: 64 },
        { id: 'limits', label: 'Limitations and discussion', h: 48 },
      ] } },
      answer: 'limits',
      explain: 'Careful authors put the threats to their conclusions in the limitations section, often the most informative and least-read part of a paper.',
    },
    {
      kind: 'mc', id: 'baseline',
      prompt: 'A paper reports a new method beats the baseline by 8 points. What is the most important follow-up question?',
      choices: ['How long is the paper?', 'Was the baseline given the same resources and tuning?', 'Which conference accepted it?', 'Did the authors release a blog post?'],
      answer: 1,
      explain: 'A result is only as meaningful as its comparison. A weak or under-tuned baseline can manufacture large gains.',
    },
    {
      kind: 'match', id: 'policy-parts',
      prompt: 'Match each part of a policy text to its role.',
      pairs: [
        ['Recitals', 'Explain the reasoning; guide interpretation'],
        ['Definitions', 'Decide who and what is covered'],
        ['Obligations', 'State what covered parties must do'],
        ['Enforcement', 'Give the law its teeth'],
      ],
      explain: 'In policy, definitions do most of the work, and enforcement determines whether obligations matter.',
    },
    {
      kind: 'mc', id: 'elicit',
      prompt: 'A system card reports that a model failed a dangerous-capability test. Which concern most undermines that reassurance?',
      choices: ['The test was too hard for humans', 'The model may not have been properly elicited, for example with poor prompts or no tools', 'The test was run by an external partner', 'The model is open-weight'],
      answer: 1,
      explain: 'Absence of evidence from a weakly elicited test is not evidence of absence. Under-elicitation is a central concern in safety evaluation.',
    },
  ],
};
