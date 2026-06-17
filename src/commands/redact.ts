// @ts-nocheck
import { redact, redactRecord } from "../redact.js";

export async function redactCommand(args) {
  // Accept a few common forms so the command is discoverable from
  // the command line. Previous version only accepted
  //   redact text <...>   /   redact json <...>
  // which made the command useless for `redact "some text"` or
  // `redact --text "..."` — the two most natural first tries.
  if (args.length === 0) {
    // No positional args: read from stdin. This makes
    // `echo 'my email is j@x.com' | edgewell redact` work, which
    // is the most natural pipeline for a redaction command.
    if (!process.stdin.isTTY) {
      const chunks: string[] = [];
      for await (const c1 of process.stdin) chunks.push(String(c1));
      const text = chunks.join("").trim();
      if (!text) {
        console.error("usage: edgewell redact <text> [...more words]");
        console.error("       echo 'text' | edgewell redact   (reads from stdin)");
        console.error("       edgewell redact text <text>");
        console.error("       edgewell redact json <json-string>");
        process.exit(2);
      }
      process.stdout.write(redact(text) + "\n");
      return;
    }
    console.error("usage: edgewell redact <text> [...more words]");
    console.error("       echo 'text' | edgewell redact   (reads from stdin)");
    console.error("       edgewell redact text <text>");
    console.error("       edgewell redact json <json-string>");
    console.error("       edgewell redact --text <text>");
    process.exit(2);
  }

  // Strip an optional `--text` / `--json` flag.
  if (args[0] === "--text") {
    const text = args.slice(1).join(" ");
    process.stdout.write(redact(text) + "\n");
    return;
  }
  if (args[0] === "--json") {
    const text = args.slice(1).join(" ");
    let obj;
    try {
      obj = JSON.parse(text);
    } catch (err) {
      console.error("not valid json:", err.message);
      process.exit(2);
    }
    process.stdout.write(JSON.stringify(redactRecord(obj), null, 2) + "\n");
    return;
  }
  if (args[0] === "text") {
    const text = args.slice(1).join(" ");
    process.stdout.write(redact(text) + "\n");
    return;
  }
  if (args[0] === "json") {
    const text = args.slice(1).join(" ");
    let obj;
    try {
      obj = JSON.parse(text);
    } catch (err) {
      console.error("not valid json:", err.message);
      process.exit(2);
    }
    process.stdout.write(JSON.stringify(redactRecord(obj), null, 2) + "\n");
    return;
  }

  // Default: treat the entire argv as free-form text. This is the
  // most natural thing a user will try.
  process.stdout.write(redact(args.join(" ")) + "\n");
}
