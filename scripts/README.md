# EdgeWell user scripts

This directory holds small user-defined scripts that read EdgeWell
data and produce a quick report. Drop them into
`~/.edgewell/scripts/` and list them with `edgewell scripts`.

## Running a script directly

```bash
node ~/.edgewell/scripts/weekly-review.mjs
```

The scripts are vanilla Node.js — no EdgeWell imports required.
They read JSONL files from the data directory directly.

## Available examples

- `weekly-review.mjs` — count journal entries from the last 7 days.
- `monthly-budget.mjs` — total expenses for the current month.

## Writing your own

The data files are stable, well-documented, and trivial to parse:

- `~/.edgewell/data/journal.jsonl` — one JSON object per line.
  Fields: `_ts` (ISO 8601), `text` (string), `tags` (string[]),
  optional `mood`, `tagAdded`, etc.
- `~/.edgewell/data/expenses.jsonl` — one JSON object per line.
  Fields: `_ts`, `amount` (number), `category` (string), optional
  `note`.
- `~/.edgewell/data/profile.json` — single JSON object.
- `~/.edgewell/data/rag/chunks.json` — array of chunk objects.

A script can be as small as:

```js
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

const file = path.join(os.homedir(), ".edgewell", "data", "journal.jsonl");
const text = await fs.readFile(file, "utf8").catch(() => "");
const lines = text.split(/\r?\n/).filter(Boolean);
console.log(`journal has ${lines.length} entries`);
```
