// `edgewell budget <amount>` prints a simple monthly budget
// breakdown. The number is the total income. The output shows
// fixed costs, savings, and discretionary budget as percentages.

import { c, header } from "../cli.js";

const SAVINGS_PCT = 20;
const FIXED_PCT = 50;

export async function budgetCommand(args) {
  const income = Number(args[0]);
  if (!Number.isFinite(income) || income <= 0) {
    console.error("usage: edgewell budget <monthly-income>");
    process.exit(2);
  }
  const savings = (income * SAVINGS_PCT) / 100;
  const fixed = (income * FIXED_PCT) / 100;
  const discretionary = income - savings - fixed;
  header("Monthly budget");
  console.log(`${c.bold("income:")}         ${income.toFixed(2)}`);
  console.log(`${c.bold("savings:")}        ${savings.toFixed(2)} (${SAVINGS_PCT}%)`);
  console.log(`${c.bold("fixed costs:")}    ${fixed.toFixed(2)} (${FIXED_PCT}%)`);
  console.log(`${c.bold("discretionary:")}  ${discretionary.toFixed(2)} (${100 - SAVINGS_PCT - FIXED_PCT}%)`);
}
