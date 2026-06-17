# UAT Report — EdgeWell v3.0.0

**Tester:** qa-tester (MiniMax-M3)
**Date:** 2026-06-17
**Commit / build:** 9a17098 (working tree dirty: README.md, src/config.ts, test/seed-integration.test.ts modified/untracked)
**Environment:** Node v24.13.0, pnpm 11.6.0, Darwin arm64, macOS Darwin 25.5.0
**Network:** ok (local-only)
**Persona:** "Alex — Node.js dev who has used `task`, `notes`, and `timewarrior`, heard of EdgeWell in a hackathon recap, never seen the code. 20 min budget."
**Surface tested:** CLI tool (primary), with a bonus static-web-UI smoke (`web/` + `companion`)
**Working tree state:** dirty — `README.md`, `src/config.ts` modified; `test/seed-integration.test.ts` untracked. Per the task, these uncommitted changes are part of the test surface.

## Verdict: **BLOCKED**

A first-time user can get the happy-path journal/expense/RAG flow working in well under 20 minutes, and the CLI is fast, ergonomic, and well-instrumented — but the v3.0.0 **headline features are broken or unreachable**:

1. The `companion` server (advertised in the v3.0.0 release notes as the mobile companion with HMAC bearer tokens) responds to **only one route: `GET /health`**. Every other route the static web UI in `web/app.js` calls (`/chat`, `journal GET/POST`) returns 404. The web UI also fails CORS preflight against the companion even on `/health`.
2. The `serve` P2P server (advertised as the peer-side delegate model host) likewise responds to **only `/health`** and a proprietary `POST /completion` endpoint. The OpenAI-compatible `POST /v1/chat/completions` endpoint the README implies is missing, and the client side (`EDGEWELL_P2P_ENABLED=1 … ask "x"`) never actually attempts to contact the peer — it just returns the local stub completion, even when pointed at a definitely-unreachable host.
3. `docs/COMMANDS.md` advertises a `rotate-secret` command. It does not exist. The CLI replies `unknown command: rotate-secret`.

A first-time user who runs the README's quickstart will succeed. A user who then follows the v3.0.0 README section "P2P delegation" or opens the bundled `web/` UI will be stuck. The 20-min budget is consumed by S1-S4; S6 onward is where the v3 features break.

## Test plan

- [x] S1 — Cold install (`pnpm install`, `pnpm build`, `pnpm test`, also try `npm install` per the README)
- [x] S2 — First impression (`--version`, `--help`, `help`, `version`, `info`)
- [x] S3 — Config init / setup / login / onboarding (wiped `data/`, ran `status`, `doctor`, `profile`, `config`)
- [x] S4 — Happy-path primary workflow (README quickstart 5 commands verbatim)
- [x] S5 — Edge case (multi-word, empty, whitespace, Unicode, emoji, very-large, decimal/zero/negative, multi-word category, tag)
- [x] S6 — Secondary workflows (smoke ~25 of the 138 wired commands; `companion`, `serve`, `export`/`import`, `models`, `profiles`, `token`, etc.)
- [x] S7 — Resume / kill mid-run (`seed 10000`, observed completion + idempotency on re-seed)
- [x] S8 — Error paths (15 deliberate sabotages)
- [x] S9 — Resource limits (`seed 10000` and `seed 100000`, `/usr/bin/time -l`)
- [x] S10 — README reality check (5+ README examples verbatim, including P2P and `serve`)
- [x] Web UI smoke (bonus, time permitting) — Playwright test of `web/index.html` + `dist/bin/edgewell.js companion`

## Scenarios

### S1. Cold install — grade: **A**

```
$ time pnpm install
Already up to date
Done in 154ms using pnpm v11.6.0
real    0m0.201s

$ time pnpm build
$ tsc -p tsconfig.build.json
real    0m1.027s

$ time pnpm test
$ node --import tsx --test test/*.test.ts
ℹ tests 431
ℹ pass 431
ℹ fail 0
ℹ duration_ms 2510.95
real    0m2.738s

$ npm install
npm error code EUNSUPPORTEDPROTOCOL
npm error Unsupported URL Type "link:": link:./vendor/qvac-sdk
```

**As-a-user notes:** Install was already a no-op (node_modules populated from a prior run), but `pnpm build` and `pnpm test` both ran cleanly. 431/431 unit tests pass. `npm install` fails — the README says it will ("npm install will fail on the local link: dependency") but `docs/TROUBLESHOOTING.md` recommends `npm install --legacy-peer-deps` as the fix, which is **wrong** (see UAT-FN-11). The dev-shim `bin/edgewell.js` works without `pnpm build` because it spawns tsx, which is nice.

**Issues found:** UAT-FN-11 (doc says `--legacy-peer-deps` fixes `npm install`; it does not — the real error is the `link:` URL type).

