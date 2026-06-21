// EdgeWell fake companion server — v3.2.0-demo
//
// Runs entirely inside the WebView/service worker so the Android APK
// works with zero setup. It mirrors the real companion HTTP API
// (`/health`, `/chat`, `/chat/stream`, `/journal`, `/expenses`,
// `/profile`) backed by IndexedDB for persistence across app restarts.
//
// The QVAC SDK layer is the vendor stub: chat returns a demo-mode
// reply and the multi-agent router still picks a specialist so the
// UI shows the [health]/[finance]/[lifestyle] chip.
//
// This file is loaded both as a <script> in index.html and via
// importScripts() in the service worker so the same implementation
// can intercept `http://localhost:8787/*` requests.

(function (global) {
  const DB_NAME = "edgewell-fake-server";
  const DB_VERSION = 1;
  const STORE_JOURNAL = "journal";
  const STORE_EXPENSES = "expenses";

  const VERSION = "3.2.0-demo";
  const MODEL = "LLAMA_3_2_1B_INST_Q4_0";

  function uuid() {
    if (global.crypto?.randomUUID) return global.crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function promisify(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  let dbPromise = null;
  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (typeof global.indexedDB === "undefined") {
        return reject(new Error("indexedDB not available"));
      }
      const req = global.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_JOURNAL)) {
          db.createObjectStore(STORE_JOURNAL, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_EXPENSES)) {
          db.createObjectStore(STORE_EXPENSES, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function withTx(store, mode, fn) {
    const db = await openDb();
    const tx = db.transaction([store], mode);
    try {
      return await fn(tx.objectStore(store));
    } catch (err) {
      console.warn("fake-server tx failed:", err);
      throw err;
    }
  }

  async function readAll(store) {
    return withTx(store, "readonly", async (s) => {
      const out = [];
      await new Promise((resolve, reject) => {
        const req = s.openCursor();
        req.onsuccess = () => {
          const cur = req.result;
          if (cur) {
            out.push(cur.value);
            cur.continue();
          } else {
            resolve();
          }
        };
        req.onerror = () => reject(req.error);
      });
      out.sort((a, b) => new Date(a._ts) - new Date(b._ts));
      return out;
    });
  }

  async function append(store, record) {
    const rec = { id: uuid(), ...record };
    await withTx(store, "readwrite", (s) => promisify(s.add(rec)));
    return rec;
  }

  // ---- Agent router (mirrors src/agents/orchestrator.ts keyword fallback) ----

  const HEALTH_KEYWORDS =
    /symptom|sleep|exercise|diet|medication|pain|stress|mood|health|headache|fever|tired|anxious|depress|insomnia|therapy|panic|mental|psych/;
  const FINANCE_KEYWORDS =
    /money|budget|expense|saving|debt|income|price|cost|spend|thb|usd|baht|dollar|salary/;

  function routeAgent(question) {
    const q = (question ?? "").toLowerCase();
    if (HEALTH_KEYWORDS.test(q)) return "health";
    if (FINANCE_KEYWORDS.test(q)) return "finance";
    return "lifestyle";
  }

  function demoReply(question, agent) {
    const q = (question ?? "").trim();
    const agentLabel = agent === "finance" ? "finance" : agent === "health" ? "health" : "lifestyle";
    return (
      `I'm running in demo mode — the @qvac/sdk isn't running real inference inside this APK, ` +
      `so I can't give a live answer to "${q}". ` +
      `The router picked the **[${agentLabel}]** specialist. ` +
      `Install the real SDK and rebuild with the on-device runtime to enable local LLM replies.`
    );
  }

  // ---- HTTP helpers ----

  function jsonResponse(body, status = 200) {
    const data = JSON.stringify(body);
    return new Response(data, {
      status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-length": String(new Blob([data]).size),
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "authorization, content-type",
      },
    });
  }

  function sseResponse(generator) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const ev of generator()) {
            let frame = "";
            if (ev.event) frame += `event: ${ev.event}\n`;
            frame += `data: ${JSON.stringify(ev.data)}\n\n`;
            controller.enqueue(encoder.encode(frame));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
    return new Response(stream, {
      status: 200,
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "x-accel-buffering": "no",
        "access-control-allow-origin": "*",
      },
    });
  }

  async function readJson(request) {
    try {
      const text = await request.text();
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  }

  // ---- Route handlers ----

  async function handleHealth() {
    const [journal, expenses] = await Promise.all([
      readAll(STORE_JOURNAL),
      readAll(STORE_EXPENSES),
    ]);
    return jsonResponse({
      ok: true,
      name: "edgewell-companion",
      version: VERSION,
      agents: ["health", "finance", "sleep", "nutrition", "hydration", "activity"],
      profile: "mobile-demo",
      model: MODEL,
      delegateModel: null,
      demo: true,
      p2p: { enabled: false, host: null, port: null },
      counts: { journal: journal.length, expenses: expenses.length },
    });
  }

  async function handleProfile() {
    return jsonResponse({
      profile: {
        name: "Mobile Demo User",
        formFactor: "mobile",
        localModel: MODEL,
        p2pEnabled: false,
      },
    });
  }

  async function handleJournalGet(request) {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const all = await readAll(STORE_JOURNAL);
    return jsonResponse({ entries: all.slice(-limit) });
  }

  async function handleJournalPost(request) {
    const body = await readJson(request);
    if (!body || typeof body.text !== "string") {
      return jsonResponse({ error: "body.text is required" }, 400);
    }
    const record = {
      _ts: new Date().toISOString(),
      text: body.text,
      tags: Array.isArray(body.tags) ? body.tags : [],
      mood: body.mood ?? null,
    };
    const entry = await append(STORE_JOURNAL, record);
    return jsonResponse({ entry }, 201);
  }

  async function handleExpensesGet(request) {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const all = await readAll(STORE_EXPENSES);
    return jsonResponse({ expenses: all.slice(-limit) });
  }

  async function handleExpensesPost(request) {
    const body = await readJson(request);
    if (!body || typeof body.amount !== "number") {
      return jsonResponse({ error: "body.amount must be a number" }, 400);
    }
    const record = {
      _ts: new Date().toISOString(),
      amount: body.amount,
      category: body.category ?? "other",
      note: body.note ?? null,
    };
    const expense = await append(STORE_EXPENSES, record);
    return jsonResponse({ expense }, 201);
  }

  async function handleChat(request) {
    const body = await readJson(request);
    if (!body || typeof body.message !== "string") {
      return jsonResponse({ error: "body.message is required" }, 400);
    }
    const agent = routeAgent(body.message);
    const reply = demoReply(body.message, agent);
    return jsonResponse({ reply });
  }

  async function* streamChatEvents(message) {
    const agent = routeAgent(message);
    yield { event: "route", data: { type: "route", agent } };
    yield { event: "context", data: { type: "context", hits: [] } };

    const reply = demoReply(message, agent);
    const words = reply.split(/(\s+)/).filter(Boolean);
    for (const word of words) {
      yield { event: "token", data: { type: "token", text: word } };
      // tiny delay so the user sees streaming; keep it snappy for demo
      await new Promise((r) => setTimeout(r, 12));
    }
    yield { event: "done", data: { type: "done" } };
  }

  async function handleChatStream(request) {
    const body = await readJson(request);
    if (!body || typeof body.message !== "string") {
      return jsonResponse({ error: "body.message is required" }, 400);
    }
    const message = body.message;
    return sseResponse(() => streamChatEvents(message));
  }

  // ---- Main router ----

  async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-allow-headers": "authorization, content-type",
          "access-control-max-age": "600",
        },
      });
    }

    if (path === "/health" && method === "GET") return handleHealth();
    if (path === "/profile" && method === "GET") return handleProfile();

    if (path === "/journal") {
      if (method === "GET") return handleJournalGet(request);
      if (method === "POST") return handleJournalPost(request);
      return jsonResponse({ error: "method not allowed" }, 405);
    }

    if (path === "/expenses") {
      if (method === "GET") return handleExpensesGet(request);
      if (method === "POST") return handleExpensesPost(request);
      return jsonResponse({ error: "method not allowed" }, 405);
    }

    if (path === "/chat") {
      if (method === "POST") return handleChat(request);
      return jsonResponse({ error: "method not allowed" }, 405);
    }

    if (path === "/chat/stream") {
      if (method === "POST") return handleChatStream(request);
      return jsonResponse({ error: "method not allowed" }, 405);
    }

    return jsonResponse({ error: "not found", path }, 404);
  }

  const api = {
    VERSION,
    MODEL,
    routeAgent,
    demoReply,
    handleRequest,
    _stores: { STORE_JOURNAL, STORE_EXPENSES },
  };

  global.EdgeWellFakeServer = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : globalThis);
