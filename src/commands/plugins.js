// `edgewell plugins` lists and (optionally) runs plugin files in
// the user-specified directory. Env var EDGEWELL_PLUGINS controls
// the default directory.

import path from "node:path";
import { c } from "../cli.js";
import { listPluginFiles, loadPlugins } from "../plugins.js";

function pluginsDir() {
  return process.env.EDGEWELL_PLUGINS || path.join(process.cwd(), "plugins");
}

export async function pluginsListCommand(_args, _ew) {
  const dir = pluginsDir();
  const files = await listPluginFiles(dir);
  if (files.length === 0) {
    console.log(c.dim(`(no *.plugin.js in ${dir})`));
    return;
  }
  for (const f of files) console.log(f);
}

export async function pluginsRunCommand(_args, ew) {
  const dir = pluginsDir();
  const { loaded } = await loadPlugins(dir, ew);
  if (loaded.length === 0) {
    console.log(c.dim(`(no plugins loaded from ${dir})`));
    return;
  }
  for (const l of loaded) {
    const status = l.ok ? c.green("OK  ") : c.red("FAIL");
    console.log(`${status}  ${l.name}${l.error ? "  " + c.dim(l.error) : ""}`);
  }
}
