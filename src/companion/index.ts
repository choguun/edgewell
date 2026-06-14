// @ts-nocheck
// Companion entry point. Re-exports the public surface of the v3.0.0
// companion subsystem: auth tokens, router, HTTP server, mDNS stub.

export { newSecret, signToken, verifyToken } from "./auth.js";
export { Router, send } from "./router.js";
export { buildRouter, startCompanion } from "./server.js";
export { makeAnnouncer, buildServiceUrl } from "./mdns.js";
