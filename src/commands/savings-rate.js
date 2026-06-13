// `edgewell savings-rate` computes the savings rate for the
// current month: total income minus total expenses, divided by
// total income. v3.0.0 reads the profile for income (if set) and
// sums the expenses for the current month.

import { c, header } from "../cli.js";

export async function savingsRateCommand(_args, ew) {
  const profile = await ew.profile.load();
  const income = Number(profile.monthlyIncome ?? 0);
  if (income <= 0) {
    console.log(c.yellow("(set profile.monthlyIncome to compute a savings rate)"));
    return;
  }
  const month = new Date().toISOString().slice(0, 7);
  const expenses = (await ew.expenses.readAll()).filter((e) => (e._ts ?? "").startsWith(month));
  const total = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const savings = Math.max(0, income - total);
  const rate = (savings / income) * 100;
  header(`Savings rate: ${month}`);
  console.log(`${c.bold("income:")}  ${income.toFixed(2)}`);
  console.log(`${c.bold("spent:")}   ${total.toFixed(2)}`);
  console.log(`${c.bold("saved:")}   ${savings.toFixed(2)}`);
  console.log(`${c.bold("rate:")}    ${rate.toFixed(1)}%`);
}
