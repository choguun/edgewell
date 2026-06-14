// @ts-nocheck
// Tiny in-process metrics. Counters and histograms with quantiles.
// Not Prometheus-compatible on purpose - we just need something
// simple that can be JSON-dumped to a /metrics endpoint and
// inspected with `edgewell status`.

// Linear-interpolation quantile. The old "q" function used
// `Math.floor(p * N)` which biased quantiles upward: for
// `q([1,2], 0.5)` it returned 2 (the max) instead of 1.5 (the
// median). The new function uses the standard R-7 quantile:
// `pos = (N - 1) * p; sorted[floor(pos)] + (pos - floor(pos)) *
// (sorted[ceil(pos)] - sorted[floor(pos)])`.
function quantile(sorted, p) {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function isNonNegativeFinite(n) {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

export class Metrics {
  constructor() {
    this.counters = new Map();
    this.histograms = new Map();
  }

  inc(name, n = 1, tags = {}) {
    if (typeof name !== "string" || name.length === 0) {
      throw new Error("inc requires a non-empty string name");
    }
    // Reject NaN / Infinity increments so a buggy caller does
    // not poison the counter map. A typo in a downstream module
    // would otherwise produce silent NaN values that
    // JSON.stringify would render as `null`.
    if (!Number.isFinite(n)) {
      throw new Error(`inc requires a finite numeric increment, got ${n}`);
    }
    const key = this._key(name, tags);
    this.counters.set(key, (this.counters.get(key) ?? 0) + n);
  }

  observe(name, value, tags = {}) {
    if (typeof name !== "string" || name.length === 0) {
      throw new Error("observe requires a non-empty string name");
    }
    // Drop NaN / non-finite samples silently. A small number of
    // such samples is noise; a flood of them will be visible as
    // a count mismatch between `count` and the number of
    // observe() calls.
    if (!Number.isFinite(value)) return;
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
      // Filter NaN / non-finite values for the snapshot stats
      // so the JSON output never contains `null` for `min` /
      // `max` / `mean` due to a bad upstream sample.
      const sorted = h.values.filter(Number.isFinite).sort((a, b) => a - b);
      histograms[k] = {
        count: sorted.length,
        min: sorted[0] ?? 0,
        max: sorted[sorted.length - 1] ?? 0,
        mean: sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0,
        p50: quantile(sorted, 0.5),
        p90: quantile(sorted, 0.9),
        p99: quantile(sorted, 0.99),
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

// Helper: time an async function and record the duration in ms.
export async function timed(metrics, name, tags, fn) {
  if (typeof fn !== "function") {
    throw new Error("timed requires a function");
  }
  const t0 = Date.now();
  try {
    return await fn();
  } finally {
    metrics.observe(name, Date.now() - t0, tags);
  }
}
