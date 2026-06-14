// @ts-nocheck
// Plugin loader.
//
// Security model: a plugin is a JS file living in a user-chosen
// directory (default: ./plugins). The file must be named
// <name>.plugin.js. It exports either:
//
//   (a) a default async function that receives the EdgeWell
//       instance (v2.0.0 style), or
//   (b) a default object with `name`, `version`, and `hooks`
//       (v3.0.0 style). The loader calls each hook with the
//       appropriate context.
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

// Per-plugin hook timeout (ms). Default 5s; override via env var.
const _envTimeout = Number(process.env.EDGEWELL_PLUGIN_TIMEOUT_MS ?? 5000);
const PLUGIN_TIMEOUT_MS = Number.isFinite(_envTimeout) && _envTimeout > 0 ? _envTimeout : 5000;

function isPluginFile(name) {
  return name.endsWith(PLUGIN_SUFFIX);
}

// Run a v3.0.0-style plugin object against the given context. The
// context is built up incrementally as each hook fires so plugins
// can register embeddings, agents, and routes for later plugins to
// see.
// Race a promise against a timer. If `ms` elapses first, rejects
// with an Error so the caller can mark the plugin as timed out.
function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

export async function runPluginHooks(plugin, ctx) {
  const hooks = plugin.hooks ?? {};
  const name = plugin.name ?? "<unnamed plugin>";
  if (typeof hooks.onLoad === "function") {
    await withTimeout(
      Promise.resolve().then(() => hooks.onLoad({ ew: ctx.ew, log: ctx.log })),
      PLUGIN_TIMEOUT_MS,
      `plugin "${name}" onLoad`,
    );
  }
  if (typeof hooks.registerEmbedder === "function") {
    const register = (entry) => ctx.embedders.set(entry.name, entry);
    await withTimeout(
      Promise.resolve().then(() => hooks.registerEmbedder({ register, ew: ctx.ew })),
      PLUGIN_TIMEOUT_MS,
      `plugin "${name}" registerEmbedder`,
    );
  }
  if (typeof hooks.registerAgent === "function") {
    const register = (entry) => ctx.agents.set(entry.name, entry.agent);
    await withTimeout(
      Promise.resolve().then(() => hooks.registerAgent({ register, ew: ctx.ew })),
      PLUGIN_TIMEOUT_MS,
      `plugin "${name}" registerAgent`,
    );
  }
  if (typeof hooks.registerRoute === "function") {
    const register = (entry) => ctx.routes.push(entry);
    await withTimeout(
      Promise.resolve().then(() => hooks.registerRoute({ register, ew: ctx.ew })),
      PLUGIN_TIMEOUT_MS,
      `plugin "${name}" registerRoute`,
    );
  }
}

export function makePluginContext({ ew, log = null }) {
  return {
    ew,
    log: log ?? {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
    },
    embedders: new Map(),
    agents: new Map(),
    routes: [],
  };
}

export async function loadPlugins(dir, ew, opts = {}) {
  if (!dir) return { loaded: [], context: makePluginContext({ ew }) };
  const absDir = path.resolve(dir);
  let entries;
  try {
    entries = await fs.readdir(absDir, { withFileTypes: true });
  } catch {
    return { loaded: [], context: makePluginContext({ ew }) };
  }
  const context = opts.context ?? makePluginContext({ ew });
  const loaded = [];
  for (const e of entries) {
    if (!e.isFile() && !e.isSymbolicLink()) continue;
    if (!isPluginFile(e.name)) continue;
    const file = path.join(absDir, e.name);
    try {
      const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}-${Math.random()}`);
      const factory = mod.default ?? mod.plugin;
      if (typeof factory === "function") {
        // v2.0.0 style.
        await withTimeout(
          Promise.resolve().then(() => factory(ew)),
          PLUGIN_TIMEOUT_MS,
          `plugin "${e.name}" factory`,
        );
        loaded.push({ name: e.name, ok: true, kind: "function" });
      } else if (factory && typeof factory === "object") {
        // v3.0.0 style.
        await runPluginHooks(factory, context);
        loaded.push({ name: e.name, ok: true, kind: "object" });
      } else {
        loaded.push({ name: e.name, ok: false, error: "no default export" });
      }
    } catch (err) {
      loaded.push({ name: e.name, ok: false, error: String(err?.message ?? err) });
    }
  }
  return { loaded, context };
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
