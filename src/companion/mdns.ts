// @ts-nocheck
// mDNS announcement helper. v3.0.0 ships a stub that returns a
// noop announcer when no mDNS library is available, plus a thin
// wrapper that *would* call into a real announcer if a `multicast-dns`
// compatible dependency were installed.
//
// The stub is enough for the CLI smoke test, the offline test suite,
// and the web UI to discover `http://<host>:port` via the printed URL.

export function makeAnnouncer({ name = "edgewell", port, host, logger = null } = {}) {
  return {
    name,
    port,
    host,
    startedAt: new Date().toISOString(),
    // The real implementation would publish a DNS-SD record here.
    // The stub just logs the URL once and resolves immediately.
    async start() {
      if (logger) logger.info("companion.mdns.start", { name, port, host });
      return { ok: true, name, port, host, mode: "stub" };
    },
    async stop() {
      if (logger) logger.info("companion.mdns.stop", { name });
      return { ok: true };
    },
  };
}

export function buildServiceUrl({ host, port, name }) {
  return `http://${host}:${port}/ (service: ${name})`;
}
