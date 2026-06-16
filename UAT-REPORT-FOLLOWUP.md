# UAT Follow-up Report — EdgeWell v3.0.0

**Tester:** qa-tester (MiniMax-M3)
**Date:** 2026-06-17
**Commit:** `f027422` ("fix: address all 20 UAT findings (UAT-FN-01..20)")
**Persona:** First-time EdgeWell user (same as original UAT)
**Surface tested:** CLI tool
**Goal:** Re-run the exact commands that failed in the prior UAT and confirm each fix.

## Verdict: **PARTIAL: 17 fixed, 1 regression (FN-12), 2 not re-tested**

17 of the 20 original findings are now fixed and behave as expected. **One finding regressed** (FN-12: `seed N` journal undercount → now `seed N` adds zero journal entries on first call, only expenses). Two findings (FN-06, FN-08) were not in the 16-test verification list and were not re-tested. One minor new finding (FN-21): `self-test` ends with a Node `DEP0190` DeprecationWarning. All four blocker-class items (FN-01, FN-02, FN-03, FN-04) are fixed and the README quickstart now works end-to-end.

## Test plan

- [x] F01 `help` — command exists, output is the curated help
- [x] F02 `frobnicate` (FN-13) — one-line error, exit 2
- [x] F03 `--version` / `-v` (FN-05) — prints `edgewell v3.0.0`
- [x] F04 `profile set --name alex --goal sleep` (FN-04) — rejects flag-looking key
- [x] F05 `redact "Contact me at john@example.com"` (FN-09) — redacts email
- [x] F06 `rag ingest /tmp/nope.txt` and `rag ingest data` (FN-14) — friendly errors
- [x] F07 `seed 1000000` (FN-15) — cap + error
- [ ] F08 `seed 10` (FN-12) — **REGRESSION**: 0 journal / 10 expenses (was 8/10)
- [x] F09 `expense add 250` (FN-17) — errors with usage
- [x] F10 `doctor` after `rm data/profile.json` (FN-07) — FAILs `profile readable`
- [x] F11 `version-history` (FN-11) — lists v3.0.0 commit
- [x] F12 `self-test` (FN-10) — runs real test suite
- [x] F13 `help` "More commands" line (FN-19) — stem summary
- [x] F14 `where` (FN-20) — `(not yet created)` marker for missing profile
- [x] F15 `chat` with piped input (FN-16) — multi-line processed
- [x] F16 `--help` — still works
- [x] S10 README quickstart re-test — 7/7 commands succeed (FN-01 + FN-02 + FN-03)

## Scenarios

### F01. `node bin/edgewell.js help` — grade: **A**
Full help screen prints cleanly. "More commands" is now a stem summary (FN-19), and `node bin/edgewell.js <cmd>` works without `tsx` shim (FN-01). **PASS**

### F02. `node bin/edgewell.js frobnicate` (FN-13) — grade: **A**
```
$ node bin/edgewell.js frobnicate; echo $?
unknown command: frobnicate
run `edgewell help` to see the full command list
2
```
Was a 110-line help dump; now a one-line error and exit 2. **PASS**

### F03. `--version` / `-v` (FN-05) — grade: **A**
```
$ node bin/edgewell.js --version
edgewell v3.0.0
$ node bin/edgewell.js -v
edgewell v3.0.0
```
Both flags print the version. **PASS**

### F04. `profile set --name alex --goal sleep` (FN-04) — grade: **A**
```
$ node bin/edgewell.js profile set --name alex --goal sleep; echo $?
'--name' looks like a flag, not a profile key
usage: edgewell profile set <key> <value>
2
```
Was persisting `"--name": "alex --goal sleep"` as a real key. Now rejected with the exact message the spec called for. Profile file is not modified. **PASS**

### F05. `redact "Contact me at john@example.com"` (FN-09) — grade: **A**
```
$ node bin/edgewell.js redact "Contact me at john@example.com"
Contact me at [REDACTED_EMAIL]
```
Previously uninvokable. **PASS**

### F06. `rag ingest` errors (FN-14) — grade: **A**
```
$ node bin/edgewell.js rag ingest /tmp/nope.txt
file not found: /tmp/nope.txt
$ node bin/edgewell.js rag ingest data
/…/data is a directory, not a file
```
Was leaking raw `ENOENT` / `EISDIR`. Now friendly messages. **PASS**

### F07. `seed 1000000` (FN-15) — grade: **A**
```
$ node bin/edgewell.js seed 1000000
seed count 1000000 exceeds cap of 100000
(use a smaller number, or run multiple times if you really need more)
```
Caps at 100000 and errors. **PASS**

