// EdgeWell P2P delegation.
// - Server: hosts a larger QVAC model and accepts JSON completion requests
//   over HTTP. Streams tokens via chunked transfer-encoding (NDJSON).
// - Client: wraps a local EdgeWellLLM. Tries the peer first; on
//   timeout / network error / explicit fallback, runs locally.

import http from "node:http";
import { EdgeWellLLM } from "./qvac.js";

// --- Server ---

export function startServer({ host = "127.0.0.1", port = 8787, model, llm, onProgress } = {}) {
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, model: model ?? null }));
        return;
      }
      if (req.method === "POST" && req.url === "/completion") {
        const chunks = [];
        for await (const c of req) chunks.push(c);
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
        const { system, user, history = [], maxTokens = 512, temperature = 0.3, stream = true } = body;

        if (!llm) {
          res.writeHead(500, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: "server has no llm configured" }));
          return;
        }

        if (stream) {
          res.writeHead(200, {
            "content-type": "application/x-ndjson",
            "cache-control": "no-cache",
            "x-accel-buffering": "no",
          });
          try {
            for await (const tok of llm.stream({ system, user, history, maxTokens, temperature })) {
              res.write(JSON.stringify({ token: tok }) + "\n");
            }
            res.write(JSON.stringify({ done: true }) + "\n");
          } catch (err) {
            res.write(JSON.stringify({ error: String(err?.message ?? err) }) + "\n");
          }
          res.end();
        } else {
          const text = await llm.prompt({ system, user, history, maxTokens, temperature });
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ text }));
        }
        return;
      }
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "not found" }));
    } catch (err) {
      onProgress?.(String(err?.message ?? err));
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: String(err?.message ?? err) }));
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const addr = server.address();
      resolve({
        host: addr.address,
        port: addr.port,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

// --- Client ---

export class PeerClient {
  constructor({ host, port, timeoutMs = 30_000, model = null } = {}) {
    this.host = host;
    this.port = port;
    this.timeoutMs = timeoutMs;
    this.model = model;
  }

  get baseUrl() {
    return `http://${this.host}:${this.port}`;
  }

  async ping() {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2_000);
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: ctrl.signal });
      return res.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(t);
    }
  }

  async *stream(body) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    let res;
    try {
      res = await fetch(`${this.baseUrl}/completion`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, stream: true }),
        signal: ctrl.signal,
      });
    } catch (err) {
      throw new Error(`peer unreachable: ${err?.message ?? err}`);
    } finally {
      clearTimeout(t);
    }
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      throw new Error(`peer error ${res.status}: ${text}`);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        let obj;
        try {
          obj = JSON.parse(line);
        } catch {
          continue;
        }
        if (obj.token) yield obj.token;
        if (obj.error) throw new Error(obj.error);
        if (obj.done) return;
      }
    }
  }

  async prompt(body) {
    let text = "";
    for await (const tok of this.stream(body)) text += tok;
    return text;
  }
}

// --- Delegating LLM ---
// Tries a peer first; on failure, runs locally.

export class DelegatingLLM {
  constructor({ peer, localModel, sdkExports } = {}) {
    this.peer = peer;
    this.local = new EdgeWellLLM({ model: localModel, sdkExports });
  }

  async load() {
    // Best-effort warm local; peer is implicit on first call.
    return this.local.load();
  }

  async unload() {
    return this.local.unload();
  }

  async *_withFallback(body) {
    let any = false;
    try {
      for await (const tok of this.peer.stream(body)) {
        any = true;
        yield tok;
      }
    } catch (err) {
      // Peer failed - fall through to local.
      any = false;
    }
    if (!any) {
      for await (const tok of this.local.stream(body)) yield tok;
    }
  }

  async *stream(body) {
    yield* this._withFallback(body);
  }

  async prompt(body) {
    let text = "";
    for await (const tok of this.stream(body)) text += tok;
    return text;
  }
}
