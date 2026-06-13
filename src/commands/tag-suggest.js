// `edgewell tag-suggest <text>` suggests tags based on the
// contents of the text. v3.0.0 uses a tiny keyword matcher
// against a hard-coded vocabulary.

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

export async function tagSuggestCommand(args) {
  const text = args.join(" ").toLowerCase();
  if (!text) {
    console.error("usage: edgewell tag-suggest <text>");
    process.exit(2);
  }
  const suggestions = [];
  for (const [tag, words] of Object.entries(VOCAB)) {
    if (words.some((w) => text.includes(w))) suggestions.push(tag);
  }
  if (suggestions.length === 0) {
    console.log("(no suggestions)");
    return;
  }
  console.log(suggestions.join(" "));
}