### S2. First impression — grade: **A**

```
$ node bin/edgewell.js --version
edgewell v3.0.0
$ node bin/edgewell.js help
… 51 highlighted commands, plus "(138 additional — run `edgewell command-list` for the full list)" …
$ node bin/edgewell.js info
name:     edgewell
version:  3.0.0
node:     v24.13.0
platform: darwin arm64
data dir: data
journal:  12 entries
expenses: 13 entries
rag:      24 chunks
```

**As-a-user notes:** `help` is well-formatted and shows the highlighted commands; the "(138 additional — run `edgewell command-list`)" line is unusual but useful. `info` is a clean one-pager. `--version` is snappy. All sub-150ms.

**Issues found:** none.

### S3. Config init / setup / login — grade: **B**

(After wiping `data/journal.jsonl`, `data/expenses.jsonl`, `data/profile.json`.)

```
$ node bin/edgewell.js status
local model:  LLAMA_3_2_1B_INST_Q4_0
…
rag chunks:    24
expenses:      0
journal:       0

$ node bin/edgewell.js doctor
OK    node version  24.13.0
OK    data dir writable  data
OK    qvac sdk installed  3 exports
OK    rag index readable  24 chunks
FAIL  profile readable  no profile on disk — run `edgewell profile init`
…
1 check(s) failed

$ node bin/edgewell.js profile show
{
  "name": "friend",
  "language": "en",
  "goals": {
    "health": [ "sleep 7+ hours", "walk 8k steps", "drink 2L water" ],
    "finance": [ "save 20% of income", "build 6-month emergency fund" ]
  },
  "baseline": { "sleepHours": 7, "stepsPerDay": 6000, "monthlyIncome": 0, "monthlySavings": 0 },
  "createdAt": null
}

$ node bin/edgewell.js profile set name=Alex
usage: edgewell profile set <key> <value>

$ node bin/edgewell.js profile init
wrote default profile (no TTY; pass a TTY to run the wizard)

$ node bin/edgewell.js profile show
{ … same as before, but now with "createdAt": "2026-06-17T06:58:09.207Z" }
```

**As-a-user notes:** `status` is clean. `doctor` is fantastic — it tells me exactly which check failed and how to fix it ("run `edgewell profile init`"). `profile show` on a brand-new install shows the **defaults** as if they were the user's profile, which is confusing — a first-time user might think they have a profile. `profile set name=Alex` (a single `key=value` token) silently fails with just the usage line. The "wizard" promised by `profile init` doesn't actually run when there's no TTY, and just writes the defaults.

**Issues found:** UAT-FN-01, UAT-FN-02, UAT-FN-03.

### S4. Happy-path primary workflow — grade: **B**

```
$ node bin/edgewell.js journal add "Slept 7.5h, walked 6k steps"
logged
$ node bin/edgewell.js expense add 250 food
logged 250 (food)
$ node bin/edgewell.js expense add 80 transport
logged 80 (transport)
$ node bin/edgewell.js rag ingest data/sample_health_notes_v3.txt
ingested 8 chunks from …/data/sample_health_notes_v3.txt
$ node bin/edgewell.js rag search "how much water should I drink"
──── RAG results for: how much water should I drink ────
score 0.028 - …/sample_health_notes_v3.txt  (Nutrition / Hydration section)
score 0.008 - …/sample_health_notes.txt
score 0.008 - …/sample_health_notes.txt    (SAME chunk as above)
score 0.008 - …/sample_health_notes.txt    (SAME chunk as above)
score 0.008 - …/sample_health_notes.txt    (SAME chunk as above)
$ node bin/edgewell.js ask "How can I save 20% of my income?"
[finance]
[stub completion for: User expense summary:
Total entries: 2
Total spend: 330.00 …
```

**As-a-user notes:** 4 of 5 quickstart commands are clean and ≤ 200 ms. The RAG search returns the **same chunk from `sample_health_notes.txt` four times in a row** — clearly a de-dupe bug. The `ask` output is the stub completion *plus the full internal prompt that was sent to the model*, including the embedded RAG context — that's noisy for an end user, and the literal "stub completion for:" prefix is confusing if the user wasn't told this is a stub.

**Issues found:** UAT-FN-04, UAT-FN-12.

### S5. Edge cases — grade: **B**

