// `edgewell dedup` scans the journal and expenses for duplicate
// entries (matched by timestamp + content hash). v3.0.0 only
// reports duplicates — it does not delete them, because the stores
// are append-only by design. Use `export` + manual filtering +
// `import` to actually drop duplicates.

import { createHash } from "node:crypto";
import { c, header } from "../cli.js";

function fp(s) {
  return createHash("sha1").update(String(s)).digest("hex").slice(0, 12);
}

function dupes(entries) {
  const seen = new Map();
  const dupes = [];
  for (const e of entries) {
    const key = `${e._ts}|${fp(e.text ?? e.amount)}`;
    if (seen.has(key)) {
      dupes.push({ key, original: seen.get(key), duplicate: e });
    } else {
      seen.set(key, e);
    }
  }
  return dupes;
}

export async function dedupCommand(_args, ew) {
  header("Duplicate scan");
  const journal = await ew.journal.readAll();
  const expenses = await ew.expenses.readAll();
  const jDupes = dupes(journal);
  const eDupes = dupes(expenses);
  console.log(`${c.bold("journal:")}  ${journal.length} entries, ${jDupes.length} duplicate groups`);
  console.log(`${c.bold("expenses:")} ${expenses.length} entries, ${eDupes.length} duplicate groups`);
  if (jDupes.length + eDupes.length === 0) {
    console.log(c.green("no duplicates found"));
    return;
  }
  for (const d of jDupes.slice(0, 10)) {
    console.log(`  ${c.dim(d.key)} ${c.dim(JSON.stringify(d.duplicate.text).slice(0, 40))}`);
  }
  if (jDupes.length > 10) console.log(`  ... (${jDupes.length - 10} more)`);
  for (const d of eDupes.slice(0, 10)) {
    console.log(`  ${c.dim(d.key)} ${c.dim(d.duplicate.amount)} ${d.duplicate.category}`);
  }
  if (eDupes.length > 10) console.log(`  ... (${eDupes.length - 10} more)`);
}
