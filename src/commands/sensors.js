// `edgewell sensors` ingests wearable events and prints a journal
// line summary. v3.0.0 keeps this offline: the file is plain JSONL
// (one event per line) so users can pipe in real exports or test
// with hand-rolled data.

import { promises as fs } from "node:fs";
import path from "node:path";
import { summariseEvents, toJournalLine } from "../multimodal/sensors.js";

export async function sensorsCommand(args, ew) {
  const [sub, ...rest] = args;
  if (sub === "ingest") {
    return ingestSensors(rest, ew);
  }
  if (sub === "summarise") {
    return summariseSensors(rest, ew);
  }
  console.error("usage: edgewell sensors <ingest|summarise> [file]");
  process.exit(2);
}

async function ingestSensors(args, ew) {
  const file = args[0];
  if (!file) {
    console.error("usage: edgewell sensors ingest <file.jsonl>");
    process.exit(2);
  }
  const text = await fs.readFile(file, "utf8");
  const events = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  const summary = summariseEvents(events);
  const line = toJournalLine(summary);
  if (line) {
    await ew.journal.append({ kind: "journal", _ts: new Date().toISOString(), text: line, tags: ["sensors"] });
    console.log("journal entry:");
    console.log(`  ${line}`);
  } else {
    console.log("no supported events found");
  }
}

async function summariseSensors(args, ew) {
  const file = args[0];
  if (!file) {
    console.error("usage: edgewell sensors summarise <file.jsonl>");
    process.exit(2);
  }
  const text = await fs.readFile(file, "utf8");
  const events = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  const summary = summariseEvents(events);
  console.log(JSON.stringify(summary, null, 2));
}
