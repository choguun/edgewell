# EdgeWell v3.0.1 — Demo video package

This directory holds the **self-contained video artifacts** for the
"Artifact Quality" and "Innovation" judging criteria. There is no
build step, no CDN, and no network access required to view them —
open `demo/recording.html` in any modern browser and the 90-second
terminal recording plays back from the inline asciinema cast.

## Files in this package

| File                         | Format        | Size  | Purpose                                                                                       |
|------------------------------|---------------|-------|-----------------------------------------------------------------------------------------------|
| `demo/recording.cast`        | asciinema v2  | ~8 KB | The canonical 90-second terminal recording. 1 header + 97 frames, JSON-per-line, text-only.    |
| `demo/recording.html`        | HTML5 + JS    | ~17 KB| Self-contained player. Inline CSS, inline JS, the cast is embedded as a JS array literal. No external resources. |
| `demo/recording-poster.svg`  | SVG (static)  | ~5 KB | 400×300 stylized terminal poster with the first 3 lines of output + a ▶ play triangle.       |
| `demo/HARDWARE.md`           | Markdown      | ~8 KB | Hardware proof: 3 devices, exact commands, criterion mapping. Real laptop data + MOCK Pi/phone. |
| `demo/video-readme.md`       | Markdown      | this   | This file.                                                                                    |

The raw text source for the cast is `demo/multimodal-tool-showcase.log`
(33 lines, captured from `node dist/bin/edgewell.js showcase` on
2026-06-18, Apple M4 Max / macOS 26.5 / Node v24.13.0 / pnpm 11.6.0).

## How the pieces fit together

```
   ┌──────────────────────┐
   │ showcase-compiled.txt │  raw stdout
   │ multimodal-tool-      │  (33 lines)
   │   showcase.log        │
   └──────────┬───────────┘
              │  captured from
              ▼
   ┌──────────────────────┐         ┌──────────────────────┐
   │ recording.cast        │ ──inlined──▶  recording.html │
   │ (asciinema v2)        │            │  (HTML5 player)     │
   │ 100×30, 97 frames     │            │  requestAnimationFr.│
   └──────────┬───────────┘            │  play / pause / 1-4x│
              │                        └──────────────────────┘
              │ used as a visual reference
              ▼
   ┌──────────────────────┐
   │ recording-poster.svg │   static 400×300 thumbnail
   │ (static)             │   for the judges' score sheet
   └──────────────────────┘
```

## How to view

### A. Browser (recommended — works on `file://`, no server)

```bash
open demo/recording.html           # macOS
xdg-open demo/recording.html       # Linux
start demo/recording.html          # Windows
```

Click **▶ Play** to start; the recording plays once and ends with the
cursor visible at the bottom of the terminal. **Space / K** toggles
play/pause, **R** restarts, **Esc** closes the "Copy the commands"
modal. The speed selector (1x / 2x / 4x) re-anchors playback without
jumping the cursor.

### B. Standalone poster

```bash
open demo/recording-poster.svg     # any image viewer or browser
```

### C. Asciinema player (CLI)

```bash
brew install asciinema             # or: npx asciinema
asciinema play demo/recording.cast
```

## How to convert to MP4

> **Heads up:** the example line
> `ffmpeg -i recording.html -pix_fmt yuv420p out.mp4`
> in some older how-to articles is **not** valid — ffmpeg cannot read
> HTML5 video sources directly. Use one of the real options below.

### Option 1 — re-render the cast to a GIF, then to MP4 (offline)

The `asciinema` CLI ships an SVG/ GIF exporter:

```bash
brew install asciinema agg         # or: cargo install agg
agg --theme edgewell demo/recording.cast demo.gif    # ~ 4 MB
# Then, if a real MP4 is required:
brew install ffmpeg
ffmpeg -i demo.gif -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" demo.mp4
```

### Option 2 — record the HTML page with a headless browser (most faithful)

```bash
npm i -g puppeteer                 # or: npx puppeteer
npx puppeteer-cli \
  --url file://$PWD/demo/recording.html \
  --width 1000 --height 600 \
  --fps 30 --duration 92 \
  --out demo.webm
ffmpeg -i demo.webm -pix_fmt yuv420p demo.mp4
```

### Option 3 — use `npx asciinema` to upload, then download the rendered MP4

The `asciinema` CLI can publish the cast to <https://asciinema.org> and
the hosted player can be screen-recorded; this is the path of least
resistance if MP4 is strictly required and the judges accept a
screen-recording of the player.

## Reproducing the cast from scratch

```bash
# Clean clone
git clone <repo> edgewell && cd edgewell
corepack enable && corepack prepare pnpm@11.6.0 --activate
pnpm install
pnpm build

# Capture the raw transcript
node dist/bin/edgewell.js showcase > /tmp/sc.txt

# Regenerate the cast (this script lives in /tmp; check the build host
# for the latest generator; the cast is deterministic from /tmp/sc.txt)
node /tmp/gen-cast.mjs
# → demo/recording.cast (1 header + ~97 frames, time-field absolute)
```

The cast frames are time-anchored to the wall clock: the first frame
is at t = 0.05 s, the last at t = 90.0 s, and the speed selector in
the HTML player scales the **animation rate**, not the cast's
intrinsic timeline. So 1x playback ends at ~ 90 s of real time, 2x at
~ 45 s, 4x at ~ 22.5 s.

## License

The artifacts in this directory are released under the same license
as the parent project (see top-level `LICENSE`). The cast, HTML, and
SVG are pure data — no third-party assets, no fonts beyond the
system monospace stack, no external CSS or JS.
