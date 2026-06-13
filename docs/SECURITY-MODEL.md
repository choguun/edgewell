# EdgeWell v3.0.0 Security Model

This document describes how EdgeWell v3.0.0 keeps personal data
private and what it does — and does not — protect against.

## Threat model

EdgeWell assumes the **device is trusted** and the **network is
hostile**. The phone, laptop, or SBC runs the code; everything
between the device and the optional P2P peer is untrusted.

| Adversary | Mitigation |
|-----------|-----------|
| Network observer | P2P traffic is plaintext HTTP. Use a reverse proxy with TLS in production. The companion bearer token is HMAC-signed but not encrypted. |
| Compromised peer | EdgeWell's local fallback keeps working when the peer is unreachable. The peer never sees raw journal entries; only the prompt that the user is actively sending. |
| Local file reader | The RAG index, journal, and expenses are stored as plaintext JSONL on disk. v2.0.0 adds optional at-rest encryption via `EDGEWELL_RAG_ENCRYPTED=1`. |
| Malicious plugin | The plugin loader is explicit: only `*.plugin.js` files in the directory pointed to by `EDGEWELL_PLUGINS` are loaded. No `require`, no recursion into subdirectories. |
| Telemetry exfiltration | EdgeWell ships **no telemetry**. No analytics, no error reporting, no automatic updates. |

## At-rest encryption

v2.0.0 introduced an `EncryptedJsonlStore` that uses scrypt +
AES-256-GCM. v3.0.0 uses the same primitive for the
`EDGEWELL_RAG_ENCRYPTED=1` path. The encryption key is derived
from a passphrase the user supplies on first use and stored in a
small key file with restrictive permissions (0600 on POSIX).

## Companion server

The companion HTTP server (v3.0.0) issues short-lived HMAC tokens.
Tokens are signed with `EDGEWELL_COMPANION_SECRET` and expire
after one hour by default. The server logs nothing about
authenticated requests — only `info`/`error` lines from the
optional logger.

## Plugin security

Plugins run with the same Node.js permissions as the EdgeWell
process. v3.0.0 only loads files that:

1. End with `.plugin.js`.
2. Live in the directory the user passed to `EDGEWELL_PLUGINS`.
3. Are a regular file (no symlinks to outside directories, no
   device files).

This means a hostile actor who can write to your `plugins/`
directory can run code. Treat that directory like `~/.bashrc` —
only put files there you have authored or audited.

## Source of randomness

EdgeWell uses `node:crypto.randomBytes` everywhere a token, key,
or secret is generated. There is no custom PRNG.

## Reporting vulnerabilities

Email security@edgewell.local (placeholder) or open a private
issue on GitHub. EdgeWell follows responsible disclosure: a fix
is published before the report goes public.
