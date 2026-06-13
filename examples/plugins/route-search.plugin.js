// Example plugin: route-search. Adds a /search?q=... route to the
// companion server that runs the lexical RAG search and returns
// the top hits as JSON.

export default {
  name: "route-search-example",
  version: "0.1.0",
  hooks: {
    registerRoute({ register, ew }) {
      register({
        method: "GET",
        pattern: /^\/search$/,
        handler: async ({ req, res }) => {
          const url = new URL(req.url, "http://x");
          const q = url.searchParams.get("q") ?? "";
          const hits = await ew.rag.search(q, 5);
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ query: q, hits }));
        },
      });
    },
  },
};
