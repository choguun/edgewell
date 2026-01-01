// EdgeWell default configuration.
// Central place to tweak model choice, P2P endpoints, and storage paths.

export const DEFAULTS = {
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

  // RAG storage
  rag: {
    dir: "data/rag",
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

export function loadConfig(overrides = {}) {
  const cfg = structuredClone(DEFAULTS);
  if (process.env.EDGEWELL_MODEL) cfg.localModel = process.env.EDGEWELL_MODEL;
  if (process.env.EDGEWELL_DELEGATE_MODEL) cfg.delegateModel = process.env.EDGEWELL_DELEGATE_MODEL;
  if (process.env.EDGEWELL_P2P_HOST) cfg.p2p.host = process.env.EDGEWELL_P2P_HOST;
  if (process.env.EDGEWELL_P2P_PORT) cfg.p2p.port = Number(process.env.EDGEWELL_P2P_PORT);
  if (process.env.EDGEWELL_P2P_ENABLED) cfg.p2p.enabled = process.env.EDGEWELL_P2P_ENABLED === "1";
  return { ...cfg, ...overrides };
}
