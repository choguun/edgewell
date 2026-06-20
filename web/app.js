// EdgeWell companion web UI — v3.1.0
// Talks to the local companion HTTP server. Streams chat via
// Server-Sent Events (POST + ReadableStream), surfaces the
// multi-agent router chip, source-citations from RAG, an
// expense panel with a tiny inline bar chart, and is
// installable as a PWA.
//
// Token is optional — when the server is started with
// `--no-auth` the client simply omits the Authorization header.

const SERVER = (() => {
  // Allow override via ?server=http://host:port for testing.
  const params = new URLSearchParams(location.search);
  return params.get("server") ?? `http://${location.hostname}:8787`;
})();

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
      ? "Server requires a bearer token. Mint one with:\n  edgewell companion --print-token\n  edgewell token my-phone\n\nPaste it here:"
      : `Server rejected the token (${reason}). Paste a new one:`;
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

// v3.0.2: iOS Safari never fires `beforeinstallprompt`, so the
// generic install button is useless there. Detect once at boot
// and swap it for an instructional toast on the first user
// gesture (so the prompt doesn't fire on page load).
const isIosSafari =
  /iPhone|iPad|iPod/.test(navigator.userAgent) &&
  !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
const isStandalone =
  window.matchMedia?.("(display-mode: standalone)").matches ||
  navigator.standalone === true;

/* ------------------------------- API CALL ----------------------------- */

function headers(extra = {}) {
  const h = { "content-type": "application/json", ...extra };
  const tok = getToken();
  if (tok) h.authorization = `Bearer ${tok}`;
  return h;
}

