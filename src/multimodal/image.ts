// @ts-nocheck
// Image ingest pipeline. Takes an image path or Buffer, runs a
// captioning pre-pass, and emits text chunks that the rest of the
// pipeline (RAG, agents) can consume.
//
// v3.0.0 ships with a *placeholder* captioner that returns a generic
// description based on the file's name and EXIF-like metadata. The
// real QVAC vision model is wired through `captionFn` so users can
// inject a production captioner without changing this module.

import { promises as fs } from "node:fs";
import path from "node:path";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".tiff"]);

function isImagePath(p) {
  return IMAGE_EXT.has(path.extname(p).toLowerCase());
}

function fileMeta(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const name = path.basename(filePath, ext);
  return { ext, name, sizeHint: "unknown" };
}

export async function ingestImage({ filePath, buffer = null, captionFn = null } = {}) {
  if (!filePath && !buffer) {
    throw new Error("ingestImage requires filePath or buffer");
  }
  const meta = filePath ? fileMeta(filePath) : { ext: ".bin", name: "buffer", sizeHint: "unknown" };
  let caption = "";
  if (captionFn) {
    // Read the file lazily so a captionFn that doesn't need
    // the bytes (e.g. a fake) doesn't force the file to exist.
    // If the file is missing, pass an empty Buffer and let the
    // caller decide what to do (e.g. emit a placeholder).
    let bytes = buffer;
    if (!bytes && filePath) {
      try {
        bytes = await fs.readFile(filePath);
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
        bytes = Buffer.alloc(0);
      }
    } else if (!bytes) {
      bytes = Buffer.alloc(0);
    }
    caption = await captionFn({ bytes, meta });
  } else {
    caption = placeholderCaption(meta);
  }
  // For the byte count, prefer the buffer length when present
  // (no I/O needed). When we just produced a placeholder caption
  // for a file we never read, the count is unknown.
  let bytesLen = buffer ? buffer.length : 0;
  if (captionFn && !bytesLen) {
    try { bytesLen = (await fs.stat(filePath)).size; } catch { bytesLen = 0; }
  }
  return {
    source: `image:${meta.name}`,
    kind: "image",
    meta,
    bytes: bytesLen,
    text: caption,
  };
}

function placeholderCaption(meta) {
  return `Image titled "${meta.name}" (${meta.ext}). No vision model configured — describe the picture in your own words when adding it to a journal entry.`;
}

export { isImagePath };
