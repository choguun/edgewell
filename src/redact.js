// Best-effort PII redaction. Used to scrub user text before
// sending to a peer model. Replaces common patterns with [REDACTED]
// markers so the rest of the prompt structure stays intact.

const RULES = [
  // Most specific first so generic patterns don't get there first.
  // Long digit runs that look like credit-card or national-id numbers.
  { kind: "longDigits", re: /\b\d{13,19}\b/g, label: "DIGITS" },
  // Thai national id (13 digits with optional dashes).
  { kind: "thaiId", re: /\b\d{1}-\d{4}-\d{5}-\d{2}-\d{1}\b/g, label: "ID" },
  // US SSN.
  { kind: "ssn", re: /\b\d{3}-\d{2}-\d{4}\b/g, label: "SSN" },
  // IPv4.
  { kind: "ipv4", re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, label: "IP" },
  // Email
  { kind: "email", re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, label: "EMAIL" },
  // International phone numbers, simple heuristic.
  { kind: "phone", re: /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g, label: "PHONE" },
];

export function redact(text, { tags = null } = {}) {
  if (typeof text !== "string") return text;
  let out = text;
  for (const rule of RULES) {
    out = out.replace(rule.re, (m) => `[REDACTED_${rule.label}]`);
  }
  if (tags && tags.length) {
    for (const t of tags) {
      const safe = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(`@${safe}\\b`, "gi"), "@[REDACTED_USER]");
    }
  }
  return out;
}

export function redactRecord(rec, { tags = null } = {}) {
  if (rec == null || typeof rec !== "object") return rec;
  const out = {};
  for (const [k, v] of Object.entries(rec)) {
    if (typeof v === "string") out[k] = redact(v, { tags });
    else if (Array.isArray(v)) out[k] = v.map((x) => (typeof x === "string" ? redact(x, { tags }) : x));
    else out[k] = v;
  }
  return out;
}
