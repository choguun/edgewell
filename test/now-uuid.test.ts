// @ts-nocheck
// Tests for tiny utility commands: now, uuid, rot13, uptime.

import { test } from "node:test";
import assert from "node:assert/strict";
import { nowCommand } from "../src/commands/now.js";
import { uuidCommand } from "../src/commands/uuid.js";
import { uptimeCommand } from "../src/commands/uptime.js";

test("now prints a valid ISO 8601 timestamp", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await nowCommand([]);
  } finally {
    console.log = orig;
  }
  const text = logs.join("");
  assert.match(text, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test("uuid prints a v4 UUID", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await uuidCommand([]);
  } finally {
    console.log = orig;
  }
  const text = logs.join("");
  assert.match(text, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("uuid returns different values on consecutive calls", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await uuidCommand([]);
    await uuidCommand([]);
  } finally {
    console.log = orig;
  }
  const [a, b] = logs;
  assert.notEqual(a, b);
});

test("uptime prints a non-negative integer of seconds", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await uptimeCommand([]);
  } finally {
    console.log = orig;
  }
  const text = logs.join("");
  assert.match(text, /uptime: \d+s/);
});
