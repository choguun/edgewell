// Registry of well-known QVAC model identifiers. The user can also
// pass a custom string at runtime - this is just a curated list of
// the ones we have tested or that the QVAC docs ship with.

export const MODELS = Object.freeze({
  // Tiny mobile / SBC friendly.
  LLAMA_3_2_1B_INST_Q4_0: {
    family: "llama",
    size: "1B",
    quant: "Q4_0",
    tier: "tiny",
    ramGb: 1.5,
    offline: true,
  },
  LLAMA_3_2_3B_INST_Q4_K_M: {
    family: "llama",
    size: "3B",
    quant: "Q4_K_M",
    tier: "small",
    ramGb: 2.5,
    offline: true,
  },
  // General purpose desktop.
  LLAMA_3_1_8B_INST_Q4_K_M: {
    family: "llama",
    size: "8B",
    quant: "Q4_K_M",
    tier: "medium",
    ramGb: 6,
    offline: true,
  },
  // Larger desktop / workstation.
  LLAMA_3_1_70B_INST_Q4_K_M: {
    family: "llama",
    size: "70B",
    quant: "Q4_K_M",
    tier: "large",
    ramGb: 48,
    offline: true,
  },
  // QVAC medical-specialized (if exposed in the SDK).
  MEDPSY_1_7B_Q4_K_M: {
    family: "medpsy",
    size: "1.7B",
    quant: "Q4_K_M",
    tier: "small",
    ramGb: 2,
    offline: true,
    domain: "medical",
  },
  MEDPSY_4B_Q4_K_M: {
    family: "medpsy",
    size: "4B",
    quant: "Q4_K_M",
    tier: "small",
    ramGb: 3,
    offline: true,
    domain: "medical",
  },
});

export function describeModel(id) {
  return MODELS[id] ?? { family: "unknown", tier: "unknown", offline: null };
}

export function listModels() {
  return Object.entries(MODELS).map(([id, m]) => ({ id, ...m }));
}

export function pickModel({ tier, domain, maxRamGb } = {}) {
  return listModels().filter((m) => {
    if (tier && m.tier !== tier) return false;
    if (domain && m.domain !== domain) return false;
    if (maxRamGb && m.ramGb > maxRamGb) return false;
    return true;
  });
}
