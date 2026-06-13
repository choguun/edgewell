// Companion session tokens. v3.0.0 ships a tiny, offline-friendly
// token system: a random 128-bit secret is shared between the phone
// (client) and the desktop (server) at first pairing time, and the
// server signs short-lived HMAC tokens that the client sends on each
// request.
//
// The implementation uses only the Node.js standard library so the
// test suite can run without `npm install` of any crypto package.

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export function newSecret() {
  return b64url(randomBytes(16));
}

export function signToken({ secret, subject, ttlMs = DEFAULT_TTL_MS, now = Date.now() }) {
  if (!secret) throw new Error("secret is required");
  if (!subject) throw new Error("subject is required");
  const exp = now + ttlMs;
  const payload = `${subject}.${exp}`;
  const sig = b64url(createHmac("sha256", secret).update(payload).digest());
  return `${b64url(Buffer.from(payload))}.${sig}`;
}

export function verifyToken({ token, secret, now = Date.now() }) {
  if (!token || !secret) return { ok: false, reason: "missing" };
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [body, sig] = parts;
  let payload;
  try {
    payload = fromB64Url(body).toString("utf8");
  } catch {
    return { ok: false, reason: "malformed" };
  }
  const dot = payload.lastIndexOf(".");
  if (dot < 0) return { ok: false, reason: "malformed" };
  const subject = payload.slice(0, dot);
  const exp = Number(payload.slice(dot + 1));
  if (!Number.isFinite(exp)) return { ok: false, reason: "malformed" };
  if (exp < now) return { ok: false, reason: "expired" };
  const expected = b64url(createHmac("sha256", secret).update(payload).digest());
  if (expected.length !== sig.length) return { ok: false, reason: "bad-sig" };
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return { ok: false, reason: "bad-sig" };
  if (!timingSafeEqual(a, b)) return { ok: false, reason: "bad-sig" };
  return { ok: true, subject, exp };
}
