import { test } from "node:test";
import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { Logger } from "../src/logger.js";

function makeSink() {
  const lines = [];
  const sink = new Writable({
    write(chunk, _enc, cb) {
      lines.push(chunk.toString("utf8"));
      cb();
    },
  });
  return { sink, lines };
}

test("Logger respects level", () => {
  const { sink, lines } = makeSink();
  const log = new Logger({ level: "warn", sink });
  log.debug("d");
  log.info("i");
  log.warn("w");
  log.error("e");
  assert.equal(lines.length, 2);
  assert.ok(lines[0].includes('"level":"warn"'));
  assert.ok(lines[1].includes('"level":"error"'));
});

test("Logger.child inherits fields", () => {
  const { sink, lines } = makeSink();
  const log = new Logger({ level: "debug", sink });
  const child = log.child({ component: "test" });
  child.info("hello");
  const rec = JSON.parse(lines[0]);
  assert.equal(rec.component, "test");
  assert.equal(rec.msg, "hello");
});

test("Logger writes valid JSON", () => {
  const { sink, lines } = makeSink();
  const log = new Logger({ level: "info", sink });
  log.info("hi", { count: 3 });
  const rec = JSON.parse(lines[0]);
  assert.equal(rec.count, 3);
  assert.match(rec.ts, /^\d{4}-\d{2}-\d{2}T/);
});
