/** The frontier corpus: landmark documents a fluent reader of the field should be able to read. */
export interface CorpusDoc {
  id: string;
  title: string;
  org: string;
  kind: 'paper' | 'system card' | 'policy' | 'framework' | 'report' | 'essay';
  year: number;
  url: string;
  summary: string;
  /** Modules that make this document readable. */
  requires: string[];
  /** Module that offers a guided reading, if any. */
  guided?: string;
}

export const corpus: CorpusDoc[] = [
  // Foundations of the modern era
  { id: 'attention', title: 'Attention Is All You Need', org: 'Google', kind: 'paper', year: 2017, url: 'https://arxiv.org/abs/1706.03762',
    summary: 'Introduces the transformer, the architecture behind every frontier language model.', requires: ['attention', 'transformer'] },
  { id: 'kaplan', title: 'Scaling Laws for Neural Language Models', org: 'OpenAI', kind: 'paper', year: 2020, url: 'https://arxiv.org/abs/2001.08361',
    summary: 'Loss falls as a smooth power law in parameters, data, and compute.', requires: ['statistics-for-research', 'pretraining', 'scaling-laws'] },
  { id: 'gpt3', title: 'Language Models are Few-Shot Learners (GPT-3)', org: 'OpenAI', kind: 'paper', year: 2020, url: 'https://arxiv.org/abs/2005.14165',
    summary: 'A 175-billion-parameter model learns tasks from examples in its prompt.', requires: ['pretraining', 'inference'] },
  { id: 'chinchilla', title: 'Training Compute-Optimal Large Language Models (Chinchilla)', org: 'Google DeepMind', kind: 'paper', year: 2022, url: 'https://arxiv.org/abs/2203.15556',
    summary: 'Models of the era were undertrained; parameters and data should scale together.', requires: ['scaling-laws'], guided: 'reading-a-scaling-paper' },
  { id: 'instructgpt', title: 'Training language models to follow instructions with human feedback (InstructGPT)', org: 'OpenAI', kind: 'paper', year: 2022, url: 'https://arxiv.org/abs/2203.02155',
    summary: 'The RLHF recipe that turned base models into assistants.', requires: ['fine-tuning', 'rlhf'] },
  { id: 'hh-rlhf', title: 'Training a Helpful and Harmless Assistant with RLHF', org: 'Anthropic', kind: 'paper', year: 2022, url: 'https://arxiv.org/abs/2204.05862',
    summary: 'Studies the tension between helpfulness and harmlessness under preference training.', requires: ['rlhf'] },
  { id: 'cai', title: 'Constitutional AI: Harmlessness from AI Feedback', org: 'Anthropic', kind: 'paper', year: 2022, url: 'https://arxiv.org/abs/2212.08073',
    summary: 'Replaces most human harm labels with AI feedback guided by written principles.', requires: ['rlhf', 'constitutional-ai'] },
  { id: 'gpt4', title: 'GPT-4 Technical Report', org: 'OpenAI', kind: 'report', year: 2023, url: 'https://arxiv.org/abs/2303.08774',
    summary: 'Capabilities, predictable scaling, and a system card, with few architectural details.', requires: ['benchmarks', 'system-cards'] },
  { id: 'prm', title: "Let's Verify Step by Step", org: 'OpenAI', kind: 'paper', year: 2023, url: 'https://arxiv.org/abs/2305.20050',
    summary: 'Rewarding each reasoning step beats rewarding only final answers on hard math.', requires: ['rlhf', 'reasoning-models'] },
  { id: 'r1', title: 'DeepSeek-R1: Incentivizing Reasoning Capability via Reinforcement Learning', org: 'DeepSeek', kind: 'paper', year: 2025, url: 'https://arxiv.org/abs/2501.12948',
    summary: 'An open account of training a reasoning model with reinforcement learning on verifiable rewards.', requires: ['reasoning-models'] },

  // Interpretability
  { id: 'toy-superposition', title: 'Toy Models of Superposition', org: 'Anthropic', kind: 'paper', year: 2022, url: 'https://transformer-circuits.pub/2022/toy_model/index.html',
    summary: 'Networks store more features than they have dimensions, explaining polysemantic neurons.', requires: ['vectors-and-embeddings', 'interpretability-foundations'] },
  { id: 'monosemanticity', title: 'Towards Monosemanticity: Decomposing Language Models With Dictionary Learning', org: 'Anthropic', kind: 'paper', year: 2023, url: 'https://transformer-circuits.pub/2023/monosemantic-features/index.html',
    summary: 'Sparse autoencoders recover interpretable features from a small transformer.', requires: ['interpretability-foundations', 'sparse-autoencoders'] },
  { id: 'scaling-mono', title: 'Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet', org: 'Anthropic', kind: 'paper', year: 2024, url: 'https://transformer-circuits.pub/2024/scaling-monosemanticity/index.html',
    summary: 'Millions of features in a production model, including safety-relevant ones, and steering with them.', requires: ['sparse-autoencoders'], guided: 'reading-an-interpretability-paper' },
  { id: 'biology', title: 'On the Biology of a Large Language Model', org: 'Anthropic', kind: 'paper', year: 2025, url: 'https://transformer-circuits.pub/2025/attribution-graphs/biology.html',
    summary: 'Attribution graphs trace multi-step reasoning, planning in poetry, and more inside Claude.', requires: ['sparse-autoencoders', 'transformer'] },

  // Alignment and safety research
  { id: 'sleeper', title: 'Sleeper Agents: Training Deceptive LLMs that Persist Through Safety Training', org: 'Anthropic', kind: 'paper', year: 2024, url: 'https://arxiv.org/abs/2401.05566',
    summary: 'Backdoored behaviors can survive standard safety training, and adversarial training can hide them.', requires: ['alignment-problem', 'deception-and-scheming'] },
  { id: 'sycophancy', title: 'Towards Understanding Sycophancy in Language Models', org: 'Anthropic', kind: 'paper', year: 2023, url: 'https://arxiv.org/abs/2310.13548',
    summary: 'Preference training rewards telling people what they want to hear.', requires: ['rlhf', 'alignment-problem'] },
  { id: 'alignment-faking', title: 'Alignment Faking in Large Language Models', org: 'Anthropic & Redwood Research', kind: 'paper', year: 2024, url: 'https://arxiv.org/abs/2412.14093',
    summary: 'A model strategically complies during training to preserve its preferences.', requires: ['deception-and-scheming'], guided: 'reading-an-alignment-paper' },
  { id: 'w2s', title: 'Weak-to-Strong Generalization', org: 'OpenAI', kind: 'paper', year: 2023, url: 'https://arxiv.org/abs/2312.09390',
    summary: 'Can weak supervisors elicit the full capabilities of stronger models? An analogy for superalignment.', requires: ['scalable-oversight'] },
  { id: 'cot-monitoring', title: 'Detecting misbehavior in frontier reasoning models', org: 'OpenAI', kind: 'paper', year: 2025, url: 'https://openai.com/index/chain-of-thought-monitoring/',
    summary: 'Reading chains of thought catches reward hacking, but optimizing against the monitor teaches concealment.', requires: ['reasoning-models', 'scalable-oversight'] },
  { id: 'cot-fragile', title: 'Chain of Thought Monitorability: A New and Fragile Opportunity for AI Safety', org: 'Multi-lab position paper', kind: 'paper', year: 2025, url: 'https://arxiv.org/abs/2507.11473',
    summary: 'Researchers across labs argue for preserving the legibility of model reasoning.', requires: ['reasoning-models', 'scalable-oversight'] },
  { id: 'hallucinate', title: 'Why Language Models Hallucinate', org: 'OpenAI', kind: 'paper', year: 2025, url: 'https://arxiv.org/abs/2509.04664',
    summary: 'Training and evaluation reward guessing over admitting uncertainty.', requires: ['pretraining', 'benchmarks'] },

  // Evaluation and measurement
  { id: 'metr-horizon', title: 'Measuring AI Ability to Complete Long Tasks', org: 'METR', kind: 'paper', year: 2025, url: 'https://arxiv.org/abs/2503.14499',
    summary: 'The length of tasks AI agents can complete has doubled roughly every seven months.', requires: ['measuring-progress', 'statistics-for-research'] },
  { id: 'gdpval', title: 'GDPval: Evaluating AI Model Performance on Real-World Economically Valuable Tasks', org: 'OpenAI', kind: 'paper', year: 2025, url: 'https://openai.com/index/gdpval/',
    summary: 'Expert-graded tasks from 44 occupations, compared against human professionals.', requires: ['evaluation-science', 'measuring-exposure'] },
  { id: 'o1-card', title: 'OpenAI o1 System Card', org: 'OpenAI', kind: 'system card', year: 2024, url: 'https://arxiv.org/abs/2412.16720',
    summary: 'Safety evaluations, red teaming, and Preparedness scorecard for the first major reasoning model.', requires: ['system-cards', 'dangerous-capabilities'] },

  // Frameworks
  { id: 'rsp', title: 'Responsible Scaling Policy', org: 'Anthropic', kind: 'framework', year: 2026, url: 'https://www.anthropic.com/responsible-scaling-policy',
    summary: 'How Anthropic ties safeguards to model capabilities; substantially rewritten as version 3 in 2026.', requires: ['safety-frameworks'] },
  { id: 'preparedness', title: 'Preparedness Framework', org: 'OpenAI', kind: 'framework', year: 2025, url: 'https://openai.com/index/updating-our-preparedness-framework/',
    summary: 'OpenAI’s tracked risk categories, capability thresholds, and safeguards.', requires: ['safety-frameworks'] },
  { id: 'model-spec', title: 'Model Spec', org: 'OpenAI', kind: 'framework', year: 2025, url: 'https://model-spec.openai.com/',
    summary: 'The written specification of how OpenAI models should behave.', requires: ['constitutional-ai'] },

  // Economics
  { id: 'gpts-are-gpts', title: 'GPTs are GPTs: An Early Look at the Labor Market Impact Potential of LLMs', org: 'OpenAI & UPenn', kind: 'paper', year: 2023, url: 'https://arxiv.org/abs/2303.10130',
    summary: 'Task-level exposure estimates across US occupations.', requires: ['measuring-exposure'] },
  { id: 'aei', title: 'Which Economic Tasks are Performed with AI? (Anthropic Economic Index)', org: 'Anthropic', kind: 'paper', year: 2025, url: 'https://arxiv.org/abs/2503.04761',
    summary: 'Millions of real conversations mapped to occupational tasks.', requires: ['measuring-exposure'] },
  { id: 'genai-at-work', title: 'Generative AI at Work', org: 'NBER / QJE', kind: 'paper', year: 2023, url: 'https://www.nber.org/papers/w31161',
    summary: 'A field study of 5,000+ support agents: largest gains for the least experienced.', requires: ['evidence-on-work'] },
  { id: 'jagged', title: 'Navigating the Jagged Technological Frontier', org: 'Harvard Business School & BCG', kind: 'paper', year: 2023, url: 'https://www.hbs.edu/faculty/Pages/item.aspx?num=64700',
    summary: 'Consultants gain inside the AI frontier and lose outside it.', requires: ['evidence-on-work'] },
  { id: 'canaries', title: 'Canaries in the Coal Mine? Six Facts about the Recent Employment Effects of AI', org: 'Stanford Digital Economy Lab', kind: 'paper', year: 2026, url: 'https://digitaleconomy.stanford.edu/publication/canaries-in-the-coal-mine-six-facts-about-the-recent-employment-effects-of-artificial-intelligence/',
    summary: 'Payroll data show early-career employment falling in the most AI-exposed occupations.', requires: ['evidence-on-work', 'statistics-for-research'] },
  { id: 'acemoglu', title: 'The Simple Macroeconomics of AI', org: 'NBER', kind: 'paper', year: 2024, url: 'https://www.nber.org/papers/w32487',
    summary: 'A task-based estimate implying modest decade-scale productivity gains.', requires: ['general-purpose-technology', 'measuring-exposure'] },
  { id: 'metr-rct', title: 'Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity', org: 'METR', kind: 'paper', year: 2025, url: 'https://arxiv.org/abs/2507.09089',
    summary: 'A randomized trial in which developers were 19% slower with AI while believing they were faster.', requires: ['evidence-on-work', 'evaluation-science'] },

  // Policy
  { id: 'eu-ai-act', title: 'Regulation (EU) 2024/1689: the Artificial Intelligence Act', org: 'European Union', kind: 'policy', year: 2024, url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
    summary: 'The world’s first comprehensive AI law: risk tiers, GPAI duties, and an AI Office.', requires: ['eu-ai-act', 'reading-policy'] },
  { id: 'gpai-code', title: 'General-Purpose AI Code of Practice', org: 'European Commission', kind: 'policy', year: 2025, url: 'https://digital-strategy.ec.europa.eu/en/policies/contents-code-gpai',
    summary: 'How providers can demonstrate compliance with the AI Act’s GPAI obligations.', requires: ['eu-ai-act', 'safety-frameworks'], guided: 'reading-a-policy-document' },
  { id: 'nist-rmf', title: 'AI Risk Management Framework (AI RMF 1.0)', org: 'NIST', kind: 'framework', year: 2023, url: 'https://www.nist.gov/itl/ai-risk-management-framework',
    summary: 'The US voluntary framework: Govern, Map, Measure, Manage.', requires: ['governance-landscape'] },
  { id: 'action-plan', title: "America's AI Action Plan", org: 'The White House', kind: 'policy', year: 2025, url: 'https://www.whitehouse.gov/wp-content/uploads/2025/07/Americas-AI-Action-Plan.pdf',
    summary: 'US federal strategy organized around innovation, infrastructure, and international diplomacy.', requires: ['us-ai-policy'] },
  { id: 'sb53', title: 'SB 53: Transparency in Frontier Artificial Intelligence Act', org: 'State of California', kind: 'policy', year: 2025, url: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB53',
    summary: 'Frontier developers must publish safety frameworks and report critical incidents.', requires: ['us-ai-policy', 'reading-policy'] },
  { id: 'iasr-2026', title: 'International AI Safety Report 2026', org: 'International panel chaired by Yoshua Bengio', kind: 'report', year: 2026, url: 'https://internationalaisafetyreport.org/publication/international-ai-safety-report-2026',
    summary: 'The scientific consensus, and disagreements, on capabilities, risks, and safeguards.', requires: ['international-governance', 'dangerous-capabilities'] },
  { id: 'bletchley', title: 'The Bletchley Declaration', org: 'AI Safety Summit, UK', kind: 'policy', year: 2023, url: 'https://www.gov.uk/government/publications/ai-safety-summit-2023-the-bletchley-declaration/the-bletchley-declaration-by-countries-attending-the-ai-safety-summit-1-2-november-2023',
    summary: '28 countries and the EU agree that frontier AI poses risks requiring international cooperation.', requires: ['international-governance'] },
  { id: 'seoul', title: 'Frontier AI Safety Commitments', org: 'AI Seoul Summit', kind: 'policy', year: 2024, url: 'https://www.gov.uk/government/publications/frontier-ai-safety-commitments-ai-seoul-summit-2024/frontier-ai-safety-commitments-ai-seoul-summit-2024',
    summary: 'Sixteen companies commit to publish safety frameworks with risk thresholds.', requires: ['safety-frameworks', 'international-governance'] },
  { id: 'oecd', title: 'OECD AI Principles', org: 'OECD', kind: 'policy', year: 2019, url: 'https://oecd.ai/en/ai-principles',
    summary: 'The first intergovernmental AI principles, updated in 2024; the source of many legal definitions of "AI system".', requires: ['governance-landscape'] },
];
