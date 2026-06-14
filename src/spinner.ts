// Tiny terminal spinner. Animates a frame every 80ms and clears
// itself when stop() is called. No deps.

import type { WriteStream } from "node:tty";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export interface SpinnerOptions {
  stream?: WriteStream;
  text?: string;
}

export class Spinner {
  public stream: WriteStream;
  public text: string;
  public i: number = 0;
  public timer: NodeJS.Timeout | null = null;
  public isTTY: boolean;

  constructor({ stream = process.stderr, text = "" }: SpinnerOptions = {}) {
    this.stream = stream;
    this.text = text;
    this.isTTY = !!stream.isTTY;
  }

  start(): void {
    if (!this.isTTY) {
      if (this.text) this.stream.write(this.text + "\n");
      return;
    }
    this.timer = setInterval(() => {
      const frame = FRAMES[this.i % FRAMES.length] ?? FRAMES[0];
      this.stream.write(`\r${frame} ${this.text}`);
      this.i++;
    }, 80);
  }

  setText(text: string): void {
    this.text = text;
  }

  stop(finalText: string | null = null): void {
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
