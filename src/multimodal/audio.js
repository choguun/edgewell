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
  let bytes = buffer;
  if (!bytes) bytes = await fs.readFile(filePath);
  const name = filePath ? path.basename(filePath, path.extname(filePath)) : "audio";
  let transcript = "";
  if (transcribeFn) {
    transcript = await transcribeFn({ bytes, meta: { name, chunkMs } });
  } else {
    transcript = placeholderTranscript(name);
  }
  return {
    source: `audio:${name}`,
    kind: "audio",
    meta: { name, chunkMs },
    bytes: bytes.length,
    text: transcript,
  };
}

function placeholderTranscript(name) {
  return `Audio recording titled "${name}". No STT model configured — replace this with a transcript or use the audio as a voice journal entry.`;
}

export { isAudioPath };
