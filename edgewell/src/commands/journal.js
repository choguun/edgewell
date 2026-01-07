import { c } from "../cli.js";

export async function journalCommand(args, ew) {
  const [sub, ...rest] = args;
  if (sub === "add") {
    const text = rest.join(" ").trim();
    if (!text) {
      console.error("usage: edgewell journal add <text>");
      process.exit(2);
    }
    await ew.journal.append({ kind: "journal", text });
    console.log(c.green("logged"));
  } else if (sub === "list") {
    const all = await ew.journal.readAll();
    for (const e of all.slice(-20)) {
      console.log(`${c.dim(e._ts)}  ${e.text}`);
    }
    if (all.length === 0) console.log(c.dim("(no entries)"));
  } else {
    console.error("usage: edgewell journal <add|list>");
    process.exit(2);
  }
}
