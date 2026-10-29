import resourceData from '@/data/learning-resources.json';
import planData from '@/data/learning-paths.json';

export interface LearningResource {
  title: string;
  creator: string;
  kind: string;
  url: string;
  note: string;
  reviewed: string;
  youtubeId?: string;
  alternativeUrl?: string;
  licenseUrl?: string;
}
export interface LearningPlan {
  steps: { resource: string; minutes: number; focus: string }[];
  practiceMinutes: number;
  reflection: string;
}
export const learningResources: Record<string, LearningResource> = resourceData;
export const learningPlans: Record<string, LearningPlan> = planData;
export function getLearningPlan(id: string) {
  const plan = learningPlans[id];
  if (!plan) throw new Error(`Missing curated learning plan: ${id}`);
  const steps = plan.steps.map((step) => {
    const resource = learningResources[step.resource];
    if (!resource) throw new Error(`Unknown learning resource: ${step.resource}`);
    return { ...step, ...resource };
  });
  const externalMinutes = steps.reduce((sum, step) => sum + step.minutes, 0);
  return { ...plan, steps, externalMinutes, minutes: externalMinutes + plan.practiceMinutes };
}
