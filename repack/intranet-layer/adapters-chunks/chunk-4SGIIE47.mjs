import { createRequire as __nodePortCreateRequire } from 'node:module';
import { fileURLToPath as __nodePortF2P } from 'node:url';
import { dirname as __nodePortDirname } from 'node:path';
var require = __nodePortCreateRequire(import.meta.url);
var __filename = __nodePortF2P(import.meta.url);
var __dirname = __nodePortDirname(__filename);
process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1";
import {
  IMAGE_MAX_BYTES,
  checkAttachmentLimit
} from "./chunk-MUXOERMD.mjs";
import {
  init_define_MACRO
} from "./chunk-57T55QIK.mjs";

// adapters/common/attachment/outbound-image.ts
init_define_MACRO();
import * as fs from "node:fs/promises";
import * as path from "node:path";
async function loadSafeOutboundImage(pending, sessionWorkDir) {
  if (!sessionWorkDir) {
    return { ok: false, reason: "missing session work directory" };
  }
  if (pending.source.kind === "url") {
    return { ok: false, reason: "remote image URLs are not fetched from Agent output" };
  }
  if (pending.source.kind === "base64") {
    const mime2 = pending.source.mime;
    const estimatedBytes = Math.ceil(pending.source.data.length * 3 / 4);
    const preflight = checkAttachmentLimit("image", estimatedBytes, mime2);
    if (!preflight.ok) return { ok: false, reason: preflight.hint };
    const buffer = Buffer.from(pending.source.data, "base64");
    const exact = checkAttachmentLimit("image", buffer.length, mime2);
    return exact.ok ? { ok: true, buffer, mime: mime2 } : { ok: false, reason: exact.hint };
  }
  let canonicalRoot;
  let canonicalFile;
  try {
    canonicalRoot = await fs.realpath(sessionWorkDir);
    canonicalFile = await fs.realpath(pending.source.path);
  } catch {
    return { ok: false, reason: "image path does not exist" };
  }
  const relative2 = path.relative(canonicalRoot, canonicalFile);
  if (relative2.startsWith("..") || path.isAbsolute(relative2)) {
    return { ok: false, reason: "image path is outside the active session work directory" };
  }
  const mime = pending.source.mime ?? "image/png";
  const file = await fs.open(canonicalFile, "r");
  try {
    const stat = await file.stat();
    if (!stat.isFile()) {
      return { ok: false, reason: "image path is not a regular file" };
    }
    const preflight = checkAttachmentLimit("image", stat.size, mime);
    if (!preflight.ok) return { ok: false, reason: preflight.hint };
    const chunks = [];
    let total = 0;
    const stream = file.createReadStream({ autoClose: false });
    for await (const chunk of stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buffer.length;
      if (total > IMAGE_MAX_BYTES) {
        stream.destroy();
        return { ok: false, reason: "image exceeded the 10 MB limit while reading" };
      }
      chunks.push(buffer);
    }
    return { ok: true, buffer: Buffer.concat(chunks, total), mime };
  } finally {
    await file.close();
  }
}
async function sendSafeOutboundImage(pending, sessionWorkDir, send) {
  const loaded = await loadSafeOutboundImage(pending, sessionWorkDir);
  if (!loaded.ok) return loaded;
  await send(loaded.buffer, loaded.mime);
  return loaded;
}

export {
  loadSafeOutboundImage,
  sendSafeOutboundImage
};
//# sourceMappingURL=chunk-4SGIIE47.mjs.map
