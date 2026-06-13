// `edgewell countdown <seconds>` sleeps for the given number of
// seconds and prints the elapsed time. v3.0.0 keeps this as a
// simple demo for the spinner and timer APIs.

import { c } from "../cli.js";

export async function countdownCommand(args) {
  const n = Number(args[0]);
  if (!Number.isFinite(n) || n < 0) {
    console.error("usage: edgewell countdown <seconds>");
    process.exit(2);
  }
  for (let i = n; i > 0; i--) {
    process.stdout.write(`\r${c.cyan(String(i).padStart(3))}s remaining`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  process.stdout.write("\r");
  console.log(c.green("done"));
}
