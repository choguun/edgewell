// @ts-nocheck
// Public EdgeWell API. Builds the full agent stack from a config.

import path from "node:path";
import { loadConfig } from "./config.js";
import { EdgeWellLLM } from "./qvac.js";
import { JsonlStore } from "./store.js";
import { ProfileStore } from "./profile.js";
import { RagIndex } from "./rag.js";
import { HealthAgent, FinanceAgent, Orchestrator } from "./agents/index.js";
import { DelegatingLLM, PeerClient } from "./p2p.js";

export function createEdgeWell(overrides = {}) {
  const cfg = loadConfig(overrides);
  const dataDir = path.resolve(cfg.data.dir);

  // LLM: peer with local fallback if P2P is enabled, else pure local.
  let llm;
  if (cfg.p2p.enabled) {
    const peer = new PeerClient({
      host: cfg.p2p.host,
      port: cfg.p2p.port,
      timeoutMs: cfg.p2p.timeoutMs,
      model: cfg.delegateModel,
    });
    llm = new DelegatingLLM({ peer, localModel: cfg.localModel });
  } else {
    llm = new EdgeWellLLM({ model: cfg.localModel });
  }

  const profile = new ProfileStore(path.join(dataDir, cfg.data.profileFile));
  const journal = new JsonlStore(path.join(dataDir, cfg.data.journalFile));
  const expenses = new JsonlStore(path.join(dataDir, cfg.data.expensesFile));
  const rag = new RagIndex({
    dir: path.join(dataDir, cfg.rag.dir),
    chunkSize: cfg.rag.chunkSize,
    chunkOverlap: cfg.rag.chunkOverlap,
    topK: cfg.rag.topK,
  });

  const health = new HealthAgent({ llm, rag, profile: null });
  const finance = new FinanceAgent({ llm, rag, profile: null, expenses });
  const orchestrator = new Orchestrator({ llm, health, finance });

  return { cfg, llm, profile, journal, expenses, rag, health, finance, orchestrator };
}

export { loadConfig } from "./config.js";
export { EdgeWellLLM } from "./qvac.js";
export { DelegatingLLM, PeerClient } from "./p2p.js";
export { RagIndex } from "./rag.js";
export { HealthAgent, FinanceAgent, Orchestrator } from "./agents/index.js";
export { startServer } from "./p2p.js";
