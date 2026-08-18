import { createRequire as __nodePortCreateRequire } from 'node:module';
import { fileURLToPath as __nodePortF2P } from 'node:url';
import { dirname as __nodePortDirname } from 'node:path';
var require = __nodePortCreateRequire(import.meta.url);
var __filename = __nodePortF2P(import.meta.url);
var __dirname = __nodePortDirname(__filename);
process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1";
import {
  MessageBuffer
} from "./chunk-LKKP7BEU.mjs";
import {
  AttachmentStore,
  MessageDedup,
  SessionStore,
  WsBridge,
  checkAttachmentLimit,
  createAdapterClient,
  enqueue,
  formatImHelp,
  formatImStatus,
  formatPermissionDecisionStatus,
  formatPermissionInstructions,
  formatPermissionRequest,
  isAllowedUser,
  loadConfig,
  parsePermissionCommand,
  restoreStoredSessionBinding,
  splitMessage,
  tryPair
} from "./chunk-XHLXXLZD.mjs";
import {
  init_define_MACRO
} from "./chunk-YXQ2ETWJ.mjs";

// adapters/wechat/index.ts
init_define_MACRO();
import * as path from "node:path";

// adapters/wechat/typing.ts
init_define_MACRO();
var WechatTypingController = class {
  constructor(sendTyping, keepaliveIntervalMs = 5e3) {
    this.sendTyping = sendTyping;
    this.keepaliveIntervalMs = keepaliveIntervalMs;
  }
  sendTyping;
  keepaliveIntervalMs;
  active = /* @__PURE__ */ new Map();
  start(chatId) {
    void this.sendTyping(chatId, "typing");
    if (this.active.has(chatId)) return;
    const timer = setInterval(() => {
      void this.sendTyping(chatId, "typing");
    }, this.keepaliveIntervalMs);
    this.active.set(chatId, timer);
  }
  stop(chatId) {
    const timer = this.active.get(chatId);
    if (timer) {
      clearInterval(timer);
      this.active.delete(chatId);
    }
    void this.sendTyping(chatId, "cancel");
  }
  destroy() {
    for (const timer of this.active.values()) {
      clearInterval(timer);
    }
    this.active.clear();
  }
};

