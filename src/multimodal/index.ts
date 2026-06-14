// Multimodal entry point. Re-exports the per-modality ingest helpers
// and adds a single `ingestPath` dispatcher that picks the right
// pipeline based on the file extension.

import path from "node:path";
import { ingestImage, isImagePath } from "./image.js";
import { ingestAudio, isAudioPath } from "./audio.js";
import { summariseEvents, toJournalLine, isSupported, SUPPORTED } from "./sensors.js";

export interface IngestPathInput {
  filePath: string;
  buffer?: Buffer | null;
  captionFn?: unknown;
  transcribeFn?: unknown;
}

export interface IngestPathResult {
  source: string;
  kind: string;
  meta: Record<string, unknown>;
  bytes: number;
  text: string;
}

/**
 * The inner ingestImage / ingestAudio functions are still in
 * // @ts-nocheck files with implicit-any params. We forward to
 * them via a single loose signature here and tighten the result
 * shape for callers. The contract is the same as it was before
 * the peel.
 */
export async function ingestPath(input: IngestPathInput = { filePath: "" }): Promise<IngestPathResult> {
  const filePath = input.filePath;
  if (typeof filePath !== "string" || filePath.length === 0) {
    throw new Error("ingestPath requires a non-empty `filePath`");
  }
  if (isImagePath(filePath)) {
    return (await ingestImage(input as never)) as IngestPathResult;
  }
  if (isAudioPath(filePath)) {
    return (await ingestAudio(input as never)) as IngestPathResult;
  }
  // Fall back to plain-text ingest for unknown extensions so users
  // can drop in .md/.txt notes and have them flow into RAG.
  const { promises: fs } = await import("node:fs");
  let text: string;
  if (input.buffer) {
    text = (input.buffer as Buffer).toString("utf8");
  } else {
    try {
      text = await fs.readFile(filePath, "utf8");
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      if (e?.code === "ENOENT") {
        throw new Error(`file not found: ${filePath}`);
      }
      throw err;
    }
  }
  return {
    source: `text:${path.basename(filePath)}`,
    kind: "text",
    meta: { ext: path.extname(filePath) },
    bytes: text.length,
    text,
  };
}

export {
  ingestImage,
  isImagePath,
  ingestAudio,
  isAudioPath,
  summariseEvents,
  toJournalLine,
  isSupported,
  SUPPORTED,
};
