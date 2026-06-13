// Example plugin: log-metrics. Logs in-process metrics at
// start-up via the `onLoad` hook. v3.0.0 keeps this as a
// reference for users who want to inspect metrics from a
// custom loader.

export default {
  name: "log-metrics-example",
  version: "0.1.0",
  hooks: {
    onLoad({ ew, log }) {
      const m = ew.metrics;
      if (!m) {
        log.warn("no metrics object on ew");
        return;
      }
      const counters = m.counters ? [...m.counters.entries()] : [];
      log.info("metrics at start-up", {
        counters: Object.fromEntries(counters),
        histograms: m.histograms ? m.histograms.size : 0,
      });
    },
  },
};
