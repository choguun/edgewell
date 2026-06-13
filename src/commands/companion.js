// `edgewell companion` starts the v3.0.0 mobile companion HTTP
// server. It reuses the EdgeWell stack already wired up in
// `createEdgeWell`, exposes chat, journal, expense, and profile
// endpoints to a paired phone, and announces itself on the LAN via
// the mDNS stub.

import { header, c, parseFlags } from "../cli.js";
import { startCompanion } from "../companion/server.js";
import { makeAnnouncer, buildServiceUrl } from "../companion/mdns.js";
import { newSecret, signToken } from "../companion/auth.js";

export async function companionCommand(args, ew) {
  const flags = parseFlags(args, {
    host: "127.0.0.1",
    port: 8787,
    auth: true,
    "print-token": false,
  });
  const host = String(flags.host);
  const port = Number(flags.port);
  const useAuth = flags.auth !== false && flags.auth !== "false";
  let secret = null;
  if (useAuth) {
    secret = process.env.EDGEWELL_COMPANION_SECRET || newSecret();
    if (flags["print-token"] === true || flags["print-token"] === "true") {
      const token = signToken({ secret, subject: "console" });
      console.log(c.cyan(`bearer token: ${token}`));
    }
  }
  header(`EdgeWell companion on ${host}:${port}`);
  console.log(c.dim(`auth: ${useAuth ? "enabled" : "disabled"}`));
  const { server, port: actualPort } = await startCompanion({ ew, secret, host, port });
  const announcer = makeAnnouncer({ name: "edgewell", host, port: actualPort });
  await announcer.start();
  console.log(c.green(buildServiceUrl({ host, port: actualPort, name: "edgewell" })));
  process.on("SIGINT", async () => {
    console.log(c.yellow("\nshutting down companion..."));
    await announcer.stop();
    await new Promise((resolve) => server.close(resolve));
    process.exit(0);
  });
}
