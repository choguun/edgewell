// Example plugin: v3-stats. Demonstrates the v3.0.0
// `onLoad` hook by emitting a structured log line at start-up
// with the plugin's version and the current data directory.
//
// To enable, run EdgeWell with:
//   EDGEWELL_PLUGINS=./examples/plugins node bin/edgewell.js status

export default {
  name: "v3-stats-example",
  version: "0.1.0",
  hooks: {
    onLoad({ ew, log }) {
      log.info("v3-stats-example loaded", {
        version: "0.1.0",
        dataDir: ew.cfg?.data?.dir ?? "<unknown>",
        journal: ew.journal ? "<store>" : "<missing>",
        rag: ew.rag ? "<index>" : "<missing>",
      });
    },
  },
};
