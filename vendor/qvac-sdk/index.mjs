// Local stub for @qvac/sdk. The real package is not on the public registry.
// src/qvac.js dynamic-imports it and falls back to a deterministic local
// response when the real one is missing. This stub makes `pnpm install` and
// `tsc` resolve the import cleanly. Tests inject a mock via sdkExports.

export async function loadModel({ modelSrc, onProgress = () => {} } = {}) {
  onProgress({ loaded: 1, total: 1 });
  return `stub-model:${modelSrc ?? "default"}`;
}

export async function unloadModel() {
  // no-op
}

export async function completion({ history, stream = false } = {}) {
  const last = [...(history ?? [])].reverse().find((m) => m?.role === "user");
  const q = (last?.content ?? "").trim();
  // v3.0.2: friendlier placeholder. The previous
  // `[stub completion for: <input>]` looked like a debug
  // dump in the chat UI. This one tells the user the
  // system is in demo mode and points them at the SDK
  // install command. The router still picks an agent
  // before this returns, so the user can see multi-agent
  // routing working even with no model loaded.
  const text =
    `I'm running in demo mode — the @qvac/sdk isn't installed, so I can't run real inference. ` +
    `I'd normally answer "${q}" with a local LLM. ` +
    `Install the SDK (\`pnpm add @qvac/sdk\`) to enable real replies.`;
  if (stream) {
    return {
      tokenStream: (async function* () {
        for (const word of text.split(/\s+/).filter(Boolean)) {
          yield `${word} `;
        }
      })(),
    };
  }
  return { text };
}