// adapters/wechat/protocol.ts
init_define_MACRO();
import crypto from "node:crypto";
var WECHAT_DEFAULT_BASE_URL = "https://ilinkai.weixin.qq.com";
var ILINK_APP_ID = "bot";
var CHANNEL_VERSION = "2.1.7";
var ILINK_APP_CLIENT_VERSION = buildClientVersion(CHANNEL_VERSION);
var QR_LOGIN_TTL_MS = 5 * 6e4;
var GET_UPDATES_TIMEOUT_MS = 35e3;
var API_TIMEOUT_MS = 15e3;
function buildClientVersion(version) {
  const parts = version.split(".").map((p) => parseInt(p, 10));
  const major = parts[0] ?? 0;
  const minor = parts[1] ?? 0;
  const patch = parts[2] ?? 0;
  return (major & 255) << 16 | (minor & 255) << 8 | patch & 255;
}
function extractWechatText(itemList) {
  if (!itemList?.length) return "";
  for (const item of itemList) {
    if (item.type === 1 && item.text_item?.text != null) {
      const text = String(item.text_item.text);
      const ref = item.ref_msg;
      if (!ref) return text;
      const parts = [];
      if (ref.title) parts.push(ref.title);
      if (ref.message_item) {
        const refBody = extractWechatText([ref.message_item]);
        if (refBody) parts.push(refBody);
      }
      return parts.length ? `[\u5F15\u7528: ${parts.join(" | ")}]
${text}` : text;
    }
    if (item.type === 3 && item.voice_item?.text) {
      return item.voice_item.text;
    }
  }
  return "";
}
async function getWechatUpdates(params) {
  try {
    const rawText = await apiPostFetch({
      baseUrl: params.baseUrl,
      endpoint: "ilink/bot/getupdates",
      body: JSON.stringify({
        get_updates_buf: params.getUpdatesBuf ?? "",
        base_info: buildBaseInfo()
      }),
      token: params.token,
      timeoutMs: params.timeoutMs ?? GET_UPDATES_TIMEOUT_MS,
      label: "wechatGetUpdates"
    });
    return JSON.parse(rawText);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ret: 0, msgs: [], get_updates_buf: params.getUpdatesBuf };
    }
    throw err;
  }
}
async function sendWechatText(params) {
  const body = {
    msg: {
      from_user_id: "",
      to_user_id: params.to,
      client_id: `claude-code-haha-wechat-${crypto.randomUUID()}`,
      message_type: 2,
      message_state: 2,
      item_list: params.text ? [{ type: 1, text_item: { text: params.text } }] : void 0,
      context_token: params.contextToken
    },
    base_info: buildBaseInfo()
  };
  const rawText = await apiPostFetch({
    baseUrl: params.baseUrl,
    endpoint: "ilink/bot/sendmessage",
    body: JSON.stringify(body),
    token: params.token,
    timeoutMs: params.timeoutMs ?? API_TIMEOUT_MS,
    label: "wechatSendMessage"
  });
  assertWechatApiOk(rawText, "wechatSendMessage");
}
async function getWechatConfig(params) {
  const rawText = await apiPostFetch({
    baseUrl: params.baseUrl,
    endpoint: "ilink/bot/getconfig",
    body: JSON.stringify({
      ilink_user_id: params.ilinkUserId,
      context_token: params.contextToken,
      base_info: buildBaseInfo()
    }),
    token: params.token,
    timeoutMs: params.timeoutMs ?? 1e4,
    label: "wechatGetConfig"
  });
  return JSON.parse(rawText);
}
async function sendWechatTyping(params) {
  const rawText = await apiPostFetch({
    baseUrl: params.baseUrl,
    endpoint: "ilink/bot/sendtyping",
    body: JSON.stringify({
      ilink_user_id: params.ilinkUserId,
      typing_ticket: params.typingTicket,
      status: params.status === "typing" ? 1 : 2,
      base_info: buildBaseInfo()
    }),
    token: params.token,
    timeoutMs: params.timeoutMs ?? 1e4,
    label: "wechatSendTyping"
  });
  assertWechatApiOk(rawText, "wechatSendTyping");
}
async function apiPostFetch(params) {
  const url = new URL(params.endpoint, ensureTrailingSlash(params.baseUrl));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), params.timeoutMs);
  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: buildHeaders({ token: params.token, body: params.body }),
      body: params.body,
      signal: controller.signal
    });
    const rawText = await res.text();
    if (!res.ok) throw new Error(`${params.label} ${res.status}: ${rawText}`);
    return rawText;
  } finally {
    clearTimeout(timer);
  }
}
function buildBaseInfo() {
  return { channel_version: CHANNEL_VERSION };
}
function buildCommonHeaders() {
  return {
    "iLink-App-Id": ILINK_APP_ID,
    "iLink-App-ClientVersion": String(ILINK_APP_CLIENT_VERSION)
  };
}
function buildHeaders(opts) {
  const headers = {
    "Content-Type": "application/json",
    AuthorizationType: "ilink_bot_token",
    "Content-Length": String(Buffer.byteLength(opts.body, "utf-8")),
    "X-WECHAT-UIN": randomWechatUin(),
    ...buildCommonHeaders()
  };
  if (opts.token?.trim()) {
    headers.Authorization = `Bearer ${opts.token.trim()}`;
  }
  return headers;
}
function ensureTrailingSlash(url) {
  return url.endsWith("/") ? url : `${url}/`;
}
function randomWechatUin() {
  const uint32 = crypto.randomBytes(4).readUInt32BE(0);
  return Buffer.from(String(uint32), "utf-8").toString("base64");
}
function assertWechatApiOk(rawText, label) {
  if (!rawText.trim()) return;
  let body;
  try {
    body = JSON.parse(rawText);
  } catch {
    return;
  }
  if (!body || typeof body !== "object") return;
  const record = body;
  const code = typeof record.ret === "number" ? record.ret : typeof record.errcode === "number" ? record.errcode : 0;
  if (code === 0) return;
  const message = typeof record.errmsg === "string" ? record.errmsg : rawText;
  throw new Error(`${label} returned ${code}: ${message}`);
}

