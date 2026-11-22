export const homeFeature = {
  signal: '2026-11-21-riemann-proof',
  headline: 'The Riemann hypothesis',
  summary: 'In 1859, Riemann connected the spacing of prime numbers to the zeros of a function. Levent Alpöge and Claude found a proof that every nontrivial zero lies on one line. On November 21, the Lean and Mathlib communities verified it.',
  question: {
    prompt: 'Suppose the curve crosses zero a trillion times where you expect. What would establish the result for every nontrivial zero?',
    choices: [
      { id: 'samples', label: 'Plot another trillion crossings.', feedback: 'More crossings extend the sample. A zero beyond the sample could still behave differently.' },
      { id: 'proof', label: 'Check a proof of the exact mathematical statement.', feedback: 'The statement specifies every nontrivial zero. A valid proof covers them all.' },
      { id: 'agreement', label: 'Ask a second AI to agree.', feedback: 'Two models can share a mistake. Checking a derivation provides a way to catch one.' },
    ],
    answer: 'proof',
    takeaway: 'A proof covers every case.',
    explanation: 'The verifiers checked that the code expressed the intended theorem. Independent proof checkers then validated its derivation. The graph lets you inspect individual examples of that theorem.',
  },
  lesson: 'reasoning-models',
  lessonAnchor: 'learn-with',
  lessonHeading: 'How can a model check its reasoning?',
  lessonSummary: 'Explore problems with answers you can verify, then see what changes when an AI gets more attempts.',
};
export type StoryQuestionData = typeof homeFeature.question;