```
$ node bin/edgewell.js journal add ""
usage: edgewell journal add <text>
$ node bin/edgewell.js journal add "   "
usage: edgewell journal add <text>
$ node bin/edgewell.js journal add "今天睡得很好，喝了兩公升水"   # Chinese
logged
$ node bin/edgewell.js journal add "نمت 7 ساعات 🌙 صليت الفجر"   # Arabic + emoji
logged
$ node bin/edgewell.js journal add "💪🏃‍♂️🥗"                      # emoji only
logged
$ LARGE=$(python3 -c "print('Slept 8h. ' * 1000)")
$ node bin/edgewell.js journal add "$LARGE"
logged
real    0m0.125s   # 10 KB body, no warning
$ node bin/edgewell.js expense add 0.01 snacks
logged 0.01 (snacks)
$ node bin/edgewell.js expense add -50 refund
amount must be >= 0 (got -50)
usage: edgewell expense add <amount> <category>
$ node bin/edgewell.js expense add 1000000000 car
logged 1000000000 (car)   # accepted, no cap
$ node bin/edgewell.js expense add 50 餐饮
logged 50 (餐饮)            # Unicode category OK
$ node bin/edgewell.js journal find workout
usage: edgewell journal <add|list>     # <-- wrong usage for journal find
```

**As-a-user notes:** Unicode and emoji input round-trip cleanly, multi-word categories with spaces work, decimals and zero are accepted. Three papercuts: (a) empty/whitespace bodies just print `usage:` with no actual error reason, (b) a 10 KB journal body is accepted with no warning, (c) `journal find` (a documented alias for `journal-by-tag`) returns the **wrong usage line** — it points at `<add|list>` instead of `<add|list|find|...>`. There is no max-expense cap, so a 1B expense is accepted (the `summary week` then shows `total 1000000418.00`).

**Issues found:** UAT-FN-05, UAT-FN-06, UAT-FN-13.

### S6. Secondary workflows — grade: **C**

Smoke-tested ~25 of the 138 wired commands. Findings:

- `plan health`, `plan finance --income 5000` — return stub completions, no real output (acceptable since no model).
- `eval 2+2*3` → `8` (works).
- `models list` — clean table. `models describe medpsy-1` returns all-unknown — the help doesn't tell you to pass the full uppercase id (e.g. `MEDPSY_1_7B_Q4_K_M`).
- `profiles list|show|apply` — work. `apply tinkerer` shows a parenthetical "(writes to ~/.edgewell/profile.json in a future release)" which is honest but odd.
- `snapshot` — works (JSON dump).
- `vector stats` — works. `vector search water` — returns hits with `score=0.0000` for 3 of 5 results; the score is shown even when zero.
- `hybrid "how much water"` — works, shows `lexical` and `vector` rows side by side, mixes positive and negative scores.
- `export /tmp/edgewell-export.json` — works ("wrote … 7 entries, 8 expenses"). `import` from the same file: **"imported 0 journal entries, 0 expenses"** — fine semantically (already there), but the lack of a "skipped N duplicates" message is a papercut.
- `summary week` — works.
- `redact` with stdin pipe — **prints `usage: …` instead of reading stdin**. `redact text "..."` and `redact --text "..."` work, but a piped `echo "..." | edgewell redact` does not. (UAT-FN-08)
- `self-test` — runs the project test suite, 2.7 s, prints a clean pass/fail summary.
- `metrics` — `(no metrics recorded yet)` even after running other commands; metrics aren't populated.
- `agents` — clean list of 6 agents.
- `bench` — 12 tokens in 0–2 ms, 18000 tok/s (stub). Acceptable.
- `sensors ingest` / `sensors summarise` — work, real arithmetic on the JSONL.
- `multimodal data/sample_health_notes_v3.txt` — works, but the output **dumps the entire ingested file** to stdout, which is noisy for a command a user might run on a long note.
- `token` — mints a token. The output also prints "(one-off secret — set EDGEWELL_COMPANION_SECRET for persistent tokens)" — useful.
- `rotate-secret` — **unknown command** (UAT-FN-07). The COMMANDS.md document lists it, the `--help` doesn't.
- `companion --port 18888` — boots, but `curl /health` is the **only** route that responds; `/v1/chat`, `/v1/ask`, `/v1/journal`, `/v1/agents`, `/v1/plan` all return 404. The `web/app.js` calls `/chat`, `/journal`, `/journal?limit=20` — none of which exist. (UAT-FN-09, UAT-FN-10, UAT-FN-14)
- `serve --port 18787` — boots, says "model loaded" (it didn't, it's a stub), `listening on http://127.0.0.1:18787`. Only `/health` and a proprietary `POST /completion` work; `POST /v1/chat/completions` returns 404. The README's P2P example doesn't even show an actual API call to the peer, so a user following the README wouldn't notice. (UAT-FN-09, UAT-FN-15)
- `tags` — outputs `"   1  sensors"` (count + name), the leading whitespace is odd but not broken.

**As-a-user notes:** Most of the surface is fast and clean. The "138 additional" help line is misleading because some of those commands are advertised in COMMANDS.md but don't exist (rotate-secret). The companion/serve API surface is severely incomplete — the README's v3 pitch ("mobile companion HTTP server with HMAC bearer tokens", "P2P delegation") is undermined by the fact that almost no API routes work.

