import { createRequire as __nodePortCreateRequire } from 'node:module';
import { fileURLToPath as __nodePortF2P } from 'node:url';
import { dirname as __nodePortDirname } from 'node:path';
var require = __nodePortCreateRequire(import.meta.url);
var __filename = __nodePortF2P(import.meta.url);
var __dirname = __nodePortDirname(__filename);
process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1";
import {
  ImChatRuntime,
  attachmentKindForMime,
  imageExtensionForMime,
  inferMimeFromFileName
} from "./chunk-Z5I3QG2P.mjs";
import "./chunk-4SGIIE47.mjs";
import "./chunk-HHCHKLDH.mjs";
import "./chunk-UB2B24YT.mjs";
import {
  AttachmentStore,
  MessageDedup,
  SessionStore,
  WsBridge,
  checkAttachmentLimit,
  createAdapterClient,
  loadConfig,
  splitMessage,
  wrapper_default
} from "./chunk-MUXOERMD.mjs";
import {
  init_define_MACRO
} from "./chunk-57T55QIK.mjs";

// adapters/qq/index.ts
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/index.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/QQBot.js
init_define_MACRO();
import * as fs3 from "node:fs";
import * as path from "node:path";

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/middleware/types.js
init_define_MACRO();
async function runMiddlewareChain(middlewares, ctx) {
  let index = -1;
  const dispatch = async (i) => {
    if (i <= index) {
      throw new Error("next() called multiple times");
    }
    index = i;
    if (ctx.stopped) {
      return;
    }
    if (i >= middlewares.length) {
      return;
    }
    const fn = middlewares[i];
    if (!fn) {
      return;
    }
    await fn(ctx, () => dispatch(i + 1));
  };
  await dispatch(0);
  return !ctx.stopped;
}
function createMiddlewareContext(params) {
  const receivedAt = Date.now();
  let stopped = false;
  let stopReason;
  const ac = new AbortController();
  const ctx = {
    bot: params.bot,
    message: params.message,
    replyTarget: params.message.replyTarget,
    state: {},
    log: params.log,
    stop(reason) {
      stopped = true;
      stopReason = reason;
    },
    get stopped() {
      return stopped;
    },
    get stopReason() {
      return stopReason;
    },
    get signal() {
      return ac.signal;
    },
    abort(reason) {
      ac.abort(reason);
      stopped = true;
      stopReason = reason ?? "aborted";
    },
    get aborted() {
      return ac.signal.aborted;
    },
    receivedAt
  };
  return ctx;
}

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/api/api-client.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/types.js
init_define_MACRO();
var ApiError = class extends Error {
  httpStatus;
  path;
  bizCode;
  bizMessage;
  name = "ApiError";
  constructor(message, httpStatus, path2, bizCode, bizMessage) {
    super(message);
    this.httpStatus = httpStatus;
    this.path = path2;
    this.bizCode = bizCode;
    this.bizMessage = bizMessage;
  }
};
var MediaFileType;
(function(MediaFileType2) {
  MediaFileType2[MediaFileType2["IMAGE"] = 1] = "IMAGE";
  MediaFileType2[MediaFileType2["VIDEO"] = 2] = "VIDEO";
  MediaFileType2[MediaFileType2["VOICE"] = 3] = "VOICE";
  MediaFileType2[MediaFileType2["FILE"] = 4] = "FILE";
})(MediaFileType || (MediaFileType = {}));
var StreamInputMode = {
  REPLACE: "replace"
};
var StreamInputState = {
  GENERATING: 1,
  DONE: 10
};
var StreamContentType = {
  MARKDOWN: "markdown"
};

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/utils/format.js
init_define_MACRO();
function formatErrorMessage(err) {
  if (err instanceof Error) {
    let formatted = err.message || err.name || "Error";
    let cause = err.cause;
    const seen = /* @__PURE__ */ new Set([err]);
    while (cause && !seen.has(cause)) {
      seen.add(cause);
      if (cause instanceof Error) {
        if (cause.message) {
          formatted += ` | ${cause.message}`;
        }
        cause = cause.cause;
      } else if (typeof cause === "string") {
        formatted += ` | ${cause}`;
        break;
      } else {
        break;
      }
    }
    return formatted;
  }
  if (typeof err === "string") {
    return err;
  }
  if (err === null || err === void 0 || typeof err === "number" || typeof err === "boolean" || typeof err === "bigint") {
    return String(err);
  }
  try {
    return JSON.stringify(err);
  } catch {
    return Object.prototype.toString.call(err);
  }
}
function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/api/api-client.js
var DEFAULT_BASE_URL = "https://api.sgroup.qq.com";
var DEFAULT_TIMEOUT_MS = 3e4;
var FILE_UPLOAD_TIMEOUT_MS = 12e4;
var ApiClient = class {
  baseUrl;
  defaultTimeoutMs;
  fileUploadTimeoutMs;
  logger;
  resolveUserAgent;
  constructor(config2 = {}) {
    this.baseUrl = config2.baseUrl ?? DEFAULT_BASE_URL;
    this.defaultTimeoutMs = config2.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fileUploadTimeoutMs = config2.fileUploadTimeoutMs ?? FILE_UPLOAD_TIMEOUT_MS;
    this.logger = config2.logger;
    const ua = config2.userAgent ?? "qqbot-nodejs/unknown";
    this.resolveUserAgent = typeof ua === "function" ? ua : () => ua;
  }
  async request(accessToken, method, path2, body, options) {
    const url = `${this.baseUrl}${path2}`;
    const headers = {
      Authorization: `QQBot ${accessToken}`,
      "Content-Type": "application/json",
      "User-Agent": this.resolveUserAgent()
    };
    const isFileUpload = options?.uploadRequest === true || path2.includes("/files") || path2.includes("/upload_prepare") || path2.includes("/upload_part_finish");
    const timeout = options?.timeoutMs ?? (isFileUpload ? this.fileUploadTimeoutMs : this.defaultTimeoutMs);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const fetchInit = { method, headers, signal: controller.signal };
    if (body) {
      fetchInit.body = JSON.stringify(body);
    }
    this.logger?.debug?.(`[qqbot:api] >>> ${method} ${url} (timeout: ${timeout}ms)`);
    if (body && this.logger?.debug) {
      const logBody = { ...body };
      for (const key of options?.redactBodyKeys ?? ["file_data"]) {
        if (typeof logBody[key] === "string") {
          logBody[key] = `<redacted ${logBody[key].length} chars>`;
        }
      }
      this.logger.debug(`[qqbot:api] >>> Body: ${JSON.stringify(logBody)}`);
    }
    let res;
    try {
      res = await fetch(url, fetchInit);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        this.logger?.error?.(`[qqbot:api] <<< Timeout after ${timeout}ms`);
        throw new ApiError(`Request timeout [${path2}]: exceeded ${timeout}ms`, 0, path2);
      }
      this.logger?.error?.(`[qqbot:api] <<< Network error: ${formatErrorMessage(err)}`);
      throw new ApiError(`Network error [${path2}]: ${formatErrorMessage(err)}`, 0, path2);
    } finally {
      clearTimeout(timeoutId);
    }
    const traceId = res.headers.get("x-tps-trace-id") ?? "";
    this.logger?.info?.(`[qqbot:api] <<< Status: ${res.status} ${res.statusText}${traceId ? ` | TraceId: ${traceId}` : ""}`);
    let rawBody;
    try {
      rawBody = await res.text();
    } catch (err) {
      throw new ApiError(`Failed to read response [${path2}]: ${formatErrorMessage(err)}`, res.status, path2);
    }
    this.logger?.debug?.(`[qqbot:api] <<< Body: ${rawBody}`);
    const contentType = res.headers.get("content-type") ?? "";
    const isHtmlResponse = contentType.includes("text/html") || rawBody.trimStart().startsWith("<");
    if (!res.ok) {
      if (isHtmlResponse) {
        const statusHint = res.status === 502 || res.status === 503 || res.status === 504 ? "\u8C03\u7528\u53D1\u751F\u5F02\u5E38\uFF0C\u8BF7\u7A0D\u5019\u91CD\u8BD5" : res.status === 429 ? "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u5DF2\u88AB\u9650\u6D41" : `\u5F00\u653E\u5E73\u53F0\u8FD4\u56DE HTTP ${res.status}`;
        throw new ApiError(`${statusHint}\uFF08${path2}\uFF09\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5`, res.status, path2);
      }
      try {
        const error = JSON.parse(rawBody);
        const bizCode = error.code ?? error.err_code;
        throw new ApiError(`API Error [${path2}]: ${error.message ?? rawBody}`, res.status, path2, bizCode, error.message);
      } catch (parseErr) {
        if (parseErr instanceof ApiError) {
          throw parseErr;
        }
        throw new ApiError(`API Error [${path2}] HTTP ${res.status}: ${rawBody.slice(0, 200)}`, res.status, path2);
      }
    }
    if (isHtmlResponse) {
      throw new ApiError(`QQ \u670D\u52A1\u7AEF\u8FD4\u56DE\u4E86\u975E JSON \u54CD\u5E94\uFF08${path2}\uFF09\uFF0C\u53EF\u80FD\u662F\u4E34\u65F6\u6545\u969C\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5`, res.status, path2);
    }
    try {
      return JSON.parse(rawBody);
    } catch {
      throw new ApiError(`\u5F00\u653E\u5E73\u53F0\u54CD\u5E94\u683C\u5F0F\u5F02\u5E38\uFF08${path2}\uFF09\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5`, res.status, path2);
    }
  }
};

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/api/media-chunked.js
init_define_MACRO();
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as https from "node:https";

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/api/retry.js
init_define_MACRO();
async function withRetry(fn, policy, persistentPolicy, logger) {
  let lastError = null;
  for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(formatErrorMessage(err));
      if (persistentPolicy?.shouldPersistRetry(lastError)) {
        (logger?.warn ?? logger?.error)?.(`[qqbot:retry] Hit persistent-retry trigger, entering persistent loop (timeout=${persistentPolicy.timeoutMs / 1e3}s)`);
        return await persistentRetryLoop(fn, persistentPolicy, logger);
      }
      if (policy.shouldRetry?.(lastError, attempt) === false) {
        throw lastError;
      }
      if (attempt < policy.maxRetries) {
        const delay = policy.backoff === "exponential" ? policy.baseDelayMs * 2 ** attempt : policy.baseDelayMs;
        logger?.debug?.(`[qqbot:retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms: ${lastError.message.slice(0, 100)}`);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}
async function persistentRetryLoop(fn, policy, logger) {
  const deadline = Date.now() + policy.timeoutMs;
  let attempt = 0;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const result = await fn();
      logger?.debug?.(`[qqbot:retry] Persistent retry succeeded after ${attempt} retries`);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(formatErrorMessage(err));
      if (!policy.shouldPersistRetry(lastError)) {
        logger?.error?.(`[qqbot:retry] Persistent retry: error is no longer retryable, aborting`);
        throw lastError;
      }
      attempt++;
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        break;
      }
      const actualDelay = Math.min(policy.intervalMs, remaining);
      (logger?.warn ?? logger?.error)?.(`[qqbot:retry] Persistent retry #${attempt}: retrying in ${actualDelay}ms (remaining=${Math.round(remaining / 1e3)}s)`);
      await sleep(actualDelay);
    }
  }
  logger?.error?.(`[qqbot:retry] Persistent retry timed out after ${policy.timeoutMs / 1e3}s (${attempt} attempts)`);
  throw lastError ?? new Error(`Persistent retry timed out (${policy.timeoutMs / 1e3}s)`);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
