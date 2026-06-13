// `edgewell journal-emoji` adds a single emoji to the most
// recent journal entry. v3.0.0 keeps this in JS; the emoji is
// picked from a small built-in vocabulary.

import { promises as fs } from "node:fs";
import { c } from "../cli.js";

const EMOJIS = ["😀", "😊", "🥰", "😎", "🤔", "😴", "🥗", "🍎", "☕", "🏃", "💪", "📚", "🎉", "❤️", "🔥"];

export async function journalEmojiCommand(args, ew) {
  const emoji = args[0] ?? EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const last = all[all.length - 1];
  const newText = `${last.text ?? ""} ${emoji}`.trim();
  const path = ew.journal._path ?? "";
  if (path) {
    await fs.appendFile(path, `\n${JSON.stringify({ _ts: new Date().toISOString(), text: newText, originalId: all.length - 1, emojiAppended: emoji })}\n`);
  }
  console.log(c.green(`appended ${emoji} to entry ${all.length - 1}`));
}
