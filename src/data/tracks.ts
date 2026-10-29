export interface Track {
  id: string;
  numeral: string;
  title: string;
  aura: string;
  /** Short description of what a learner can do after the track. */
  outcome: string;
}

export const tracks: Track[] = [
  {
    id: 't0',
    numeral: '0',
    title: 'Prologue',
    aura: 'aura-t0',
    outcome: 'Orient yourself in AI, read a paper in three passes, and use the 4Ds to guide practical collaboration.',
  },
  {
    id: 't1',
    numeral: 'I',
    title: 'Foundations',
    aura: 'aura-t1',
    outcome: 'Read the equations and charts in an ML paper without flinching.',
  },
  {
    id: 't2',
    numeral: 'II',
    title: 'Learning Machines',
    aura: 'aura-t2',
    outcome: 'Explain how a neural network learns and why scale changed everything.',
  },
  {
    id: 't3',
    numeral: 'III',
    title: 'Language Models',
    aura: 'aura-t3',
    outcome: 'Trace a prompt from text to tokens to vectors to a predicted word, and reason about cost and scale.',
  },
  {
    id: 't4',
    numeral: 'IV',
    title: 'From Model to Assistant',
    aura: 'aura-t4',
    outcome: 'Describe exactly how a raw predictor becomes a helpful, reasoning, tool-using assistant.',
  },
  {
    id: 't5',
    numeral: 'V',
    title: 'Measuring Minds',
    aura: 'aura-t5',
    outcome: 'Judge whether a capability claim is well supported, and read a system card critically.',
  },
  {
    id: 't6',
    numeral: 'VI',
    title: 'Inside the Machine',
    aura: 'aura-t6',
    outcome: 'Follow the central arguments and experiments of frontier safety and interpretability research.',
  },
  {
    id: 't7',
    numeral: 'VII',
    title: 'AI and the Economy',
    aura: 'aura-t7',
    outcome: 'Weigh competing claims about AI and jobs using the actual studies and their limits.',
  },
  {
    id: 't8',
    numeral: 'VIII',
    title: 'Governing AI',
    aura: 'aura-t8',
    outcome: 'Read any AI policy document and locate its scope, thresholds, obligations, and teeth.',
  },
  {
    id: 't9',
    numeral: 'IX',
    title: 'The Frontier',
    aura: 'aura-t9',
    outcome: 'Read new frontier papers and policy documents fluently, on the day they are published.',
  },
];

export const trackById = Object.fromEntries(tracks.map((t) => [t.id, t])) as Record<string, Track>;
