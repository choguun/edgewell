// Multi-peer mesh. Picks the fastest responding peer from a list
// of candidates and falls back to the next one on any failure.
// Also exposes a broadcast() helper that fans a single prompt out
// to every reachable peer and merges the answers (majority vote on
// normalized text for short answers; first non-empty for long ones).

import { PeerClient } from "./p2p.js";

export class PeerMesh {
  constructor({ peers = [], timeoutMs = 10_000 } = {}) {
    this.peers = peers.map((p) => (p instanceof PeerClient ? p : new PeerClient(p)));
    this.timeoutMs = timeoutMs;
  }

  add(peer) {
    this.peers.push(peer instanceof PeerClient ? peer : new PeerClient(peer));
  }

  // Run ping() against every peer in parallel and return only the
  // ones that respond. Sorted by latency.
  async healthy() {
    const results = await Promise.all(
      this.peers.map(async (p) => {
        const t0 = Date.now();
        const ok = await p.ping().catch(() => false);
        return ok ? { peer: p, latencyMs: Date.now() - t0 } : null;
      }),
    );
    return results.filter(Boolean).sort((a, b) => a.latencyMs - b.latencyMs);
  }

  // Stream the prompt to the first healthy peer. Tries each peer in
  // latency order until one yields at least one token.
  async *stream(body) {
    const live = await this.healthy();
    if (live.length === 0) throw new Error("no peers reachable");
    for (const { peer } of live) {
      let any = false;
      try {
        for await (const tok of peer.stream(body)) {
          any = true;
          yield { token: tok, peer: peer.baseUrl };
        }
        return;
      } catch (err) {
        if (any) return; // partial answer, accept it
        // try next peer
      }
    }
    throw new Error("all peers failed");
  }

  // Same as stream() but returns the concatenated text and the peer
  // that produced it.
  async prompt(body) {
    let text = "";
    let peer = null;
    for await (const ev of this.stream(body)) {
      text += ev.token;
      peer = ev.peer;
    }
    return { text, peer };
  }

  // Send the same prompt to every healthy peer and return one
  // entry per peer. Useful for the orchestrator to pick a
  // consensus or just see all answers.
  async broadcast(body) {
    const live = await this.healthy();
    return Promise.all(
      live.map(async ({ peer }) => {
        try {
          const text = await peer.prompt(body);
          return { peer: peer.baseUrl, ok: true, text };
        } catch (err) {
          return { peer: peer.baseUrl, ok: false, error: String(err?.message ?? err) };
        }
      }),
    );
  }

  // Majority-vote a short answer across peers. Returns the winning
  // text and the vote share. For long answers, falls back to the
  // first non-empty reply.
  async consensus(body) {
    const all = await this.broadcast(body);
    const good = all.filter((a) => a.ok && a.text.trim().length > 0);
    if (good.length === 0) return { answer: "", votes: {}, peers: all };
    const counts = new Map();
    for (const g of good) {
      const key = g.text.trim().toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const winner = sorted[0][0];
    const winnerReply = good.find((g) => g.text.trim().toLowerCase() === winner);
    return {
      answer: winnerReply.text,
      votes: Object.fromEntries(counts),
      peers: all,
    };
  }
}
