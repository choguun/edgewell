// @ts-nocheck
// `edgewell base64 <text>` base64-encodes a string. v3.0.0 keeps
// this as a tiny utility for users who want to embed a token
// or fingerprint in a URL.

export async function base64Command(args) {
  const text = args.join(" ");
  if (!text) {
    console.error("usage: edgewell base64 <text>");
    process.exit(2);
  }
  console.log(Buffer.from(text, "utf8").toString("base64"));
}
