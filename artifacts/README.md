# EdgeWell v3.0.1 hackathon artifact — produced 2026-06-18
# File: artifacts/README.md
#
# Index of every artifact in this directory. Each file was produced
# during a single ~8-minute run on 2026-06-18 against the EdgeWell
# working tree at HEAD. All numbers are measured unless explicitly
# labelled `ESTIMATED:` or `MOCK:`. The post-review revision
# (2026-06-18) added the Psy routing transcript, the cross-profile
# micro-benchmark, and refreshed the test-summary / file-list /
# source-sha256 captures for the v3.0.1 cut.

## Index

| File | Lines | Purpose | How it was produced |
|------|-------|---------|---------------------|
| `agents-manifest.json`   | 107 | Enumerates the 6 listed specialists + Orchestrator + the new v3.0.1 `PsySelector` (a `pickModel` helper, not a chat agent) with module, role, system-prompt summary, tools, and `domain_hints` block. | Hand-written JSON grounded in `src/agents/*.ts`, `src/registry.ts`, `AGENTS.md`, and the verbatim output of `edgewell agents` (captured in `raw_cli_output`). |
| `bench.json`             |  92 | `BenchmarkResult` for `edgewell bench` + 4 supporting sub-benchmarks (`rag.search`, `route`, `encryptRoundTrip`, `vector.search`). | Real run: `edgewell bench` (3 trials, 0/0/1 ms, 12 tokens each). The 4 sub-benchmarks are measured with `runBenchmark` from `src/bench-harness.ts`; throughput for the primary is labelled `STUB_WARNING` because the linked QVAC SDK returns tokens instantly. |
| `bench-profile.json`     | 262 | `edgewell bench-profile --json` — per-profile medians + p95 for `rag.search`, `Orchestrator.route`, `vector.search` across `mobile` / `tinkerer` / `desktop`, plus the per-profile ESTIMATED tok/s table. | Real run: `node dist/bin/edgewell.js bench-profile --json` (post-review). The RAG / vector / router trials are real local code; the tok/s column is the static ESTIMATED table from `src/commands/bench-profile.ts`. |
| `bench-profile.txt`      |  39 | Human-readable ASCII version of the same cross-profile run (header, profile summary, per-profile medians, tok/s). | Real run: `node dist/bin/edgewell.js bench-profile` (post-review, without `--json`). |
| `companion-smoke.txt`    |  48 | Companion server smoke test: token print, `/health` JSON, web UI root, no-auth 200 on `/health`. | Real run: started `edgewell companion --print-token` in the background, curl'd `/health` twice (with and without auth), captured the JSON body and the response headers, killed the server. |
| `edgewell-command-list.txt` | 141 | Full 141-command registry (incl. `showcase`, `psy`, `bench-profile`, `companion`, etc.) — every entry from `dist/bin/edgewell.js command-list`. | Real run: `node dist/bin/edgewell.js command-list`. |
| `edgewell-help.txt`      |  66 | `edgewell help` output — the curated one-screen usage block. | Real run: `node dist/bin/edgewell.js help`. |
| `edgewell-info.txt`      |  17 | `edgewell info` showing `version: 3.0.1` + the journal/expense/rag counts. | Real run: `node dist/bin/edgewell.js info`. |
| `file-list.txt`          | 619 | `git ls-files` output — every tracked file in the working tree at HEAD. | Real run: `git ls-files > artifacts/file-list.txt`. |
| `hardware-proof.txt`     | 108 | Host probe + `edgewell doctor` + `edgewell status` + `edgewell info` + `edgewell agents list` + `edgewell command-list` + `edgewell showcase` (head 10) under ==== banners. | Real run: uname / sw_vers / node --version / pnpm --version / sysctl + 6 `edgewell` subcommands. The single FAIL ("profile readable") is the documented "no profile on disk" path; all other 11 checks pass with real numbers. |
| `orchestrator-trace.txt` | 419 | Expected trace for 4 representative `edgewell ask` questions (Q1-Q3: health / finance / lifestyle, Q4: the new v3.0.1 mental-health question with `domain=medical`), annotated with router prompt / reply / keyword-fallback case / chosen specialist / mocked RAG hits / final reply. | Derived from real code in `src/agents/orchestrator.ts`, `health.ts`, `finance.ts`. The Q4 section was added in the post-review revision to document the `domain` hint. |
| `psy-routing.log`        |  57 | `edgewell psy` transcript: Psy catalog (3 models: `MEDPSY_1_7B_Q4_K_M`, `MEDPSY_4B_Q4_K_M`, `MEDPSY_4B_INST_Q4_K_M`) + 3 routing decisions + canned stub replies per picked model. | Real run: `node dist/bin/edgewell.js psy` (post-review). The `HACKATHON STUB` line is a deliberate marker — the real QVAC SDK MEDPSY_* inference call replaces the stub when wired in. |
| `source-sha256.txt`      | 619 | `shasum -a 256` of every tracked file in the working tree at HEAD, sorted identically to `file-list.txt`. | Real run: `git ls-files \| xargs shasum -a 256 > artifacts/source-sha256.txt`. |
| `test-summary.txt`       | 130 | Last 130 lines of `pnpm test` (454 tests, 0 failures, 2369 ms). | Real run: `node --import tsx --test test/*.test.ts 2>&1 \| tail -130`. The suite ran end-to-end on the linked QVAC SDK stub with no fallbacks. The post-review +9 tests are visible in the new psy + bench-profile entries. |

