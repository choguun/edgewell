// @ts-nocheck
import { c, header } from "../cli.js";
import { weeklySummary, monthlySummary } from "../summary.js";

export async function summaryCommand(args, ew) {
  const [sub] = args;
  const journal = await ew.journal.readAll();
  const expenses = await ew.expenses.readAll();
  if (sub === "week") {
    const s = weeklySummary(journal, expenses);
    header("Weekly summary");
    printSummary(s);
  } else if (sub === "month") {
    const s = monthlySummary(journal, expenses);
    header("Monthly summary");
    printSummary(s);
  } else {
    console.error("usage: edgewell summary <week|month>");
    process.exit(2);
  }
}

function printSummary(s) {
  console.log(`${c.bold("since:")}  ${s.from}`);
  console.log(`${c.bold("journal:")} ${s.journalCount} entries`);
  console.log(`${c.bold("expenses:")} ${s.expenseCount} entries, total ${s.expenseTotal.toFixed(2)}`);
  if (Object.keys(s.byCategory).length > 0) {
    console.log(c.dim("by category:"));
    for (const [cat, v] of Object.entries(s.byCategory)) {
      console.log(`  - ${cat}: ${v.toFixed(2)}`);
    }
  }
}
