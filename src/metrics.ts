// Tiny in-process metrics. Counters and histograms with quantiles.
// Not Prometheus-compatible on purpose - we just need something
// simple that can be JSON-dumped to a /metrics endpoint and
// inspected with `edgewell status`.

export type Tags = Record<string, string | number | boolean>;

/** Linear-interpolation quantile (R-7). Returns 0 for an empty array. */
function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1];
  if (next !== undefined) {
    return (sorted[base] ?? 0) + rest * (next - (sorted[base] ?? 0));
  }
  return sorted[base] ?? 0;
}

export interface MetricsSnapshot {
  counters: Record<string, number>;
  histograms: Record<
    string,
    { count: number; min: number; max: number; mean: number; p50: number; p90: number; p99: number }
  >;
}

interface HistogramState {
  values: number[];
}

export class Metrics {
  public counters: Map<string, number> = new Map();
  public histograms: Map<string, HistogramState> = new Map();

  inc(name: string, n: number = 1, tags: Tags = {}): void {
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

  observe(name: string, value: number, tags: Tags = {}): void {
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

  snapshot(): MetricsSnapshot {
    const counters: Record<string, number> = Object.fromEntries(this.counters);
    const histograms: MetricsSnapshot["histograms"] = {};
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

  reset(): void {
    this.counters.clear();
    this.histograms.clear();
  }

  _key(name: string, tags: Tags): string {
    const keys = Object.keys(tags).sort();
    if (keys.length === 0) return name;
    return `${name}{${keys.map((k) => `${k}=${tags[k]}`).join(",")}}`;
  }
}

/** Time an async function and record the duration in ms. */
export async function timed<T>(metrics: Metrics, name: string, tags: Tags, fn: () => Promise<T>): Promise<T> {
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
