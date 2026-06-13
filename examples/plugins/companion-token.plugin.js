// Example plugin: companion-token. Demonstrates the v3.0.0
// `registerRoute` hook by adding a `/token` endpoint to the
// companion server. The endpoint returns a fresh bearer token for
// a supplied subject, signed with the server's secret.
//
// In a production deployment you would obviously not hand out
// signed tokens from an unauthenticated endpoint. This plugin is
// for development and demo purposes only.

import { signToken } from "../../src/companion/auth.js";

export default {
  name: "companion-token-example",
  version: "0.1.0",
  hooks: {
    registerRoute({ register, ew }) {
      const secret = process.env.EDGEWELL_COMPANION_SECRET ?? "dev-secret";
      register({
        method: "POST",
        pattern: /^\/token$/,
        handler: async ({ res, body }) => {
          const subject = body?.subject ?? "anon";
          const ttlMs = Number(body?.ttlMs ?? 60 * 60 * 1000);
          const token = signToken({ secret, subject, ttlMs });
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ token, subject, ttlMs }));
        },
      });
    },
  },
};
