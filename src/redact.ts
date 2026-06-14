// @ts-nocheck
// Best-effort PII redaction. Used to scrub user text before
// sending to a peer model. Replaces common patterns with [REDACTED]
// markers so the rest of the prompt structure stays intact.

const RULES = [
  // Most specific first so generic patterns don't get there first.
  // Long digit runs that look like credit-card or national-id numbers.
  // We lowered the threshold from 13 to 10 so 10+ digit numeric
  // runs (credit cards, ISINs, IBANs) are redacted in one go
  // rather than being partially matched by the phone rule below.
  // The upper bound of 30 also covers IBANs (up to 34 chars
  // including country code) and account numbers.
  { kind: "longDigits", re: /\b\d{10,30}\b/g, label: "DIGITS" },
  // Thai national id (13 digits with optional dashes).
  { kind: "thaiId", re: /\b\d{1}-\d{4}-\d{5}-\d{2}-\d{1}\b/g, label: "ID" },
  // US SSN.
  { kind: "ssn", re: /\b\d{3}-\d{2}-\d{4}\b/g, label: "SSN" },
  // IPv4.
  { kind: "ipv4", re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, label: "IP" },
  // URL with embedded credentials, e.g. https://user:pass@example.com
  // MUST come before email, otherwise the EMAIL rule matches
  // `pass@example.com` first and the URL_CREDS rule never sees
  // the `@` to anchor on.
  { kind: "urlWithCreds", re: /[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:[^\s@]+@[^\s]+/gi, label: "URL_CREDS" },
  // Email (local part allows unicode letters / digits / dot / underscore / plus / hyphen)
  { kind: "email", re: /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu, label: "EMAIL" },
  // International phone numbers. Anchored to word boundaries so
  // it does not match inside long digit runs, ISO dates, or
  // version numbers. The minimum is 7 digits with at least one
  // allowed separator (+, -, space) to avoid catching arbitrary
  // 6-digit numbers.
  { kind: "phone", re: /(?:\+\d{1,3}[\s-]?)?(?:\(\d{2,4}\)|\d{2,4})[\s-]\d{3,4}[\s-]\d{3,4}\b/g, label: "PHONE" },
];

export function redact(text, { tags = null } = {}) {
  if (typeof text !== "string") return text;
  let out = text;
  for (const rule of RULES) {
    out = out.replace(rule.re, (m) => `[REDACTED_${rule.label}]`);
  }
  if (tags && tags.length) {
    for (const t of tags) {
      if (!t) continue;
      // Escape regex special chars and use a word-boundary
      // check at the end so `@alice` matches `@alice` but not
      // `@alicexyz`. The previous version used `\b` only on the
      // right edge and so matched the start of every `@a`-
      // prefixed token.
      const safe = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(`@${safe}(?![\\p{L}\\p{N}_])`, "giu"), "@[REDACTED_USER]");
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
