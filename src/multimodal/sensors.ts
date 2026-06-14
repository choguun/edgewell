// @ts-nocheck
// Sensor pipeline. Wearables and phones emit streams of simple
// numeric events (heart rate, steps, SpO2, sleep phases, etc.). This
// module provides a tiny aggregator that turns those events into a
// text summary suitable for the journal and RAG pipelines.
//
// The aggregator is intentionally side-effect-free: callers feed it
// raw events and get back a structured summary. The CLI wires this
// to a JSONL file under `data/sensors/`.

const SUPPORTED = new Set([
  "heart_rate",
  "steps",
  "spo2",
  "sleep_phase",
  "body_temp",
  "respiration",
]);

function isSupported(kind) {
  return SUPPORTED.has(kind);
}

function average(xs) {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function summariseKind(events) {
  if (events.length === 0) return { count: 0 };
  // Filter out malformed events (missing or non-numeric value, or
  // missing ts). Without this, Math.min/max produce NaN and the
  // first/last fields are undefined, which then leak into the
  // sensor summary in confusing ways.
  const valid = events.filter(
    (e) => typeof e.value === "number" && Number.isFinite(e.value) && typeof e.ts === "string",
  );
  if (valid.length === 0) return { count: 0, invalid: events.length };
  const values = valid.map((e) => e.value);
  return {
    count: valid.length,
    invalid: events.length - valid.length,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: Number(average(values).toFixed(2)),
    first: valid[0].ts,
    last: valid[valid.length - 1].ts,
  };
}

export function summariseEvents(events) {
  const byKind = new Map();
  for (const e of events) {
    if (!isSupported(e.kind)) continue;
    if (!byKind.has(e.kind)) byKind.set(e.kind, []);
    byKind.get(e.kind).push(e);
  }
  const summary = {};
  for (const [k, evs] of byKind) summary[k] = summariseKind(evs);
  return summary;
}

export function toJournalLine(summary, date = new Date()) {
  if (!summary || typeof summary !== "object") return "";
  const parts = [];
  for (const [k, s] of Object.entries(summary)) {
    // Defensive: each entry must be an object with a numeric count.
    if (!s || typeof s !== "object" || typeof s.count !== "number" || s.count === 0) continue;
    parts.push(`${k} ${s.count}× (avg ${s.avg}, ${s.min}–${s.max})`);
  }
  if (parts.length === 0) return "";
  return `[${date.toISOString().slice(0, 10)}] wearable summary: ${parts.join("; ")}.`;
}

export { isSupported, SUPPORTED };
