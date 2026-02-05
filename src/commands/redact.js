import { redact, redactRecord } from "../redact.js";

export async function redactCommand(args) {
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
  console.error("usage: edgewell redact <text|json> <...>");
  process.exit(2);
}
