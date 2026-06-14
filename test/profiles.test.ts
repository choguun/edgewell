// @ts-nocheck
// Tests for the form-factor profile registry.

import { test } from "node:test";
import assert from "node:assert/strict";
import { PROFILES, pickProfile, listProfiles } from "../src/profiles.js";

test("PROFILES has mobile, tinkerer, and desktop", () => {
  assert.ok(PROFILES.mobile);
  assert.ok(PROFILES.tinkerer);
  assert.ok(PROFILES.desktop);
});

test("every profile has a label and the required knobs", () => {
  for (const [name, p] of Object.entries(PROFILES)) {
    assert.ok(p.label, `${name} has no label`);
    assert.ok(p.localModel, `${name} has no localModel`);
    assert.ok(p.rag && Number.isFinite(p.rag.chunkSize), `${name} rag missing`);
    assert.ok(p.vector && Number.isFinite(p.vector.dim), `${name} vector missing`);
  }
});

test("mobile uses a smaller model and tighter RAG knobs", () => {
  const m = pickProfile("mobile");
  assert.match(m.localModel, /1B|3B/i);
  assert.equal(m.rag.topK, 3);
  assert.equal(m.vector.dim, 96);
});

test("tinkerer favours low memory and large timeout", () => {
  const t = pickProfile("tinkerer");
  assert.equal(t.vector.dim, 64);
  assert.ok(t.p2p.timeoutMs >= 10000);
});

test("desktop enables the bigger model and disables P2P by default", () => {
  const d = pickProfile("desktop");
  assert.equal(d.p2p.enabled, false);
  assert.equal(d.vector.dim, 256);
});

test("pickProfile throws on unknown name", () => {
  assert.throws(() => pickProfile("spaceship"), /unknown profile/);
});

test("listProfiles returns the three names with labels", () => {
  const list = listProfiles();
  const names = list.map((p) => p.name).sort();
  assert.deepEqual(names, ["desktop", "mobile", "tinkerer"]);
  for (const p of list) assert.ok(p.label);
});
