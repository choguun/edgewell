// `edgewell yaml` prints a YAML representation of the user's
// profile. v3.0.0 keeps the conversion in JS so the offline
// test suite stays green.

import { c, header } from "../cli.js";

function toYaml(obj, indent = 0) {
  const pad = "  ".repeat(indent);
  const lines = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) {
        lines.push(`${pad}${k}: []`);
      } else if (v.every((x) => typeof x !== "object")) {
        for (const x of v) lines.push(`${pad}${k}: ${x}`);
      } else {
        for (const x of v) {
          const inner = toYaml(x, indent + 1).split("\n");
          lines.push(`${pad}${k}:`);
          for (const l of inner) lines.push(l);
        }
      }
    } else if (typeof v === "object") {
      lines.push(`${pad}${k}:`);
      lines.push(toYaml(v, indent + 1));
    } else {
      lines.push(`${pad}${k}: ${v}`);
    }
  }
  return lines.join("\n");
}

export async function yamlCommand(_args, ew) {
  header("Profile as YAML");
  const profile = await ew.profile.load();
  console.log(toYaml(profile));
}
