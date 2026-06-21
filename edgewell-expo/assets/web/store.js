// v3.0.2: IndexedDB-backed conversation store for the
// EdgeWell web UI. Two object stores: `conversations`
// (one row per chat) and `messages` (one row per turn,
// indexed by conversationId for fast loading).
//
// Zero dependencies, dual-exported (window + module.exports)
// so the same file can be required from a Node test using
// `fake-indexeddb` and loaded as a <script> in the page.
//
// The store is wrapped in a `createStore(name)` factory so
// tests can create an isolated DB per test run without
// colliding with the production `edgewell` database.

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
      return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
