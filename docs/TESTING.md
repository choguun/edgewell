# EdgeWell v3.0.0 Testing Guide

How to test the v3.0.0 code base.

## Running the suite

```bash
cd edgewell
node --test test/*.test.js
```

This uses Node's built-in test runner. No external test framework
is required. The output is TAP-compatible.

## Test layout

```
test/
  *.test.js   # one file per module
  helpers.js  # shared utilities
```

A typical test file looks like:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { myFunction } from "../src/my-module.js";

test("myFunction returns the expected value", () => {
  assert.equal(myFunction(1, 2), 3);
});
```

## Conventions

- Use `assert.strict` (the strict variant) for all assertions.
- Group related tests with descriptive `test("...")` names.
- Cover the happy path first, then edge cases.
- Mock external IO with a stub; do not hit the file system or
  network in unit tests.

## Adding a new test

1. Create `test/<module>.test.js` next to the source.
2. Import the module under test.
3. Write at least one test per public function.
4. Run `node --test test/<module>.test.js` to verify.
5. Run `node --test test/*.test.js` to verify the whole suite.

## Coverage

v3.0.0 does not enforce a coverage threshold. The test files
cover the happy path and the obvious edge cases; deeper
fuzzing is a follow-up.

## Benchmarks

`edgewell bench-compare` runs the same no-op twice and prints the
median delta. Use it to catch performance regressions in CI.

## Manual smoke

After a code change, run:

```bash
edgewell doctor
edgewell self-test
edgewell help
edgewell version
```

The first three should print a coherent report; the last should
match `package.json`.
