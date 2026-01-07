import { c, header, withReadline } from "../cli.js";

export async function chatCommand(_args, ew) {
  header("EdgeWell chat - type 'exit' to quit");
  await withReadline(async (rl) => {
    const history = [];
    while (true) {
      const q = (await rl.question(c.bold("\nyou> "))).trim();
      if (!q) continue;
      if (q === "exit" || q === "quit") break;
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
  });
}