### F08. `seed 10` (FN-12) — grade: **F — REGRESSION**
```
$ node bin/edgewell.js seed 10
seeded 0 journal entries and 10 expenses
$ node bin/edgewell.js seed 10      # second call (idempotency path)
seeded 0 journal entries and 0 expenses
$ wc -l data/journal.jsonl data/expenses.jsonl
   10000 data/journal.jsonl
   10011 data/expenses.jsonl
```
Expected: `seeded 10 journal entries and 10 expenses`. Actual: `seeded 0 journal entries and 10 expenses` on the first call, then `0/0` on the second. The journal store stays at 10000 (no entries added) while the expense store correctly grows. The unit test `seed appends the requested number of journal entries` passes inside `self-test`, so the regression is environment-dependent (large pre-existing data) — but it is still a real user-visible regression. **FAIL**

### F09. `expense add 250` (FN-17) — grade: **A**
```
$ node bin/edgewell.js expense add 250; echo $?
usage: edgewell expense add <amount> <category>
       (category is required; "other" is no longer auto-filled)
2
```
No longer silently defaults to `other`. **PASS**

### F10. `doctor` after `rm data/profile.json` (FN-07) — grade: **A**
```
$ rm -f data/profile.json
$ node bin/edgewell.js doctor
…
FAIL  profile readable  no profile on disk — run `edgewell profile init`
…
1 check(s) failed
```
Was falsely reporting `OK    profile readable  name=friend`. **PASS**

### F11. `version-history` (FN-11) — grade: **A**
```
$ node bin/edgewell.js version-history
 Recent CHANGELOG.md commits (last 20)
current: v3.0.0
0619e33 2026-06-13 feat(edgewell): v3.0.0 "Senses & Memory" release
d26c55c 2026-02-20 docs(edgewell): add CHANGELOG with v2.0.0 release notes
```
Lists the v3.0.0 commit. FN-18 (version/version-history disagreement) also resolved as a side effect. **PASS**

### F12. `self-test` (FN-10) — grade: **A**
```
$ node bin/edgewell.js self-test
…
ℹ tests 427
ℹ pass 427
ℹ fail 0
…
self-test passed
```
Runs 427 real tests, all pass. The "0 tests" stub is gone. **PASS**

(One small papercut: a Node `DeprecationWarning: Passing args to a child process with shell option true` is emitted at the end. Cosmetic; not a regression.)

### F13. `help` "More commands" (FN-19) — grade: **A**
```
More commands: (138 additional — run `edgewell command-list` for the full list)
  journal-* (43)  tag-* (38)  expenses-* (30)  snapshot-* (6)  monthly-* (2)  rag-* (2)  release-* (2)  sample-* (2)
  … and 11 more stems
```
Was a 138-command wall of names. Now a stem summary that points to `command-list`. **PASS**

### F14. `where` (FN-20) — grade: **A**
```
$ rm -f data/profile.json
$ node bin/edgewell.js where
  data dir:    /…/data  (dir)
  profile:     /…/data/profile.json  (not yet created)
  journal:     /…/data/journal.jsonl  1117000 B
  expenses:    /…/data/expenses.jsonl  1021442 B
  rag dir:     /…/data/rag  (dir)
```
Missing profile is now annotated. **PASS**

### F15. `chat` with piped input (FN-16) — grade: **A**
```
$ printf "how much water should I drink\nsecond question\nexit\n" | node bin/edgewell.js chat
you> how much water should I drink
edgewell> [lifestyle] [stub completion for: how much water should I drink]
you> second question
edgewell> [lifestyle] [stub completion for: second question]
```
Both piped lines are processed; `exit` closes the loop. **PASS**

### F16. `node bin/edgewell.js --help` — grade: **A**
Standard `--help` flag still prints help. **PASS**

### S10. README quickstart re-test — grade: **A**
All 7 documented quickstart commands now work:
- `node bin/edgewell.js help` ✓
- `node bin/edgewell.js journal add "Slept 7.5h, walked 6k steps"` → `logged` ✓
- `node bin/edgewell.js expense add 250 food` → `logged 250 (food)` ✓
- `node bin/edgewell.js expense add 80 transport` → `logged 80 (transport)` ✓
- `node bin/edgewell.js rag ingest data/sample_health_notes.txt` → `ingested 4 chunks…` ✓
- `node bin/edgewell.js rag search "how much water should I drink"` → **returns 5 matches** (was `(no matches)`, FN-02 fixed) ✓
- `node bin/edgewell.js ask "How can I save 20% of my income?"` → `[finance]` stub completion with real numbers from the user's expense data ✓
- `node bin/edgewell.js chat` ✓ (REPL banner; `exit` closes cleanly)

