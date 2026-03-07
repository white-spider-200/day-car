export type VrVideoScenario = {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
};

export const FALLBACK_VR_SCENARIOS: VrVideoScenario[] = [
  {
    id: "breathing-beach",
    title: "Calm Breathing - Beach Scenario",
    description: "Guided breathing with calm ocean visuals to reduce stress before deeper therapy work.",
    youtubeId: "aXItOY0sLRY"
  },
  {
    id: "mindful-forest",
    title: "Mindful Focus - Forest Walk",
    description: "Grounding-focused scenario for anxiety regulation and sensory reset.",
    youtubeId: "1ZYbU82GVz4"
  },
  {
    id: "confidence-room",
    title: "Confidence Practice - Social Scenario",
    description: "Role-play scenario to practice calm speech and social confidence skills.",
    youtubeId: "hHW1oY26kxQ"
  }
];
