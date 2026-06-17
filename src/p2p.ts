// EdgeWell P2P delegation.
// - Server: hosts a larger QVAC model and accepts JSON completion requests
//   over HTTP. Streams tokens via chunked transfer-encoding (NDJSON).
// - Client: wraps a local EdgeWellLLM. Tries the peer first; on
//   timeout / network error / explicit fallback, runs locally.

import http from "node:http";
import type { AddressInfo } from "node:net";
import { EdgeWellLLM } from "./qvac.js";
import { defaultLogger, type Logger } from "./logger.js";
import { Metrics, timed } from "./metrics.js";
import type { LLM, PromptInput } from "./llm-types.js";

// Adapter: qvac.ts's EdgeWellLLM doesn't yet export a typed
// LLM surface (its prompt/stream use destructured implicit-any
// params). Cast at the boundary until qvac.ts gets peeled
// off @ts-nocheck. The behavioural contract matches.

// Adapter: qvac.ts's EdgeWellLLM doesn't yet export a typed
// LLM surface (its prompt/stream use destructured implicit-any
// params). Cast at the boundary until qvac.ts gets peeled
// off @ts-nocheck. The behavioural contract matches.

// --- Server ---

export interface StartServerOptions {
  host?: string;
  port?: number;
  model?: string | null;
  llm?: LLM;
  onProgress?: (msg: string) => void;
  logger?: Logger;
  metrics?: Metrics;
}

export interface StartServerHandle {
  host: string;
  port: number;
  close(): Promise<void>;
}

interface CompletionRequestBody {
  system?: string;
  user?: string;
  history?: PromptInput["history"];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export function startServer({
  host = "127.0.0.1",
  port = 8787,
  model = null,
  llm,
  onProgress,
  logger = defaultLogger,
  metrics = new Metrics(),
}: StartServerOptions = {}): Promise<StartServerHandle> {
  const log = logger.child({ component: "p2p-server", port });
  const m = metrics;

  const server = http.createServer(async (req, res) => {
    const t0 = Date.now();
    m.inc("p2p_server_requests_total", 1, { path: req.url ?? "", method: req.method ?? "" });
    try {
      if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, model, uptimeMs: process.uptime() * 1000 }));
        log.debug("health", { remote: req.socket.remoteAddress });
        return;
      }
      if (req.method === "GET" && req.url === "/metrics") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(m.snapshot()));
        return;
      }
      if (req.method === "POST" && req.url === "/completion") {
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as CompletionRequestBody;
        const {
          system,
          user = "",
          history = [],
          maxTokens = 512,
          temperature = 0.3,
          stream = true,
        } = body;

        if (!llm) {
          res.writeHead(500, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: "server has no llm configured" }));
          m.inc("p2p_server_errors_total", 1, { reason: "no_llm" });
          return;
        }

        if (stream) {
          res.writeHead(200, {
            "content-type": "application/x-ndjson",
            "cache-control": "no-cache",
            "x-accel-buffering": "no",
          });
          let tokens = 0;
          // Note: timing the stream with `timed()` would wrap the
          // async iterable in a Promise, which `for await` can't
          // consume. Time it manually instead and observe the
          // duration once the stream is fully drained.
          const streamStart = Date.now();
          try {
            for await (const tok of llm.stream({ system, user, history, maxTokens, temperature })) {
              tokens++;
              res.write(JSON.stringify({ token: tok }) + "\n");
            }
            m.observe("p2p_server_stream_ms", Date.now() - streamStart, {});
            res.write(JSON.stringify({ done: true }) + "\n");
            m.inc("p2p_server_tokens_total", tokens);
            log.info("completion streamed", { tokens, ms: Date.now() - t0 });
          } catch (err) {
            const msg = (err as Error)?.message ?? String(err);
            m.inc("p2p_server_errors_total", 1, { reason: "stream" });
            res.write(JSON.stringify({ error: msg }) + "\n");
            log.error("stream failed", { err: msg });
          }
          res.end();
        } else {
          try {
            const text = await timed(m, "p2p_server_prompt_ms", {}, () =>
              llm.prompt({ system, user, history, maxTokens, temperature }),
            );
            m.inc("p2p_server_tokens_total", text.length);
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ text }));
            log.info("completion served", { ms: Date.now() - t0, chars: text.length });
          } catch (err) {
            const msg = (err as Error)?.message ?? String(err);
            m.inc("p2p_server_errors_total", 1, { reason: "prompt" });
            res.writeHead(500, { "content-type": "application/json" });
            res.end(JSON.stringify({ error: msg }));
            log.error("prompt failed", { err: msg });
          }
        }
        return;
      }
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "not found" }));
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err);
      m.inc("p2p_server_errors_total", 1, { reason: "unhandled" });
      onProgress?.(msg);
      log.error("unhandled", { err: msg });
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: msg }));
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const addr = server.address() as AddressInfo | null;
      const resolvedHost = addr?.address ?? host;
      const resolvedPort = addr?.port ?? port;
      log.info("listening", { host: resolvedHost, port: resolvedPort, model });
      resolve({
        host: resolvedHost,
        port: resolvedPort,
        close: () => new Promise<void>((r) => server.close(() => r())),
      });
    });
  });
}

