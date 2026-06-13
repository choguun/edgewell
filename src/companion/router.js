// Tiny HTTP router for the companion server. Avoids Express so the
// offline test suite stays green. v3.0.0 uses this to expose
// `GET /health`, `POST /chat`, `GET /journal`, `POST /journal`,
// `GET /expenses`, and `POST /expenses`. New routes are added by
// pushing handlers into the `routes` array.

function send(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

function match(method, url) {
  return { method: method.toUpperCase(), path: url.split("?")[0] };
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
    for (const r of this.routes) {
      if (r.method !== method) continue;
      const m = path.match(r.pattern);
      if (!m) continue;
      const groups = m.slice(1);
      let body = "";
      if (method === "POST" || method === "PUT" || method === "PATCH") {
        for await (const chunk of req) body += chunk;
      }
      let parsed = null;
      if (body) {
        try {
          parsed = JSON.parse(body);
        } catch (err) {
          return send(res, 400, { error: "invalid json", detail: err.message });
        }
      }
      try {
        await r.handler({ req, res, params: groups, body: parsed });
        return;
      } catch (err) {
        return send(res, 500, { error: "internal", detail: err.message });
      }
    }
    send(res, 404, { error: "not found", method, path });
  }
}

export { send };
