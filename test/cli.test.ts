// @ts-nocheck
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFlags } from "../src/cli.js";

test("parseFlags handles --key value and positional args", () => {
  const f = parseFlags(["ingest", "--source", "labs", "file.txt"], { port: 8787 });
  assert.equal(f._[0], "ingest");
  assert.equal(f._[1], "file.txt");
  assert.equal(f.source, "labs");
  assert.equal(f.port, 8787);
});

test("parseFlags treats bare --flag as boolean true", () => {
  const f = parseFlags(["--no-color"]);
  assert.equal(f["no-color"], true);
  assert.deepEqual(f._, []);
});
