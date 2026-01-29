import { withReadline, c } from "../cli.js";

export async function profileCommand(args, ew) {
  const [sub, ...rest] = args;
  if (sub === "show") {
    const p = await ew.profile.load();
    console.log(JSON.stringify(p, null, 2));
  } else if (sub === "set") {
    const [k, ...v] = rest;
    if (!k || v.length === 0) {
      console.error("usage: edgewell profile set <key> <value>");
      process.exit(2);
    }
    const cur = await ew.profile.load();
    let parsed = v.join(" ");
    if (/^-?\d+(\.\d+)?$/.test(parsed)) parsed = Number(parsed);
    else if (parsed === "true") parsed = true;
    else if (parsed === "false") parsed = false;
    const next = { ...cur, baseline: { ...cur.baseline } };
    if (k.startsWith("baseline.")) {
      next.baseline[k.slice("baseline.".length)] = parsed;
    } else {
      next[k] = parsed;
    }
    await ew.profile.save(next);
    console.log(c.green(`set ${k}`));
  } else if (sub === "init") {
    await withReadline(async (rl) => {
      const cur = await ew.profile.load();
      const name = (await rl.question(`name [${cur.name}]: `)) || cur.name;
      const lang = (await rl.question(`language code [${cur.language}]: `)) || cur.language;
      const incomeStr = (await rl.question(`monthly income [${cur.baseline.monthlyIncome}]: `)) || cur.baseline.monthlyIncome;
      const income = Number(incomeStr) || 0;
      const next = {
        ...cur,
        name,
        language: lang,
        baseline: { ...cur.baseline, monthlyIncome: income },
      };
      await ew.profile.save(next);
      console.log(c.green("profile saved"));
    });
  } else {
    console.error("usage: edgewell profile <show|set|init>");
    process.exit(2);
  }
}
