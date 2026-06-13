# EdgeWell v3.0.0 Deployment Guide

This guide walks through installing and running EdgeWell v3.0.0 on
each of the three supported form factors: a phone, a $50
single-board computer, and a laptop. All three share the same code
base; the difference is the **profile** you apply.

## Prerequisites

- Node.js **>= 22.17** (or the [Bare](https://bare.pears.com)
  runtime if you target mobile and want a tiny binary).
- For QVAC model loading: a working `@qvac/sdk` install and enough
  disk/RAM for the chosen model.

## Common: pick a profile

The three profiles live in `src/profiles.js` and are exposed via
`edgewell profiles`:

```bash
edgewell profiles list
edgewell profiles show mobile
edgewell profiles apply tinkerer
```

`apply` currently prints a confirmation; in a future release it
persists to `~/.edgewell/profile.json` and the CLI loads it on
startup.

## Mobile (phone or tablet)

1. Install the `@qvac/sdk` peer dependencies.
2. Run the companion server on a desktop EdgeWell node.
3. Open the web UI on the phone and pair using the bearer token
   printed by `edgewell companion --print-token`.

For a phone-only setup, run `edgewell ask "<question>"` directly
on the device. With the **mobile** profile, EdgeWell uses the
1B-parameter local model and a small RAG context window.

## Tinkerer (Raspberry Pi 4/5)

1. Flash Raspberry Pi OS Lite (64-bit).
2. Install Node.js 22.17 from the NodeSource repo.
3. Clone EdgeWell and `npm install` (no native deps).
4. Apply the `tinkerer` profile:

   ```bash
   edgewell profiles apply tinkerer
   edgewell doctor
   ```

5. Optional: enable the companion server and pair from a phone.

The **tinkerer** profile picks a 64-dim vector embedder, a 300-char
RAG chunk, and a generous 15s P2P timeout to cope with network
latency on a home LAN.

## Desktop (laptop or workstation)

1. Install Node.js 22.17 via your package manager.
2. Clone EdgeWell and `npm install`.
3. Apply the **desktop** profile.
4. Optionally start the companion server for phone pairing.

The **desktop** profile uses the 8B local model, a 256-dim vector
embedder, and disables P2P by default (the desktop is usually the
peer for the rest of the household).

## Health and finance data

EdgeWell stores everything under the data directory configured in
`EDGEWELL_DATA_DIR` (default `~/.edgewell/data`). To back up:

```bash
edgewell export ~/backups/edgewell-$(date +%F).json
```

To restore on a new device:

```bash
edgewell import ~/backups/edgewell-2026-01-17.json
```

`import` is idempotent: it skips records that already exist
(matched by timestamp + content).

## Updating

`edgewell` has no daemon. Updating is a manual `git pull && npm
install` (or your preferred packaging). The CHANGELOG describes
what changed between versions; major bumps always include a
migration note in the README.
