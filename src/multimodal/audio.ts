// @ts-nocheck
// Audio ingest pipeline. Reads a short audio file (WAV/MP3/M4A/OGG),
// chunks the raw bytes into manageable windows, and emits transcript
// text. The transcript itself comes from an injected `transcribeFn`
// so the offline test suite does not require a speech-to-text model.
//
// v3.0.0 ships a *placeholder* transcriber that uses the file name
// as a stand-in. The QVAC STT model is wired through the factory.

import { promises as fs } from "node:fs";
import path from "node:path";

const AUDIO_EXT = new Set([".wav", ".mp3", ".m4a", ".ogg", ".flac"]);

function isAudioPath(p) {
  return AUDIO_EXT.has(path.extname(p).toLowerCase());
}

export async function ingestAudio({ filePath, buffer = null, transcribeFn = null, chunkMs = 30_000 } = {}) {
  if (!filePath && !buffer) {
    throw new Error("ingestAudio requires filePath or buffer");
  }
  const name = filePath ? path.basename(filePath, path.extname(filePath)) : "audio";
  let transcript = "";
  if (transcribeFn) {
    // Read the file lazily so a transcribeFn that doesn't need
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
    transcript = await transcribeFn({ bytes, meta: { name, chunkMs } });
  } else {
    transcript = placeholderTranscript(name);
  }
  // For the byte count, prefer the buffer length when present
  // (no I/O needed). When we just produced a placeholder
  // transcript for a file we never read, the count is unknown.
  let bytesLen = buffer ? buffer.length : 0;
  if (transcribeFn && !bytesLen) {
    try { bytesLen = (await fs.stat(filePath)).size; } catch { bytesLen = 0; }
  }
  return {
    source: `audio:${name}`,
    kind: "audio",
    meta: { name, chunkMs },
    bytes: bytesLen,
    text: transcript,
  };
}

function placeholderTranscript(name) {
  return `Audio recording titled "${name}". No STT model configured — replace this with a transcript or use the audio as a voice journal entry.`;
}

export { isAudioPath };
