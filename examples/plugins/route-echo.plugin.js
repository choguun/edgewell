// Example plugin: route-echo. Adds an /echo route to the companion
// server that returns the request body as JSON. Useful for
// debugging the companion server from a phone.

export default {
  name: "route-echo-example",
  version: "0.1.0",
  hooks: {
    registerRoute({ register }) {
      register({
        method: "POST",
        pattern: /^\/echo$/,
        handler: async ({ res, body }) => {
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ echoed: body ?? null }));
        },
      });
    },
  },
};
