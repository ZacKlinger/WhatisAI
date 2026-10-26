import type { ItemBank } from '@/lib/items';

export const t7: ItemBank = {
  'general-purpose-technology': [
    {
      kind: 'mc', id: 'electric', placement: true,
      prompt: 'Why did electrification take decades to raise factory productivity?',
      choices: ['Electricity was too expensive', 'Gains required redesigning factories and work around small motors, a slow organizational change', 'Workers resisted electricity', 'Motors did not work well until 1950'],
      answer: 1,
      explain: 'Paul David showed the gains came from complementary reorganization, not from swapping the power source.',
    },
    {
      kind: 'match', id: 'tasks',
      prompt: 'Match each effect in the task-based framework to its description.',
      pairs: [
        ['Automation', 'A task shifts from people to machines'],
        ['Augmentation', 'People become more productive at tasks they keep'],
        ['Reinstatement', 'New tasks are created in which people have an advantage'],
      ],
      explain: 'Technology’s net effect on labor depends on the balance of these forces.',
    },
    {
      kind: 'mc', id: 'jcurve',
      prompt: 'What does the productivity J-curve predict for the early years of a general-purpose technology?',
      choices: ['Immediate large measured gains', 'Measured productivity may look flat or decline while hard-to-measure complementary investments are made', 'Permanent decline', 'No effect at all'],
      answer: 1,
      explain: 'Intangible investments cost first and pay later, producing the dip-then-rise shape.',
    },
    {
      kind: 'mc', id: 'different',
      prompt: 'How does generative AI’s exposure pattern differ from earlier automation waves?',
      choices: ['It affects only manual labor', 'It reaches non-routine cognitive tasks, so higher-education, higher-wage occupations are among the most exposed', 'It affects no occupations', 'It is identical'],
      answer: 1,
      explain: 'Earlier waves hit routine tasks; generative AI reaches writing, analysis, and coding.',
    },
    {
      kind: 'estimate', id: 'newwork',
      prompt: 'Autor and colleagues estimated what share of 2018 US employment was in job titles that did not exist in 1940?',
      min: 0, max: 100, answer: 60, tolerance: 12, format: 'pct',
      explain: 'About 60%: new work has historically been a large part of how economies adapt to technology.',
    },
  ],
  'measuring-exposure': [
    {
      kind: 'mc', id: 'exposure', placement: true,
      prompt: 'A study says 19% of workers have at least half their tasks "exposed" to LLMs. What does that mean?',
      choices: ['19% of workers will lose their jobs', 'For 19% of workers, LLMs could substantially speed up at least half their tasks; outcomes could be augmentation, reallocation, or displacement', '19% of workers use ChatGPT', 'Half of all jobs will vanish'],
      answer: 1,
      explain: 'Exposure measures potential overlap with tasks, not realized job loss.',
    },
    {
      kind: 'estimate', id: 'aei',
      prompt: 'In the first Anthropic Economic Index report (2025), roughly what share of Claude conversations involved computer and mathematical tasks?',
      min: 0, max: 100, answer: 37.2, tolerance: 8, format: 'pct',
      explain: 'About 37%: software and related work dominated early usage, far ahead of the next category (arts and media, about 10%).',
    },
    {
      kind: 'match', id: 'measures',
      prompt: 'Match each measure to its type.',
      pairs: [
        ['GPTs are GPTs (Eloundou et al.)', 'Capability-based exposure'],
        ['Anthropic Economic Index', 'Usage-based measure'],
        ['O*NET', 'Task database underlying both'],
      ],
      explain: 'Capability measures estimate potential; usage measures show realized use; O*NET supplies the tasks.',
    },
    {
      kind: 'mc', id: 'aug',
      prompt: 'In the first Anthropic Economic Index report, roughly how did usage split between augmentation and automation?',
      choices: ['10% augmentation, 90% automation', 'About 57% augmentation, 43% automation', '100% augmentation', 'About 25% augmentation, 75% automation'],
      answer: 1,
      explain: 'Most early use was collaborative; later reports found directive use growing, especially via the API.',
    },
    {
      kind: 'multi', id: 'limits',
      prompt: 'Which are real limitations of exposure and usage measures?',
      choices: ['Usage data reflects one platform’s users, not all workers', 'Capability judgments change quickly as models improve', 'O*NET task lists may lag behind how work changes', 'They directly measure job losses'],
      answers: [0, 1, 2],
      explain: 'Neither type measures job outcomes directly; that requires employment data and causal designs.',
    },
  ],
  'evidence-on-work': [
    {
      kind: 'mc', id: 'support', placement: true,
      prompt: 'In the customer-support field study (Brynjolfsson, Li & Raymond), who gained most from the AI assistant?',
      choices: ['The most experienced agents', 'Novice and lower-skilled agents (about 34% more issues resolved per hour)', 'Managers', 'No one; effects were zero'],
      answer: 1,
      explain: 'The assistant appeared to spread top performers’ tacit knowledge, narrowing the gap.',
    },
    {
      kind: 'hotspot', id: 'jagged',
      prompt: 'Which task, if done with AI, is likely to turn out worse than doing it without AI?',
      figure: { id: 'jagged-frontier' },
      answer: 'out1',
      explain: 'Just outside the frontier, AI output looks plausible but is wrong; consultants relying on it were 19 points less likely to be correct.',
    },
    {
      kind: 'mc', id: 'canaries',
      prompt: 'What did the Stanford "Canaries" analysis of payroll data find?',
      choices: ['Mass layoffs across all ages', 'Relative employment declines for 22 to 25 year olds in the most AI-exposed occupations, mostly via slower hiring', 'No change anywhere', 'Older workers were most affected'],
      answer: 1,
      explain: 'Effects concentrated on early-career workers in automatable occupations; the authors call the patterns descriptive.',
    },
    {
      kind: 'mc', id: 'pretrends',
      prompt: 'Why do critics question some early-career employment findings?',
      choices: ['The data are fabricated', 'Pre-existing trends, post-pandemic tech hiring corrections, and interest rates hit the same occupations', 'Young workers do not use AI', 'Payroll data is always wrong'],
      answer: 1,
      explain: 'Difference-in-differences estimates are biased if groups were already diverging.',
    },
    {
      kind: 'order', id: 'did',
      prompt: 'Order the logic of a difference-in-differences study.',
      items: ['Choose an affected group and a comparison group', 'Measure each group’s outcome before and after the change', 'Compute each group’s change', 'Subtract the comparison group’s change from the affected group’s'],
      explain: 'The comparison group’s change stands in for what would have happened without the intervention.',
    },
  ],
  'ai-supply-chain': [
    {
      kind: 'match', id: 'links', placement: true,
      prompt: 'Match each supply-chain link to its dominant supplier(s).',
      pairs: [
        ['EUV lithography machines', 'ASML'],
        ['Leading-edge chip fabrication', 'TSMC, chiefly'],
        ['High-bandwidth memory', 'SK hynix, Samsung, Micron'],
        ['Most AI training accelerators', 'NVIDIA'],
      ],
      explain: 'Concentration at several links makes the chain both fragile and governable.',
    },
    {
      kind: 'mc', id: 'controls',
      prompt: 'What is the stated aim of US export controls on advanced AI chips since 2022?',
      choices: ['To lower chip prices', 'To slow rivals’ development of frontier AI by restricting access to advanced compute and chipmaking tools', 'To protect data privacy', 'To promote open-source models'],
      answer: 1,
      explain: 'Compute is detectable and concentrated, making it a lever for strategic policy.',
    },
    {
      kind: 'mc', id: 'deepseek',
      prompt: 'What did DeepSeek’s 2024 to 2025 models illustrate about compute?',
      choices: ['Compute no longer matters at all', 'Algorithmic efficiency can substitute substantially for raw compute, though advanced chips still constrain further scaling', 'Only U.S. labs can build frontier models', 'Training costs are rising for everyone'],
      answer: 1,
      explain: 'The reported $5.6M final V3 run showed efficiency gains; analysts still viewed chips as binding at the frontier.',
    },
    {
      kind: 'mc', id: 'jevons',
      prompt: 'Inference prices for a given capability fell sharply, yet total AI spending rose. What explains this?',
      choices: ['Accounting errors', 'Cheaper AI makes many more tasks economical, increasing total use (the Jevons paradox)', 'Prices did not really fall', 'Fewer people used AI'],
      answer: 1,
      explain: 'Lower unit costs expanded demand faster than prices fell.',
    },
    {
      kind: 'multi', id: 'open',
      prompt: 'Which are genuine considerations in the open-weight debate?',
      choices: ['Open weights enable research, competition, and customization', 'Safety training in open models can be removed by fine-tuning', 'Open models can be recalled after release', 'Open models reduce dependence on a single provider'],
      answers: [0, 1, 3],
      explain: 'Once released, open weights cannot be recalled, which is central to the risk side of the debate.',
    },
  ],
};
