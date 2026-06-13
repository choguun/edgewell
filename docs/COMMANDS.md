# EdgeWell v3.0.0 Command Reference

A complete list of v3.0.0 commands, grouped by area. Use
`edgewell help` for the on-screen version.

## Core chat and P2P

- `chat` — interactive REPL chat (routes to specialists).
- `ask "<question>"` — one-shot question, streamed.
- `serve` — start a P2P server hosting the delegate model.
- `companion` — start the v3.0.0 mobile companion HTTP server.

## Journal

- `journal add <text>` — append a journal entry.
- `journal list` — list recent journal entries (alias: `tail`).
- `journal find <tag>` — list entries with a given tag.
- `journal-stats` — counts, average length, top tags.
- `journal-count` — per-tag breakdown.
- `journal-by-tag <tag>` — entries carrying a tag.
- `journal-find <tag>` — same as `journal-by-tag` (alias).
- `journal-strip <tag>` — remove a tag from every entry.
- `journal-rm <id>` — mark an entry as removed.
- `journal-restore <id>` — undo a `journal-rm`.
- `journal-rm-restore` — round-trip alias.

## Expenses

- `expense add <amount> <category>` — append an expense.
- `expense list` — list recent expenses.
- `expenses-stats` — totals, range, per-category.
- `expenses-count` — per-category counts.
- `expenses-find <category>` — entries in a category.
- `expenses-by-day` — daily totals with an ASCII bar chart.

## Tags

- `tags` — top journal tags by count.
- `tag-stats` — per-tag count, first, last.
- `tag-cloud` — ASCII tag cloud.
- `tags-add <id> <tag>` — add a tag to a specific entry.
- `tag-rm <id> <tag>` — remove a tag from a specific entry.
- `tag-rename <old> <new>` — rename a tag everywhere.
- `retag <from> <to>` — rewrite a tag everywhere.

## RAG

- `rag ingest <file>` — index a text file.
- `rag search "<query>"` — search the lexical RAG index.
- `vector search|stats|clear` — interact with the v3.0.0 vector
  RAG.
- `hybrid "<query>"` — fused lexical + vector search.

## Multimodal

- `multimodal <file>` — ingest image, audio, or text into RAG.
- `sensors ingest <file.jsonl>` — process wearable sensor data.
- `sensors summarise <file.jsonl>` — print a sensor summary.

## Profiles

- `profile show|set|init` — view or update the user profile.
- `profile-reset` — clear the on-disk profile.
- `profile-export <file>` — write the profile to a JSON file.
- `profile-import <file>` — read the profile from a JSON file.
- `profiles list|show|apply` — manage form-factor profiles.

## Companion

- `companion` — start the HTTP server.
- `token [subject]` — mint a companion bearer token.
- `rotate-secret` — generate and save a new companion secret.

## Plugins

- `plugins list` — list plugin files in `EDGEWELL_PLUGINS`.
- `plugins run` — load and run the plugins.

## Stats and observability

- `info` — one-screen overview.
- `size` — on-disk size of the data files.
- `where` — resolved on-disk file paths.
- `where-rag` — resolved RAG paths only.
- `metrics` — in-process counters and histograms.
- `deps` — runtime and dev dependencies.

## Lifecycle

- `self-test` — run the project test suite.
- `ci` — local GitHub Actions checks.
- `ci-summary <log>` — parse a test log.
- `test-summary <log>` — same as `ci-summary` (alias).
- `lint` — data integrity check.
- `lint-fix` — auto-fix empty journal entries.
- `lint-summary` — JSON integrity summary.
- `dedup` — scan for duplicates.
- `version` — print the package version.
- `version-history [N]` — last N CHANGELOG.md commits.
- `release-notes [version]` — print the CHANGELOG entry for a
  version.

## Data and backup

- `export <file>` — write a portable JSON dump.
- `import <file>` — merge a JSON dump into the stores.
- `compare <a> <b>` — diff two export files.
- `snapshot` — dump profile + journal + expenses as JSON.
- `snapshot-redact <in> <out>` — write a PII-masked snapshot.

## Productivity

- `agents` — list the v3.0.0 agent bundle.
- `demo-data` — load the bundled sample data.
- `sample-journal` — write a small synthetic journal.
- `sample-questions` — list canned prompts.
- `seed <N>` — append N synthetic entries.
- `today` — today's journal and expenses.
- `yesterday` — yesterday's journal and expenses.
- `headlines` — one trimmed line per recent entry.
- `grep <pattern>` — substring search of the journal.
- `word-count` — journal word and character counts.
- `word-count-advanced` — per-tag word counts.
- `notes` — free-form notes (entries with the `note` tag).
- `todo` — checklist from `profile.todos`.
- `weekly-goals` — checklist from `profile.weeklyGoals`.
- `weekly-review` — summary of the last 7 days.
- `monthly-review` — summary of the current month.
- `trend <metric>` — extract a metric series.
- `sleep-stats` — summarise sleep entries.
- `sleep-trend` — ASCII chart of recent sleep.
- `prompt <agent>` — render a prompt template.
- `snippet <agent>` — same as `prompt` (alias).
- `budget <income>` — print a simple monthly breakdown.
- `savings-rate` — compute the current month's savings rate.
- `diff <id-a> <id-b>` — diff two journal entries.
- `scripts` — list user scripts in `~/.edgewell/scripts/`.

## Utility

- `help` — print the help screen.
- `bench` — LLM throughput benchmark.
- `bench-compare` — A/B benchmark.
- `bench-compare` — same (alias).
- `eval <expr>` — calculator one-shot.
- `watch [intervalMs]` — poll for file size changes.
- `rot13 <text>` — ROT13 encoding (demo).
- `version-history` — same as `version-history` (alias).
