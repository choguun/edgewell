// Auto-generated web assets.
export const webFiles: Record<string, string> = {
  "app.js": `// EdgeWell companion web UI — v3.1.0
// Talks to the local companion HTTP server. Streams chat via
// Server-Sent Events (POST + ReadableStream), surfaces the
// multi-agent router chip, source-citations from RAG, an
// expense panel with a tiny inline bar chart, and is
// installable as a PWA.
//
// Token is optional — when the server is started with
// \`--no-auth\` the client simply omits the Authorization header.

const SERVER = {
  toString() {
    return getServer();
  }
};

function getServer() {
  const saved = localStorage.getItem("edgewell.server");
  if (saved) return saved;
  const params = new URLSearchParams(location.search);
  const paramServer = params.get("server");
  if (paramServer) return paramServer;
  // v3.2.0-demo: inside the Android APK the companion server is fake-
  // local (served by the service worker), so always point at the local
  // port. This keeps the UI identical to the real companion story while
  // giving zero-setup behavior.
  if (isNativeApp) return "http://localhost:8787";
  return \`http://\${location.hostname}:8787\`;
}

function setServer(url) {
  if (url) {
    let formatted = url.trim();
    if (!/^https?:\\/\\//i.test(formatted)) {
      formatted = \`http://\${formatted}\`;
    }
    localStorage.setItem("edgewell.server", formatted);
  } else {
    localStorage.removeItem("edgewell.server");
  }
}

/* ----------------------------- TOKEN STORE ---------------------------- */

function getToken() {
  return localStorage.getItem("edgewell.token") ?? "";
}
function setToken(t) {
  if (t) localStorage.setItem("edgewell.token", t);
  else localStorage.removeItem("edgewell.token");
}
function promptForToken(reason) {
  const hint =
    reason === "missing"
      ? "Server requires a bearer token. Mint one with:\\n  edgewell companion --print-token\\n  edgewell token my-phone\\n\\nPaste it here:"
      : \`Server rejected the token (\${reason}). Paste a new one:\`;
  const t = prompt(hint, "");
  if (t && t.trim()) {
    setToken(t.trim());
    return true;
  }
  return false;
}

/* ------------------------------- DOM CACHE ---------------------------- */

const els = {
  status: document.getElementById("status-text"),
  statusDot: document.querySelector("#status .dot"),
  p2p: document.getElementById("p2p"),
  p2pText: document.getElementById("p2p-text"),
  messages: document.getElementById("messages"),
  chatForm: document.getElementById("chat-form"),
  chatInput: document.getElementById("chat-input"),
  sendBtn: document.getElementById("send-btn"),
  journalForm: document.getElementById("journal-form"),
  journalText: document.getElementById("journal-text"),
  journalTags: document.getElementById("journal-tags"),
  journalList: document.getElementById("journal-list"),
  journalCount: document.getElementById("journal-count"),
  expenseForm: document.getElementById("expense-form"),
  expenseAmount: document.getElementById("expense-amount"),
  expenseCategory: document.getElementById("expense-category"),
  expenseNote: document.getElementById("expense-note"),
  expenseList: document.getElementById("expense-list"),
  expenseTotal: document.getElementById("expense-total"),
  expenseChart: document.getElementById("expense-chart"),
  installBtn: document.getElementById("install-btn"),

  toast: document.getElementById("toast"),

  sidebar: document.getElementById("sidebar"),
  sidebarBtn: document.getElementById("sidebar-btn"),
  sidebarClose: document.getElementById("sidebar-close"),
  sidebarBackdrop: document.getElementById("sidebar-backdrop"),
  newChatBtn: document.getElementById("new-chat-btn"),
  conversationList: document.getElementById("conversation-list"),
  themeBtn: document.getElementById("theme-btn"),
  body: document.body,
};

let autoScroll = true;

// v3.0.2: iOS Safari never fires \`beforeinstallprompt\`, so the
// generic install button is useless there. Detect once at boot
// and swap it for an instructional toast on the first user
// gesture (so the prompt doesn't fire on page load).
const isIosSafari =
  /iPhone|iPad|iPod/.test(navigator.userAgent) &&
  !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
const isStandalone =
  window.matchMedia?.("(display-mode: standalone)").matches ||
  navigator.standalone === true;
const isNativeApp =
  !!window.Capacitor ||
  !!window.cordova ||
  location.protocol === "capacitor:" ||
  location.protocol === "ionic:" ||
  (location.hostname === "localhost" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) &&
    (location.port === "" || location.port === "80" || location.port === "443" || location.port === "8080"));

if (isNativeApp || isStandalone) {
  document.body.classList.add("standalone-mode");

  // v3.2.0-demo: inside the Android APK the companion server is fake-
  // local (served by the service worker), so we never prompt for a
  // desktop IP. The WebView will talk to http://localhost:8787 and the
  // SW will intercept those requests.
}

// v3.2.0-demo: page-level fallback for the fake local companion server.
// If the service worker hasn't taken over yet, or if the Capacitor WebView
// refuses to register the SW, we still serve localhost:8787 requests from
// the in-browser fake server. This only intercepts the fake companion URL;
// every other request passes through unchanged.
if (isNativeApp && typeof window !== "undefined" && window.EdgeWellFakeServer) {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    const url = typeof input === "string" ? input : input.url;
    if (typeof url === "string" && url.startsWith("http://localhost:8787")) {
      return window.EdgeWellFakeServer.handleRequest(new Request(input, init));
    }
    return originalFetch.apply(this, arguments);
  };
}

/* ------------------------------- API CALL ----------------------------- */

async function fetchWithTimeout(url, init = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error("Connection timed out");
    }
    throw err;
  }
}

function headers(extra = {}) {
  const h = { "content-type": "application/json", ...extra };
  const tok = getToken();
  if (tok) h.authorization = \`Bearer \${tok}\`;
  return h;
}

async function api(path, init = {}) {
  const res = await fetchWithTimeout(\`\${SERVER}\${path}\`, {
    ...init,
    headers: { ...headers(), ...(init.headers ?? {}) },
  });
  if (res.status === 401) {
    const body = await res.text().catch(() => "");
    let reason = "missing";
    try {
      const j = JSON.parse(body);
      if (typeof j?.error === "string") reason = j.error;
    } catch {
      /* not JSON */
    }
    if (promptForToken(reason)) {
      return api(path, init);
    }
    const err = new Error(\`HTTP 401: \${body}\`);
    err.status = 401;
    throw err;
  }
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const err = new Error(\`HTTP \${res.status}: \${text}\`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

/* --------------------------- STREAMING CHAT --------------------------- */

/**
 * POST a chat message to /chat/stream and parse the SSE
 * response. EventSource doesn't support POST bodies, so we
 * use fetch + ReadableStream and split on the SSE frame
 * boundary (\`\\n\\n\`). Yields each parsed event object.
 */
async function* streamChat(message) {
  const res = await fetchWithTimeout(\`\${SERVER}/chat/stream\`, {
    method: "POST",
    headers: headers({ accept: "text/event-stream" }),
    body: JSON.stringify({ message }),
  });
  if (res.status === 401) {
    const body = await res.text().catch(() => "");
    let reason = "missing";
    try {
      const j = JSON.parse(body);
      if (typeof j?.error === "string") reason = j.error;
    } catch {
      /* not JSON */
    }
    if (promptForToken(reason)) {
      yield* streamChat(message);
      return;
    }
    throw new Error(\`HTTP 401: \${body}\`);
  }
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(\`HTTP \${res.status}: \${text}\`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    // SSE frames are terminated by a blank line. Split off
    // complete frames and leave the partial tail in \`buf\`.
    while ((idx = buf.indexOf("\\n\\n")) >= 0) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const ev = parseSseFrame(frame);
      if (ev) yield ev;
    }
  }
}

function parseSseFrame(frame) {
  let eventName = "message";
  const dataLines = [];
  for (const line of frame.split("\\n")) {
    if (!line) continue;
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  if (dataLines.length === 0) return null;
  const payload = dataLines.join("\\n");
  let parsed;
  try {
    parsed = JSON.parse(payload);
  } catch {
    parsed = { type: eventName, raw: payload };
  }
  return parsed;
}

/* ---------------------------- EMPTY STATES ---------------------------- */

function renderEmptyState(listEl, text) {
  // Replaces the panel's contents with a single italicized
  // line. Used for the journal + expenses lists. Kept here
  // so the wording lives in one place.
  listEl.innerHTML = "";
  const li = document.createElement("li");
  li.className = "empty";
  li.textContent = text;
  listEl.appendChild(li);
}

function renderChatEmpty() {
  // Centered empty state for the chat pane. Cleared by
  // submitChat() the first time the user actually sends a
  // message.
  els.messages.innerHTML = "";
  const div = document.createElement("div");
  div.className = "empty chat-empty";
  const icon = document.createElement("div");
  icon.className = "chat-empty-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "\\u{1F4AC}"; // 💬
  const title = document.createElement("div");
  title.className = "chat-empty-title";
  title.textContent = "No messages yet";
  const sub = document.createElement("div");
  sub.className = "chat-empty-sub";
  sub.textContent = "Click a prompt below or type your own question to start.";
  div.append(icon, title, sub);
  els.messages.appendChild(div);
}

/* ----------------------------- RENDERING ------------------------------ */

function addMessage(role, text, agent = null, opts = null) {
  // v3.0.2: every message gets a meta row (agent chip on
  // the left, copy button on the right) and a body for
  // the text. For assistant messages the agent chip is
  // added later when the \`route\` event arrives, so we
  // expose a \`meta\` element the route handler can append
  // to. The copy button is always there and gets its
  // \`copiedText\` updated when streaming finishes (so the
  // user copies the final rendered text, not the
  // mid-stream plaintext with raw markdown).
  const div = document.createElement("div");
  div.className = \`message \${role}\`;
  if (agent) div.classList.add(\`msg-agent-\${agent}\`);

  const meta = document.createElement("div");
  meta.className = "meta";

  let copiedText = text;
  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "copy-btn";
  copyBtn.setAttribute("aria-label", "Copy message");
  copyBtn.title = "Copy";
  copyBtn.textContent = "📋";
  copyBtn.addEventListener("click", () => {
    copyToClipboard(copiedText).then((ok) => {
      if (!ok) return;
      copyBtn.classList.add("copied");
      copyBtn.textContent = "✓";
      setTimeout(() => {
        copyBtn.classList.remove("copied");
        copyBtn.textContent = "📋";
      }, 1500);
    });
  });
  meta.appendChild(copyBtn);

  if (agent) {
    const chip = document.createElement("span");
    chip.className = \`chip--agent chip--\${agent}\`;
    chip.textContent = agent;
    meta.insertBefore(chip, copyBtn);
  }

  const body = document.createElement("div");
  body.className = "body";
  // \`complete: true\` means the message is already finalized
  // (e.g. loaded from IndexedDB on conversation switch).
  // We render the markdown directly so the user sees the
  // formatted view immediately instead of a raw-text frame
  // that would otherwise be replaced on the next tick.
  if (opts?.complete) {
    body.innerHTML = renderMarkdown(text);
  } else {
    body.textContent = text;
  }

  div.append(meta, body);
  els.messages.appendChild(div);
  els.messages.scrollTop = els.messages.scrollHeight;
  return {
    div,
    body,
    meta,
    copyBtn,
    setCopiedText: (t) => {
      copiedText = t;
    },
  };
}

/**
 * Copy a string to the clipboard with a graceful fallback
 * for browsers that block \`navigator.clipboard\` (e.g. when
 * the page is served over plain HTTP on a non-localhost
 * origin). Returns a promise that resolves to \`true\` on
 * success.
 */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the textarea hack */
  }
  // Fallback for older / insecure-context browsers. The
  // textarea is created off-screen so it doesn't flash.
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "0";
  ta.style.left = "0";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

function renderCitations(target, hits) {
  if (!hits || hits.length === 0) return;
  const det = document.createElement("details");
  det.className = "citations";
  const sum = document.createElement("summary");
  sum.textContent = \`\${hits.length} source\${hits.length === 1 ? "" : "s"}\`;
  det.appendChild(sum);
  const ol = document.createElement("ol");
  for (const h of hits) {
    const li = document.createElement("li");
    // Build with DOM APIs (textContent / createElement) so a
    // journal entry containing \`<script>\` or \`&\` cannot
    // inject markup. innerHTML is only safe when every
    // interpolated value is escaped AND the source is
    // trusted; both stop being true the moment the user can
    // write to their own RAG corpus.
    const src = document.createElement("span");
    src.className = "src";
    src.textContent = h.source;
    li.appendChild(src);
    li.appendChild(
      document.createTextNode(
        h.text.slice(0, 160) + (h.text.length > 160 ? "…" : ""),
      ),
    );
    const score = document.createElement("span");
    score.className = "score";
    score.textContent = \`· \${h.score.toFixed(3)}\`;
    li.appendChild(score);
    ol.appendChild(li);
  }
  det.appendChild(ol);
  target.appendChild(det);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// v3.0.2: markdown rendering lives in \`web/markdown.js\` so
// it can be unit-tested without a DOM. The script tag in
// index.html loads it first and exposes it on \`window\`
// as \`EdgeWellMarkdown\`. We pull the renderer through the
// global so the rest of the file is one import.
function renderMarkdown(src) {
  const fn =
    (typeof window !== "undefined" && window.EdgeWellMarkdown?.renderMarkdown) ||
    null;
  if (fn) return fn(src);
  // Fallback: the very rare case where markdown.js failed
  // to load (e.g. the static handler 500'd). Just escape
  // the input so we never accidentally render raw HTML.
  return \`<p class="md-p">\${escapeHtml(String(src ?? ""))}</p>\`;
}

/* -------------------------- CHAT SUBMISSION --------------------------- */

let sending = false;

els.chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  await submitChat(els.chatInput.value);
});

async function submitChat(raw) {
  const message = (raw ?? "").trim();
  if (!message || sending) return;
  autoScroll = true;
  // Remove the empty-state placeholder the first time the
  // user actually sends a message. Without this the new
  // assistant bubble would appear underneath the "No
  // messages yet" block and the panel would scroll oddly.
  const empty = els.messages.querySelector(".chat-empty");
  if (empty) empty.remove();
  sending = true;
  els.sendBtn.disabled = true;
  setPromptDisabled(true);
  els.chatInput.value = "";
  addMessage("user", message);
  // v3.0.2: conversation persistence. If no conversation is
  // open, create one titled from the first user message.
  // Both the user message and the eventual assistant reply
  // are saved to IndexedDB so a refresh keeps the thread.
  if (
    !STATE.currentConversationId &&
    window.EdgeWellStore?.store?.isAvailable?.()
  ) {
    const conv = await window.EdgeWellStore.store.createConversation(
      truncateTitle(message),
    );
    STATE.conversations.unshift(conv);
    STATE.currentConversationId = conv.id;
    try {
      localStorage.setItem(LAST_CONV_KEY, conv.id);
    } catch {
      /* private mode */
    }
    renderConversationList();
  }
  if (
    STATE.currentConversationId &&
    window.EdgeWellStore?.store?.isAvailable?.()
  ) {
    await window.EdgeWellStore.store.addMessage(
      STATE.currentConversationId,
      { role: "user", text: message },
    );
  }
  // Reserve an assistant bubble; we fill it in as tokens arrive.
  // \`addMessage\` now returns a record with the bubble div,
  // the body, and a \`setCopiedText\` so the copy button
  // picks up the final rendered text once the stream ends.
  const bubble = addMessage("assistant", "", null);
  const { div: bubbleDiv, body, setCopiedText } = bubble;
  let pendingCitations = null;
  let finalAgent = null;
  let buffer = "";
  let textNode = null;
  let cursor = document.createElement("span");
  cursor.className = "cursor";
  body.appendChild(cursor);

  try {
    for await (const ev of streamChat(message)) {
      if (ev.type === "route") {
        finalAgent = ev.agent;
        bubbleDiv.classList.add(\`msg-agent-\${ev.agent}\`);
        // Insert the agent chip into the pre-built meta row
        // (in front of the copy button).
        const meta = bubbleDiv.querySelector(".meta");
        if (meta) {
          const chip = document.createElement("span");
          chip.className = \`chip--agent chip--\${ev.agent}\`;
          chip.textContent = ev.agent;
          meta.insertBefore(chip, meta.firstChild);
        }
      } else if (ev.type === "context") {
        pendingCitations = ev.hits;
      } else if (ev.type === "token") {
        // Coalesce per-event DOM writes by writing straight
        // into a single text node; this is O(1) per token.
        buffer += ev.text;
        if (cursor.parentElement) cursor.remove();
        if (!textNode) {
          textNode = document.createTextNode("");
          body.appendChild(textNode);
        }
        textNode.data = buffer;
        body.appendChild(cursor);
        if (autoScroll) els.messages.scrollTop = els.messages.scrollHeight;
      } else if (ev.type === "error") {
        if (cursor.parentElement) cursor.remove();
        const err = document.createElement("div");
        err.className = "message error";
        err.textContent = \`error: \${ev.message}\`;
        els.messages.appendChild(err);
      } else if (ev.type === "done") {
        if (cursor.parentElement) cursor.remove();
        // Render the final text as markdown. The plain
        // \`textContent\` is preserved on the copy button so
        // clipboard users get clean text without the raw
        // markdown tokens they may have seen during
        // streaming.
        body.innerHTML = renderMarkdown(buffer);
        setCopiedText(buffer);
        if (pendingCitations && pendingCitations.length > 0) {
          renderCitations(body, pendingCitations);
        }
        // Persist the assistant message + bump the
        // conversation's updatedAt so the sidebar list
        // re-sorts. Awaiting is fine: the UI is already
        // finished rendering and IDB writes are fast.
        if (
          STATE.currentConversationId &&
          window.EdgeWellStore?.store?.isAvailable?.()
        ) {
          await window.EdgeWellStore.store.addMessage(
            STATE.currentConversationId,
            {
              role: "assistant",
              text: buffer,
              agent: finalAgent,
              citations: pendingCitations || undefined,
            },
          );
          await refreshConversationList();
        }
        break;
      }
    }
  } catch (err) {
    if (cursor.parentElement) cursor.remove();
    const errDiv = document.createElement("div");
    errDiv.className = "message error";
    
    const errSpan = document.createElement("span");
    errSpan.textContent = \`stream error: \${err.message}. \`;
    errDiv.appendChild(errSpan);

    const configLink = document.createElement("a");
    configLink.href = "#";
    configLink.textContent = "Tap here to configure the companion server URL.";
    configLink.style.textDecoration = "underline";
    configLink.style.color = "inherit";
    configLink.style.fontWeight = "bold";
    configLink.style.cursor = "pointer";
    configLink.addEventListener("click", (e) => {
      e.preventDefault();
      const current = getServer();
      const res = prompt("Enter EdgeWell Companion Server URL (e.g., http://192.168.1.35:8787):", current);
      if (res === null) return;
      setServer(res);
      toast("server URL updated", "good");
      ping();
    });
    errDiv.appendChild(configLink);

    els.messages.appendChild(errDiv);
  } finally {
    if (cursor.parentElement) cursor.remove();
    sending = false;
    els.sendBtn.disabled = false;
    setPromptDisabled(false);
  }
}

/* --------------------------- QUICK PROMPTS ---------------------------- */

document.querySelectorAll(".chip[data-prompt]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = btn.getAttribute("data-prompt");
    if (p) submitChat(p);
  });
});

/**
 * Toggle the quick-prompt chips' disabled state in lockstep
 * with the chat submit button. Both fire \`submitChat\` and we
 * want a single visual hint that a request is in flight.
 */
function setPromptDisabled(disabled) {
  document
    .querySelectorAll(".chip[data-prompt]")
    .forEach((b) => (b.disabled = disabled));
}

/* --------------------------- JOURNAL ---------------------------------- */

els.journalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = els.journalText.value.trim();
  if (!text) return;
  const tags = els.journalTags.value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  try {
    await api("/journal", {
      method: "POST",
      body: JSON.stringify({ text, tags }),
    });
    els.journalText.value = "";
    els.journalTags.value = "";
    await loadJournal();
    toast("journal entry added", "good");
  } catch (err) {
    toast(\`journal error: \${err.message}\`, "bad");
  }
});

async function loadJournal() {
  try {
    const r = await api("/journal?limit=20");
    const entries = r.entries ?? [];
    els.journalList.innerHTML = "";
    if (entries.length === 0) {
      renderEmptyState(
        els.journalList,
        "no entries yet — your first note shows up here.",
      );
    }
    for (const entry of entries) {
      const li = document.createElement("li");
      const ts = entry._ts
        ? new Date(entry._ts).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";
      li.innerHTML =
        \`<div class="journal-text">\${escapeHtml(entry.text)}</div>\` +
        \`<div class="journal-meta">\` +
        (ts
          ? \`<span class="time-stamp">\${escapeHtml(ts)}</span>\`
          : "") +
        (entry.tags?.length
          ? \`<span class="tags-list">\${entry.tags
              .map((t) => \`<span class="tag-pill">#\${escapeHtml(t)}</span>\`)
              .join("")}</span>\`
          : "") +
        \`</div>\`;
      els.journalList.appendChild(li);
    }
    els.journalCount.textContent = \`\${entries.length} entr\${
      entries.length === 1 ? "y" : "ies"
    }\`;
  } catch (err) {
    toast(\`journal error: \${err.message}\`, "bad");
  }
}

/* ----------------------------- EXPENSES ------------------------------- */

els.expenseForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = parseFloat(els.expenseAmount.value);
  if (!Number.isFinite(amount) || amount <= 0) return;
  const category = els.expenseCategory.value.trim() || "other";
  const note = els.expenseNote.value.trim() || null;
  try {
    await api("/expenses", {
      method: "POST",
      body: JSON.stringify({ amount, category, note }),
    });
    els.expenseAmount.value = "";
    els.expenseNote.value = "";
    await loadExpenses();
    toast("expense added", "good");
  } catch (err) {
    toast(\`expense error: \${err.message}\`, "bad");
  }
});

async function loadExpenses() {
  try {
    const r = await api("/expenses?limit=200");
    const items = r.expenses ?? [];
    // Build the last-7-days total per day for the bar chart.
    const today = startOfDay(new Date());
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({ date: d, total: 0 });
    }
    for (const e of items) {
      if (!e._ts) continue;
      const d = startOfDay(new Date(e._ts));
      const slot = days.find((x) => sameDay(x.date, d));
      if (slot) slot.total += Number(e.amount) || 0;
    }
    renderChart(days);
    // Total this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthTotal = items
      .filter((e) => e._ts && new Date(e._ts) >= monthStart)
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    els.expenseTotal.textContent = \`this month \${monthTotal.toFixed(2)}\`;
    // Recent list
    els.expenseList.innerHTML = "";
    const recent = items.slice(-15).reverse();
    if (recent.length === 0) {
      renderEmptyState(
        els.expenseList,
        "no expenses yet — your spend shows up here.",
      );
    }
    for (const e of recent) {
      const li = document.createElement("li");
      const ts = e._ts
        ? new Date(e._ts).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";
      li.innerHTML =
        \`<div class="expense-row">\` +
        \`<span class="amt">\${(Number(e.amount) || 0).toFixed(2)}</span>\` +
        \`<span class="cat">\${escapeHtml(e.category || "other")}</span>\` +
        \`</div>\` +
        (e.note
          ? \`<div class="note">\${escapeHtml(e.note)}</div>\`
          : "") +
        (ts ? \`<span class="when">\${escapeHtml(ts)}</span>\` : "");
      els.expenseList.appendChild(li);
    }
  } catch (err) {
    toast(\`expense error: \${err.message}\`, "bad");
  }
}

function renderChart(days) {
  els.expenseChart.innerHTML = "";
  const max = Math.max(1, ...days.map((d) => d.total));
  for (const d of days) {
    const bar = document.createElement("div");
    bar.className = "chart-bar";
    if (d.total === 0) {
      // Render empty days as a flat 2px line at the bottom of
      // the chart so they don't masquerade as real data.
      bar.style.height = "2px";
      bar.setAttribute("data-empty", "true");
    } else {
      // Round up to at least 4px so even a small day still
      // reads as "something happened" without dominating the
      // largest day.
      const pct = Math.max(4, (d.total / max) * 100);
      bar.style.height = \`\${pct}%\`;
      bar.setAttribute("data-empty", "false");
    }
    bar.title = \`\${d.date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}: \${d.total.toFixed(2)}\`;
    els.expenseChart.appendChild(bar);
  }
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* --------------------------- CONNECTION ------------------------------- */

async function ping() {
  try {
    const r = await fetchWithTimeout(\`\${SERVER}/health\`);
    if (r.ok) {
      const j = await r.json();
      // v3.0.2: surface the actual P2P state from /health
      // instead of hardcoding "local". When P2P is enabled
      // we also probe the peer (best-effort, 1.5 s timeout)
      // and flip the dot to "peer" or "fallback" so the
      // user can see the delegation layer working.
      const peerEnabled = !!j?.p2p?.enabled;
      let p2pState = "local";
      let p2pLabel = "local";
      if (peerEnabled) {
        const reachable = await probePeer(j.p2p.host, j.p2p.port);
        if (reachable) {
          p2pState = "peer";
          p2pLabel = \`peer · \${j.p2p.host.split(".").pop() || "?"}\`;
        } else {
          p2pState = "fallback";
          p2pLabel = \`peer ↓ → local\`;
        }
      }
      setP2p(p2pState, p2pLabel);

      // One-line status: version, model, counts. Skips
      // duplication of info that lives in the P2P badge.
      const counts = j?.counts
        ? \` · \${j.counts.journal} journal · \${j.counts.expenses} expense\${j.counts.expenses === 1 ? "" : "s"}\`
        : "";
      const model = j?.model ? \` · \${j.model}\` : "";
      els.status.textContent = \`connected · v\${j.version}\${model}\${counts}\`;
      els.statusDot.className = "dot dot--ok";
      return j;
    }
    if (r.status === 401) {
      els.status.textContent = "needs bearer token — tap 🔑 to set";
      els.statusDot.className = "dot dot--bad";
      setP2p("down", "auth");
      return null;
    }
    els.status.textContent = \`disconnected (HTTP \${r.status})\`;
    els.statusDot.className = "dot dot--bad";
    setP2p("down", "down");
    return null;
  } catch (err) {
    // v3.0.2: differentiate "device offline" (no fetch) from
    // "server offline" (connection refused). navigator.onLine
    // is best-effort but useful for the user-visible label.
    const offline = navigator.onLine === false;
    els.status.textContent = offline
      ? \`device offline\`
      : \`disconnected (\${err.message})\`;
    els.statusDot.className = "dot dot--bad";
    setP2p("down", offline ? "device offline" : "server down");
    return null;
  }
}

/**
 * Best-effort reachability probe for the P2P peer. We
 * deliberately use a 1.5 s timeout so a slow/missing peer
 * doesn't block the /health response from painting. The
 * companion is the local source of truth; this is purely
 * a UI hint.
 */
async function probePeer(host, port) {
  if (!host || !port) return false;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 1500);
  try {
    const res = await fetch(\`http://\${host}:\${port}/health\`, {
      signal: ctrl.signal,
      mode: "cors",
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

function setP2p(state, label) {
  els.p2p.className = \`p2p p2p--\${state}\`;
  els.p2pText.textContent = label;
  els.p2p.title = \`Routing: \${label}\`;
}





/* ------------------------------ TABS ---------------------------------- */

function activateTab(name) {
  document.body.dataset.tab = name;
  document.querySelectorAll("[data-tab-btn]").forEach((btn) => {
    const sel = btn.dataset.tabBtn === name;
    btn.setAttribute("aria-selected", sel ? "true" : "false");
  });
  // Focus the input on the chat tab for fast keyboard entry.
  if (name === "chat") els.chatInput.focus();
}
document.querySelectorAll("[data-tab-btn]").forEach((btn) => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tabBtn));
});
// Allow deep-links: <a href="#journal"> etc.
window.addEventListener("hashchange", () => {
  const h = location.hash.replace("#", "");
  if (["chat", "journal", "expenses"].includes(h)) activateTab(h);
});
if (["chat", "journal", "expenses"].includes(location.hash.replace("#", ""))) {
  activateTab(location.hash.replace("#", ""));
}

/* ----------------------------- TOAST ---------------------------------- */

let toastTimer = null;
function toast(text, kind = "") {
  els.toast.textContent = text;
  els.toast.className = \`toast show \${kind ? \`toast--\${kind}\` : ""}\`.trim();
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.className = els.toast.className.replace(" show", "");
  }, 2400);
}

/* ------------------------- PWA INSTALL BUTTON ------------------------- */
 
let deferredInstall = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstall = e;
  // Only show the button on platforms that actually support
  // the install prompt (Chromium browsers on desktop/Android).
  // iOS Safari never fires this event and the button is
  // replaced by a one-shot toast handled in the boot sequence.
  if (!isIosSafari) els.installBtn.hidden = false;
});
els.installBtn.addEventListener("click", async () => {
  if (!deferredInstall) return;
  els.installBtn.hidden = true;
  deferredInstall.prompt();
  const choice = await deferredInstall.userChoice;
  if (choice.outcome === "accepted") {
    toast("installed — look for EdgeWell on your home screen", "good");
  }
  deferredInstall = null;
});
window.addEventListener("appinstalled", () => {
  els.installBtn.hidden = true;
  toast("installed", "good");
});

/**
 * Show the iOS-specific install hint once per session. We
 * attach the listener to a no-op click target so the toast
 * doesn't fire on page load (which would be considered a
 * pop-up) — it only appears after the user has interacted
 * with the page at least once.
 */
function setupIosInstallHint() {
  if (!isIosSafari || isStandalone) return;
  const fire = () => {
    toast(
      "📱 Tap the share button, then “Add to Home Screen” to install",
      "",
      5000,
    );
    document.removeEventListener("click", fire);
    document.removeEventListener("keydown", fire);
  };
  document.addEventListener("click", fire, { once: true });
  document.addEventListener("keydown", fire, { once: true });
}

/* --------------------------- SERVICE WORKER --------------------------- */

// Register the SW only when served from http(s) — registering
// over file:// throws and the dev workflow opens the page
// from disk sometimes. The scope is the page's own directory
// which is \`./\` for the companion (e.g. /index.html, /sw.js)
// so a relative path keeps it correct regardless of where
// the user landed.
if (location.protocol.startsWith("http") && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js", { scope: "./" })
      .catch((err) => console.warn("sw register failed", err));
  });

  // Automatically refresh when the new service worker takes over
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

/* ----------------------------- ONLINE/OFFLINE -------------------------- */

// v3.0.2: reflect navigator.onLine transitions in the status
// line so the user can tell "device is offline" from
// "server is down". Online → trigger an immediate re-ping so
// the P2P badge recovers without waiting for the 15s timer.
window.addEventListener("online", () => {
  toast("back online", "good");
  ping();
});
window.addEventListener("offline", () => {
  els.status.textContent = "device offline";
  els.statusDot.className = "dot dot--bad";
  setP2p("down", "device offline");
});

/* --------------------------- THEME + SIDEBAR --------------------------- */

const STATE = {
  // Active conversation id. null means no conversation is
  // open yet (the chat pane shows the empty state).
  currentConversationId: null,
  // Cached conversation list for the sidebar. Refreshed
  // after every save / delete.
  conversations: [],
  // Sidebar is closed on boot; opening it renders the
  // conversation list.
  sidebarOpen: false,
};

const THEME_KEY = "edgewell.theme";
const LAST_CONV_KEY = "edgewell.lastConversationId";

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* localStorage may be unavailable in private mode */
  }
  // Fall back to the OS preference, then dark.
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

function applyTheme(theme) {
  // \`data-theme\` on <html> drives the CSS variable swap.
  // The theme button icon flips between 🌙 (when in light
  // mode, meaning click-to-go-dark) and ☀️ (vice versa).
  document.documentElement.dataset.theme = theme;
  if (els.themeBtn) {
    els.themeBtn.textContent = theme === "light" ? "\\u{1F319}" : "\\u{2600}\\uFE0F";
    els.themeBtn.title =
      theme === "light" ? "Switch to dark theme" : "Switch to light theme";
  }
}

function toggleTheme() {
  const next =
    (document.documentElement.dataset.theme || "dark") === "light"
      ? "dark"
      : "light";
  document.documentElement.classList.add("theme-transition");
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* private mode */
  }
  applyTheme(next);
  setTimeout(() => {
    document.documentElement.classList.remove("theme-transition");
  }, 350);
}

els.themeBtn?.addEventListener("click", toggleTheme);

const statusContainer = document.getElementById("status");
if (statusContainer) {
  statusContainer.addEventListener("click", () => {
    const current = getServer();
    const res = prompt("Enter EdgeWell Companion Server URL (e.g., http://192.168.1.35:8787):", current);
    if (res === null) return; // cancelled
    setServer(res);
    toast("server URL updated", "good");
    ping();
  });
  statusContainer.style.cursor = "pointer";
  statusContainer.title = "Tap to configure companion server URL";
}

/* ---------------------- CONVERSATION PERSISTENCE ---------------------- */

function truncateTitle(s, max = 40) {
  const t = (s ?? "").trim().replace(/\\s+/g, " ");
  if (t.length <= max) return t || "New chat";
  return t.slice(0, max - 1).trimEnd() + "\\u2026";
}

function formatRelativeTime(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return \`\${Math.floor(diff / 60_000)}m ago\`;
  if (diff < 86_400_000) return \`\${Math.floor(diff / 3_600_000)}h ago\`;
  if (diff < 7 * 86_400_000) return \`\${Math.floor(diff / 86_400_000)}d ago\`;
  return new Date(ts).toLocaleDateString();
}

async function refreshConversationList() {
  if (!window.EdgeWellStore?.store?.isAvailable?.()) return;
  STATE.conversations = await window.EdgeWellStore.store.listConversations();
  renderConversationList();
}

function renderConversationList() {
  if (!els.conversationList) return;
  els.conversationList.innerHTML = "";
  if (STATE.conversations.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "no conversations yet — send a message to start one.";
    els.conversationList.appendChild(empty);
    return;
  }
  for (const conv of STATE.conversations) {
    const li = document.createElement("li");
    li.className =
      "conversation-item" +
      (conv.id === STATE.currentConversationId ? " active" : "");
    li.dataset.id = conv.id;

    const main = document.createElement("div");
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = conv.title || "New chat";
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = formatRelativeTime(conv.updatedAt);
    main.append(title, meta);
    li.appendChild(main);

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.type = "button";
    del.setAttribute("aria-label", \`Delete \${conv.title || "conversation"}\`);
    del.title = "Delete";
    del.textContent = "\\u{1F5D1}\\uFE0F";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteConversation(conv);
    });
    li.appendChild(del);

    li.addEventListener("click", () => switchToConversation(conv));
    els.conversationList.appendChild(li);
  }
}

function openSidebar() {
  if (!els.sidebar) return;
  STATE.sidebarOpen = true;
  els.sidebar.hidden = false;
  els.sidebar.setAttribute("aria-hidden", "false");
  // Defer the open class so the transition runs from
  // translateX(-100%) to translateX(0).
  requestAnimationFrame(() => {
    els.sidebar.classList.add("open");
    if (els.sidebarBackdrop) {
      els.sidebarBackdrop.hidden = false;
      requestAnimationFrame(() =>
        els.sidebarBackdrop.classList.add("open"),
      );
    }
  });
}

function closeSidebar() {
  if (!els.sidebar) return;
  STATE.sidebarOpen = false;
  els.sidebar.classList.remove("open");
  els.sidebar.setAttribute("aria-hidden", "true");
  if (els.sidebarBackdrop) {
    els.sidebarBackdrop.classList.remove("open");
  }
  // Wait for the transition to finish before hiding so
  // the slide-out is visible.
  setTimeout(() => {
    if (!STATE.sidebarOpen) {
      els.sidebar.hidden = true;
      if (els.sidebarBackdrop) els.sidebarBackdrop.hidden = true;
    }
  }, 220);
}

els.sidebarBtn?.addEventListener("click", openSidebar);
els.sidebarClose?.addEventListener("click", closeSidebar);
els.sidebarBackdrop?.addEventListener("click", closeSidebar);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && STATE.sidebarOpen) closeSidebar();
});

els.newChatBtn?.addEventListener("click", startNewChat);

async function startNewChat() {
  const conv = await window.EdgeWellStore.store.createConversation("New chat");
  STATE.conversations.unshift(conv);
  STATE.currentConversationId = conv.id;
  try {
    localStorage.setItem(LAST_CONV_KEY, conv.id);
  } catch {
    /* private mode */
  }
  els.messages.innerHTML = "";
  renderChatEmpty();
  renderConversationList();
  closeSidebar();
  els.chatInput.focus();
}

async function switchToConversation(conv) {
  if (!conv) return;
  STATE.currentConversationId = conv.id;
  try {
    localStorage.setItem(LAST_CONV_KEY, conv.id);
  } catch {
    /* private mode */
  }
  // Clear the chat panel and re-render this conversation's
  // messages. Loaded messages have no streaming state, so
  // we pass \`complete: true\` to skip the live token cursor
  // and render markdown directly.
  els.messages.innerHTML = "";
  const messages = await window.EdgeWellStore.store.getMessages(conv.id);
  for (const m of messages) {
    if (m.role === "user") {
      addMessage("user", m.text);
    } else if (m.role === "assistant") {
      const { div, body, setCopiedText } = addMessage(
        "assistant",
        m.text,
        m.agent,
        { complete: true },
      );
      if (m.citations && m.citations.length > 0) {
        renderCitations(body, m.citations);
      }
    }
  }
  if (messages.length === 0) renderChatEmpty();
  renderConversationList();
  els.messages.scrollTop = els.messages.scrollHeight;
  autoScroll = true;
}

async function deleteConversation(conv) {
  if (!confirm(\`Delete "\${conv.title}"? This can't be undone.\`)) return;
  await window.EdgeWellStore.store.deleteConversation(conv.id);
  STATE.conversations = STATE.conversations.filter((c) => c.id !== conv.id);
  if (STATE.currentConversationId === conv.id) {
    STATE.currentConversationId = null;
    els.messages.innerHTML = "";
    if (STATE.conversations.length > 0) {
      await switchToConversation(STATE.conversations[0]);
    } else {
      renderChatEmpty();
    }
  }
  renderConversationList();
}

/* -------------------------------- BOOT -------------------------------- */

(async function boot() {
  applyTheme(getStoredTheme());
  renderChatEmpty();
  setupIosInstallHint();
  // v3.0.2: focus the chat input on desktop only. Mobile
  // keyboards pop up on focus, which would force the user
  // to dismiss them before they can read the page. The
  // matchMedia check is on CSS pixel width, matching the
  // desktop layout breakpoint.
  const isDesktop = window.matchMedia?.("(min-width: 721px)").matches;
  if (isDesktop) els.chatInput.focus();
  // Load conversation history and restore the last one.
  if (window.EdgeWellStore?.store?.isAvailable?.()) {
    await refreshConversationList();
    const lastId = (() => {
      try {
        return localStorage.getItem(LAST_CONV_KEY);
      } catch {
        return null;
      }
    })();
    const last = lastId
      ? STATE.conversations.find((c) => c.id === lastId)
      : null;
    if (last) {
      await switchToConversation(last);
    } else if (STATE.conversations.length > 0) {
      await switchToConversation(STATE.conversations[0]);
    }
    renderConversationList();
  }
  await ping();
  await Promise.all([loadJournal(), loadExpenses()]);

  // Floating scroll bottom button event setup
  if (els.messages) {
    els.messages.addEventListener("scroll", () => {
      const threshold = 150;
      const distanceToBottom =
        els.messages.scrollHeight -
        els.messages.scrollTop -
        els.messages.clientHeight;
      autoScroll = distanceToBottom <= threshold;

      const scrollBottomBtn = document.getElementById("scroll-bottom-btn");
      if (scrollBottomBtn) {
        if (distanceToBottom > 300) {
          scrollBottomBtn.hidden = false;
        } else {
          scrollBottomBtn.hidden = true;
        }
      }
    });
  }

  const scrollBottomBtn = document.getElementById("scroll-bottom-btn");
  if (scrollBottomBtn) {
    scrollBottomBtn.addEventListener("click", () => {
      els.messages.scrollTo({
        top: els.messages.scrollHeight,
        behavior: "smooth",
      });
    });
  }

  // Periodic health probe — also lets the P2P dot recover
  // automatically if the companion restarts.
  setInterval(ping, 15_000);
})();
`,
  "fake-server.js": `// EdgeWell fake companion server — v3.2.0-demo
//
// Runs entirely inside the WebView/service worker so the Android APK
// works with zero setup. It mirrors the real companion HTTP API
// (\`/health\`, \`/chat\`, \`/chat/stream\`, \`/journal\`, \`/expenses\`,
// \`/profile\`) backed by IndexedDB for persistence across app restarts.
//
// The QVAC SDK layer is the vendor stub: chat returns a demo-mode
// reply and the multi-agent router still picks a specialist so the
// UI shows the [health]/[finance]/[lifestyle] chip.
//
// This file is loaded both as a <script> in index.html and via
// importScripts() in the service worker so the same implementation
// can intercept \`http://localhost:8787/*\` requests.

(function (global) {
  const DB_NAME = "edgewell-fake-server";
  const DB_VERSION = 1;
  const STORE_JOURNAL = "journal";
  const STORE_EXPENSES = "expenses";

  const VERSION = "3.2.0-demo";
  const MODEL = "LLAMA_3_2_1B_INST_Q4_0";

  function uuid() {
    if (global.crypto?.randomUUID) return global.crypto.randomUUID();
    return \`id-\${Date.now()}-\${Math.random().toString(36).slice(2, 10)}\`;
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
      \`I'm running in demo mode — the @qvac/sdk isn't running real inference inside this APK, \` +
      \`so I can't give a live answer to "\${q}". \` +
      \`The router picked the **[\${agentLabel}]** specialist. \` +
      \`Install the real SDK and rebuild with the on-device runtime to enable local LLM replies.\`
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
            if (ev.event) frame += \`event: \${ev.event}\\n\`;
            frame += \`data: \${JSON.stringify(ev.data)}\\n\\n\`;
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
    const words = reply.split(/(\\s+)/).filter(Boolean);
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
`,
  "icon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="EdgeWell">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7dd3fc"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <linearGradient id="g2" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#0f1115"/>
      <stop offset="100%" stop-color="#1f2937"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="96" fill="url(#g2)"/>
  <!-- Stylised "E" + heartbeat mark -->
  <g fill="none" stroke="url(#g)" stroke-width="28" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="148,128 148,384 364,384"/>
    <polyline points="148,256 296,256"/>
    <polyline points="148,128 364,128"/>
  </g>
  <path d="M196 320 L240 320 L260 280 L300 360 L330 300 L380 300"
        fill="none" stroke="#86efac" stroke-width="22"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`,
  "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover"
    />
    <meta name="theme-color" content="#090a0f" />
    <meta name="color-scheme" content="light dark" />
    <meta
      name="description"
      content="EdgeWell — private, on-device health and finance coach."
    />
    <title>EdgeWell Companion</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />

    <!-- PWA hooks. The manifest is at the same origin so a
         phone browser pointed at the companion IP picks it up
         and offers "Add to Home Screen". The service worker
         caches the static shell so the page renders even when
         the device is briefly offline. -->
    <link rel="manifest" href="manifest.webmanifest" />
    <link rel="icon" type="image/svg+xml" href="icon.svg" />
    <link rel="apple-touch-icon" href="icon.svg" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta
      name="apple-mobile-web-app-status-bar-style"
      content="black-translucent"
    />
    <meta name="apple-mobile-web-app-title" content="EdgeWell" />

    <link rel="stylesheet" href="style.css" />
  </head>

  <body data-tab="chat">
    <a class="skip" href="#chat-panel">Skip to chat</a>

    <div class="phone-container">
      <header class="topbar" role="banner">
      <div class="brand">
        <span class="logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="28" height="28">
            <rect width="32" height="32" rx="7" fill="var(--panel-2)" stroke="var(--border)" stroke-width="1" />
            <polyline
              points="9,8 9,24 23,24"
              fill="none"
              stroke="var(--accent)"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <polyline
              points="9,16 19,16"
              fill="none"
              stroke="var(--accent)"
              stroke-width="2.4"
              stroke-linecap="round"
            />
            <path
              d="M12 20 L15 20 L17 17 L20 22 L22 18 L25 18"
              fill="none"
              stroke="var(--good)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <div class="brand-text">
          <h1>EdgeWell</h1>
          <p class="muted tagline" id="status">
            <span class="dot dot--pending" aria-hidden="true"></span>
            <span id="status-text">connecting…</span>
          </p>
        </div>
      </div>

      <div class="topbar-actions">
        <button
          id="theme-btn"
          class="btn btn--ghost"
          type="button"
          title="Toggle light / dark"
          aria-label="Toggle theme"
        >
          🌙
        </button>
        <!-- <span
          id="p2p"
          class="p2p p2p--local"
          title="Routing status: local model"
          aria-label="Routing status"
        >
          <span class="dot" aria-hidden="true"></span>
          <span id="p2p-text">local</span>
        </span> -->
        <button
          id="sidebar-btn"
          class="btn btn--ghost"
          type="button"
          title="Conversations"
          aria-label="Open conversations"
        >
          <span class="btn-icon">≡</span><span class="btn-text"> Chats</span>
        </button>
        <button
          id="install-btn"
          class="btn btn--ghost"
          type="button"
          hidden
        >
          <span class="btn-icon">⤓</span><span class="btn-text"> Install</span>
        </button>
      </div>
    </header>

    <main class="layout">
      <!-- LEFT: JOURNAL -->
      <section
        id="journal-panel"
        class="panel panel--left"
        data-tab-target="journal"
        aria-label="Journal"
      >
        <header class="panel-head">
          <h2>Journal</h2>
          <span id="journal-count" class="muted small">0 entries</span>
        </header>

        <form id="journal-form" class="form">
          <label class="sr-only" for="journal-text">New journal entry</label>
          <textarea
            id="journal-text"
            name="text"
            rows="3"
            placeholder="Today I noticed…"
            required
          ></textarea>
          <label class="sr-only" for="journal-tags">Tags</label>
          <input
            id="journal-tags"
            name="tags"
            type="text"
            placeholder="tags (comma separated)"
            autocomplete="off"
          />
          <div class="form-actions">
            <button class="btn btn--primary" type="submit">Add entry</button>
          </div>
        </form>

        <ul id="journal-list" class="journal-list" aria-live="polite"></ul>
      </section>

      <!-- CENTER: CHAT -->
      <section
        id="chat-panel"
        class="panel panel--center"
        data-tab-target="chat"
        aria-label="Chat"
      >
        <header class="panel-head">
          <h2>Chat</h2>
          <span class="muted small">
            multi-agent · <code>router → specialist → RAG</code>
          </span>
        </header>


        <div id="messages" class="messages" aria-live="polite"></div>

        <button
          id="scroll-bottom-btn"
          class="scroll-bottom-btn"
          type="button"
          aria-label="Scroll to bottom"
          hidden
        >
          ↓
        </button>

        <div class="quick-prompts" role="group" aria-label="Quick prompts">
          <button class="chip" data-prompt="How did I sleep this week?">
            🛌 Sleep
          </button>
          <button class="chip" data-prompt="What's my biggest expense category this month?">
            💸 Budget
          </button>
          <button class="chip" data-prompt="Plan a 7-day workout for me">
            🏃 Workout
          </button>
          <button class="chip" data-prompt="Help me stay focused today">
            🎯 Focus
          </button>
        </div>

        <form id="chat-form" class="form form--chat" autocomplete="off">
          <label class="sr-only" for="chat-input">Ask EdgeWell</label>
          <input
            id="chat-input"
            name="message"
            type="text"
            placeholder="Ask EdgeWell…"
            autocomplete="off"
            enterkeyhint="send"
            required
          />
          <button class="btn btn--primary" type="submit" id="send-btn" aria-label="Send">
            <span class="send-icon">▲</span><span class="send-label"> Send</span>
          </button>
        </form>
      </section>

      <!-- RIGHT: EXPENSES -->
      <section
        id="expenses-panel"
        class="panel panel--right"
        data-tab-target="expenses"
        aria-label="Expenses"
      >
        <header class="panel-head">
          <h2>Expenses</h2>
          <span id="expense-total" class="muted small">total —</span>
        </header>

        <form id="expense-form" class="form form--inline">
          <label class="sr-only" for="expense-amount">Amount</label>
          <input
            id="expense-amount"
            name="amount"
            type="number"
            inputmode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            required
          />
          <label class="sr-only" for="expense-category">Category</label>
          <input
            id="expense-category"
            name="category"
            type="text"
            list="cat-list"
            placeholder="category"
            autocomplete="off"
          />
          <datalist id="cat-list">
            <option value="food"></option>
            <option value="transport"></option>
            <option value="books"></option>
            <option value="coffee"></option>
            <option value="rent"></option>
            <option value="other"></option>
          </datalist>
          <label class="sr-only" for="expense-note">Note</label>
          <input
            id="expense-note"
            name="note"
            type="text"
            placeholder="note (optional)"
            autocomplete="off"
          />
          <div class="form-actions">
            <button class="btn btn--primary" type="submit">Add</button>
          </div>
        </form>

        <div id="expense-chart" class="chart" aria-hidden="true"></div>
        <ul id="expense-list" class="expense-list" aria-live="polite"></ul>
      </section>
    </main>

    <!-- MOBILE TAB BAR -->
    <nav class="tabbar" role="tablist" aria-label="Sections">
      <button
        class="tab"
        role="tab"
        data-tab-btn="journal"
        aria-controls="journal-panel"
        aria-selected="false"
      >
        <span aria-hidden="true">📓</span><span>Journal</span>
      </button>
      <button
        class="tab tab--primary"
        role="tab"
        data-tab-btn="chat"
        aria-controls="chat-panel"
        aria-selected="true"
      >
        <span aria-hidden="true">💬</span><span>Chat</span>
      </button>
      <button
        class="tab"
        role="tab"
        data-tab-btn="expenses"
        aria-controls="expenses-panel"
        aria-selected="false"
      >
        <span aria-hidden="true">💰</span><span>Expenses</span>
      </button>
    </nav>

    <!-- Toast region for transient feedback (install, offline, etc.) -->
    <div id="toast" class="toast" role="status" aria-live="polite"></div>

    <!-- Sidebar: conversation history (slides in from the left) -->
    <aside
      id="sidebar"
      class="sidebar"
      aria-label="Conversations"
      aria-hidden="true"
      hidden
    >
      <header class="sidebar-head">
        <h3>Conversations</h3>
        <button
          id="sidebar-close"
          class="btn btn--ghost"
          type="button"
          aria-label="Close conversations"
        >×</button>
      </header>
      <button
        id="new-chat-btn"
        class="btn btn--primary"
        type="button"
      >+ New chat</button>
      <ul
        id="conversation-list"
        class="conversation-list"
        aria-live="polite"
      ></ul>
    </aside>
    <div
      id="sidebar-backdrop"
      class="sidebar-backdrop"
      hidden
    ></div>
    </div>

    <script src="markdown.js"></script>
    <script src="store.js"></script>
    <script src="fake-server.js"></script>
    <script src="app.js"></script>
  </body>
</html>
`,
  "manifest.webmanifest": `{
  "name": "EdgeWell Companion",
  "short_name": "EdgeWell",
  "description": "Private, on-device health and finance coach.",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#090a0f",
  "theme_color": "#090a0f",
  "categories": ["health", "finance", "lifestyle", "productivity"],
  "icons": [
    {
      "src": "icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ],
  "shortcuts": [
    {
      "name": "Ask",
      "short_name": "Ask",
      "description": "Open the chat",
      "url": "./#chat"
    },
    {
      "name": "Journal",
      "short_name": "Journal",
      "description": "Open the journal",
      "url": "./#journal"
    }
  ]
}
`,
  "markdown.js": `// v3.0.2: minimal safe markdown renderer for the EdgeWell web
// UI. Extracted from app.js so it can be unit-tested in Node
// without a DOM. Loaded as a separate <script> in
// index.html so it stays in the global scope (the rest of
// the app is vanilla JS without a build step).
//
// Design: escape the source first, then emit a small set
// of HTML tags from explicit substitutions. The link
// \`href\` is whitelisted to http(s):, mailto:, and relative
// URLs to neutralize \`javascript:\` and \`data:\` schemes.

(function (global) {
  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function safeHref(url) {
    const t = String(url).trim();
    if (/^(https?:|mailto:|\\/|#)/i.test(t)) return t;
    return "#";
  }

  function renderInline(escaped) {
    let out = escaped;
    out = out.replace(/\`([^\`\\n]+)\`/g, (_, code) =>
      \`<code class="md-code-inline">\${code}</code>\`,
    );
    out = out.replace(/\\*\\*([^*\\n]+)\\*\\*/g, "<strong>\$1</strong>");
    out = out.replace(/__([^_\\n]+)__/g, "<strong>\$1</strong>");
    out = out.replace(/(?<!\\*)\\*([^*\\n]+)\\*(?!\\*)/g, "<em>\$1</em>");
    out = out.replace(/(?<!_)_([^_\\n]+)_(?!_)/g, "<em>\$1</em>");
    out = out.replace(
      /\\[([^\\]]+)\\]\\(([^)\\s]+)\\)/g,
      (_, label, url) =>
        \`<a href="\${safeHref(url)}" class="md-link" target="_blank" rel="noopener noreferrer">\${label}</a>\`,
    );
    out = out.replace(/\\n/g, "<br>");
    return out;
  }

  function renderMarkdown(src) {
    const text = String(src ?? "").replace(/\\r\\n/g, "\\n");
    const lines = text.split("\\n");
    const out = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i] ?? "";

      if (/^\`\`\`/.test(line)) {
        const lang = line.replace(/^\`\`\`/, "").trim();
        const codeLines = [];
        i++;
        while (i < lines.length && !/^\`\`\`\\s*\$/.test(lines[i] ?? "")) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++;
        const langAttr = lang
          ? \` data-lang="\${escapeHtml(lang)}"\`
          : "";
        out.push(
          \`<pre class="md-pre"><code class="md-code"\${langAttr}>\${escapeHtml(
            codeLines.join("\\n"),
          )}</code></pre>\`,
        );
        continue;
      }

      const heading = line.match(/^(#{1,6})\\s+(.+)\$/);
      if (heading) {
        const level = heading[1].length;
        out.push(
          \`<h\${level} class="md-h md-h\${level}">\${renderInline(
            escapeHtml(heading[2]),
          )}</h\${level}>\`,
        );
        i++;
        continue;
      }

      if (/^---+\\s*\$/.test(line) || /^\\*\\*\\*+\\s*\$/.test(line)) {
        out.push('<hr class="md-hr">');
        i++;
        continue;
      }

      if (/^>\\s?/.test(line)) {
        const quoteLines = [];
        while (i < lines.length && /^>\\s?/.test(lines[i] ?? "")) {
          quoteLines.push((lines[i] ?? "").replace(/^>\\s?/, ""));
          i++;
        }
        out.push(
          \`<blockquote class="md-quote">\${renderInline(
            escapeHtml(quoteLines.join(" ")),
          )}</blockquote>\`,
        );
        continue;
      }

      if (/^[-*]\\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^[-*]\\s+/.test(lines[i] ?? "")) {
          items.push((lines[i] ?? "").replace(/^[-*]\\s+/, ""));
          i++;
        }
        out.push(
          '<ul class="md-ul">' +
            items
              .map(
                (it) =>
                  \`<li class="md-li">\${renderInline(escapeHtml(it))}</li>\`,
              )
              .join("") +
            "</ul>",
        );
        continue;
      }

      if (/^\\d+\\.\\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\\d+\\.\\s+/.test(lines[i] ?? "")) {
          items.push((lines[i] ?? "").replace(/^\\d+\\.\\s+/, ""));
          i++;
        }
        out.push(
          '<ol class="md-ol">' +
            items
              .map(
                (it) =>
                  \`<li class="md-li">\${renderInline(escapeHtml(it))}</li>\`,
              )
              .join("") +
            "</ol>",
        );
        continue;
      }

      if (/^\\|/.test(line)) {
        const tableLines = [];
        while (i < lines.length && /^\\|/.test(lines[i] ?? "")) {
          tableLines.push(lines[i]);
          i++;
        }
        if (tableLines.length >= 2) {
          const headerLine = tableLines[0] || "";
          const delimiterLine = tableLines[1] || "";
          if (/^[|:\\-\\s]+\$/.test(delimiterLine)) {
            const headers = headerLine.split("|").map(h => h.trim()).filter((h, index, arr) => index > 0 && index < arr.length - 1);
            const alignments = delimiterLine.split("|").map(d => {
              const clean = d.trim();
              if (clean.startsWith(":") && clean.endsWith(":")) return "center";
              if (clean.endsWith(":")) return "right";
              return "left";
            }).filter((_, index, arr) => index > 0 && index < arr.length - 1);

            const bodyRows = tableLines.slice(2).map(row => {
              return row.split("|").map(cell => cell.trim()).filter((_, index, arr) => index > 0 && index < arr.length - 1);
            });

            let htmlTable = \`<div class="md-table-container"><table class="md-table"><thead><tr>\`;
            headers.forEach((h, idx) => {
              const align = alignments[idx] || "left";
              htmlTable += \`<th style="text-align: \${align}">\${renderInline(escapeHtml(h))}</th>\`;
            });
            htmlTable += \`</tr></thead><tbody>\`;
            bodyRows.forEach(row => {
              htmlTable += \`<tr>\`;
              row.forEach((cell, idx) => {
                const align = alignments[idx] || "left";
                htmlTable += \`<td style="text-align: \${align}">\${renderInline(escapeHtml(cell))}</td>\`;
              });
              htmlTable += \`</tr>\`;
            });
            htmlTable += \`</tbody></table></div>\`;
            out.push(htmlTable);
            continue;
          }
        }
        i -= tableLines.length; // fallback if not a valid table structure
      }

      if (/^\\s*\$/.test(line)) {
        i++;
        continue;
      }

      const paraLines = [line];
      i++;
      while (i < lines.length) {
        const next = lines[i] ?? "";
        if (
          !next ||
          /^(#{1,6}\\s|>\\s?|[-*]\\s|\\d+\\.\\s|\`\`\`|---+|\\*\\*\\*+)/.test(next)
        ) {
          break;
        }
        paraLines.push(next);
        i++;
      }
      out.push(
        \`<p class="md-p">\${renderInline(escapeHtml(paraLines.join("\\n")))}</p>\`,
      );
    }

    return out.join("\\n");
  }

  // Expose for browser (global) and Node (module.exports)
  // so the same file can be loaded by index.html's <script>
  // tag AND required by a unit test in test/markdown.test.ts.
  global.EdgeWellMarkdown = { renderMarkdown, escapeHtml, safeHref };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { renderMarkdown, escapeHtml, safeHref };
  }
})(typeof window !== "undefined" ? window : globalThis);
`,
  "store.js": `// v3.0.2: IndexedDB-backed conversation store for the
// EdgeWell web UI. Two object stores: \`conversations\`
// (one row per chat) and \`messages\` (one row per turn,
// indexed by conversationId for fast loading).
//
// Zero dependencies, dual-exported (window + module.exports)
// so the same file can be required from a Node test using
// \`fake-indexeddb\` and loaded as a <script> in the page.
//
// The store is wrapped in a \`createStore(name)\` factory so
// tests can create an isolated DB per test run without
// colliding with the production \`edgewell\` database.

(function (global) {
  const DB_VERSION = 1;
  const STORE_CONVERSATIONS = "conversations";
  const STORE_MESSAGES = "messages";

  function openDb(name) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(name, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_CONVERSATIONS)) {
          const cs = db.createObjectStore(STORE_CONVERSATIONS, {
            keyPath: "id",
          });
          cs.createIndex("updatedAt", "updatedAt");
        }
        if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
          const ms = db.createObjectStore(STORE_MESSAGES, {
            keyPath: "id",
          });
          ms.createIndex("conversationId", "conversationId");
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function promisify(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function makeStore(name) {
    let dbPromise = null;
    const getDb = () => {
      if (!dbPromise) dbPromise = openDb(name);
      return dbPromise;
    };

    async function withTx(stores, mode, fn) {
      const db = await getDb();
      const t = db.transaction(stores, mode);
      try {
        return await fn(t);
      } catch (err) {
        // Best-effort: a rejected tx is already auto-aborted,
        // but log so failures aren't silent in the wild.
        console.warn("store tx failed:", err);
        throw err;
      }
    }

    function uuid() {
      // crypto.randomUUID is available in modern browsers
      // and modern Node; fall back to a timestamp-based id
      // for old runtimes (Safari < 15.4, test sandboxes).
      if (global.crypto?.randomUUID) return global.crypto.randomUUID();
      return \`id-\${Date.now()}-\${Math.random().toString(36).slice(2, 10)}\`;
    }

    const isIDBAvailable = () => typeof global.indexedDB !== "undefined";

    return {
      isAvailable: isIDBAvailable,

      async listConversations() {
        if (!isIDBAvailable()) return [];
        try {
          return await withTx(
            [STORE_CONVERSATIONS],
            "readonly",
            async (t) => {
              const store = t.objectStore(STORE_CONVERSATIONS);
              const idx = store.index("updatedAt");
              const out = [];
              await new Promise((resolve, reject) => {
                const req = idx.openCursor(null, "prev");
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
              return out;
            },
          );
        } catch (err) {
          console.warn("listConversations failed:", err);
          return [];
        }
      },

      async createConversation(title) {
        const id = uuid();
        const now = Date.now();
        const conv = {
          id,
          title: title || "New chat",
          createdAt: now,
          updatedAt: now,
        };
        if (!isIDBAvailable()) return conv;
        await withTx([STORE_CONVERSATIONS], "readwrite", (t) =>
          promisify(t.objectStore(STORE_CONVERSATIONS).add(conv)),
        );
        return conv;
      },

      async getConversation(id) {
        if (!isIDBAvailable()) return null;
        return withTx([STORE_CONVERSATIONS], "readonly", (t) =>
          promisify(t.objectStore(STORE_CONVERSATIONS).get(id)),
        );
      },

      async updateConversation(id, patch) {
        if (!isIDBAvailable()) return null;
        return withTx([STORE_CONVERSATIONS], "readwrite", async (t) => {
          const conv = await promisify(
            t.objectStore(STORE_CONVERSATIONS).get(id),
          );
          if (!conv) return null;
          Object.assign(conv, patch, { updatedAt: Date.now() });
          await promisify(t.objectStore(STORE_CONVERSATIONS).put(conv));
          return conv;
        });
      },

      async deleteConversation(id) {
        if (!isIDBAvailable()) return;
        await withTx(
          [STORE_CONVERSATIONS, STORE_MESSAGES],
          "readwrite",
          async (t) => {
            await promisify(
              t.objectStore(STORE_CONVERSATIONS).delete(id),
            );
            const idx = t.objectStore(STORE_MESSAGES).index(
              "conversationId",
            );
            await new Promise((resolve, reject) => {
              const req = idx.openCursor(IDBKeyRange.only(id));
              req.onsuccess = () => {
                const cur = req.result;
                if (cur) {
                  cur.delete();
                  cur.continue();
                } else {
                  resolve();
                }
              };
              req.onerror = () => reject(req.error);
            });
          },
        );
      },

      async addMessage(conversationId, message) {
        const id = message.id || uuid();
        const msg = {
          ...message,
          id,
          conversationId,
          ts: message.ts || Date.now(),
        };
        if (!isIDBAvailable()) return msg;
        await withTx(
          [STORE_MESSAGES, STORE_CONVERSATIONS],
          "readwrite",
          async (t) => {
            await promisify(t.objectStore(STORE_MESSAGES).add(msg));
            // Bump the conversation's updatedAt so the
            // sidebar list re-sorts this conversation to the
            // top. We do this in the same tx so a half-written
            // state is impossible.
            const conv = await promisify(
              t.objectStore(STORE_CONVERSATIONS).get(conversationId),
            );
            if (conv) {
              conv.updatedAt = Date.now();
              await promisify(
                t.objectStore(STORE_CONVERSATIONS).put(conv),
              );
            }
          },
        );
        return msg;
      },

      async getMessages(conversationId) {
        if (!isIDBAvailable()) return [];
        return withTx([STORE_MESSAGES], "readonly", async (t) => {
          const idx = t.objectStore(STORE_MESSAGES).index(
            "conversationId",
          );
          const out = [];
          await new Promise((resolve, reject) => {
            const req = idx.openCursor(IDBKeyRange.only(conversationId));
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
          out.sort((a, b) => a.ts - b.ts);
          return out;
        });
      },
    };
  }

  const api = {
    createStore: makeStore,
    store: makeStore("edgewell"),
  };
  global.EdgeWellStore = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
`,
  "style.css": `/* EdgeWell companion web UI — v3.1.0 (Production Overhaul)
 * Clean CSS design system featuring:
 * - Fluid mobile-first viewport-locking layout (no body scroll on mobile)
 * - Backdrop-filter glassmorphism effects
 * - Custom Google Fonts integration (Outfit & Plus Jakarta Sans)
 * - Beautiful gradient user bubbles & custom agent highlight tracks
 * - Soft shadows, smooth active interactions, and focus glow rings
 */

:root {
  /* UI Radii */
  --radius-lg: 16px;
  --radius-md: 12px;
  --radius-sm: 8px;
  --radius-xs: 4px;

  /* Typography */
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-display: 'Outfit', var(--font-sans);
  --font-mono: "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;

  /* Layout dimensions */
  --topbar-h: 60px;
  --tabbar-h: 60px;
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-top: env(safe-area-inset-top, 0px);

  /* Transitions */
  --tr-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --tr-normal: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

body.standalone-mode {
  --safe-top: max(env(safe-area-inset-top, 0px), 32px);
}

/* Dark Theme Design System (Default) */
:root,
[data-theme="dark"] {
  --bg: #090a0f;
  --bg-2: #10121a;
  --panel: #161822;
  --panel-2: #1e2230;
  --text: #f8fafc;
  --text-secondary: #cbd5e1;
  --muted: #64748b;

  /* Primary Accent & Gradient */
  --accent: #38bdf8;
  --accent-2: #0284c7;
  --accent-gradient: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #0284c7 100%);
  --accent-light: rgba(56, 189, 248, 0.08);

  /* Semantic borders & backgrounds */
  --border: rgba(255, 255, 255, 0.06);
  --border-hover: rgba(255, 255, 255, 0.12);
  --border-2: rgba(255, 255, 255, 0.1);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.15);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.5);

  /* Glassmorphism */
  --glass-bg: rgba(16, 18, 26, 0.75);
  --glass-border: rgba(255, 255, 255, 0.08);

  /* System States */
  --good: #4ade80;
  --good-bg: rgba(74, 222, 128, 0.1);
  --warn: #fbbf24;
  --warn-bg: rgba(251, 191, 36, 0.1);
  --bad: #f87171;
  --bad-bg: rgba(248, 113, 113, 0.1);

  /* Agent Accent Tracks */
  --health: #3b82f6;
  --finance: #eab308;
  --lifestyle: #a855f7;
  --local: #4ade80;
  --peer: #38bdf8;
}

/* Light Theme Design System Override */
[data-theme="light"] {
  --bg: #f8fafc;
  --bg-2: #f1f5f9;
  --panel: #ffffff;
  --panel-2: #f8fafc;
  --text: #0f172a;
  --text-secondary: #334155;
  --muted: #64748b;

  /* Primary Accent & Gradient */
  --accent: #0284c7;
  --accent-2: #0369a1;
  --accent-gradient: linear-gradient(135deg, #0ea5e9 0%, #0284c7 60%, #0369a1 100%);
  --accent-light: rgba(2, 132, 199, 0.08);

  /* Semantic borders & backgrounds */
  --border: rgba(15, 23, 42, 0.08);
  --border-hover: rgba(15, 23, 42, 0.15);
  --border-2: rgba(15, 23, 42, 0.12);
  --shadow-sm: 0 2px 8px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 8px 24px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 16px 40px rgba(15, 23, 42, 0.15);

  /* Glassmorphism */
  --glass-bg: rgba(255, 255, 255, 0.85);
  --glass-border: rgba(15, 23, 42, 0.08);

  /* System States */
  --good: #16a34a;
  --good-bg: rgba(22, 163, 74, 0.08);
  --warn: #d97706;
  --warn-bg: rgba(217, 119, 6, 0.08);
  --bad: #dc2626;
  --bad-bg: rgba(220, 38, 38, 0.08);

  /* Agent Accent Tracks */
  --health: #2563eb;
  --finance: #b45309;
  --lifestyle: #7e22ce;
  --local: #16a34a;
  --peer: #0284c7;
}

/* ------------------------------- CORE & BASICS ------------------------------- */

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  padding: 0;
  background: var(--bg);
}

.phone-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  padding-top: calc(var(--topbar-h) + var(--safe-top));
  padding-bottom: calc(var(--tabbar-h) + var(--safe-bottom));
  position: relative;
  background: var(--bg);
}

a {
  color: var(--accent);
  text-decoration: none;
  transition: color var(--tr-fast);
}
a:hover {
  color: var(--accent-2);
}

code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  padding: 0.1rem 0.3rem;
  color: var(--accent);
}

/* Scrollbar customization for desktop */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--border-2);
  border-radius: 99px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--muted);
}

.muted {
  color: var(--muted);
}

.small {
  font-size: 0.85rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.skip {
  position: absolute;
  top: -60px;
  left: 16px;
  background: var(--accent-gradient);
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 100;
  font-weight: 600;
  transition: top var(--tr-fast);
}
.skip:focus {
  top: 16px;
}

/* ------------------------------- TOPBAR ------------------------------- */

.topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: calc(var(--topbar-h) + var(--safe-top));
  padding-top: var(--safe-top);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--glass-border);
  z-index: 30;
  box-shadow: var(--shadow-sm);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}
.brand .logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 2px 8px rgba(56, 189, 248, 0.25));
}
.brand h1 {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 700;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.2px;
}
.tagline {
  margin-top: 0.05rem;
  font-size: 0.72rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
#status {
  padding: 10px 15px 10px 0;
  margin: -10px -15px -10px 0;
  cursor: pointer;
  z-index: 5;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ------------------------------- STATUS / P2P DOT ------------------------------ */

.p2p {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  background: var(--panel-2);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  user-select: none;
  transition: border-color var(--tr-fast), background var(--tr-fast);
}
.p2p:hover {
  border-color: var(--border-hover);
}
.p2p .dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--local);
  box-shadow: 0 0 8px var(--local);
}
.p2p--peer .dot {
  background: var(--peer);
  box-shadow: 0 0 8px var(--peer);
}
.p2p--fallback .dot {
  background: var(--warn);
  box-shadow: 0 0 8px var(--warn);
}
.p2p--down .dot {
  background: var(--bad);
  box-shadow: 0 0 8px var(--bad);
}
.p2p--pending .dot {
  background: var(--muted);
  box-shadow: none;
}

#status .dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--muted);
}
#status .dot--ok {
  background: var(--good);
  box-shadow: 0 0 6px var(--good);
}
#status .dot--bad {
  background: var(--bad);
  box-shadow: 0 0 6px var(--bad);
}
#status .dot--pending {
  background: var(--muted);
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
}

/* -------------------------------- BUTTONS ----------------------------- */

.btn {
  background: var(--panel-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.5rem 0.85rem;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  box-shadow: var(--shadow-sm);
  transition: transform 0.1s ease, background var(--tr-fast), border-color var(--tr-fast), box-shadow var(--tr-fast);
}
.btn:hover {
  background: var(--panel);
  border-color: var(--border-hover);
  box-shadow: var(--shadow-md);
}
.btn:active {
  transform: scale(0.97);
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
.btn--primary {
  background: var(--accent-gradient);
  color: #ffffff;
  border: none;
  font-weight: 700;
}
.btn--primary:hover {
  filter: brightness(1.08);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.25);
}
.btn--ghost {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}
.btn--ghost:hover {
  background: var(--panel-2);
  border-color: var(--border);
}

/* -------------------------------- LAYOUT ------------------------------ */

.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  padding: 0.5rem;
  flex: 1;
  min-height: 0;
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  height: 100%;
}

.panel {
  position: relative;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: border-color var(--tr-normal), box-shadow var(--tr-normal);
}
.panel:hover {
  box-shadow: var(--shadow-md);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.panel-head h2 {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.1px;
}

/* Panel visibility by active tab */
body[data-tab="chat"] .panel--left,
body[data-tab="chat"] .panel--right {
  display: none;
}
body[data-tab="journal"] .panel--center,
body[data-tab="journal"] .panel--right {
  display: none;
}
body[data-tab="expenses"] .panel--left,
body[data-tab="expenses"] .panel--center {
  display: none;
}

/* -------------------------------- FORMS ------------------------------- */

.form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.form input[type="text"],
.form input[type="number"],
.form textarea {
  background: var(--bg-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.65rem 0.85rem;
  font-family: var(--font-sans);
  font-size: 0.92rem;
  width: 100%;
  transition: border-color var(--tr-fast), box-shadow var(--tr-fast), background var(--tr-fast);
}
.form input:focus,
.form textarea:focus {
  outline: none;
  background: var(--panel);
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}
.form textarea {
  resize: none;
  min-height: 70px;
}
.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
.form--inline {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
.form--inline input {
  grid-column: span 1;
}
.form--inline #expense-note {
  grid-column: span 2;
}
.form--inline .form-actions {
  grid-column: span 2;
}

.form--chat {
  flex-direction: row;
  gap: 0.5rem;
  align-items: stretch;
  margin-top: 0.5rem;
}
.form--chat input {
  flex: 1;
  height: 42px;
  padding: 0 1.25rem;
  border-radius: 99px;
}
.form--chat .btn {
  border-radius: 99px;
  padding: 0 1.25rem;
}
.form--chat #send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}
.form--chat #send-btn .send-icon {
  font-size: 0.8rem;
  line-height: 1;
  margin-bottom: 0.05rem;
}

/* -------------------------------- CHIPS & TAGS ------------------------------- */

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.78rem;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  background: var(--bg-2);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--tr-fast), border-color var(--tr-fast), transform 0.1s ease;
}
.chip:hover {
  background: var(--panel-2);
  border-color: var(--accent);
}
.chip:active {
  transform: scale(0.96);
}
.chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.quick-prompts {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  padding: 0.35rem 0;
  margin: 0.25rem 0;
  scrollbar-width: none;
}
.quick-prompts::-webkit-scrollbar {
  display: none;
}

/* Agent Chips */
.chip--agent {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border: 1px solid currentColor;
  background: transparent;
  cursor: default;
}
.chip--agent::before {
  content: "●";
  font-size: 0.6em;
}
.chip--health {
  color: var(--health);
}
.chip--finance {
  color: var(--finance);
}
.chip--lifestyle {
  color: var(--lifestyle);
}

/* ------------------------------- MESSAGES ----------------------------- */

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
}
.message {
  max-width: 85%;
  padding: 0.75rem 1rem;
  border-radius: 18px;
  font-size: 0.95rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-wrap: break-word;
  position: relative;
  box-shadow: var(--shadow-sm);
  animation: fadeInUp 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.message .meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
  font-size: 0.7rem;
  color: var(--muted);
}
.message.user {
  background: var(--accent-gradient);
  color: #ffffff;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}
.message.user .meta {
  color: rgba(255, 255, 255, 0.75);
}
.message.user code,
.message.user .md-code-inline {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.2);
}
.message.user .md-link {
  color: #ffffff;
  text-decoration: underline;
  text-decoration-color: rgba(255, 255, 255, 0.5);
}
.message.user .md-link:hover {
  text-decoration-color: #ffffff;
}
.message.user .md-quote {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.95);
  border-left-color: #ffffff;
}
.message.user .md-pre {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.1);
}
.message.user .md-pre .md-code {
  color: #ffffff;
}
.message.user .md-table-container {
  border-color: rgba(255, 255, 255, 0.15);
}
.message.user .md-table th {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}
.message.user .md-table th,
.message.user .md-table td {
  border-color: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}
.message.user .md-table tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.05);
}
.message.assistant {
  background: var(--bg-2);
  border: 1px solid var(--border);
  color: var(--text);
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}
.message.assistant.msg-agent-health {
  border-left: 4px solid var(--health);
}
.message.assistant.msg-agent-finance {
  border-left: 4px solid var(--finance);
}
.message.assistant.msg-agent-lifestyle {
  border-left: 4px solid var(--lifestyle);
}
.message.error {
  background: var(--bad-bg);
  border: 1px solid var(--bad);
  color: var(--bad);
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}
.message .cursor {
  display: inline-block;
  width: 6px;
  height: 1.1em;
  background: var(--accent);
  vertical-align: text-bottom;
  margin-left: 2px;
  animation: blink 1s steps(2) infinite;
}
@keyframes blink {
  50% { opacity: 0; }
}

.copy-btn {
  background: transparent;
  border: 0;
  padding: 0.15rem 0.3rem;
  margin-left: auto;
  font-size: 0.8rem;
  line-height: 1;
  color: var(--muted);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--tr-fast), color var(--tr-fast), transform 0.1s ease;
  border-radius: var(--radius-xs);
}
.message:hover .copy-btn,
.copy-btn:focus-visible {
  opacity: 1;
}
.copy-btn:hover {
  color: var(--accent);
  background: var(--panel-2);
}
.copy-btn:active {
  transform: scale(0.9);
}
.copy-btn.copied {
  color: var(--good);
  opacity: 1;
}

/* Markdown typography inside assistant messages */
.md-p {
  margin-bottom: 0.5rem;
}
.md-p:last-child {
  margin-bottom: 0;
}
.md-h {
  margin: 0.75rem 0 0.35rem 0;
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--text);
  line-height: 1.25;
}
.md-h1 { font-size: 1.15em; color: var(--accent); }
.md-h2 { font-size: 1.08em; color: var(--accent); }
.md-h3, .md-h4, .md-h5, .md-h6 { font-size: 1.02em; }
.md-code-inline {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  padding: 0.05rem 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.85em;
  color: var(--accent);
}
.md-pre {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.65rem 0.85rem;
  margin: 0.5rem 0;
  overflow-x: auto;
  position: relative;
}
.md-pre .md-code {
  font-family: var(--font-mono);
  font-size: 0.82em;
  color: var(--text-secondary);
  background: transparent;
  border: 0;
  padding: 0;
  display: block;
}
.md-pre::before {
  content: attr(data-lang);
  position: absolute;
  top: 0.35rem;
  right: 0.6rem;
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
}
.md-table-container {
  overflow-x: auto;
  margin: 0.65rem 0;
  width: 100%;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}
.md-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85em;
  line-height: 1.4;
}
.md-table th,
.md-table td {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
}
.md-table th {
  background: var(--bg-2);
  font-weight: 700;
  color: var(--text);
}
.md-table td {
  color: var(--text-secondary);
}
.md-table tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.02);
}
.md-ul,
.md-ol {
  margin: 0.35rem 0 0.5rem 0;
  padding-left: 1.25rem;
}
.md-li {
  margin-bottom: 0.15rem;
}
.md-link {
  color: var(--accent);
  text-decoration: underline;
  text-decoration-color: var(--accent-light);
  text-underline-offset: 3px;
}
.md-link:hover {
  color: var(--accent-2);
}
.md-quote {
  margin: 0.5rem 0;
  padding: 0.35rem 0.85rem;
  border-left: 3px solid var(--accent);
  background: var(--bg);
  color: var(--text-secondary);
  font-style: italic;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
.md-hr {
  border: 0;
  border-top: 1px solid var(--border);
  margin: 0.75rem 0;
}

.citations {
  margin-top: 0.6rem;
  font-size: 0.75rem;
  color: var(--muted);
  border-top: 1px dashed var(--border-2);
  padding-top: 0.5rem;
}
.citations summary {
  cursor: pointer;
  user-select: none;
  list-style: none;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 600;
}
.citations summary::before {
  content: "📎";
}
.citations summary::-webkit-details-marker {
  display: none;
}
.citations ol {
  margin: 0.35rem 0 0;
  padding-left: 1.1rem;
}
.citations li {
  margin-bottom: 0.25rem;
}
.citations .src {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 0.8em;
}

/* ----------------------------- LISTS (JOURNAL & EXPENSES) --------------------------- */

.journal-list,
.expense-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  min-height: 0;
  flex: 1;
}
.journal-list li,
.expense-list li {
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.75rem 0.95rem;
  font-size: 0.9rem;
  box-shadow: var(--shadow-sm);
  transition: transform var(--tr-fast), border-color var(--tr-fast);
}
.journal-list li:hover,
.expense-list li:hover {
  border-color: var(--border-hover);
  transform: translateY(-1px);
}
.journal-text {
  font-size: 0.92rem;
  color: var(--text);
  margin-bottom: 0.4rem;
}
.journal-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.25rem;
}
.time-stamp {
  font-size: 0.72rem;
  color: var(--muted);
  font-weight: 500;
}
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.tag-pill {
  font-size: 0.68rem;
  font-weight: 600;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--muted);
  padding: 0.05rem 0.4rem;
  border-radius: 99px;
  transition: border-color var(--tr-fast), color var(--tr-fast);
}
.tag-pill:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.empty {
  color: var(--muted);
  font-size: 0.88rem;
  padding: 2rem 1.5rem;
  text-align: center;
  border: 1px dashed var(--border-2);
  border-radius: var(--radius-md);
  background: var(--bg-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-style: normal;
  box-shadow: var(--shadow-sm);
  width: 100%;
}
#journal-list .empty::before {
  content: "📓";
  font-size: 1.5rem;
  display: block;
  opacity: 0.7;
}
#expense-list .empty::before {
  content: "🧾";
  font-size: 1.5rem;
  display: block;
  opacity: 0.7;
}
#conversation-list .empty::before {
  content: "💬";
  font-size: 1.5rem;
  display: block;
  opacity: 0.7;
}


/* Empty chat state */
.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: auto 0;
  padding: 2.5rem 1.5rem;
  text-align: center;
}
.chat-empty-icon {
  font-size: 2.8rem;
  filter: drop-shadow(0 4px 10px rgba(56, 189, 248, 0.15));
  margin-bottom: 0.25rem;
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.chat-empty-title {
  font-family: var(--font-display);
  color: var(--text);
  font-weight: 700;
  font-size: 1.05rem;
}
.chat-empty-sub {
  color: var(--muted);
  font-size: 0.88rem;
  max-width: 28ch;
  line-height: 1.45;
}

/* ----------------------------- EXPENSE CHART -------------------------- */

.chart {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 72px;
  margin: 0.65rem 0;
  padding: 0.4rem 0.5rem;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.chart-bar {
  flex: 1;
  background: var(--accent-gradient);
  border-radius: 3px 3px 0 0;
  min-height: 2px;
  position: relative;
  cursor: pointer;
  transition: opacity var(--tr-fast), transform var(--tr-fast);
}
.chart-bar:hover {
  opacity: 0.85;
  transform: scaleY(1.03);
}
.chart-bar[data-empty="true"] {
  background: var(--border);
  min-height: 2px;
  height: 2px !important;
  align-self: flex-end;
  transform: none;
  cursor: default;
}
.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  margin: -0.15rem 0.4rem 0.35rem;
}

.expense-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}
.expense-list .amt {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--accent);
}
.expense-list .cat {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--bg);
  border: 1px solid var(--border);
  padding: 0.05rem 0.4rem;
  border-radius: 99px;
}
.expense-list .note {
  font-size: 0.85rem;
  color: var(--text-secondary);
  background: var(--bg);
  border-left: 3px solid var(--accent);
  padding: 0.3rem 0.6rem;
  margin: 0.35rem 0;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
.expense-list .when {
  display: block;
  color: var(--muted);
  font-size: 0.72rem;
  margin-top: 0.3rem;
}

/* -------------------------------- TAB BAR (MOBILE) ----------------------------- */

.tabbar {
  display: flex;
  position: fixed;
  left: 0;
  right: 0;
  width: 100%;
  bottom: 0;
  height: calc(var(--tabbar-h) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--glass-border);
  border-left: 1px solid var(--glass-border);
  border-right: 1px solid var(--glass-border);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  z-index: 30;
  justify-content: space-around;
  align-items: stretch;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
}
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  background: transparent;
  border: 0;
  color: var(--muted);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.72rem;
  cursor: pointer;
  transition: color var(--tr-fast), transform 0.1s ease;
}
.tab:active {
  transform: scale(0.95);
}
.tab[aria-selected="true"] {
  color: var(--accent);
}
.tab span:first-child {
  font-size: 1.35rem;
}

/* -------------------------------- TOAST ------------------------------- */

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(var(--tabbar-h) + 1.25rem + var(--safe-bottom));
  transform: translateX(-50%) translateY(8px);
  background: var(--panel-2);
  color: var(--text);
  border: 1px solid var(--border-2);
  border-radius: var(--radius-md);
  padding: 0.65rem 1.2rem;
  box-shadow: var(--shadow-lg);
  font-size: 0.88rem;
  font-weight: 600;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1), transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 40;
  max-width: 90vw;
}
.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
.toast--good {
  border-color: var(--good);
  background: rgba(22, 24, 34, 0.9);
}
.toast--bad {
  border-color: var(--bad);
  background: rgba(22, 24, 34, 0.9);
}

/* ---------------------- CONVERSATION SIDEBAR ------------------ */

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 290px;
  max-width: 85vw;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid var(--glass-border);
  z-index: 50;
  display: flex;
  flex-direction: column;
  padding: calc(1rem + var(--safe-top)) 1rem 1rem 1rem;
  gap: 0.75rem;
  transform: translateX(-100%);
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-lg);
}
.sidebar.open {
  transform: translateX(0);
}
.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.15rem;
  margin-bottom: 0.25rem;
}
.sidebar-head h3 {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
}
.sidebar-head .btn {
  font-size: 1.25rem;
  line-height: 1;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
}
#new-chat-btn {
  width: 100%;
  padding: 0.65rem;
}
.conversation-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}
.conversation-item {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem 0.65rem 1.05rem;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: background var(--tr-fast), border-color var(--tr-fast);
}
.conversation-item:hover {
  background: var(--panel);
  border-color: var(--border-hover);
}
.conversation-item.active {
  border-color: var(--accent);
  background: var(--accent-light);
}
.conversation-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--accent-gradient);
}
.conversation-item .title {
  font-size: 0.86rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}
.conversation-item .meta {
  font-size: 0.72rem;
  color: var(--muted);
  margin-top: 0.15rem;
}
.conversation-item .delete-btn {
  background: transparent;
  border: 0;
  color: var(--muted);
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: var(--radius-sm);
  opacity: 0;
  transition: opacity var(--tr-fast), color var(--tr-fast), background var(--tr-fast);
}
.conversation-item:hover .delete-btn {
  opacity: 1;
}
.conversation-item .delete-btn:hover {
  color: var(--bad);
  background: var(--bad-bg);
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 40;
  opacity: 0;
  transition: opacity 0.22s ease;
  pointer-events: none;
}
.sidebar-backdrop.open {
  opacity: 1;
  pointer-events: auto;
}

/* ---------------------- SCREEN SIZE ADJUSTMENTS ------------------ */

@media (max-width: 600px) {
  .tabbar {
    max-width: 100%;
    border-left: none;
    border-right: none;
    border-radius: 0;
  }
  .layout {
    padding: 0.25rem;
  }
  .panel {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}

@media (max-width: 580px), (min-width: 601px) {
  /* Collapse button text inside header to conserve space */
  .topbar-actions .btn-text {
    display: none;
  }
  .topbar-actions .btn {
    padding: 0.5rem;
    aspect-ratio: 1;
  }
  .topbar-actions #sidebar-btn .btn-icon {
    font-size: 1.1rem;
  }

  /* Collapse P2P text to a circle status badge */
  #p2p-text {
    display: none;
  }
  .p2p {
    padding: 0.4rem;
    aspect-ratio: 1;
    border-radius: 50%;
  }

  /* Make send button a circle on mobile */
  .form--chat #send-btn {
    width: 42px;
    height: 42px;
    padding: 0;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .form--chat #send-btn .send-label {
    display: none;
  }
  .form--chat #send-btn .send-icon {
    font-size: 0.95rem;
    margin: 0;
  }
}

@media (max-width: 480px), (min-width: 601px) {
  /* Collapse tagline / status-text */
  .brand-text #status-text {
    display: none;
  }
}

@media (min-width: 601px) {
  :root {
    --safe-bottom: 24px;
    --safe-top: 24px;
  }

  body {
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at center, var(--bg-2) 0%, var(--bg) 100%);
    padding: 0;
  }

  .phone-container {
    max-width: 412px;
    height: 844px;
    max-height: 92dvh;
    aspect-ratio: 9 / 19.5;
    border: 12px solid #1c1e2a; /* bezel */
    border-radius: 40px;
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(255, 255, 255, 0.05),
      inset 0 0 0 2px rgba(255, 255, 255, 0.1);
    transform: translate3d(0, 0, 0); /* containing block for position: fixed */
    margin: auto;
  }

  /* Notch / Dynamic Island */
  .phone-container::before {
    content: "";
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    width: 110px;
    height: 28px;
    background: #000000;
    border-radius: 20px;
    z-index: 100;
    pointer-events: none;
    box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.2);
  }

  /* Camera lens dot inside dynamic island */
  .phone-container::after {
    content: "";
    position: absolute;
    top: 18px;
    left: calc(50% + 35px);
    width: 12px;
    height: 12px;
    background: #111122;
    border-radius: 50%;
    z-index: 101;
    pointer-events: none;
    box-shadow: inset 0 0 3px #000;
    opacity: 0.8;
  }

  /* Mock Home Indicator bar at the bottom of the tabbar on desktop */
  .tabbar::after {
    content: "";
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 5px;
    background: var(--text);
    opacity: 0.25;
    border-radius: 10px;
    pointer-events: none;
  }
}

/* Theme smooth transitions */
html.theme-transition,
html.theme-transition *,
html.theme-transition *:before,
html.theme-transition *:after {
  transition: background var(--tr-normal) !important,
              background-color var(--tr-normal) !important,
              color var(--tr-normal) !important,
              border-color var(--tr-normal) !important,
              box-shadow var(--tr-normal) !important;
  transition-delay: 0s !important;
}

/* Floating Scroll-to-Bottom Button */
.scroll-bottom-btn {
  position: absolute;
  bottom: 72px;
  right: 1.5rem;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--panel-2);
  color: var(--text);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  z-index: 20;
  font-size: 1.1rem;
  font-weight: bold;
  transition: opacity var(--tr-fast), transform var(--tr-fast), background var(--tr-fast);
  opacity: 0.9;
}
.scroll-bottom-btn:hover {
  background: var(--panel);
  opacity: 1;
  transform: translateY(-2px);
  border-color: var(--accent);
}
.scroll-bottom-btn:active {
  transform: translateY(0);
}
.scroll-bottom-btn[hidden] {
  display: none !important;
}
`,
  "sw.js": `// EdgeWell service worker. v3.2.0-demo.
//
// Caches the static shell and, when the app is running inside the
// Android APK, intercepts requests to \`http://localhost:8787/*\` and
// serves them from the in-browser fake companion server. That gives
// a zero-setup demo where the WebView thinks it is talking to the
// companion Node.js server, but everything is local.
//
// Bump CACHE_NAME on every release so older cached shells are
// evicted in a single \`activate\` pass.

const CACHE_NAME = "edgewell-shell-v3.2.0-expo";
const SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./style.css",
  "./manifest.webmanifest",
  "./icon.svg",
  "./markdown.js",
  "./store.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // addAll is atomic: if any URL 404s the install fails.
      // Use individual put()s so a missing optional file does
      // not brick the whole worker.
      await Promise.all(
        SHELL.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "no-cache" });
            if (res.ok) await cache.put(url, res.clone());
          } catch {
            // ignore — partial shell is better than no install
          }
        }),
      );
      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Never cache API calls or mutations.
  if (req.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/chat") ||
      url.pathname.startsWith("/journal") ||
      url.pathname.startsWith("/expenses") ||
      url.pathname.startsWith("/profile") ||
      url.pathname.startsWith("/health")) {
    return; // let the page handle auth + errors
  }

  // Cache-first for shell assets, network-first for everything
  // else on the same origin (so dev-mode edits are picked up).
  event.respondWith(
    (async () => {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
      try {
        const res = await fetch(req);
        return res;
      } catch {
        // Last-ditch SPA fallback: if the user is offline and
        // navigates to an unknown path, serve the cached shell
        // so they at least see the page chrome.
        if (req.mode === "navigate") {
          const shell = await caches.match("./index.html");
          if (shell) return shell;
        }
        return new Response("offline", { status: 503, statusText: "offline" });
      }
    })(),
  );
});
`,
};