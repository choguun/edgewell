// @ts-nocheck
// Tiny HTTP router for the companion server. Avoids Express so the
// offline test suite stays green. v3.0.0 uses this to expose
// `GET /health`, `POST /chat`, `GET /journal`, `POST /journal`,
// `GET /expenses`, and `POST /expenses`. New routes are added by
// pushing handlers into the `routes` array.

// Hard cap on request body size. 1 MiB is plenty for chat messages,
// journal entries, and small JSON payloads, and small enough to
// protect the server from a DoS via multi-GB bodies. Override via
// the MAX_BODY_BYTES env var if you need larger (e.g. for image
// ingest). 0 disables the cap (not recommended).
const _envMax = Number(process.env.MAX_BODY_BYTES ?? 1024 * 1024);
const MAX_BODY_BYTES = Number.isFinite(_envMax) && _envMax >= 0 ? _envMax : 1024 * 1024;

// Per-handler timeout. 30s is plenty for local LLM calls and
// journal writes; a longer LLM call can override via the env var.
const _envTimeout = Number(process.env.ROUTE_TIMEOUT_MS ?? 30000);
const ROUTE_TIMEOUT_MS = Number.isFinite(_envTimeout) && _envTimeout > 0 ? _envTimeout : 30000;

function send(res, status, body, headers = {}) {
  res.statusCode = status;
  for (const [k, v] of Object.entries({ "content-type": "application/json; charset=utf-8", ...CORS_HEADERS, ...headers })) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

// CORS headers. The companion server is gated by bearer tokens;
// CORS alone does not grant access, so allow-origin: * is safe
// here. The bundled web UI is served from a different origin
// (a phone browser pointed at the desktop IP), so without these
// headers the browser refuses every cross-origin request.
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-max-age": "600",
};

function match(method, url) {
  return { method: method.toUpperCase(), path: url.split("?")[0] };
}

// Race a promise against a timer. If the timer fires first, the
// returned promise rejects with a "timed out" error. The caller
// can catch and translate to a 504 / 500 response.
function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms,
      );
    }),
  ]);
}

export class Router {
  constructor() {
    /** @type {Array<{method:string, pattern:RegExp, handler:Function}>} */
    this.routes = [];
  }

  add(method, pattern, handler) {
    this.routes.push({ method: method.toUpperCase(), pattern, handler });
  }

  get(pattern, handler) {
    this.add("GET", pattern, handler);
  }

  post(pattern, handler) {
    this.add("POST", pattern, handler);
  }

  async handle(req, res) {
    const { method, path } = match(req.method ?? "GET", req.url ?? "/");
    // Short-circuit OPTIONS preflight. Without this, every
    // cross-origin browser call from the bundled web UI fails
    // before the actual request is sent.
    if (method === "OPTIONS") {
      send(res, 204, "");
      return;
    }
    for (const r of this.routes) {
      if (r.method !== method) continue;
      const m = path.match(r.pattern);
      if (!m) continue;
      const groups = m.slice(1);
      let body = "";
      if (method === "POST" || method === "PUT" || method === "PATCH") {
        // Cap the request body at MAX_BODY_BYTES. The cap is
        // measured in *bytes* (not UTF-16 code units), so a
        // multibyte UTF-8 body is not silently allowed to be 4x
        // larger than the limit. Chunks are decoded as Latin-1
        // strings and re-encoded to count bytes correctly.
        try {
          let bodyBytes = 0;
          for await (const chunk of req) {
            const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            bodyBytes += buf.length;
            if (MAX_BODY_BYTES > 0 && bodyBytes > MAX_BODY_BYTES) {
              return send(res, 413, { error: "body too large", limit: MAX_BODY_BYTES });
            }
            body += buf.toString("utf8");
          }
        } catch (err) {
          return send(res, 400, { error: "body read error", detail: err.message });
        }
      }
      let parsed = null;
      if (body) {
        try {
          parsed = JSON.parse(body);
        } catch (err) {
          return send(res, 400, { error: "invalid json", detail: err.message });
        }
      }
      // Track whether the handler has called send() so we can
      // bail out with a 500 if a handler returns without
      // responding. Previously a handler that forgot to call
      // send() would hang the client until the keep-alive
      // timeout fired, which made slow-loris-style attacks and
      // simple bugs look like network failures.
      let responded = false;
      const origSend = res.end.bind(res);
      res.end = (...args) => { responded = true; return origSend(...args); };
      try {
        await withTimeout(
          Promise.resolve().then(() => r.handler({ req, res, params: groups, body: parsed })),
          ROUTE_TIMEOUT_MS,
          `handler for ${method} ${path}`,
        );
        if (!responded && !res.writableEnded) {
          send(res, 500, { error: "internal", detail: "handler did not respond" });
        }
        return;
      } catch (err) {
        if (err && /timed out/.test(String(err.message ?? err))) {
          if (!res.writableEnded) send(res, 504, { error: "timeout", detail: err.message });
        } else {
          if (!res.writableEnded) send(res, 500, { error: "internal", detail: err.message });
        }
        return;
      }
    }
    send(res, 404, { error: "not found", method, path });
  }
}

export { send };
