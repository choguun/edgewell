import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.resolve(here, "../../package.json"), "utf8"));

export async function versionCommand() {
  console.log(`edgewell v${pkg.version}`);
}
