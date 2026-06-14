// @ts-nocheck
import { EdgeWellLLM } from "../qvac.js";
import { startServer } from "../p2p.js";
import { header, c, parseFlags } from "../cli.js";

export async function serveCommand(args, { cfg }) {
  const flags = parseFlags(args, { port: cfg.p2p.port, host: cfg.p2p.host });
  header(`EdgeWell P2P server on ${flags.host}:${flags.port}`);
  const llm = new EdgeWellLLM({ model: cfg.delegateModel });
  console.log(c.dim(`loading model ${cfg.delegateModel}...`));
  await llm.load();
  console.log(c.green("model loaded"));
  const server = await startServer({
    host: flags.host,
    port: Number(flags.port),
    llm,
    model: cfg.delegateModel,
  });
  console.log(c.green(`listening on http://${server.host}:${server.port}`));
  process.on("SIGINT", async () => {
    console.log(c.yellow("\nshutting down..."));
    await llm.unload();
    await server.close();
    process.exit(0);
  });
}
