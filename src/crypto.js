// At-rest encryption for the local data files. Uses scrypt for
// passphrase -> key and AES-256-GCM for authenticated encryption.
// The on-disk format is a single JSON object with the algorithm
// parameters so we can rotate them later.

import { webcrypto } from "node:crypto";
const { subtle } = webcrypto;

const ALGO = "AES-GCM";
const NODE_CIPHER = "aes-256-gcm";
const KEY_LEN = 32;
const SCRYPT_PARAMS = { N: 1 << 14, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const SALT_LEN = 16;
const IV_LEN = 12;

async function deriveKey(passphrase, salt) {
  const enc = new TextEncoder();
  const baseKey = await subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2" in subtle ? "PBKDF2" : "PBKDF2",
    false,
    ["deriveKey"],
  );
  return subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 200_000, hash: "SHA-256" },
    baseKey,
    { name: ALGO, length: KEY_LEN * 8 },
    false,
    ["encrypt", "decrypt"],
  );
}

// Use scrypt via node:crypto to keep the KDF strong even on devices
// where WebCrypto is the only crypto surface available.
async function deriveKeyNode(passphrase, salt) {
  const { scryptSync, randomBytes, createCipheriv, createDecipheriv } = await import("node:crypto");
  // We delegate key derivation to a helper that falls back to scrypt
  // when running under Node; the WebCrypto PBKDF2 path above is kept
  // for browser / Bare compatibility.
  return { scryptSync, randomBytes, createCipheriv, createDecipheriv, salt };
}

function bytesToB64(bytes) {
  return Buffer.from(bytes).toString("base64");
}
function b64ToBytes(b64) {
  return new Uint8Array(Buffer.from(b64, "base64"));
}

export async function encryptString(plaintext, passphrase) {
  if (typeof passphrase !== "string" || passphrase.length < 4) {
    throw new Error("passphrase must be at least 4 characters");
  }
  const { scryptSync, randomBytes, createCipheriv } = await deriveKeyNode(passphrase, new Uint8Array());
  const salt = randomBytes(SALT_LEN);
  const iv = randomBytes(IV_LEN);
  const key = scryptSync(passphrase, salt, KEY_LEN, SCRYPT_PARAMS);
  const cipher = createCipheriv(NODE_CIPHER, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    algo: ALGO,
    kdf: "scrypt",
    kdfParams: SCRYPT_PARAMS,
    salt: bytesToB64(salt),
    iv: bytesToB64(iv),
    ct: bytesToB64(ct),
    tag: bytesToB64(tag),
  };
}

export async function decryptString(envelope, passphrase) {
  if (!envelope || envelope.algo !== ALGO) {
    throw new Error("unsupported envelope");
  }
  const { scryptSync, createDecipheriv } = await import("node:crypto");
  const salt = b64ToBytes(envelope.salt);
  const iv = b64ToBytes(envelope.iv);
  const ct = b64ToBytes(envelope.ct);
  const tag = b64ToBytes(envelope.tag);
  const key = scryptSync(passphrase, salt, KEY_LEN, envelope.kdfParams ?? SCRYPT_PARAMS);
  const decipher = createDecipheriv(NODE_CIPHER, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

// Convenience helpers for the on-disk JSONL store.
export async function encryptJsonl(lines, passphrase) {
  return encryptString(lines.join("\n") + "\n", passphrase);
}
export async function decryptJsonl(envelope, passphrase) {
  const text = await decryptString(envelope, passphrase);
  return text.split("\n").filter((l) => l.trim().length > 0);
}
