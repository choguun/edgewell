// Multimodal entry point. Re-exports the per-modality ingest helpers
// and adds a single `ingestPath` dispatcher that picks the right
// pipeline based on the file extension.

import path from "node:path";
import { ingestImage, isImagePath } from "./image.js";
import { ingestAudio, isAudioPath } from "./audio.js";
import { summariseEvents, toJournalLine, isSupported, SUPPORTED } from "./sensors.js";

export async function ingestPath({ filePath, buffer = null, captionFn = null, transcribeFn = null } = {}) {
  if (typeof filePath !== "string" || filePath.length === 0) {
    throw new Error("ingestPath requires a non-empty `filePath`");
  }
  if (isImagePath(filePath)) {
    return ingestImage({ filePath, buffer, captionFn });
  }
  if (isAudioPath(filePath)) {
    return ingestAudio({ filePath, buffer, transcribeFn });
  }
  // Fall back to plain-text ingest for unknown extensions so users
  // can drop in .md/.txt notes and have them flow into RAG.
  const { promises: fs } = await import("node:fs");
  let text;
  if (buffer) {
    text = buffer.toString("utf8");
  } else {
    try {
      text = await fs.readFile(filePath, "utf8");
    } catch (err) {
      if (err.code === "ENOENT") {
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
