import { test } from "node:test";
import assert from "node:assert/strict";
import { redact, redactRecord } from "../src/redact.js";

test("redact scrubs emails", () => {
  const out = redact("contact me at ada@example.com please");
  assert.ok(!out.includes("ada@example.com"));
  assert.ok(out.includes("[REDACTED_EMAIL]"));
});

test("redact scrubs long digit runs", () => {
  const out = redact("card 4111111111111111 thank you");
  assert.ok(!out.includes("4111111111111111"));
  assert.ok(out.includes("[REDACTED_DIGITS]"));
});

test("redact preserves non-PII text", () => {
  const text = "I had a great walk in the park this morning.";
  assert.equal(redact(text), text);
});

test("redactRecord walks an object", () => {
  const obj = { name: "ada", email: "ada@example.com", items: ["hi", "ada@x.io"] };
  const out = redactRecord(obj);
  assert.equal(out.name, "ada");
  assert.ok(!out.email.includes("ada@example.com"));
  assert.ok(!out.items[1].includes("ada@x.io"));
});
