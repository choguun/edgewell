import { c } from "../cli.js";

export async function expenseCommand(args, ew) {
  const [sub, ...rest] = args;
  if (sub === "add") {
    const [amtStr, ...catParts] = rest;
    const amt = Number(amtStr);
    const category = catParts.join(" ") || "other";
    if (!Number.isFinite(amt)) {
      console.error("usage: edgewell expense add <amount> <category>");
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
