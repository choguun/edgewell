// Example plugin: route-stats. Adds a /stats route to the
// companion server that returns basic counts: journal entries,
// expenses, and RAG chunks.

export default {
  name: "route-stats-example",
  version: "0.1.0",
  hooks: {
    registerRoute({ register, ew }) {
      register({
        method: "GET",
        pattern: /^\/stats$/,
        handler: async ({ res }) => {
          const journal = await ew.journal.readAll();
          const expenses = await ew.expenses.readAll();
          await ew.rag._ensure();
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({
            journal: journal.length,
            expenses: expenses.length,
            ragChunks: ew.rag.chunks.length,
          }));
        },
      });
    },
  },
};
