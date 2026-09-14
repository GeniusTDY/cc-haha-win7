import { createRequire as __nodePortCreateRequire } from 'node:module';
import { fileURLToPath as __nodePortF2P } from 'node:url';
import { dirname as __nodePortDirname } from 'node:path';
var require = __nodePortCreateRequire(import.meta.url);
var __filename = __nodePortF2P(import.meta.url);
var __dirname = __nodePortDirname(__filename);
process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1";
import {
  loadSafeOutboundImage
} from "./chunk-4SGIIE47.mjs";
import {
  ImageBlockWatcher
} from "./chunk-HHCHKLDH.mjs";
import {
  MessageBuffer
} from "./chunk-UB2B24YT.mjs";
import {
  SessionSelectionController,
  enqueue,
  formatImHelp,
  formatImStatus,
  formatPermissionDecisionStatus,
  formatPermissionInstructions,
  formatPermissionRequest,
  getConfiguredWorkDir,
  isAllowedUser,
  parsePermissionCommand,
  restoreStoredSessionBinding,
  syncImPermissionState,
  tryPair
} from "./chunk-MUXOERMD.mjs";
import {
  init_define_MACRO
} from "./chunk-57T55QIK.mjs";

// adapters/common/attachment/mime.ts
init_define_MACRO();
var EXTENSION_TO_MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  heic: "image/heic",
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  json: "application/json",
  xml: "application/xml",
  yaml: "application/yaml",
  yml: "application/yaml",
  zip: "application/zip",
  gz: "application/gzip",
  tar: "application/x-tar",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  ogg: "audio/ogg",
  mp4: "video/mp4",
  mov: "video/quicktime"
};
var MIME_TO_EXTENSION = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
  "image/heic": "heic"
};
function inferMimeFromFileName(fileName) {
  const extension = fileName?.split(".").pop()?.toLowerCase();
  if (!extension || extension === fileName?.toLowerCase()) return void 0;
  return EXTENSION_TO_MIME[extension];
}
function imageExtensionForMime(mime) {
  if (!mime) return "png";
  return MIME_TO_EXTENSION[mime.split(";")[0].trim().toLowerCase()] ?? "png";
}
function attachmentKindForMime(mime) {
  return mime?.toLowerCase().startsWith("image/") ? "image" : "file";
}

