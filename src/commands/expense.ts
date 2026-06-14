// @ts-nocheck
import { c } from "../cli.js";

// Mirrors the EXPENSE_SCHEMA bounds from src/schemas.js. Keep in sync.
const EXPENSE_MIN = 0;
const EXPENSE_MAX = 1_000_000_000;

export async function expenseCommand(args, ew) {
  const [sub, ...rest] = args;
  if (sub === "add") {
    const [amtStr, ...catParts] = rest;
    const amt = Number(amtStr);
    const category = catParts.join(" ") || "other";
    if (!Number.isFinite(amt)) {
      console.error("usage: edgewell expense add <amount> <category>");
      console.error("       amount must be a finite number");
      process.exit(2);
    }
    if (amt < EXPENSE_MIN) {
      console.error(`amount must be >= ${EXPENSE_MIN} (got ${amt})`);
      process.exit(2);
    }
    if (amt > EXPENSE_MAX) {
      console.error(`amount must be <= ${EXPENSE_MAX} (got ${amt})`);
      process.exit(2);
    }
    if (!category.trim()) {
      console.error("category must not be empty");
      process.exit(2);
    }
    await ew.expenses.append({ kind: "expense", amount: amt, category });
    console.log(c.green(`logged ${amt} (${category})`));
  } else if (sub === "list") {
    const all = await ew.expenses.readAll();
    let total = 0;
    for (const e of all.slice(-20)) {
      total += Number(e.amount ?? 0);
      console.log(`${c.dim(e._ts)}  ${String(e.amount).padStart(8)}  ${e.category ?? ""}`);
    }
    console.log(c.dim(`total: ${total.toFixed(2)}`));
    if (all.length === 0) console.log(c.dim("(no expenses)"));
  } else {
    console.error("usage: edgewell expense <add|list>");
    process.exit(2);
  }
}
