// @ts-nocheck
// `edgewell uptime` reports the EdgeWell process uptime in
// seconds. Useful for the companion server's /health endpoint
// and for debugging.

import { c } from "../cli.js";

const start = Date.now();

export async function uptimeCommand(_args) {
  const seconds = Math.round((Date.now() - start) / 1000);
  console.log(`${c.bold("uptime:")} ${seconds}s`);
}
