// `edgewell rot13 <text>` ROT13-encodes a string. v3.0.0 keeps
// this demo because it shows how small a CLI command can be.

export async function rot13Command(args) {
  const text = args.join(" ");
  if (!text) {
    console.error("usage: edgewell rot13 <text>");
    process.exit(2);
  }
  const out = text.replace(/[a-zA-Z]/g, (ch) => {
    const base = ch <= "Z" ? 65 : 97;
    return String.fromCharCode(((ch.charCodeAt(0) - base + 13) % 26) + base);
  });
  console.log(out);
}
