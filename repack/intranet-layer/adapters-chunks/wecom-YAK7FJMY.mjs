import { createRequire as __nodePortCreateRequire } from 'node:module';
import { fileURLToPath as __nodePortF2P } from 'node:url';
import { dirname as __nodePortDirname } from 'node:path';
var require = __nodePortCreateRequire(import.meta.url);
var __filename = __nodePortF2P(import.meta.url);
var __dirname = __nodePortDirname(__filename);
process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1";
import {
  require_eventemitter3
} from "./chunk-SKAMWS64.mjs";
import {
  ImChatRuntime,
  attachmentKindForMime,
  imageExtensionForMime,
  inferMimeFromFileName
} from "./chunk-Z5I3QG2P.mjs";
import {
  require_axios,
  require_ws
} from "./chunk-OSDYKW2Z.mjs";
import "./chunk-4SGIIE47.mjs";
import "./chunk-HHCHKLDH.mjs";
import "./chunk-QRSWXWBH.mjs";
import "./chunk-UB2B24YT.mjs";
import {
  AttachmentStore,
  MessageDedup,
  SessionStore,
  WsBridge,
  checkAttachmentLimit,
  createAdapterClient,
  loadConfig,
  splitMessageByBytes,
  utf8Length
} from "./chunk-MUXOERMD.mjs";
import "./chunk-HEGWJCBF.mjs";
import {
  __commonJS,
  __require,
  __toESM,
  init_define_MACRO
} from "./chunk-57T55QIK.mjs";

