// Benchmark harness for the v3.0.0 CLI. Pure JS, no external
// dependencies. The harness runs an async function N times and
// reports the median, p95, and mean wall-clock time. Useful for
// the `bench` command and for performance regression tests.

export interface RunBenchmarkOptions {
  name?: string;
  fn: () => Promise<unknown> | unknown;
  trials?: number;
  warmup?: number;
}

export interface BenchmarkFailure {
  trial: number;
  error: string;
}

export interface BenchmarkResult {
  name: string;
  trials: number;
  warmup: number;
  samples: number[];
  median: number;
  p95: number;
  mean: number;
  min: number;
  max: number;
  failures: BenchmarkFailure[];
  ok: boolean;
}

export async function runBenchmark({
  name,
  fn,
  trials = 5,
  warmup = 1,
}: RunBenchmarkOptions): Promise<BenchmarkResult> {
  if (typeof fn !== "function") throw new Error("fn is required");
  if (!Number.isInteger(trials) || trials < 1) {
    throw new Error("trials must be a positive integer");
  }
  if (!Number.isInteger(warmup) || warmup < 0) {
    throw new Error("warmup must be a non-negative integer");
  }
  const samples: number[] = [];
  const failures: BenchmarkFailure[] = [];
  for (let i = 0; i < warmup; i++) {
    try { await fn(); } catch { /* swallow warmup errors */ }
  }
  for (let i = 0; i < trials; i++) {
    const t0 = performance.now();
    try {
      await fn();
      samples.push(performance.now() - t0);
    } catch (err) {
      const e = err as Error | undefined;
      failures.push({ trial: i, error: e?.message ?? String(err) });
    }
  }
  if (samples.length === 0) {
    // Every trial failed; return a shape that callers can detect.
    return {
      name: name ?? "<unnamed>",
      trials,
      warmup,
      samples: [],
      median: NaN,
      p95: NaN,
      mean: NaN,
      min: NaN,
      max: NaN,
      failures,
      ok: false,
    };
  }
  samples.sort((a, b) => a - b);
  const sum = samples.reduce((a, b) => a + b, 0);
  return {
    name: name ?? "<unnamed>",
    trials,
    warmup,
    samples,
    median: samples[Math.floor(samples.length / 2)] ?? NaN,
    p95: samples[Math.floor(samples.length * 0.95)] ?? samples[samples.length - 1] ?? NaN,
    mean: sum / samples.length,
    min: samples[0] ?? NaN,
    max: samples[samples.length - 1] ?? NaN,
    failures,
    ok: true,
  };
}

export function formatBenchResult(r: BenchmarkResult): string {
  if (r.ok === false) {
    const fLen = r.failures?.length ?? 0;
    return `${r.name}: ALL ${r.trials} TRIALS FAILED (${fLen} error(s))`;
  }
  const n = r.samples?.length ?? r.trials ?? 0;
  return `${r.name}: median=${r.median.toFixed(2)}ms p95=${r.p95.toFixed(2)}ms mean=${r.mean.toFixed(2)}ms (n=${n})`;
}
