// `edgewell doctor` runs a sequence of health checks and prints a
// short report. Useful as a first-stop when something is off.

import { c, header } from "../cli.js";
import { PeerClient } from "../p2p.js";

const checks = [];

async function check(name, fn) {
  try {
    const out = await fn();
    checks.push({ name, ok: true, info: out });
  } catch (err) {
    checks.push({ name, ok: false, error: String(err?.message ?? err) });
  }
}

export async function doctorCommand(_args, ew) {
  header("EdgeWell doctor");
  const { cfg, rag, profile, journal, expenses } = ew;

  await check("node version", async () => {
    const v = process.versions.node;
    const [maj, min] = v.split(".").map(Number);
    if (maj < 22 || (maj === 22 && min < 17)) {
      throw new Error(`node ${v} is older than required 22.17`);
    }
    return v;
  });

  await check("data dir writable", async () => {
    const fs = await import("node:fs/promises");
    await fs.access(cfg.data.dir, fs.constants.W_OK).catch(async () => {
      await fs.mkdir(cfg.data.dir, { recursive: true });
    });
    return cfg.data.dir;
  });

  await check("qvac sdk installed", async () => {
    try {
      const sdk = await import("@qvac/sdk");
      const keys = Object.keys(sdk);
      if (keys.length === 0) throw new Error("sdk exports nothing");
      return `${keys.length} exports`;
    } catch (err) {
      throw new Error("not installed");
    }
  });

  await check("rag index readable", async () => {
    await rag._ensure();
    return `${rag.chunks.length} chunks`;
  });

  await check("profile readable", async () => {
    const p = await profile.load();
    return `name=${p.name}, lang=${p.language}`;
  });

  await check("journal store", async () => {
    const n = await journal.count();
    return `${n} entries`;
  });

  await check("expense store", async () => {
    const n = await expenses.count();
    return `${n} entries`;
  });

  if (cfg.p2p.enabled) {
    await check("p2p peer health", async () => {
      const peer = new PeerClient({ host: cfg.p2p.host, port: cfg.p2p.port });
      const ok = await peer.ping();
      if (!ok) throw new Error(`no answer from ${cfg.p2p.host}:${cfg.p2p.port}`);
      return `reachable at ${cfg.p2p.host}:${cfg.p2p.port}`;
    });
  } else {
    checks.push({ name: "p2p peer health", ok: true, info: "delegation disabled (skipped)" });
  }

  let bad = 0;
  for (const c1 of checks) {
    const status = c1.ok ? c.green("OK  ") : c.red("FAIL");
    const line = `${status}  ${c.bold(c1.name)}  ${c.dim(c1.ok ? c1.info ?? "" : c1.error ?? "")}`;
    console.log(line);
    if (!c1.ok) bad++;
  }
  console.log();
  console.log(bad === 0 ? c.green("all checks passed") : c.red(`${bad} check(s) failed`));
  process.exit(bad === 0 ? 0 : 1);
}