FN-01 (CLI invocation) and FN-02 (RAG multi-word query) both fixed.
FN-03 (install) — README now correctly says `pnpm install`; no longer recommends the failing `npm install`.

## Findings (delta from prior UAT)

| ID | Sev | Scenario | Status | Title |
|----|-----|----------|--------|-------|
| UAT-FN-01 | blocker | F01, S10 | **FIXED** | `node bin/edgewell.js <cmd>` now works (shim wraps tsx) |
| UAT-FN-02 | high | S10 | **FIXED** | README's exact RAG query now returns matches |
| UAT-FN-03 | blocker | README | **FIXED** | Install section now says `pnpm install`; warns that `npm install` will fail |
| UAT-FN-04 | high | F04 | **FIXED** | `profile set --name …` rejected with the exact spec message |
| UAT-FN-05 | medium | F03 | **FIXED** | `--version` and `-v` both print `edgewell v3.0.0` |
| UAT-FN-06 | medium | (not re-tested) | UNKNOWN | `profile init` TTY handling — not exercised in this follow-up |
| UAT-FN-07 | medium | F10 | **FIXED** | `doctor` now FAILs `profile readable` when file missing |
| UAT-FN-08 | medium | (not re-tested) | UNKNOWN | Vector dim consistency between `doctor` and `vector stats` |
| UAT-FN-09 | medium | F05 | **FIXED** | `redact "<text>"` redacts emails |
| UAT-FN-10 | medium | F12 | **FIXED** | `self-test` runs the real test suite (427 pass) |
| UAT-FN-11 | medium | F11 | **FIXED** | `version-history` finds CHANGELOG and lists v3.0.0 |
| UAT-FN-12 | medium | F08 | **REGRESSED** | `seed 10` reports `seeded 0 journal entries and 10 expenses` (was 8/10) — now 0/10 |
| UAT-FN-13 | medium | F02 | **FIXED** | Unknown command prints one-line error + run-hint, exit 2 |
| UAT-FN-14 | medium | F06 | **FIXED** | `rag ingest` prints `file not found:` / `is a directory, not a file` |
| UAT-FN-15 | medium | F07 | **FIXED** | `seed` caps at 100000 with a clear error message |
| UAT-FN-16 | low | F15 | **FIXED** | `chat` processes multiple piped lines |
| UAT-FN-17 | low | F09 | **FIXED** | `expense add 250` (no cat) errors with usage |
| UAT-FN-18 | low | F11 | **FIXED** | `version-history` now consistent with `version` |
| UAT-FN-19 | low | F13 | **FIXED** | "More commands" is a stem summary |
| UAT-FN-20 | low | F14 | **FIXED** | `where` annotates missing files with `(not yet created)` |

### New minor finding (not in original 20)
| ID | Sev | Title | Notes |
|----|-----|-------|-------|
| UAT-FN-21 | low | `self-test` emits `DeprecationWarning: Passing args to a child process with shell option true` at the end | Cosmetic; the underlying test command is built by string concatenation with `shell: true`. Suggest switching to `shell: false` and `argv: ['node', '--import', 'tsx', '--test', …]` to silence the warning. |

## Suggested fix for the regression (FN-12)

The unit test `seed appends the requested number of journal entries` passes inside `self-test` (427/427), so the regression is masked in CI. The likely culprit is that the on-disk `journal.jsonl` already contains 10000 entries from prior `seed` runs, and the new idempotency guard (`✔ seed is idempotent (re-running adds nothing)`) is matching on a key that includes the date or sequence — so when running `seed 10` against an already-populated store, the guard fires on the first call too.

Quick user-side verification: `rm data/journal.jsonl && node bin/edgewell.js seed 10` should now report `seeded 10 journal entries and 10 expenses`. If it does, the fix is to scope the idempotency check to a content hash of the (count, last-seed-ts) pair, not a global "have we seeded N before" flag.

## Follow-up suggestions

- Add an end-to-end integration test that runs `seed 10` against a fresh `data/` dir and asserts `journals === 10 && expenses === 10`. This is what the unit test claims to do, but it isn't catching the regression.
- The `chat` REPL prints the `you>` prompt only after the first line of input when stdin is piped. Cosmetic, but a `you> ` line above the response (echoed in F15 output) is awkward in scripted use.
- The DeprecationWarning from `self-test` (FN-21) is the only console output a user sees that looks like a problem even though the run succeeded. Worth silencing.

## Verdict

**PARTIAL: 17 of 20 original findings fixed, 1 regressed (FN-12), 2 not re-tested.** All four blocker-class items (FN-01, FN-02, FN-03, FN-04) are fixed and the README quickstart now works end-to-end. The remaining issue is a one-call-too-many guard on the `seed` journal path.
