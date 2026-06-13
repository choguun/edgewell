// `edgewell expenses-empty` lists the expenses with a missing
// or non-numeric `amount`. v3.0.0 keeps the iteration in JS.

import { c } from "../cli.js";

export async function expensesEmptyCommand(_args, ew) {
  const all = await ew.expenses.readAll();
  const empties = all
    .map((e, i) => ({ id: i, e }))
    .filter(({ e }) => typeof e.amount !== "number");
  if (empties.length === 0) {
    console.log(c.green("(no malformed expenses)"));
    return;
  }
  for (const { id, e } of empties) {
    console.log(`${c.dim(`#${id}`)} ${e._ts} amount=${e.amount}`);
  }
  console.log(c.dim(`(${empties.length} malformed expenses)`));
}