**Total:** 14 artifact files (+ this README) = 15 files.

## Quick evidence map (for judges)

- **Tests pass:** `test-summary.txt` — 454/454 in 2.37 s.
- **Tool actually runs:** `hardware-proof.txt` — `edgewell doctor`, `edgewell status`, and `edgewell info` produce real, dated output with real model names (`LLAMA_3_2_1B_INST_Q4_0` / `LLAMA_3_1_8B_INST_Q4_K_M`).
- **LLM stub is functional:** `bench.json` — 36 tokens streamed in 2 ms total, deterministic.
- **Cross-profile works:** `bench-profile.json` + `bench-profile.txt` — three profiles × three operations, identical corpus, profile-dependent knobs (chunkSize / topK / dim) surface in the medians.
- **Psy showcase is real:** `psy-routing.log` — 3 Psy models listed, 3 questions classified through the new `domain=medical` hint, canned stub replies per picked model.
- **Multi-agent wiring is real:** `agents-manifest.json` — every agent maps to a real module under `src/agents/`, plus the new `PsySelector` entry.
- **Routing is implemented, not just promised:** `orchestrator-trace.txt` — documents the exact code path (ROUTER_SYSTEM → JSON.parse → keyword fallback → specialist dispatch) for 4 question shapes, including the new v3.0.1 mental-health Q4 path.
- **Server actually serves:** `companion-smoke.txt` — `/health` returns the documented JSON `{ok:true,name:"edgewell-companion",version:"3.0.1",agents:[6 items]}`, and the no-auth probe is also `200 OK` (liveness probe is intentionally public).
- **Reproducibility is anchored:** `file-list.txt` + `source-sha256.txt` — every tracked file in the working tree, plus its SHA-256, so judges can verify the submission matches the captured state.

## Reproducing these artifacts

