// Example plugin: summary-daily. Adds a custom route to the
// companion server that returns a one-paragraph summary of the
// last 24 hours of journal entries.

export default {
  name: "summary-daily-example",
  version: "0.1.0",
  hooks: {
    registerRoute({ register, ew }) {
      register({
        method: "GET",
        pattern: /^\/summary\/daily$/,
        handler: async ({ res }) => {
          const all = await ew.journal.readAll();
          const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
          const recent = all.filter((e) => new Date(e._ts).getTime() >= dayAgo);
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({
            count: recent.length,
            sample: recent.slice(-3).map((e) => e.text),
          }));
        },
      });
    },
  },
};
