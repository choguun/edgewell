// @ts-nocheck
// `edgewell companion` starts the v3.0.0 mobile companion HTTP
// server. It reuses the EdgeWell stack already wired up in
// `createEdgeWell`, exposes chat, journal, expense, and profile
// endpoints to a paired phone, and announces itself on the LAN via
// the mDNS stub.

import path from "path";
import { promises as fs } from "fs";
import os from "os";
import { header, c, parseFlags } from "../cli.js";
import { startCompanion } from "../companion/server.js";
import { makeAnnouncer, buildServiceUrl } from "../companion/mdns.js";
import { newSecret, signToken } from "../companion/auth.js";
import { projectRoot } from "../config.js";

/**
 * v3.0.2: pure helper that decides whether the companion
 * should enforce bearer-token auth based on the parsed CLI
 * flags. Extracted so the four cases (default, `--auth=true`,
 * `--auth=false`, `--no-auth`) can be unit-tested without
 * spinning up an HTTP listener. Returns `true` if auth
 * should be enabled, `false` otherwise.
 */
export function resolveAuthFlag(flags) {
  const noAuthFlag =
    flags["no-auth"] === true || flags["no-auth"] === "true";
  const authFalse = flags.auth === false || flags.auth === "false";
  return !(noAuthFlag || authFalse);
}

export async function companionCommand(args, ew) {
  const flags = parseFlags(args, {
    host: "0.0.0.0",
    port: 8787,
    auth: true,
    "print-token": false,
    "allow-privileged": false,
  });
  const host = String(flags.host);
  const port = Number(flags.port);
  const allowPrivileged = flags["allow-privileged"] === true || flags["allow-privileged"] === "true";
  // Refuse privileged ports (<1024) unless the user opts in. On
  // macOS this would silently bind anyway; on Linux it errors
  // with EACCES, which is the worst possible UX.
  if (port < 1024 && !allowPrivileged) {
    console.error(c.red(`refusing to bind privileged port ${port}`));
    console.error("pass --allow-privileged to bind anyway (requires root on most systems)");
    process.exit(2);
  }
  // v3.0.2: accept both `--auth=false` and the more discoverable
  // `--no-auth` flag. The previous version only recognized
  // `flags.auth`, so `--no-auth` landed as an unrelated `no-auth`
  // key in the flag bag and the user got a silent 401 on the
  // first call. Either flag, when set, disables auth.
  const noAuthFlag = flags["no-auth"] === true || flags["no-auth"] === "true";
  const authFalse = flags.auth === false || flags.auth === "false";
  const useAuth = !(noAuthFlag || authFalse);
  let secret = null;
  if (useAuth) {
    secret = process.env.EDGEWELL_COMPANION_SECRET || newSecret();
    if (flags["print-token"] === true || flags["print-token"] === "true") {
      const token = signToken({ secret, subject: "console" });
      console.log(c.cyan(`bearer token: ${token}`));
    }
  }
  // Default webDir to the bundled web/ folder under the project
  // root. Works in both dev and built layouts. Fall back to
  // null (no static serving) if the directory is missing.
  const candidateWebDir = path.join(projectRoot(), "web");
  let webDir: string | null = candidateWebDir;
  try {
    await fs.access(candidateWebDir);
  } catch {
    webDir = null;
  }
  header(`EdgeWell companion on ${host}:${port}`);
  console.log(c.dim(`auth: ${useAuth ? "enabled" : "disabled"}`));
  if (webDir) console.log(c.dim(`serving web UI from ${webDir}`));
  const { server, port: actualPort } = await startCompanion({ ew, secret, host, port, webDir });
  const announcer = makeAnnouncer({ name: "edgewell", host, port: actualPort });
  await announcer.start();
  
  if (host === "0.0.0.0") {
    console.log(c.green(`EdgeWell companion server listening at:`));
    console.log(c.green(`  http://localhost:${actualPort}/`));
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === "IPv4" && !iface.internal) {
          console.log(c.green(`  http://${iface.address}:${actualPort}/`));
        }
      }
    }
  } else {
    console.log(c.green(buildServiceUrl({ host, port: actualPort, name: "edgewell" })));
  }
  process.on("SIGINT", async () => {
    console.log(c.yellow("\nshutting down companion..."));
    await announcer.stop();
    await new Promise((resolve) => server.close(resolve));
    process.exit(0);
  });
}
