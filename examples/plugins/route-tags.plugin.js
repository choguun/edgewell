// Example plugin: route-tags. Adds a /tags route to the companion
// server that returns the top N tags as JSON.

export default {
  name: "route-tags-example",
  version: "0.1.0",
  hooks: {
    registerRoute({ register, ew }) {
      register({
        method: "GET",
        pattern: /^\/tags$/,
        handler: async ({ res }) => {
          const all = await ew.journal.readAll();
          const counts = new Map();
          for (const e of all) for (const t of e.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
          const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ tags: sorted.slice(0, 20) }));
        },
      });
    },
  },
};
