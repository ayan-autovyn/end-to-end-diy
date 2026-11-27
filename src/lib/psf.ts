// Scripted PSF (post-service feedback) conversation asked by the AI voice bot.
export type PsfAnswers = Record<string, string>;
export type PsfStep = {
  id: string;
  label: string;
  group: "flow" | "question";
  ask: (name: string) => string;
  options: string[];
  when?: (a: PsfAnswers) => boolean;
};

const question = (id: string, label: string, ask: string, options = ["Yes", "No"]): PsfStep => ({
  id,
  label,
  group: "question",
  ask: () => ask,
  options,
});

export const PSF_STEPS: PsfStep[] = [
  {
    id: "nps",
    label: "Recommend score",
    group: "flow",
    ask: (name) =>
      `Hello ${name.split(" ")[0]}, I'm calling from TVS about your recent service. On a scale of 0 to 10, how likely are you to recommend TVS Service Center to a friend or family member?`,
    options: Array.from({ length: 11 }, (_, i) => String(i)),
  },
  question(
    "running",
    "Vehicle running good after service",
    "Is your vehicle running good after service?",
  ),
  {
    id: "runningIssue",
    label: "Issue reason",
    group: "question",
    ask: () => "Sorry to hear that. What issue are you facing?",
    options: [
      "Engine noise",
      "Brake issue",
      "Pickup problem",
      "Starting trouble",
      "Oil leakage",
      "Other",
    ],
    when: (answers) => answers["running"] === "No",
  },
  question(
    "clean",
    "Cleanliness & appearance",
    "After service, how was the cleanliness and appearance of your two-wheeler?",
    ["Good", "Not good"],
  ),
  question("staff", "Dealer staff helpful", "Was the dealer staff helpful?"),
  question(
    "time",
    "Satisfied with job card & delivery time",
    "Are you satisfied with the time taken to make the job card and the timely delivery of your vehicle?",
  ),
];

/** Next step to ask after `currentId`, skipping steps whose condition isn't met. */
export function nextStep(currentId: string, answers: PsfAnswers): PsfStep | undefined {
  const i = PSF_STEPS.findIndex((s) => s.id === currentId);
  return PSF_STEPS.slice(i + 1).find((s) => !s.when || s.when(answers));
}
