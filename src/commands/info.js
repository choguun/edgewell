// `edgewell info` prints a one-screen overview of EdgeWell: name,
// version, node version, data directory, RAG size, and the list
// of available subcommands.

import { c, header } from "../cli.js";
import { readPackageJson } from "../config.js";

export async function infoCommand(args, ew) {
  header("EdgeWell info");
  const pkg = readPackageJson();
  const journal = await ew.journal.readAll();
  const expenses = await ew.expenses.readAll();
  await ew.rag._ensure();
  console.log(`${c.bold("name:")}     ${pkg.name}`);
  console.log(`${c.bold("version:")}  ${pkg.version}`);
  console.log(`${c.bold("node:")}     ${process.version}`);
  console.log(`${c.bold("platform:")} ${process.platform} ${process.arch}`);
  console.log(`${c.bold("data dir:")} ${ew.cfg.data.dir}`);
  console.log(`${c.bold("journal:")}  ${journal.length} entries`);
  console.log(`${c.bold("expenses:")} ${expenses.length} entries`);
  console.log(`${c.bold("rag:")}      ${ew.rag.chunks.length} chunks`);
  if (args[0] === "--all") {
    console.log(`${c.bold("agents:")}   health, finance, sleep, nutrition, hydration, activity`);
    console.log(`${c.bold("profiles:")} mobile, tinkerer, desktop`);
  }
}
