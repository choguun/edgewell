#!/usr/bin/env node
// EdgeWell CLI shim. Registers the tsx ESM loader so we can import
// the TypeScript source at runtime, then delegates to bin/edgewell.ts.
// Kept as .js so `package.json#bin` resolves to a real file even
// before `pnpm build` has run.

import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("tsx/esm", pathToFileURL("./"));

await import("./edgewell.ts");
