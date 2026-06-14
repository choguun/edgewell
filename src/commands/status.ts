// @ts-nocheck
import { c, header } from "../cli.js";

export async function statusCommand(_args, ew) {
  const { cfg, rag } = ew;
  header("EdgeWell status");
  console.log(`${c.bold("local model:")}  ${cfg.localModel}`);
  console.log(`${c.bold("delegate:")}     ${cfg.delegateModel}`);
  console.log(
    `${c.bold("p2p:")}          ${cfg.p2p.enabled ? c.green("enabled") : c.yellow("disabled")} ` +
      `@ ${cfg.p2p.host}:${cfg.p2p.port} (timeout ${cfg.p2p.timeoutMs}ms)`,
  );
  if (cfg.p2p.enabled) {
    try {
      const { PeerClient } = await import("../p2p.js");
      const peer = new PeerClient({ host: cfg.p2p.host, port: cfg.p2p.port });
      const ok = await peer.ping();
      console.log(`${c.bold("peer health:")}  ${ok ? c.green("reachable") : c.red("unreachable")}`);
    } catch (err) {
      console.log(`${c.bold("peer health:")}  ${c.red(String(err?.message ?? err))}`);
    }
  }
  await rag._ensure();
  console.log(`${c.bold("rag chunks:")}    ${rag.chunks.length}`);
  const expenses = await ew.expenses.readAll();
  const journal = await ew.journal.readAll();
  console.log(`${c.bold("expenses:")}      ${expenses.length}`);
  console.log(`${c.bold("journal:")}       ${journal.length}`);
}