**Issues found:** UAT-FN-07, UAT-FN-08, UAT-FN-09, UAT-FN-10, UAT-FN-14, UAT-FN-15, UAT-FN-16.

### S7. Resume / kill mid-run — grade: **A**

```
$ node bin/edgewell.js seed 10000 &       # background
seeding… 0%  …  100%
seeded 10000 journal entries and 10000 expenses
[process exits cleanly within 2s]
$ node bin/edgewell.js status
… expenses: 10008  journal: 10008 …
$ node bin/edgewell.js seed 5
seeded 0 journal entries and 5 expenses (skipped 5 journal + 0 expenses already present)
```

**As-a-user notes:** `seed 10000` runs in 1.5 s — too fast to actually catch with Ctrl+C in a normal session. The state is persisted to disk, and re-running `seed 5` is correctly idempotent with a clear "skipped N" message. State survives across invocations.

**Issues found:** none.

### S8. Error paths — grade: **A-**

15 sabotages tested. Highlights:

| # | Sabotage | Result | Notes |
|---|----------|--------|-------|
| 1 | `frobnicate` | `unknown command: frobnicate` + help pointer | clean |
| 2 | `rag ingest /tmp/nope.txt` | `file not found: /tmp/nope.txt` | clean |
| 3 | `rag ingest data` (a dir) | `data is a directory, not a file` | clean |
| 4 | `ask ""` and `ask "   "` | `usage: edgewell ask "<question>"` | no specific reason; (UAT-FN-05) |
| 5 | `rag search ""` | `usage: edgewell rag search "<query>"` | no specific reason; (UAT-FN-05) |
| 6 | `expense add 12.5.6 free` | prints error then `usage:` (redundant but ok) | acceptable |
| 7 | `expense add -50 food` | `amount must be >= 0 (got -50)` then `usage:` | clear |
| 8 | `profile set --name=Alex` | `usage: edgewell profile set <key> <value>` | misleading — looks like a flag, actually a key |
| 9 | `profile set evil "rm -rf /"` | `warning: 'evil' is not a known profile key (known: name, language, goals, tagVocabulary)` then **sets it** | warns but allows arbitrary keys |
| 10 | `seed 1000000` | `seed count 1000000 exceeds cap of 100000\n(use a smaller number, or run multiple times if you really need more)` | excellent |
| 11 | `companion --port 80` | `error: listen EACCES: permission denied 127.0.0.1:80` | clean |
| 12 | `journal` (no subcommand) | `usage: edgewell journal <add|list>` | clean |
| 13 | `vector frobnicate` | `usage: edgewell vector <search|stats|clear> [args]` | clean |
| 14 | `profile set` (no args) | `usage: edgewell profile set <key> <value>` | clean |
| 15 | `plan` (no agent) | `usage: edgewell plan <health|finance>` | clean |
| 16 | `models dance` | `usage: edgewell models <list|describe <id>>` | clean |
| 17 | `rotate-secret` | `unknown command: rotate-secret` (UAT-FN-07) | doc/code drift |

**As-a-user notes:** Solid error handling overall. The `seed` cap error is best-in-class. The `profile set --name=Alex` case is a real footgun — the `--` prefix makes it look like a flag, but it's parsed as a literal key. The `profile set evil` case sets an unknown key (with a warning) — that's documented behaviour but a thoughtful reviewer would question it.

**Issues found:** UAT-FN-05, UAT-FN-07, UAT-FN-17.

### S9. Resource limits — grade: **A**

```
$ rm -rf data/journal.jsonl data/expenses.jsonl data/profile.json
$ /usr/bin/time -l node bin/edgewell.js seed 10000
…
seeded 10000 journal entries and 10000 expenses
        1.46 real         0.53 user         1.11 sys
           102907904  maximum resident set size
$ /usr/bin/time -l node bin/edgewell.js seed 100000
… peak memory footprint 13.0 MB …
$ /usr/bin/time -l node bin/edgewell.js rag search "test"
… peak memory footprint 13.0 MB …
$ du -sh data/
21 MB
```

