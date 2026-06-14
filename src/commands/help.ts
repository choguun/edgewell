// `edgewell help` shows the full command surface. The hand-picked
// list of "highlighted" commands is augmented at runtime with the
// complete map from the dispatcher so every wired command is
// discoverable, not just the 50 or so we used to hand-curate.

import { c } from "../cli.js";

type Highlight = readonly [name: string, description: string];

// Hand-curated highlights: every command a typical user is likely
// to discover via docs or `tab`-completion. Each entry pairs a
// display name with a one-line description.
const HIGHLIGHTS: readonly Highlight[] = [
  ["chat", "Interactive REPL chat (routes to specialists)"],
  ["ask <question>", "One-shot question, streamed"],
  ["serve", "Start a P2P server hosting the delegate model"],
  ["journal add <text>", "Append a journal entry"],
  ["journal list", "List recent journal entries"],
  ["expense add <amt> <cat>", "Append an expense"],
  ["expense list", "List recent expenses"],
  ["rag ingest <file>", "Index a text file into the local RAG store"],
  ['rag search "<query>"', "Search the RAG index"],
  ['plan health "<goal>"', "Generate a 7-day health plan"],
  ["plan finance [--income N]", "Generate a monthly finance plan"],
  ["profile show|set|init", "View or update the user profile"],
  ["profile-reset", "Clear the on-disk user profile"],
  ["profiles list|show|apply", "Manage form-factor profiles"],
  ["companion --port N", "Start the v3.0.0 mobile companion server"],
  ["multimodal <file>", "Ingest image/audio/text into RAG"],
  ["sensors ingest|summarise", "Process wearable JSONL streams"],
  ["vector search|stats|clear", "Inspect the vector RAG index"],
  ['hybrid "<query>"', "Lexical + vector fused search"],
  ["export <file>", "Write a portable JSON dump"],
  ["import <file>", "Merge a JSON dump into the stores"],
  ["compare <a> <b>", "Diff two export files"],
  ["agents", "List the v3.0.0 agent bundle"],
  ["metrics", "Print in-process counters and histograms"],
  ["info", "One-screen overview of EdgeWell"],
  ["size", "On-disk size of the data files"],
  ["where", "Resolved on-disk file paths"],
  ["deps", "Runtime and dev dependencies"],
  ["seed <N>", "Append N synthetic journal+expense rows"],
  ["demo-data", "Load the bundled sample data"],
  ["today", "Today's journal and expenses"],
  ["yesterday", "Yesterday's journal and expenses"],
  ["tail [N]", "Last N journal entries (default 10)"],
  ["grep <pattern>", "Substring search of the journal"],
  ["word-count", "Journal word and character counts"],
  ["journal-stats", "Journal length, range, top tags"],
  ["expenses-stats", "Expense totals, range, per-category"],
  ["tag-stats", "Per-tag first/last/count"],
  ["tag-cloud", "ASCII tag cloud"],
  ["tags-add <id> <tag>", "Append a tag to a journal entry"],
  ["lint", "Data integrity check"],
  ["token [subject]", "Mint a companion bearer token"],
  ["self-test", "Run the project test suite"],
  ["ci", "Local GitHub Actions checks"],
  ["version-history [N]", "Last N CHANGELOG.md commits"],
  ["summary week|month", "Roll up journal + expenses"],
  ["tags", "Show top journal tags"],
  ["eval <expr>", "Calculator tool one-shot"],
  ["bench", "LLM throughput benchmark"],
  ["snapshot", "Dump profile + journal + expenses as JSON"],
  ["models list|describe", "Browse the QVAC model registry"],
  ["plugins list|run", "Manage local plugins (EDGEWELL_PLUGINS)"],
  ["status", "Show config, peer status, RAG size"],
  ["doctor", "Run self-checks"],
  ["config", "Print the resolved config"],
  ["version", "Print version"],
  ["help", "This help"],
  ["command-list", "Print every wired subcommand name"],
];

// Optional: a sub-arg can be passed to focus on a single command.
export async function helpCommand(args: string[] = []): Promise<void> {
  // Lazy-load the dispatcher map to keep the import cycle one-way.
  const { COMMAND_MAP: MAP } = await import("../dispatch.js");
  const target = args[0];
  if (target) {
    if (Object.prototype.hasOwnProperty.call(MAP, target)) {
      console.log(`${c.cyan(target)} - registered (see examples in README/docs)`);
      return;
    }
    console.log(c.yellow(`unknown command: ${target}`));
    console.log(`run \`edgewell help\` to see the full list`);
    return;
  }
  const lines: string[] = [];
  lines.push(`${c.bold("EdgeWell")} - private on-device health & finance coach (powered by QVAC)`);
  lines.push("");
  lines.push(`${c.bold("Usage:")}`);
  lines.push("  edgewell <command> [options]");
  lines.push("");
  lines.push(`${c.bold("Commands:")}`);
  // Determine the longest highlighted name for alignment.
  const longest = HIGHLIGHTS.reduce((m, [n]) => Math.max(m, n.length), 0);
  for (const [name, desc] of HIGHLIGHTS) {
    lines.push(`  ${c.cyan(name.padEnd(longest))}  ${desc}`);
  }
  // Count of additional commands not in the highlight list.
  const known = new Set(HIGHLIGHTS.map(([n]) => n.split(/\s|<|\[/)[0] ?? ""));
  const extras = Object.keys(MAP)
    .filter((k) => !k.startsWith("-") && !known.has(k) && k !== "plugins")
    .sort();
  if (extras.length) {
    lines.push("");
    lines.push(`${c.bold("More commands:")} (${extras.length} additional, run \`edgewell command-list\` to see them all)`);
    const colWidth = 20;
    const cols = Math.max(1, Math.floor((process.stdout.columns || 80) / (colWidth + 2)));
    for (let i = 0; i < extras.length; i += cols) {
      lines.push("  " + extras.slice(i, i + cols).map((e) => c.dim(e.padEnd(colWidth))).join(" "));
    }
  }
  lines.push("");
  lines.push(`${c.bold("Environment:")}`);
  lines.push("  EDGEWELL_MODEL            Local model id (default: LLAMA_3_2_1B_INST_Q4_0)");
  lines.push("  EDGEWELL_DELEGATE_MODEL   Peer model id");
  lines.push("  EDGEWELL_P2P_HOST         Peer host (default: 127.0.0.1)");
  lines.push("  EDGEWELL_P2P_PORT         Peer port (default: 8787)");
  lines.push("  EDGEWELL_P2P_ENABLED=1    Enable delegation to peer with local fallback");
  lines.push("  EDGEWELL_LOG              Log level: debug | info | warn | error");
  lines.push("  EDGEWELL_PLUGINS          Plugin directory (default: ./plugins)");
  lines.push("  EDGEWELL_RAG_ENCRYPTED=1  Use the encrypted RAG store");
  lines.push("");
  lines.push(`${c.bold("Examples:")}`);
  lines.push("  edgewell ask \"How can I sleep better this week?\"");
  lines.push("  edgewell expense add 250 food");
  lines.push("  edgewell rag ingest ~/notes/labs.txt");
  lines.push("  edgewell serve --port 8787");
  lines.push("  edgewell doctor");
  lines.push("  edgewell plugins run");
  console.log(lines.join("\n"));
}