var UPLOAD_RETRY_POLICY = {
  maxRetries: 2,
  baseDelayMs: 1e3,
  backoff: "exponential",
  shouldRetry: (error) => {
    const msg = error.message;
    return !(msg.includes("400") || msg.includes("401") || msg.includes("Invalid") || msg.includes("timeout") || msg.includes("Timeout"));
  }
};
var COMPLETE_UPLOAD_RETRY_POLICY = {
  maxRetries: 2,
  baseDelayMs: 2e3,
  backoff: "exponential"
};
var PART_FINISH_RETRY_POLICY = {
  maxRetries: 2,
  baseDelayMs: 1e3,
  backoff: "exponential"
};
function buildPartFinishPersistentPolicy(retryTimeoutMs, retryableCodes = PART_FINISH_RETRYABLE_CODES) {
  return {
    timeoutMs: retryTimeoutMs ?? 2 * 60 * 1e3,
    intervalMs: 1e3,
    shouldPersistRetry: (error) => {
      if (retryableCodes.size === 0) {
        return false;
      }
      if ("bizCode" in error && typeof error.bizCode === "number") {
        return retryableCodes.has(error.bizCode);
      }
      return false;
    }
  };
}
var PART_FINISH_RETRYABLE_CODES = /* @__PURE__ */ new Set([40093001]);
var UPLOAD_PREPARE_FALLBACK_CODE = 40093002;

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/api/routes.js
init_define_MACRO();
function messagePath(scope, targetId) {
  return scope === "c2c" ? `/v2/users/${targetId}/messages` : `/v2/groups/${targetId}/messages`;
}
function channelMessagePath(channelId) {
  return `/channels/${channelId}/messages`;
}
function dmMessagePath(guildId) {
  return `/dms/${guildId}/messages`;
}
function mediaUploadPath(scope, targetId) {
  return scope === "c2c" ? `/v2/users/${targetId}/files` : `/v2/groups/${targetId}/files`;
}
function uploadPreparePath(scope, targetId) {
  return scope === "c2c" ? `/v2/users/${targetId}/upload_prepare` : `/v2/groups/${targetId}/upload_prepare`;
}
function uploadPartFinishPath(scope, targetId) {
  return scope === "c2c" ? `/v2/users/${targetId}/upload_part_finish` : `/v2/groups/${targetId}/upload_part_finish`;
}
function uploadCompletePath(scope, targetId) {
  return mediaUploadPath(scope, targetId);
}
function streamMessagePath(openid) {
  return `/v2/users/${openid}/stream_messages`;
}
function gatewayPath() {
  return "/gateway";
}
function interactionPath(interactionId) {
  return `/interactions/${interactionId}`;
}
function getNextMsgSeq(_msgId) {
  const timePart = Date.now() % 1e8;
  const random = Math.floor(Math.random() * 65536);
  return (timePart ^ random) % 65536;
}

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/api/media-chunked.js
var UploadDailyLimitExceededError = class extends Error {
  filePath;
  fileSize;
  name = "UploadDailyLimitExceededError";
  constructor(filePath, fileSize, originalMessage) {
    super(originalMessage);
    this.filePath = filePath;
    this.fileSize = fileSize;
  }
};
var DEFAULT_CONCURRENT_PARTS = 1;
var MAX_CONCURRENT_PARTS = 10;
var MAX_PART_FINISH_RETRY_TIMEOUT_MS = 10 * 60 * 1e3;
var PART_UPLOAD_TIMEOUT_MS = 3e5;
var MD5_10M_SIZE = 10002432;
var ChunkedMediaApi = class {
  client;
  tokenManager;
  logger;
  cache;
  sanitize;
  constructor(client, tokenManager, config2 = {}) {
    this.client = client;
    this.tokenManager = tokenManager;
    this.logger = config2.logger;
    this.cache = config2.uploadCache;
    this.sanitize = config2.sanitizeFileName ?? ((n) => n);
  }
  async uploadChunked(opts) {
    const prefix = opts.logPrefix ?? "[qqbot:chunked-upload]";
    const input = resolveSource(opts.source, opts.fileName);
    const displayName = input.fileName;
    const fileSize = input.size;
    const pathLabel = input.kind === "localPath" ? input.path : "<buffer>";
    this.logger?.info?.(`${prefix} Start: file=${displayName} size=${formatFileSize(fileSize)} type=${opts.fileType}`);
    const hashes = await computeHashes(input);
    this.logger?.debug?.(`${prefix} hashes: md5=${hashes.md5} sha1=${hashes.sha1} md5_10m=${hashes.md5_10m}`);
    if (this.cache) {
      const cached = this.cache.get(hashes.md5, opts.scope, opts.targetId, opts.fileType);
      if (cached) {
        this.logger?.info?.(`${prefix} cache HIT (md5=${hashes.md5.slice(0, 8)}) \u2014 skipping chunked upload`);
        return { file_uuid: "", file_info: cached, ttl: 0 };
      }
    }
    const fileNameForPrepare = opts.fileType === MediaFileType.FILE ? this.sanitize(displayName) : displayName;
    const prepareResp = await this.callUploadPrepare(opts, fileNameForPrepare, fileSize, hashes, pathLabel);
    const { upload_id, parts } = prepareResp;
    const block_size = prepareResp.block_size;
    const maxConcurrent = Math.min(prepareResp.concurrency ? prepareResp.concurrency : DEFAULT_CONCURRENT_PARTS, MAX_CONCURRENT_PARTS);
    const retryTimeoutMs = prepareResp.retry_timeout ? Math.min(prepareResp.retry_timeout * 1e3, MAX_PART_FINISH_RETRY_TIMEOUT_MS) : void 0;
    this.logger?.info?.(`${prefix} prepared: upload_id=${upload_id} block=${formatFileSize(block_size)} parts=${parts.length} concurrency=${maxConcurrent}`);
    let completedParts = 0;
    let uploadedBytes = 0;
    const uploadPart = async (part) => {
      const partIndex = part.index;
      const offset = (partIndex - 1) * block_size;
      const length = Math.min(block_size, fileSize - offset);
      const partBuffer = await readPart(input, offset, length);
      const md5Hex = crypto.createHash("md5").update(partBuffer).digest("hex");
      this.logger?.debug?.(`${prefix} part ${partIndex}/${parts.length}: ${formatFileSize(length)} offset=${offset} md5=${md5Hex}`);
      await putToPresignedUrl(part.presigned_url, partBuffer, partIndex, parts.length, this.logger, prefix);
      await this.callUploadPartFinish(opts, upload_id, partIndex, length, md5Hex, retryTimeoutMs);
      completedParts++;
      uploadedBytes += length;
      this.logger?.info?.(`${prefix} part ${partIndex}/${parts.length} done (${completedParts}/${parts.length})`);
      opts.onProgress?.({
        completedParts,
        totalParts: parts.length,
        uploadedBytes,
        totalBytes: fileSize
      });
    };
    await runWithConcurrency(parts.map((part) => () => uploadPart(part)), maxConcurrent);
    this.logger?.info?.(`${prefix} all parts uploaded, completing...`);
    const result = await this.callCompleteUpload(opts, upload_id);
    this.logger?.info?.(`${prefix} completed: file_uuid=${result.file_uuid} ttl=${result.ttl}s`);
    if (this.cache && result.file_info && result.ttl > 0) {
      this.cache.set(hashes.md5, opts.scope, opts.targetId, opts.fileType, result.file_info, result.file_uuid, result.ttl);
    }
    return result;
  }
  async callUploadPrepare(opts, fileName, fileSize, hashes, pathLabel) {
    const token = await this.tokenManager.getAccessToken(opts.creds.appId, opts.creds.clientSecret);
    const path2 = uploadPreparePath(opts.scope, opts.targetId);
    try {
      return await this.client.request(token, "POST", path2, {
        file_type: opts.fileType,
        file_name: fileName,
        file_size: fileSize,
        md5: hashes.md5,
        sha1: hashes.sha1,
        md5_10m: hashes.md5_10m
      }, { uploadRequest: true });
    } catch (err) {
      if (err instanceof ApiError && err.bizCode === UPLOAD_PREPARE_FALLBACK_CODE) {
        throw new UploadDailyLimitExceededError(pathLabel, fileSize, err.message);
      }
      throw err;
    }
  }
  async callUploadPartFinish(opts, uploadId, partIndex, blockSize, md5, retryTimeoutMs) {
    const persistentPolicy = buildPartFinishPersistentPolicy(retryTimeoutMs);
    const path2 = uploadPartFinishPath(opts.scope, opts.targetId);
    await withRetry(async () => {
      const token = await this.tokenManager.getAccessToken(opts.creds.appId, opts.creds.clientSecret);
      return this.client.request(token, "POST", path2, {
        upload_id: uploadId,
        part_index: partIndex,
        block_size: blockSize,
        md5
      }, { uploadRequest: true });
    }, PART_FINISH_RETRY_POLICY, persistentPolicy, this.logger);
  }
  async callCompleteUpload(opts, uploadId) {
    const path2 = uploadCompletePath(opts.scope, opts.targetId);
    return withRetry(async () => {
      const token = await this.tokenManager.getAccessToken(opts.creds.appId, opts.creds.clientSecret);
      return this.client.request(token, "POST", path2, { upload_id: uploadId }, { uploadRequest: true });
    }, COMPLETE_UPLOAD_RETRY_POLICY, void 0, this.logger);
  }
};
function resolveSource(source, fileNameOverride) {
  if (source.kind === "localPath") {
    const inferredName = source.path.split(/[/\\]/).pop() || "file";
    return {
      kind: "localPath",
      path: source.path,
      size: source.size,
      fileName: fileNameOverride ?? inferredName
    };
  }
  return {
    kind: "buffer",
    buffer: source.buffer,
    size: source.buffer.length,
    fileName: fileNameOverride ?? source.fileName ?? "file"
  };
}
async function readPart(input, offset, length) {
  if (input.kind === "buffer") {
    return input.buffer.subarray(offset, offset + length);
  }
  const handle = await fs.promises.open(input.path, "r");
  try {
    const buf = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buf, 0, length, offset);
    return bytesRead < length ? buf.subarray(0, bytesRead) : buf;
  } finally {
    await handle.close();
  }
}
async function computeHashes(input) {
  if (input.kind === "buffer") {
    const md5 = crypto.createHash("md5").update(input.buffer).digest("hex");
    const sha1 = crypto.createHash("sha1").update(input.buffer).digest("hex");
    const md5_10m = input.size > MD5_10M_SIZE ? crypto.createHash("md5").update(input.buffer.subarray(0, MD5_10M_SIZE)).digest("hex") : md5;
    return { md5, sha1, md5_10m };
  }
  return new Promise((resolve, reject) => {
    const md5 = crypto.createHash("md5");
    const sha1 = crypto.createHash("sha1");
    const md5_10m = crypto.createHash("md5");
    let consumed = 0;
    const needsMd5_10m = input.size > MD5_10M_SIZE;
    const stream = fs.createReadStream(input.path);
    stream.on("data", (chunk) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      md5.update(buf);
      sha1.update(buf);
      if (needsMd5_10m) {
        const remaining = MD5_10M_SIZE - consumed;
        if (remaining > 0) {
          md5_10m.update(remaining >= buf.length ? buf : buf.subarray(0, remaining));
        }
      }
      consumed += buf.length;
    });
    stream.on("end", () => {
      const md5Hex = md5.digest("hex");
      const sha1Hex = sha1.digest("hex");
      resolve({
        md5: md5Hex,
        sha1: sha1Hex,
        md5_10m: needsMd5_10m ? md5_10m.digest("hex") : md5Hex
      });
    });
    stream.on("error", reject);
  });
}
var PART_UPLOAD_MAX_RETRIES = 2;
function putToCOS(presignedUrl, data, signal) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(presignedUrl);
    const req = https.request(parsed, {
      method: "PUT",
      headers: { "Content-Length": String(data.length) },
      signal
    }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const etag = (res.headers.etag ?? "").replace(/"/g, "");
        const requestId = res.headers["x-cos-request-id"]?.toString() ?? "-";
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, etag, requestId });
        } else {
          reject(new Error(`COS PUT failed: ${res.statusCode} ${res.statusMessage ?? ""} - ${Buffer.concat(chunks).toString().slice(0, 120)}`));
        }
      });
      res.on("error", reject);
    });
    req.on("error", (err) => {
      reject(err);
    });
    req.end(data);
  });
}
async function putToPresignedUrl(presignedUrl, data, partIndex, totalParts, logger, prefix) {
  let lastError = null;
  for (let attempt = 0; attempt <= PART_UPLOAD_MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PART_UPLOAD_TIMEOUT_MS);
    try {
      const startTime = Date.now();
      const { etag, requestId } = await putToCOS(presignedUrl, data, controller.signal);
      const elapsed = Date.now() - startTime;
      logger?.debug?.(`${prefix} PUT part ${partIndex}/${totalParts} OK (${elapsed}ms ETag=${etag} requestId=${requestId})`);
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const code = err.code ?? "none";
      const causeMsg = (() => {
        const c = err instanceof Error ? err.cause : void 0;
        return c instanceof Error ? c.message : "none";
      })();
      if (lastError.name === "AbortError") {
        lastError = new Error(`Part ${partIndex}/${totalParts} upload timeout after ${PART_UPLOAD_TIMEOUT_MS}ms`);
      }
      if (attempt < PART_UPLOAD_MAX_RETRIES) {
        const delay = 1e3 * 2 ** attempt;
        (logger?.warn ?? logger?.error)?.(`${prefix} PUT part ${partIndex}/${totalParts} attempt ${attempt + 1} failed (${lastError.message.slice(0, 120)} code=${code} cause=${causeMsg}), retrying in ${delay}ms`);
        await sleep2(delay);
      } else {
        logger?.error?.(`${prefix} PUT part ${partIndex}/${totalParts} all retries exhausted (code=${code} cause=${causeMsg})`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw lastError ?? new Error(`Part ${partIndex}/${totalParts} upload failed`);
}
async function runWithConcurrency(tasks, maxConcurrent) {
  for (let i = 0; i < tasks.length; i += maxConcurrent) {
    const batch = tasks.slice(i, i + maxConcurrent);
    await Promise.all(batch.map((task) => task()));
  }
}
function sleep2(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/api/media.js
init_define_MACRO();
import * as fs2 from "node:fs";

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/utils/file-utils.js
init_define_MACRO();
var MAX_UPLOAD_SIZE = 20 * 1024 * 1024;
var CHUNKED_UPLOAD_MAX_SIZE = 100 * 1024 * 1024;
var LARGE_FILE_THRESHOLD = 5 * 1024 * 1024;
var MEDIA_FILE_TYPE_INFO = {
  [MediaFileType.IMAGE]: { maxSize: 30 * 1024 * 1024, name: "image" },
  [MediaFileType.VIDEO]: { maxSize: 100 * 1024 * 1024, name: "video" },
  [MediaFileType.VOICE]: { maxSize: 20 * 1024 * 1024, name: "voice" },
  [MediaFileType.FILE]: { maxSize: 100 * 1024 * 1024, name: "file" }
};
function sanitizeFileName(name) {
  if (!name) {
    return "file";
  }
  const cleaned = name.replace(/[\\/:*?"<>|]/g, "_").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
  return cleaned || "file";
}

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/api/media.js
var MAX_BASE64_CHECK_SIZE = Math.ceil(MAX_UPLOAD_SIZE * 1.4);
function formatUploadSize() {
  return formatFileSize(MAX_UPLOAD_SIZE);
}
var MediaApi = class {
  client;
  tokenManager;
  logger;
  cache;
  sanitize;
  constructor(client, tokenManager, config2 = {}) {
    this.client = client;
    this.tokenManager = tokenManager;
    this.logger = config2.logger;
    this.cache = config2.uploadCache;
    this.sanitize = config2.sanitizeFileName ?? ((n) => n);
  }
  /**
   * Upload media via base64, URL, buffer, or local file path to a C2C or Group target.
   */
  async uploadMedia(scope, targetId, fileType, creds, opts) {
    const sources = [opts.url, opts.fileData, opts.buffer, opts.localPath].filter((v) => v !== void 0);
    if (sources.length === 0) {
      throw new Error(`uploadMedia: one of url/fileData/buffer/localPath is required`);
    }
    if (sources.length > 1) {
      throw new Error(`uploadMedia: url/fileData/buffer/localPath are mutually exclusive (got ${sources.length})`);
    }
    let fileData = opts.fileData;
    if (opts.buffer) {
      fileData = opts.buffer.toString("base64");
    } else if (opts.localPath) {
      const buf = await fs2.promises.readFile(opts.localPath);
      fileData = buf.toString("base64");
    }
    if (fileData && fileData.length > MAX_BASE64_CHECK_SIZE) {
      const sizeMB = (fileData.length / (1024 * 1024)).toFixed(1);
      throw new Error(`fileData too large (${sizeMB}MB decoded); QQ Bot single upload limit is ${formatUploadSize()}`);
    }
    if (fileData && this.cache) {
      const hash = this.cache.computeHash(fileData);
      const cached = this.cache.get(hash, scope, targetId, fileType);
      if (cached) {
        return { file_uuid: "", file_info: cached, ttl: 0 };
      }
    }
    const body = {
      file_type: fileType,
      srv_send_msg: opts.srvSendMsg ?? false
    };
    if (opts.url) {
      body.url = opts.url;
    } else if (fileData) {
      body.file_data = fileData;
    }
    if (fileType === MediaFileType.FILE && opts.fileName) {
      body.file_name = this.sanitize(opts.fileName);
    }
    const token = await this.tokenManager.getAccessToken(creds.appId, creds.clientSecret);
    const path2 = mediaUploadPath(scope, targetId);
    const result = await withRetry(() => this.client.request(token, "POST", path2, body, {
      redactBodyKeys: ["file_data"],
      uploadRequest: true
    }), UPLOAD_RETRY_POLICY, void 0, this.logger);
    if (fileData && result.file_info && result.ttl > 0 && this.cache) {
      const hash = this.cache.computeHash(fileData);
      this.cache.set(hash, scope, targetId, fileType, result.file_info, result.file_uuid, result.ttl);
    }
    return result;
  }
  /**
   * Send a media message (post upload) to a C2C or Group target.
   */
  async sendMediaMessage(scope, targetId, fileInfo, creds, opts) {
    const token = await this.tokenManager.getAccessToken(creds.appId, creds.clientSecret);
    const msgSeq = opts?.msgId ? getNextMsgSeq(opts.msgId) : 1;
    const path2 = messagePath(scope, targetId);
    return this.client.request(token, "POST", path2, {
      msg_type: 7,
      media: { file_info: fileInfo },
      msg_seq: msgSeq,
      ...opts?.content ? { content: opts.content } : {},
      ...opts?.msgId ? { msg_id: opts.msgId } : {}
    });
  }
};

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/api/messages.js
init_define_MACRO();
var MessageApi = class {
  client;
  tokenManager;
  markdownSupport;
  logger;
  messageSentHook = null;
  constructor(client, tokenManager, config2) {
    this.client = client;
    this.tokenManager = tokenManager;
    this.markdownSupport = config2.markdownSupport;
    this.logger = config2.logger;
  }
  onMessageSent(callback) {
    this.messageSentHook = callback;
  }
  notifyMessageSent(refIdx, meta) {
    if (this.messageSentHook) {
      try {
        this.messageSentHook(refIdx, meta);
      } catch (err) {
        this.logger?.error?.(`[qqbot:messages] onMessageSent hook error: ${formatErrorMessage(err)}`);
      }
    }
  }
  async sendMessage(scope, targetId, content, creds, opts) {
    const token = await this.tokenManager.getAccessToken(creds.appId, creds.clientSecret);
    const msgSeq = opts?.msgId ? getNextMsgSeq(opts.msgId) : 1;
    const body = this.buildMessageBody(content, opts?.msgId, msgSeq, opts?.messageReference, opts?.inlineKeyboard);
    const path2 = messagePath(scope, targetId);
    return this.sendAndNotify(creds.appId, token, "POST", path2, body, { text: content });
  }
  async sendProactiveMessage(scope, targetId, content, creds) {
    if (!content?.trim()) {
      throw new Error("Proactive message content must not be empty");
    }
    const token = await this.tokenManager.getAccessToken(creds.appId, creds.clientSecret);
    const body = this.buildProactiveBody(content);
    const path2 = messagePath(scope, targetId);
    return this.sendAndNotify(creds.appId, token, "POST", path2, body, { text: content });
  }
  async sendChannelMessage(opts) {
    const token = await this.tokenManager.getAccessToken(opts.creds.appId, opts.creds.clientSecret);
    return this.client.request(token, "POST", channelMessagePath(opts.channelId), {
      content: opts.content,
      ...opts.msgId ? { msg_id: opts.msgId } : {}
    });
  }
  async sendDmMessage(opts) {
    const token = await this.tokenManager.getAccessToken(opts.creds.appId, opts.creds.clientSecret);
    return this.client.request(token, "POST", dmMessagePath(opts.guildId), {
      content: opts.content,
      ...opts.msgId ? { msg_id: opts.msgId } : {}
    });
  }
  /** Send a typing indicator to a C2C user. */
  async sendInputNotify(opts) {
    const inputSecond = opts.inputSecond ?? 60;
    const token = await this.tokenManager.getAccessToken(opts.creds.appId, opts.creds.clientSecret);
    const msgSeq = opts.msgId ? getNextMsgSeq(opts.msgId) : 1;
    const response = await this.client.request(token, "POST", messagePath("c2c", opts.openid), {
      msg_type: 6,
      input_notify: { input_type: 1, input_second: inputSecond },
      msg_seq: msgSeq,
      ...opts.msgId ? { msg_id: opts.msgId } : {}
    });
    return { refIdx: response.ext_info?.ref_idx };
  }
  async acknowledgeInteraction(interactionId, creds, code = 0, data) {
    const token = await this.tokenManager.getAccessToken(creds.appId, creds.clientSecret);
    const body = { code };
    if (data)
      body.data = data;
    await this.client.request(token, "PUT", interactionPath(interactionId), body);
  }
  /** Get the WebSocket gateway URL for the bot. */
  async getGatewayUrl(creds) {
    const token = await this.tokenManager.getAccessToken(creds.appId, creds.clientSecret);
    const data = await this.client.request(token, "GET", gatewayPath());
    return data.url;
  }
  /**
   * Send a C2C stream message chunk (`/v2/users/{openid}/stream_messages`).
   * Only supported for one-to-one chats.
   */
  async sendC2CStreamMessage(creds, openid, req) {
    const token = await this.tokenManager.getAccessToken(creds.appId, creds.clientSecret);
    const path2 = streamMessagePath(openid);
    const body = {
      input_mode: req.input_mode,
      input_state: req.input_state,
      content_type: req.content_type,
      content_raw: req.content_raw,
      event_id: req.event_id,
      msg_id: req.msg_id,
      msg_seq: req.msg_seq,
      index: req.index
    };
    if (req.stream_msg_id) {
      body.stream_msg_id = req.stream_msg_id;
    }
    return this.client.request(token, "POST", path2, body);
  }
  /**
   * Raw message send — transparently forwards all fields to the QQ Open Platform API.
   *
   * This is the "escape hatch" for any message type not covered by the
   * higher-level helpers. Fields like `msg_type`, `markdown`, `ark`, `embed`,
   * `keyboard`, `media`, `message_reference`, `is_wakeup` etc. are passed through
   * as-is to `/v2/users/{openid}/messages` or `/v2/groups/{group_openid}/messages`.
   *
   * Auto-injects `msg_seq` if not provided.
   */
  async sendRaw(scope, targetId, creds, body) {
    const token = await this.tokenManager.getAccessToken(creds.appId, creds.clientSecret);
    const path2 = messagePath(scope, targetId);
    if (body.msg_seq === void 0) {
      body.msg_seq = body.msg_id ? getNextMsgSeq(body.msg_id) : 1;
    }
    if (body.msg_type === void 0) {
      if (body.markdown)
        body.msg_type = 2;
      else if (body.ark)
        body.msg_type = 3;
      else if (body.embed)
        body.msg_type = 4;
      else if (body.media)
        body.msg_type = 7;
      else
        body.msg_type = 0;
    }
    const cleaned = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== void 0));
    return this.sendAndNotify(creds.appId, token, "POST", path2, cleaned, { text: cleaned.content ?? cleaned.markdown?.content });
  }
  /**
   * Send a message to a guild text channel.
   * Supports content, keyboard, message_reference, and arbitrary extra fields.
   */
  async sendChannelMessageRaw(channelId, creds, body) {
    const token = await this.tokenManager.getAccessToken(creds.appId, creds.clientSecret);
    const cleaned = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== void 0));
    return this.client.request(token, "POST", channelMessagePath(channelId), cleaned);
  }
  /**
   * Send a DM (direct message) in a guild.
   */
  async sendDmMessageRaw(guildId, creds, body) {
    const token = await this.tokenManager.getAccessToken(creds.appId, creds.clientSecret);
    const cleaned = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== void 0));
    return this.client.request(token, "POST", dmMessagePath(guildId), cleaned);
  }
  /**
   * Recall (delete) a message.
   */
  async recallMessage(scope, targetId, messageId, creds) {
    const token = await this.tokenManager.getAccessToken(creds.appId, creds.clientSecret);
    const path2 = `${messagePath(scope, targetId)}/${messageId}`;
    await this.client.request(token, "DELETE", path2);
  }
  async sendAndNotify(_appId, accessToken, method, path2, body, meta) {
    const result = await this.client.request(accessToken, method, path2, body);
    if (result.ext_info?.ref_idx && this.messageSentHook) {
      try {
        this.messageSentHook(result.ext_info.ref_idx, meta);
      } catch (err) {
        this.logger?.error?.(`[qqbot:messages] onMessageSent hook error: ${formatErrorMessage(err)}`);
      }
    }
    return result;
  }
  buildMessageBody(content, msgId, msgSeq, messageReference, inlineKeyboard) {
    const body = this.markdownSupport ? { markdown: { content }, msg_type: 2, msg_seq: msgSeq } : { content, msg_type: 0, msg_seq: msgSeq };
    if (msgId) {
      body.msg_id = msgId;
    }
    if (messageReference && !this.markdownSupport) {
      body.message_reference = { message_id: messageReference };
    }
    if (inlineKeyboard) {
      body.keyboard = inlineKeyboard;
    }
    return body;
  }
  buildProactiveBody(content) {
    return this.markdownSupport ? { markdown: { content }, msg_type: 2 } : { content, msg_type: 0 };
  }
};

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/api/token.js
init_define_MACRO();
var DEFAULT_TOKEN_BASE_URL = "https://bots.qq.com";
var TOKEN_PATH = "/app/getAppAccessToken";
var DEFAULT_TOKEN_TIMEOUT_MS = 1e4;
var FIVE_MINUTES_MS = 5 * 60 * 1e3;
var TokenManager = class {
  cache = /* @__PURE__ */ new Map();
  fetchPromises = /* @__PURE__ */ new Map();
  refreshControllers = /* @__PURE__ */ new Map();
  logger;
  resolveUserAgent;
  baseUrl;
  constructor(config2) {
    this.logger = config2?.logger;
    const ua = config2?.userAgent ?? "qqbot-nodejs/unknown";
    this.resolveUserAgent = typeof ua === "function" ? ua : () => ua;
    this.baseUrl = config2?.baseUrl ?? DEFAULT_TOKEN_BASE_URL;
  }
  async getAccessToken(appId, clientSecret) {
    const normalizedId = appId.trim();
    const cached = this.cache.get(normalizedId);
    const refreshAheadMs = cached ? Math.min(FIVE_MINUTES_MS, (cached.expiresAt - Date.now()) / 3) : 0;
    if (cached && Date.now() < cached.expiresAt - refreshAheadMs) {
      return cached.token;
    }
    let pending = this.fetchPromises.get(normalizedId);
    if (pending) {
      this.logger?.debug?.(`[qqbot:token:${normalizedId}] Fetch in progress, reusing promise`);
      return pending;
    }
    pending = (async () => {
      try {
        return await this.doFetchToken(normalizedId, clientSecret);
      } finally {
        this.fetchPromises.delete(normalizedId);
      }
    })();
    this.fetchPromises.set(normalizedId, pending);
    return pending;
  }
  clearCache(appId) {
    if (appId) {
      this.cache.delete(appId.trim());
      this.logger?.debug?.(`[qqbot:token:${appId}] Cache cleared`);
    } else {
      this.cache.clear();
      this.logger?.debug?.(`[token] All caches cleared`);
    }
  }
  getStatus(appId) {
    if (this.fetchPromises.has(appId)) {
      return { status: "refreshing", expiresAt: this.cache.get(appId)?.expiresAt ?? null };
    }
    const cached = this.cache.get(appId);
    if (!cached) {
      return { status: "none", expiresAt: null };
    }
    const remaining = cached.expiresAt - Date.now();
    const isValid = remaining > Math.min(FIVE_MINUTES_MS, remaining / 3);
    return { status: isValid ? "valid" : "expired", expiresAt: cached.expiresAt };
  }
  startBackgroundRefresh(appId, clientSecret, options) {
    if (this.refreshControllers.has(appId)) {
      this.logger?.info?.(`[qqbot:token:${appId}] Background refresh already running`);
      return;
    }
    const { refreshAheadMs = 5 * 60 * 1e3, randomOffsetMs = 30 * 1e3, minRefreshIntervalMs = 60 * 1e3, retryDelayMs = 5 * 1e3 } = options ?? {};
    const controller = new AbortController();
    this.refreshControllers.set(appId, controller);
    const { signal } = controller;
    const loop = async () => {
      this.logger?.info?.(`[qqbot:token:${appId}] Background refresh started`);
      while (!signal.aborted) {
        try {
          await this.getAccessToken(appId, clientSecret);
          const cached = this.cache.get(appId);
          if (cached) {
            const expiresIn = cached.expiresAt - Date.now();
            const randomOffset = Math.random() * randomOffsetMs;
            const refreshIn = Math.max(expiresIn - refreshAheadMs - randomOffset, minRefreshIntervalMs);
            this.logger?.debug?.(`[qqbot:token:${appId}] Next refresh in ${Math.round(refreshIn / 1e3)}s`);
            await this.abortableSleep(refreshIn, signal);
          } else {
            await this.abortableSleep(minRefreshIntervalMs, signal);
          }
        } catch (err) {
          if (signal.aborted) {
            break;
          }
          this.logger?.error?.(`[qqbot:token:${appId}] Background refresh failed: ${formatErrorMessage(err)}`);
          await this.abortableSleep(retryDelayMs, signal);
        }
      }
      this.refreshControllers.delete(appId);
      this.logger?.info?.(`[qqbot:token:${appId}] Background refresh stopped`);
    };
    loop().catch((err) => {
      if (this.refreshControllers.has(appId)) {
        this.refreshControllers.delete(appId);
        this.logger?.error?.(`[qqbot:token:${appId}] Background refresh crashed: ${formatErrorMessage(err)}`);
      }
    });
  }
  stopBackgroundRefresh(appId) {
    if (appId) {
      const ctrl = this.refreshControllers.get(appId);
      if (ctrl) {
        ctrl.abort();
        this.refreshControllers.delete(appId);
      }
    } else {
      for (const ctrl of this.refreshControllers.values()) {
        ctrl.abort();
      }
      this.refreshControllers.clear();
    }
  }
  isBackgroundRefreshRunning(appId) {
    if (appId) {
      return this.refreshControllers.has(appId);
    }
    return this.refreshControllers.size > 0;
  }
  async doFetchToken(appId, clientSecret) {
    const url = `${this.baseUrl}${TOKEN_PATH}`;
    this.logger?.debug?.(`[qqbot:token:${appId}] >>> POST ${url}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TOKEN_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": this.resolveUserAgent()
        },
        body: JSON.stringify({ appId, clientSecret }),
        signal: controller.signal
      });
    } catch (err) {
      this.logger?.error?.(`[qqbot:token:${appId}] Network error: ${formatErrorMessage(err)}`);
      throw new Error(`Network error getting access_token: ${formatErrorMessage(err)}`, {
        cause: err
      });
    } finally {
      clearTimeout(timeout);
    }
    const traceId = response.headers.get("x-tps-trace-id") ?? "";
    this.logger?.debug?.(`[qqbot:token:${appId}] <<< ${response.status}${traceId ? ` | TraceId: ${traceId}` : ""}`);
    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`Token fetch failed: HTTP ${response.status}${errorBody ? ` \u2014 ${errorBody.slice(0, 200)}` : ""}`);
    }
    let data;
    try {
      const rawBody = await response.text();
      const logBody = rawBody.replace(/"access_token"\s*:\s*"[^"]+"/g, '"access_token": "***"');
      this.logger?.debug?.(`[qqbot:token:${appId}] <<< Body: ${logBody}`);
      data = JSON.parse(rawBody);
    } catch (err) {
      throw new Error(`Failed to parse access_token response: ${formatErrorMessage(err)}`, {
        cause: err
      });
    }
    if (!data.access_token) {
      throw new Error(`Failed to get access_token: ${JSON.stringify(data)}`);
    }
    const expiresAt = Date.now() + (data.expires_in ?? 7200) * 1e3;
    this.cache.set(appId, { token: data.access_token, expiresAt, appId });
    this.logger?.debug?.(`[qqbot:token:${appId}] Cached, expires at: ${new Date(expiresAt).toISOString()}`);
    return data.access_token;
  }
  abortableSleep(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(signal.reason ?? new DOMException("The operation was aborted", "AbortError"));
        return;
      }
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      const onAbort = () => {
        clearTimeout(timer);
        reject(signal.reason ?? new DOMException("The operation was aborted", "AbortError"));
      };
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }
};

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/gateway/gateway-connection.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/gateway/codec.js
init_define_MACRO();
function decodeGatewayMessageData(data) {
  if (typeof data === "string") {
    return data;
  }
  if (Buffer.isBuffer(data)) {
    return data.toString("utf8");
  }
  if (Array.isArray(data) && data.every((chunk) => Buffer.isBuffer(chunk))) {
    return Buffer.concat(data).toString("utf8");
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString("utf8");
  }
  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString("utf8");
  }
  return "";
}
function readOptionalMessageSceneExt(event) {
  if (!("message_scene" in event)) {
    return void 0;
  }
  const scene = event.message_scene;
  return scene?.ext;
}

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/gateway/constants.js
init_define_MACRO();
var INTENTS = {
  GUILDS: 1 << 0,
  GUILD_MEMBERS: 1 << 1,
  PUBLIC_GUILD_MESSAGES: 1 << 30,
  DIRECT_MESSAGE: 1 << 12,
  GROUP_AND_C2C: 1 << 25,
  /** Button interaction callbacks (INTERACTION_CREATE). */
  INTERACTION: 1 << 26
};
var FULL_INTENTS = INTENTS.GUILDS | INTENTS.GUILD_MEMBERS | INTENTS.PUBLIC_GUILD_MESSAGES | INTENTS.DIRECT_MESSAGE | INTENTS.GROUP_AND_C2C | INTENTS.INTERACTION;
var RECONNECT_DELAYS = [1e3, 2e3, 5e3, 1e4, 3e4, 6e4];
var RATE_LIMIT_DELAY = 6e4;
var MAX_RECONNECT_ATTEMPTS = 100;
var MAX_QUICK_DISCONNECT_COUNT = 3;
var QUICK_DISCONNECT_THRESHOLD = 5e3;
var GatewayOp = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  RESUME: 6,
  RECONNECT: 7,
  INVALID_SESSION: 9,
  HELLO: 10,
  HEARTBEAT_ACK: 11
};
var GatewayCloseCode = {
  NORMAL: 1e3,
  AUTH_FAILED: 4004,
  INVALID_SESSION: 4006,
  SEQ_OUT_OF_RANGE: 4007,
  RATE_LIMITED: 4008,
  SESSION_TIMEOUT: 4009,
  SERVER_ERROR_START: 4900,
  SERVER_ERROR_END: 4913,
  INSUFFICIENT_INTENTS: 4914,
  DISALLOWED_INTENTS: 4915
};
var GatewayEvent = {
  READY: "READY",
  RESUMED: "RESUMED",
  // ── Message events ──
  C2C_MESSAGE_CREATE: "C2C_MESSAGE_CREATE",
  AT_MESSAGE_CREATE: "AT_MESSAGE_CREATE",
  DIRECT_MESSAGE_CREATE: "DIRECT_MESSAGE_CREATE",
  GROUP_AT_MESSAGE_CREATE: "GROUP_AT_MESSAGE_CREATE",
  GROUP_MESSAGE_CREATE: "GROUP_MESSAGE_CREATE",
  // ── Interaction ──
  INTERACTION_CREATE: "INTERACTION_CREATE",
  // ── Guild events (P1) ──
  GUILD_CREATE: "GUILD_CREATE",
  GUILD_UPDATE: "GUILD_UPDATE",
  GUILD_DELETE: "GUILD_DELETE",
  GUILD_MEMBER_ADD: "GUILD_MEMBER_ADD",
  GUILD_MEMBER_UPDATE: "GUILD_MEMBER_UPDATE",
  GUILD_MEMBER_REMOVE: "GUILD_MEMBER_REMOVE",
  CHANNEL_CREATE: "CHANNEL_CREATE",
  CHANNEL_UPDATE: "CHANNEL_UPDATE",
  CHANNEL_DELETE: "CHANNEL_DELETE",
  // ── Group/C2C lifecycle events (P1) ──
  GROUP_ADD_ROBOT: "GROUP_ADD_ROBOT",
  GROUP_DEL_ROBOT: "GROUP_DEL_ROBOT",
  GROUP_MSG_REJECT: "GROUP_MSG_REJECT",
  GROUP_MSG_RECEIVE: "GROUP_MSG_RECEIVE",
  FRIEND_ADD: "FRIEND_ADD",
  FRIEND_DEL: "FRIEND_DEL",
  C2C_MSG_REJECT: "C2C_MSG_REJECT",
  C2C_MSG_RECEIVE: "C2C_MSG_RECEIVE",
  // ── Reaction events ──
  MESSAGE_REACTION_ADD: "MESSAGE_REACTION_ADD",
  MESSAGE_REACTION_REMOVE: "MESSAGE_REACTION_REMOVE"
};

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/gateway/event-dispatcher.js
init_define_MACRO();
var REF_INDEX_KEY = "msg_idx";
function parseRefIndices(ext, msgType, msgElements) {
  let refMsgIdx;
  let msgIdx;
  if (Array.isArray(ext)) {
    for (const entry of ext) {
      if (typeof entry !== "string") {
        continue;
      }
      const eq = entry.indexOf("=");
      if (eq < 0) {
        continue;
      }
      const key = entry.slice(0, eq).trim();
      const val = entry.slice(eq + 1).trim();
      if (!val) {
        continue;
      }
      if (key === REF_INDEX_KEY) {
        msgIdx = val;
      } else if (key === "ref_msg_idx") {
        refMsgIdx = val;
      }
    }
  }
  if (msgType === 103 && Array.isArray(msgElements)) {
    for (const el of msgElements) {
      if (el?.msg_idx) {
        refMsgIdx = el.msg_idx;
        break;
      }
    }
  }
  return { refMsgIdx, msgIdx };
}
function dispatchEvent(eventType, data, _accountId, _log) {
  if (eventType === GatewayEvent.READY) {
    const d = data;
    return { action: "ready", data, sessionId: d.session_id };
  }
  if (eventType === GatewayEvent.RESUMED) {
    return { action: "resumed", data };
  }
  if (eventType === GatewayEvent.C2C_MESSAGE_CREATE) {
    const ev = data;
    const refs = parseRefIndices(ev.message_scene?.ext, ev.message_type, ev.msg_elements);
    return {
      action: "message",
      msg: {
        rawEventType: eventType,
        kind: "c2c",
        senderId: ev.author.user_openid,
        content: ev.content,
        messageId: ev.id,
        timestamp: ev.timestamp,
        attachments: ev.attachments,
        refMsgIdx: refs.refMsgIdx,
        msgIdx: refs.msgIdx,
        msgType: ev.message_type,
        messageScene: ev.message_scene,
        msgElements: ev.msg_elements,
        raw: ev
      }
    };
  }
  if (eventType === GatewayEvent.AT_MESSAGE_CREATE) {
    const ev = data;
    const refs = parseRefIndices(readOptionalMessageSceneExt(ev));
    return {
      action: "message",
      msg: {
        rawEventType: eventType,
        kind: "guild",
        senderId: ev.author.id,
        senderName: ev.author.username,
        content: ev.content,
        messageId: ev.id,
        timestamp: ev.timestamp,
        channelId: ev.channel_id,
        guildId: ev.guild_id,
        attachments: ev.attachments,
        refMsgIdx: refs.refMsgIdx,
        msgIdx: refs.msgIdx,
        raw: ev
      }
    };
  }
  if (eventType === GatewayEvent.DIRECT_MESSAGE_CREATE) {
    const ev = data;
    const refs = parseRefIndices(readOptionalMessageSceneExt(ev));
    return {
      action: "message",
      msg: {
        rawEventType: eventType,
        kind: "dm",
        senderId: ev.author.id,
        senderName: ev.author.username,
        content: ev.content,
        messageId: ev.id,
        timestamp: ev.timestamp,
        guildId: ev.guild_id,
        attachments: ev.attachments,
        refMsgIdx: refs.refMsgIdx,
        msgIdx: refs.msgIdx,
        raw: ev
      }
    };
  }
  if (eventType === GatewayEvent.GROUP_AT_MESSAGE_CREATE || eventType === GatewayEvent.GROUP_MESSAGE_CREATE) {
    const ev = data;
    const refs = parseRefIndices(ev.message_scene?.ext, ev.message_type, ev.msg_elements);
    return {
      action: "message",
      msg: {
        rawEventType: eventType,
        kind: "group",
        senderId: ev.author.member_openid,
        senderName: ev.author.username,
        senderIsBot: ev.author.bot,
        content: ev.content,
        messageId: ev.id,
        timestamp: ev.timestamp,
        groupOpenid: ev.group_openid,
        attachments: ev.attachments,
        refMsgIdx: refs.refMsgIdx,
        msgIdx: refs.msgIdx,
        msgType: ev.message_type,
        mentions: ev.mentions,
        messageScene: ev.message_scene,
        msgElements: ev.msg_elements,
        raw: ev
      }
    };
  }
  if (eventType === GatewayEvent.INTERACTION_CREATE) {
    return { action: "interaction", event: data };
  }
  return { action: "raw", type: eventType, data };
}

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/gateway/reconnect.js
init_define_MACRO();
var ReconnectState = class {
  accountId;
  log;
  attempts = 0;
  lastConnectTime = 0;
  quickDisconnectCount = 0;
  constructor(accountId, log) {
    this.accountId = accountId;
    this.log = log;
  }
  onConnected() {
    this.attempts = 0;
    this.lastConnectTime = Date.now();
  }
  isExhausted() {
    return this.attempts >= MAX_RECONNECT_ATTEMPTS;
  }
  getNextDelay(customDelay) {
    const delay = customDelay ?? RECONNECT_DELAYS[Math.min(this.attempts, RECONNECT_DELAYS.length - 1)];
    this.attempts++;
    this.log?.debug?.(`[${this.accountId}] Reconnecting in ${delay}ms (attempt ${this.attempts})`);
    return delay;
  }
  handleClose(code, isAborted) {
    if (code === GatewayCloseCode.INSUFFICIENT_INTENTS || code === GatewayCloseCode.DISALLOWED_INTENTS) {
      const reason = code === GatewayCloseCode.INSUFFICIENT_INTENTS ? "offline/sandbox-only" : "banned";
      this.log?.error(`[${this.accountId}] Bot is ${reason}. Please contact QQ platform.`);
      return {
        shouldReconnect: false,
        clearSession: false,
        refreshToken: false,
        fatal: true,
        reason
      };
    }
    if (code === GatewayCloseCode.AUTH_FAILED) {
      this.log?.info(`[${this.accountId}] Invalid token (4004), will refresh token and reconnect`);
      return {
        shouldReconnect: !isAborted,
        clearSession: false,
        refreshToken: true,
        fatal: false,
        reason: "invalid token (4004)"
      };
    }
    if (code === GatewayCloseCode.RATE_LIMITED) {
      this.log?.info(`[${this.accountId}] Rate limited (4008), waiting ${RATE_LIMIT_DELAY}ms`);
      return {
        shouldReconnect: !isAborted,
        reconnectDelay: RATE_LIMIT_DELAY,
        clearSession: false,
        refreshToken: false,
        fatal: false,
        reason: "rate limited (4008)"
      };
    }
    if (code === GatewayCloseCode.INVALID_SESSION || code === GatewayCloseCode.SEQ_OUT_OF_RANGE || code === GatewayCloseCode.SESSION_TIMEOUT) {
      const codeDesc = {
        [GatewayCloseCode.INVALID_SESSION]: "session no longer valid",
        [GatewayCloseCode.SEQ_OUT_OF_RANGE]: "invalid seq on resume",
        [GatewayCloseCode.SESSION_TIMEOUT]: "session timed out"
      };
      this.log?.info(`[${this.accountId}] Error ${code} (${codeDesc[code]}), will re-identify`);
      return {
        shouldReconnect: !isAborted,
        clearSession: true,
        refreshToken: true,
        fatal: false,
        reason: codeDesc[code]
      };
    }
    if (code >= GatewayCloseCode.SERVER_ERROR_START && code <= GatewayCloseCode.SERVER_ERROR_END) {
      this.log?.info(`[${this.accountId}] Internal error (${code}), will re-identify`);
      return {
        shouldReconnect: !isAborted && code !== GatewayCloseCode.NORMAL,
        clearSession: true,
        refreshToken: true,
        fatal: false,
        reason: `internal error (${code})`
      };
    }
    const connectionDuration = Date.now() - this.lastConnectTime;
    if (connectionDuration < QUICK_DISCONNECT_THRESHOLD && this.lastConnectTime > 0) {
      this.quickDisconnectCount++;
      this.log?.debug?.(`[${this.accountId}] Quick disconnect detected (${connectionDuration}ms), count: ${this.quickDisconnectCount}`);
      if (this.quickDisconnectCount >= MAX_QUICK_DISCONNECT_COUNT) {
        this.log?.error(`[${this.accountId}] Too many quick disconnects. This may indicate a permission issue.`);
        this.quickDisconnectCount = 0;
        return {
          shouldReconnect: !isAborted && code !== 1e3,
          reconnectDelay: RATE_LIMIT_DELAY,
          clearSession: false,
          refreshToken: false,
          fatal: false,
          reason: "too many quick disconnects"
        };
      }
    } else {
      this.quickDisconnectCount = 0;
    }
    return {
      shouldReconnect: !isAborted && code !== GatewayCloseCode.NORMAL,
      clearSession: false,
      refreshToken: false,
      fatal: false,
      reason: `close code ${code}`
    };
  }
};

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/gateway/gateway-connection.js
var GatewayConnection = class {
  isAborted = false;
  currentWs = null;
  heartbeatInterval = null;
  sessionId = null;
  lastSeq = null;
  isConnecting = false;
  reconnectTimer = null;
  shouldRefreshToken = false;
  reconnect;
  opts;
  resolveUserAgent;
  constructor(opts) {
    this.opts = opts;
    this.reconnect = new ReconnectState(opts.account.accountId, opts.log);
    const ua = opts.userAgent ?? "qqbot-nodejs/unknown";
    this.resolveUserAgent = typeof ua === "function" ? ua : () => ua;
  }
  /** Start the connection loop. Resolves when abortSignal fires. */
  async start() {
    this.restoreSession();
    this.registerAbortHandler();
    await this.connect();
    return new Promise((resolve) => {
      this.opts.abortSignal.addEventListener("abort", () => resolve());
    });
  }
  // ============ Session persistence ============
  restoreSession() {
    const saved = this.opts.session?.load();
    if (saved) {
      this.sessionId = saved.sessionId;
      this.lastSeq = saved.lastSeq;
      this.opts.log?.info?.(`[${this.opts.account.accountId}] Restored session: sessionId=${saved.sessionId}, lastSeq=${saved.lastSeq}`);
    }
  }
  saveCurrentSession() {
    if (!this.sessionId || !this.opts.session) {
      return;
    }
    this.opts.session.save({
      sessionId: this.sessionId,
      lastSeq: this.lastSeq
    });
  }
  // ============ Abort + cleanup ============
  registerAbortHandler() {
    this.opts.abortSignal.addEventListener("abort", () => {
      this.isAborted = true;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.cleanup();
    });
  }
  cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.currentWs && (this.currentWs.readyState === wrapper_default.OPEN || this.currentWs.readyState === wrapper_default.CONNECTING)) {
      this.currentWs.close();
    }
    this.currentWs = null;
  }
  // ============ Reconnect ============
  scheduleReconnect(customDelay) {
    if (this.isAborted || this.reconnect.isExhausted()) {
      this.opts.log?.error(`[${this.opts.account.accountId}] Max reconnect attempts reached or aborted`);
      return;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    const delay = this.reconnect.getNextDelay(customDelay);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isAborted) {
        void this.connect();
      }
    }, delay);
  }
  // ============ Connect ============
  async connect() {
    const { log, account } = this.opts;
    if (this.isConnecting) {
      log?.debug?.(`[${account.accountId}] Already connecting, skip`);
      return;
    }
    this.isConnecting = true;
    try {
      this.cleanup();
      if (this.shouldRefreshToken) {
        log?.debug?.(`[${account.accountId}] Refreshing token...`);
        this.opts.clearTokenCache?.();
        this.shouldRefreshToken = false;
      }
      const accessToken = await this.opts.getAccessToken();
      log?.info(`[${account.accountId}] \u2705 Access token obtained`);
      const gatewayUrl = await this.opts.getGatewayUrl(accessToken);
      log?.info(`[${account.accountId}] Connecting to ${gatewayUrl}`);
      const ws = new wrapper_default(gatewayUrl, {
        headers: { "User-Agent": this.resolveUserAgent() }
      });
      this.currentWs = ws;
      ws.on("open", () => {
        log?.info(`[${account.accountId}] WebSocket connected`);
        this.isConnecting = false;
        this.reconnect.onConnected();
      });
      ws.on("message", async (data) => {
        try {
          const rawData = decodeGatewayMessageData(data);
          const payload = JSON.parse(rawData);
          const { op, d, s, t } = payload;
          if (s) {
            this.lastSeq = s;
            this.saveCurrentSession();
          }
          switch (op) {
            case GatewayOp.HELLO:
              this.handleHello(ws, d, accessToken);
              break;
            case GatewayOp.DISPATCH: {
              log?.debug?.(`[${account.accountId}] Dispatch event: t=${t} payload=${previewPayload(d)}`);
              const result = dispatchEvent(t ?? "", d, account.accountId, log);
              if (result.action === "ready") {
                this.sessionId = result.sessionId;
                this.saveCurrentSession();
                this.opts.onReady?.(result.data);
              } else if (result.action === "resumed") {
                (this.opts.onResumed ?? this.opts.onReady)?.(result.data);
                this.saveCurrentSession();
              } else if (result.action === "interaction") {
                if (this.opts.onInteraction) {
                  void Promise.resolve(this.opts.onInteraction(result.event));
                } else if (this.opts.onRawEvent) {
                  void Promise.resolve(this.opts.onRawEvent(payload.t, payload.d));
                }
              } else if (result.action === "message") {
                void Promise.resolve(this.opts.onMessage(result.msg));
              } else if (result.action === "raw") {
                if (this.opts.onRawEvent) {
                  void Promise.resolve(this.opts.onRawEvent(result.type, result.data));
                }
              }
              break;
            }
            case GatewayOp.HEARTBEAT_ACK:
              break;
            case GatewayOp.RECONNECT:
              this.cleanup();
              this.scheduleReconnect();
              break;
            case GatewayOp.INVALID_SESSION: {
              const canResume = d;
              if (!canResume) {
                this.sessionId = null;
                this.lastSeq = null;
                this.opts.session?.clear();
                this.shouldRefreshToken = true;
              }
              this.cleanup();
              this.scheduleReconnect(3e3);
              break;
            }
          }
        } catch (err) {
          log?.error(`[${account.accountId}] Message parse error: ${err instanceof Error ? err.message : String(err)}`);
        }
      });
      ws.on("close", (code, reason) => {
        log?.info(`[${account.accountId}] WebSocket closed: ${code} ${reason.toString()}`);
        this.isConnecting = false;
        this.handleClose(code);
      });
      ws.on("error", (err) => {
        log?.error(`[${account.accountId}] WebSocket error: ${err.message}`);
        this.opts.onError?.(err);
      });
    } catch (err) {
      this.isConnecting = false;
      const errMsg = err instanceof Error ? err.message : String(err);
      log?.error(`[${account.accountId}] Connection failed: ${errMsg}`);
      if (errMsg.includes("Too many requests") || errMsg.includes("100001")) {
        this.scheduleReconnect(RATE_LIMIT_DELAY);
      } else {
        this.scheduleReconnect();
      }
    }
  }
  // ============ Protocol handlers ============
  handleHello(ws, d, accessToken) {
    const intents = this.opts.intents ?? FULL_INTENTS;
    if (this.sessionId && this.lastSeq !== null) {
      ws.send(JSON.stringify({
        op: GatewayOp.RESUME,
        d: {
          token: `QQBot ${accessToken}`,
          session_id: this.sessionId,
          seq: this.lastSeq
        }
      }));
    } else {
      ws.send(JSON.stringify({
        op: GatewayOp.IDENTIFY,
        d: {
          token: `QQBot ${accessToken}`,
          intents,
          shard: [0, 1]
        }
      }));
    }
    const interval = d.heartbeat_interval;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.heartbeatInterval = setInterval(() => {
      if (ws.readyState === wrapper_default.OPEN) {
        ws.send(JSON.stringify({ op: GatewayOp.HEARTBEAT, d: this.lastSeq }));
      }
    }, interval);
  }
  handleClose(code) {
    const action = this.reconnect.handleClose(code, this.isAborted);
    if (action.clearSession) {
      this.sessionId = null;
      this.lastSeq = null;
      this.opts.session?.clear();
    }
    if (action.refreshToken) {
      this.shouldRefreshToken = true;
    }
    this.cleanup();
    if (action.fatal) {
      return;
    }
    if (action.shouldReconnect) {
      this.scheduleReconnect(action.reconnectDelay);
    }
  }
};
function previewPayload(data) {
  if (data === void 0)
    return "undefined";
  if (data === null)
    return "null";
  try {
    const s = JSON.stringify(data);
    return s === void 0 ? "(non-serializable)" : s;
  } catch {
    return "(non-serializable)";
  }
}

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/transport/webhook.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/transport/webhook-verify.js
init_define_MACRO();
import * as crypto2 from "node:crypto";
function deriveSeed(botSecret) {
  let seed = botSecret;
  while (seed.length < 32) {
    seed = seed + seed;
  }
  return Buffer.from(seed.slice(0, 32), "utf-8");
}
function getKeyPair(botSecret) {
  const seed = deriveSeed(botSecret);
  const privateKey = crypto2.createPrivateKey({
    key: Buffer.concat([
      // Ed25519 PKCS8 DER prefix for 32-byte seed
      Buffer.from("302e020100300506032b657004220420", "hex"),
      seed
    ]),
    format: "der",
    type: "pkcs8"
  });
  const publicKey = crypto2.createPublicKey(privateKey);
  return { privateKey, publicKey };
}
function ed25519Sign(botSecret, message) {
  const { privateKey } = getKeyPair(botSecret);
  const signature = crypto2.sign(null, message, privateKey);
  return signature.toString("hex");
}
function verifyWebhookSignature(params) {
  const { body, timestamp, signature, botSecret } = params;
  try {
    const { publicKey } = getKeyPair(botSecret);
    const message = Buffer.concat([
      Buffer.from(timestamp, "utf-8"),
      body
    ]);
    const sigBuffer = Buffer.from(signature, "hex");
    return crypto2.verify(null, message, publicKey, sigBuffer);
  } catch {
    return false;
  }
}
function signValidationResponse(params) {
  const { plainToken, eventTs, botSecret } = params;
  const message = Buffer.from(eventTs + plainToken, "utf-8");
  const signature = ed25519Sign(botSecret, message);
  return {
    plain_token: plainToken,
    signature
  };
}

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/transport/webhook-server-node.js
init_define_MACRO();
import * as http from "node:http";
var NodeHttpWebhookServer = class {
  server = null;
  async listen(port2, path2, handler) {
    return new Promise((resolve, reject) => {
      const server = http.createServer(async (req, res) => {
        if (req.method !== "POST" || req.url !== path2) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not Found");
          return;
        }
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", async () => {
          try {
            const body = Buffer.concat(chunks);
            const headers = {};
            for (const [key, value] of Object.entries(req.headers)) {
              headers[key.toLowerCase()] = value;
            }
            const response = await handler({ body, headers });
            res.writeHead(response.status, {
              "Content-Type": "application/json",
              ...response.headers ?? {}
            });
            res.end(response.body);
          } catch (_err) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Internal Server Error");
          }
        });
      });
      server.on("error", reject);
      server.listen(port2, () => {
        this.server = server;
        resolve();
      });
    });
  }
  close() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
};

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/transport/webhook.js
var OP_DISPATCH = 0;
var OP_HTTP_CALLBACK_ACK = 12;
var OP_VALIDATION = 13;
var WebhookTransport = class {
  opts;
  callbacks;
  log;
  server;
  accountId;
  stopped = false;
  stopResolve = null;
  constructor(opts, callbacks) {
    this.opts = opts;
    this.callbacks = callbacks;
    this.log = opts.log;
    this.server = opts.server ?? new NodeHttpWebhookServer();
    this.accountId = opts.accountId ?? opts.appId;
  }
  async start() {
    const port2 = this.opts.port ?? 8080;
    const path2 = this.opts.path ?? "/";
    this.log?.info?.(`[webhook] starting on port ${port2}, path ${path2}`);
    await this.server.listen(port2, path2, (req) => this.handleRequest(req));
    this.log?.info?.(`[webhook] listening on :${port2}${path2}`);
    this.callbacks.onReady?.({ transport: "webhook", port: port2, path: path2 });
    if (this.opts.abortSignal) {
      await new Promise((resolve) => {
        if (this.opts.abortSignal.aborted) {
          resolve();
          return;
        }
        this.stopResolve = resolve;
        this.opts.abortSignal.addEventListener("abort", () => this.stop(), { once: true });
      });
    } else {
      await new Promise((resolve) => {
        this.stopResolve = resolve;
      });
    }
  }
  stop() {
    if (this.stopped)
      return;
    this.stopped = true;
    this.server.close();
    this.log?.info?.(`[webhook] stopped`);
    this.stopResolve?.();
  }
  // ============ Request handler ============
  async handleRequest(req) {
    let payload;
    try {
      payload = JSON.parse(req.body.toString("utf-8"));
    } catch {
      this.log?.warn?.(`[webhook] invalid JSON body`);
      return { status: 400, body: JSON.stringify({ error: "invalid json" }) };
    }
    if (payload.op === OP_VALIDATION) {
      return this.handleValidation(payload);
    }
    const timestamp = getHeader(req.headers, "x-signature-timestamp") ?? "";
    const signature = getHeader(req.headers, "x-signature-ed25519") ?? "";
    if (!timestamp || !signature) {
      this.log?.warn?.(`[webhook] missing signature headers`);
      return { status: 401, body: JSON.stringify({ error: "missing signature" }) };
    }
    const valid = verifyWebhookSignature({
      body: req.body,
      timestamp,
      signature,
      botSecret: this.opts.appSecret
    });
    if (!valid) {
      this.log?.warn?.(`[webhook] signature verification failed`);
      return { status: 401, body: JSON.stringify({ error: "invalid signature" }) };
    }
    if (payload.op === OP_DISPATCH) {
      this.handleDispatch(payload).catch((err) => {
        this.log?.error?.(`[webhook] dispatch error: ${err instanceof Error ? err.message : String(err)}`);
      });
    }
    return {
      status: 200,
      body: JSON.stringify({ op: OP_HTTP_CALLBACK_ACK, d: 0 })
    };
  }
  // ============ Validation handler (op:13) ============
  handleValidation(payload) {
    const d = payload.d;
    if (!d?.plain_token || !d?.event_ts) {
      this.log?.warn?.(`[webhook] validation missing plain_token or event_ts`);
      return { status: 400, body: JSON.stringify({ error: "invalid validation" }) };
    }
    this.log?.info?.(`[webhook] handling callback URL validation`);
    const response = signValidationResponse({
      plainToken: d.plain_token,
      eventTs: d.event_ts,
      botSecret: this.opts.appSecret
    });
    return {
      status: 200,
      body: JSON.stringify(response)
    };
  }
  // ============ Dispatch handler (op:0) ============
  async handleDispatch(payload) {
    const eventType = payload.t ?? "";
    const data = payload.d;
    this.log?.debug?.(`[webhook] dispatch event: t=${eventType} payload=${JSON.stringify(data)}`);
    const result = dispatchEvent(eventType, data, this.accountId, this.log);
    switch (result.action) {
      case "ready":
        this.callbacks.onReady?.(result.data);
        break;
      case "resumed":
        this.callbacks.onResumed?.(result.data);
        break;
      case "message":
        try {
          await this.callbacks.onMessage(result.msg);
        } catch (err) {
          this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
        }
        break;
      case "interaction":
        try {
          await this.callbacks.onInteraction?.(result.event);
        } catch (err) {
          this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
        }
        break;
      case "ignore":
        break;
    }
  }
};
function getHeader(headers, key) {
  const val = headers[key];
  if (Array.isArray(val))
    return val[0];
  return val;
}

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/protocol/utils/upload-cache.js
init_define_MACRO();
import * as crypto3 from "node:crypto";
var MAX_CACHE_SIZE = 500;
function computeFileHash(data) {
  return crypto3.createHash("md5").update(data).digest("hex");
}
function buildCacheKey(contentHash, scope, targetId, fileType) {
  return `${contentHash}:${scope}:${targetId}:${fileType}`;
}
var UploadCache = class {
  cache = /* @__PURE__ */ new Map();
  logger;
  constructor(options) {
    this.logger = options?.logger;
  }
  computeHash(data) {
    return computeFileHash(data);
  }
  get(contentHash, scope, targetId, fileType) {
    const key = buildCacheKey(contentHash, scope, targetId, fileType);
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    this.logger?.debug?.(`[upload-cache] HIT key=${key.slice(0, 40)}... uuid=${entry.fileUuid}`);
    return entry.fileInfo;
  }
  set(contentHash, scope, targetId, fileType, fileInfo, fileUuid, ttl) {
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const now = Date.now();
      for (const [k, v] of this.cache) {
        if (now >= v.expiresAt) {
          this.cache.delete(k);
        }
      }
      if (this.cache.size >= MAX_CACHE_SIZE) {
        const keys = Array.from(this.cache.keys());
        for (let i = 0; i < keys.length / 2; i++) {
          this.cache.delete(keys[i]);
        }
      }
    }
    const key = buildCacheKey(contentHash, scope, targetId, fileType);
    const safetyMargin = 60;
    const effectiveTtl = Math.max(ttl - safetyMargin, 10);
    this.cache.set(key, {
      fileInfo,
      fileUuid,
      expiresAt: Date.now() + effectiveTtl * 1e3
    });
    this.logger?.debug?.(`[upload-cache] SET key=${key.slice(0, 40)}... ttl=${effectiveTtl}s uuid=${fileUuid}`);
  }
  stats() {
    return { size: this.cache.size, maxSize: MAX_CACHE_SIZE };
  }
  clear() {
    this.cache.clear();
    this.logger?.debug?.(`[upload-cache] cleared`);
  }
};

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/streaming.js
init_define_MACRO();
var DEFAULT_THROTTLE_MS = 500;
var MIN_THROTTLE_MS = 300;
var MAX_FLUSH_RETRIES = 3;
var RATE_LIMIT_BASE_DELAY_MS = 1e3;
var StreamSession = class {
  api;
  opts;
  throttleMs;
  eventId;
  streamMsgId;
  index = 0;
  /**
   * `msg_seq` for the current stream session. QQ open platform expects all
   * frames in one stream to share the same `msg_seq` (only `index` advances).
   */
  msgSeq = null;
  lastFlushAt = 0;
  lastSentText = "";
  pendingText = "";
  pendingTimer = null;
  flushInProgress = false;
  flushPromise = null;
  isCompleted = false;
  constructor(api, opts) {
    this.api = api;
    this.opts = opts;
    this.throttleMs = Math.max(opts.throttleMs ?? DEFAULT_THROTTLE_MS, MIN_THROTTLE_MS);
    this.eventId = opts.eventId ?? opts.msgId;
  }
  /**
   * Update the current full message text. Will be sent at most once per
   * throttle window.
   */
  async update(fullText) {
    if (this.isCompleted) {
      return;
    }
    this.pendingText = fullText;
    const now = Date.now();
    const elapsed = now - this.lastFlushAt;
    if (this.flushInProgress) {
      return;
    }
    if (elapsed >= this.throttleMs) {
      await this.flush(StreamInputState.GENERATING);
      return;
    }
    if (!this.pendingTimer) {
      const wait = this.throttleMs - elapsed;
      this.pendingTimer = setTimeout(() => {
        this.pendingTimer = null;
        if (!this.isCompleted) {
          this.flush(StreamInputState.GENERATING).catch((err) => {
            this.opts.logger?.error?.(`[qqbot:stream] throttle flush error: ${formatErrorMessage(err)}`);
          });
        }
      }, wait);
    }
  }
  /** Mark the stream as DONE. Sends a final frame with the latest text. */
  async complete() {
    if (this.isCompleted) {
      return void 0;
    }
    this.isCompleted = true;
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
    if (this.flushPromise) {
      await this.flushPromise.catch(() => {
      });
    }
    return this.flush(StreamInputState.DONE);
  }
  /** Force-cancel without sending a DONE frame (caller must clean up). */
  cancel() {
    this.isCompleted = true;
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
  }
  // ============ Internal ============
  async flush(state) {
    if (this.flushInProgress) {
      return void 0;
    }
    if (this.pendingText === this.lastSentText && state !== StreamInputState.DONE) {
      return void 0;
    }
    this.flushInProgress = true;
    const promise = this.doFlush(state);
    this.flushPromise = promise;
    return promise;
  }
  async doFlush(state) {
    let flushFailed = false;
    try {
      const text = this.pendingText;
      if (this.msgSeq === null) {
        this.msgSeq = getNextMsgSeq(this.opts.msgId);
      }
      const currentIndex = this.index++;
      const req = {
        input_mode: StreamInputMode.REPLACE,
        input_state: state,
        content_type: StreamContentType.MARKDOWN,
        content_raw: text,
        event_id: this.eventId,
        msg_id: this.opts.msgId,
        msg_seq: this.msgSeq,
        index: currentIndex
      };
      if (this.streamMsgId) {
        req.stream_msg_id = this.streamMsgId;
      }
      const resp = await this.sendWithRetry(req);
      if (resp?.id && !this.streamMsgId) {
        this.streamMsgId = resp.id;
      }
      this.lastSentText = text;
      this.lastFlushAt = Date.now();
      return resp;
    } catch (err) {
      flushFailed = true;
      this.opts.logger?.error?.(`[qqbot:stream] flush failed (state=${state}): ${formatErrorMessage(err)}`);
      throw err;
    } finally {
      this.flushInProgress = false;
      if (!flushFailed && !this.isCompleted && this.pendingText !== this.lastSentText && !this.pendingTimer && state !== StreamInputState.DONE) {
        await this.flush(StreamInputState.GENERATING);
      }
    }
  }
  /**
   * Send a stream message with exponential backoff on rate-limit errors.
   * QQ returns err_code 50002 or HTTP 429 when rate-limited.
   */
  async sendWithRetry(req) {
    for (let attempt = 0; attempt <= MAX_FLUSH_RETRIES; attempt++) {
      try {
        return await this.api.sendC2CStreamMessage(this.opts.creds, this.opts.openid, req);
      } catch (err) {
        if (!this.isRateLimitError(err) || attempt >= MAX_FLUSH_RETRIES) {
          throw err;
        }
        const delay = RATE_LIMIT_BASE_DELAY_MS * Math.pow(2, attempt);
        this.opts.logger?.debug?.(`[qqbot:stream] rate limited, retry ${attempt + 1}/${MAX_FLUSH_RETRIES} after ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        req.index = this.index++;
      }
    }
    return void 0;
  }
  /** Check if an error is a rate-limit error (QQ err_code 50002 or HTTP 429). */
  isRateLimitError(err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("rate limit"))
      return true;
    const code = err?.code ?? err?.err_code;
    if (code === 50002 || code === 429)
      return true;
    return false;
  }
};

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/QQBot.js
var MsgType = {
  /** Plain text. */
  TEXT: 0,
  /** Markdown. */
  MARKDOWN: 2,
  /** Ark template message. */
  ARK: 3,
  /** Embed message. */
  EMBED: 4,
  /** Rich media (image/video/voice/file). */
  MEDIA: 7
};
var noopLogger = {
  info: () => {
  },
  error: () => {
  },
  warn: () => {
  },
  debug: () => {
  }
};
var QQBot = class {
  // Public protocol primitives — exposed for advanced users.
  tokenManager;
  apiClient;
  messageApi;
  mediaApi;
  chunkedMediaApi;
  opts;
  logger;
  creds;
  account;
  userAgent;
  uploadCache;
  middlewares = [];
  handlers = {
    ready: /* @__PURE__ */ new Set(),
    resumed: /* @__PURE__ */ new Set(),
    error: /* @__PURE__ */ new Set(),
    message: /* @__PURE__ */ new Set(),
    interaction: /* @__PURE__ */ new Set(),
    rawEvent: /* @__PURE__ */ new Set()
  };
  gateway = null;
  abortController = null;
  _apiGateway = null;
  constructor(options) {
    if (!options.appId) {
      throw new Error("QQBot: appId is required");
    }
    if (!options.appSecret) {
      throw new Error("QQBot: appSecret is required");
    }
    this.opts = options;
    this.logger = options.logger ?? noopLogger;
    this.userAgent = options.userAgent ?? `qqbot-nodejs/0.1.0 (Node/${process.versions.node})`;
    this.creds = {
      appId: options.appId,
      clientSecret: options.appSecret
    };
    this.account = {
      accountId: options.accountId ?? options.appId,
      appId: options.appId,
      clientSecret: options.appSecret,
      markdownSupport: options.markdownSupport === true
    };
    this.uploadCache = options.uploadCache ?? new UploadCache({ logger: this.logger });
    this.apiClient = new ApiClient({
      logger: this.logger,
      userAgent: this.userAgent,
      baseUrl: options.baseUrl
    });
    this.tokenManager = new TokenManager({
      logger: this.logger,
      userAgent: this.userAgent,
      baseUrl: options.tokenBaseUrl
    });
    this.messageApi = new MessageApi(this.apiClient, this.tokenManager, {
      markdownSupport: options.markdownSupport === true,
      logger: this.logger
    });
    const cacheAdapter = {
      computeHash: (data) => this.uploadCache.computeHash(data),
      get: (hash, scope, targetId, fileType) => this.uploadCache.get(hash, scope, targetId, fileType),
      set: (hash, scope, targetId, fileType, fileInfo, fileUuid, ttl) => this.uploadCache.set(hash, scope, targetId, fileType, fileInfo, fileUuid, ttl)
    };
    this.mediaApi = new MediaApi(this.apiClient, this.tokenManager, {
      logger: this.logger,
      uploadCache: cacheAdapter,
      sanitizeFileName
    });
    this.chunkedMediaApi = new ChunkedMediaApi(this.apiClient, this.tokenManager, {
      logger: this.logger,
      uploadCache: cacheAdapter,
      sanitizeFileName
    });
  }
  // ============ Public getters ============
  /** The QQ Open Platform AppID this bot is bound to. */
  get appId() {
    return this.creds.appId;
  }
  /** The stable account id (defaults to appId). */
  get accountId() {
    return this.account.accountId;
  }
  // ============ Event listeners ============
  on(event, handler) {
    this.handlers[event].add(handler);
    return this;
  }
  off(event, handler) {
    this.handlers[event].delete(handler);
    return this;
  }
  // ============ Middleware ============
  /**
   * Register an inbound middleware. Middlewares run in registration order
   * before the `message` event listeners; calling `ctx.stop()` (or simply
   * not calling `next()`) short-circuits the chain — including the final
   * `message` listener.
   *
   * @example
   * ```ts
   * import { accessPolicy, mentionGate } from "@tencent-connect/qqbot-nodejs";
   * bot.use(accessPolicy({ group: { mode: "allowlist", allow: [...] } }));
   * bot.use(mentionGate());
   * bot.on("message", async (ctx, msg) => {  ... });
   * ```
   */
  use(...middleware) {
    for (const mw of middleware) {
      if (typeof mw !== "function") {
        throw new Error("QQBot.use: middleware must be a function");
      }
      this.middlewares.push(mw);
    }
    return this;
  }
  /** Read the registered middleware chain (for diagnostics). */
  getMiddlewares() {
    return this.middlewares;
  }
  async emit(event, ...args) {
    for (const handler of this.handlers[event]) {
      try {
        await Promise.resolve(handler(...args));
      } catch (err) {
        this.logger.error?.(`[qqbot] handler for "${String(event)}" threw: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
  // ============ Lifecycle ============
  /**
   * Start receiving events from QQ Open Platform.
   *
   * - **WebSocket mode** (default): connects to the WS gateway with heartbeat/RESUME.
   * - **Webhook mode**: starts an HTTP server to receive POST callbacks.
   *
   * Resolves when {@link stop} or the abort signal terminates the connection.
   */
  async start(externalSignal) {
    if (this.gateway) {
      throw new Error("QQBot: already started");
    }
    this.abortController = new AbortController();
    if (externalSignal) {
      if (externalSignal.aborted) {
        this.abortController.abort();
      } else {
        externalSignal.addEventListener("abort", () => this.abortController?.abort(), {
          once: true
        });
      }
    }
    const transportMode = this.opts.transport ?? "websocket";
    if (transportMode === "webhook") {
      await this.startWebhook();
    } else if (transportMode === "websocket") {
      await this.startWebSocket();
    } else {
      const custom = transportMode;
      await custom.start();
    }
    this.tokenManager.stopBackgroundRefresh(this.creds.appId);
    this.gateway = null;
    this.abortController = null;
  }
  /** Stop the transport and background refreshers. */
  stop() {
    this.abortController?.abort();
    this.tokenManager.stopBackgroundRefresh(this.creds.appId);
    this.gateway = null;
    this.abortController = null;
  }
  // ============ Token initialization ============
  /**
   * Initialize token based on the configured prefetch strategy.
   *
   * - `"sync"` (default): awaits the first token fetch, providing fail-fast
   *   semantics so credential errors surface at startup.
   * - `"async"`: fires the token fetch in the background and starts the
   *   background refresher immediately — trades fail-fast for faster startup.
   */
  async initToken() {
    const mode = this.opts.tokenPrefetch ?? "sync";
    if (mode === "sync") {
      await this.tokenManager.getAccessToken(this.creds.appId, this.creds.clientSecret);
    } else {
      this.tokenManager.getAccessToken(this.creds.appId, this.creds.clientSecret).catch((err) => {
        this.logger.error?.(`[qqbot] async token prefetch failed: ${err}`);
        void this.emit("error", err instanceof Error ? err : new Error(String(err)));
      });
    }
    this.tokenManager.startBackgroundRefresh(this.creds.appId, this.creds.clientSecret);
  }
  // ============ Transport: WebSocket ============
  async startWebSocket() {
    await this.initToken();
    this.gateway = new GatewayConnection({
      account: this.account,
      abortSignal: this.abortController.signal,
      log: this.logger,
      userAgent: this.userAgent,
      intents: this.opts.intents,
      session: this.opts.sessionPersistence,
      getAccessToken: () => this.tokenManager.getAccessToken(this.creds.appId, this.creds.clientSecret),
      clearTokenCache: () => this.tokenManager.clearCache(this.creds.appId),
      getGatewayUrl: () => this.messageApi.getGatewayUrl(this.creds),
      onReady: (data) => {
        this.logger.info?.(`[qqbot] gateway READY`);
        void this.emit("ready", data);
      },
      onResumed: (data) => {
        this.logger.info?.(`[qqbot] gateway RESUMED`);
        void this.emit("resumed", data);
      },
      onError: (err) => {
        void this.emit("error", err);
      },
      onMessage: (raw) => this.handleInboundMessage(raw),
      onInteraction: (event) => {
        const ctx = { bot: this, event, state: {}, receivedAt: Date.now() };
        void this.emit("interaction", ctx, event);
      },
      onRawEvent: (type, data) => {
        const ctx = { bot: this, eventType: type, data, state: {}, receivedAt: Date.now() };
        void this.emit("rawEvent", ctx);
      }
    });
    await this.gateway.start();
  }
  // ============ Transport: Webhook ============
  async startWebhook() {
    await this.initToken();
    const webhook = new WebhookTransport({
      appId: this.creds.appId,
      appSecret: this.creds.clientSecret,
      port: this.opts.webhook?.port,
      path: this.opts.webhook?.path,
      server: this.opts.webhook?.server,
      accountId: this.account.accountId,
      log: this.logger,
      abortSignal: this.abortController.signal
    }, {
      onReady: (data) => {
        this.logger.info?.(`[qqbot] webhook READY`);
        void this.emit("ready", data);
      },
      onResumed: (data) => {
        void this.emit("resumed", data);
      },
      onError: (err) => {
        void this.emit("error", err);
      },
      onMessage: (raw) => this.handleInboundMessage(raw),
      onInteraction: (event) => {
        const ctx = { bot: this, event, state: {}, receivedAt: Date.now() };
        void this.emit("interaction", ctx, event);
      }
    });
    await webhook.start();
  }
  // ============ Shared inbound message handler ============
  async handleInboundMessage(raw) {
    const replyTarget = this.deriveReplyTarget(raw);
    if (!replyTarget) {
      this.logger.debug?.(`[qqbot] inbound message has no reply target \u2014 skipping`);
      return;
    }
    const augmented = { ...raw, replyTarget };
    const ctx = createMiddlewareContext({
      bot: this,
      message: augmented,
      log: this.logger
    });
    const downstream = async () => {
      await this.emit("message", ctx, ctx.message);
    };
    const chain = [...this.middlewares, downstream];
    try {
      await runMiddlewareChain(chain, ctx);
    } catch (err) {
      this.logger.error?.(`[qqbot] middleware chain threw: ${err instanceof Error ? err.message : String(err)}`);
      void this.emit("error", err instanceof Error ? err : new Error(String(err)));
    }
  }
  // ============ Message sending ============
  /**
   * Universal message send — supports all QQ Open Platform message types.
   *
   * This is the most flexible sending method. It accepts the full parameter
   * set of POST `/v2/users/{openid}/messages` or `/v2/groups/{group_openid}/messages`.
   * Use it when the convenience helpers (sendText, sendMarkdown, etc.) don't
   * cover your use case.
   *
   * `msg_type` is auto-detected if not specified:
   * - markdown field present → 2 (Markdown)
   * - ark field present → 3 (Ark)
   * - embed field present → 4 (Embed)
   * - media field present → 7 (Rich media)
   * - otherwise → 0 (Text)
   *
   * @example Send a keyboard message
   * ```ts
   * await bot.send({
   *   target: msg.replyTarget,
   *   msgType: MsgType.MARKDOWN,
   *   markdown: { content: '# Hello' },
   *   keyboard: { content: { rows: [...] } },
   * });
   * ```
   *
   * @example Send a proactive message (no msgId)
   * ```ts
   * await bot.send({
   *   target: { scope: 'c2c', targetId: openid },
   *   content: 'Hello from bot!',
   * });
   * ```
   */
  async send(opts) {
    const body = {};
    if (opts.target.msgId)
      body.msg_id = opts.target.msgId;
    if (opts.msgType !== void 0)
      body.msg_type = opts.msgType;
    if (opts.content !== void 0)
      body.content = opts.content;
    if (opts.markdown)
      body.markdown = opts.markdown;
    if (opts.ark)
      body.ark = opts.ark;
    if (opts.embed)
      body.embed = opts.embed;
    if (opts.media)
      body.media = opts.media;
    if (opts.keyboard)
      body.keyboard = opts.keyboard;
    if (opts.messageReference)
      body.message_reference = opts.messageReference;
    if (opts.extra)
      Object.assign(body, opts.extra);
    return this.messageApi.sendRaw(opts.target.scope, opts.target.targetId, this.creds, body);
  }
  /**
   * Send a text message to a C2C user or group (smart mode).
   *
   * **Difference from `send()`**:
   * - `sendText` auto-selects msg_type based on `markdownSupport` config
   *   (markdown bots automatically send as msg_type=2).
   * - `send()` is explicit mode — you control msg_type directly.
   *
   * When `target.msgId` is present the message is treated as a reply
   * (tied to the inbound message lifecycle); otherwise it is treated as
   * a proactive push.
   */
  async sendText(target, content) {
    if (target.msgId) {
      return this.messageApi.sendMessage(target.scope, target.targetId, content, this.creds, {
        msgId: target.msgId
      });
    }
    return this.messageApi.sendProactiveMessage(target.scope, target.targetId, content, this.creds);
  }
  /** Send a text message with an inline keyboard. */
  async sendTextWithKeyboard(target, content, inlineKeyboard) {
    return this.messageApi.sendMessage(target.scope, target.targetId, content, this.creds, {
      msgId: target.msgId,
      inlineKeyboard
    });
  }
  /**
   * Send a Markdown message (msg_type=2).
   *
   * @example
   * ```ts
   * await bot.sendMarkdown(msg.replyTarget, '# Hello **world**');
   * await bot.sendMarkdown(msg.replyTarget, '# Click below', {
   *   keyboard: { content: { rows: [...] } },
   * });
   * ```
   */
  async sendMarkdown(target, content, opts) {
    return this.send({
      target,
      msgType: MsgType.MARKDOWN,
      markdown: { content },
      keyboard: opts?.keyboard
    });
  }
  /**
   * Recall (delete) a previously sent message.
   *
   * @example
   * ```ts
   * const sent = await bot.sendText(target, 'oops');
   * await bot.recallMessage(target, sent.id);
   * ```
   */
  async recallMessage(target, messageId) {
    return this.messageApi.recallMessage(target.scope, target.targetId, messageId, this.creds);
  }
  async sendWakeup(target, content) {
    if (target.scope !== "c2c") {
      throw new Error("sendWakeup is only supported for C2C targets");
    }
    return this.send({ target, content, extra: { is_wakeup: true } });
  }
  async sendChannelMessage(channelId, content, opts) {
    const body = { content };
    if (opts?.msgId)
      body.msg_id = opts.msgId;
    if (opts?.keyboard)
      body.keyboard = opts.keyboard;
    if (opts?.messageReference)
      body.message_reference = { message_id: opts.messageReference };
    return this.messageApi.sendChannelMessageRaw(channelId, this.creds, body);
  }
  async sendDmMessage(guildId, content, opts) {
    const body = { content };
    if (opts?.msgId)
      body.msg_id = opts.msgId;
    return this.messageApi.sendDmMessageRaw(guildId, this.creds, body);
  }
  /** Send a typing indicator (C2C only). */
  async sendTyping(target, durationSec = 30) {
    if (target.scope !== "c2c") {
      throw new Error("sendTyping is only supported for C2C targets");
    }
    return this.messageApi.sendInputNotify({
      openid: target.targetId,
      creds: this.creds,
      msgId: target.msgId,
      inputSecond: durationSec
    });
  }
  /** Acknowledge an INTERACTION_CREATE event. */
  async acknowledgeInteraction(interactionId, code = 0, data) {
    return this.messageApi.acknowledgeInteraction(interactionId, this.creds, code, data);
  }
  // ============ API Gateway ============
  /**
   * Open Platform API Gateway — call any QQ Open Platform REST API with
   * automatic token injection and refresh.
   *
   * This is the "escape hatch" for any API not wrapped by a dedicated method.
   * All requests are authenticated, rate-limit aware, and return structured errors.
   *
   * @example List guilds
   * ```ts
   * const guilds = await bot.api.get('/users/@me/guilds');
   * ```
   *
   * @example Create an announcement
   * ```ts
   * await bot.api.post(`/guilds/${guildId}/announces`, {
   *   message_id: msgId, channel_id: channelId,
   * });
   * ```
   *
   * @example Get a raw access token
   * ```ts
   * const token = await bot.api.getToken();
   * ```
   */
  get api() {
    if (this._apiGateway)
      return this._apiGateway;
    this._apiGateway = {
      get: (path2, query) => this.apiRequest("GET", path2, void 0, query),
      post: (path2, body) => this.apiRequest("POST", path2, body),
      put: (path2, body) => this.apiRequest("PUT", path2, body),
      patch: (path2, body) => this.apiRequest("PATCH", path2, body),
      delete: (path2) => this.apiRequest("DELETE", path2),
      getToken: () => this.tokenManager.getAccessToken(this.creds.appId, this.creds.clientSecret)
    };
    return this._apiGateway;
  }
  async apiRequest(method, path2, body, query) {
    const token = await this.tokenManager.getAccessToken(this.creds.appId, this.creds.clientSecret);
    let fullPath = path2;
    if (query && Object.keys(query).length > 0) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== void 0 && v !== null)
          params.set(k, String(v));
      }
      fullPath = `${path2}?${params.toString()}`;
    }
    return this.apiClient.request(token, method, fullPath, body ?? void 0);
  }
  // ============ Streaming ============
  /**
   * Open a C2C stream session for incremental output.
   *
   * @returns A {@link StreamSession} — call `update(fullText)` repeatedly,
   * then `complete()` when finished.
   */
  openStream(opts) {
    if (opts.target.scope !== "c2c") {
      throw new Error("Streaming is only supported for C2C targets");
    }
    if (!opts.target.msgId) {
      throw new Error("Streaming requires target.msgId from the inbound message");
    }
    const sessionOptions = {
      openid: opts.target.targetId,
      msgId: opts.target.msgId,
      creds: this.creds,
      eventId: opts.eventId,
      throttleMs: opts.throttleMs,
      logger: this.logger
    };
    return new StreamSession(this.messageApi, sessionOptions);
  }
  // ============ Media ============
  /**
   * Upload media (image / voice / video / file) to a target. Automatically
   * dispatches to the chunked-upload path when the source exceeds
   * {@link LARGE_FILE_THRESHOLD} bytes.
   */
  async uploadMedia(opts) {
    const sources = [opts.url, opts.fileData, opts.buffer, opts.localPath].filter((v) => v !== void 0);
    if (sources.length === 0) {
      throw new Error("uploadMedia: one of url/fileData/buffer/localPath is required");
    }
    if (sources.length > 1) {
      throw new Error("uploadMedia: provide exactly one source");
    }
    const size = await this.computeSourceSize(opts);
    const useChunked = size !== null && size >= LARGE_FILE_THRESHOLD;
    const fileName = opts.fileName ?? (opts.localPath ? path.basename(opts.localPath) : void 0) ?? (opts.url ? decodeURIComponent(path.basename(new URL(opts.url).pathname)) || void 0 : void 0);
    if (useChunked && (opts.localPath || opts.buffer)) {
      const source = opts.localPath ? { kind: "localPath", path: opts.localPath, size } : {
        kind: "buffer",
        buffer: opts.buffer,
        fileName
      };
      return this.chunkedMediaApi.uploadChunked({
        scope: opts.target.scope,
        targetId: opts.target.targetId,
        fileType: opts.fileType,
        source,
        creds: this.creds,
        fileName,
        onProgress: opts.onProgress ? (p) => opts.onProgress(p.uploadedBytes, p.totalBytes) : void 0
      });
    }
    return this.mediaApi.uploadMedia(opts.target.scope, opts.target.targetId, opts.fileType, this.creds, {
      url: opts.url,
      fileData: opts.fileData,
      buffer: opts.buffer,
      localPath: opts.localPath,
      srvSendMsg: opts.srvSendMsg,
      fileName
    });
  }
  /**
   * Upload + send a media message to a C2C user or group.
   */
  async sendMedia(opts) {
    const upload = await this.uploadMedia({ ...opts, srvSendMsg: false });
    const message = await this.mediaApi.sendMediaMessage(opts.target.scope, opts.target.targetId, upload.file_info, this.creds, {
      msgId: opts.target.msgId,
      content: opts.content
    });
    return { upload, message };
  }
  /** Convenience: upload + send an image. */
  async sendImage(target, source, opts) {
    return this.sendMedia({
      target,
      fileType: MediaFileType.IMAGE,
      ...source,
      content: opts?.content,
      onProgress: opts?.onProgress
    });
  }
  /** Convenience: upload + send a video. */
  async sendVideo(target, source, opts) {
    return this.sendMedia({
      target,
      fileType: MediaFileType.VIDEO,
      ...source,
      content: opts?.content,
      onProgress: opts?.onProgress
    });
  }
  /** Convenience: upload + send a voice message. */
  async sendVoice(target, source, opts) {
    return this.sendMedia({
      target,
      fileType: MediaFileType.VOICE,
      ...source,
      onProgress: opts?.onProgress
    });
  }
  /** Convenience: upload + send a generic file (for users with file-message permission). */
  async sendFile(target, source, opts) {
    return this.sendMedia({
      target,
      fileType: MediaFileType.FILE,
      ...source,
      fileName: opts?.fileName,
      content: opts?.content,
      onProgress: opts?.onProgress
    });
  }
  // ============ Internal ============
  deriveReplyTarget(raw) {
    if (raw.kind === "c2c") {
      return { scope: "c2c", targetId: raw.senderId, msgId: raw.messageId };
    }
    if (raw.kind === "group" && raw.groupOpenid) {
      return { scope: "group", targetId: raw.groupOpenid, msgId: raw.messageId };
    }
    return null;
  }
  async computeSourceSize(opts) {
    if (opts.buffer) {
      return opts.buffer.length;
    }
    if (opts.localPath) {
      try {
        const stat = await fs3.promises.stat(opts.localPath);
        return stat.size;
      } catch {
        return null;
      }
    }
    if (opts.fileData) {
      return Math.floor(opts.fileData.length * 3 / 4);
    }
    return null;
  }
};

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/middleware/index.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/middleware/message-filter.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/middleware/content-sanitizer.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/middleware/rate-limiter.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/middleware/concurrency-guard.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/middleware/access-policy.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/middleware/mention-gate.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/middleware/quote-ref.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/middleware/envelope-formatter.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/middleware/slash-command.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/middleware/history-buffer.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/middleware/typing-indicator.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/middleware/error-handler.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/storage/index.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/storage/kv-store.js
init_define_MACRO();

// adapters/node_modules/@tencent-connect/qqbot-nodejs/dist/storage/session-adapter.js
init_define_MACRO();

// adapters/qq/extract-payload.ts
init_define_MACRO();
function extractQqPayload(message) {
  if (!message) return null;
  if (message.kind !== "c2c") return null;
  if (message.senderIsBot) return null;
  const userId = message.senderId?.trim();
  if (!userId) return null;
  const attachments = (message.attachments ?? []).filter((item) => Boolean(item?.url));
  const transcripts = attachments.map((item) => item.asr_refer_text?.trim()).filter((value) => Boolean(value));
  const text = [message.content?.trim(), ...transcripts].filter(Boolean).join("\n").trim();
  const messageId = message.messageId?.trim();
  return {
    chatId: userId,
    userId,
    displayName: message.senderName?.trim() || "QQ User",
    text,
    dedupKey: messageId || `${userId}:${message.timestamp ?? ""}:${text.slice(0, 32)}`,
    // A voice note is fully represented by its transcript; downloading the
    // audio would add an attachment the Agent cannot read.
    attachments: attachments.filter((item) => !item.asr_refer_text)
  };
}

// adapters/qq/media.ts
init_define_MACRO();
var DOWNLOAD_TIMEOUT_MS = 3e4;
function normalizeQqAttachmentUrl(raw) {
  const value = raw?.trim();
  if (!value) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  let url;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  url.protocol = "https:";
  return url;
}
function fileNameFor(attachment, mime, seed) {
  const provided = attachment.filename?.trim();
  if (provided) return provided;
  if (mime?.startsWith("image/")) return `qq-image-${seed}.${imageExtensionForMime(mime)}`;
  return `qq-file-${seed}`;
}
var QqMediaService = class {
  constructor(store, fetchImpl = fetch) {
    this.store = store;
    this.fetchImpl = fetchImpl;
  }
  store;
  fetchImpl;
  async downloadAttachment(attachment, sessionId, seed) {
    const url = normalizeQqAttachmentUrl(attachment.url);
    if (!url) throw new Error("QQ attachment has no usable download URL");
    const response = await this.fetchImpl(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS)
    });
    if (!response.ok) {
      throw new Error(`QQ attachment download failed: ${response.status} ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const headerMime = response.headers.get("content-type")?.split(";")[0]?.trim();
    const mimeType = attachment.content_type?.split(";")[0]?.trim() || headerMime || inferMimeFromFileName(attachment.filename) || "application/octet-stream";
    const name = fileNameFor(attachment, mimeType, seed);
    const target = this.store.resolvePath("qq", sessionId, name);
    const path2 = await this.store.write(target, buffer);
    return {
      kind: attachmentKindForMime(mimeType),
      name,
      path: path2,
      buffer,
      size: buffer.length,
      mimeType
    };
  }
};

// adapters/qq/index.ts
var QQ_TEXT_LIMIT = 1500;
var QQ_STREAM_THROTTLE_MS = 600;
var TYPING_SECONDS = 30;
var config = loadConfig();
if (!config.qq.appId || !config.qq.appSecret) {
  console.error("[QQ] Missing QQ_APP_ID / QQ_APP_SECRET. Bind QQ in Desktop Settings > IM.");
  process.exit(1);
}
var bot = new QQBot({
  appId: config.qq.appId,
  appSecret: config.qq.appSecret,
  accountId: config.qq.appId,
  transport: "websocket",
  tokenPrefetch: "sync",
  logger: {
    debug: () => {
    },
    info: () => {
    },
    warn: (...args) => console.warn("[QQ][sdk]", ...args),
    error: (...args) => console.error("[QQ][sdk]", ...args)
  }
});
var bridge = new WsBridge(config.serverUrl, "qq");
var dedup = new MessageDedup();
var sessionStore = new SessionStore();
var { httpClient, defaultWorkDir } = createAdapterClient(config, config.qq);
var attachmentStore = new AttachmentStore();
var media = new QqMediaService(attachmentStore);
attachmentStore.gc().catch((err) => {
  console.warn("[QQ] AttachmentStore.gc failed:", err instanceof Error ? err.message : err);
});
var replyTargets = /* @__PURE__ */ new Map();
function targetFor(chatId) {
  return replyTargets.get(chatId) ?? { scope: "c2c", targetId: chatId };
}
async function sendPlainText(chatId, text) {
  const target = targetFor(chatId);
  for (const chunk of splitMessage(text, QQ_TEXT_LIMIT)) {
    await bot.sendText(target, chunk);
  }
}
var QqResponse = class {
  constructor(chatId) {
    this.chatId = chatId;
    const target = targetFor(chatId);
    if (target.scope !== "c2c" || !target.msgId) return;
    try {
      this.session = bot.openStream({ target, throttleMs: QQ_STREAM_THROTTLE_MS });
    } catch (err) {
      console.warn("[QQ] openStream failed:", err instanceof Error ? err.message : err);
    }
  }
  chatId;
  session = null;
  accumulated = "";
  /** How much of `accumulated` the stream bubble already shows. */
  streamed = 0;
  failed = false;
  async append(delta) {
    if (!delta) return;
    this.accumulated += delta;
    if (!this.session || this.failed) return;
    try {
      await this.session.update(this.accumulated);
      this.streamed = this.accumulated.length;
    } catch (err) {
      this.failed = true;
      console.warn("[QQ] stream update failed:", err instanceof Error ? err.message : err);
    }
  }
  async finish() {
    const session = this.session;
    this.session = null;
    if (session && !this.failed) {
      try {
        await session.complete();
        this.accumulated = "";
        return;
      } catch (err) {
        console.warn("[QQ] stream complete failed:", err instanceof Error ? err.message : err);
      }
    }
    session?.cancel();
    const remainder = this.accumulated.slice(this.streamed).trim();
    this.accumulated = "";
    if (remainder) await sendPlainText(this.chatId, remainder);
  }
};
var port = {
  platform: "qq",
  logPrefix: "[QQ]",
  async sendNotice(chatId, text) {
    await sendPlainText(chatId, text);
  },
  createResponse(chatId) {
    return new QqResponse(chatId);
  },
  async sendImage(chatId, image) {
    const check = checkAttachmentLimit("image", image.buffer.length, image.mime);
    if (!check.ok) {
      console.warn("[QQ] Outbound image rejected:", check.hint);
      return;
    }
    await bot.sendMedia({
      target: targetFor(chatId),
      fileType: MediaFileType.IMAGE,
      buffer: image.buffer,
      content: image.alt
    });
  },
  setBusy(chatId, busy) {
    if (!busy) return;
    const target = targetFor(chatId);
    if (target.scope !== "c2c") return;
    void bot.sendTyping(target, TYPING_SECONDS).catch(() => {
    });
  },
  clearChat(chatId) {
    replyTargets.delete(chatId);
  }
};
var runtime = new ImChatRuntime({
  port,
  config,
  platformConfig: config.qq,
  bridge,
  sessionStore,
  httpClient,
  defaultWorkDir,
  dedup,
  flushIntervalMs: 600,
  flushCharThreshold: 200
});
async function collectAttachments(chatId, attachments, seed) {
  if (attachments.length === 0) return [];
  const sessionId = sessionStore.get(chatId)?.sessionId ?? chatId;
  const settled = await Promise.allSettled(
    attachments.map(
      (attachment, index) => media.downloadAttachment(attachment, sessionId, `${seed}-${index}`)
    )
  );
  const refs = [];
  let failures = 0;
  for (const result of settled) {
    if (result.status === "rejected") {
      failures += 1;
      console.error("[QQ] attachment download failed:", result.reason);
      continue;
    }
    const local = result.value;
    const check = checkAttachmentLimit(local.kind, local.size, local.mimeType);
    if (!check.ok) {
      await port.sendNotice(chatId, check.hint);
      continue;
    }
    refs.push(
      local.kind === "image" ? { type: "image", name: local.name, data: local.buffer.toString("base64"), mimeType: local.mimeType } : { type: "file", name: local.name, path: local.path, mimeType: local.mimeType }
    );
  }
  if (failures > 0) {
    await port.sendNotice(
      chatId,
      failures === attachments.length ? "\u9644\u4EF6\u4E0B\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002" : `${failures} \u4E2A\u9644\u4EF6\u4E0B\u8F7D\u5931\u8D25\uFF0C\u5DF2\u8DF3\u8FC7\u3002`
    );
  }
  return refs;
}
bot.on("message", async (_ctx, message) => {
  const payload = extractQqPayload(message);
  if (!payload) return;
  replyTargets.set(payload.chatId, {
    scope: "c2c",
    targetId: payload.chatId,
    msgId: message.messageId
  });
  await runtime.handleInbound({
    chatId: payload.chatId,
    userId: payload.userId,
    displayName: payload.displayName,
    dedupKey: payload.dedupKey,
    text: payload.text,
    hasAttachments: payload.attachments.length > 0,
    loadAttachments: () => collectAttachments(
      payload.chatId,
      payload.attachments,
      payload.dedupKey
    )
  });
});
bot.on("ready", () => console.log("[QQ] Gateway ready, bot is running!"));
bot.on("resumed", () => console.log("[QQ] Gateway session resumed"));
bot.on("error", (err) => console.error("[QQ] Connection error:", err.message));
console.log("[QQ] Starting adapter...");
console.log(`[QQ] Server: ${config.serverUrl}`);
console.log(`[QQ] App: ${config.qq.appId}`);
void bot.start().catch((err) => {
  console.error("[QQ] Failed to start:", err instanceof Error ? err.message : err);
  process.exit(1);
});
process.on("SIGINT", () => {
  console.log("[QQ] Shutting down...");
  try {
    bot.stop();
  } catch {
  }
  bridge.destroy();
  dedup.destroy();
  process.exit(0);
});
//# sourceMappingURL=qq-CAB5O3MK.mjs.map
