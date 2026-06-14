// @ts-nocheck
import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { EncryptedJsonlStore } from "../src/encrypted-store.js";

const pass = "test-pass-1234";

test("EncryptedJsonlStore round-trips records", async () => {
  const file = `.tmp-enc-${Date.now()}.json`;
  const s = new EncryptedJsonlStore(file, { getPassphrase: async () => pass });
  await s.append({ kind: "expense", amount: 10, category: "food" });
  await s.append({ kind: "expense", amount: 20, category: "transport" });
  const all = await s.readAll();
  assert.equal(all.length, 2);
  assert.equal(all[1].amount, 20);
  // The on-disk file should not contain plaintext amounts.
  const raw = await fs.readFile(file, "utf8");
  assert.ok(!raw.includes("transport"));
  await fs.rm(file, { force: true });
});

test("EncryptedJsonlStore clears all records", async () => {
  const file = `.tmp-enc-clear-${Date.now()}.json`;
  const s = new EncryptedJsonlStore(file, { getPassphrase: async () => pass });
  await s.append({ kind: "expense", amount: 5, category: "food" });
  await s.clear();
  const all = await s.readAll();
  assert.equal(all.length, 0);
  await fs.rm(file, { force: true });
});
