// Tiny terminal spinner. Animates a frame every 80ms and clears
// itself when stop() is called. No deps.

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export class Spinner {
  constructor({ stream = process.stderr, text = "" } = {}) {
    this.stream = stream;
    this.text = text;
    this.i = 0;
    this.timer = null;
    this.isTTY = !!stream.isTTY;
  }

  start() {
    if (!this.isTTY) {
      if (this.text) this.stream.write(this.text + "\n");
      return;
    }
    this.timer = setInterval(() => {
      const frame = FRAMES[this.i % FRAMES.length];
      this.stream.write(`\r${frame} ${this.text}`);
      this.i++;
    }, 80);
  }

  setText(text) {
    this.text = text;
  }

  stop(finalText = null) {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.isTTY) {
      this.stream.write("\r" + " ".repeat(this.text.length + 4) + "\r");
    }
    if (finalText) this.stream.write(finalText + "\n");
  }
}
