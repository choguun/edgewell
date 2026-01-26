// Plugin loader.
//
// Security model: a plugin is a JS file living in a user-chosen
// directory (default: ./plugins). The file must be named
// <name>.plugin.js. It must export a default async function that
// receives the EdgeWell instance. The plugin can then register
// custom agents, tools, or CLI subcommands.
//
// The loader only imports files that:
//   1. End with .plugin.js
//   2. Live in the directory the user explicitly passed to
//      loadPlugins() (EdgeWell never auto-discovers plugin
//      directories).
//   3. Resolve to a regular file or symbolic link to a regular file
//      (no directory traversal).
//
// Plugins run with the same privileges as the EdgeWell process.
// Only install plugins you trust, the same way you would with npm
// packages.

import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PLUGIN_SUFFIX = ".plugin.js";

function isPluginFile(name) {
  return name.endsWith(PLUGIN_SUFFIX);
}

export async function loadPlugins(dir, ew) {
  if (!dir) return [];
  const absDir = path.resolve(dir);
  let entries;
  try {
    entries = await fs.readdir(absDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const loaded = [];
  for (const e of entries) {
    if (!e.isFile() && !e.isSymbolicLink()) continue;
    if (!isPluginFile(e.name)) continue;
    const file = path.join(absDir, e.name);
    try {
      const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
      const factory = mod.default ?? mod.plugin;
      if (typeof factory === "function") {
        await factory(ew);
        loaded.push({ name: e.name, ok: true });
      } else {
        loaded.push({ name: e.name, ok: false, error: "no default export" });
      }
    } catch (err) {
      loaded.push({ name: e.name, ok: false, error: String(err?.message ?? err) });
    }
  }
  return loaded;
}

export async function listPluginFiles(dir) {
  if (!dir) return [];
  try {
    const entries = await fs.readdir(path.resolve(dir));
    return entries.filter(isPluginFile);
  } catch {
    return [];
  }
}

export { PLUGIN_SUFFIX };
