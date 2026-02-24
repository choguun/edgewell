# Security Policy

## Supported versions

Only the latest minor version of EdgeWell receives security fixes.

| Version | Supported          |
|---------|--------------------|
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |
| < 1.0   | :x:                |

## Reporting a vulnerability

Please email security@edgewell.local with a description of the
issue, the commit hash, and a reproducer. We will acknowledge
within 3 business days.

Do not file public GitHub issues for suspected vulnerabilities.

## Threat model

EdgeWell is a local-first app. The realistic threats are:

- **At-rest disclosure**: someone with disk access reads the
  user's journal or expenses. Mitigated by the optional
  `EncryptedJsonlStore` (AES-256-GCM with a scrypt-derived key).
- **Network disclosure**: a malicious peer sees prompts that
  contain PII. Mitigated by the `redact` helpers, run before any
  P2P delegation.
- **Plugin supply chain**: a hostile plugin executes arbitrary
  code with EdgeWell's privileges. Mitigated by the explicit
  security model in `src/plugins.js` (only `*.plugin.js` from a
  caller-specified directory) and the documentation that warns
  users to install only plugins they trust.
- **Unsafe model output**: the model returns text that includes a
  tool call injecting shell syntax. Mitigated by the calculator
  tool's regex pre-check and the strict `params` schema in
  `src/tools.js`.

## Cryptography

- AES-256-GCM for symmetric encryption (authenticated).
- scrypt (N=2^14, r=8, p=1, maxmem=64 MiB) for KDF.
- No use of MD5, SHA-1, or unverified random sources anywhere.

## Out of scope

EdgeWell does not aim to defend against:

- Compromised operating systems or hypervisors.
- Physical access to a powered-on, unlocked device.
- Side channels on shared hardware (Spectre, etc.).