// --- Client ---

export interface PeerClientOptions {
  host: string;
  port: number;
  timeoutMs?: number;
  model?: string | null;
}

export class PeerClient {
  public host: string;
  public port: number;
  public timeoutMs: number;
  public model: string | null;

  constructor({ host, port, timeoutMs = 30_000, model = null }: PeerClientOptions) {
    this.host = host;
    this.port = port;
    this.timeoutMs = timeoutMs;
    this.model = model;
  }

  get baseUrl(): string {
    return `http://${this.host}:${this.port}`;
  }

  async ping(): Promise<boolean> {
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

  async *stream(body: PromptInput): AsyncIterable<string> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/completion`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, stream: true }),
        signal: ctrl.signal,
      });
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err);
      throw new Error(`peer unreachable: ${msg}`);
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
        let obj: { token?: string; error?: string; done?: boolean };
        try {
          obj = JSON.parse(line) as typeof obj;
        } catch {
          continue;
        }
        if (obj.token) yield obj.token;
        if (obj.error) throw new Error(obj.error);
        if (obj.done) return;
      }
    }
  }

  async prompt(body: PromptInput): Promise<string> {
    let text = "";
    for await (const tok of this.stream(body)) text += tok;
    return text;
  }
}

// --- Delegating LLM ---
// Tries a peer first; on failure, runs locally.

export interface DelegatingLLMOptions {
  peer: PeerClient;
  localModel?: string;
  sdkExports?: unknown;
  logger?: Logger;
}

export class DelegatingLLM {
  public peer: PeerClient;
  public local: LLM;
  public logger: Logger;

  constructor({ peer, localModel, sdkExports, logger = defaultLogger }: DelegatingLLMOptions) {
    this.peer = peer;
    this.local = new EdgeWellLLM({ model: localModel, sdkExports: (sdkExports ?? null) as never });
    this.logger = logger;
  }

  async load(): Promise<string | null> {
    // Best-effort warm local; peer is implicit on first call.
    return (this.local as EdgeWellLLM).load();
  }

  async unload(): Promise<void> {
    return (this.local as EdgeWellLLM).unload();
  }

  private async *_withFallback(body: PromptInput): AsyncIterable<string> {
    let any = false;
    try {
      for await (const tok of this.peer.stream(body)) {
        any = true;
        yield tok;
      }
    } catch (err) {
      // Peer failed - log at warn so the user knows the
      // delegation was attempted and fell through. Without
      // this log, a user who set EDGEWELL_P2P_ENABLED=1 but
      // has the peer offline would silently get the tiny
      // local model with no diagnostic.
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn("p2p peer unreachable, falling back to local", {
        host: this.peer.host,
        port: this.peer.port,
        err: msg,
      });
      // Also surface to stdout so interactive `chat` shows it.
      process.stderr.write(
        `[p2p] peer ${this.peer.host}:${this.peer.port} unreachable (${msg}) — falling back to local model\n`,
      );
      any = false;
    }
    if (!any) {
      for await (const tok of this.local.stream(body)) yield tok;
    }
  }

  async *stream(body: PromptInput): AsyncIterable<string> {
    yield* this._withFallback(body);
  }

  async prompt(body: PromptInput): Promise<string> {
    let text = "";
    for await (const tok of this.stream(body)) text += tok;
    return text;
  }
}
