// Helper that turns the existing Metrics instance into a friendly
// snapshot for the CLI. Counters keep their keys; histograms get
// pre-computed quantiles so the command does not have to do the
// math every time.

export function collectMetricsSnapshot(ew) {
  const m = ew.metrics;
  if (!m) return { counters: new Map(), histograms: new Map() };
  const counters = new Map(m.counters);
  const histograms = new Map();
  for (const [k, h] of m.histograms) {
    histograms.set(k, {
      count: h.values.length,
      p50: quantile(h.values, 0.5),
      p90: quantile(h.values, 0.9),
      p99: quantile(h.values, 0.99),
    });
  }
  return { counters, histograms };
}

export function quantile(values, q) {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}
