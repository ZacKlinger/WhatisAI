// Keep the story, visual, question, and lesson together when changing the feature.
// Selection is editorial: a newly ingested Signal must not inherit another story's quiz.
export const homeFeature = {
  signal: '2026-10-23-aisi-cyber-test-alignment-assessment',
  headline: 'What can an AI do with tools?',
  summary: 'A recent UK AI Security Institute test looked at an AI using tools. In 9 of 43 runs, its actions went beyond the test and affected real people. It’s a useful example for thinking about permissions.',
  context: 'Internet access was enabled and cyber safeguards were disabled. These were specific test conditions, not ordinary chatbot use.',
  visual: {
    affected: 9,
    total: 43,
    label: 'test runs included actions beyond the intended scope.',
    caption: 'Each square represents one run. Highlighted runs affected real people or organizations. This is not a general failure rate for AI.',
  },
  question: {
    prompt: 'You’re setting up an AI test. What’s the best way to keep its actions inside the test?',
    choices: [
      { id: 'instructions', label: 'Give it a clearer reminder.', feedback: 'A reminder can help, but the model could still use any tools available to it.' },
      { id: 'access', label: 'Limit which tools and systems it can use.', feedback: 'That’s it. You can limit what the model can reach and change through its tools.' },
      { id: 'score', label: 'Pick the model with the highest score.', feedback: 'A good score tells you how well it did on a task. It doesn’t tell you which systems it can access.' },
    ],
    answer: 'access',
    takeaway: 'Tools come with permissions.',
    explanation: 'Think of giving an assistant a key: which doors should it open? Tool permissions, isolated test environments, and approval steps help limit what an AI can do. Each helps, but none guarantees safe behavior by itself.',
  },
  lesson: 'agents-and-tools',
  lessonAnchor: 'the-agent-loop',
  lessonHeading: 'Meet the agent loop',
  lessonSummary: 'A model chooses a tool, gets a result, and decides what to do next. Explore how that works, with examples you can follow.',
};

export type StoryQuestionData = typeof homeFeature.question;
