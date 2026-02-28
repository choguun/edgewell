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
import { profileCommand } from "./commands/profile.js";
import { doctorCommand } from "./commands/doctor.js";
import { configCommand } from "./commands/config.js";
import { modelsCommand } from "./commands/models.js";
import { pluginsListCommand, pluginsRunCommand } from "./commands/plugins.js";
import { redactCommand } from "./commands/redact.js";
import { summaryCommand } from "./commands/summary.js";

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
  profile: profileCommand,
  doctor: doctorCommand,
  config: configCommand,
  models: modelsCommand,
  redact: redactCommand,
  summary: summaryCommand,
  plugins: (args, ew) => {
    if (args[0] === "list") return pluginsListCommand(args.slice(1), ew);
    if (args[0] === "run") return pluginsRunCommand(args.slice(1), ew);
    return pluginsListCommand([], ew);
  },
};

export async function dispatch(cmd, rest, ew) {
  const fn = MAP[cmd];
  if (!fn) {
    await helpCommand();
    process.exit(cmd ? 2 : 0);
  }
  return fn(rest, ew);
}
