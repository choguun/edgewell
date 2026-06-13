// Benchmark harness for the v3.0.0 CLI. Pure JS, no external
// dependencies. The harness runs an async function N times and
// reports the median, p95, and mean wall-clock time. Useful for
// the `bench` command and for performance regression tests.

export async function runBenchmark({ name, fn, trials = 5, warmup = 1 } = {}) {
  if (typeof fn !== "function") throw new Error("fn is required");
  const samples = [];
  for (let i = 0; i < warmup; i++) await fn();
  for (let i = 0; i < trials; i++) {
    const t0 = performance.now();
    await fn();
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  const sum = samples.reduce((a, b) => a + b, 0);
  return {
    name: name ?? "<unnamed>",
    trials,
    warmup,
    median: samples[Math.floor(samples.length / 2)],
    p95: samples[Math.floor(samples.length * 0.95)] ?? samples[samples.length - 1],
    mean: sum / samples.length,
    min: samples[0],
    max: samples[samples.length - 1],
  };
}

export function formatBenchResult(r) {
  return `${r.name}: median=${r.median.toFixed(2)}ms p95=${r.p95.toFixed(2)}ms mean=${r.mean.toFixed(2)}ms (n=${r.trials})`;
}
