#!/usr/bin/env node
// EdgeWell CLI entry. Dispatches to a subcommand module.

import { createEdgeWell } from "../src/index.js";
import { dispatch } from "../src/dispatch.js";

const ew = createEdgeWell();
const [, , cmd = "help", ...rest] = process.argv;
try {
  await dispatch(cmd, rest, ew);
} catch (err) {
  console.error("error:", err?.message ?? err);
  process.exit(1);
}
