// Command dispatcher. Maps the first CLI argument to a command module.

import { helpCommand } from "./commands/help.js";
import { serveCommand } from "./commands/serve.js";
import { chatCommand } from "./commands/chat.js";
import { askCommand } from "./commands/ask.js";
import { journalCommand } from "./commands/journal.js";
import { expenseCommand } from "./commands/expense.js";
import { ragCommand } from "./commands/rag.js";
import { planCommand } from "./commands/plan.js";
import { statusCommand } from "./commands/status.js";
import { versionCommand } from "./commands/version.js";

const MAP = {
  help: helpCommand,
  "--help": helpCommand,
  "-h": helpCommand,
  version: versionCommand,
  "--version": versionCommand,
  "-v": versionCommand,
  serve: serveCommand,
  chat: chatCommand,
  ask: askCommand,
  journal: journalCommand,
  expense: expenseCommand,
  rag: ragCommand,
  plan: planCommand,
  status: statusCommand,
};

export async function dispatch(cmd, rest, ew) {
  const fn = MAP[cmd];
  if (!fn) {
    await helpCommand();
    process.exit(cmd ? 2 : 0);
  }
  return fn(rest, ew);
}
