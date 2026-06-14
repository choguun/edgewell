#!/usr/bin/env node
// EdgeWell CLI shim. Run with `node --import tsx/esm bin/edgewell.js`
// (see `package.json#scripts.start` and the `bin` field). Kept as
// .js so `package.json#bin` resolves to a real file even before
// the TS source has been compiled.

import("./edgewell.ts");
