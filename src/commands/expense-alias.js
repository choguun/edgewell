// `edgewell expense` is a friendly alias for `edgewell expense`
// (the existing v2.0.0 command). v3.0.0 keeps both so users
// can pick whichever they remember.

export async function expenseAliasCommand(args, ew) {
  const { expenseCommand } = await import("./expense.js");
  return expenseCommand(args, ew);
}
