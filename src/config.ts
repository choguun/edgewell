// EdgeWell default configuration.
// Central place to tweak model choice, P2P endpoints, and storage paths.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Walk up from `start` to find the nearest package.json. Works in
 * both the dev layout (src/config.ts -> ../package.json) and the
 * compiled layout (dist/src/config.js -> ../../package.json).
 */
function findPackageJson(start: string): string | null {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    const candidate = resolve(dir, "package.json");
    if (existsSync(candidate)) return candidate;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function readPkgVersion(): string {
  const found = findPackageJson(here);
  if (!found) return "3.0.0";
  try {
    const raw = readFileSync(found, "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? "3.0.0";
  } catch {
    return "3.0.0";
  }
}

export const PKG_VERSION: string = readPkgVersion();

export interface P2PConfig {
  enabled: boolean;
  host: string;
  port: number;
  fallbackToLocal: boolean;
  timeoutMs: number;
}

export interface RagConfig {
  dir: string;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
}

export interface DataConfig {
  dir: string;
  journalFile: string;
  expensesFile: string;
  profileFile: string;
}

export interface EdgeWellConfig {
  version: string;
  localModel: string;
  delegateModel: string;
  p2p: P2PConfig;
  rag: RagConfig;
  data: DataConfig;
  [key: string]: unknown;
}

/**
 * Resolve the absolute path to the project's `package.json`, regardless
 * of CWD. Uses `import.meta.url` to find the module's location, then
 * walks up to the package root.
 */
export function projectRoot(): string {
  // Walk up to the project root (where package.json lives).
  // Works in both the dev layout (src/) and the compiled
  // layout (dist/src/).
  const found = findPackageJson(here);
  if (!found) return resolve(here, "..");
  return dirname(found);
}

export function readPackageJson(): unknown {
  const found = findPackageJson(here);
  if (!found) throw new Error("package.json not found");
  return JSON.parse(readFileSync(found, "utf8"));
}

export const DEFAULTS: EdgeWellConfig = {
  // Package version. Read once from package.json at module load.
  version: PKG_VERSION,
  // Local model used by default. Override via EDGEWELL_MODEL env.
  localModel: "LLAMA_3_2_1B_INST_Q4_0",
  // Optional delegate model (larger, runs on a peer).
  delegateModel: "LLAMA_3_1_8B_INST_Q4_K_M",

  // P2P delegation
  p2p: {
    enabled: false,
    host: "127.0.0.1",
    port: 8787,
    // If the peer is unreachable, fall back to local.
    fallbackToLocal: true,
    // Hard timeout in ms.
    timeoutMs: 30_000,
  },

  // RAG storage (relative to data.dir)
  rag: {
    dir: "rag",
    chunkSize: 400,
    chunkOverlap: 50,
    topK: 4,
  },

  // Local user data
  data: {
    dir: "data",
    journalFile: "journal.jsonl",
    expensesFile: "expenses.jsonl",
    profileFile: "profile.json",
  },
};

export function loadConfig(overrides: Record<string, unknown> = {}): EdgeWellConfig {
  const cfg = structuredClone(DEFAULTS);
  if (process.env.EDGEWELL_MODEL) cfg.localModel = process.env.EDGEWELL_MODEL;
  if (process.env.EDGEWELL_DELEGATE_MODEL) cfg.delegateModel = process.env.EDGEWELL_DELEGATE_MODEL;
  if (process.env.EDGEWELL_P2P_HOST) cfg.p2p.host = process.env.EDGEWELL_P2P_HOST;
  if (process.env.EDGEWELL_P2P_PORT) cfg.p2p.port = Number(process.env.EDGEWELL_P2P_PORT);
  if (process.env.EDGEWELL_P2P_ENABLED) cfg.p2p.enabled = process.env.EDGEWELL_P2P_ENABLED === "1";
  return { ...cfg, ...overrides } as EdgeWellConfig;
}
