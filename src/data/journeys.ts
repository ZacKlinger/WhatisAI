export interface Journey {
  id: string;
  title: string;
  question: string;
  promise: string;
  introduction: string;
  steps: { module: string; why: string }[];
  activity: string;
}

export const journeys: Journey[] = [
  {
    id: 'understand', title: 'Understand AI', question: 'How does it actually work?',
    promise: 'Follow an idea from examples to learning to an answer.',
    introduction: 'Start with something you can see and manipulate. Build up the language to explain what a model does, how it learns, and where its answers come from.',
    steps: [
      { module: 'tokens', why: 'See how a model breaks text into pieces it can process.' },
      { module: 'neural-networks', why: 'Train a tiny network and watch its predictions change.' },
      { module: 'inference', why: 'Follow how a trained language model generates an answer.' },
    ],
    activity: 'Explain to a friend how training differs from answering a prompt. Use an example, and name one thing a convincing answer does not guarantee.',
  },
  {
    id: 'research', title: 'Read research & safety', question: 'What is this publication really claiming?',
    promise: 'Find the claim, inspect the evidence, and locate the limits.',
    introduction: 'Research papers, system cards, and scenarios make different kinds of claims. Learn to separate measured results from assumptions and projections, then ask what would change the conclusion.',
    steps: [
      { module: 'reading-the-corpus', why: 'Get your bearings in a paper or policy document with a three-pass reading.' },
      { module: 'benchmarks', why: 'Find out what a headline score measures—and what it leaves out.' },
      { module: 'system-cards', why: 'Read a frontier lab’s capability and safety disclosures critically.' },
    ],
    activity: 'Pick one publication. Write down its main claim, one supporting result, one important limitation, and a question you would ask its authors.',
  },
  {
    id: 'use', title: 'Put AI to work', question: 'Where could it actually help me?',
    promise: 'Use the 4Ds to choose, direct, evaluate, and take responsibility for AI-assisted work.',
    introduction: 'Start with the official AI Fluency course by Rick Dakan, Joseph Feller, and Anthropic. Carry Delegation, Description, Discernment, and Diligence into the lessons on agents, evaluation, and workplace evidence.',
    steps: [
      { module: 'ai-fluency', why: 'Learn the 4Ds from the creators’ videos, transcripts, and exercises, then apply them to one task.' },
      { module: 'agents-and-tools', why: 'Understand what retrieval and tools add, and where verification still matters.' },
      { module: 'evaluation-science', why: 'Design a fair comparison with your current way of working.' },
      { module: 'evidence-on-work', why: 'Compare real studies of where AI helped people and where it slowed them down.' },
    ],
    activity: 'Keep a 4D work record: your division of responsibility, your brief, evidence from checking the result, and your decision about whether and how to use it. Revise the brief after checking; include correction time when judging whether AI helped.',
  },
  {
    id: 'anticipate', title: 'Anticipate change', question: 'What could this mean for my field?',
    promise: 'Build a view you can explain—and revise as evidence changes.',
    introduction: 'Start with specific tasks in a field you care about. Separate technical capability from adoption, and turn a broad prediction into a claim with a time horizon and observable evidence.',
    steps: [
      { module: 'measuring-exposure', why: 'Distinguish a task AI could affect from a job it will replace.' },
      { module: 'measuring-progress', why: 'Examine capability trends and the limits of extrapolating them.' },
      { module: 'forming-a-view', why: 'Compare scenarios, name your assumptions, and decide what would change your mind.' },
    ],
    activity: 'Make one dated prediction about a task in your field. Record your confidence, the evidence behind it, and a specific observation that would make you revise it.',
  },
];
