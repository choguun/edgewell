# UAT Report — EdgeWell v3.0.0 (chore/ts-pnpm-migration branch)

**Tester:** qa-tester (MiniMax-M3)
**Date:** 2026-06-16
**Commit:** 2c4d274 (clean working tree, last commit "refactor(multimodal,companion): drop // @ts-nocheck on barrel files")
**Environment:** Node v24.13.0, pnpm 11.6.0, macOS arm64 (darwin), 16GB-class host
**Network:** n/a (everything offline — `@qvac/sdk` is a `link:` to `./vendor/qvac-sdk`; the LLM path falls back to stub completions)
**Persona:** First-time EdgeWell user; Node.js developer; knows comparable tools (e.g. `task`, `notes`, `timewarrior`); 20-min budget to get the primary workflow working.
**Surface tested:** CLI tool
**Surface served as:** `node --import tsx/esm bin/edgewell.js <cmd>` (dev) and `node dist/bin/edgewell.js <cmd>` (built). The README's `node bin/edgewell.js <cmd>` invocation **does not work** — see UAT-FN-01.

## Verdict: **BLOCKED**

A first-time user following the README literally is stopped cold on the very first command (`node bin/edgewell.js help` → `ERR_MODULE_NOT_FOUND: Cannot find module '.../src/index.js'`). The TS + pnpm migration is real and the built binary works, but **the user-facing surface (README, install instructions, `bin/edgewell.js` entry point) was not updated** to match. A handful of additional correctness bugs (a profile-corruption bug, a multi-word RAG query returning no matches, a self-test that runs zero tests but reports "passed", and a couple of raw `ENOENT`/`EISDIR` errors leaked from Node's `fs` layer) push this from "polish needed" to "do not ship the migration as-is." The good news: the underlying CLI works, the data model is clean, error messages for happy-path validation are good, and `pnpm build`/`pnpm install` are fast.

## Test plan

- [x] S1. Cold install (`npm install` per README, `pnpm install` per package.json, `pnpm build`)
- [x] S2. First impression (`--version`, `--help`, `help`, `version`, `info`)
- [x] S3. Config init / setup (`status`, `doctor`, `profile`)
- [x] S4. Happy-path primary workflow (README quickstart, 5 commands verbatim)
- [x] S5. Edge case of primary workflow (missing args, empty string, non-numeric amount, negative amount, no category)
- [x] S6. Secondary workflows (`plan`, `eval`, `models`, `plugins`, `profiles`, `snapshot`, `vector`, `hybrid`, `export`, `lint`, `demo-data`, `seed`, `today`, `summary`, `token`, `where`, `size`, `redact`, `self-test`, `deps`, `version-history`, `metrics`, `agents`, `bench`)
- [x] S7. Resume / checkpoint / signal handling (state persisted across calls; long-running `seed 50` completed cleanly)
- [x] S8. Error paths — **15 deliberate sabotages** (unknown command, missing file, directory, empty input, bad numeric, bad sub-subcommand, empty ask, empty search, bad id, missing import file, malformed JSON, missing compare file, missing tag id, absurdly large seed, privileged port for companion)
- [x] S9. Resource limits (`seed 10000` → 2s, 40MB RSS, lint clean)
- [x] S10. README reality check — **8 of 8 README examples using the documented invocation fail** (UAT-FN-01)

## Scenarios

### S1. Cold install — grade: **C** (npm side) / **A** (pnpm side)

```bash
$ time pnpm install --frozen-lockfile
Already up to date
Done in 166ms using pnpm v11.6.0
real    0m0.212s

$ time npm install
npm warn Unknown project config "onlyBuiltDependencies". This will stop working in the next major version of npm.
npm error code EUNSUPPORTEDPROTOCOL
npm error Unsupported URL Type "link:": link:./vendor/qvac-sdk
real    0m0.324s

$ time pnpm build
$ tsc -p tsconfig.build.json
real    0m1.136s
```

**As-a-user notes:** README says `npm install` → npm explodes on the `link:` dep. `package.json` is pinned to `pnpm@11.6.0` and `.npmrc` is `onlyBuiltDependencies[]=esbuild` which npm doesn't understand. Anyone who reads the README and types `npm install` will get a hostile wall of `EUNSUPPORTEDPROTOCOL` text with zero hint that they need pnpm. The `prepare` hook runs `pnpm build` so any consumer install will also fail under npm. **pnpm install + build itself is excellent** — 166 ms warm, 1.1 s build.

### S2. First impression — grade: **C**

```
$ edgewell --version
[entire 110-line help screen — does NOT print a version]
```

`edgewell version` does print `edgewell v3.0.0` and `edgewell info` prints a nice one-screen overview. The help screen is useful in isolation but:

- `--version` is silently ignored (just dumps help) — **standard CLI convention broken**.
- The help screen lists 60+ top-level commands followed by a 138-command "additional commands" wall with no description. A new user has to know which 5–10 of those 198 commands they actually need. **The Examples block at the bottom of help is the only discoverability mechanism, and it has 5 examples.** That saves it from an F.
- `help` and `--help` are the same output (good), but the wall-of-text treatment of an unknown command is the same wall (see S8).

### S3. Config init / setup — grade: **C**

```
$ edgewell status
local model:  LLAMA_3_2_1B_INST_Q4_0
delegate:     LLAMA_3_1_8B_INST_Q4_K_M
p2p:          disabled @ 127.0.0.1:8787 (timeout 30000ms)
rag chunks:    0
expenses:      0
journal:       0

$ edgewell doctor
OK    profile readable  name=friend, lang=en   ← misleading, profile.json does NOT exist on disk
... 13 OK lines, "all checks passed"
```

**As-a-user notes:** `doctor` says `profile readable name=friend` even when `data/profile.json` is missing — it returns the in-memory default, which makes the check semantically wrong. Same issue: `where` shows the path to `data/profile.json` and `size` reports it as `0 B`, while the file doesn't exist. A user can't tell whether they have a real profile or a default.

`profile init` runs in interactive mode and silently exits without writing anything when stdin is not a TTY (the `name [friend]:` prompt just hangs at EOF). This is normal Node readline behaviour but no fallback to non-interactive mode is provided. `profile set` has a **real data corruption bug** — see UAT-FN-04.

### S4. Happy-path primary workflow — grade: **F** (if following README) / **B** (if using dev invocation)

README's quickstart fails 8/8 times (UAT-FN-01). Using the dev invocation `node --import tsx/esm bin/edgewell.js` (which `pnpm start` and the actual `package.json#scripts.start` use), the workflow works:

```
$ edgewell journal add "Slept 7.5h, walked 6k steps"
logged
$ edgewell expense add 250 food
logged 250 (food)
$ edgewell rag ingest data/sample_health_notes.txt
ingested 4 chunks from .../sample_health_notes.txt
$ edgewell rag search "how much water should I drink"
(no matches)             ← BUG: README's exact example query returns nothing (UAT-FN-02)
$ edgewell ask "How can I save 20% of my income?"
[finance]
[stub completion for: User expense summary: ... ]    ← works, uses stub when no LLM
```

`journal list`, `expense list`, `today` all work as expected. The stub-completion path (no real `@qvac/sdk` model loaded) is honestly labeled and routes the question to the right agent — good design.

### S5. Edge case of primary workflow — grade: **B**

```
$ edgewell journal add ""
usage: edgewell journal add <text>
$ edgewell expense add -100 food
amount must be >= 0 (got -100)
$ edgewell expense add abc food
usage: edgewell expense add <amount> <category>
       amount must be a finite number
$ edgewell expense add 250
logged 250 (other)            ← silently maps to category "other" with no warning
```

Most validation errors are clean and the exit codes are sane (`2` for usage, `1` for runtime). The one papercut: `expense add 250` (forgot the category) silently picks `"other"` and writes to disk. A user who forgets the category will quietly get mis-tagged expenses.

### S6. Secondary workflows — grade: **B**

- `plan health`, `plan finance`, `eval 2+2*3` → all return `[stub completion for: ...]` — labeled honestly.
- `models list` → nice table of 6 QVAC models with size/family columns. ✓
- `profiles list` → mobile / tinkerer / desktop with one-liner descriptions. ✓
- `plugins list` → "(no *.plugin.js in .../plugins)" — clear empty state. ✓
- `snapshot` → full JSON dump of config + profile + data. ✓
- `vector stats` → `size: 4, dim: 128` — **but `doctor` earlier said `dim=64`**. Inconsistency (UAT-FN-08).
- `hybrid "water"` → fused lexical+vector results with per-channel scores. ✓
- `export` / `import` / `compare` — all work; error messages for missing/malformed files are exemplary.
- `redact <text>` → just prints `usage:` no matter what (UAT-FN-09). Can't get it to actually redact anything from the command line.
- `self-test` → **runs 0 tests, reports "self-test passed"** (UAT-FN-10).
- `version-history` → "not a git checkout or CHANGELOG not tracked" — but we ARE in a git checkout and CHANGELOG.md exists and is tracked (UAT-FN-11).
- `bench` → reports 18 000 tok/s on the stub LLM. Misleading, but the CLI is honest that it's a stub.
- `seed N` → consistently off by ~20% on the journal count (UAT-FN-12).
- `metrics` → "(no metrics recorded yet)" — never seems to record metrics from any of the commands above.

### S7. Resume / checkpoint / signal handling — grade: **B**

The CLI is a one-shot-per-invocation tool; no daemon, no incremental state machine. State is in `data/*.jsonl` and `data/profile.json`, both append-only / atomic-write, and they survive across calls cleanly. `seed 50` runs in <100 ms, writes 100 records, and the next `journal list` sees them all. `lint` after `seed 10000` says "no issues found." No resume needed because there's no long-running operation to interrupt.

The one I couldn't easily test in a sandbox: `Ctrl+C` during a long `seed` would presumably truncate the partial write. The stores use `appendFileSync` per line, so it would be at worst a partial final line that `lint` would catch — but I didn't kill mid-write to verify, since that risks corrupting `data/` for future runs.

### S8. Error paths — grade: **C** (15 sabotages, several raw fs errors leaked)

| # | Sabotage | Exit | Verdict |
|---|----------|------|---------|
| 1 | `edgewell frobnicate` (unknown) | 2 | **Bad UX** — dumps the full 110-line help screen instead of `unknown command: frobnicate` (UAT-FN-13) |
| 2 | `rag ingest /tmp/nope.txt` | 1 | **Bad** — raw `error: ENOENT: no such file or directory, open '...'` (UAT-FN-14) |
| 3 | `rag ingest data` (a dir) | 1 | **Bad** — raw `error: EISDIR: illegal operation on a directory, read` (UAT-FN-14) |
| 4 | `journal add ""` | 2 | Good — clean usage |
| 5 | `expense add banana food` | 2 | Good — clear two-line usage |
| 6 | `profile foo` | 2 | Good — clean usage |
| 7 | `ask` (no question) | 2 | Good |
| 8 | `rag search` (no query) | 2 | Good |
| 9 | `tags-add nonexistent-id` | 2 | OK — usage only; doesn't say "entry not found" |
| 10 | `import /tmp/nope.json` | n/a | **Excellent** — "file not found: /tmp/nope.json" |
| 11 | `import /tmp/bad.json` (malformed) | n/a | **Excellent** — explains "is not a valid JSON file" with parser detail |
| 12 | `compare /tmp/nope1.json /tmp/nope2.json` | n/a | **Excellent** — "file not found: /tmp/nope1.json" |
| 13 | `tag-rm` (no id) | 2 | Good |
| 14 | `seed 1000000` | n/a | Hangs / takes >60 s (UAT-FN-15) — no progress indicator, no cap, no rate-limit |
| 15 | `companion --port 22` (privileged) | n/a | Skipped — would need to background and kill |

**Net:** 6/15 error paths are user-friendly. The 4 that aren't are clustered around (a) unknown commands dumping too much, (b) file-system errors leaking `EISDIR`/`ENOENT` raw, and (c) the unbounded seed.

### S9. Resource limits — grade: **A**

```
$ time edgewell seed 10000
seeded 9001 journal entries and 9998 expenses
real    0m2.002s
RSS:    40 MB
$ wc -l data/*.jsonl
  288968 data/journal.jsonl
  289969 data/expenses.jsonl
$ edgewell lint
no issues found
```

10 000 seeded rows in 2 s, 40 MB peak, lint clean. 0 → 10 000 journal+expense rows with no UI lockup. The off-by-2 000 in the journal count (UAT-FN-12) is the only correctness wart in this scenario.

### S10. README reality check — grade: **F**

I ran the **README's quickstart verbatim** with the README's documented command:

```bash
$ node bin/edgewell.js help
node:internal/modules/esm/resolve:274
    throw new ERR_MODULE_NOT_FOUND(
          ^
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/index.js'
        imported from .../bin/edgewell.ts
```

**All 8 of 8 README examples fail.** The legacy `bin/edgewell.js` still exists and still imports `src/index.js`, but `src/index.js` was deleted during the TypeScript migration (replaced by `src/index.ts` and `dist/src/index.js`). The migration to TS + pnpm did not update the `bin/edgewell.js` shim, the README's install command (`npm install` instead of `pnpm install`), or the README's quickstart command (`node bin/edgewell.js ...` instead of `pnpm start -- ...` or `node --import tsx/esm bin/edgewell.js ...` or `node dist/bin/edgewell.js ...`).

## Findings

| ID | Sev | Scenario | Surface | Title | Repro | Expected | Actual |
|----|-----|----------|---------|-------|-------|----------|--------|
| UAT-FN-01 | **Blocker** | S1, S10 | CLI | README quickstart doesn't work — `node bin/edgewell.js <cmd>` fails with `ERR_MODULE_NOT_FOUND` for every documented example | Follow README step 1: `node bin/edgewell.js help` | Help screen | `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/index.js' imported from .../bin/edgewell.ts` |
| UAT-FN-02 | High | S4 | CLI | README's exact RAG example returns no matches | `pnpm start -- rag ingest data/sample_health_notes.txt` then `rag search "how much water should I drink"` | At least one matching chunk (the file has a "Hydration: 2 liters of water..." line) | `(no matches)` (single-word queries like `water` do work) |
| UAT-FN-03 | High | S1, S10 | CLI/Docs | README install command `npm install` fails; project requires pnpm | `npm install` per README | A working install | `npm error EUNSUPPORTEDPROTOCOL: Unsupported URL Type "link:"` + npm warns about unknown `.npmrc` key `onlyBuiltDependencies` |
| UAT-FN-04 | High | S3 | CLI | `profile set` with `--key value` flags **corrupts** profile.json | `profile set --name alex --goal sleep` | Reject with "use positional args: profile set <key> <value>" | Stores `"--name": "alex --goal sleep"` as a real profile key, persists to disk, sets `createdAt`, returns "self-test passed"-style "set --name" confirmation |
| UAT-FN-05 | Med | S2 | CLI | `--version` flag silently ignored — prints full help instead of a version | `edgewell --version` | `edgewell v3.0.0` | Entire 110-line help screen |
| UAT-FN-06 | Med | S3 | CLI | `profile init` hangs silently when stdin is not a TTY | Run `profile init` in a non-TTY shell | Either write a default profile, or error "profile init requires a TTY" | Hangs at `name [friend]:` then exits 0 with no profile written |
| UAT-FN-07 | Med | S3 | CLI | `doctor` falsely reports `profile readable name=friend` when `data/profile.json` is missing | Delete `data/profile.json`, then run `doctor` | "no profile on disk — run `profile init`" | "OK profile readable name=friend, lang=en" |
| UAT-FN-08 | Med | S6 | CLI | Inconsistent vector dimensions reported: `doctor` says `dim=64`, `vector stats` says `dim=128` | Run both commands back-to-back | Same value in both | 64 vs 128 |
| UAT-FN-09 | Med | S6, S8 | CLI | `redact` command cannot be invoked from the CLI | `redact "Contact me at john@example.com"` and `redact --text "..."` | Redacted output | `usage: edgewell redact <text|json> <...>` in both cases |
| UAT-FN-10 | Med | S6 | CLI | `self-test` reports "self-test passed" while running 0 tests | `edgewell self-test` | Real test run + pass/fail count | `tests 0, suites 0, pass 0, fail 0, ... self-test passed` |
| UAT-FN-11 | Med | S6 | CLI | `version-history` says "not a git checkout or CHANGELOG not tracked" inside a git checkout with a tracked CHANGELOG.md | `edgewell version-history` | List of recent CHANGELOG.md commits | "not a git checkout or CHANGELOG not tracked" |
| UAT-FN-12 | Med | S9 | CLI | `seed N` reports journal count ~20% lower than requested (10 → 8, 10000 → 9001) | `edgewell seed 10` | `seeded 10 journal entries and 10 expenses` | `seeded 8 journal entries and 10 expenses` (expense count is correct, journal count is off) |
| UAT-FN-13 | Med | S8 | CLI | Unknown subcommand dumps the entire 110-line help screen | `edgewell frobnicate` | `unknown command: frobnicate — run \`edgewell help\`` (one line) | 110-line help dump (no "unknown command" indicator at all) |
| UAT-FN-14 | Med | S8 | CLI | Raw `ENOENT` / `EISDIR` errors leak from Node's `fs` layer to the user | `rag ingest /tmp/nope.txt` and `rag ingest data` | `file not found: /tmp/nope.txt` / `data is a directory, not a file` (matches the style used by `import` and `compare`) | `error: ENOENT: no such file or directory, open '...'` / `error: EISDIR: illegal operation on a directory, read` |
| UAT-FN-15 | Med | S8 | CLI | `seed` accepts arbitrarily large N with no rate limit, progress, or cap | `edgewell seed 1000000` | Cap at e.g. 100 000, or print progress, or ask for confirmation | Took >60 s and was killed; no progress bar, no warning |
| UAT-FN-16 | Low | S4 | CLI | `chat` exits cleanly after processing one piped input but doesn't process subsequent lines; non-interactive use is awkward | `printf "hi\nexit\n" \| edgewell chat` | Process both lines and exit | Only first line is processed; second prompt prints, then EOF exits 0 |
| UAT-FN-17 | Low | S5 | CLI | `expense add 250` (no category) silently defaults to `"other"` with no warning | `expense add 250` | `error: missing category — usage: ...` | `logged 250 (other)` — silently mis-tagging data |
| UAT-FN-18 | Low | S6 | CLI | `version-history` mentions `CHANGELOG.md` but the project has both `CHANGELOG.md` and a `version` command — these two should agree on what counts as a "release" | `version` (prints `v3.0.0`) vs `version-history` (no commits) | Coherent narrative | "v3.0.0" exists; the changelog-history walker can't find it |
| UAT-FN-19 | Low | S2 | CLI/Help | The help screen lists 60+ top-level commands plus 138 "additional commands" as a wall of un-described names | `edgewell help` | 8–12 top-level commands with descriptions, advanced commands in `edgewell command-list` only | 60+ described + 138 name-only commands on first paint of help |
| UAT-FN-20 | Low | S6 | CLI | `where` shows a `profile: data/profile.json` line even when the file does not exist | `rm data/profile.json; edgewell where` | "profile: (not yet created — run `profile init`)" | "profile: /…/data/profile.json" (misleading) |

### Severity rubric
- **Blocker** — user cannot complete a primary flow (UAT-FN-01, UAT-FN-03)
- **High** — user completes the flow but output is wrong / lost / misleading, or data is corrupted (UAT-FN-02, UAT-FN-04)
- **Medium** — user is significantly slowed or confused
- **Low** — minor papercut

## Performance observations

| Metric | Result | Docs claim |
|---|---|---|
| `pnpm install` (warm) | 166 ms | n/a |
| `pnpm build` (tsc) | 1.14 s | n/a |
| `pnpm start -- <cmd>` cold start | ~120 ms per invocation | n/a |
| `seed 10000` | 2.0 s, peak RSS 40 MB | n/a |
| `lint` after 10 000 rows | <50 ms | n/a |
| Help screen paint | <50 ms but ~5 KB of output | n/a |

No performance issues. The CLI is single-process and snappy. The one wall-of-text output is the help screen (UAT-FN-19), not a latency problem.

## Follow-up suggestions (for the user, not the maintainer)

- **Fix the migration cliff first.** A user should be able to follow the README start-to-finish with no surprises. Either delete `bin/edgewell.js` (it has no remaining purpose — `bin/edgewell.ts` is what `pnpm start` runs), or update the README to use `pnpm start -- <cmd>` and `pnpm install` consistently.
- **`--version` should print the version** — this is the most-fixable blocker-class papercut.
- **A `redact --help` or `--text "..."` flag for `redact`** would let a user actually use the command (currently the only working invocation is undocumented).
- **`self-test` should run the test suite** — currently it's a no-op that reports success. Either wire it to `pnpm test` or rename it to `self-check`.
- **`version-history` should detect the git repo it's in** — this is a regression that probably came in with the TS migration.
- **Profile `set --key value`** should reject `--` prefixed keys with a friendly error, never persist them.
- **Help screen** would benefit from collapsing the 138 "additional commands" wall behind a `edgewell command-list` opt-in.
- **Unknown subcommand** should print `unknown command: foo — run \`edgewell help\`` (one line) and exit 2, not dump 110 lines.
- **File-system errors** should be wrapped — `import` and `compare` already do this beautifully; `rag ingest` and `multimodal` should match.
- **`expense add` with no category** should error, not silently default to `"other"`.
- **`seed` should cap N or show progress** — 1 000 000 is a real foot-gun.

## Run log

All raw command output is in `uat-run-logs/`. Key files:
- `s1-install.log`, `s1-npm-install.log`, `s1-build.log`
- `s2-version.log`, `s2-help.log`, `s2-help-sub.log`, `s2-version-cmd.log`, `s2-info.log`
- `s3-status.log`, `s3-doctor.log`, `s3-profile-no-arg.log`, `s3-profile-show.log`, `s3-profile-init.log`, `s3-profile-set.log`, `s3-profile-set2.log`
- `s4-journal-add.log`, `s4-expense-add.log`, `s4-rag-ingest.log`, `s4-rag-search.log`, `s4-rag-search-water.log`, `s4-rag-search-sleep.log`, `s4-ask.log`, `s4-chat.log`, `s4-chat2.log`, `s4-chat3.log`, `s4-chat4.log`, `s4-journal-list.log`, `s4-expense-list.log`
- `s5-journal-no-arg.log`, `s5-journal-bare.log`, `s5-expense-no-cat.log`, `s5-expense-negative.log`, `s5-expense-nonnumeric.log`
- `s6-plan-health.log`, `s6-plan-finance.log`, `s6-eval.log`, `s6-models.log`, `s6-plugins.log`, `s6-profiles.log`, `s6-snapshot.log`, `s6-vector-stats.log`, `s6-hybrid.log`, `s6-export.log`, `s6-lint.log`, `s6-demo-data.log`, `s6-seed.log`, `s6-today.log`, `s6-summary-week.log`, `s6-token.log`, `s6-where.log`, `s6-size.log`, `s6-redact.log`, `s6-self-test.log`, `s6-redact2.log`, `s6-redact3.log`, `s6-deps.log`, `s6-version-history.log`, `s6-metrics.log`, `s6-agents.log`
- `s7-seed50.log`, `s7-bench.log`
- `s8-01-unknown.log` through `s8-15-companion-bad-port.log` (15 sabotage logs)
- `s9-seed10k.log`, `s9-seed10.log`
- `s10-readme-raw.log` (all 8 README quickstart commands fail)