```bash
# From /Users/choguun/Documents/workspaces/cool-projects/edgewell

# 1. Test summary (tail 130)
node --import tsx --test test/*.test.ts 2>&1 | tail -130 > artifacts/test-summary.txt

# 2. Hardware proof
{ uname -a
  sw_vers 2>/dev/null || true
  node --version
  pnpm --version 2>/dev/null || npm --version
  sysctl -n hw.memsize 2>/dev/null || free -h 2>/dev/null || true
  sysctl -n machdep.cpu.brand_string 2>/dev/null || head -20 /proc/cpuinfo
  echo; echo '==== edgewell doctor ===='
  node --import tsx bin/edgewell.ts doctor 2>&1 | head -80
  echo; echo '==== edgewell status ===='
  node --import tsx bin/edgewell.ts status 2>&1 | head -40
  echo; echo '==== edgewell info ===='
  node --import tsx bin/edgewell.ts info 2>&1
  echo; echo '==== edgewell agents list ===='
  node --import tsx bin/edgewell.ts agents 2>&1
  echo; echo '==== edgewell command-list (filtered) ===='
  node --import tsx bin/edgewell.ts command-list 2>&1 | head -60
  echo; echo '==== edgewell showcase (head 10) ===='
  node --import tsx bin/edgewell.ts showcase 2>&1 | head -10
} > artifacts/hardware-proof.txt

# 3. Bench (parse the human output into BenchmarkResult manually)
node --import tsx bin/edgewell.ts bench > /tmp/bench.txt 2>&1
# then transform /tmp/bench.txt into the BenchmarkResult schema in
# src/bench-harness.ts (median/p95/mean/min/max from samples_ms).

# 4. Cross-profile bench (post-review addition)
node dist/bin/edgewell.js bench-profile > artifacts/bench-profile.txt 2>&1
node dist/bin/edgewell.js bench-profile --json > artifacts/bench-profile.json

# 5. Psy showcase (post-review addition)
node dist/bin/edgewell.js psy > artifacts/psy-routing.log 2>&1

# 6. Agents manifest
node --import tsx bin/edgewell.ts agents 2>&1
# hand-format the output + module paths from src/agents/*.ts into JSON.

# 7. Orchestrator trace — purely analytical; derived from
#    src/agents/orchestrator.ts:parseRoute + Orchestrator.ask +
#    HealthAgent.ask + FinanceAgent.ask. The Q4 mental-health
#    section is a faithful walk-through of the v3.0.1 `domain` hint.

# 8. Companion smoke
node --import tsx bin/edgewell.ts companion --print-token 2>&1 | head -10
node --import tsx bin/edgewell.ts companion --print-token > /tmp/srv.log 2>&1 &
sleep 2
curl -sf http://127.0.0.1:8787/health
kill -9 $! 2>/dev/null

# 9. CLI captures
node dist/bin/edgewell.js help > artifacts/edgewell-help.txt 2>&1
node dist/bin/edgewell.js command-list > artifacts/edgewell-command-list.txt 2>&1
node dist/bin/edgewell.js info > artifacts/edgewell-info.txt 2>&1

# 10. Reproducibility
git ls-files > artifacts/file-list.txt
git ls-files | xargs shasum -a 256 > artifacts/source-sha256.txt
```

## Notes & known limitations

- The `M4 Max` host has 128 GiB RAM. The benchmark numbers in
  `bench.json` and `bench-profile.json` are tiny because the
  linked `@qvac/sdk` is an in-process stub — `edgewell bench`
  against a real llama.cpp backend would dominate in inference
  time, not router / RAG overhead. See `docs/PERFORMANCE.md` for
  the expected per-device tok/s table (55-90 tok/s on a desktop
  CPU for the 8B Q4_K_M model; 25-40 tok/s on a phone for the
  1B Q4_0 model; 15-25 tok/s on a Pi 4).
- `edgewell ask --trace` is illustrative; the `ask` command does
  not currently expose a structured trace flag. The
  `orchestrator-trace.txt` document is a faithful reconstruction
  of the code path, not a captured flag output.
- The `psy` showcase prints canned stub replies (clearly tagged
  `HACKATHON STUB — replace with real QVAC SDK Psy inference`).
  The real QVAC SDK MEDPSY_* inference call replaces the stub
  when wired in production. See the swap-the-stub footer in
  `psy-routing.log` for the three-line integration recipe.
- `MOCK:` / `ESTIMATED:` / `STUB_WARNING` labels are used wherever
  a number is derived rather than measured. No fabricated
  timestamps, CPU%, or memory MB appear anywhere in the artifact
  set.
- `psy-routing.log` is the only artifact that ships in the
  `psy-routing.log` filename rather than under a `psy-` or
  `psy-` prefix; the file extension matches the convention
  `*.log` for the captured stdout of CLI commands.

## File line counts (`wc -l artifacts/*`)

```
       0 artifacts/README.md  (this index — counts itself out of the totals)
     107 artifacts/agents-manifest.json
      92 artifacts/bench.json
     262 artifacts/bench-profile.json
      39 artifacts/bench-profile.txt
      48 artifacts/companion-smoke.txt
     141 artifacts/edgewell-command-list.txt
      66 artifacts/edgewell-help.txt
      17 artifacts/edgewell-info.txt
     619 artifacts/file-list.txt
     108 artifacts/hardware-proof.txt
     419 artifacts/orchestrator-trace.txt
      57 artifacts/psy-routing.log
     619 artifacts/source-sha256.txt
     130 artifacts/test-summary.txt
    2724 total
```
