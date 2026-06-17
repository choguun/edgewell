# EdgeWell v3.0.0 Troubleshooting

Common problems and how to fix them.

## `npm install` fails

EdgeWell's `@qvac/sdk` dependency is a `link:./vendor/qvac-sdk`
reference. npm does not support the `link:` URL type and fails
with `EUNSUPPORTEDPROTOCOL` regardless of `--legacy-peer-deps` or
any other flag.

**Use pnpm** (the version is pinned in `package.json`):

```bash
pnpm install
pnpm build
```

`@qvac/sdk` is loaded lazily; the CLI still works without a
real model installed — the chat and ask commands return a stub
completion until a real model is loaded.

## `edgewell doctor` complains about the data dir

`doctor` expects the data directory to be writable. Create it
manually if it does not exist:

```bash
mkdir -p ~/.edgewell/data
```

## `edgewell companion` exits with "EADDRINUSE"

Another process is already listening on the requested port. Pick a
different port:

```bash
edgewell companion --port 9000
```

Or stop the process that owns the port. On macOS / Linux:

```bash
lsof -i :8787
kill <pid>
```

## `edgewell rag search` returns no hits

The RAG index is empty. Ingest some text first:

```bash
edgewell rag ingest data/sample_health_notes_v3.txt
edgewell rag search "how much water should I drink"
```

## `edgewell hybrid "<query>"` returns duplicate hits

Hybrid search returns one hit per retriever that surfaces a chunk.
The re-ranker sorts them, so duplicates that share an id
collapse. If you still see duplicates, the lexical and vector
retrievers are returning different chunks — that is expected
behaviour and the re-ranker will put the better one on top.

## Token expired errors from the companion server

Companion bearer tokens have a default TTL of one hour. Re-mint:

```bash
edgewell token my-phone
```

Paste the new token into the web UI's `localStorage`:

```js
localStorage.setItem("edgewell.token", "<paste-token>");
```

## Performance is slow on a Raspberry Pi

Apply the `tinkerer` profile:

```bash
edgewell profiles apply tinkerer
```

This picks a smaller model and a tighter RAG chunk size.

## Tests fail on first run

Make sure you are on Node.js >= 22.17. Earlier versions do not
include the `node:test` runner features that v3.0.0 relies on.

```bash
node --version
```

If you are on an older Node, use the Bare runtime instead.

## Still stuck?

Open an issue on GitHub with:

- `edgewell info` output
- `edgewell doctor` output
- The exact command and its output
- A short description of what you expected to happen
