export interface Track {
  id: string;
  numeral: string;
  title: string;
  tagline: string;
  description: string;
  aura: string;
  /** Short description of what a learner can do after the track. */
  outcome: string;
}

export const tracks: Track[] = [
  {
    id: 't0',
    numeral: '0',
    title: 'Prologue',
    tagline: 'Before the first step',
    description:
      'How the field came to be, who shapes it, and the craft of reading its documents. A map before the journey.',
    aura: 'aura-t0',
    outcome: 'Name the actors, eras, and document types of modern AI, and read any paper in three passes.',
  },
  {
    id: 't1',
    numeral: 'I',
    title: 'Foundations',
    tagline: 'The mathematics of meaning',
    description:
      'Functions, vectors, probability, optimization, statistics, and information. Taught from zero, for people who left math behind.',
    aura: 'aura-t1',
    outcome: 'Read the equations and charts in an ML paper without flinching.',
  },
  {
    id: 't2',
    numeral: 'II',
    title: 'Learning Machines',
    tagline: 'How experience becomes skill',
    description:
      'Neural networks, backpropagation, generalization, data, representations, and the compute that powers them all.',
    aura: 'aura-t2',
    outcome: 'Explain how a neural network learns and why scale changed everything.',
  },
  {
    id: 't3',
    numeral: 'III',
    title: 'Language Models',
    tagline: 'The transformer, piece by piece',
    description:
      'Tokens, attention, the transformer block, pretraining, inference, and the scaling laws that govern them.',
    aura: 'aura-t3',
    outcome: 'Trace a prompt from text to tokens to vectors to a predicted word, and reason about cost and scale.',
  },
  {
    id: 't4',
    numeral: 'IV',
    title: 'From Model to Assistant',
    tagline: 'Post-training and agency',
    description:
      'Fine-tuning, RLHF, Constitutional AI, reasoning models, agents and tools, and multimodality.',
    aura: 'aura-t4',
    outcome: 'Describe exactly how a raw predictor becomes a helpful, reasoning, tool-using assistant.',
  },
  {
    id: 't5',
    numeral: 'V',
    title: 'Measuring Minds',
    tagline: 'Evaluation as a science',
    description:
      'Benchmarks, evaluation methodology, dangerous-capability testing, system cards, and the measurement of progress.',
    aura: 'aura-t5',
    outcome: 'Judge whether a capability claim is well supported, and read a system card critically.',
  },
  {
    id: 't6',
    numeral: 'VI',
    title: 'Inside the Machine',
    tagline: 'Interpretability and alignment',
    description:
      'The alignment problem, features and circuits, sparse autoencoders, deception, oversight, and frontier safety frameworks.',
    aura: 'aura-t6',
    outcome: 'Follow the central arguments and experiments of frontier safety and interpretability research.',
  },
  {
    id: 't7',
    numeral: 'VII',
    title: 'AI and the Economy',
    tagline: 'Labor, productivity, and power',
    description:
      'General-purpose technologies, exposure measurement, the evidence on work so far, and the physical supply chain of AI.',
    aura: 'aura-t7',
    outcome: 'Weigh competing claims about AI and jobs using the actual studies and their limits.',
  },
  {
    id: 't8',
    numeral: 'VIII',
    title: 'Governing AI',
    tagline: 'Law, policy, and coordination',
    description:
      'The governance toolkit, the EU AI Act, United States policy, international coordination, and how to read a policy text.',
    aura: 'aura-t8',
    outcome: 'Read any AI policy document and locate its scope, thresholds, obligations, and teeth.',
  },
  {
    id: 't9',
    numeral: 'IX',
    title: 'The Frontier',
    tagline: 'Reading the corpus',
    description:
      'Guided readings of landmark papers and policy texts, ending with the craft of forming your own well-calibrated view.',
    aura: 'aura-t9',
    outcome: 'Read new frontier papers and policy documents fluently, on the day they are published.',
  },
];

export const trackById = Object.fromEntries(tracks.map((t) => [t.id, t])) as Record<string, Track>;
