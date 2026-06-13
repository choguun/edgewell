// `edgewell tag-suggest-extended <text>` is a richer version of
// `tag-suggest` that also looks for mood, energy, and quantity
// fields in the text.

import { c } from "../cli.js";

const VOCAB = {
  sleep: ["sleep", "slept", "bed", "rest", "tired", "awake"],
  meal: ["eat", "ate", "food", "breakfast", "lunch", "dinner", "snack"],
  activity: ["walk", "run", "step", "gym", "exercise", "bike"],
  hydration: ["water", "drink", "hydrat", "litre", "liter"],
  mood: ["mood", "happy", "sad", "anxious", "calm", "stressed"],
  habit: ["habit", "routine", "consistent", "goal", "plan"],
  work: ["work", "meeting", "code", "ship", "deploy"],
  health: ["doctor", "pill", "medication", "symptom", "pain"],
};

export async function tagSuggestExtendedCommand(args) {
  const text = args.join(" ").toLowerCase();
  if (!text) {
    console.error("usage: edgewell tag-suggest-extended <text>");
    process.exit(2);
  }
  const tags = new Set();
  for (const [tag, words] of Object.entries(VOCAB)) {
    if (words.some((w) => text.includes(w))) tags.add(tag);
  }
  // Detect numeric fields.
  const mood = text.match(/mood\s*[:=]\s*(\d+)/);
  if (mood) console.log(`mood=${mood[1]}`);
  const energy = text.match(/energy\s*[:=]\s*(\d+)/);
  if (energy) console.log(`energy=${energy[1]}`);
  if (tags.size === 0) {
    console.log(c.dim("(no suggestions)"));
    return;
  }
  console.log([...tags].join(" "));
}
