import type { ItemBank } from '@/lib/items';

const POLICY_DOC = {
  id: 'doc-anatomy',
  props: { title: 'policy text', sections: [
    { id: 'preamble', label: 'Preamble or recitals', h: 44 },
    { id: 'defs', label: 'Definitions and scope', h: 48 },
    { id: 'oblig', label: 'Obligations and prohibitions', h: 52 },
    { id: 'enforce', label: 'Enforcement and penalties', h: 44 },
    { id: 'timing', label: 'Entry into force and application', h: 40 },
  ] },
};

export const t8: ItemBank = {
  'governance-landscape': [
    {
      kind: 'match', id: 'tools', placement: true,
      prompt: 'Match each governance instrument to an example.',
      pairs: [
        ['Soft law', 'OECD AI Principles'],
        ['Voluntary standard', 'NIST AI Risk Management Framework'],
        ['Compute governance', 'Obligations above a training-compute threshold'],
        ['Liability', 'Courts holding a deployer responsible after harm'],
      ],
      explain: 'Instruments differ in whether they bind, when they act, and what they target.',
    },
    {
      kind: 'mc', id: 'collingridge',
      prompt: 'What is the Collingridge dilemma?',
      choices: ['Laws are always too strict', 'Early on, a technology’s effects are hard to predict; later, when clear, it is entrenched and hard to change', 'Technology always benefits society', 'Regulators cannot read code'],
      answer: 1,
      explain: 'It captures the timing problem at the heart of governing emerging technologies.',
    },
    {
      kind: 'mc', id: 'defs',
      prompt: 'Why do definitions matter so much in AI law?',
      choices: ['They are the longest section', 'They determine who and what is covered, and therefore who bears obligations', 'They set the penalties', 'They are required by the OECD'],
      answer: 1,
      explain: 'Scope is decided by definitions; many political fights happen there.',
    },
    {
      kind: 'multi', id: 'thresholds',
      prompt: 'Which are known weaknesses of compute thresholds as proxies for risk?',
      choices: ['Algorithmic efficiency lets smaller runs reach dangerous capabilities', 'Inference-time compute is not captured by training compute', 'They are impossible to verify', 'They can be gamed by structuring training'],
      answers: [0, 1, 3],
      explain: 'Thresholds are verifiable, which is their main strength; their weakness is imperfect correlation with risk.',
    },
    {
      kind: 'order', id: 'rmf',
      prompt: 'Put the four functions of NIST’s AI Risk Management Framework in the order they are usually listed.',
      items: ['Govern', 'Map', 'Measure', 'Manage'],
      explain: 'Govern (culture and accountability), Map (context and risks), Measure (assess), Manage (prioritize and act).',
    },
  ],
  'eu-ai-act': [
    {
      kind: 'hotspot', id: 'tier', placement: true,
      prompt: 'Under the EU AI Act, where does AI used to screen job applicants belong?',
      figure: { id: 'risk-pyramid' },
      answer: 'high',
      explain: 'Employment and worker management is an Annex III high-risk area.',
    },
    {
      kind: 'estimate', id: 'threshold',
      prompt: 'Above what training compute does the AI Act presume a general-purpose model has systemic risk?',
      min: 1e20, max: 1e30, log: true, answer: 1e25, tolerance: 1.5, format: 'sci',
      explain: '10^25 floating-point operations (Article 51).',
    },
    {
      kind: 'multi', id: 'gpai',
      prompt: 'Which are obligations of ALL general-purpose AI model providers under Article 53?',
      choices: ['Maintain technical documentation', 'Publish a summary of training content', 'Adopt a copyright compliance policy', 'Perform adversarial testing for systemic risk'],
      answers: [0, 1, 2],
      explain: 'Adversarial testing is an additional duty for models with systemic risk (Article 55).',
    },
    {
      kind: 'mc', id: 'omnibus',
      prompt: 'What did the 2026 Digital Omnibus on AI mainly change?',
      choices: ['It repealed the AI Act', 'It postponed high-risk obligations (Annex III to December 2027; Annex I to August 2028) while leaving most transparency duties on schedule', 'It banned general-purpose AI', 'It removed all penalties'],
      answer: 1,
      explain: 'A schedule change, not a repeal: the obligations remain, with later dates.',
    },
    {
      kind: 'mc', id: 'penalty',
      prompt: 'What is the maximum fine for violating the AI Act’s prohibitions?',
      choices: ['€1 million', '€35 million or 7% of worldwide annual turnover, whichever is higher', '1% of EU revenue', 'There are no fines'],
      answer: 1,
      explain: 'The highest tier, reserved for prohibited practices.',
    },
  ],
  'us-ai-policy': [
    {
      kind: 'order', id: 'arc', placement: true,
      prompt: 'Order these US federal AI policy events.',
      items: ['Executive Order 14110 on safe, secure AI', 'EO 14110 revoked; EO 14179 issued', 'America’s AI Action Plan published', 'Executive order directing an AI Litigation Task Force against state laws'],
      explain: 'October 2023; January 2025; July 2025; December 2025.',
    },
    {
      kind: 'multi', id: 'sb53',
      prompt: 'Which are features of California’s SB 53?',
      choices: ['Defines frontier models above 10^26 operations', 'Requires large frontier developers to publish and follow a frontier AI framework', 'Requires critical safety incident reporting', 'Requires a license to train any AI model'],
      answers: [0, 1, 2],
      explain: 'SB 53 is a transparency and incident-reporting law, not a licensing regime.',
    },
    {
      kind: 'mc', id: 'eo',
      prompt: 'Can a presidential executive order by itself repeal a state AI law?',
      choices: ['Yes, immediately', 'No; it directs federal agencies. Preemption requires valid federal legislation or court rulings', 'Only with Senate approval', 'Only in election years'],
      answer: 1,
      explain: 'Executive orders bind the executive branch; they cannot rewrite state statutes.',
    },
    {
      kind: 'match', id: 'states',
      prompt: 'Match each state law to its approach.',
      pairs: [
        ['California SB 53', 'Frontier developer transparency and incident reporting'],
        ['New York RAISE Act', 'Frontier frameworks and 72-hour incident reporting, effective 2027'],
        ['Colorado AI Act (original)', 'Algorithmic discrimination in consequential decisions'],
      ],
      explain: 'Frontier transparency laws differ from broader consumer-protection approaches.',
    },
    {
      kind: 'mc', id: 'caisi',
      prompt: 'What is CAISI?',
      choices: ['A state regulator', 'NIST’s Center for AI Standards and Innovation, successor to the US AI Safety Institute', 'A lab’s safety team', 'An EU agency'],
      answer: 1,
      explain: 'Renamed in 2025, it evaluates frontier models and develops standards.',
    },
  ],
  'international-governance': [
    {
      kind: 'order', id: 'summits', placement: true,
      prompt: 'Order the international AI summits.',
      items: ['Bletchley Park (2023)', 'Seoul (2024)', 'Paris AI Action Summit (2025)', 'New Delhi AI Impact Summit (2026)'],
      explain: 'The emphasis shifted from frontier safety toward opportunity and inclusion.',
    },
    {
      kind: 'match', id: 'approaches',
      prompt: 'Match each jurisdiction to its characteristic approach.',
      pairs: [
        ['European Union', 'One comprehensive, risk-based law'],
        ['China', 'Targeted, layered rules with algorithm filing and content requirements'],
        ['United Kingdom', 'Sector-led approach plus a frontier model evaluation institute'],
        ['United States (federal)', 'Executive orders, standards, and export controls'],
      ],
      explain: 'Different philosophies shape different instruments.',
    },
    {
      kind: 'mc', id: 'iasr',
      prompt: 'What is the International AI Safety Report?',
      choices: ['A binding treaty', 'A scientific synthesis of evidence on AI capabilities and risks, chaired by Yoshua Bengio, without policy recommendations', 'An EU regulation', 'A lab’s system card'],
      answer: 1,
      explain: 'Modeled loosely on the IPCC, it aims at a shared evidence base.',
    },
    {
      kind: 'mc', id: 'seoul',
      prompt: 'What did AI companies commit to at the 2024 Seoul summit?',
      choices: ['To stop training large models', 'To publish safety frameworks including thresholds at which risks would be intolerable', 'To open-source all models', 'To pay an AI tax'],
      answer: 1,
      explain: 'The Frontier AI Safety Commitments spread the safety-framework model across the industry.',
    },
    {
      kind: 'mc', id: 'treaty',
      prompt: 'What is the Council of Europe Framework Convention on AI?',
      choices: ['A non-binding declaration', 'The first legally binding international treaty on AI, focused on human rights, democracy, and the rule of law', 'A trade agreement on chips', 'A UN body'],
      answer: 1,
      explain: 'Opened for signature in 2024, it binds states that ratify it.',
    },
  ],
  'reading-policy': [
    {
      kind: 'hotspot', id: 'covered', placement: true,
      prompt: 'You need to know whether a startup with $20 million in revenue is covered by a new AI law. Where do you look first?',
      figure: POLICY_DOC,
      answer: 'defs',
      explain: 'Coverage, including revenue or compute thresholds, is set in the definitions and scope.',
    },
    {
      kind: 'match', id: 'words',
      prompt: 'Match each drafting term to its meaning.',
      pairs: [
        ['"shall"', 'A binding obligation'],
        ['"may"', 'A permission or discretion'],
        ['"reasonable"', 'A standard defined later by guidance or courts'],
        ['"including but not limited to"', 'An illustrative, not exhaustive, list'],
      ],
      explain: 'Precise reading of obligation words prevents most misreadings of policy.',
    },
    {
      kind: 'mc', id: 'force',
      prompt: 'A law "entered into force" in 2024 but its main obligations "apply" from 2027. What does that mean?',
      choices: ['It is unenforceable', 'The law exists from 2024, but regulated parties must comply with those duties only from 2027', 'It was repealed', 'It applies retroactively'],
      answer: 1,
      explain: 'Entry into force and application dates are distinct; many AI laws phase in.',
    },
    {
      kind: 'hotspot', id: 'teeth',
      prompt: 'Where do you look to judge whether a law has real teeth?',
      figure: POLICY_DOC,
      answer: 'enforce',
      explain: 'Enforcement bodies, penalties, and private rights of action determine whether obligations bite.',
    },
    {
      kind: 'mc', id: 'gap',
      prompt: 'Which is an example of the gap between a law’s text and its practice?',
      choices: ['The law has a title', 'Obligations stay abstract until regulators issue standards and guidance defining compliance', 'The law is written in English', 'The law has recitals'],
      answer: 1,
      explain: 'Delegated details, enforcement capacity, courts, and amendments shape what a text actually does.',
    },
  ],
};
