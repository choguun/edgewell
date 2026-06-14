// @ts-nocheck
// CLI helpers: ANSI colors, prompt, streaming print.

const isTTY = process.stdout.isTTY;
const wrap = (open, close) => (s) => (isTTY ? `\x1b[${open}m${s}\x1b[${close}m` : `${s}`);
export const c = {
  dim: wrap("2", "22"),
  bold: wrap("1", "22"),
  cyan: wrap("36", "39"),
  green: wrap("32", "39"),
  yellow: wrap("33", "39"),
  red: wrap("31", "39"),
  magenta: wrap("35", "39"),
};

export function header(title) {
  const bar = "─".repeat(Math.max(8, Math.min(60, title.length + 2)));
  console.log(c.cyan(bar));
  console.log(c.bold(c.cyan(` ${title} `)));
  console.log(c.cyan(bar));
}

export async function promptLine(question) {
  process.stdout.write(question);
  return new Promise((resolve) => {
    let buf = "";
    const onData = (chunk) => {
      const s = chunk.toString("utf8");
      buf += s;
      if (s.includes("\n")) {
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        process.stdin.off("data", onData);
        resolve(buf.replace(/\r?\n$/, ""));
      }
    };
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}

export async function withReadline(fn) {
  const rl = await import("node:readline/promises").then((m) => m.createInterface({
    input: process.stdin,
    output: process.stdout,
  }));
  try {
    return await fn(rl);
  } finally {
    rl.close();
  }
}

export function parseFlags(args, defs = {}) {
  const out = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) {
      // Support both `--key value` and `--key=value`. The `=` form is
      // important because some flags naturally take negative numbers
      // (e.g. `--port=-1`) where the space form would be ambiguous.
      const eq = a.indexOf("=");
      let k, v;
      if (eq !== -1) {
        k = a.slice(2, eq);
        v = a.slice(eq + 1);
      } else {
        k = a.slice(2);
        v = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
      }
      out[k] = v;
    } else {
      out._.push(a);
    }
  }
  return { ...defs, ...out };
}
