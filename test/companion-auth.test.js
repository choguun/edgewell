// Tests for the companion HMAC auth tokens.

import { test } from "node:test";
import assert from "node:assert/strict";
import { newSecret, signToken, verifyToken } from "../src/companion/auth.js";

test("newSecret returns a non-empty string", () => {
  const s = newSecret();
  assert.ok(typeof s === "string");
  assert.ok(s.length > 10);
});

test("newSecret returns a different value each call", () => {
  const a = newSecret();
  const b = newSecret();
  assert.notEqual(a, b);
});

test("signToken returns a two-part dot-separated string", () => {
  const secret = newSecret();
  const t = signToken({ secret, subject: "phone-1" });
  assert.equal(t.split(".").length, 2);
});

test("verifyToken accepts a freshly signed token", () => {
  const secret = newSecret();
  const t = signToken({ secret, subject: "phone-1" });
  const v = verifyToken({ token: t, secret });
  assert.equal(v.ok, true);
  assert.equal(v.subject, "phone-1");
});

test("verifyToken rejects a token signed with a different secret", () => {
  const t = signToken({ secret: newSecret(), subject: "phone-1" });
  const v = verifyToken({ token: t, secret: newSecret() });
  assert.equal(v.ok, false);
  assert.equal(v.reason, "bad-sig");
});

test("verifyToken rejects an expired token", () => {
  const secret = newSecret();
  const t = signToken({ secret, subject: "phone-1", ttlMs: -1 });
  const v = verifyToken({ token: t, secret });
  assert.equal(v.ok, false);
  assert.equal(v.reason, "expired");
});

test("verifyToken rejects a malformed token", () => {
  const v = verifyToken({ token: "garbage", secret: newSecret() });
  assert.equal(v.ok, false);
  assert.equal(v.reason, "malformed");
});

test("verifyToken rejects an empty token", () => {
  const v = verifyToken({ token: "", secret: newSecret() });
  assert.equal(v.ok, false);
});

test("signToken throws without a secret", () => {
  assert.throws(() => signToken({ subject: "x" }), /secret/);
});

test("signToken throws without a subject", () => {
  assert.throws(() => signToken({ secret: newSecret() }), /subject/);
});
