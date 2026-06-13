// Example plugin: heartbeat. Adds a /heartbeat route to the
// companion server that returns the current ISO timestamp and a
// simple "ok" status. Useful for load balancer health checks.

export default {
  name: "heartbeat-example",
  version: "0.1.0",
  hooks: {
    registerRoute({ register }) {
      register({
        method: "GET",
        pattern: /^\/heartbeat$/,
        handler: async ({ res }) => {
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ ok: true, ts: new Date().toISOString() }));
        },
      });
    },
  },
};
