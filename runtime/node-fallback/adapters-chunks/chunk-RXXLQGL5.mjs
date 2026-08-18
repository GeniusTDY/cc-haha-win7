import { createRequire as __nodePortCreateRequire } from 'node:module';
const require = __nodePortCreateRequire(import.meta.url);
import {
  init_define_MACRO
} from "./chunk-WJXODNLM.mjs";

// adapters/common/attachment/image-block-watcher.ts
init_define_MACRO();
var IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
function fingerprint(raw) {
  let h = 5381;
  for (let i = 0; i < raw.length; i++) {
    h = (h << 5) + h ^ raw.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}
function classify(target) {
  if (target.startsWith("data:")) {
    const m = /^data:([^;,]+);base64,(.+)$/.exec(target);
    if (!m) return null;
    return { kind: "base64", mime: m[1], data: m[2] };
  }
  if (target.startsWith("file://")) {
    return { kind: "path", path: target.slice("file://".length) };
  }
  if (target.startsWith("http://") || target.startsWith("https://")) {
    return { kind: "url", url: target };
  }
  if (target.startsWith("/")) {
    return { kind: "path", path: target };
  }
  return null;
}
var ImageBlockWatcher = class {
  buffer = "";
  seen = /* @__PURE__ */ new Set();
  accumulated = [];
  /** Feed a new chunk of streaming text; returns any NEW PendingUploads. */
  feed(chunk) {
    this.buffer += chunk;
    const out = [];
    IMAGE_RE.lastIndex = 0;
    let lastConsumedEnd = 0;
    let m;
    while ((m = IMAGE_RE.exec(this.buffer)) !== null) {
      const [, alt, target] = m;
      const source = classify(target);
      if (source) {
        const id = fingerprint(`${source.kind}:${target}`);
        if (!this.seen.has(id)) {
          this.seen.add(id);
          const pending = { id, source, alt: alt || void 0 };
          out.push(pending);
          this.accumulated.push(pending);
        }
      }
      lastConsumedEnd = m.index + m[0].length;
    }
    if (lastConsumedEnd > 0) {
      this.buffer = this.buffer.slice(lastConsumedEnd);
    }
    if (this.buffer.length > 4096) {
      this.buffer = this.buffer.slice(-2048);
    }
    return out;
  }
  /** Return everything seen so far (for end-of-stream reconciliation). */
  drain() {
    return [...this.accumulated];
  }
  /** Reset watcher state (use at /clear or new session). */
  reset() {
    this.buffer = "";
    this.seen.clear();
    this.accumulated = [];
  }
};

export {
  ImageBlockWatcher
};
//# sourceMappingURL=chunk-RXXLQGL5.mjs.map
