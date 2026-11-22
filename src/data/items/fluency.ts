import type { ItemBank } from '@/lib/items';

export const fluency: ItemBank = {
  'ai-fluency': [
    {
      kind: 'mc', id: 'delegation', placement: true,
      prompt: 'You need to choose a venue. An assistant can compare public information, but only you know your group’s needs. Which division of work is strongest?',
      choices: ['Ask the assistant to select and book without review', 'Keep every task yourself because AI can make mistakes', 'Let the assistant organize evidence; retain the decision and confirm important details', 'Choose whichever venue the assistant describes most confidently'],
      answer: 2,
      explain: 'Delegation starts with the task and the strengths and limits of the people and tools involved. Producing a comparison does not authorize a booking.',
    },
    {
      kind: 'mc', id: 'description',
      prompt: 'Which brief is most useful for comparing three venue pages?',
      choices: ['Make it impressive', 'Be an expert and pick the best', 'Write a long answer', 'Compare price, accessibility, and availability; cite the supplied pages and mark missing information as unknown'],
      answer: 3,
      explain: 'The brief gives the assistant context, concrete output requirements, and a way to handle missing evidence.',
    },
    {
      kind: 'mc', id: 'discernment',
      prompt: 'The comparison lists a wheelchair-accessible entrance, but its cited page says nothing about access. What should you do?',
      choices: ['Trust it because a citation is present', 'Treat the claim as unverified, check an independent source, and revise the brief to prevent unsupported entries', 'Ask for a more confident explanation', 'Remove all citations to make the table cleaner'],
      answer: 1,
      explain: 'Discernment requires checking the evidence. The failure should inform a revised description and another check, not just a more polished answer.',
    },
    {
      kind: 'multi', id: 'diligence',
      prompt: 'Before using an AI-assisted venue recommendation, which actions demonstrate responsibility?',
      choices: ['Check whether personal information is appropriate to share', 'Disclose material AI assistance where the context calls for it', 'Assume the tool provider is responsible for your final decision', 'Confirm consequential details before relying on them'],
      answers: [0, 1, 3],
      explain: 'Diligence spans creation, transparency, and use. It applies before sharing inputs as well as before acting on outputs.',
    },
    {
      kind: 'mc', id: 'loop',
      prompt: 'Your first result fails an important requirement. How should the 4Ds shape the next step?',
      choices: ['Repeat the same prompt until the wording feels right', 'Finish the four steps once and never return to them', 'Use the evaluation to revise the brief, reconsider the division of work if needed, and check again', 'Skip verification because iteration costs time'],
      answer: 2,
      explain: 'The competencies work together. Evaluation informs description, and a changed task can require a new delegation decision. Responsibility runs throughout.',
    },
  ],
};
