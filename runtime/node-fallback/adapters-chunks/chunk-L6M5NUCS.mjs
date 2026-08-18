import { createRequire as __nodePortCreateRequire } from 'node:module';
import { fileURLToPath as __nodePortF2P } from 'node:url';
import { dirname as __nodePortDirname } from 'node:path';
var require = __nodePortCreateRequire(import.meta.url);
var __filename = __nodePortF2P(import.meta.url);
var __dirname = __nodePortDirname(__filename);
process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1";
import {
  init_define_MACRO
} from "./chunk-GSBHELYD.mjs";

// adapters/common/message-buffer.ts
init_define_MACRO();
var DEFAULT_INTERVAL_MS = 500;
var DEFAULT_CHAR_THRESHOLD = 200;
var MessageBuffer = class {
  constructor(onFlush, intervalMs = DEFAULT_INTERVAL_MS, charThreshold = DEFAULT_CHAR_THRESHOLD) {
    this.onFlush = onFlush;
    this.intervalMs = intervalMs;
    this.charThreshold = charThreshold;
  }
  onFlush;
  intervalMs;
  charThreshold;
  buffer = "";
  timer = null;
  flushing = false;
  pendingComplete = false;
  activeFlush = null;
  /** Append text delta. Triggers flush if threshold reached. */
  append(text) {
    this.buffer += text;
    if (this.buffer.length >= this.charThreshold) {
      this.scheduleFlush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(false), this.intervalMs);
    }
  }
  /** Immediately flush all remaining content (called on message_complete). */
  async complete() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.flushing) {
      this.pendingComplete = true;
      await this.activeFlush;
      return;
    }
    await this.flush(true);
  }
  /** Reset the buffer for a new message. */
  reset() {
    this.buffer = "";
    this.pendingComplete = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
  scheduleFlush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    queueMicrotask(() => this.flush(false));
  }
  async flush(isComplete) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.flushing) {
      await this.activeFlush;
      return;
    }
    if (this.buffer.length === 0) return;
    this.flushing = true;
    const text = this.buffer;
    this.buffer = "";
    this.activeFlush = (async () => {
      try {
        await this.onFlush(text, isComplete);
      } catch (err) {
        console.error("[MessageBuffer] Flush error:", err);
      } finally {
        this.flushing = false;
        this.activeFlush = null;
        if (this.pendingComplete) {
          this.pendingComplete = false;
          await this.flush(true);
        }
      }
    })();
    await this.activeFlush;
  }
};

export {
  MessageBuffer
};
//# sourceMappingURL=chunk-L6M5NUCS.mjs.map
