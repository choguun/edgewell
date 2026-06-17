// EdgeWell companion web UI. Talks to the local companion HTTP
// server. The token is optional — when the server is started with
// `--no-auth` the client simply omits the Authorization header.

const SERVER = (() => {
  // Allow override via ?server=http://host:port for testing.
  const params = new URLSearchParams(location.search);
  return params.get("server") ?? `http://${location.hostname}:8787`;
})();
function getToken() {
  return localStorage.getItem("edgewell.token") ?? "";
}
function setToken(t) {
  if (t) localStorage.setItem("edgewell.token", t);
  else localStorage.removeItem("edgewell.token");
}

// Detect 401 from the server and prompt the user to paste a
// bearer token. The token can be generated with:
//   edgewell companion --print-token
// or
//   edgewell token my-phone
// (using the same secret the companion was started with).
function promptForToken(reason) {
  const hint = reason === "missing"
    ? "Server requires a bearer token. Mint one with:\n  edgewell companion --print-token\n  edgewell token my-phone\n\nPaste it here:"
    : "Server rejected the token (" + reason + "). Paste a new one:";
  const t = prompt(hint, "");
  if (t && t.trim()) {
    setToken(t.trim());
    return true;
  }
  return false;
}

const els = {
  status: document.getElementById("status"),
  messages: document.getElementById("messages"),
  chatForm: document.getElementById("chat-form"),
  chatInput: document.getElementById("chat-input"),
  journalForm: document.getElementById("journal-form"),
  journalText: document.getElementById("journal-text"),
  journalTags: document.getElementById("journal-tags"),
  journalList: document.getElementById("journal-list"),
};

function headers() {
  const h = { "content-type": "application/json" };
  const tok = getToken();
  if (tok) h.authorization = `Bearer ${tok}`;
  return h;
}

async function api(path, init = {}) {
  const res = await fetch(`${SERVER}${path}`, { ...init, headers: { ...headers(), ...(init.headers ?? {}) } });
  if (res.status === 401) {
    // Token missing or rejected. Ask the user once and retry.
    const body = await res.text().catch(() => "");
    let reason = "missing";
    try {
      const j = JSON.parse(body);
      if (typeof j?.error === "string") reason = j.error;
    } catch {}
    if (promptForToken(reason)) {
      // Retry the request once with the new token.
      return api(path, init);
    }
    const err = new Error(`HTTP 401: ${body}`);
    err.status = 401;
    err.body = body;
    throw err;
  }
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${text}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = text;
  els.messages.appendChild(div);
  els.messages.scrollTop = els.messages.scrollHeight;
}

els.chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = els.chatInput.value.trim();
  if (!message) return;
  addMessage("user", message);
  els.chatInput.value = "";
  try {
    const r = await api("/chat", { method: "POST", body: JSON.stringify({ message }) });
    addMessage("assistant", r.reply ?? "(no reply)");
  } catch (err) {
    addMessage("assistant", `error: ${err.message}`);
  }
});

els.journalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = els.journalText.value.trim();
  if (!text) return;
  const tags = els.journalTags.value.split(",").map((t) => t.trim()).filter(Boolean);
  try {
    await api("/journal", { method: "POST", body: JSON.stringify({ text, tags }) });
    els.journalText.value = "";
    els.journalTags.value = "";
    await loadJournal();
  } catch (err) {
    addMessage("assistant", `journal error: ${err.message}`);
  }
});

async function loadJournal() {
  try {
    const r = await api("/journal?limit=20");
    els.journalList.innerHTML = "";
    for (const entry of r.entries ?? []) {
      const li = document.createElement("li");
      li.textContent = entry.text;
      if (entry.tags?.length) {
        const span = document.createElement("span");
        span.className = "tags";
        span.textContent = entry.tags.map((t) => `#${t}`).join(" ");
        li.appendChild(span);
      }
      els.journalList.appendChild(li);
    }
  } catch (err) {
    els.status.textContent = `journal error: ${err.message}`;
  }
}

async function ping() {
  try {
    const r = await fetch(`${SERVER}/health`);
    if (r.ok) {
      const j = await r.json();
      els.status.textContent = `connected · v${j.version} · ${j.agents.length} agents`;
    } else if (r.status === 401) {
      els.status.textContent = "needs bearer token — click to set";
      els.status.style.cursor = "pointer";
      els.status.onclick = async () => {
        if (promptForToken("missing")) { await ping(); await loadJournal(); }
      };
    } else {
      els.status.textContent = `disconnected (HTTP ${r.status})`;
    }
  } catch (err) {
    els.status.textContent = `disconnected (${err.message})`;
  }
}

ping();
loadJournal();
