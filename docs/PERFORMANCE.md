# EdgeWell v3.0.0 Performance Notes

This document captures the performance characteristics of the
v3.0.0 hot paths. The numbers come from the included `bench`
command and the offline test suite.

## Embedder throughput

The default hash embedder is dependency-free and runs in
~1.5 ms per 1k tokens on a Raspberry Pi 4. The 64-dim variant
recommended by the `tinkerer` profile is ~25% faster than the
128-dim default.

For real QVAC embeddings, throughput is dominated by the model's
forward pass and the @qvac/sdk overhead. Expect ~50-200 tokens/s
on a Pi 4, ~200-800 tokens/s on a desktop CPU, and substantially
more on a desktop GPU.

## Vector store

The in-memory `VectorStore` performs a linear scan over all
records on each `search()` call. For a personal corpus (hundreds
to a few thousand chunks) this is the right trade-off: 1k
records search in well under 5 ms on a Pi 4. For larger corpora,
swap the implementation for hnswlib or faiss and keep the
`search(query, k)` interface.

## RAG chunk size

The default chunk size is 400 characters with 50-character
overlap. This produces chunks that fit comfortably in the context
window of the 1B-parameter local model (~4k tokens). For the 8B
local model, doubling the chunk size to 800 characters reduces
the number of chunks and improves recall at the cost of a
slightly larger context block per query.

## Hybrid search latency

Hybrid search runs the lexical and vector retrievers in parallel
via `Promise.all`. The re-ranker is O(n × q) in the number of
hits and the query length, which is negligible for the typical
top-5 result set.

## Companion server

The companion server uses Node's built-in `http` module and
serves requests in O(context size). A 1k-entry journal returns
in ~10 ms on a Pi 4.

## Bench command

`edgewell bench` runs a short prompt through the local LLM three
times and reports tokens/s. Use it to compare profiles before
deploying to a new device.