// adapters/wechat/media.ts
init_define_MACRO();
import crypto2 from "node:crypto";
var DEFAULT_CDN_BASE_URL = "https://findermp.video.qq.com/251/20304/stodownload";
function collectWechatMediaCandidates(items) {
  const candidates = [];
  for (const item of items ?? []) {
    if (item.type === 2 && item.image_item?.media) {
      const media2 = item.image_item.media;
      candidates.push({
        kind: "image",
        name: `wechat-image-${item.msg_id ?? Date.now()}.jpg`,
        mimeType: "image/jpeg",
        url: media2.full_url || item.image_item.url,
        encryptQueryParam: media2.encrypt_query_param,
        aesKey: item.image_item.aeskey ? Buffer.from(item.image_item.aeskey, "hex").toString("base64") : media2.aes_key
      });
    } else if (item.type === 4 && item.file_item?.media) {
      const media2 = item.file_item.media;
      candidates.push({
        kind: "file",
        name: item.file_item.file_name || `wechat-file-${item.msg_id ?? Date.now()}`,
        mimeType: inferMime(item.file_item.file_name),
        url: media2.full_url,
        encryptQueryParam: media2.encrypt_query_param,
        aesKey: media2.aes_key
      });
    }
  }
  return candidates;
}
var WechatMediaService = class {
  constructor(store) {
    this.store = store;
  }
  store;
  async downloadCandidate(candidate, sessionId) {
    const encrypted = await fetchWechatMediaBytes(candidate);
    const buffer = candidate.aesKey ? decryptAesEcb(encrypted, parseAesKey(candidate.aesKey)) : encrypted;
    const target = this.store.resolvePath("wechat", sessionId, candidate.name);
    const path2 = await this.store.write(target, buffer);
    return {
      kind: candidate.kind,
      name: candidate.name,
      path: path2,
      buffer,
      size: buffer.length,
      mimeType: candidate.mimeType ?? (candidate.kind === "image" ? "image/jpeg" : "application/octet-stream")
    };
  }
};
async function fetchWechatMediaBytes(candidate) {
  const url = candidate.url || buildCdnDownloadUrl(candidate.encryptQueryParam);
  if (!url) throw new Error("WeChat media item is missing a download URL");
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`WeChat media download failed: ${resp.status} ${resp.statusText}`);
  }
  return Buffer.from(await resp.arrayBuffer());
}
function buildCdnDownloadUrl(encryptQueryParam) {
  if (!encryptQueryParam) return null;
  return `${DEFAULT_CDN_BASE_URL}?${encryptQueryParam}`;
}
function parseAesKey(aesKeyBase64) {
  const decoded = Buffer.from(aesKeyBase64, "base64");
  if (decoded.length === 16) return decoded;
  if (decoded.length === 32 && /^[0-9a-fA-F]{32}$/.test(decoded.toString("ascii"))) {
    return Buffer.from(decoded.toString("ascii"), "hex");
  }
  throw new Error(`WeChat AES key must decode to 16 bytes, got ${decoded.length}`);
}
function decryptAesEcb(ciphertext, key) {
  const decipher = crypto2.createDecipheriv("aes-128-ecb", key, null);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
function inferMime(fileName) {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (!ext) return void 0;
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  if (ext === "pdf") return "application/pdf";
  if (ext === "txt") return "text/plain";
  return void 0;
}

// adapters/wechat/index.ts
var WECHAT_TEXT_LIMIT = 3500;
var GET_UPDATES_TIMEOUT_MS2 = 35e3;
var config = loadConfig();
if (!config.wechat.botToken || !config.wechat.accountId) {
  console.error("[WeChat] Missing QR-bound account. Bind WeChat in Desktop Settings > IM.");
  process.exit(1);
}
var baseUrl = config.wechat.baseUrl || WECHAT_DEFAULT_BASE_URL;
var accountId = config.wechat.accountId;
var botToken = config.wechat.botToken;
var bridge = new WsBridge(config.serverUrl, "wechat");
var dedup = new MessageDedup();
var sessionStore = new SessionStore();
var { httpClient, defaultWorkDir } = createAdapterClient(config, config.wechat);
var attachmentStore = new AttachmentStore();
var media = new WechatMediaService(attachmentStore);
var pendingProjectSelection = /* @__PURE__ */ new Map();
var runtimeStates = /* @__PURE__ */ new Map();
var blockBuffers = /* @__PURE__ */ new Map();
var contextTokens = /* @__PURE__ */ new Map();
var typingTickets = /* @__PURE__ */ new Map();
var pendingPermissions = /* @__PURE__ */ new Map();
var typingController = new WechatTypingController(sendTypingIndicator);
var getUpdatesBuf = "";
var stopped = false;
attachmentStore.gc().catch((err) => {
  console.warn("[WeChat] AttachmentStore.gc failed:", err instanceof Error ? err.message : err);
});
function getRuntimeState(chatId) {
  let state = runtimeStates.get(chatId);
  if (!state) {
    state = { state: "idle", pendingPermissionCount: 0 };
    runtimeStates.set(chatId, state);
  }
  return state;
}
async function sendText(chatId, text) {
  const chunks = splitMessage(text, WECHAT_TEXT_LIMIT);
  const contextToken = contextTokens.get(chatId);
  for (const chunk of chunks) {
    try {
      await sendWechatText({
        baseUrl,
        token: botToken,
        to: chatId,
        text: chunk,
        contextToken
      });
    } catch (err) {
      if (!contextToken) throw err;
      console.warn("[WeChat] sendText with context token failed, retrying without context:", err instanceof Error ? err.message : err);
      await sendWechatText({
        baseUrl,
        token: botToken,
        to: chatId,
        text: chunk
      });
    }
  }
  console.log(`[WeChat] Sent ${chunks.length} message chunk(s) to ${redactChatId(chatId)}`);
}
function getBlockBuffer(chatId) {
  let buffer = blockBuffers.get(chatId);
  if (!buffer) {
    buffer = new MessageBuffer(
      async (text) => {
        if (text.trim()) await sendText(chatId, text);
      },
      3e3,
      200
    );
    blockBuffers.set(chatId, buffer);
  }
  return buffer;
}
async function sendTypingIndicator(chatId, status) {
  try {
    const typingTicket = await getTypingTicket(chatId, status);
    if (!typingTicket) return;
    await sendWechatTyping({
      baseUrl,
      token: botToken,
      ilinkUserId: chatId,
      typingTicket,
      status
    });
  } catch (err) {
    typingTickets.delete(chatId);
    if (status === "typing") {
      try {
        const typingTicket = await getTypingTicket(chatId, status);
        if (!typingTicket) return;
        await sendWechatTyping({
          baseUrl,
          token: botToken,
          ilinkUserId: chatId,
          typingTicket,
          status
        });
        return;
      } catch {
      }
    }
    console.warn("[WeChat] sendTyping failed:", err instanceof Error ? err.message : err);
  }
}
async function getTypingTicket(chatId, status) {
  let typingTicket = typingTickets.get(chatId);
  if (!typingTicket && status === "typing") {
    const configResp = await getWechatConfig({
      baseUrl,
      token: botToken,
      ilinkUserId: chatId,
      contextToken: contextTokens.get(chatId)
    });
    if (typeof configResp.ret === "number" && configResp.ret !== 0) {
      throw new Error(`getconfig returned ${configResp.ret}: ${configResp.errmsg ?? ""}`);
    }
    typingTicket = configResp.typing_ticket;
    if (typingTicket) typingTickets.set(chatId, typingTicket);
  }
  return typingTicket || null;
}
function clearTransientChatState(chatId) {
  blockBuffers.get(chatId)?.reset();
  blockBuffers.delete(chatId);
  pendingPermissions.delete(chatId);
  typingController.stop(chatId);
  const runtime = getRuntimeState(chatId);
  runtime.state = "idle";
  runtime.verb = void 0;
  runtime.pendingPermissionCount = 0;
}
function enqueueWechat(chatId, task) {
  enqueue(chatId, async () => {
    try {
      await task();
    } catch (err) {
      typingController.stop(chatId);
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[WeChat] Failed to handle message for ${redactChatId(chatId)}:`, err);
      try {
        await sendText(chatId, `\u5904\u7406\u6D88\u606F\u5931\u8D25\uFF1A${message}`);
      } catch (sendErr) {
        console.error(`[WeChat] Failed to report message handling error for ${redactChatId(chatId)}:`, sendErr);
      }
    }
  });
}
async function ensureExistingSession(chatId) {
  return await restoreStoredSessionBinding({
    chatId,
    bridge,
    sessionStore,
    httpClient,
    onServerMessage: (msg) => handleServerMessage(chatId, msg),
    logPrefix: "[WeChat]",
    clearTransientState: () => clearTransientChatState(chatId)
  });
}
async function buildStatusText(chatId) {
  const stored = await ensureExistingSession(chatId);
  if (!stored) return formatImStatus(null);
  const runtime = getRuntimeState(chatId);
  let projectName = path.basename(stored.workDir) || stored.workDir;
  let branch = null;
  try {
    const gitInfo = await httpClient.getGitInfo(stored.sessionId);
    projectName = gitInfo.repoName || path.basename(gitInfo.workDir) || projectName;
    branch = gitInfo.branch;
  } catch {
  }
  let taskCounts;
  try {
    const tasks = await httpClient.getTasksForSession(stored.sessionId);
    if (tasks.length > 0) {
      taskCounts = {
        total: tasks.length,
        pending: tasks.filter((task) => task.status === "pending").length,
        inProgress: tasks.filter((task) => task.status === "in_progress").length,
        completed: tasks.filter((task) => task.status === "completed").length
      };
    }
  } catch {
  }
  return formatImStatus({
    sessionId: stored.sessionId,
    projectName,
    branch,
    model: runtime.model,
    state: runtime.state,
    verb: runtime.verb,
    pendingPermissionCount: runtime.pendingPermissionCount,
    taskCounts
  });
}
async function ensureSession(chatId) {
  const stored = await ensureExistingSession(chatId);
  if (stored) return true;
  const workDir = defaultWorkDir;
  if (workDir) return await createSessionForChat(chatId, workDir);
  await showProjectPicker(chatId);
  return false;
}
async function createSessionForChat(chatId, workDir) {
  try {
    bridge.resetSession(chatId);
    clearTransientChatState(chatId);
    const sessionId = await httpClient.createSession(workDir);
    sessionStore.set(chatId, sessionId, workDir);
    bridge.connectSession(chatId, sessionId);
    bridge.onServerMessage(chatId, (msg) => handleServerMessage(chatId, msg));
    const opened = await bridge.waitForOpen(chatId);
    if (!opened) {
      await sendText(chatId, "\u8FDE\u63A5\u670D\u52A1\u5668\u8D85\u65F6\uFF0C\u8BF7\u91CD\u8BD5\u3002");
      return false;
    }
    return true;
  } catch (err) {
    await sendText(chatId, `\u65E0\u6CD5\u521B\u5EFA\u4F1A\u8BDD: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
async function showProjectPicker(chatId) {
  try {
    const projects = await httpClient.listRecentProjects();
    if (projects.length === 0) {
      await sendText(chatId, `\u6CA1\u6709\u627E\u5230\u6700\u8FD1\u7684\u9879\u76EE\u3002\u53D1\u9001 /new \u4F1A\u4F7F\u7528\u9ED8\u8BA4\u5DE5\u4F5C\u76EE\u5F55\uFF1A${defaultWorkDir}
\u4E5F\u53EF\u4EE5\u53D1\u9001 /new /path/to/project \u6307\u5B9A\u9879\u76EE\u3002`);
      return;
    }
    const lines = projects.slice(0, 10).map(
      (p, i) => `${i + 1}. ${p.projectName}${p.branch ? ` (${p.branch})` : ""}
   ${p.realPath}`
    );
    pendingProjectSelection.set(chatId, true);
    await sendText(chatId, `\u9009\u62E9\u9879\u76EE\uFF08\u56DE\u590D\u7F16\u53F7\uFF09\uFF1A

${lines.join("\n\n")}

\u4E0B\u6B21\u53EF\u76F4\u63A5 /new <\u7F16\u53F7\u3001\u540D\u79F0\u6216\u7EDD\u5BF9\u8DEF\u5F84> \u5FEB\u901F\u65B0\u5EFA\u4F1A\u8BDD`);
  } catch (err) {
    await sendText(chatId, `\u65E0\u6CD5\u83B7\u53D6\u9879\u76EE\u5217\u8868: ${err instanceof Error ? err.message : String(err)}`);
  }
}
async function startNewSession(chatId, query) {
  bridge.resetSession(chatId);
  sessionStore.delete(chatId);
  clearTransientChatState(chatId);
  pendingProjectSelection.delete(chatId);
  if (query) {
    try {
      const { project, ambiguous } = await httpClient.matchProject(query);
      if (project) {
        const ok = await createSessionForChat(chatId, project.realPath);
        if (ok) await sendText(chatId, `\u5DF2\u65B0\u5EFA\u4F1A\u8BDD\uFF1A${project.projectName}${project.branch ? ` (${project.branch})` : ""}`);
        return;
      }
      if (ambiguous) {
        const list = ambiguous.map((p, i) => `${i + 1}. ${p.projectName} - ${p.realPath}`).join("\n");
        await sendText(chatId, `\u5339\u914D\u5230\u591A\u4E2A\u9879\u76EE\uFF0C\u8BF7\u66F4\u7CBE\u786E\uFF1A

${list}`);
        return;
      }
      await sendText(chatId, `\u672A\u627E\u5230\u5339\u914D "${query}" \u7684\u9879\u76EE\u3002\u53D1\u9001 /projects \u67E5\u770B\u5B8C\u6574\u5217\u8868\u3002`);
    } catch (err) {
      await sendText(chatId, err instanceof Error ? err.message : String(err));
    }
    return;
  }
  const workDir = defaultWorkDir;
  if (workDir) {
    const ok = await createSessionForChat(chatId, workDir);
    if (ok) await sendText(chatId, "\u5DF2\u65B0\u5EFA\u4F1A\u8BDD\uFF0C\u53EF\u4EE5\u5F00\u59CB\u5BF9\u8BDD\u4E86\u3002");
  } else {
    await showProjectPicker(chatId);
  }
}
async function handleServerMessage(chatId, msg) {
  const runtime = getRuntimeState(chatId);
  switch (msg.type) {
    case "connected":
      break;
    case "status":
      runtime.state = msg.state;
      runtime.verb = typeof msg.verb === "string" ? msg.verb : void 0;
      if (msg.state === "thinking" || msg.state === "tool_executing") {
        typingController.start(chatId);
      } else if (msg.state === "idle") {
        typingController.stop(chatId);
      }
      break;
    case "content_start":
      if (msg.blockType === "text") {
        runtime.state = "streaming";
      } else if (msg.blockType === "tool_use") {
        runtime.state = "tool_executing";
        runtime.verb = typeof msg.toolName === "string" ? msg.toolName : runtime.verb;
        typingController.start(chatId);
      }
      break;
    case "content_delta":
      if (typeof msg.text === "string" && msg.text) {
        getBlockBuffer(chatId).append(msg.text);
      }
      break;
    case "tool_use_complete":
      runtime.state = "tool_executing";
      runtime.verb = typeof msg.toolName === "string" ? msg.toolName : runtime.verb;
      typingController.start(chatId);
      break;
    case "tool_result":
      runtime.state = "thinking";
      runtime.verb = void 0;
      typingController.start(chatId);
      break;
    case "permission_request": {
      runtime.pendingPermissionCount += 1;
      runtime.state = "permission_pending";
      let pending = pendingPermissions.get(chatId);
      if (!pending) {
        pending = /* @__PURE__ */ new Set();
        pendingPermissions.set(chatId, pending);
      }
      pending.add(msg.requestId);
      typingController.stop(chatId);
      await sendText(
        chatId,
        `${formatPermissionRequest(msg.toolName, msg.input, msg.requestId)}

${formatPermissionInstructions(msg.requestId)}`
      );
      break;
    }
    case "message_complete": {
      runtime.state = "idle";
      runtime.verb = void 0;
      typingController.stop(chatId);
      await blockBuffers.get(chatId)?.complete();
      blockBuffers.delete(chatId);
      break;
    }
    case "error":
      runtime.state = "idle";
      runtime.verb = void 0;
      typingController.stop(chatId);
      blockBuffers.get(chatId)?.reset();
      blockBuffers.delete(chatId);
      await sendText(chatId, `\u9519\u8BEF: ${msg.message}`);
      break;
    case "system_notification":
      if (msg.subtype === "init" && msg.data && typeof msg.data === "object") {
        const model = msg.data.model;
        if (typeof model === "string" && model.trim()) runtime.model = model;
      }
      break;
  }
}
async function routeUserMessage(message) {
  const chatId = message.from_user_id;
  if (!chatId) return;
  const messageKey = `${message.message_id ?? ""}:${message.seq ?? ""}:${message.create_time_ms ?? ""}`;
  if (!dedup.tryRecord(messageKey)) return;
  if (message.context_token) contextTokens.set(chatId, message.context_token);
  const text = extractWechatText(message.item_list).trim();
  const mediaCandidates = collectWechatMediaCandidates(message.item_list);
  if (!text && mediaCandidates.length === 0) return;
  console.log(`[WeChat] Received from ${redactChatId(chatId)}: ${text.slice(0, 80)}`);
  if (!isAllowedUser("wechat", chatId)) {
    const success = text ? tryPair(text, { userId: chatId, displayName: "WeChat User" }, "wechat") : false;
    await sendText(
      chatId,
      success ? "\u914D\u5BF9\u6210\u529F\uFF01\u73B0\u5728\u53EF\u4EE5\u5F00\u59CB\u804A\u5929\u4E86\u3002\n\n\u53D1\u9001\u6D88\u606F\u5373\u53EF\u4E0E Claude \u5BF9\u8BDD\u3002\u53D1\u9001 /help \u67E5\u770B\u53EF\u7528\u547D\u4EE4\u3002" : "\u672A\u6388\u6743\u3002\u8BF7\u5148\u5728 Claude Code \u684C\u9762\u7AEF\u5B8C\u6210\u5FAE\u4FE1\u626B\u7801\u7ED1\u5B9A\uFF0C\u518D\u751F\u6210 IM \u914D\u5BF9\u7801\u540E\u53D1\u9001\u7ED9\u6211\u3002"
    );
    return;
  }
  enqueueWechat(chatId, async () => {
    const hasAttachments = mediaCandidates.length > 0;
    if (!hasAttachments && (text === "/help" || text === "\u5E2E\u52A9")) {
      await sendText(chatId, formatImHelp());
      return;
    }
    if (!hasAttachments && (text === "/status" || text === "\u72B6\u6001")) {
      await sendText(chatId, await buildStatusText(chatId));
      return;
    }
    if (!hasAttachments && (text === "/projects" || text === "\u9879\u76EE\u5217\u8868")) {
      await showProjectPicker(chatId);
      return;
    }
    if (!hasAttachments && (text === "/new" || text === "\u65B0\u4F1A\u8BDD" || text.startsWith("/new "))) {
      const arg = text.startsWith("/new ") ? text.slice(5).trim() : "";
      await startNewSession(chatId, arg || void 0);
      return;
    }
    if (!hasAttachments && (text === "/stop" || text === "\u505C\u6B62")) {
      const stored = await ensureExistingSession(chatId);
      if (!stored) {
        await sendText(chatId, formatImStatus(null));
        return;
      }
      bridge.sendStopGeneration(chatId);
      await sendText(chatId, "\u5DF2\u53D1\u9001\u505C\u6B62\u4FE1\u53F7\u3002");
      return;
    }
    if (!hasAttachments && (text === "/clear" || text === "\u6E05\u7A7A")) {
      const stored = await ensureExistingSession(chatId);
      if (!stored) {
        await sendText(chatId, formatImStatus(null));
        return;
      }
      clearTransientChatState(chatId);
      const sent2 = bridge.sendUserMessage(chatId, "/clear");
      await sendText(chatId, sent2 ? "\u5DF2\u6E05\u7A7A\u5F53\u524D\u4F1A\u8BDD\u4E0A\u4E0B\u6587\u3002" : "\u65E0\u6CD5\u53D1\u9001 /clear\uFF0C\u8BF7\u5148\u53D1\u9001 /new \u91CD\u65B0\u8FDE\u63A5\u4F1A\u8BDD\u3002");
      return;
    }
    const permissionDecision = !hasAttachments ? parsePermissionCommand(text, pendingPermissions.get(chatId)) : null;
    if (permissionDecision) {
      const { requestId, allowed, rule } = permissionDecision;
      const pending = pendingPermissions.get(chatId);
      if (!pending?.has(requestId)) {
        await sendText(chatId, `\u672A\u627E\u5230\u5F85\u786E\u8BA4\u7684\u6743\u9650\u8BF7\u6C42\uFF1A${requestId}`);
        return;
      }
      const sent2 = bridge.sendPermissionResponse(chatId, requestId, allowed, rule);
      const runtime = getRuntimeState(chatId);
      if (sent2) {
        runtime.pendingPermissionCount = Math.max(0, runtime.pendingPermissionCount - 1);
        pending.delete(requestId);
      }
      await sendText(chatId, sent2 ? `${formatPermissionDecisionStatus(permissionDecision)}\u3002` : "\u6743\u9650\u54CD\u5E94\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u4F1A\u8BDD\u72B6\u6001\u3002");
      return;
    }
    if (!hasAttachments && pendingProjectSelection.has(chatId)) {
      await startNewSession(chatId, text);
      return;
    }
    const ready = await ensureSession(chatId);
    if (!ready) return;
    const attachments = await collectAttachments(chatId, mediaCandidates);
    const effectiveText = text || (attachments.length > 0 ? "(\u7528\u6237\u53D1\u9001\u4E86\u9644\u4EF6)" : "");
    if (!effectiveText && attachments.length === 0) return;
    typingController.start(chatId);
    const sent = bridge.sendUserMessage(chatId, effectiveText, attachments.length ? attachments : void 0);
    if (!sent) await sendText(chatId, "\u6D88\u606F\u53D1\u9001\u5931\u8D25\uFF0C\u8FDE\u63A5\u53EF\u80FD\u5DF2\u65AD\u5F00\u3002\u8BF7\u53D1\u9001 /new \u91CD\u65B0\u5F00\u59CB\u3002");
  });
}
async function collectAttachments(chatId, candidates) {
  if (candidates.length === 0) return [];
  const stored = sessionStore.get(chatId);
  const sessionId = stored?.sessionId ?? chatId;
  const settled = await Promise.allSettled(candidates.map((candidate) => media.downloadCandidate(candidate, sessionId)));
  const attachments = [];
  let failures = 0;
  for (const result of settled) {
    if (result.status === "rejected") {
      failures += 1;
      console.error("[WeChat] media download failed:", result.reason);
      continue;
    }
    const local = result.value;
    const check = checkAttachmentLimit(local.kind, local.size, local.mimeType);
    if (!check.ok) {
      await sendText(chatId, check.hint);
      continue;
    }
    if (local.kind === "image") {
      attachments.push({
        type: "image",
        name: local.name,
        data: local.buffer.toString("base64"),
        mimeType: local.mimeType
      });
    } else {
      attachments.push({
        type: "file",
        name: local.name,
        path: local.path,
        mimeType: local.mimeType
      });
    }
  }
  if (failures > 0) {
    await sendText(
      chatId,
      failures === candidates.length ? "\u9644\u4EF6\u4E0B\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002" : `${failures} \u4E2A\u9644\u4EF6\u4E0B\u8F7D\u5931\u8D25\uFF0C\u5DF2\u8DF3\u8FC7\u3002`
    );
  }
  return attachments;
}
async function pollLoop() {
  while (!stopped) {
    try {
      const resp = await getWechatUpdates({
        baseUrl,
        token: botToken,
        getUpdatesBuf,
        timeoutMs: GET_UPDATES_TIMEOUT_MS2
      });
      if (resp.get_updates_buf) getUpdatesBuf = resp.get_updates_buf;
      const hasRetError = typeof resp.ret === "number" && resp.ret !== 0;
      const hasErrCode = typeof resp.errcode === "number" && resp.errcode !== 0;
      if (hasRetError || hasErrCode) {
        console.warn(`[WeChat] getupdates error: ${resp.errcode ?? resp.ret} ${resp.errmsg ?? ""}`);
        await sleep(3e3);
        continue;
      }
      for (const msg of resp.msgs ?? []) {
        await routeUserMessage(msg);
      }
    } catch (err) {
      console.error("[WeChat] poll loop error:", err instanceof Error ? err.message : err);
      await sleep(3e3);
    }
  }
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function redactChatId(chatId) {
  if (chatId.length <= 12) return chatId;
  return `${chatId.slice(0, 6)}...${chatId.slice(-6)}`;
}
console.log("[WeChat] Starting adapter...");
console.log(`[WeChat] Account: ${accountId}`);
void pollLoop();
process.on("SIGINT", () => {
  console.log("[WeChat] Shutting down...");
  stopped = true;
  typingController.destroy();
  bridge.destroy();
  dedup.destroy();
  process.exit(0);
});
//# sourceMappingURL=wechat-MBBOPH2G.mjs.map
