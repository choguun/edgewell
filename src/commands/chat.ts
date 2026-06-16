// @ts-nocheck
import { c, header, withReadline } from "../cli.js";

export async function chatCommand(_args, ew) {
  header("EdgeWell chat - type 'exit' to quit");

  // If stdin is not a TTY (e.g. piped input from a script), read
  // all lines, process each one, then exit. The previous version
  // only handled a single line because the readline loop waited
  // for the next prompt forever.
  if (!process.stdin.isTTY) {
    const chunks: string[] = [];
    for await (const c1 of process.stdin) chunks.push(String(c1));
    const lines = chunks.join("").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const history: { role: "user" | "assistant"; content: string }[] = [];
    for (const q of lines) {
      if (q === "exit" || q === "quit") break;
      process.stdout.write(c.bold(`you> ${q}\n`));
      process.stdout.write(c.cyan("edgewell> "));
      const { agent } = await ew.orchestrator.route(q);
      process.stdout.write(c.dim(`[${agent}] `));
      for await (const tok of ew.orchestrator.streamAsk(q, history)) {
        process.stdout.write(tok);
      }
      process.stdout.write("\n");
      history.push({ role: "user", content: q });
      history.push({ role: "assistant", content: "ok" });
      if (history.length > 20) history.splice(0, history.length - 20);
    }
    return;
  }

  let stopping = false;
  const stop = () => { stopping = true; };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  await withReadline(async (rl) => {
    const history: { role: "user" | "assistant"; content: string }[] = [];
    while (!stopping) {
      let q;
      try {
        q = (await rl.question(c.bold("\nyou> "))).trim();
      } catch {
        // readline closed by SIGINT
        break;
      }
      if (!q) continue;
      if (q === "exit" || q === "quit") break;
      process.stdout.write(c.cyan("edgewell> "));
      const { agent } = await ew.orchestrator.route(q);
      process.stdout.write(c.dim(`[${agent}] `));
      for await (const tok of ew.orchestrator.streamAsk(q, history)) {
        if (stopping) break;
        process.stdout.write(tok);
      }
      process.stdout.write("\n");
      history.push({ role: "user", content: q });
      history.push({ role: "assistant", content: "ok" });
      if (history.length > 20) history.splice(0, history.length - 20);
    }
  });
  if (stopping) {
    console.log(c.dim("\nchat ended."));
  }
}
