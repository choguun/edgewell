// Example plugin: export-md. Adds a custom route to the companion
// server that exports the journal as a Markdown document.
//
// To enable, run EdgeWell with:
//   EDGEWELL_PLUGINS=./examples/plugins edgewell companion

export default {
  name: "export-md-example",
  version: "0.1.0",
  hooks: {
    registerRoute({ register, ew }) {
      register({
        method: "GET",
        pattern: /^\/journal\.md$/,
        handler: async ({ res }) => {
          const all = await ew.journal.readAll();
          const lines = ["# EdgeWell journal", ""];
          for (const e of all) {
            const tags = e.tags?.length ? ` _(${e.tags.join(", ")})_` : "";
            lines.push(`- **${e._ts}**${tags} — ${e.text}`);
          }
          res.statusCode = 200;
          res.setHeader("content-type", "text/markdown; charset=utf-8");
          res.end(lines.join("\n") + "\n");
        },
      });
    },
  },
};
