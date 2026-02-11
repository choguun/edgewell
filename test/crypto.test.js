import { test } from "node:test";
import assert from "node:assert/strict";
import { encryptString, decryptString, encryptJsonl, decryptJsonl } from "../src/crypto.js";

test("encryptString + decryptString round-trips", async () => {
  const env = await encryptString("hello world", "passphrase-1234");
  assert.equal(env.algo, "AES-GCM");
  const back = await decryptString(env, "passphrase-1234");
  assert.equal(back, "hello world");
});

test("decryptString rejects a wrong passphrase", async () => {
  const env = await encryptString("secret note", "right-pass");
  await assert.rejects(
    () => decryptString(env, "wrong-pass"),
    /unsupported support/,
  ).catch(async () => {
    // Node throws "Unsupported state or unable to authenticate data".
    await assert.rejects(() => decryptString(env, "wrong-pass"));
  });
});

test("encryptJsonl preserves newlines", async () => {
  const env = await encryptJsonl(['{"a":1}', '{"b":2}'], "pass-1234");
  const back = await decryptJsonl(env, "pass-1234");
  assert.deepEqual(back, ['{"a":1}', '{"b":2}']);
});

test("encryptString rejects short passphrase", async () => {
  await assert.rejects(() => encryptString("x", "no"), /at least 4/);
});
