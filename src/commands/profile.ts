// @ts-nocheck
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
    // Reject flag-shaped keys so `profile set --name alex` does not
    // silently write `--name: "alex"` into the profile.
    if (k.startsWith("-")) {
      console.error(c.red(`'${k}' looks like a flag, not a profile key`));
      console.error("usage: edgewell profile set <key> <value>");
      process.exit(2);
    }
    const cur = await ew.profile.load();
    const raw = v.join(" ");
    // Try JSON first so users can pass structured values.
    let parsed = raw;
    if ((raw.startsWith("{") && raw.endsWith("}")) || (raw.startsWith("[") && raw.endsWith("]"))) {
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        console.error(c.red(`invalid JSON: ${err.message}`));
        process.exit(2);
      }
    } else if (/^-?\d+(\.\d+)?$/.test(raw)) {
      parsed = Number(raw);
    } else if (raw === "true") {
      parsed = true;
    } else if (raw === "false") {
      parsed = false;
    }
    // Light validation for known keys.
    if (k === "goals" && (parsed === null || typeof parsed !== "object" || Array.isArray(parsed))) {
      console.error(c.red("'goals' must be an object, e.g. { health: [...], finance: [...] }"));
      process.exit(2);
    }
    if (k === "name" && (typeof parsed !== "string" || parsed.length === 0)) {
      console.error(c.red("'name' must be a non-empty string"));
      process.exit(2);
    }
    if (k === "language" && !["en", "th", "ja", "es", "fr", "de", "zh"].includes(parsed)) {
      console.error(c.red(`'language' must be one of: en, th, ja, es, fr, de, zh`));
      process.exit(2);
    }
    const known = new Set(["name", "language", "goals", "tagVocabulary"]);
    if (!k.startsWith("baseline.") && !known.has(k)) {
      console.error(c.yellow(`warning: '${k}' is not a known profile key (known: ${[...known].join(", ")})`));
    }
    const next = { ...cur, baseline: { ...cur.baseline } };
    if (k.startsWith("baseline.")) {
      next.baseline[k.slice("baseline.".length)] = parsed;
    } else {
      next[k] = parsed;
    }
    await ew.profile.save(next);
    console.log(c.green(`set ${k}`));
  } else if (sub === "init") {
    // If stdin is not a TTY (e.g. piped input from a script or
    // a CI runner), fall back to writing a default profile
    // instead of hanging on a readline prompt that never
    // resolves.
    if (!process.stdin.isTTY) {
      const cur = await ew.profile.load();
      const next = {
        ...cur,
        name: cur.name,
        language: cur.language,
        baseline: { ...cur.baseline },
      };
      await ew.profile.save(next);
      console.log(c.green("wrote default profile (no TTY; pass a TTY to run the wizard)"));
      return;
    }
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
