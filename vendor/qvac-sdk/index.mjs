// Local stub for @qvac/sdk. The real package lives at
// `@qvac/sdk` on npm; this file is the offline fallback used
// when the real package isn't installed (or in the test
// suite). The marker `__isStub = true` lets
// `EdgeWellLLM.isDemo()` distinguish this from the real SDK
// without having to make any network calls.

export const __isStub = true;

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