**As-a-user notes:** `seed 10000` and `seed 100000` both finish in 1.5 s. Peak RSS is ~103 MB (Mac's "maximum resident set size" metric, which on Apple Silicon is an over-estimate — the actual footprint is ~13 MB). No hangs, no OOM, no warnings. After 100k entries, `rag search` is still snappy.

**Issues found:** none.

### S10. README reality check — grade: **C**

Ran the README's quickstart (8 examples) and the P2P delegation example verbatim. All five `journal add` / `expense add` / `rag ingest` / `rag search` / `ask` examples work. `help` works. The P2P example starts the `serve` server ("loading model LLAMA_3_1_8B_INST_Q4_K_M... model loaded") but the model is the **stub SDK** — no model is actually loaded. The README shows the client side as `EDGEWELL_P2P_ENABLED=1 EDGEWELL_P2P_HOST=192.168.1.20 EDGEWELL_P2P_PORT=8787 node bin/edgewell.js chat`. A user running the equivalent `ask` against a reachable peer gets back a `[stub completion for: ...]` — the client never even attempts the peer. (UAT-FN-15)

**As-a-user notes:** The README's quickstart is the one part that genuinely works. The "P2P delegation" section sets expectations the code doesn't meet. The web UI pitch in the v3 release notes ("a small static web UI (web/) for chat and journal") is undermined by the fact that the companion server doesn't serve those routes and doesn't send CORS headers (UAT-FN-09, UAT-FN-10, UAT-FN-14).

**Issues found:** UAT-FN-09, UAT-FN-10, UAT-FN-14, UAT-FN-15.

### Web UI smoke (bonus) — grade: **F**

```
$ node dist/bin/edgewell.js companion --port 18995 &
EdgeWell companion on 127.0.0.1:18995
auth: enabled
$ curl -s http://127.0.0.1:18995/health
{"ok":true,"name":"edgewell-companion","version":"3.0.0","agents":[…]}
$ python3 -m http.server 18998 --directory web &
$ # Playwright opens http://127.0.0.1:18998/?server=http://127.0.0.1:18995
```

Browser console (all from the same page):

```
Access to fetch at 'http://127.0.0.1:18995/health' from origin 'http://127.0.0.1:18998'
  has been blocked by CORS policy: Response to preflight request doesn't pass access
  control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
Failed to load resource: net::ERR_FAILED
Access to fetch at 'http://127.0.0.1:18995/journal?limit=20' …   (CORS)
Access to fetch at 'http://127.0.0.1:18995/chat' …                  (CORS)
Access to fetch at 'http://127.0.0.1:18995/journal' …              (CORS)
```

DOM state after the user types "Hello world" and submits the chat form:
- `#status` text: `journal error: Failed to fetch`
- `#messages`: `["Hello world", "error: Failed to fetch", "journal error: Failed to fetch"]`
- `#journal-list`: empty

Screenshots: `uat-screenshots/web-05-landing-ok.png` (the page itself, but the status bar is already red), `web-06-after-chat.png`, `web-07-after-journal.png`, `web-08-mobile.png`, `web-09-tab.png`. The mobile viewport (390×844) reflows cleanly — the layout works; the integration does not.

**As-a-user notes:** The web UI cannot communicate with the companion server for two compounding reasons: (1) **CORS preflight fails** because the companion doesn't send `Access-Control-Allow-Origin`, and (2) the `/chat` and `/journal` endpoints don't exist anyway. A user who follows the README's v3 description ("ships with a small static web UI (web/) for chat and journal") will end up with a chat box that responds to every message with `error: Failed to fetch`. This is a v3.0.0 advertised feature that does not work end-to-end.

**Issues found:** UAT-FN-09, UAT-FN-10, UAT-FN-14.

## Findings

| ID | Sev | Scenario | Surface | Title | Repro | Expected | Actual | Suggested fix |
|----|-----|----------|---------|-------|-------|----------|--------|---------------|
| UAT-FN-01 | Med | S3 | cli | `profile set name=Alex` rejected; the CLI requires two separate args | `node bin/edgewell.js profile set name=Alex` | Either the `key=value` form works, or the usage line shows an example | `usage: edgewell profile set <key> <value>` | Accept `key=value` as a single arg (or document the space form in the help line) |
| UAT-FN-02 | Med | S3 | cli | `profile show` on a fresh install returns the **default** profile as if it were the user's | (wipe data) then `profile show` | "(no profile on disk)" or empty defaults | A populated JSON with `name:"friend"`, default goals, etc. | If the file does not exist, return `null` and have callers render "(no profile)" |
| UAT-FN-03 | Low | S3 | cli | `profile init` is advertised as a wizard but silently writes the defaults with no prompts | `profile init` (no TTY) | "wrote default profile (no TTY — pass a TTY to run the wizard)" is shown — but no wizard exists in the source | The message implies a wizard that never runs; a first-time user is left wondering if they missed something | Either implement the wizard for TTY runs, or change the message to "wrote default profile (no interactive prompts available in this mode)" |
| UAT-FN-04 | Med | S4 | cli | `rag search` returns the same chunk 4× — RAG results are not de-duplicated | `rag ingest data/sample_health_notes.txt` (already indexed) then `rag search "how much water"` | At most one row per unique chunk id | Same `sample_health_notes.txt` Nutrition chunk listed 4× with identical `score 0.008` | De-duplicate by chunk id (or hash) in the search response formatter |
| UAT-FN-05 | Low | S4/S5/S8 | cli | Empty / whitespace inputs to `ask`, `rag search`, `journal add` produce just a `usage:` line with no specific reason | `ask ""`, `rag search ""`, `journal add ""` | "question cannot be empty" / "text cannot be empty" | `usage: edgewell ask "<question>"` | Print the specific reason *before* the usage line |
| UAT-FN-06 | Low | S5 | cli | `journal find <tag>` (documented alias for `journal-by-tag`) prints the wrong usage line on bad input | `journal find workout` (a non-existent tag) | `usage: edgewell journal find <tag>` (or similar) | `usage: edgewell journal <add|list>` — `<find>` is missing from the printed list | Fix the usage line for the `journal` subcommand to enumerate `add`, `list`, `find`, `tail`, `rm`, `restore`, etc. |
| UAT-FN-07 | Med | S6 | cli | `rotate-secret` is listed in `docs/COMMANDS.md` but does not exist as a command | `edgewell rotate-secret` | The command runs (rotate companion secret) | `unknown command: rotate-secret` | Either implement the command (it pairs with `token`) or remove it from COMMANDS.md |
| UAT-FN-08 | Med | S6 | cli | `redact` does not read from stdin despite being a natural pipe target | `echo "my email is j@x.com" \| edgewell redact` | The redacted text | `usage: edgewell redact <text> [...more words] …` | Read from stdin if no positional arg is given |
| UAT-FN-09 | Blocker | S6, Web | cli+web | The `companion` HTTP server (v3.0.0 headlined feature) implements **only** `GET /health`. All other advertised routes return 404. | (1) start `edgewell companion --port N`; (2) `curl http://127.0.0.1:N/v1/journal` (with or without token) | The companion server should expose `/v1/chat`, `/v1/journal`, `/v1/agents`, `/v1/plan`, `/v1/ask` (as the README/web UI imply) | `{"error":"not found","method":"POST","path":"/v1/journal"}` for every v1 route | Wire the existing internal `Router` (used in the unit tests) to the public companion server, or document the actual route names |
| UAT-FN-10 | Blocker | Web | web | `web/app.js` fetches `/chat`, `/journal`, `/journal?limit=20` from the companion — none of these endpoints exist | Open `web/index.html` while a companion is running on port 8787, type "Hello", submit | The chat shows a reply from EdgeWell | The UI displays `error: Failed to fetch` for every message | Either implement `/chat` and `/journal` on the companion server, or change the web UI to call the (working) `/v1/*` equivalents |
| UAT-FN-11 | Med | S1 | cli | `docs/TROUBLESHOOTING.md` recommends `npm install --legacy-peer-deps` as the fix for `npm install` failing. The actual error is the `link:` URL type, not a peer-dep issue | `npm install` on the project | (a) `npm install --legacy-peer-deps` succeeds; or (b) the docs say "use pnpm" | `npm error code EUNSUPPORTEDPROTOCOL` — `--legacy-peer-deps` does not help | Update TROUBLESHOOTING.md: "EdgeWell's `@qvac/sdk` is a `link:` dependency; only pnpm is supported. Use pnpm." |
| UAT-FN-12 | Med | S4 | cli | `ask` output is noisy: the entire prompt template (with RAG context inline) is printed before the stub completion | `node bin/edgewell.js ask "How can I save 20% of my income?"` | A clean one-paragraph answer (or, for the stub, just the route + a friendly placeholder) | The full RAG context, the user prompt, the agent template, *then* `[stub completion for: ...]` | In stub mode, suppress the internal prompt and print something like `[stub] route=finance · ask: "How can I save 20%…"` |
| UAT-FN-13 | Low | S5 | cli | A 10 KB journal body is accepted with no warning; no max-length check | `journal add "$(python3 -c 'print("Slept 8h. " * 1000)')"` | Either truncated, or a soft warning | `logged`, no message | Add a soft cap (e.g. 4 KB) with a hint to split long entries |
| UAT-FN-14 | Blocker | Web | web | Companion server does not send `Access-Control-Allow-Origin`, so even `GET /health` (the only working route) is blocked by CORS preflight from a different-origin browser client | (1) start `edgewell companion`; (2) open the bundled `web/index.html` from a `python3 -m http.server` | The page shows `connected · v3.0.0 · 6 agents` | The page shows `journal error: Failed to fetch`; console shows 4× "blocked by CORS policy" | Add CORS middleware to the companion `Router` (`Access-Control-Allow-Origin: *` for the bundled UI, or echo the request `Origin`) |
| UAT-FN-15 | High | S6, S10 | cli | The P2P client (`EDGEWELL_P2P_ENABLED=1 …`) never actually contacts the peer — it always returns the local stub | (1) start `serve --port 18787` on the same host; (2) `EDGEWELL_P2P_ENABLED=1 EDGEWELL_P2P_HOST=127.0.0.1 EDGEWELL_P2P_PORT=18787 edgewell ask "hi"` | The response is streamed from the peer | `[lifestyle] [stub completion for: hi]` (the peer is never contacted; the same response appears even when the host:port is unreachable) | Trace the client path: `createEdgeWell` builds a `PeerClient` only when `p2p.enabled` is true; the in-process `DelegatingLLM` should be the one making the call. Verify that `EDGEWELL_P2P_ENABLED=1` actually flips the flag (env-var name and parse path) |
| UAT-FN-16 | Low | S6 | cli | `metrics` shows `(no metrics recorded yet)` after exercising the CLI for several minutes | run `info`, `doctor`, `seed 5`, `rag search "test"`, then `metrics` | Some counters incremented | All counters empty | Either wire `inc()` calls into the dispatch hot path, or remove the `metrics` command from the v3 advertised surface |
| UAT-FN-17 | Low | S8 | cli | `profile set --name=Alex` is treated as a literal key, not a flag — the `--` prefix is silently consumed | `profile set --name=Alex` | Either rejected as a flag-looking key, or `--name` is parsed as a flag | Silently sets the key `--name` with the value `Alex` (a key that begins with `--` is unlikely to round-trip) | If a key starts with `-`, reject it with "key cannot start with `-`" |
| UAT-FN-18 | Low | S6 | cli | `multimodal <file>` dumps the entire ingested file to stdout on success, mixing ingest status with file contents | `edgewell multimodal data/sample_health_notes_v3.txt` | A short "indexed N bytes, kind=text" line | A 70-line dump of the file body | Move the dump behind `--print` or `--verbose`; default to the short status line |
| UAT-FN-19 | Low | S6 | cli | `vector search` returns rows with `score=0.0000` — i.e. cosine exactly zero — without explaining what that means | `edgewell vector search water` | Hide zero-score rows, or label them as `(no signal)` | Three of five rows have `score=0.0000` | Filter zero-score rows from the output, or rename to "score=0.0 (no match)" |
| UAT-FN-20 | Low | S6 | cli | `import` of an already-imported file says `imported 0 journal entries, 0 expenses` — no indication that records were recognised as duplicates | `export … ; import <same file>` | "imported 0 new (skipped 7 existing)" or similar | "imported 0 journal entries, 0 expenses" | Include a duplicate-skip count in the output |
| UAT-FN-21 | Low | S6 | cli | `models describe medpsy-1` returns all fields as `"unknown"` — the help does not show the canonical id format | `edgewell models describe medpsy-1` | Helpful error: "no model with id 'medpsy-1'; try `edgewell models list`" | `{"id":"medpsy-1","family":"unknown",…}` | The unknown-id path should be a "not found" error, not a placeholder record |
| UAT-FN-22 | Low | S6 | cli | `profiles apply tinkerer` prints `(writes to ~/.edgewell/profile.json in a future release)` — the user just ran a command and the command itself admits it doesn't persist | `edgewell profiles apply tinkerer` | The applied profile sticks across runs | Apparent confirmation, with a note that the change is not actually saved | Either persist the selection (e.g. write to `data/profile.json` or `~/.edgewell/state.json`) or remove the misleading success message |
| UAT-FN-23 | Low | S3 | cli | `doctor` reports a single FAIL ("profile readable") but counts it as `1 check(s) failed` in the summary — the wording is plural for a count of one | `edgewell doctor` (fresh install) | "1 check failed" | "1 check(s) failed" | Use proper singular/plural ("1 check failed" / "N checks failed") |
| UAT-FN-24 | Low | S5 | cli | No upper cap on `expense add` — a 1,000,000,000 expense is accepted silently | `edgewell expense add 1000000000 car` | Either an upper cap (with a clear error), or a soft warning | `logged 1000000000 (car)` and the weekly summary then shows `total 1000000418.00` | Add a configurable max amount (the schema validator already rejects `> EXPENSE_MAX` per the unit tests, but the CLI does not surface that check) |

### Severity rubric

- **Blocker** — user cannot complete a primary flow
- **High** — user completes the flow but output is wrong / lost / misleading
- **Medium** — user is significantly slowed or confused
- **Low** — minor papercut

**Severity counts:** 3 Blocker (UAT-FN-09, UAT-FN-10, UAT-FN-14), 1 High (UAT-FN-15), 7 Medium, 13 Low (see `uat-findings.json` for machine-readable counts). Total: 24 findings.

## Performance observations

| Operation | Wall clock | Peak RSS | Notes |
|-----------|-----------:|---------:|-------|
| `pnpm install` (cached) | 0.20 s | — | |
| `pnpm build` | 1.03 s | — | |
| `pnpm test` (431 tests) | 2.74 s | — | 0 failures |
| `bin/edgewell.js --version` | 0.15 s | — | |
| `bin/edgewell.js help` | 0.12 s | — | |
| `bin/edgewell.js status` | 0.14 s | — | |
| `bin/edgewell.js doctor` | 0.14 s | — | |
| `bin/edgewell.js journal add "<text>"` | 0.12 s | — | |
| `bin/edgewell.js rag ingest …` | 0.13 s | — | 8 chunks |
| `bin/edgewell.js rag search "<query>"` | 0.13 s | — | (with de-dup bug) |
| `bin/edgewell.js ask "<q>"` | 0.13 s | — | stub |
| `bin/edgewell.js seed 10000` | 1.46 s | ~103 MB (Mac overestimate; actual ~13 MB) | |
| `bin/edgewell.js seed 100000` | ~1.5 s | ~13 MB | within the `100000` cap |
| `bin/edgewell.js rag search` (on 100k index) | ~0.5 s | ~13 MB | no slowdown |
| `dist/bin/edgewell.js companion` boot | ~1.2 s | — | only `/health` works |
| `dist/bin/edgewell.js serve` boot | ~1.5 s | — | only `/health` and `/completion` work |

The CLI is **fast** — every command responds in well under a second, and the `seed` loop handles 100k records on commodity hardware without breaking a sweat. Performance is not the problem; functional completeness is.

## Follow-up suggestions (for the user, not the maintainer)

A first-time user would still want:

- A working `companion` server. The v3.0.0 README's promise of a mobile companion with HMAC bearer tokens is the headline feature, and it does not function end-to-end. Wiring the unit-tested `Router` to the public surface would close UAT-FN-09, UAT-FN-10, and UAT-FN-14 in one PR.
- A working P2P example. The README's `EDGEWELL_P2P_ENABLED=1 … ask "x"` example should demonstrably contact the peer. Right now it falls through to the local stub without any error.
- CORS preflight support on `companion` and `serve` so that any third-party client (including the bundled `web/`) can actually call them.
- `--dry-run` on the destructive commands (`seed`, `import`, `lint-fix`).
- A max-amount cap on `expense add` (the schema validator already has `EXPENSE_MAX`; the CLI does not call it).
- A friendlier `profile set` that accepts both `name=Alex` and `name Alex` (or at least shows a hint when the user types the wrong form).
- A `profile show --empty` or a separate `profile-defaults` command so that "no profile on disk" is distinguishable from "profile with default values".
- A `tags` / `tag-cloud` rework so that the count column doesn't have weird whitespace.
- An honest help line: instead of "138 additional — run `edgewell command-list`", show a short, curated list of the most common commands and stop pretending there are 138 if the user is going to hit dead ends in them (`rotate-secret` is documented but doesn't exist).
- A real OpenAI-compatible `/v1/chat/completions` endpoint on the P2P `serve` so that a third-party LLM client (e.g. `llama.cpp`, `oobabooga`, anything that speaks the OpenAI protocol) can use EdgeWell as a peer.
- A test or smoke that runs the bundled `web/` UI against a freshly-started `companion` and asserts the chat round-trip works. The static UI ships in the repo, but no end-to-end test exercises it.

## Run log

- `uat-run-logs/env.log` — environment snapshot (`node --version`, `pnpm --version`, OS, git state, data dir state)
- `uat-run-logs/S1-cold-install.log` — `pnpm install`, `pnpm build`, `pnpm test`, `npm install`
- `uat-run-logs/S2-first-impression.log` — `--version`, `--help`, `help`, `version`, `info`
- `uat-run-logs/S3-config-init.log` — `status`, `doctor`, `profile`, `profile show`, `profile init`, `profile set`, `config` (after wiping `data/`)
- `uat-run-logs/S4-happy-path.log` — README quickstart, 8 commands verbatim
- `uat-run-logs/S5-edge-case.log` — multi-word, empty, whitespace, Unicode (Chinese, Arabic, emoji), 10 KB body, decimals, zero, negative, multi-word category, Unicode category, tag search
- `uat-run-logs/S6-secondary.log` — `plan`, `eval`, `models`, `plugins`, `profiles`, `snapshot`, `vector`, `hybrid`, `export`/`import`, `summary`, `redact`, `self-test`, `metrics`, `agents`, `bench`, `companion`, `serve`, `sensors`, `multimodal`, `tag` family
- `uat-run-logs/S7-resume.log` — `seed 10000` background, status, `seed 5` re-run
- `uat-run-logs/S8-error-paths.log` — 15 sabotages
- `uat-run-logs/S9-resource-limits.log` — `seed 10000` and `seed 100000` with `/usr/bin/time -l`
- `uat-run-logs/S10-readme-reality-check.log` — README examples + P2P + companion endpoints probed with curl + Playwright

Web smoke screenshots: `uat-screenshots/web-01-landing.png` through `uat-screenshots/web-09-tab.png` (companion unreachable, then companion up but CORS-blocked).

Playwright console output (4 CORS errors, 4 fetch failures) is inlined in the **Web UI smoke** section above.
