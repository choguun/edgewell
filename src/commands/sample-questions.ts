// @ts-nocheck
// `edgewell sample-questions` prints a small list of canned
// questions a new user can ask EdgeWell. The list is hard-coded so
// the command does not require any state.

import { c, header } from "../cli.js";

const QUESTIONS = [
  "How can I sleep better this week?",
  "What did I spend the most on last month?",
  "Should I be drinking more water?",
  "How many steps did I average this week?",
  "Give me a 7-day health plan based on my journal.",
  "What is my savings rate this month?",
  "Am I logging meals regularly?",
  "What's a good evening routine?",
];

export async function sampleQuestionsCommand(_args) {
  header("Sample questions");
  for (let i = 0; i < QUESTIONS.length; i++) {
    console.log(`  ${c.dim(String(i + 1).padStart(2) + ".")} ${QUESTIONS[i]}`);
  }
}
