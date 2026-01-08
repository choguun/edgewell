import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { JsonlStore } from "../src/store.js";
import { ProfileStore } from "../src/profile.js";

test("JsonlStore appends and reads records", async () => {
  const file = `.tmp-store-${Date.now()}.jsonl`;
  const s = new JsonlStore(file);
  await s.append({ kind: "expense", amount: 10, category: "food" });
  await s.append({ kind: "expense", amount: 5, category: "transport" });
  const all = await s.readAll();
  assert.equal(all.length, 2);
  assert.equal(all[0].amount, 10);
  const food = await s.filter((e) => e.category === "food");
  assert.equal(food.length, 1);
  await fs.rm(file, { force: true });
});

test("ProfileStore saves and reloads with defaults merged", async () => {
  const file = `.tmp-profile-${Date.now()}.json`;
  const p = new ProfileStore(file);
  const initial = await p.load();
  assert.ok(initial.goals.health.length >= 1, "default goals present");
  await p.update({ name: "ada" });
  const reloaded = new ProfileStore(file);
  const loaded = await reloaded.load();
  assert.equal(loaded.name, "ada");
  await fs.rm(file, { force: true });
});