// adapters/common/chat-runtime.ts
init_define_MACRO();
import * as path from "node:path";
var HELP_ALIASES = /* @__PURE__ */ new Set(["/help", "\u5E2E\u52A9"]);
var STATUS_ALIASES = /* @__PURE__ */ new Set(["/status", "\u72B6\u6001"]);
var PROJECTS_ALIASES = /* @__PURE__ */ new Set(["/projects", "\u9879\u76EE\u5217\u8868"]);
var NEW_ALIASES = /* @__PURE__ */ new Set(["/new", "\u65B0\u4F1A\u8BDD"]);
var STOP_ALIASES = /* @__PURE__ */ new Set(["/stop", "\u505C\u6B62"]);
var CLEAR_ALIASES = /* @__PURE__ */ new Set(["/clear", "\u6E05\u7A7A"]);
var ImChatRuntime = class {
  port;
  config;
  platformConfig;
  bridge;
  sessionStore;
  httpClient;
  defaultWorkDir;
  dedup;
  flushIntervalMs;
  flushCharThreshold;
  runtimeStates = /* @__PURE__ */ new Map();
  buffers = /* @__PURE__ */ new Map();
  responses = /* @__PURE__ */ new Map();
  pendingPermissions = /* @__PURE__ */ new Map();
  pendingProjectSelection = /* @__PURE__ */ new Set();
  imageWatchers = /* @__PURE__ */ new Map();
  sessionSelection;
  constructor(options) {
    this.port = options.port;
    this.config = options.config;
    this.platformConfig = options.platformConfig;
    this.bridge = options.bridge;
    this.sessionStore = options.sessionStore;
    this.httpClient = options.httpClient;
    this.defaultWorkDir = options.defaultWorkDir;
    this.dedup = options.dedup;
    this.flushIntervalMs = options.flushIntervalMs ?? 800;
    this.flushCharThreshold = options.flushCharThreshold ?? 320;
    this.sessionSelection = new SessionSelectionController({
      httpClient: this.httpClient,
      bridge: this.bridge,
      sessionStore: this.sessionStore,
      sendNotice: (chatId, text) => this.port.sendNotice(chatId, text),
      onServerMessage: (chatId, message) => this.handleServerMessage(chatId, message),
      clearTransientState: (chatId) => this.clearTransientChatState(chatId),
      clearProjectSelection: (chatId) => {
        this.pendingProjectSelection.delete(chatId);
      },
      isBusy: (chatId) => this.getRuntimeState(chatId).state !== "idle" || Boolean(this.pendingPermissions.get(chatId)?.size)
    });
  }
  /** The work dir a `/new` with no argument would use. Exposed for adapters
   *  that print it at startup. */
  get configuredWorkDir() {
    return this.defaultWorkDir || getConfiguredWorkDir(this.config, this.platformConfig);
  }
  // ---------- inbound ----------
  /**
   * Full inbound pipeline for one user message.
   *
   * Work runs on the per-chat FIFO so two fast messages cannot interleave
   * their session mutations. The returned promise settles when this message
   * has been handled; adapters normally ignore it, tests await it.
   */
  handleInbound(message) {
    const { chatId, dedupKey } = message;
    if (!chatId) return Promise.resolve();
    if (dedupKey && !this.dedup.tryRecord(`${this.port.platform}:${dedupKey}`)) {
      return Promise.resolve();
    }
    const text = message.text.trim();
    const hasAttachments = message.hasAttachments ?? ((message.attachments?.length ?? 0) > 0 || Boolean(message.loadAttachments));
    if (!text && !hasAttachments) return Promise.resolve();
    return enqueue(chatId, async () => {
      try {
        await this.routeInbound({ ...message, text }, hasAttachments);
      } catch (err) {
        this.port.setBusy?.(chatId, false);
        const detail = err instanceof Error ? err.message : String(err);
        console.error(`${this.port.logPrefix} Failed to handle message for ${chatId}:`, err);
        await this.notifySafely(chatId, `\u5904\u7406\u6D88\u606F\u5931\u8D25\uFF1A${detail}`);
      }
    });
  }
  async routeInbound(message, hasAttachments) {
    const { chatId, userId, displayName, text } = message;
    if (!isAllowedUser(this.port.platform, userId)) {
      const paired = text ? tryPair(text, { userId, displayName }, this.port.platform) : false;
      await this.port.sendNotice(
        chatId,
        paired ? "\u914D\u5BF9\u6210\u529F\uFF01\u73B0\u5728\u53EF\u4EE5\u5F00\u59CB\u804A\u5929\u4E86\u3002\n\n\u53D1\u9001\u6D88\u606F\u5373\u53EF\u4E0E Claude \u5BF9\u8BDD\uFF0C\u53D1\u9001 /help \u67E5\u770B\u53EF\u7528\u547D\u4EE4\u3002" : "\u672A\u6388\u6743\u3002\u8BF7\u5728 Claude Code \u684C\u9762\u7AEF\u751F\u6210\u914D\u5BF9\u7801\u540E\u53D1\u9001\u7ED9\u6211\u3002"
      );
      return;
    }
    if (!hasAttachments && await this.tryHandleCommand(chatId, text)) return;
    const decision = hasAttachments ? null : parsePermissionCommand(text, this.pendingPermissions.get(chatId));
    if (decision) {
      await this.applyPermissionDecision(chatId, decision);
      return;
    }
    if (!hasAttachments && await this.sessionSelection.handleInput(chatId, text)) return;
    if (!hasAttachments && this.pendingProjectSelection.has(chatId)) {
      if (text) await this.startNewSession(chatId, text);
      return;
    }
    const ready = await this.ensureSession(chatId);
    if (!ready) return;
    const attachments = message.attachments ?? (message.loadAttachments ? await message.loadAttachments() : []);
    const effective = text || (attachments.length > 0 ? "(\u7528\u6237\u53D1\u9001\u4E86\u9644\u4EF6)" : "");
    if (!effective && attachments.length === 0) return;
    this.port.setBusy?.(chatId, true);
    this.getRuntimeState(chatId).state = "thinking";
    const sent = this.bridge.sendUserMessage(
      chatId,
      effective,
      attachments.length > 0 ? attachments : void 0
    );
    if (!sent) {
      this.port.setBusy?.(chatId, false);
      this.getRuntimeState(chatId).state = "idle";
      await this.port.sendNotice(chatId, "\u6D88\u606F\u53D1\u9001\u5931\u8D25\uFF0C\u8FDE\u63A5\u53EF\u80FD\u5DF2\u65AD\u5F00\u3002\u8BF7\u53D1\u9001 /new \u91CD\u65B0\u5F00\u59CB\u3002");
    }
  }
  /** Returns true when `text` was a command and has been fully handled. */
  async tryHandleCommand(chatId, text) {
    if (HELP_ALIASES.has(text)) {
      await this.port.sendNotice(chatId, formatImHelp());
      return true;
    }
    if (STATUS_ALIASES.has(text)) {
      await this.port.sendNotice(chatId, await this.buildStatusText(chatId));
      return true;
    }
    if (PROJECTS_ALIASES.has(text)) {
      await this.showProjectPicker(chatId);
      return true;
    }
    if (NEW_ALIASES.has(text) || text.startsWith("/new ") || text.startsWith("\u65B0\u4F1A\u8BDD ")) {
      const arg = text.startsWith("/new ") ? text.slice("/new ".length).trim() : text.startsWith("\u65B0\u4F1A\u8BDD ") ? text.slice("\u65B0\u4F1A\u8BDD ".length).trim() : "";
      await this.startNewSession(chatId, arg || void 0);
      return true;
    }
    if (STOP_ALIASES.has(text)) {
      const stored = await this.ensureExistingSession(chatId);
      if (!stored) {
        await this.port.sendNotice(chatId, formatImStatus(null));
        return true;
      }
      this.bridge.sendStopGeneration(chatId);
      await this.port.sendNotice(chatId, "\u5DF2\u53D1\u9001\u505C\u6B62\u4FE1\u53F7\u3002");
      return true;
    }
    if (CLEAR_ALIASES.has(text)) {
      const stored = await this.ensureExistingSession(chatId);
      if (!stored) {
        await this.port.sendNotice(chatId, formatImStatus(null));
        return true;
      }
      this.clearTransientChatState(chatId);
      const sent = this.bridge.sendUserMessage(chatId, "/clear");
      if (sent) this.getRuntimeState(chatId).state = "thinking";
      await this.port.sendNotice(
        chatId,
        sent ? "\u5DF2\u6E05\u7A7A\u5F53\u524D\u4F1A\u8BDD\u4E0A\u4E0B\u6587\u3002" : "\u65E0\u6CD5\u53D1\u9001 /clear\uFF0C\u8BF7\u5148\u53D1\u9001 /new \u91CD\u65B0\u8FDE\u63A5\u4F1A\u8BDD\u3002"
      );
      return true;
    }
    return false;
  }
  async applyPermissionDecision(chatId, decision) {
    const pending = this.pendingPermissions.get(chatId);
    if (!pending?.has(decision.requestId)) {
      await this.port.sendNotice(chatId, `\u672A\u627E\u5230\u5F85\u786E\u8BA4\u7684\u6743\u9650\u8BF7\u6C42\uFF1A${decision.requestId}`);
      return;
    }
    const sent = this.bridge.sendPermissionResponse(
      chatId,
      decision.requestId,
      decision.allowed,
      decision.rule
    );
    if (sent) {
      pending.delete(decision.requestId);
      const runtime = this.getRuntimeState(chatId);
      runtime.pendingPermissionCount = Math.max(0, runtime.pendingPermissionCount - 1);
    }
    await this.port.sendNotice(
      chatId,
      sent ? `${formatPermissionDecisionStatus(decision)}\u3002` : "\u6743\u9650\u54CD\u5E94\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u4F1A\u8BDD\u72B6\u6001\u3002"
    );
  }
  // ---------- server stream ----------
  async handleServerMessage(chatId, msg) {
    const runtime = this.getRuntimeState(chatId);
    if (syncImPermissionState(chatId, msg, runtime, this.pendingPermissions)) return;
    switch (msg.type) {
      case "connected":
        break;
      case "status":
        runtime.state = msg.state;
        runtime.verb = typeof msg.verb === "string" ? msg.verb : void 0;
        if (msg.state === "thinking" || msg.state === "tool_executing") {
          this.port.setBusy?.(chatId, true);
        } else if (msg.state === "idle") {
          this.port.setBusy?.(chatId, false);
        }
        break;
      case "content_start":
        if (msg.blockType === "text") {
          runtime.state = "streaming";
        } else if (msg.blockType === "tool_use") {
          runtime.state = "tool_executing";
          runtime.verb = typeof msg.toolName === "string" ? msg.toolName : runtime.verb;
          this.port.setBusy?.(chatId, true);
        }
        break;
      case "content_delta":
        if (typeof msg.text === "string" && msg.text) {
          this.getBuffer(chatId).append(msg.text);
          if (this.port.sendImage) {
            for (const pending of this.getImageWatcher(chatId).feed(msg.text)) {
              void this.dispatchOutboundImage(chatId, pending);
            }
          }
        }
        break;
      case "tool_use_complete":
        runtime.state = "tool_executing";
        runtime.verb = typeof msg.toolName === "string" ? msg.toolName : runtime.verb;
        this.port.setBusy?.(chatId, true);
        break;
      case "tool_result":
        runtime.state = "thinking";
        runtime.verb = void 0;
        this.port.setBusy?.(chatId, true);
        break;
      case "permission_request": {
        runtime.pendingPermissionCount += 1;
        runtime.state = "permission_pending";
        let pending = this.pendingPermissions.get(chatId);
        if (!pending) {
          pending = /* @__PURE__ */ new Set();
          this.pendingPermissions.set(chatId, pending);
        }
        pending.add(msg.requestId);
        this.port.setBusy?.(chatId, false);
        await this.finishResponse(chatId);
        await this.port.sendNotice(
          chatId,
          `${formatPermissionRequest(msg.toolName, msg.input, msg.requestId)}

${formatPermissionInstructions(msg.requestId)}`
        );
        break;
      }
      case "message_complete":
        runtime.state = "idle";
        runtime.verb = void 0;
        this.port.setBusy?.(chatId, false);
        await this.finishResponse(chatId);
        break;
      case "error": {
        runtime.state = "idle";
        runtime.verb = void 0;
        this.port.setBusy?.(chatId, false);
        this.buffers.get(chatId)?.reset();
        this.buffers.delete(chatId);
        await this.finishResponse(chatId, { discardBuffer: true });
        await this.handleServerError(chatId, msg);
        break;
      }
      case "system_notification":
        if (msg.subtype === "init" && msg.data && typeof msg.data === "object") {
          const model = msg.data.model;
          if (typeof model === "string" && model.trim()) runtime.model = model;
        }
        break;
    }
  }
  async handleServerError(chatId, msg) {
    if (typeof msg.message === "string" && /Invalid.*signature.*thinking/i.test(msg.message)) {
      const stored = this.sessionStore.get(chatId);
      const workDir = stored?.workDir || this.defaultWorkDir;
      if (workDir) {
        await this.port.sendNotice(chatId, "\u4F1A\u8BDD\u4E0A\u4E0B\u6587\u5DF2\u5931\u6548\uFF0C\u6B63\u5728\u81EA\u52A8\u91CD\u5EFA...");
        this.clearTransientChatState(chatId);
        this.bridge.resetSession(chatId);
        this.sessionStore.delete(chatId);
        const ok = await this.createSessionForChat(chatId, workDir);
        await this.port.sendNotice(
          chatId,
          ok ? "\u5DF2\u91CD\u5EFA\u4F1A\u8BDD\uFF0C\u8BF7\u91CD\u65B0\u53D1\u9001\u6D88\u606F\u3002" : "\u91CD\u5EFA\u4F1A\u8BDD\u5931\u8D25\uFF0C\u8BF7\u53D1\u9001 /new \u624B\u52A8\u65B0\u5EFA\u3002"
        );
        return;
      }
      await this.port.sendNotice(chatId, "\u4F1A\u8BDD\u4E0A\u4E0B\u6587\u5DF2\u5931\u6548\uFF0C\u8BF7\u53D1\u9001 /new \u65B0\u5EFA\u4F1A\u8BDD\u3002");
      return;
    }
    await this.port.sendNotice(chatId, `\u9519\u8BEF: ${msg.message}`);
  }
  async dispatchOutboundImage(chatId, pending) {
    const send = this.port.sendImage;
    if (!send) return;
    try {
      const loaded = await loadSafeOutboundImage(pending, this.sessionStore.get(chatId)?.workDir);
      if (!loaded.ok) {
        console.warn(`${this.port.logPrefix} Outbound image rejected:`, loaded.reason);
        return;
      }
      await send.call(this.port, chatId, {
        buffer: loaded.buffer,
        mime: loaded.mime,
        alt: pending.alt
      });
    } catch (err) {
      console.error(
        `${this.port.logPrefix} dispatchOutboundImage failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }
  // ---------- sessions ----------
  async ensureExistingSession(chatId) {
    return await restoreStoredSessionBinding({
      chatId,
      bridge: this.bridge,
      sessionStore: this.sessionStore,
      httpClient: this.httpClient,
      onServerMessage: (msg) => this.handleServerMessage(chatId, msg),
      logPrefix: this.port.logPrefix,
      clearTransientState: () => this.clearTransientChatState(chatId)
    });
  }
  async ensureSession(chatId) {
    const stored = await this.ensureExistingSession(chatId);
    if (stored) return true;
    if (this.defaultWorkDir) {
      return await this.createSessionForChat(chatId, this.defaultWorkDir);
    }
    await this.showProjectPicker(chatId);
    return false;
  }
  async createSessionForChat(chatId, workDir) {
    try {
      this.bridge.resetSession(chatId);
      this.clearTransientChatState(chatId);
      const sessionId = await this.httpClient.createSession(workDir);
      this.sessionStore.set(chatId, sessionId, workDir);
      this.bridge.connectSession(chatId, sessionId);
      this.bridge.onServerMessage(chatId, (msg) => this.handleServerMessage(chatId, msg));
      const opened = await this.bridge.waitForOpen(chatId);
      if (!opened) {
        await this.port.sendNotice(chatId, "\u8FDE\u63A5\u670D\u52A1\u5668\u8D85\u65F6\uFF0C\u8BF7\u91CD\u8BD5\u3002");
        return false;
      }
      return true;
    } catch (err) {
      await this.port.sendNotice(
        chatId,
        `\u65E0\u6CD5\u521B\u5EFA\u4F1A\u8BDD: ${err instanceof Error ? err.message : String(err)}`
      );
      return false;
    }
  }
  async showProjectPicker(chatId) {
    this.sessionSelection.clear(chatId);
    try {
      const projects = await this.httpClient.listRecentProjects();
      if (projects.length === 0) {
        await this.port.sendNotice(
          chatId,
          `\u6CA1\u6709\u627E\u5230\u6700\u8FD1\u7684\u9879\u76EE\u3002\u53D1\u9001 /new \u4F1A\u4F7F\u7528\u9ED8\u8BA4\u5DE5\u4F5C\u76EE\u5F55\uFF1A${this.defaultWorkDir}
\u4E5F\u53EF\u4EE5\u53D1\u9001 /new /path/to/project \u6307\u5B9A\u9879\u76EE\u3002`
        );
        return;
      }
      const lines = projects.slice(0, 10).map(
        (project, index) => `${index + 1}. ${project.projectName}${project.branch ? ` (${project.branch})` : ""}
   ${project.realPath}`
      );
      this.pendingProjectSelection.add(chatId);
      await this.port.sendNotice(
        chatId,
        `\u9009\u62E9\u9879\u76EE\uFF08\u56DE\u590D\u7F16\u53F7\uFF09\uFF1A

${lines.join("\n\n")}

\u4E0B\u6B21\u53EF\u76F4\u63A5 /new <\u7F16\u53F7\u3001\u540D\u79F0\u6216\u7EDD\u5BF9\u8DEF\u5F84> \u5FEB\u901F\u65B0\u5EFA\u4F1A\u8BDD`
      );
    } catch (err) {
      await this.port.sendNotice(
        chatId,
        `\u65E0\u6CD5\u83B7\u53D6\u9879\u76EE\u5217\u8868: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
  async startNewSession(chatId, query) {
    this.sessionSelection.clear(chatId);
    this.bridge.resetSession(chatId);
    this.sessionStore.delete(chatId);
    this.clearTransientChatState(chatId);
    this.pendingProjectSelection.delete(chatId);
    if (!query) {
      if (this.defaultWorkDir) {
        const ok = await this.createSessionForChat(chatId, this.defaultWorkDir);
        if (ok) await this.port.sendNotice(chatId, "\u5DF2\u65B0\u5EFA\u4F1A\u8BDD\uFF0C\u53EF\u4EE5\u5F00\u59CB\u5BF9\u8BDD\u4E86\u3002");
      } else {
        await this.showProjectPicker(chatId);
      }
      return;
    }
    try {
      const { project, ambiguous } = await this.httpClient.matchProject(query);
      if (project) {
        const ok = await this.createSessionForChat(chatId, project.realPath);
        if (ok) {
          await this.port.sendNotice(
            chatId,
            `\u5DF2\u65B0\u5EFA\u4F1A\u8BDD\uFF1A${project.projectName}${project.branch ? ` (${project.branch})` : ""}`
          );
        }
        return;
      }
      if (ambiguous) {
        const list = ambiguous.map((p, i) => `${i + 1}. ${p.projectName} - ${p.realPath}`).join("\n");
        await this.port.sendNotice(chatId, `\u5339\u914D\u5230\u591A\u4E2A\u9879\u76EE\uFF0C\u8BF7\u66F4\u7CBE\u786E\uFF1A

${list}`);
        return;
      }
      await this.port.sendNotice(
        chatId,
        `\u672A\u627E\u5230\u5339\u914D "${query}" \u7684\u9879\u76EE\u3002\u53D1\u9001 /projects \u67E5\u770B\u5B8C\u6574\u5217\u8868\u3002`
      );
    } catch (err) {
      await this.port.sendNotice(chatId, err instanceof Error ? err.message : String(err));
    }
  }
  async buildStatusText(chatId) {
    const stored = await this.ensureExistingSession(chatId);
    if (!stored) return formatImStatus(null);
    const runtime = this.getRuntimeState(chatId);
    let projectName = path.basename(stored.workDir) || stored.workDir;
    let branch = null;
    try {
      const gitInfo = await this.httpClient.getGitInfo(stored.sessionId);
      projectName = gitInfo.repoName || path.basename(gitInfo.workDir) || projectName;
      branch = gitInfo.branch;
    } catch {
    }
    let taskCounts;
    try {
      const tasks = await this.httpClient.getTasksForSession(stored.sessionId);
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
  // ---------- per-chat state ----------
  getRuntimeState(chatId) {
    let state = this.runtimeStates.get(chatId);
    if (!state) {
      state = { state: "idle", pendingPermissionCount: 0 };
      this.runtimeStates.set(chatId, state);
    }
    return state;
  }
  clearTransientChatState(chatId) {
    this.buffers.get(chatId)?.reset();
    this.buffers.delete(chatId);
    this.closeResponse(chatId);
    this.pendingPermissions.delete(chatId);
    this.imageWatchers.delete(chatId);
    this.port.setBusy?.(chatId, false);
    this.port.clearChat?.(chatId);
    const runtime = this.getRuntimeState(chatId);
    runtime.state = "idle";
    runtime.verb = void 0;
    runtime.pendingPermissionCount = 0;
  }
  getBuffer(chatId) {
    let buffer = this.buffers.get(chatId);
    if (!buffer) {
      buffer = new MessageBuffer(
        async (text) => {
          if (!text) return;
          await this.getResponse(chatId).append(text);
        },
        this.flushIntervalMs,
        this.flushCharThreshold
      );
      this.buffers.set(chatId, buffer);
    }
    return buffer;
  }
  getResponse(chatId) {
    let response = this.responses.get(chatId);
    if (!response) {
      response = this.port.createResponse(chatId);
      this.responses.set(chatId, response);
    }
    return response;
  }
  getImageWatcher(chatId) {
    let watcher = this.imageWatchers.get(chatId);
    if (!watcher) {
      watcher = new ImageBlockWatcher();
      this.imageWatchers.set(chatId, watcher);
    }
    return watcher;
  }
  /** Flush what is buffered and close the turn's presentation, if any. */
  async finishResponse(chatId, options = {}) {
    if (options.discardBuffer) {
      this.buffers.get(chatId)?.reset();
    } else {
      await this.buffers.get(chatId)?.complete();
    }
    this.buffers.delete(chatId);
    await this.closeResponse(chatId);
  }
  /**
   * Close the turn's presentation exactly once, if one is open.
   *
   * Returns a promise so `finishResponse` can await it, but callers on the
   * synchronous teardown path may ignore it: the failure mode we care about is
   * a stream that is never closed at all, not one closed a tick late.
   */
  closeResponse(chatId) {
    const response = this.responses.get(chatId);
    if (!response) return Promise.resolve();
    this.responses.delete(chatId);
    return Promise.resolve().then(() => response.finish()).catch((err) => {
      console.error(
        `${this.port.logPrefix} Failed to finish response:`,
        err instanceof Error ? err.message : err
      );
    });
  }
  async notifySafely(chatId, text) {
    try {
      await this.port.sendNotice(chatId, text);
    } catch (err) {
      console.error(
        `${this.port.logPrefix} Failed to deliver notice:`,
        err instanceof Error ? err.message : err
      );
    }
  }
};

export {
  inferMimeFromFileName,
  imageExtensionForMime,
  attachmentKindForMime,
  ImChatRuntime
};
//# sourceMappingURL=chunk-Z5I3QG2P.mjs.map
