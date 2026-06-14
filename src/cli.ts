// CLI helpers: ANSI colors, prompt, streaming print.

import type { Interface as ReadlineInterface } from "node:readline/promises";

type Colorizer = (s: string) => string;

const isTTY: boolean = !!process.stdout.isTTY;
const wrap = (open: string, close: string): Colorizer =>
  (s) => (isTTY ? `\x1b[${open}m${s}\x1b[${close}m` : `${s}`);

export const c = {
  dim: wrap("2", "22"),
  bold: wrap("1", "22"),
  cyan: wrap("36", "39"),
  green: wrap("32", "39"),
  yellow: wrap("33", "39"),
  red: wrap("31", "39"),
  magenta: wrap("35", "39"),
} satisfies Record<string, Colorizer>;

export function header(title: string): void {
  const bar = "─".repeat(Math.max(8, Math.min(60, title.length + 2)));
  console.log(c.cyan(bar));
  console.log(c.bold(c.cyan(` ${title} `)));
  console.log(c.cyan(bar));
}

export async function promptLine(question: string): Promise<string> {
  process.stdout.write(question);
  return new Promise((resolve) => {
    let buf = "";
    const onData = (chunk: Buffer | string): void => {
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

export async function withReadline<T>(fn: (rl: ReadlineInterface) => Promise<T>): Promise<T> {
  const { createInterface } = await import("node:readline/promises");
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    return await fn(rl);
  } finally {
    rl.close();
  }
}

/**
 * Parsed CLI flag bag. `--` prefix becomes a key, `--key=value`
 * and `--key value` are both supported. Non-flag args are in
 * `_` (an array). A `defs` object is layered underneath so callers
 * can supply defaults.
 */
export interface FlagBag {
  [key: string]: unknown;
  _: string[];
}

export function parseFlags(args: string[], defs: Record<string, unknown> = {}): FlagBag {
  const out: FlagBag = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i] ?? "";
    if (a.startsWith("--")) {
      // Support both `--key value` and `--key=value`. The `=` form is
      // important because some flags naturally take negative numbers
      // (e.g. `--port=-1`) where the space form would be ambiguous.
      const eq = a.indexOf("=");
      let k: string;
      let v: string | boolean;
      if (eq !== -1) {
        k = a.slice(2, eq);
        v = a.slice(eq + 1);
      } else {
        k = a.slice(2);
        const next = args[i + 1];
        v = next !== undefined && !next.startsWith("--") ? (args[++i] as string) : true;
      }
      out[k] = v;
    } else {
      out._.push(a);
    }
  }
  return { ...defs, ...out } as FlagBag;
}
