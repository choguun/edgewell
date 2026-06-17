// @ts-nocheck
import { c } from "../cli.js";

// Soft cap on a single journal entry. 8 KB is far above what a
// real daily note looks like; entries above this almost
// certainly indicate a script bug or a paste of a large file.
// Truncate at a word boundary so the user can read the start.
const MAX_BODY_BYTES = 8 * 1024;

export async function journalCommand(args, ew) {
  const [sub, ...rest] = args;
  if (sub === "add") {
    const text = rest.join(" ").trim();
    if (!text) {
      console.error("text cannot be empty");
      console.error("usage: edgewell journal add <text>");
      process.exit(2);
    }
    let stored = text;
    if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) {
      stored = text.slice(0, MAX_BODY_BYTES);
      // Try to land on a word boundary.
      const lastSpace = stored.lastIndexOf(" ");
      if (lastSpace > MAX_BODY_BYTES * 0.7) stored = stored.slice(0, lastSpace);
      console.error(c.yellow(`warning: entry truncated to ${MAX_BODY_BYTES} bytes`));
    }
    await ew.journal.append({ kind: "journal", text: stored });
    console.log(c.green("logged"));
  } else if (sub === "list") {
    const all = await ew.journal.readAll();
    for (const e of all.slice(-20)) {
      console.log(`${c.dim(e._ts)}  ${e.text}`);
    }
    if (all.length === 0) console.log(c.dim("(no entries)"));
  } else if (sub === "find") {
    // Alias for `journal-by-tag <tag>` documented in COMMANDS.md.
    const tag = rest[0];
    if (!tag) {
      console.error("usage: edgewell journal find <tag>");
      process.exit(2);
    }
    const all = await ew.journal.readAll();
    const matches = all.filter((e) => (e.tags ?? []).includes(tag));
    if (matches.length === 0) {
      console.log(c.dim(`(no entries with tag "${tag}")`));
      return;
    }
    for (const e of matches) {
      console.log(`${c.dim(e._ts)}  ${e.text}`);
    }
  } else {
    console.error("usage: edgewell journal <add|list|find> ...");
    process.exit(2);
  }
}
