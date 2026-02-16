import { test } from "node:test";
import assert from "node:assert/strict";
import { startServer, PeerClient } from "../src/p2p.js";
import { PeerMesh } from "../src/peer-mesh.js";

function fakeLlm(reply) {
  return {
    load: async () => 1,
    unload: async () => {},
    prompt: async () => reply,
    stream: async function* () {
      for (const t of reply.split(" ")) yield t + " ";
    },
  };
}

test("PeerMesh picks a healthy peer", async () => {
  const port1 = 28900 + Math.floor(Math.random() * 100);
  const port2 = 29000 + Math.floor(Math.random() * 100);
  const s1 = await startServer({ host: "127.0.0.1", port: port1, llm: fakeLlm("alpha") });
  const s2 = await startServer({ host: "127.0.0.1", port: port2, llm: fakeLlm("beta") });
  try {
    const mesh = new PeerMesh({ peers: [
      { host: "127.0.0.1", port: port1, timeoutMs: 3000 },
      { host: "127.0.0.1", port: port2, timeoutMs: 3000 },
    ] });
    const { text } = await mesh.prompt({ user: "hi" });
    assert.ok(text.length > 0);
  } finally {
    await s1.close();
    await s2.close();
  }
});

test("PeerMesh.consensus picks the most common answer", async () => {
  const port1 = 29100 + Math.floor(Math.random() * 100);
  const port2 = 29200 + Math.floor(Math.random() * 100);
  const s1 = await startServer({ host: "127.0.0.1", port: port1, llm: fakeLlm("YES") });
  const s2 = await startServer({ host: "127.0.0.1", port: port2, llm: fakeLlm("YES") });
  try {
    const mesh = new PeerMesh({ peers: [
      { host: "127.0.0.1", port: port1, timeoutMs: 3000 },
      { host: "127.0.0.1", port: port2, timeoutMs: 3000 },
    ] });
    const out = await mesh.consensus({ user: "are you ready?" });
    assert.equal(out.answer.trim(), "YES");
    assert.equal(out.votes.yes, 2);
  } finally {
    await s1.close();
    await s2.close();
  }
});

test("PeerMesh handles no peers gracefully", async () => {
  const mesh = new PeerMesh({ peers: [{ host: "127.0.0.1", port: 1, timeoutMs: 200 }] });
  await assert.rejects(() => mesh.prompt({ user: "hi" }), /no peers reachable/);
});
