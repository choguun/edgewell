// @ts-nocheck
import { test } from "node:test";
import assert from "node:assert/strict";
import { startServer, PeerClient } from "../src/p2p.js";

function fakeLlm(reply) {
  return {
    load: async () => 1,
    unload: async () => {},
    prompt: async () => reply,
    stream: async function* () {
      for (const tok of reply.split(" ")) {
        yield tok + " ";
      }
    },
  };
}

test("P2P server streams tokens to PeerClient", async () => {
  const llm = fakeLlm("hello world from peer");
  const port = 18787 + Math.floor(Math.random() * 1000);
  const server = await startServer({ host: "127.0.0.1", port, llm });
  try {
    const client = new PeerClient({ host: "127.0.0.1", port, timeoutMs: 5000 });
    assert.equal(await client.ping(), true);
    let text = "";
    for await (const tok of client.stream({ user: "hi" })) text += tok;
    assert.equal(text.trim(), "hello world from peer");
  } finally {
    await server.close();
  }
});
