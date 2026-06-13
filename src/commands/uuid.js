// `edgewell uuid` prints a v4 UUID using `node:crypto.randomUUID`.
// v3.0.0 keeps this as a tiny utility for users who want a
// unique identifier (e.g. for a paired phone).

import { randomUUID } from "node:crypto";
import { c } from "../cli.js";

export async function uuidCommand(_args) {
  console.log(c.cyan(randomUUID()));
}
