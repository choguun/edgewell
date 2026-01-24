// Tiny in-process metrics. Counters and histograms with quantiles.
// Not Prometheus-compatible on purpose - we just need something
// simple that can be JSON-dumped to a /metrics endpoint and
// inspected with `edgewell status`.

export class Metrics {
  constructor() {
    this.counters = new Map();
    this.histograms = new Map();
  }

  inc(name, n = 1, tags = {}) {
    const key = this._key(name, tags);
    this.counters.set(key, (this.counters.get(key) ?? 0) + n);
  }

  observe(name, value, tags = {}) {
    const key = this._key(name, tags);
    let h = this.histograms.get(key);
    if (!h) {
      h = { values: [] };
      this.histograms.set(key, h);
    }
    h.values.push(value);
  }

  snapshot() {
    const counters = Object.fromEntries(this.counters);
    const histograms = {};
    for (const [k, h] of this.histograms) {
      const sorted = [...h.values].sort((a, b) => a - b);
      histograms[k] = {
        count: sorted.length,
        min: sorted[0] ?? 0,
        max: sorted[sorted.length - 1] ?? 0,
        mean: sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0,
        p50: q(sorted, 0.5),
        p90: q(sorted, 0.9),
        p99: q(sorted, 0.99),
      };
    }
    return { counters, histograms };
  }

  reset() {
    this.counters.clear();
    this.histograms.clear();
  }

  _key(name, tags) {
    const keys = Object.keys(tags).sort();
    if (keys.length === 0) return name;
    return `${name}{${keys.map((k) => `${k}=${tags[k]}`).join(",")}}`;
  }
}

function q(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
}

// Helper: time an async function and record the duration in ms.
export async function timed(metrics, name, tags, fn) {
  const t0 = Date.now();
  try {
    return await fn();
  } finally {
    metrics.observe(name, Date.now() - t0, tags);
  }
}