// adapters/node_modules/@wecom/aibot-node-sdk/dist/index.cjs.js
var require_index_cjs = __commonJS({
  "adapters/node_modules/@wecom/aibot-node-sdk/dist/index.cjs.js"(exports) {
    "use strict";
    init_define_MACRO();
    Object.defineProperty(exports, "__esModule", { value: true });
    var eventemitter3 = require_eventemitter3();
    var crypto2 = __require("crypto");
    var axios = require_axios();
    var WebSocket = require_ws();
    var crypto$1 = __require("node:crypto");
    var WSAuthFailureError = class extends Error {
      constructor(maxAttempts) {
        super(`Max auth failure attempts exceeded (${maxAttempts})`);
        this.code = "WS_AUTH_FAILURE_EXHAUSTED";
        this.name = "WSAuthFailureError";
      }
    };
    var WSReconnectExhaustedError = class extends Error {
      constructor(maxAttempts) {
        super(`Max reconnect attempts exceeded (${maxAttempts})`);
        this.code = "WS_RECONNECT_EXHAUSTED";
        this.name = "WSReconnectExhaustedError";
      }
    };
    exports.MessageType = void 0;
    (function(MessageType) {
      MessageType["Text"] = "text";
      MessageType["Image"] = "image";
      MessageType["Mixed"] = "mixed";
      MessageType["Voice"] = "voice";
      MessageType["File"] = "file";
      MessageType["Video"] = "video";
    })(exports.MessageType || (exports.MessageType = {}));
    var WsCmd = {
      SUBSCRIBE: "aibot_subscribe",
      HEARTBEAT: "ping",
      RESPONSE: "aibot_respond_msg",
      RESPONSE_WELCOME: "aibot_respond_welcome_msg",
      RESPONSE_UPDATE: "aibot_respond_update_msg",
      SEND_MSG: "aibot_send_msg",
      UPLOAD_MEDIA_INIT: "aibot_upload_media_init",
      UPLOAD_MEDIA_CHUNK: "aibot_upload_media_chunk",
      UPLOAD_MEDIA_FINISH: "aibot_upload_media_finish",
      CALLBACK: "aibot_msg_callback",
      EVENT_CALLBACK: "aibot_event_callback"
    };
    exports.TemplateCardType = void 0;
    (function(TemplateCardType) {
      TemplateCardType["TextNotice"] = "text_notice";
      TemplateCardType["NewsNotice"] = "news_notice";
      TemplateCardType["ButtonInteraction"] = "button_interaction";
      TemplateCardType["VoteInteraction"] = "vote_interaction";
      TemplateCardType["MultipleInteraction"] = "multiple_interaction";
    })(exports.TemplateCardType || (exports.TemplateCardType = {}));
    exports.EventType = void 0;
    (function(EventType) {
      EventType["EnterChat"] = "enter_chat";
      EventType["TemplateCardEvent"] = "template_card_event";
      EventType["FeedbackEvent"] = "feedback_event";
      EventType["Disconnected"] = "disconnected_event";
    })(exports.EventType || (exports.EventType = {}));
    var WeComApiClient = class {
      constructor(logger, timeout = 1e4) {
        this.logger = logger;
        this.httpClient = axios.create({
          timeout,
          headers: {
            "Content-Type": "application/json"
          }
        });
      }
      async downloadFileRaw(url) {
        this.logger.info("Downloading file...");
        try {
          const response = await this.httpClient.get(url, {
            responseType: "arraybuffer"
          });
          const contentDisposition = response.headers["content-disposition"];
          let filename;
          if (contentDisposition) {
            const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;\s]+)/i);
            if (utf8Match) {
              filename = decodeURIComponent(utf8Match[1]);
            } else {
              const match = contentDisposition.match(/filename="?([^";\s]+)"?/i);
              if (match) {
                filename = decodeURIComponent(match[1]);
              }
            }
          }
          this.logger.info("File downloaded successfully");
          return { buffer: Buffer.from(response.data), filename };
        } catch (error) {
          this.logger.error("File download failed:", error.message);
          throw error;
        }
      }
    };
    function generateRandomString(length = 8) {
      return crypto2.randomBytes(Math.ceil(length / 2)).toString("hex").substring(0, length);
    }
    function generateReqId(prefix) {
      const timestamp = Date.now();
      const random = generateRandomString();
      return `${prefix}_${timestamp}_${random}`;
    }
    var DEFAULT_WS_URL = "wss://openws.work.weixin.qq.com";
    var WsConnectionManager = class {
      constructor(logger, heartbeatInterval = 3e4, reconnectBaseDelay = 1e3, maxReconnectAttempts = 10, wsUrl, wsOptions, maxReplyQueueSize, maxAuthFailureAttempts) {
        this.ws = null;
        this.heartbeatTimer = null;
        this.reconnectAttempts = 0;
        this.authFailureAttempts = 0;
        this.isManualClose = false;
        this.lastCloseWasAuthFailure = false;
        this.botId = "";
        this.botSecret = "";
        this.extraAuthParams = {};
        this.missedPongCount = 0;
        this.maxMissedPong = 2;
        this.reconnectBaseDelay = 1e3;
        this.reconnectMaxDelay = 3e4;
        this.reconnectTimer = null;
        this.replyQueues = /* @__PURE__ */ new Map();
        this.pendingAcks = /* @__PURE__ */ new Map();
        this.pendingAckSeq = 0;
        this.replyAckTimeout = 5e3;
        this.maxReplyQueueSize = 500;
        this.onConnected = null;
        this.onAuthenticated = null;
        this.onDisconnected = null;
        this.onMessage = null;
        this.onReconnecting = null;
        this.onError = null;
        this.onServerDisconnect = null;
        this.logger = logger;
        this.heartbeatInterval = heartbeatInterval;
        this.reconnectBaseDelay = reconnectBaseDelay;
        this.maxReconnectAttempts = maxReconnectAttempts;
        this.maxAuthFailureAttempts = maxAuthFailureAttempts ?? 5;
        this.wsUrl = wsUrl || DEFAULT_WS_URL;
        this.wsOptions = wsOptions || {};
        if (maxReplyQueueSize !== void 0) {
          this.maxReplyQueueSize = maxReplyQueueSize;
        }
      }
      setCredentials(botId, botSecret, extraAuthParams) {
        this.botId = botId;
        this.botSecret = botSecret;
        this.extraAuthParams = extraAuthParams || {};
      }
      connect() {
        this.isManualClose = false;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        if (this.ws) {
          this.ws.removeAllListeners();
          this.ws.terminate();
          this.ws = null;
        }
        this.logger.info(`Connecting to WebSocket: ${this.wsUrl}...`);
        try {
          this.ws = new WebSocket(this.wsUrl, this.wsOptions);
          this.setupEventHandlers();
        } catch (error) {
          this.logger.error("Failed to create WebSocket connection:", error.message);
          this.onError?.(error);
          this.scheduleReconnect();
        }
      }
      setupEventHandlers() {
        if (!this.ws)
          return;
        this.ws.on("open", () => {
          this.logger.info("WebSocket connection established, sending auth...");
          this.missedPongCount = 0;
          this.lastCloseWasAuthFailure = false;
          this.sendAuth();
          this.onConnected?.();
        });
        this.ws.on("message", (data) => {
          try {
            const raw = data.toString().replace(/[\x00-\x08\x0B-\x0D\x0E-\x1F]/g, "");
            const frame = JSON.parse(raw);
            this.handleFrame(frame);
          } catch (error) {
            this.logger.error("Failed to parse WebSocket message:", error.message);
          }
        });
        this.ws.on("close", (code, reason) => {
          const reasonStr = reason.toString() || `code: ${code}`;
          this.logger.warn(`WebSocket connection closed: ${reasonStr}`);
          this.stopHeartbeat();
          this.clearPendingMessages(`WebSocket connection closed (${reasonStr})`);
          this.onDisconnected?.(reasonStr);
          this.ws = null;
          if (!this.isManualClose) {
            this.scheduleReconnect();
          }
        });
        this.ws.on("error", (error) => {
          this.logger.error("WebSocket error:", error.message);
          this.onError?.(error);
        });
        this.ws.on("ping", () => {
          this.ws?.pong();
        });
      }
      sendAuth() {
        try {
          this.send({
            cmd: WsCmd.SUBSCRIBE,
            headers: { req_id: generateReqId(WsCmd.SUBSCRIBE) },
            body: {
              bot_id: this.botId,
              secret: this.botSecret,
              ...this.extraAuthParams
            }
          });
          this.logger.info("Auth frame sent");
        } catch (error) {
          this.logger.error("Failed to send auth frame:", error.message);
        }
      }
      handleFrame(frame) {
        const cmd = frame.cmd || "";
        const reqId = frame.headers?.req_id || "";
        if (frame.cmd === WsCmd.CALLBACK) {
          this.logger.debug(`[server -> plugin] cmd=${cmd}, reqId=${reqId}, body=${JSON.stringify(frame.body)}`);
          this.onMessage?.(frame);
          return;
        }
        if (frame.cmd === WsCmd.EVENT_CALLBACK) {
          this.logger.debug(`[server -> plugin] cmd=${cmd}, reqId=${reqId}, body=${JSON.stringify(frame.body)}`);
          if (frame.body?.event?.eventtype === "disconnected_event") {
            this.logger.warn("Received disconnected_event: a new connection has been established, this connection will be closed by server");
            this.onMessage?.(frame);
            this.stopHeartbeat();
            this.clearPendingMessages("Server disconnected due to new connection");
            this.isManualClose = true;
            this.onServerDisconnect?.("New connection established, server disconnected this connection");
            if (this.ws) {
              this.ws.removeAllListeners();
              this.ws.terminate();
              this.ws = null;
            }
            return;
          }
          this.onMessage?.(frame);
          return;
        }
        const actualReqId = frame.headers?.req_id || "";
        if (actualReqId.startsWith(WsCmd.SUBSCRIBE)) {
          if (frame.errcode !== 0) {
            this.logger.error(`Authentication failed: errcode=${frame.errcode}, errmsg=${frame.errmsg}`);
            this.onError?.(new Error(`Authentication failed: ${frame.errmsg} (code: ${frame.errcode})`));
            this.lastCloseWasAuthFailure = true;
            if (this.ws) {
              this.ws.terminate();
            }
            return;
          }
          this.logger.info("Authentication successful");
          this.reconnectAttempts = 0;
          this.authFailureAttempts = 0;
          this.startHeartbeat();
          this.onAuthenticated?.();
          return;
        }
        if (actualReqId.startsWith(WsCmd.HEARTBEAT)) {
          if (frame.errcode !== 0) {
            this.logger.warn(`Heartbeat ack error: errcode=${frame.errcode}, errmsg=${frame.errmsg}`);
            return;
          }
          this.missedPongCount = 0;
          return;
        }
        if (this.pendingAcks.has(actualReqId)) {
          this.handleReplyAck(actualReqId, frame);
          return;
        }
        this.logger.warn("Received unknown frame (ignored):", JSON.stringify(frame));
      }
      startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
          this.sendHeartbeat();
        }, this.heartbeatInterval);
        this.logger.debug(`Heartbeat timer started, interval: ${this.heartbeatInterval}ms`);
      }
      stopHeartbeat() {
        if (this.heartbeatTimer) {
          clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = null;
          this.logger.debug("Heartbeat timer stopped");
        }
      }
      sendHeartbeat() {
        if (this.missedPongCount >= this.maxMissedPong) {
          this.logger.warn(`No heartbeat ack received for ${this.missedPongCount} consecutive pings, connection considered dead`);
          this.stopHeartbeat();
          if (this.ws) {
            this.ws.terminate();
          }
          return;
        }
        this.missedPongCount++;
        try {
          this.send({
            cmd: WsCmd.HEARTBEAT,
            headers: { req_id: generateReqId(WsCmd.HEARTBEAT) }
          });
        } catch (error) {
          this.logger.error("Failed to send heartbeat:", error.message);
        }
      }
      scheduleReconnect() {
        if (this.lastCloseWasAuthFailure) {
          if (this.maxAuthFailureAttempts !== -1 && this.authFailureAttempts >= this.maxAuthFailureAttempts) {
            this.logger.error(`Max auth failure attempts reached (${this.maxAuthFailureAttempts}), giving up`);
            this.onError?.(new WSAuthFailureError(this.maxAuthFailureAttempts));
            return;
          }
          this.authFailureAttempts++;
          const delay = Math.min(this.reconnectBaseDelay * Math.pow(2, this.authFailureAttempts - 1), this.reconnectMaxDelay);
          this.logger.info(`Auth failed, reconnecting in ${delay}ms (auth attempt ${this.authFailureAttempts}/${this.maxAuthFailureAttempts})...`);
          this.onReconnecting?.(this.authFailureAttempts);
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.isManualClose)
              return;
            this.connect();
          }, delay);
        } else {
          if (this.maxReconnectAttempts !== -1 && this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.logger.error(`Max reconnect attempts reached (${this.maxReconnectAttempts}), giving up`);
            this.onError?.(new WSReconnectExhaustedError(this.maxReconnectAttempts));
            return;
          }
          this.reconnectAttempts++;
          const delay = Math.min(this.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts - 1), this.reconnectMaxDelay);
          this.logger.info(`Connection lost, reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          this.onReconnecting?.(this.reconnectAttempts);
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.isManualClose)
              return;
            this.connect();
          }, delay);
        }
      }
      send(frame) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const data = JSON.stringify(frame);
          this.ws.send(data);
        } else {
          throw new Error("WebSocket not connected, unable to send data");
        }
      }
      sendReply(reqId, body, cmd = WsCmd.RESPONSE) {
        return new Promise((resolve, reject) => {
          const frame = {
            cmd,
            headers: { req_id: reqId },
            body
          };
          const item = { frame, resolve, reject };
          if (!this.replyQueues.has(reqId)) {
            this.replyQueues.set(reqId, []);
          }
          const queue = this.replyQueues.get(reqId);
          if (queue.length >= this.maxReplyQueueSize) {
            this.logger.warn(`Reply queue for reqId ${reqId} exceeds max size (${this.maxReplyQueueSize}), rejecting new message`);
            reject(new Error(`Reply queue for reqId ${reqId} exceeds max size (${this.maxReplyQueueSize})`));
            return;
          }
          queue.push(item);
          if (queue.length === 1) {
            this.processReplyQueue(reqId);
          }
        });
      }
      processReplyQueue(reqId) {
        const queue = this.replyQueues.get(reqId);
        if (!queue || queue.length === 0) {
          this.replyQueues.delete(reqId);
          return;
        }
        const item = queue[0];
        try {
          this.send(item.frame);
          this.logger.debug(`Reply message sent via WebSocket, reqId: ${reqId}, queue length: ${queue.length}`);
        } catch (error) {
          this.logger.error(`Failed to send reply for reqId ${reqId}:`, error.message);
          queue.shift();
          item.reject(error);
          queueMicrotask(() => this.processReplyQueue(reqId));
          return;
        }
        const seq = ++this.pendingAckSeq;
        const timer = setTimeout(() => {
          const currentPending = this.pendingAcks.get(reqId);
          if (!currentPending || currentPending.seq !== seq) {
            return;
          }
          this.logger.warn(`Reply ack timeout (${this.replyAckTimeout}ms) for reqId: ${reqId}`);
          this.pendingAcks.delete(reqId);
          queue.shift();
          item.reject(new Error(`Reply ack timeout (${this.replyAckTimeout}ms) for reqId: ${reqId}`));
          this.processReplyQueue(reqId);
        }, this.replyAckTimeout);
        this.pendingAcks.set(reqId, {
          resolve: item.resolve,
          reject: item.reject,
          timer,
          seq
        });
      }
      handleReplyAck(reqId, frame) {
        const pending = this.pendingAcks.get(reqId);
        if (!pending)
          return;
        clearTimeout(pending.timer);
        this.pendingAcks.delete(reqId);
        const queue = this.replyQueues.get(reqId);
        if (frame.errcode !== 0) {
          this.logger.warn(`Reply ack error: reqId=${reqId}, errcode=${frame.errcode}, errmsg=${frame.errmsg}`);
          if (queue) {
            queue.shift();
          }
          pending.reject(frame);
        } else {
          this.logger.debug(`Reply ack received for reqId: ${reqId}`);
          if (queue) {
            queue.shift();
          }
          pending.resolve(frame);
        }
        this.processReplyQueue(reqId);
      }
      clearPendingMessages(reason) {
        const pendingRejects = /* @__PURE__ */ new Set();
        for (const [reqId, pending] of this.pendingAcks) {
          clearTimeout(pending.timer);
          pendingRejects.add(pending.reject);
          pending.reject(new Error(`${reason}, reply for reqId: ${reqId} cancelled`));
        }
        this.pendingAcks.clear();
        for (const [reqId, queue] of this.replyQueues) {
          for (const item of queue) {
            if (pendingRejects.has(item.reject)) {
              continue;
            }
            item.reject(new Error(`${reason}, reply for reqId: ${reqId} cancelled`));
          }
        }
        this.replyQueues.clear();
      }
      disconnect() {
        this.isManualClose = true;
        this.stopHeartbeat();
        this.clearPendingMessages("Connection manually closed");
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        if (this.ws) {
          this.ws.terminate();
          this.ws = null;
        }
        this.logger.info("WebSocket connection manually closed");
      }
      hasPendingAck(reqId) {
        return this.pendingAcks.has(reqId);
      }
      get isConnected() {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
      }
    };
    var MessageHandler = class {
      constructor(logger) {
        this.logger = logger;
      }
      handleFrame(frame, emitter) {
        try {
          const body = frame.body;
          if (!body || !body.msgtype) {
            this.logger.warn("Received invalid message format:", JSON.stringify(frame).substring(0, 200));
            return;
          }
          if (frame.cmd === WsCmd.EVENT_CALLBACK) {
            this.handleEventCallback(frame, emitter);
            return;
          }
          this.handleMessageCallback(frame, emitter);
        } catch (error) {
          this.logger.error("Failed to handle message:", error.message);
        }
      }
      handleMessageCallback(frame, emitter) {
        const body = frame.body;
        emitter.emit("message", frame);
        switch (body.msgtype) {
          case exports.MessageType.Text:
            emitter.emit("message.text", frame);
            break;
          case exports.MessageType.Image:
            emitter.emit("message.image", frame);
            break;
          case exports.MessageType.Mixed:
            emitter.emit("message.mixed", frame);
            break;
          case exports.MessageType.Voice:
            emitter.emit("message.voice", frame);
            break;
          case exports.MessageType.File:
            emitter.emit("message.file", frame);
            break;
          case exports.MessageType.Video:
            emitter.emit("message.video", frame);
            break;
          default:
            this.logger.debug(`Received unhandled message type: ${body.msgtype}`);
            break;
        }
      }
      handleEventCallback(frame, emitter) {
        const body = frame.body;
        emitter.emit("event", frame);
        const eventType = body.event?.eventtype;
        if (eventType) {
          const eventKey = `event.${eventType}`;
          emitter.emit(eventKey, frame);
        } else {
          this.logger.debug("Received event callback without eventtype:", JSON.stringify(body).substring(0, 200));
        }
      }
    };
    function decryptFile(encryptedBuffer, aesKey) {
      if (!encryptedBuffer || encryptedBuffer.length === 0) {
        throw new Error("decryptFile: encryptedBuffer is empty or not provided");
      }
      if (!aesKey || typeof aesKey !== "string") {
        throw new Error("decryptFile: aesKey must be a non-empty string");
      }
      const key = Buffer.from(aesKey, "base64");
      const iv = key.subarray(0, 16);
      try {
        const decipher = crypto2.createDecipheriv("aes-256-cbc", key, iv);
        decipher.setAutoPadding(false);
        const decrypted = Buffer.concat([
          decipher.update(encryptedBuffer),
          decipher.final()
        ]);
        const padLen = decrypted[decrypted.length - 1];
        if (padLen < 1 || padLen > 32 || padLen > decrypted.length) {
          throw new Error(`Invalid PKCS#7 padding value: ${padLen}`);
        }
        for (let i = decrypted.length - padLen; i < decrypted.length; i++) {
          if (decrypted[i] !== padLen) {
            throw new Error("Invalid PKCS#7 padding: padding bytes mismatch");
          }
        }
        return decrypted.subarray(0, decrypted.length - padLen);
      } catch (error) {
        throw new Error(`decryptFile: Decryption failed - ${error.message}. This may indicate corrupted data or an incorrect aesKey.`);
      }
    }
    var DefaultLogger = class {
      constructor(prefix = "AiBotSDK") {
        this.prefix = prefix;
      }
      formatTime() {
        return (/* @__PURE__ */ new Date()).toISOString();
      }
      debug(message, ...args) {
        console.debug(`[${this.formatTime()}] [${this.prefix}] [DEBUG] ${message}`, ...args);
      }
      info(message, ...args) {
        console.info(`[${this.formatTime()}] [${this.prefix}] [INFO] ${message}`, ...args);
      }
      warn(message, ...args) {
        console.warn(`[${this.formatTime()}] [${this.prefix}] [WARN] ${message}`, ...args);
      }
      error(message, ...args) {
        console.error(`[${this.formatTime()}] [${this.prefix}] [ERROR] ${message}`, ...args);
      }
    };
    var WSClient2 = class extends eventemitter3.EventEmitter {
      constructor(options) {
        super();
        this.started = false;
        this.options = {
          reconnectInterval: 1e3,
          maxReconnectAttempts: 10,
          maxAuthFailureAttempts: 5,
          heartbeatInterval: 3e4,
          requestTimeout: 1e4,
          wsUrl: "",
          wsOptions: {},
          maxReplyQueueSize: 500,
          logger: new DefaultLogger(),
          ...options
        };
        this.logger = this.options.logger;
        this.apiClient = new WeComApiClient(this.logger, this.options.requestTimeout);
        this.wsManager = new WsConnectionManager(this.logger, this.options.heartbeatInterval, this.options.reconnectInterval, this.options.maxReconnectAttempts, this.options.wsUrl || void 0, this.options.wsOptions, this.options.maxReplyQueueSize, this.options.maxAuthFailureAttempts);
        this.wsManager.setCredentials(this.options.botId, this.options.secret, {
          ...this.options.scene !== void 0 && { scene: this.options.scene },
          ...this.options.plug_version !== void 0 && { plug_version: this.options.plug_version }
        });
        this.messageHandler = new MessageHandler(this.logger);
        this.setupWsEvents();
      }
      setupWsEvents() {
        this.wsManager.onConnected = () => {
          this.emit("connected");
        };
        this.wsManager.onAuthenticated = () => {
          this.logger.info("Authenticated");
          this.emit("authenticated");
        };
        this.wsManager.onDisconnected = (reason) => {
          this.emit("disconnected", reason);
        };
        this.wsManager.onServerDisconnect = (reason) => {
          this.logger.warn(`Server disconnected this connection: ${reason}`);
          this.started = false;
          this.emit("disconnected", reason);
        };
        this.wsManager.onReconnecting = (attempt) => {
          this.emit("reconnecting", attempt);
        };
        this.wsManager.onError = (error) => {
          this.emit("error", error);
        };
        this.wsManager.onMessage = (frame) => {
          this.messageHandler.handleFrame(frame, this);
        };
      }
      connect() {
        if (this.started) {
          this.logger.warn("Client already connected");
          return this;
        }
        this.logger.info("Establishing WebSocket connection...");
        this.started = true;
        this.wsManager.connect();
        return this;
      }
      disconnect() {
        if (!this.started) {
          this.logger.warn("Client not connected");
          return;
        }
        this.logger.info("Disconnecting...");
        this.started = false;
        this.wsManager.disconnect();
        this.logger.info("Disconnected");
      }
      reply(frame, body, cmd) {
        const reqId = frame.headers?.req_id || "";
        return this.wsManager.sendReply(reqId, body, cmd);
      }
      replyStream(frame, streamId, content, finish = false, msgItem, feedback) {
        const stream = {
          id: streamId,
          finish,
          content
        };
        if (finish && msgItem && msgItem.length > 0) {
          stream.msg_item = msgItem;
        }
        if (feedback) {
          stream.feedback = feedback;
        }
        return this.reply(frame, {
          msgtype: "stream",
          stream
        });
      }
      replyWelcome(frame, body) {
        return this.reply(frame, body, WsCmd.RESPONSE_WELCOME);
      }
      replyTemplateCard(frame, templateCard, feedback) {
        const card = feedback ? { ...templateCard, feedback } : templateCard;
        const body = {
          msgtype: "template_card",
          template_card: card
        };
        return this.reply(frame, body);
      }
      replyStreamWithCard(frame, streamId, content, finish = false, options) {
        const stream = {
          id: streamId,
          finish,
          content
        };
        if (finish && options?.msgItem && options.msgItem.length > 0) {
          stream.msg_item = options.msgItem;
        }
        if (options?.streamFeedback) {
          stream.feedback = options.streamFeedback;
        }
        const body = {
          msgtype: "stream_with_template_card",
          stream
        };
        if (options?.templateCard) {
          body.template_card = options.cardFeedback ? { ...options.templateCard, feedback: options.cardFeedback } : options.templateCard;
        }
        return this.reply(frame, body);
      }
      updateTemplateCard(frame, templateCard, userids) {
        const body = {
          response_type: "update_template_card",
          template_card: templateCard
        };
        if (userids && userids.length > 0) {
          body.userids = userids;
        }
        return this.reply(frame, body, WsCmd.RESPONSE_UPDATE);
      }
      sendMessage(chatid, body) {
        const reqId = generateReqId(WsCmd.SEND_MSG);
        const fullBody = {
          chatid,
          ...body
        };
        return this.wsManager.sendReply(reqId, fullBody, WsCmd.SEND_MSG);
      }
      async uploadMedia(fileBuffer, options) {
        const { type, filename } = options;
        const totalSize = fileBuffer.length;
        const CHUNK_SIZE = 512 * 1024;
        const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
        if (totalChunks > 100) {
          throw new Error(`File too large: ${totalChunks} chunks exceeds maximum of 100 chunks (max ~50MB)`);
        }
        const md5 = crypto2.createHash("md5").update(fileBuffer).digest("hex");
        this.logger.info(`Uploading media: type=${type}, filename=${filename}, size=${totalSize}, chunks=${totalChunks}`);
        const initReqId = generateReqId(WsCmd.UPLOAD_MEDIA_INIT);
        const initResult = await this.wsManager.sendReply(initReqId, { type, filename, total_size: totalSize, total_chunks: totalChunks, md5 }, WsCmd.UPLOAD_MEDIA_INIT);
        const uploadId = initResult.body?.upload_id;
        if (!uploadId) {
          throw new Error(`Upload init failed: no upload_id returned. Response: ${JSON.stringify(initResult)}`);
        }
        this.logger.info(`Upload init success: upload_id=${uploadId}`);
        const MAX_CHUNK_RETRIES = 2;
        const MAX_CONCURRENCY = totalChunks <= 4 ? totalChunks : totalChunks <= 10 ? 3 : 2;
        const uploadChunk = async (chunkIndex) => {
          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, totalSize);
          const chunk = fileBuffer.subarray(start, end);
          const base64Data = chunk.toString("base64");
          let lastError;
          for (let attempt = 0; attempt <= MAX_CHUNK_RETRIES; attempt++) {
            try {
              const chunkReqId = generateReqId(WsCmd.UPLOAD_MEDIA_CHUNK);
              await this.wsManager.sendReply(chunkReqId, { upload_id: uploadId, chunk_index: chunkIndex, base64_data: base64Data }, WsCmd.UPLOAD_MEDIA_CHUNK);
              this.logger.debug(`Uploaded chunk ${chunkIndex + 1}/${totalChunks} (${chunk.length} bytes)`);
              return;
            } catch (err) {
              lastError = err;
              if (attempt < MAX_CHUNK_RETRIES) {
                const delay = 500 * (attempt + 1);
                this.logger.warn(`Chunk ${chunkIndex} upload failed (attempt ${attempt + 1}/${MAX_CHUNK_RETRIES + 1}), retrying in ${delay}ms... error: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
                await new Promise((r) => setTimeout(r, delay));
              }
            }
          }
          const errMsg = lastError instanceof Error ? lastError.message : JSON.stringify(lastError);
          throw new Error(`Chunk ${chunkIndex} upload failed after ${MAX_CHUNK_RETRIES + 1} attempts: ${errMsg}`);
        };
        this.logger.debug(`Upload concurrency: ${MAX_CONCURRENCY} workers for ${totalChunks} chunks`);
        if (totalChunks <= 1) {
          await uploadChunk(0);
        } else {
          let nextIndex = 0;
          const errors = [];
          const runWorker = async () => {
            while (nextIndex < totalChunks) {
              const idx = nextIndex++;
              try {
                await uploadChunk(idx);
              } catch (err) {
                errors.push(err instanceof Error ? err : new Error(String(err)));
              }
            }
          };
          const workerCount = Math.min(MAX_CONCURRENCY, totalChunks);
          await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
          if (errors.length > 0) {
            throw new Error(`Upload failed: ${errors.length} chunk(s) failed. First error: ${errors[0].message}`);
          }
        }
        this.logger.info(`All ${totalChunks} chunks uploaded, finishing...`);
        const finishReqId = generateReqId(WsCmd.UPLOAD_MEDIA_FINISH);
        const finishResult = await this.wsManager.sendReply(finishReqId, { upload_id: uploadId }, WsCmd.UPLOAD_MEDIA_FINISH);
        const mediaId = finishResult.body?.media_id;
        if (!mediaId) {
          throw new Error(`Upload finish failed: no media_id returned. Response: ${JSON.stringify(finishResult)}`);
        }
        this.logger.info(`Upload complete: media_id=${mediaId}, type=${finishResult.body?.type}`);
        return {
          type: finishResult.body?.type ?? type,
          media_id: mediaId,
          created_at: finishResult.body?.created_at ?? (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      replyMedia(frame, mediaType, mediaId, videoOptions) {
        const mediaContent = { media_id: mediaId };
        if (mediaType === "video" && videoOptions) {
          if (videoOptions.title)
            mediaContent.title = videoOptions.title;
          if (videoOptions.description)
            mediaContent.description = videoOptions.description;
        }
        const body = {
          msgtype: mediaType,
          [mediaType]: mediaContent
        };
        return this.reply(frame, body);
      }
      sendMediaMessage(chatid, mediaType, mediaId, videoOptions) {
        const mediaContent = { media_id: mediaId };
        if (mediaType === "video" && videoOptions) {
          if (videoOptions.title)
            mediaContent.title = videoOptions.title;
          if (videoOptions.description)
            mediaContent.description = videoOptions.description;
        }
        const body = {
          msgtype: mediaType,
          [mediaType]: mediaContent
        };
        return this.sendMessage(chatid, body);
      }
      async downloadFile(url, aesKey) {
        this.logger.debug(`[plugin] downloadFile: url=${url}, hasAesKey=${!!aesKey}`);
        this.logger.info("Downloading and decrypting file...");
        try {
          const { buffer: encryptedBuffer, filename } = await this.apiClient.downloadFileRaw(url);
          if (!aesKey) {
            this.logger.warn("No aesKey provided, returning raw file data");
            return { buffer: encryptedBuffer, filename };
          }
          const decryptedBuffer = decryptFile(encryptedBuffer, aesKey);
          this.logger.info("File downloaded and decrypted successfully");
          return { buffer: decryptedBuffer, filename };
        } catch (error) {
          this.logger.error("File download/decrypt failed:", error.message);
          throw error;
        }
      }
      hasPendingReplyAck(frame) {
        const reqId = frame.headers?.req_id || "";
        return this.wsManager.hasPendingAck(reqId);
      }
      replyStreamNonBlocking(frame, streamId, content, finish = false, msgItem, feedback) {
        if (!finish && this.hasPendingReplyAck(frame)) {
          return Promise.resolve("skipped");
        }
        return this.replyStream(frame, streamId, content, finish, msgItem, feedback);
      }
      get isConnected() {
        return this.wsManager.isConnected;
      }
      get api() {
        return this.apiClient;
      }
    };
    var CRYPTO_CONSTANTS = {
      PKCS7_BLOCK_SIZE: 32,
      AES_KEY_LENGTH: 32
    };
    function decodeEncodingAESKey(encodingAESKey) {
      const trimmed = encodingAESKey.trim();
      if (!trimmed)
        throw new Error("encodingAESKey missing");
      const withPadding = trimmed.endsWith("=") ? trimmed : `${trimmed}=`;
      const key = Buffer.from(withPadding, "base64");
      if (key.length !== CRYPTO_CONSTANTS.AES_KEY_LENGTH) {
        throw new Error(`invalid encodingAESKey (expected ${CRYPTO_CONSTANTS.AES_KEY_LENGTH} bytes, got ${key.length})`);
      }
      return key;
    }
    function pkcs7Pad(buf, blockSize) {
      const mod = buf.length % blockSize;
      const pad = mod === 0 ? blockSize : blockSize - mod;
      const padByte = Buffer.alloc(1, pad);
      return Buffer.concat([buf, Buffer.alloc(pad, padByte[0])]);
    }
    function pkcs7Unpad(buf, blockSize) {
      if (buf.length === 0)
        throw new Error("invalid pkcs7 payload");
      const pad = buf[buf.length - 1];
      if (pad < 1 || pad > blockSize) {
        throw new Error("invalid pkcs7 padding value");
      }
      if (pad > buf.length) {
        throw new Error("invalid pkcs7 payload length");
      }
      for (let i = 0; i < pad; i += 1) {
        if (buf[buf.length - 1 - i] !== pad) {
          throw new Error("invalid pkcs7 padding byte");
        }
      }
      return buf.subarray(0, buf.length - pad);
    }
    function sha1Hex(input) {
      return crypto$1.createHash("sha1").update(input).digest("hex");
    }
    var WecomCrypto = class {
      constructor(token, encodingAESKey, receiveId) {
        this.token = token;
        this.encodingAESKey = encodingAESKey;
        this.receiveId = receiveId;
        if (!token)
          throw new Error("token is required");
        this.aesKey = decodeEncodingAESKey(encodingAESKey);
        this.iv = this.aesKey.subarray(0, 16);
      }
      computeSignature(timestamp, nonce, encrypt) {
        const parts = [this.token, timestamp, nonce, encrypt].map((v) => String(v ?? "")).sort();
        return sha1Hex(parts.join(""));
      }
      verifySignature(signature, timestamp, nonce, encrypt) {
        const expected = this.computeSignature(timestamp, nonce, encrypt);
        return expected === signature;
      }
      decrypt(encryptText) {
        const decipher = crypto$1.createDecipheriv("aes-256-cbc", this.aesKey, this.iv);
        decipher.setAutoPadding(false);
        const decryptedPadded = Buffer.concat([
          decipher.update(Buffer.from(encryptText, "base64")),
          decipher.final()
        ]);
        const decrypted = pkcs7Unpad(decryptedPadded, CRYPTO_CONSTANTS.PKCS7_BLOCK_SIZE);
        if (decrypted.length < 20) {
          throw new Error(`invalid payload (expected >=20 bytes, got ${decrypted.length})`);
        }
        const msgLen = decrypted.readUInt32BE(16);
        const msgStart = 20;
        const msgEnd = msgStart + msgLen;
        if (msgEnd > decrypted.length) {
          throw new Error(`invalid msg length (msgEnd=${msgEnd}, total=${decrypted.length})`);
        }
        const msg = decrypted.subarray(msgStart, msgEnd).toString("utf8");
        const receiveId = this.receiveId ?? "";
        if (receiveId) {
          const trailing = decrypted.subarray(msgEnd).toString("utf8");
          if (trailing !== receiveId) {
            throw new Error(`receiveId mismatch (expected "${receiveId}", got "${trailing}")`);
          }
        }
        return msg;
      }
      encrypt(plainText, timestamp, nonce) {
        const random16 = crypto$1.randomBytes(16);
        const msgBuf = Buffer.from(plainText ?? "", "utf8");
        const msgLen = Buffer.alloc(4);
        msgLen.writeUInt32BE(msgBuf.length, 0);
        const receiveIdBuf = Buffer.from(this.receiveId ?? "", "utf8");
        const raw = Buffer.concat([random16, msgLen, msgBuf, receiveIdBuf]);
        const padded = pkcs7Pad(raw, CRYPTO_CONSTANTS.PKCS7_BLOCK_SIZE);
        const cipher = crypto$1.createCipheriv("aes-256-cbc", this.aesKey, this.iv);
        cipher.setAutoPadding(false);
        const encryptedBuf = Buffer.concat([cipher.update(padded), cipher.final()]);
        const encryptBase64 = encryptedBuf.toString("base64");
        const signature = this.computeSignature(timestamp, nonce, encryptBase64);
        return { encrypt: encryptBase64, signature };
      }
    };
    var AiBot = {
      WSClient: WSClient2
    };
    exports.DefaultLogger = DefaultLogger;
    exports.MessageHandler = MessageHandler;
    exports.WSAuthFailureError = WSAuthFailureError;
    exports.WSClient = WSClient2;
    exports.WSReconnectExhaustedError = WSReconnectExhaustedError;
    exports.WeComApiClient = WeComApiClient;
    exports.WecomCrypto = WecomCrypto;
    exports.WsCmd = WsCmd;
    exports.WsConnectionManager = WsConnectionManager;
    exports.decodeEncodingAESKey = decodeEncodingAESKey;
    exports.decryptFile = decryptFile;
    exports.default = AiBot;
    exports.generateRandomString = generateRandomString;
    exports.generateReqId = generateReqId;
    exports.pkcs7Pad = pkcs7Pad;
    exports.pkcs7Unpad = pkcs7Unpad;
  }
});

// adapters/wecom/index.ts
init_define_MACRO();
var import_aibot_node_sdk = __toESM(require_index_cjs(), 1);
import * as crypto from "node:crypto";

// adapters/wecom/extract-payload.ts
init_define_MACRO();
function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}
function mixedText(mixed) {
  return (mixed?.msg_item ?? []).filter((item) => item.msgtype === "text").map((item) => cleanText(item.text?.content)).filter(Boolean).join("\n");
}
function extractWecomText(body) {
  if (!body) return "";
  const parts = [
    cleanText(body.text?.content),
    // WeCom transcribes voice server-side, so a voice note is plain text here.
    cleanText(body.voice?.content),
    mixedText(body.mixed)
  ].filter(Boolean);
  return parts.join("\n").trim();
}
function extractWecomQuoteText(body) {
  const quote = body?.quote;
  if (!quote) return "";
  const parts = [
    cleanText(quote.text?.content),
    cleanText(quote.voice?.content),
    mixedText(quote.mixed)
  ].filter(Boolean);
  return parts.join("\n").trim();
}
function extractWecomPayload(body) {
  if (!body) return null;
  const userId = cleanText(body.from?.userid);
  if (!userId) return null;
  if (body.chattype === "group") return null;
  const chatId = userId;
  const quoted = extractWecomQuoteText(body);
  const body_text = extractWecomText(body);
  const text = quoted ? `> ${quoted.replace(/\n/g, "\n> ")}

${body_text}`.trim() : body_text;
  return {
    chatId,
    userId,
    text,
    dedupKey: cleanText(body.msgid) || `${chatId}:${body.create_time ?? ""}:${body_text.slice(0, 32)}`
  };
}

// adapters/wecom/media.ts
init_define_MACRO();
function imageCandidate(media2, seed) {
  if (!media2?.url) return null;
  return {
    kind: "image",
    name: `wecom-image-${seed}.jpg`,
    url: media2.url,
    aesKey: media2.aeskey,
    mimeType: "image/jpeg"
  };
}
function collectWecomMediaCandidates(body) {
  if (!body) return [];
  const seed = body.msgid || String(Date.now());
  const candidates = [];
  const image = imageCandidate(body.image, seed);
  if (image) candidates.push(image);
  if (body.file?.url) {
    candidates.push({
      kind: "file",
      name: `wecom-file-${seed}`,
      url: body.file.url,
      aesKey: body.file.aeskey
    });
  }
  body.mixed?.msg_item?.forEach((item, index) => {
    if (item.msgtype !== "image") return;
    const mixedImage = imageCandidate(item.image, `${seed}-${index}`);
    if (mixedImage) candidates.push(mixedImage);
  });
  return candidates;
}
var WecomMediaService = class {
  constructor(store, download) {
    this.store = store;
    this.download = download;
  }
  store;
  download;
  async downloadCandidate(candidate, sessionId) {
    const { buffer, filename } = await this.download(candidate.url, candidate.aesKey);
    const name = filename?.trim() || candidate.name;
    const mimeType = candidate.mimeType ?? inferMimeFromFileName(name) ?? (candidate.kind === "image" ? "image/jpeg" : "application/octet-stream");
    const target = this.store.resolvePath("wecom", sessionId, name);
    const path = await this.store.write(target, buffer);
    return {
      // Trust the resolved MIME over the candidate's guess: a `file` message
      // carrying a .png is an image to the Agent, and the limits differ.
      kind: attachmentKindForMime(mimeType),
      name,
      path,
      buffer,
      size: buffer.length,
      mimeType
    };
  }
};

// adapters/wecom/index.ts
var WECOM_STREAM_BYTE_LIMIT = 19e3;
var WECOM_TEXT_BYTE_LIMIT = 4e3;
var config = loadConfig();
if (!config.wecom.botId || !config.wecom.secret) {
  console.error("[WeCom] Missing WECOM_BOT_ID / WECOM_BOT_SECRET. Bind \u4F01\u4E1A\u5FAE\u4FE1 in Desktop Settings > IM.");
  process.exit(1);
}
var client = new import_aibot_node_sdk.WSClient({
  botId: config.wecom.botId,
  secret: config.wecom.secret,
  logger: {
    debug: () => {
    },
    info: () => {
    },
    warn: (message, ...args) => console.warn("[WeCom][sdk]", message, ...args),
    error: (message, ...args) => console.error("[WeCom][sdk]", message, ...args)
  }
});
var bridge = new WsBridge(config.serverUrl, "wecom");
var dedup = new MessageDedup();
var sessionStore = new SessionStore();
var { httpClient, defaultWorkDir } = createAdapterClient(config, config.wecom);
var attachmentStore = new AttachmentStore();
var media = new WecomMediaService(attachmentStore, (url, aesKey) => client.downloadFile(url, aesKey));
attachmentStore.gc().catch((err) => {
  console.warn("[WeCom] AttachmentStore.gc failed:", err instanceof Error ? err.message : err);
});
var replyFrames = /* @__PURE__ */ new Map();
async function sendMarkdown(chatId, text) {
  for (const chunk of splitMessageByBytes(text, WECOM_TEXT_BYTE_LIMIT)) {
    await client.sendMessage(chatId, { msgtype: "markdown", markdown: { content: chunk } });
  }
}
var WecomResponse = class {
  constructor(chatId) {
    this.chatId = chatId;
    this.frame = replyFrames.get(chatId);
  }
  chatId;
  streamId = crypto.randomUUID().replace(/-/g, "");
  frame;
  streamed = "";
  overflow = "";
  streamStarted = false;
  streamClosed = false;
  async append(delta) {
    if (!delta) return;
    if (this.streamClosed) {
      this.overflow += delta;
      return;
    }
    const next = this.streamed + delta;
    if (utf8Length(next) > WECOM_STREAM_BYTE_LIMIT) {
      await this.flushStream(true);
      this.streamClosed = true;
      this.overflow += delta;
      return;
    }
    this.streamed = next;
    if (this.frame && client.hasPendingReplyAck(this.frame)) return;
    await this.flushStream(false);
  }
  async finish() {
    if (!this.streamClosed) {
      await this.flushStream(true);
      this.streamClosed = true;
    }
    const tail = this.overflow.trim();
    this.overflow = "";
    if (tail) await sendMarkdown(this.chatId, tail);
  }
  async flushStream(finished) {
    if (!this.streamStarted && !this.streamed.trim()) return;
    if (!this.frame) {
      if (finished && this.streamed.trim()) await sendMarkdown(this.chatId, this.streamed);
      return;
    }
    try {
      await client.replyStream(this.frame, this.streamId, this.streamed, finished);
      this.streamStarted = true;
    } catch (err) {
      console.warn("[WeCom] replyStream failed:", err instanceof Error ? err.message : err);
      if (finished && this.streamed.trim()) {
        await sendMarkdown(this.chatId, this.streamed).catch((sendErr) => {
          console.error("[WeCom] stream fallback send failed:", sendErr);
        });
      }
    }
  }
};
var port = {
  platform: "wecom",
  logPrefix: "[WeCom]",
  async sendNotice(chatId, text) {
    await sendMarkdown(chatId, text);
  },
  createResponse(chatId) {
    return new WecomResponse(chatId);
  },
  async sendImage(chatId, image) {
    const check = checkAttachmentLimit("image", image.buffer.length, image.mime);
    if (!check.ok) {
      console.warn("[WeCom] Outbound image rejected:", check.hint);
      return;
    }
    const filename = `claude-${Date.now()}.${imageExtensionForMime(image.mime)}`;
    const uploaded = await client.uploadMedia(image.buffer, { type: "image", filename });
    const mediaId = uploaded?.media_id;
    if (!mediaId) throw new Error("Enterprise WeChat upload returned no media_id");
    await client.sendMediaMessage(chatId, "image", mediaId);
  },
  clearChat(chatId) {
    replyFrames.delete(chatId);
  }
};
var runtime = new ImChatRuntime({
  port,
  config,
  platformConfig: config.wecom,
  bridge,
  sessionStore,
  httpClient,
  defaultWorkDir,
  dedup,
  // The bubble updates in place, so flushing often is cheap and looks live.
  flushIntervalMs: 500,
  flushCharThreshold: 160
});
async function collectAttachments(chatId, candidates) {
  if (candidates.length === 0) return [];
  const sessionId = sessionStore.get(chatId)?.sessionId ?? chatId;
  const settled = await Promise.allSettled(
    candidates.map((candidate) => media.downloadCandidate(candidate, sessionId))
  );
  const attachments = [];
  let failures = 0;
  for (const result of settled) {
    if (result.status === "rejected") {
      failures += 1;
      console.error("[WeCom] media download failed:", result.reason);
      continue;
    }
    const local = result.value;
    const check = checkAttachmentLimit(local.kind, local.size, local.mimeType);
    if (!check.ok) {
      await port.sendNotice(chatId, check.hint);
      continue;
    }
    attachments.push(
      local.kind === "image" ? { type: "image", name: local.name, data: local.buffer.toString("base64"), mimeType: local.mimeType } : { type: "file", name: local.name, path: local.path, mimeType: local.mimeType }
    );
  }
  if (failures > 0) {
    await port.sendNotice(
      chatId,
      failures === candidates.length ? "\u9644\u4EF6\u4E0B\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002" : `${failures} \u4E2A\u9644\u4EF6\u4E0B\u8F7D\u5931\u8D25\uFF0C\u5DF2\u8DF3\u8FC7\u3002`
    );
  }
  return attachments;
}
client.on("message", (frame) => {
  const payload = extractWecomPayload(frame?.body);
  if (!payload) return;
  replyFrames.set(payload.chatId, frame);
  const candidates = collectWecomMediaCandidates(frame?.body);
  void runtime.handleInbound({
    chatId: payload.chatId,
    userId: payload.userId,
    displayName: payload.userId,
    dedupKey: payload.dedupKey,
    text: payload.text,
    hasAttachments: candidates.length > 0,
    loadAttachments: () => collectAttachments(payload.chatId, candidates)
  });
});
client.on("authenticated", () => console.log("[WeCom] Authenticated, bot is running!"));
client.on("disconnected", (reason) => console.warn(`[WeCom] Disconnected: ${reason}`));
client.on("reconnecting", (attempt) => console.log(`[WeCom] Reconnecting (attempt ${attempt})`));
client.on("error", (err) => console.error("[WeCom] Connection error:", err.message));
console.log("[WeCom] Starting adapter...");
console.log(`[WeCom] Server: ${config.serverUrl}`);
console.log(`[WeCom] Bot: ${config.wecom.botId}`);
client.connect();
process.on("SIGINT", () => {
  console.log("[WeCom] Shutting down...");
  try {
    client.disconnect();
  } catch {
  }
  bridge.destroy();
  dedup.destroy();
  process.exit(0);
});
//# sourceMappingURL=wecom-YAK7FJMY.mjs.map
