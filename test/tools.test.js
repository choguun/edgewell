import { test } from "node:test";
import assert from "node:assert/strict";
import { ToolRegistry } from "../src/tools.js";

test("calculator evaluates simple expressions", async () => {
  const r = new ToolRegistry();
  const out = await r.call("calculator", { expression: "2 + 3 * 4" });
  assert.equal(out.result, 14);
});

test("calculator rejects expressions with bad characters", async () => {
  const r = new ToolRegistry();
  await assert.rejects(
    () => r.call("calculator", { expression: "rm -rf /" }),
    /disallowed/,
  );
});

test("datetime returns ISO string", async () => {
  const r = new ToolRegistry();
  const out = await r.call("datetime", {});
  assert.match(out.iso, /^\d{4}-\d{2}-\d{2}T/);
});

test("unknown tool throws", async () => {
  const r = new ToolRegistry();
  await assert.rejects(() => r.call("nope", {}), /unknown tool/);
});

test("describeForPrompt lists every tool", () => {
  const r = new ToolRegistry();
  const block = r.describeForPrompt();
  for (const name of ["calculator", "datetime", "search_kb", "add_expense", "add_journal"]) {
    assert.ok(block.includes(name), `missing ${name} in prompt block`);
  }
});