async function api(path, init = {}) {
  const res = await fetch(`${SERVER}${path}`, {
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
    const err = new Error(`HTTP 401: ${body}`);
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
    const err = new Error(`HTTP ${res.status}: ${text}`);
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
 * boundary (`\n\n`). Yields each parsed event object.
 */
async function* streamChat(message) {
  const res = await fetch(`${SERVER}/chat/stream`, {
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
    throw new Error(`HTTP 401: ${body}`);
  }
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
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
    // complete frames and leave the partial tail in `buf`.
    while ((idx = buf.indexOf("\n\n")) >= 0) {
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
  for (const line of frame.split("\n")) {
    if (!line) continue;
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  if (dataLines.length === 0) return null;
  const payload = dataLines.join("\n");
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
  icon.textContent = "\u{1F4AC}"; // 💬
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
  // added later when the `route` event arrives, so we
  // expose a `meta` element the route handler can append
  // to. The copy button is always there and gets its
  // `copiedText` updated when streaming finishes (so the
  // user copies the final rendered text, not the
  // mid-stream plaintext with raw markdown).
  const div = document.createElement("div");
  div.className = `message ${role}`;
  if (agent) div.classList.add(`msg-agent-${agent}`);

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
    chip.className = `chip--agent chip--${agent}`;
    chip.textContent = agent;
    meta.insertBefore(chip, copyBtn);
  }

  const body = document.createElement("div");
  body.className = "body";
  // `complete: true` means the message is already finalized
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
 * for browsers that block `navigator.clipboard` (e.g. when
 * the page is served over plain HTTP on a non-localhost
 * origin). Returns a promise that resolves to `true` on
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
  sum.textContent = `${hits.length} source${hits.length === 1 ? "" : "s"}`;
  det.appendChild(sum);
  const ol = document.createElement("ol");
  for (const h of hits) {
    const li = document.createElement("li");
    // Build with DOM APIs (textContent / createElement) so a
    // journal entry containing `<script>` or `&` cannot
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
    score.textContent = `· ${h.score.toFixed(3)}`;
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

// v3.0.2: markdown rendering lives in `web/markdown.js` so
// it can be unit-tested without a DOM. The script tag in
// index.html loads it first and exposes it on `window`
// as `EdgeWellMarkdown`. We pull the renderer through the
// global so the rest of the file is one import.
function renderMarkdown(src) {
  const fn =
    (typeof window !== "undefined" && window.EdgeWellMarkdown?.renderMarkdown) ||
    null;
  if (fn) return fn(src);
  // Fallback: the very rare case where markdown.js failed
  // to load (e.g. the static handler 500'd). Just escape
  // the input so we never accidentally render raw HTML.
  return `<p class="md-p">${escapeHtml(String(src ?? ""))}</p>`;
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
  // `addMessage` now returns a record with the bubble div,
  // the body, and a `setCopiedText` so the copy button
  // picks up the final rendered text once the stream ends.
  const bubble = addMessage("assistant", "", null);
  const { div: bubbleDiv, body, setCopiedText } = bubble;
  let pendingCitations = null;
  let finalAgent = null;
  let buffer = "";
  let cursor = document.createElement("span");
  cursor.className = "cursor";
  body.appendChild(cursor);

  try {
    for await (const ev of streamChat(message)) {
      if (ev.type === "route") {
        finalAgent = ev.agent;
        bubbleDiv.classList.add(`msg-agent-${ev.agent}`);
        // Insert the agent chip into the pre-built meta row
        // (in front of the copy button).
        const meta = bubbleDiv.querySelector(".meta");
        if (meta) {
          const chip = document.createElement("span");
          chip.className = `chip--agent chip--${ev.agent}`;
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
        const textNode = document.createTextNode(buffer);
        body.appendChild(textNode);
        body.appendChild(cursor);
        if (autoScroll) els.messages.scrollTop = els.messages.scrollHeight;
      } else if (ev.type === "error") {
        if (cursor.parentElement) cursor.remove();
        const err = document.createElement("div");
        err.className = "message error";
        err.textContent = `error: ${ev.message}`;
        els.messages.appendChild(err);
      } else if (ev.type === "done") {
        if (cursor.parentElement) cursor.remove();
        // Render the final text as markdown. The plain
        // `textContent` is preserved on the copy button so
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
    errDiv.textContent = `stream error: ${err.message}`;
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
 * with the chat submit button. Both fire `submitChat` and we
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
    toast(`journal error: ${err.message}`, "bad");
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
        `<div class="journal-text">${escapeHtml(entry.text)}</div>` +
        `<div class="journal-meta">` +
        (ts
          ? `<span class="time-stamp">${escapeHtml(ts)}</span>`
          : "") +
        (entry.tags?.length
          ? `<span class="tags-list">${entry.tags
              .map((t) => `<span class="tag-pill">#${escapeHtml(t)}</span>`)
              .join("")}</span>`
          : "") +
        `</div>`;
      els.journalList.appendChild(li);
    }
    els.journalCount.textContent = `${entries.length} entr${
      entries.length === 1 ? "y" : "ies"
    }`;
  } catch (err) {
    toast(`journal error: ${err.message}`, "bad");
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
    toast(`expense error: ${err.message}`, "bad");
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
    els.expenseTotal.textContent = `this month ${monthTotal.toFixed(2)}`;
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
        `<div class="expense-row">` +
        `<span class="amt">${(Number(e.amount) || 0).toFixed(2)}</span>` +
        `<span class="cat">${escapeHtml(e.category || "other")}</span>` +
        `</div>` +
        (e.note
          ? `<div class="note">${escapeHtml(e.note)}</div>`
          : "") +
        (ts ? `<span class="when">${escapeHtml(ts)}</span>` : "");
      els.expenseList.appendChild(li);
    }
  } catch (err) {
    toast(`expense error: ${err.message}`, "bad");
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
      bar.style.height = `${pct}%`;
      bar.setAttribute("data-empty", "false");
    }
    bar.title = `${d.date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}: ${d.total.toFixed(2)}`;
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
    const r = await fetch(`${SERVER}/health`);
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
          p2pLabel = `peer · ${j.p2p.host.split(".").pop() || "?"}`;
        } else {
          p2pState = "fallback";
          p2pLabel = `peer ↓ → local`;
        }
      }
      setP2p(p2pState, p2pLabel);

      // One-line status: version, model, counts. Skips
      // duplication of info that lives in the P2P badge.
      const counts = j?.counts
        ? ` · ${j.counts.journal} journal · ${j.counts.expenses} expense${j.counts.expenses === 1 ? "" : "s"}`
        : "";
      const model = j?.model ? ` · ${j.model}` : "";
      els.status.textContent = `connected · v${j.version}${model}${counts}`;
      els.statusDot.className = "dot dot--ok";
      return j;
    }
    if (r.status === 401) {
      els.status.textContent = "needs bearer token — tap 🔑 to set";
      els.statusDot.className = "dot dot--bad";
      setP2p("down", "auth");
      return null;
    }
    els.status.textContent = `disconnected (HTTP ${r.status})`;
    els.statusDot.className = "dot dot--bad";
    setP2p("down", "down");
    return null;
  } catch (err) {
    // v3.0.2: differentiate "device offline" (no fetch) from
    // "server offline" (connection refused). navigator.onLine
    // is best-effort but useful for the user-visible label.
    const offline = navigator.onLine === false;
    els.status.textContent = offline
      ? `device offline`
      : `disconnected (${err.message})`;
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
    const res = await fetch(`http://${host}:${port}/health`, {
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
  els.p2p.className = `p2p p2p--${state}`;
  els.p2pText.textContent = label;
  els.p2p.title = `Routing: ${label}`;
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
  els.toast.className = `toast show ${kind ? `toast--${kind}` : ""}`.trim();
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
});
window.addEventListener("appinstalled", () => {
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
// which is `./` for the companion (e.g. /index.html, /sw.js)
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
  // `data-theme` on <html> drives the CSS variable swap.
  // The theme button icon flips between 🌙 (when in light
  // mode, meaning click-to-go-dark) and ☀️ (vice versa).
  document.documentElement.dataset.theme = theme;
  if (els.themeBtn) {
    els.themeBtn.textContent = theme === "light" ? "\u{1F319}" : "\u{2600}\uFE0F";
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

/* ---------------------- CONVERSATION PERSISTENCE ---------------------- */

function truncateTitle(s, max = 40) {
  const t = (s ?? "").trim().replace(/\s+/g, " ");
  if (t.length <= max) return t || "New chat";
  return t.slice(0, max - 1).trimEnd() + "\u2026";
}

function formatRelativeTime(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
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
    del.setAttribute("aria-label", `Delete ${conv.title || "conversation"}`);
    del.title = "Delete";
    del.textContent = "\u{1F5D1}\uFE0F";
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
  // we pass `complete: true` to skip the live token cursor
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
  if (!confirm(`Delete "${conv.title}"? This can't be undone.`)) return;
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
