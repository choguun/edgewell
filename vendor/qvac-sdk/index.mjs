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
  const text = `[stub completion for: ${last?.content ?? ""}]`;
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
