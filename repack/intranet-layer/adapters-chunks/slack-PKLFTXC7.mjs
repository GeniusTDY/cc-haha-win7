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

// adapters/slack/index.ts
init_define_MACRO();

// adapters/slack/api.ts
init_define_MACRO();
var SLACK_API_BASE = "https://slack.com/api/";
var SLACK_FILE_HOST = "files.slack.com";
var REQUEST_TIMEOUT_MS = 3e4;
var UPLOAD_TIMEOUT_MS = 12e4;
var SlackApiError = class extends Error {
  constructor(method, code, status) {
    super(`Slack ${method} failed: ${code}`);
    this.method = method;
    this.code = code;
    this.status = status;
    this.name = "SlackApiError";
  }
  method;
  code;
  status;
};
function assertSlackFileUrl(value) {
  if (!value) throw new Error("Slack file has no download URL");
  const url = new URL(value);
  const safePort = !url.port || url.port === "443";
  if (url.protocol !== "https:" || url.hostname !== SLACK_FILE_HOST || !safePort || url.username || url.password) {
    throw new Error("Slack file URL is not hosted by Slack");
  }
  url.hash = "";
  return url;
}
function assertSlackUploadUrl(value) {
  if (!value) throw new Error("Slack returned no upload URL");
  const url = new URL(value);
  const safePort = !url.port || url.port === "443";
  if (url.protocol !== "https:" || url.hostname !== SLACK_FILE_HOST || !safePort || url.username || url.password) {
    throw new Error("Slack returned an unsafe upload URL");
  }
  url.hash = "";
  return url;
}
var SlackApiClient = class {
  constructor(botToken, fetchImpl = fetch, baseUrl = SLACK_API_BASE) {
    this.botToken = botToken;
    this.fetchImpl = fetchImpl;
    this.baseUrl = baseUrl;
  }
  botToken;
  fetchImpl;
  baseUrl;
  /** POST a JSON body to a Web API method. */
  async call(method, body, token = this.botToken) {
    const response = await this.fetchImpl(new URL(method, this.baseUrl), {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    const data = await response.json().catch(() => null);
    if (!data || data.ok !== true) {
      throw new SlackApiError(method, data?.error ?? `http_${response.status}`, response.status);
    }
    return data;
  }
  /** GET a Web API method with query parameters. */
  async get(method, query) {
    const url = new URL(method, this.baseUrl);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, String(value));
    }
    const response = await this.fetchImpl(url, {
      method: "GET",
      headers: { authorization: `Bearer ${this.botToken}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    const data = await response.json().catch(() => null);
    if (!data || data.ok !== true) {
      throw new SlackApiError(method, data?.error ?? `http_${response.status}`, response.status);
    }
    return data;
  }
  async postMessage(channel, text, threadTs) {
    const body = { channel, text };
    if (threadTs) body.thread_ts = threadTs;
    const data = await this.call("chat.postMessage", body);
    if (!data.ts) throw new SlackApiError("chat.postMessage", "missing_ts");
    return data.ts;
  }
  async updateMessage(channel, ts, text) {
    await this.call("chat.update", { channel, ts, text });
  }
  /** Identity of the bot user, used to ignore the bot's own messages. */
  async authTest() {
    const data = await this.call(
      "auth.test",
      {}
    );
    return { userId: data.user_id ?? "", teamId: data.team_id, botId: data.bot_id };
  }
  /** Open a Socket Mode WebSocket URL using the app-level token. */
  async openSocketConnection(appToken) {
    const data = await this.call("apps.connections.open", {}, appToken);
    const raw = data.url;
    if (!raw) throw new SlackApiError("apps.connections.open", "missing_url");
    const url = new URL(raw);
    if (url.protocol !== "wss:") {
      throw new SlackApiError("apps.connections.open", "insecure_socket_url");
    }
    return url.toString();
  }
  /** Download a private file with the bot token attached. */
  async downloadFile(urlPrivateDownload) {
    const url = assertSlackFileUrl(urlPrivateDownload);
    const response = await this.fetchImpl(url, {
      headers: { authorization: `Bearer ${this.botToken}` },
      redirect: "follow",
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS)
    });
    if (!response.ok) {
      throw new Error(`Slack file download failed: ${response.status} ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }
  /**
   * Slack's three-step external upload: reserve a URL, PUT the bytes, then
   * publish the file into a channel.
   */
  async uploadFile(options) {
    const reserved = await this.get(
      "files.getUploadURLExternal",
      { filename: options.filename, length: options.buffer.length }
    );
    const uploadUrl = assertSlackUploadUrl(reserved.upload_url);
    const fileId = reserved.file_id;
    if (!fileId) throw new SlackApiError("files.getUploadURLExternal", "missing_file_id");
    const upload = await this.fetchImpl(uploadUrl, {
      method: "POST",
      body: new Uint8Array(options.buffer),
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS)
    });
    if (!upload.ok) {
      throw new Error(`Slack file upload failed: ${upload.status} ${upload.statusText}`);
    }
    const complete = {
      files: [{ id: fileId, title: options.title ?? options.filename }],
      channel_id: options.channel
    };
    if (options.threadTs) complete.thread_ts = options.threadTs;
    await this.call("files.completeUploadExternal", complete);
  }
};

// adapters/slack/socket-mode.ts
init_define_MACRO();
var RECONNECT_BASE_MS = 1e3;
var RECONNECT_MAX_MS = 3e4;
var SlackSocketMode = class {
  constructor(options) {
    this.options = options;
    this.logPrefix = options.logPrefix ?? "[Slack]";
  }
  options;
  socket = null;
  reconnectTimer = null;
  attempts = 0;
  stopped = false;
  logPrefix;
  async start() {
    this.stopped = false;
    await this.connect();
  }
  stop() {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    const socket2 = this.socket;
    this.socket = null;
    if (!socket2) return;
    socket2.removeAllListeners();
    socket2.on("error", () => {
    });
    try {
      socket2.close(1e3, "adapter stopped");
    } catch {
    }
  }
  async connect() {
    if (this.stopped) return;
    let url;
    try {
      url = await this.options.openConnection();
    } catch (err) {
      console.error(
        `${this.logPrefix} Failed to open Socket Mode connection:`,
        err instanceof Error ? err.message : err
      );
      this.scheduleReconnect();
      return;
    }
    if (this.stopped) return;
    const socket2 = (this.options.createWebSocket ?? ((target) => new wrapper_default(target)))(url);
    this.socket = socket2;
    socket2.on("open", () => {
      this.attempts = 0;
      console.log(`${this.logPrefix} Socket Mode connected`);
    });
    socket2.on("message", (raw) => {
      let envelope;
      try {
        envelope = JSON.parse(raw.toString());
      } catch (err) {
        console.error(`${this.logPrefix} Socket parse error:`, err);
        return;
      }
      if (envelope.envelope_id && socket2.readyState === wrapper_default.OPEN) {
        socket2.send(JSON.stringify({ envelope_id: envelope.envelope_id }));
      }
      if (envelope.type === "disconnect") {
        console.log(`${this.logPrefix} Slack asked to reconnect (${envelope.reason ?? "unknown"})`);
        try {
          socket2.close(1e3, "slack requested reconnect");
        } catch {
        }
        return;
      }
      if (envelope.type === "hello") return;
      try {
        this.options.onEnvelope(envelope);
      } catch (err) {
        console.error(`${this.logPrefix} Envelope handler error:`, err);
      }
    });
    socket2.on("close", () => {
      if (this.socket !== socket2) return;
      this.socket = null;
      if (this.stopped) return;
      this.scheduleReconnect();
    });
    socket2.on("error", (err) => {
      console.error(`${this.logPrefix} Socket error:`, err.message);
    });
  }
  scheduleReconnect() {
    if (this.stopped || this.reconnectTimer) return;
    this.attempts += 1;
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** (this.attempts - 1), RECONNECT_MAX_MS);
    console.log(`${this.logPrefix} Reconnecting Socket Mode in ${delay}ms (attempt ${this.attempts})`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }
};

// adapters/slack/extract-payload.ts
init_define_MACRO();
function decodeSlackEntities(text) {
  return text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
}
function stripSlackMarkup(text) {
  return decodeSlackEntities(
    text.replace(/<@([A-Z0-9]+)(\|[^>]*)?>/g, "").replace(/<#([A-Z0-9]+)\|([^>]*)>/g, "#$2").replace(/<(https?:\/\/[^|>]+)\|([^>]*)>/g, "$2").replace(/<(https?:\/\/[^|>]+)>/g, "$1")
  ).trim();
}
var USER_MESSAGE_SUBTYPES = /* @__PURE__ */ new Set(["file_share"]);
function extractSlackPayload(event, options = {}) {
  if (!event) return null;
  if (event.type !== "message") return null;
  if (event.subtype && !USER_MESSAGE_SUBTYPES.has(event.subtype)) return null;
  if (event.hidden) return null;
  if (event.bot_id) return null;
  if (event.channel_type !== "im") return null;
  const chatId = event.channel?.trim();
  const userId = event.user?.trim();
  if (!chatId || !userId) return null;
  if (options.botUserId && userId === options.botUserId) return null;
  const files = (event.files ?? []).filter((file) => Boolean(file?.url_private_download || file?.url_private));
  const text = stripSlackMarkup(event.text ?? "");
  if (!text && files.length === 0) return null;
  return {
    chatId,
    userId,
    text,
    dedupKey: event.client_msg_id?.trim() || `${chatId}:${event.ts ?? ""}`,
    threadTs: event.thread_ts,
    files
  };
}

// adapters/slack/index.ts
var SLACK_TEXT_LIMIT = 3500;
var SLACK_EDIT_INTERVAL_MS = 1200;
var config = loadConfig();
if (!config.slack.botToken || !config.slack.appToken) {
  console.error("[Slack] Missing SLACK_BOT_TOKEN / SLACK_APP_TOKEN. Configure Slack in Desktop Settings > IM.");
  process.exit(1);
}
var api = new SlackApiClient(config.slack.botToken);
var bridge = new WsBridge(config.serverUrl, "slack");
var dedup = new MessageDedup();
var sessionStore = new SessionStore();
var { httpClient, defaultWorkDir } = createAdapterClient(config, config.slack);
var attachmentStore = new AttachmentStore();
attachmentStore.gc().catch((err) => {
  console.warn("[Slack] AttachmentStore.gc failed:", err instanceof Error ? err.message : err);
});
var botUserId;
var displayNames = /* @__PURE__ */ new Map();
var DISPLAY_NAME_CACHE_LIMIT = 500;
var replyThreads = /* @__PURE__ */ new Map();
async function sendChunkedText(chatId, text) {
  const threadTs = replyThreads.get(chatId);
  for (const chunk of splitMessage(text, SLACK_TEXT_LIMIT)) {
    await api.postMessage(chatId, chunk, threadTs);
  }
}
var SlackResponse = class {
  constructor(chatId) {
    this.chatId = chatId;
  }
  chatId;
  messageTs = null;
  current = "";
  pending = "";
  lastEditAt = 0;
  async append(delta) {
    if (!delta) return;
    this.pending += delta;
    const now = Date.now();
    if (this.messageTs && now - this.lastEditAt < SLACK_EDIT_INTERVAL_MS) return;
    await this.render(now);
  }
  async finish() {
    if (!this.pending) return;
    await this.render(Date.now());
  }
  async render(now) {
    const displayed = this.messageTs ? this.current : "";
    const next = this.current + this.pending;
    if (!next.trim()) {
      this.pending = "";
      return;
    }
    this.pending = "";
    try {
      const chunks = splitMessage(next, SLACK_TEXT_LIMIT);
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const isLast = i === chunks.length - 1;
        if (i === 0 && this.messageTs) {
          await api.updateMessage(this.chatId, this.messageTs, chunk);
        } else {
          this.messageTs = await api.postMessage(this.chatId, chunk, replyThreads.get(this.chatId));
        }
        if (!isLast) this.messageTs = null;
      }
      this.current = chunks[chunks.length - 1];
      this.lastEditAt = now;
    } catch (err) {
      console.error("[Slack] Failed to render response:", err instanceof Error ? err.message : err);
      this.messageTs = null;
      this.current = "";
      this.pending = next.slice(displayed.length);
    }
  }
};
var port = {
  platform: "slack",
  logPrefix: "[Slack]",
  async sendNotice(chatId, text) {
    await sendChunkedText(chatId, text);
  },
  createResponse(chatId) {
    return new SlackResponse(chatId);
  },
  async sendImage(chatId, image) {
    const check = checkAttachmentLimit("image", image.buffer.length, image.mime);
    if (!check.ok) {
      console.warn("[Slack] Outbound image rejected:", check.hint);
      return;
    }
    await api.uploadFile({
      channel: chatId,
      buffer: image.buffer,
      filename: `claude-${Date.now()}.${imageExtensionForMime(image.mime)}`,
      title: image.alt,
      threadTs: replyThreads.get(chatId)
    });
  },
  clearChat(chatId) {
    replyThreads.delete(chatId);
  }
};
var runtime = new ImChatRuntime({
  port,
  config,
  platformConfig: config.slack,
  bridge,
  sessionStore,
  httpClient,
  defaultWorkDir,
  dedup,
  flushIntervalMs: 900,
  flushCharThreshold: 240
});
async function resolveDisplayName(userId) {
  const cached = displayNames.get(userId);
  if (cached) return cached;
  try {
    const info = await api.get("users.info", {
      user: userId
    });
    const name = info.user?.real_name?.trim() || info.user?.name?.trim() || userId;
    if (displayNames.size >= DISPLAY_NAME_CACHE_LIMIT) {
      const oldest = displayNames.keys().next().value;
      if (oldest !== void 0) displayNames.delete(oldest);
    }
    displayNames.set(userId, name);
    return name;
  } catch {
    return userId;
  }
}
async function collectAttachments(chatId, files) {
  if (files.length === 0) return [];
  const sessionId = sessionStore.get(chatId)?.sessionId ?? chatId;
  const refs = [];
  let failures = 0;
  for (const file of files) {
    try {
      const buffer = await api.downloadFile(file.url_private_download ?? file.url_private);
      const name = file.name?.trim() || file.title?.trim() || `slack-file-${file.id ?? Date.now()}`;
      const mimeType = file.mimetype?.split(";")[0]?.trim() || inferMimeFromFileName(name) || "application/octet-stream";
      const kind = attachmentKindForMime(mimeType);
      const check = checkAttachmentLimit(kind, buffer.length, mimeType);
      if (!check.ok) {
        await port.sendNotice(chatId, check.hint);
        continue;
      }
      if (kind === "image") {
        refs.push({ type: "image", name, data: buffer.toString("base64"), mimeType });
        continue;
      }
      const target = attachmentStore.resolvePath("slack", sessionId, name);
      const path = await attachmentStore.write(target, buffer);
      refs.push({ type: "file", name, path, mimeType });
    } catch (err) {
      failures += 1;
      console.error("[Slack] file download failed:", err instanceof Error ? err.message : err);
    }
  }
  if (failures > 0) {
    await port.sendNotice(
      chatId,
      failures === files.length ? "\u9644\u4EF6\u4E0B\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002" : `${failures} \u4E2A\u9644\u4EF6\u4E0B\u8F7D\u5931\u8D25\uFF0C\u5DF2\u8DF3\u8FC7\u3002`
    );
  }
  return refs;
}
var socket = new SlackSocketMode({
  openConnection: () => api.openSocketConnection(config.slack.appToken),
  logPrefix: "[Slack]",
  onEnvelope: (envelope) => {
    if (envelope.type !== "events_api") return;
    const payload = extractSlackPayload(envelope.payload?.event, { botUserId });
    if (!payload) return;
    replyThreads.set(payload.chatId, payload.threadTs);
    void (async () => {
      try {
        await runtime.handleInbound({
          chatId: payload.chatId,
          userId: payload.userId,
          displayName: await resolveDisplayName(payload.userId),
          dedupKey: payload.dedupKey,
          text: payload.text,
          hasAttachments: payload.files.length > 0,
          loadAttachments: () => collectAttachments(payload.chatId, payload.files)
        });
      } catch (err) {
        console.error("[Slack] Failed to prepare inbound message:", err);
      }
    })();
  }
});
console.log("[Slack] Starting adapter...");
console.log(`[Slack] Server: ${config.serverUrl}`);
void (async () => {
  try {
    const identity = await api.authTest();
    botUserId = identity.userId || void 0;
    console.log(`[Slack] Authenticated as ${botUserId ?? "unknown bot user"}`);
  } catch (err) {
    console.error("[Slack] auth.test failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
  await socket.start();
})();
process.on("SIGINT", () => {
  console.log("[Slack] Shutting down...");
  socket.stop();
  bridge.destroy();
  dedup.destroy();
  process.exit(0);
});
//# sourceMappingURL=slack-PKLFTXC7.mjs.map
