// @ts-nocheck
// Form-factor profiles. v3.0.0 ships three ready-to-use profiles
// (`mobile`, `tinkerer`, `desktop`) and a `pickProfile(name)` helper
// that returns the corresponding config overrides. Profiles are pure
// data — they merge into the existing `loadConfig` overrides shape.

export const PROFILES = {
  mobile: {
    label: "phone or tablet",
    localModel: "LLAMA_3_2_1B_INST_Q4_0",
    delegateModel: "LLAMA_3_1_8B_INST_Q4_K_M",
    rag: { chunkSize: 200, chunkOverlap: 30, topK: 3 },
    p2p: { enabled: true, host: "127.0.0.1", port: 8787, timeoutMs: 8000 },
    vector: { dim: 96, kind: "hash" },
    companion: { enabled: true, port: 8787, host: "0.0.0.0" },
  },
  tinkerer: {
    label: "Raspberry Pi 4/5 or similar (<= 4GB RAM)",
    localModel: "LLAMA_3_2_1B_INST_Q4_0",
    delegateModel: "LLAMA_3_1_8B_INST_Q4_K_M",
    rag: { chunkSize: 300, chunkOverlap: 40, topK: 4 },
    p2p: { enabled: true, host: "127.0.0.1", port: 8787, timeoutMs: 15000 },
    vector: { dim: 64, kind: "hash" },
    companion: { enabled: true, port: 8787, host: "0.0.0.0" },
  },
  desktop: {
    label: "laptop or workstation (>= 16GB RAM)",
    localModel: "LLAMA_3_1_8B_INST_Q4_K_M",
    delegateModel: "MEDPSY_4B_INST_Q4_K_M",
    rag: { chunkSize: 600, chunkOverlap: 80, topK: 6 },
    p2p: { enabled: false, host: "127.0.0.1", port: 8788, timeoutMs: 5000 },
    vector: { dim: 256, kind: "hash" },
    companion: { enabled: true, port: 8788, host: "127.0.0.1" },
  },
};

export function pickProfile(name) {
  const p = PROFILES[String(name ?? "").toLowerCase()];
  if (!p) {
    const known = Object.keys(PROFILES).join(", ");
    throw new Error(`unknown profile: ${name}. Known: ${known}`);
  }
  // Return overrides that loadConfig understands (drop the label).
  const { label, ...overrides } = p;
  return { name: String(name).toLowerCase(), label, ...overrides };
}

export function listProfiles() {
  return Object.entries(PROFILES).map(([k, v]) => ({ name: k, label: v.label }));
}
