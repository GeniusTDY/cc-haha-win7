"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../node_modules/tree-kill/index.js
var require_tree_kill = __commonJS({
  "../node_modules/tree-kill/index.js"(exports2, module2) {
    "use strict";
    var childProcess = require("child_process");
    var spawn2 = childProcess.spawn;
    var exec = childProcess.exec;
    module2.exports = function(pid, signal, callback) {
      if (typeof signal === "function" && callback === void 0) {
        callback = signal;
        signal = void 0;
      }
      pid = parseInt(pid);
      if (Number.isNaN(pid)) {
        if (callback) {
          return callback(new Error("pid must be a number"));
        } else {
          throw new Error("pid must be a number");
        }
      }
      var tree = {};
      var pidsToProcess = {};
      tree[pid] = [];
      pidsToProcess[pid] = 1;
      switch (process.platform) {
        case "win32":
          exec("taskkill /pid " + pid + " /T /F", callback);
          break;
        case "darwin":
          buildProcessTree(pid, tree, pidsToProcess, function(parentPid) {
            return spawn2("pgrep", ["-P", parentPid]);
          }, function() {
            killAll(tree, signal, callback);
          });
          break;
        // case 'sunos':
        //     buildProcessTreeSunOS(pid, tree, pidsToProcess, function () {
        //         killAll(tree, signal, callback);
        //     });
        //     break;
        default:
          buildProcessTree(pid, tree, pidsToProcess, function(parentPid) {
            return spawn2("ps", ["-o", "pid", "--no-headers", "--ppid", parentPid]);
          }, function() {
            killAll(tree, signal, callback);
          });
          break;
      }
    };
    function killAll(tree, signal, callback) {
      var killed = {};
      try {
        Object.keys(tree).forEach(function(pid) {
          tree[pid].forEach(function(pidpid) {
            if (!killed[pidpid]) {
              killPid(pidpid, signal);
              killed[pidpid] = 1;
            }
          });
          if (!killed[pid]) {
            killPid(pid, signal);
            killed[pid] = 1;
          }
        });
      } catch (err) {
        if (callback) {
          return callback(err);
        } else {
          throw err;
        }
      }
      if (callback) {
        return callback();
      }
    }
    function killPid(pid, signal) {
      try {
        process.kill(parseInt(pid, 10), signal);
      } catch (err) {
        if (err.code !== "ESRCH") throw err;
      }
    }
    function buildProcessTree(parentPid, tree, pidsToProcess, spawnChildProcessesList, cb) {
      var ps = spawnChildProcessesList(parentPid);
      var allData = "";
      ps.stdout.on("data", function(data) {
        var data = data.toString("ascii");
        allData += data;
      });
      var onClose = function(code) {
        delete pidsToProcess[parentPid];
        if (code != 0) {
          if (Object.keys(pidsToProcess).length == 0) {
            cb();
          }
          return;
        }
        allData.match(/\d+/g).forEach(function(pid) {
          pid = parseInt(pid, 10);
          tree[parentPid].push(pid);
          tree[pid] = [];
          pidsToProcess[pid] = 1;
          buildProcessTree(pid, tree, pidsToProcess, spawnChildProcessesList, cb);
        });
      };
      ps.on("close", onClose);
    }
  }
});

// electron/main.ts
var import_electron = require("electron");
var electron = __toESM(require("electron"), 1);
var import_node_os6 = __toESM(require("node:os"), 1);
var import_node_path14 = __toESM(require("node:path"), 1);

// electron/ipc/channels.ts
var ELECTRON_IPC_CHANNELS = {
  appGetVersion: "desktop:app:get-version",
  appGetLocalePreference: "desktop:app:get-locale-preference",
  appSetLocalePreference: "desktop:app:set-locale-preference",
  appGetPreferredSystemLanguages: "desktop:app:get-preferred-system-languages",
  runtimeGetServerUrl: "desktop:runtime:get-server-url",
  runtimeGetLocalAccessToken: "desktop:runtime:get-local-access-token",
  runtimeGetPetAccessToken: "desktop:runtime:get-pet-access-token",
  commandInvoke: "desktop:command:invoke",
  clipboardReadText: "desktop:clipboard:read-text",
  clipboardWriteText: "desktop:clipboard:write-text",
  shellOpen: "desktop:shell:open",
  shellOpenPath: "desktop:shell:open-path",
  traceOpenWindow: "desktop:trace:open-window",
  petsList: "desktop:pets:list",
  petsCreateFromImage: "desktop:pets:create-from-image",
  petsCreateFromAtlas: "desktop:pets:create-from-atlas",
  petsPickSourceSheet: "desktop:pets:pick-source-sheet",
  petsCreateFromAtlasBytes: "desktop:pets:create-from-atlas-bytes",
  petsOpenFolder: "desktop:pets:open-folder",
  petsShow: "desktop:pets:show",
  petsHide: "desktop:pets:hide",
  petsShowContextMenu: "desktop:pets:show-context-menu",
  petsDragWindow: "desktop:pets:drag-window",
  petsSetIgnoreMouseEvents: "desktop:pets:set-ignore-mouse-events",
  petsSetInteractiveRegions: "desktop:pets:set-interactive-regions",
  petsFocusMainWindow: "desktop:pets:focus-main-window",
  petsFocusSession: "desktop:pets:focus-session",
  dialogOpen: "desktop:dialog:open",
  dialogSave: "desktop:dialog:save",
  updateCheck: "desktop:update:check",
  updateDownload: "desktop:update:download",
  updateInstall: "desktop:update:install",
  updatePrepareInstall: "desktop:update:prepare-install",
  updateCancelInstall: "desktop:update:cancel-install",
  updateRelaunch: "desktop:update:relaunch",
  notificationPermissionState: "desktop:notification:permission-state",
  notificationRequestPermission: "desktop:notification:request-permission",
  notificationSend: "desktop:notification:send",
  notificationActionAck: "desktop:notification:action-ack",
  windowMinimize: "desktop:window:minimize",
  windowToggleMaximize: "desktop:window:toggle-maximize",
  windowClose: "desktop:window:close",
  windowStartDragging: "desktop:window:start-dragging",
  windowRequestAttention: "desktop:window:request-attention",
  windowFocus: "desktop:window:focus",
  windowIsMaximized: "desktop:window:is-maximized",
  terminalSpawn: "desktop:terminal:spawn",
  terminalWrite: "desktop:terminal:write",
  terminalResize: "desktop:terminal:resize",
  terminalKill: "desktop:terminal:kill",
  terminalGetBashPath: "desktop:terminal:get-bash-path",
  terminalSetBashPath: "desktop:terminal:set-bash-path",
  previewOpen: "desktop:preview:open",
  previewNavigate: "desktop:preview:navigate",
  previewSetBounds: "desktop:preview:set-bounds",
  previewSetVisible: "desktop:preview:set-visible",
  previewSetZoom: "desktop:preview:set-zoom",
  previewClose: "desktop:preview:close",
  previewMessage: "desktop:preview:message",
  appModeGet: "desktop:app-mode:get",
  appModeSet: "desktop:app-mode:set",
  appModePrepareRestart: "desktop:app-mode:prepare-restart",
  appModeRestart: "desktop:app-mode:restart",
  adaptersRestartSidecar: "desktop:adapters:restart-sidecar",
  zoomSet: "desktop:zoom:set",
  appearanceSetApplied: "desktop:appearance:set-applied"
};
var ELECTRON_EVENT_CHANNELS = {
  event: "desktop:event",
  appLocaleChanged: "desktop:app:locale-changed",
  webviewDragDrop: "desktop:webview:drag-drop",
  notificationAction: "desktop:notification:action",
  updateDownloadEvent: "desktop:update:download-event",
  windowResized: "desktop:window:resized",
  nativeMenuNavigate: "desktop:window:native-menu-navigate",
  terminalOutput: "desktop:terminal:output",
  terminalExit: "desktop:terminal:exit",
  previewEvent: "desktop:preview:event",
  petNavigateSession: "desktop:pets:navigate-session",
  petVisibilityChanged: "desktop:pets:visibility-changed",
  petPanelPlacementChanged: "desktop:pets:panel-placement-changed"
};
var ELECTRON_INTERNAL_CHANNELS = {
  previewMessageFromView: "desktop:preview:message-from-view"
};

// electron/ipc/capabilities.ts
var isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var noPayload = (value) => value === void 0;
var optionalRecord = (value) => value === void 0 || isRecord(value);
var stringPayload = (value) => typeof value === "string";
var booleanPayload = (value) => typeof value === "boolean";
var hasOnlyKeys = (value, allowedKeys) => Object.keys(value).every((key) => allowedKeys.includes(key));
var MAX_TERMINAL_DIMENSION = 1e3;
var MAX_TERMINAL_CWD_LENGTH = 4096;
var MAX_TERMINAL_WRITE_LENGTH = 1048576;
var isTerminalSessionId = (value) => typeof value === "number" && Number.isSafeInteger(value) && value > 0;
var isTerminalDimension = (value) => typeof value === "number" && Number.isInteger(value) && value > 0 && value <= MAX_TERMINAL_DIMENSION;
var sessionIdPayload = (value) => typeof value === "string" && value.length > 0 && value.length <= 200 && /^[A-Za-z0-9._:-]+$/.test(value);
var isSafeUiLabel = (value) => typeof value === "string" && value.trim().length > 0 && value.length <= 120 && !/[\u0000-\u001f\u007f-\u009f]/.test(value);
var hasValidPetIdentity = (value) => {
  if (typeof value.slug !== "string" || value.slug.length === 0 || value.slug.length > 73 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)) return false;
  return typeof value.displayName === "string" && value.displayName.trim().length > 0 && value.displayName.length <= 80 && typeof value.description === "string" && value.description.trim().length > 0 && value.description.length <= 500;
};
var petCreateFromAtlas = (value) => {
  if (!isRecord(value) || !hasOnlyKeys(value, [
    "slug",
    "displayName",
    "description",
    "dialogTitle",
    "dialogFilterName"
  ])) return false;
  return hasValidPetIdentity(value) && (value.dialogTitle === void 0 || isSafeUiLabel(value.dialogTitle)) && (value.dialogFilterName === void 0 || isSafeUiLabel(value.dialogFilterName));
};
var petPickSourceSheet = (value) => {
  if (value === void 0) return true;
  if (!isRecord(value) || !hasOnlyKeys(value, ["dialogTitle", "dialogFilterName"])) return false;
  return (value.dialogTitle === void 0 || isSafeUiLabel(value.dialogTitle)) && (value.dialogFilterName === void 0 || isSafeUiLabel(value.dialogFilterName));
};
var MAX_PET_ATLAS_PAYLOAD_BYTES = 8 * 1024 * 1024;
var petCreateFromAtlasBytes = (value) => {
  if (!isRecord(value) || !hasOnlyKeys(value, [
    "slug",
    "displayName",
    "description",
    "atlasData",
    "mimeType"
  ])) return false;
  if (!(value.atlasData instanceof Uint8Array) || value.atlasData.byteLength === 0 || value.atlasData.byteLength > MAX_PET_ATLAS_PAYLOAD_BYTES) return false;
  if (value.mimeType !== "image/png" && value.mimeType !== "image/webp") return false;
  return hasValidPetIdentity(value);
};
var petContextMenu = (value) => {
  if (!isRecord(value) || !hasOnlyKeys(value, ["closeLabel"])) return false;
  if (typeof value.closeLabel !== "string" || value.closeLabel.length > 80) return false;
  const closeLabel = value.closeLabel.trim();
  return closeLabel.length > 0 && closeLabel.length <= 80 && !/[\u0000-\u001f\u007f-\u009f]/.test(value.closeLabel);
};
var petWindowDrag = (value) => {
  if (!isRecord(value) || !hasOnlyKeys(value, ["phase", "x", "y"])) return false;
  if (value.phase !== "start" && value.phase !== "move" && value.phase !== "end") return false;
  return ["x", "y"].every((key) => typeof value[key] === "number" && Number.isFinite(value[key]) && Math.abs(value[key]) <= 1e6);
};
var commandInvoke = (value) => isRecord(value) && typeof value.command === "string" && value.command.length > 0 && (value.args === void 0 || isRecord(value.args));
var terminalWrite = (value) => isRecord(value) && hasOnlyKeys(value, ["sessionId", "data"]) && isTerminalSessionId(value.sessionId) && typeof value.data === "string" && value.data.length <= MAX_TERMINAL_WRITE_LENGTH;
var terminalSpawn = (value) => value === void 0 || isRecord(value) && hasOnlyKeys(value, ["cols", "rows", "cwd"]) && (value.cols === void 0 || isTerminalDimension(value.cols)) && (value.rows === void 0 || isTerminalDimension(value.rows)) && (value.cwd === void 0 || typeof value.cwd === "string" && value.cwd.length <= MAX_TERMINAL_CWD_LENGTH && !value.cwd.includes("\0"));
var terminalResize = (value) => isRecord(value) && hasOnlyKeys(value, ["sessionId", "cols", "rows"]) && isTerminalSessionId(value.sessionId) && isTerminalDimension(value.cols) && isTerminalDimension(value.rows);
var terminalSessionId = (value) => isRecord(value) && hasOnlyKeys(value, ["sessionId"]) && isTerminalSessionId(value.sessionId);
var boundsPayload = (value) => isRecord(value) && typeof value.x === "number" && typeof value.y === "number" && typeof value.width === "number" && typeof value.height === "number";
var petInteractiveRegions = (value) => Array.isArray(value) && value.length > 0 && value.length <= 8 && value.every((region) => isRecord(region) && hasOnlyKeys(region, ["x", "y", "width", "height"]) && ["x", "y", "width", "height"].every((key) => typeof region[key] === "number" && Number.isInteger(region[key]) && region[key] >= (key === "width" || key === "height" ? 1 : 0) && region[key] <= 2e3));
var urlWithOptionalBounds = (value) => isRecord(value) && typeof value.url === "string" && (value.bounds === void 0 || boundsPayload(value.bounds));
var zoomPayload = (value) => typeof value === "number" && Number.isFinite(value);
var HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
var appliedAppearance = (value) => isRecord(value) && hasOnlyKeys(value, ["isDark", "background", "lightBackground", "followSystem"]) && typeof value.isDark === "boolean" && typeof value.followSystem === "boolean" && typeof value.background === "string" && HEX_COLOR.test(value.background) && typeof value.lightBackground === "string" && HEX_COLOR.test(value.lightBackground);
var updateCheckOptions = (value) => {
  if (value === void 0) return true;
  if (!isRecord(value) || !hasOnlyKeys(value, ["proxy"])) return false;
  return value.proxy === void 0 || typeof value.proxy === "string" && value.proxy.trim().length > 0;
};
var localePreference = (value) => value === "en" || value === "zh" || value === "zh-TW" || value === "jp" || value === "kr";
var ELECTRON_IPC_VALIDATORS = {
  [ELECTRON_IPC_CHANNELS.appGetVersion]: noPayload,
  [ELECTRON_IPC_CHANNELS.appGetLocalePreference]: noPayload,
  [ELECTRON_IPC_CHANNELS.appSetLocalePreference]: localePreference,
  [ELECTRON_IPC_CHANNELS.appGetPreferredSystemLanguages]: noPayload,
  [ELECTRON_IPC_CHANNELS.runtimeGetServerUrl]: noPayload,
  [ELECTRON_IPC_CHANNELS.runtimeGetLocalAccessToken]: noPayload,
  [ELECTRON_IPC_CHANNELS.runtimeGetPetAccessToken]: noPayload,
  [ELECTRON_IPC_CHANNELS.commandInvoke]: commandInvoke,
  [ELECTRON_IPC_CHANNELS.clipboardReadText]: noPayload,
  [ELECTRON_IPC_CHANNELS.clipboardWriteText]: stringPayload,
  [ELECTRON_IPC_CHANNELS.shellOpen]: stringPayload,
  [ELECTRON_IPC_CHANNELS.shellOpenPath]: stringPayload,
  [ELECTRON_IPC_CHANNELS.traceOpenWindow]: sessionIdPayload,
  [ELECTRON_IPC_CHANNELS.petsList]: noPayload,
  [ELECTRON_IPC_CHANNELS.petsCreateFromImage]: petCreateFromAtlas,
  [ELECTRON_IPC_CHANNELS.petsCreateFromAtlas]: petCreateFromAtlas,
  [ELECTRON_IPC_CHANNELS.petsPickSourceSheet]: petPickSourceSheet,
  [ELECTRON_IPC_CHANNELS.petsCreateFromAtlasBytes]: petCreateFromAtlasBytes,
  [ELECTRON_IPC_CHANNELS.petsOpenFolder]: noPayload,
  [ELECTRON_IPC_CHANNELS.petsShow]: noPayload,
  [ELECTRON_IPC_CHANNELS.petsHide]: noPayload,
  [ELECTRON_IPC_CHANNELS.petsShowContextMenu]: petContextMenu,
  [ELECTRON_IPC_CHANNELS.petsDragWindow]: petWindowDrag,
  [ELECTRON_IPC_CHANNELS.petsSetIgnoreMouseEvents]: booleanPayload,
  [ELECTRON_IPC_CHANNELS.petsSetInteractiveRegions]: petInteractiveRegions,
  [ELECTRON_IPC_CHANNELS.petsFocusMainWindow]: noPayload,
  [ELECTRON_IPC_CHANNELS.petsFocusSession]: sessionIdPayload,
  [ELECTRON_IPC_CHANNELS.dialogOpen]: optionalRecord,
  [ELECTRON_IPC_CHANNELS.dialogSave]: optionalRecord,
  [ELECTRON_IPC_CHANNELS.updateCheck]: updateCheckOptions,
  [ELECTRON_IPC_CHANNELS.updateDownload]: noPayload,
  [ELECTRON_IPC_CHANNELS.updateInstall]: noPayload,
  [ELECTRON_IPC_CHANNELS.updatePrepareInstall]: noPayload,
  [ELECTRON_IPC_CHANNELS.updateCancelInstall]: noPayload,
  [ELECTRON_IPC_CHANNELS.updateRelaunch]: noPayload,
  [ELECTRON_IPC_CHANNELS.notificationPermissionState]: noPayload,
  [ELECTRON_IPC_CHANNELS.notificationRequestPermission]: noPayload,
  [ELECTRON_IPC_CHANNELS.notificationSend]: optionalRecord,
  [ELECTRON_IPC_CHANNELS.notificationActionAck]: optionalRecord,
  [ELECTRON_IPC_CHANNELS.windowMinimize]: noPayload,
  [ELECTRON_IPC_CHANNELS.windowToggleMaximize]: noPayload,
  [ELECTRON_IPC_CHANNELS.windowClose]: noPayload,
  [ELECTRON_IPC_CHANNELS.windowStartDragging]: noPayload,
  [ELECTRON_IPC_CHANNELS.windowRequestAttention]: noPayload,
  [ELECTRON_IPC_CHANNELS.windowFocus]: noPayload,
  [ELECTRON_IPC_CHANNELS.windowIsMaximized]: noPayload,
  [ELECTRON_IPC_CHANNELS.terminalSpawn]: terminalSpawn,
  [ELECTRON_IPC_CHANNELS.terminalWrite]: terminalWrite,
  [ELECTRON_IPC_CHANNELS.terminalResize]: terminalResize,
  [ELECTRON_IPC_CHANNELS.terminalKill]: terminalSessionId,
  [ELECTRON_IPC_CHANNELS.terminalGetBashPath]: noPayload,
  [ELECTRON_IPC_CHANNELS.terminalSetBashPath]: (value) => value === null || stringPayload(value),
  [ELECTRON_IPC_CHANNELS.previewOpen]: urlWithOptionalBounds,
  [ELECTRON_IPC_CHANNELS.previewNavigate]: stringPayload,
  [ELECTRON_IPC_CHANNELS.previewSetBounds]: boundsPayload,
  [ELECTRON_IPC_CHANNELS.previewSetVisible]: booleanPayload,
  [ELECTRON_IPC_CHANNELS.previewSetZoom]: zoomPayload,
  [ELECTRON_IPC_CHANNELS.previewClose]: noPayload,
  [ELECTRON_IPC_CHANNELS.previewMessage]: () => true,
  [ELECTRON_IPC_CHANNELS.appModeGet]: noPayload,
  [ELECTRON_IPC_CHANNELS.appModeSet]: optionalRecord,
  [ELECTRON_IPC_CHANNELS.appModePrepareRestart]: noPayload,
  [ELECTRON_IPC_CHANNELS.appModeRestart]: noPayload,
  [ELECTRON_IPC_CHANNELS.adaptersRestartSidecar]: noPayload,
  [ELECTRON_IPC_CHANNELS.zoomSet]: zoomPayload,
  [ELECTRON_IPC_CHANNELS.appearanceSetApplied]: appliedAppearance
};
var allowedChannels = new Set(
  Object.values(ELECTRON_IPC_CHANNELS)
);
var petWindowChannels = /* @__PURE__ */ new Set([
  ELECTRON_IPC_CHANNELS.appGetLocalePreference,
  ELECTRON_IPC_CHANNELS.appGetPreferredSystemLanguages,
  ELECTRON_IPC_CHANNELS.runtimeGetServerUrl,
  ELECTRON_IPC_CHANNELS.runtimeGetPetAccessToken,
  ELECTRON_IPC_CHANNELS.petsList,
  ELECTRON_IPC_CHANNELS.petsHide,
  ELECTRON_IPC_CHANNELS.petsShowContextMenu,
  ELECTRON_IPC_CHANNELS.petsDragWindow,
  ELECTRON_IPC_CHANNELS.petsSetIgnoreMouseEvents,
  ELECTRON_IPC_CHANNELS.petsSetInteractiveRegions,
  ELECTRON_IPC_CHANNELS.petsFocusMainWindow,
  ELECTRON_IPC_CHANNELS.petsFocusSession
]);
function isElectronIpcChannel(channel) {
  return allowedChannels.has(channel);
}
function validateElectronIpcPayload(channel, payload) {
  return ELECTRON_IPC_VALIDATORS[channel](payload);
}
function isElectronIpcChannelAllowedForPetWindow(channel) {
  return petWindowChannels.has(channel);
}

// electron/services/serverRuntime.ts
var import_node_path3 = __toESM(require("node:path"), 1);
var import_node_crypto3 = require("node:crypto");

// electron/services/sidecarManager.ts
var import_node_child_process = require("node:child_process");
var import_node_crypto = require("node:crypto");
var import_node_fs = require("node:fs");
var import_node_http = __toESM(require("node:http"), 1);
var import_node_net = __toESM(require("node:net"), 1);
var import_node_os = __toESM(require("node:os"), 1);
var import_node_path = __toESM(require("node:path"), 1);

// src/lib/browserSafePort.ts
var FETCH_BLOCKED_PORTS = /* @__PURE__ */ new Set([
  0,
  1,
  7,
  9,
  11,
  13,
  15,
  17,
  19,
  20,
  21,
  22,
  23,
  25,
  37,
  42,
  43,
  53,
  69,
  77,
  79,
  87,
  95,
  101,
  102,
  103,
  104,
  109,
  110,
  111,
  113,
  115,
  117,
  119,
  123,
  135,
  137,
  139,
  143,
  161,
  179,
  389,
  427,
  465,
  512,
  513,
  514,
  515,
  526,
  530,
  531,
  532,
  540,
  548,
  554,
  556,
  563,
  587,
  601,
  636,
  989,
  990,
  993,
  995,
  1719,
  1720,
  1723,
  2049,
  3659,
  4045,
  4190,
  5060,
  5061,
  6e3,
  6566,
  6665,
  6666,
  6667,
  6668,
  6669,
  6679,
  6697,
  10080
]);
function isBrowserSafePort(port) {
  return Number.isInteger(port) && port > 0 && port <= 65535 && !FETCH_BLOCKED_PORTS.has(port);
}

// electron/services/sidecarManager.ts
var SERVER_BIND_HOST = "0.0.0.0";
var SERVER_CONTROL_HOST = "127.0.0.1";
var SERVER_STARTUP_TIMEOUT_MS = 3e4;
var SERVER_STARTUP_LOG_LIMIT = 80;
var HOST_DIAGNOSTICS_LINE_LIMIT = 80;
var HOST_DIAGNOSTICS_BYTE_LIMIT = 256 * 1024;
var ELECTRON_DIAGNOSTICS_FILE_ENV = "CC_HAHA_ELECTRON_DIAGNOSTICS_FILE";
var RIPGREP_PATH_ENV = "CC_HAHA_RIPGREP_PATH";
var HOST_DIAGNOSTICS_LINE_BYTE_LIMIT = 4096;
var SERVER_STATE_FILE = "desktop-server-state.json";
var MIN_FIXED_PORT = 1024;
var MAX_FIXED_PORT = 65535;
var MAX_PORT_RESERVATION_ATTEMPTS = 128;
var PROXY_ENV_KEYS = [
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "http_proxy",
  "https_proxy",
  "ALL_PROXY",
  "all_proxy"
];
var SYSTEM_PROXY_BRIDGE_ENV = "CC_HAHA_SYSTEM_PROXY_URL";
var SYSTEM_PROXY_ERROR_ENV = "CC_HAHA_SYSTEM_PROXY_ERROR";
var LOOPBACK_NO_PROXY_ENTRIES = ["localhost", "127.0.0.1", "::1"];
function resolveHostTriple(platform = process.platform, arch = process.arch) {
  if (platform === "darwin" && arch === "arm64") return "aarch64-apple-darwin";
  if (platform === "darwin" && arch === "x64") return "x86_64-apple-darwin";
  if (platform === "win32" && arch === "arm64") return "aarch64-pc-windows-msvc";
  if (platform === "win32") return "x86_64-pc-windows-msvc";
  if (platform === "linux" && arch === "arm64") return "aarch64-unknown-linux-gnu";
  if (platform === "linux") return "x86_64-unknown-linux-gnu";
  throw new Error(`Unsupported Electron sidecar platform: ${platform}/${arch}`);
}
function resolveSidecarExecutable(desktopRoot, triple = resolveHostTriple()) {
  const base = import_node_path.default.join(desktopRoot, "src-tauri", "binaries", `claude-sidecar-${triple}`);
  return process.platform === "win32" ? `${base}.exe` : base;
}
var NODE_RUNTIME_EXE_ENV = "CC_HAHA_NODE_EXE";
var SERVER_MJS_ENV = "CC_HAHA_SERVER_MJS";
var ADAPTERS_MJS_ENV = "CC_HAHA_ADAPTERS_MJS";
var warnedMissingNodeRuntimeExe = false;
function resolveNodeRuntimeExecutable(env = process.env, desktopRoot) {
  var _a;
  const explicit = (_a = env[NODE_RUNTIME_EXE_ENV]) == null ? void 0 : _a.trim();
  if (explicit && (0, import_node_fs.existsSync)(explicit)) return explicit;
  if (explicit && !warnedMissingNodeRuntimeExe) {
    warnedMissingNodeRuntimeExe = true;
    console.warn(
      `[sidecar] ${NODE_RUNTIME_EXE_ENV} points to a missing path (${explicit}); falling back to node on PATH`
    );
  }
  if (desktopRoot) {
    for (const candidate of [
      import_node_path.default.join(desktopRoot, "runtime", "node-v22.17.0", "node.exe"),
      import_node_path.default.join(desktopRoot, "..", "runtime", "node-v22.17.0", "node.exe")
    ]) {
      if ((0, import_node_fs.existsSync)(candidate)) return candidate;
    }
  }
  try {
    const resourcesNode = import_node_path.default.join(process.resourcesPath, "runtime", "node-v22.17.0", "node.exe");
    if ((0, import_node_fs.existsSync)(resourcesNode)) return resourcesNode;
  } catch {
  }
  return process.platform === "win32" ? "node.exe" : "node";
}
function sqliteFlagArgsForVersion(version) {
  const [major = -1, minor = -1] = version.trim().replace(/^v/, "").split(".").map(Number);
  if (!Number.isFinite(major) || !Number.isFinite(minor)) return [];
  if (major === 22 && minor >= 5 && minor < 13) return ["--experimental-sqlite"];
  if (major === 23 && minor < 4) return ["--experimental-sqlite"];
  return [];
}
var probedNodeRuntimeFlags = null;
function nodeRuntimeFlags(executable = resolveNodeRuntimeExecutable(), runner = defaultVersionProbe) {
  if (probedNodeRuntimeFlags) return probedNodeRuntimeFlags;
  try {
    probedNodeRuntimeFlags = sqliteFlagArgsForVersion(runner(executable));
  } catch {
    probedNodeRuntimeFlags = [];
  }
  return probedNodeRuntimeFlags;
}
function defaultVersionProbe(executable) {
  return (0, import_node_child_process.execFileSync)(executable, ["--version"], { encoding: "utf8", timeout: 1e4 }).trim();
}
function resolveBundledScript(candidates, explicitEnv) {
  const explicit = explicitEnv == null ? void 0 : explicitEnv.trim();
  if (explicit && (0, import_node_fs.existsSync)(explicit)) return explicit;
  for (const candidate of candidates) {
    if ((0, import_node_fs.existsSync)(candidate)) return candidate;
  }
  return null;
}
function resolveServerScript(desktopRoot, env = process.env) {
  return resolveBundledScript(
    [
      import_node_path.default.join(desktopRoot, "dist", "server.mjs"),
      import_node_path.default.join(desktopRoot, "..", "dist", "server.mjs"),
      import_node_path.default.join(desktopRoot, "..", "..", "dist", "server.mjs")
    ],
    env[SERVER_MJS_ENV]
  );
}
function resolveAdaptersScript(desktopRoot, env = process.env) {
  return resolveBundledScript(
    [
      import_node_path.default.join(desktopRoot, "dist", "adapters.mjs"),
      import_node_path.default.join(desktopRoot, "..", "dist", "adapters.mjs"),
      import_node_path.default.join(desktopRoot, "..", "..", "dist", "adapters.mjs")
    ],
    env[ADAPTERS_MJS_ENV]
  );
}
function hasCompiledSidecar(desktopRoot) {
  return (0, import_node_fs.existsSync)(resolveSidecarExecutable(desktopRoot));
}
function resolveBundledRipgrepExecutable(desktopRoot, triple = resolveHostTriple()) {
  const extension = triple.includes("windows") ? ".exe" : "";
  return import_node_path.default.join(desktopRoot, "src-tauri", "binaries", `rg${extension}`);
}
function withBundledRipgrepPath(env, desktopRoot) {
  var _a;
  const bundledRipgrep = resolveBundledRipgrepExecutable(desktopRoot);
  const explicitRipgrep = (_a = env[RIPGREP_PATH_ENV]) == null ? void 0 : _a.trim();
  const selectedRipgrep = explicitRipgrep && (0, import_node_fs.existsSync)(explicitRipgrep) ? explicitRipgrep : (0, import_node_fs.existsSync)(bundledRipgrep) ? bundledRipgrep : null;
  if (!selectedRipgrep) return env;
  const pathKey = process.platform === "win32" ? Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "Path" : "PATH";
  const currentPath = env[pathKey] ?? "";
  const ripgrepDirectory = import_node_path.default.dirname(selectedRipgrep);
  const nextPath = currentPath ? `${currentPath}${import_node_path.default.delimiter}${ripgrepDirectory}` : ripgrepDirectory;
  return {
    ...env,
    [pathKey]: nextPath,
    [RIPGREP_PATH_ENV]: explicitRipgrep || bundledRipgrep
  };
}
function httpToWebSocketUrl(serverHttpUrl) {
  if (serverHttpUrl.startsWith("http://")) return `ws://${serverHttpUrl.slice("http://".length)}`;
  if (serverHttpUrl.startsWith("https://")) return `wss://${serverHttpUrl.slice("https://".length)}`;
  return serverHttpUrl;
}
async function reserveLocalPortCandidate(bindHost) {
  return await new Promise((resolve, reject) => {
    const server = import_node_net.default.createServer();
    server.once("error", (error) => reject(error));
    server.listen(0, bindHost, () => {
      const address = server.address();
      server.close(() => {
        if (!address || typeof address === "string") {
          reject(new Error("Could not resolve reserved local port"));
          return;
        }
        resolve(address.port);
      });
    });
  });
}
async function reserveLocalPort(bindHost = SERVER_BIND_HOST, deps = {}) {
  const reserveCandidate = deps.reserveCandidate ?? reserveLocalPortCandidate;
  for (let attempt = 0; attempt < MAX_PORT_RESERVATION_ATTEMPTS; attempt++) {
    const port = await reserveCandidate(bindHost);
    if (isBrowserSafePort(port)) return port;
    console.error(`[desktop] OS assigned browser-blocked server port ${port}; retrying`);
  }
  throw new Error("Could not reserve a browser-safe local port");
}
function canBindPort(bindHost, port) {
  return new Promise((resolve) => {
    const server = import_node_net.default.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, bindHost, () => {
      server.close(() => resolve(true));
    });
  });
}
async function reserveServerPort(bindHost, preferred) {
  for (const port of preferred) {
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      console.error(`[desktop] preferred server port ${port} is invalid; skipping`);
      continue;
    }
    if (!isBrowserSafePort(port)) {
      console.error(`[desktop] preferred server port ${port} is blocked by browser fetch; skipping`);
      continue;
    }
    if (await canBindPort(bindHost, port)) return port;
    console.error(`[desktop] preferred server port ${port} unavailable`);
  }
  return await reserveLocalPort(bindHost);
}
function claudeConfigDir(env = process.env, homeDir = import_node_os.default.homedir()) {
  return env.CLAUDE_CONFIG_DIR || import_node_path.default.join(homeDir, ".claude");
}
function electronHostDiagnosticsFile(env = process.env, homeDir = import_node_os.default.homedir()) {
  return import_node_path.default.join(claudeConfigDir(env, homeDir), "cc-haha", "diagnostics", "electron-host.log");
}
function parseH5FixedPort(contents) {
  let value;
  try {
    value = JSON.parse(contents);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const h5Access = value.h5Access;
  if (!h5Access || typeof h5Access !== "object") return null;
  const port = h5Access.fixedPort;
  if (typeof port !== "number" || !Number.isInteger(port)) return null;
  return port >= MIN_FIXED_PORT && port <= MAX_FIXED_PORT && isBrowserSafePort(port) ? port : null;
}
function readH5FixedPort(env = process.env) {
  try {
    const settingsPath = import_node_path.default.join(claudeConfigDir(env), "cc-haha", "settings.json");
    return parseH5FixedPort((0, import_node_fs.readFileSync)(settingsPath, "utf-8"));
  } catch {
    return null;
  }
}
function readLastServerPort(env = process.env) {
  try {
    const statePath = import_node_path.default.join(claudeConfigDir(env), SERVER_STATE_FILE);
    const state = JSON.parse((0, import_node_fs.readFileSync)(statePath, "utf-8"));
    if (!state || typeof state !== "object") return null;
    const port = state.lastPort;
    if (typeof port !== "number" || !Number.isInteger(port)) return null;
    return isBrowserSafePort(port) ? port : null;
  } catch {
    return null;
  }
}
function writeLastServerPort(port, env = process.env) {
  try {
    const dir = claudeConfigDir(env);
    (0, import_node_fs.mkdirSync)(dir, { recursive: true });
    (0, import_node_fs.writeFileSync)(import_node_path.default.join(dir, SERVER_STATE_FILE), `${JSON.stringify({ lastPort: port }, null, 2)}
`, "utf-8");
  } catch (error) {
    console.error("[desktop] failed to persist server state", error);
  }
}
function preferredServerPorts(env = process.env) {
  const ports = [];
  const fixedPort = readH5FixedPort(env);
  if (fixedPort !== null) ports.push(fixedPort);
  const lastPort = readLastServerPort(env);
  if (lastPort !== null && !ports.includes(lastPort)) ports.push(lastPort);
  return ports;
}
async function waitForServer(host, port, timeoutMs = SERVER_STARTUP_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  const healthUrl = `http://${host}:${port}/health`;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      await assertServerHealth(healthUrl, Math.min(500, Math.max(100, deadline - Date.now())));
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
    await sleep(150);
  }
  const reason = lastError ? `: ${lastError.message}` : "";
  throw new Error(`desktop server did not report healthy at ${healthUrl} within ${Math.round(timeoutMs / 1e3)} seconds${reason}`);
}
async function assertServerHealth(healthUrl, timeoutMs) {
  await new Promise((resolve, reject) => {
    const request = import_node_http.default.get(healthUrl, {
      agent: false,
      headers: {
        Accept: "application/json",
        Connection: "close"
      }
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      response.on("error", reject);
      response.on("end", () => {
        if (response.statusCode === void 0 || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`healthcheck returned ${response.statusCode ?? "no status"}`));
          return;
        }
        const contentType = response.headers["content-type"] ?? "";
        if (!contentType.toLowerCase().includes("application/json")) {
          reject(new Error(`healthcheck returned non-JSON response from ${healthUrl}`));
          return;
        }
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          if (!body || typeof body !== "object" || !("status" in body) || body.status !== "ok") {
            reject(new Error(`healthcheck returned invalid response from ${healthUrl}`));
            return;
          }
          resolve();
        } catch {
          reject(new Error(`healthcheck returned invalid response from ${healthUrl}`));
        }
      });
    });
    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`healthcheck timed out after ${timeoutMs}ms`));
    });
    request.on("error", reject);
  });
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function pushStartupLog(logs, line) {
  const trimmed = sanitizeHostDiagnostic(line, import_node_os.default.homedir());
  if (!trimmed) return;
  if (logs.length >= SERVER_STARTUP_LOG_LIMIT) logs.shift();
  logs.push(trimmed);
}
function appendHostDiagnostic(filePath, line, { homeDir = import_node_os.default.homedir() } = {}) {
  if (!filePath) return;
  const tempPath = `${filePath}.${process.pid}.${(0, import_node_crypto.randomUUID)()}.tmp`;
  let tempDescriptor;
  try {
    const sanitized = sanitizeHostDiagnostic(line, homeDir);
    if (!sanitized) return;
    const diagnosticsDir = import_node_path.default.dirname(filePath);
    ensurePrivateHostDiagnosticsDirectory(diagnosticsDir);
    assertRegularHostDiagnosticsFileOrMissing(filePath);
    const existing = readHostDiagnosticsTail(filePath);
    const lines = existing.trimEnd() ? existing.trimEnd().split("\n").map((entry) => sanitizeHostDiagnostic(entry, homeDir)).filter(Boolean) : [];
    lines.push(sanitized);
    const boundedLines = [];
    let retainedBytes = 0;
    for (const entry of lines.slice(-HOST_DIAGNOSTICS_LINE_LIMIT).reverse()) {
      const entryBytes = Buffer.byteLength(entry, "utf-8") + 1;
      if (retainedBytes + entryBytes > HOST_DIAGNOSTICS_BYTE_LIMIT) break;
      boundedLines.unshift(entry);
      retainedBytes += entryBytes;
    }
    const noFollow = process.platform === "win32" ? 0 : import_node_fs.constants.O_NOFOLLOW;
    tempDescriptor = (0, import_node_fs.openSync)(
      tempPath,
      import_node_fs.constants.O_CREAT | import_node_fs.constants.O_EXCL | import_node_fs.constants.O_WRONLY | noFollow,
      384
    );
    if (!(0, import_node_fs.fstatSync)(tempDescriptor).isFile()) {
      throw new Error(`Refusing non-regular Electron diagnostics file: ${tempPath}`);
    }
    if (process.platform !== "win32") (0, import_node_fs.fchmodSync)(tempDescriptor, 384);
    (0, import_node_fs.writeFileSync)(tempDescriptor, `${boundedLines.join("\n")}
`, "utf-8");
    (0, import_node_fs.closeSync)(tempDescriptor);
    tempDescriptor = void 0;
    ensurePrivateHostDiagnosticsDirectory(diagnosticsDir);
    assertRegularHostDiagnosticsFileOrMissing(filePath);
    (0, import_node_fs.renameSync)(tempPath, filePath);
  } catch {
    if (tempDescriptor !== void 0) {
      try {
        (0, import_node_fs.closeSync)(tempDescriptor);
      } catch {
      }
    }
    try {
      (0, import_node_fs.rmSync)(tempPath, { force: true });
    } catch {
    }
    console.error("[desktop] failed to persist Electron host diagnostics");
  }
}
function ensurePrivateHostDiagnosticsDirectory(directory) {
  const parent = import_node_path.default.dirname(directory);
  const rootBoundary = import_node_path.default.basename(directory) === "diagnostics" && import_node_path.default.basename(parent) === "cc-haha" ? import_node_path.default.dirname(parent) : parent;
  (0, import_node_fs.mkdirSync)(rootBoundary, { recursive: true, mode: 448 });
  const boundaryStats = (0, import_node_fs.lstatSync)(rootBoundary);
  if (!boundaryStats.isDirectory() && !boundaryStats.isSymbolicLink() || boundaryStats.isSymbolicLink() && !(0, import_node_fs.statSync)(rootBoundary).isDirectory()) {
    throw new Error(`Refusing non-directory Electron diagnostics root: ${rootBoundary}`);
  }
  const rootRealPath = (0, import_node_fs.realpathSync)(rootBoundary);
  const relative = import_node_path.default.relative(rootBoundary, directory);
  if (relative === ".." || relative.startsWith(`..${import_node_path.default.sep}`) || import_node_path.default.isAbsolute(relative)) {
    throw new Error(`Refusing Electron diagnostics directory outside its managed root: ${directory}`);
  }
  let current = rootBoundary;
  for (const segment of relative.split(import_node_path.default.sep).filter(Boolean)) {
    current = import_node_path.default.join(current, segment);
    let stats;
    try {
      stats = (0, import_node_fs.lstatSync)(current);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      try {
        (0, import_node_fs.mkdirSync)(current, { mode: 448 });
      } catch (mkdirError) {
        if (mkdirError.code !== "EEXIST") throw mkdirError;
      }
      stats = (0, import_node_fs.lstatSync)(current);
    }
    if (stats.isSymbolicLink()) {
      throw new Error(`Refusing symbolic link for Electron diagnostics directory: ${current}`);
    }
    if (!stats.isDirectory()) {
      throw new Error(`Refusing non-directory Electron diagnostics path: ${current}`);
    }
    const currentRealPath = (0, import_node_fs.realpathSync)(current);
    const realRelative = import_node_path.default.relative(rootRealPath, currentRealPath);
    if (realRelative === ".." || realRelative.startsWith(`..${import_node_path.default.sep}`) || import_node_path.default.isAbsolute(realRelative)) {
      throw new Error(`Refusing Electron diagnostics directory outside its managed root: ${current}`);
    }
  }
  const finalStats = (0, import_node_fs.lstatSync)(directory);
  if (finalStats.isSymbolicLink() || !finalStats.isDirectory()) {
    throw new Error(`Refusing unsafe Electron diagnostics directory: ${directory}`);
  }
  if (process.platform !== "win32") {
    const descriptor = (0, import_node_fs.openSync)(
      directory,
      import_node_fs.constants.O_RDONLY | import_node_fs.constants.O_DIRECTORY | import_node_fs.constants.O_NOFOLLOW
    );
    try {
      if (!(0, import_node_fs.fstatSync)(descriptor).isDirectory()) {
        throw new Error(`Refusing non-directory Electron diagnostics path: ${directory}`);
      }
      (0, import_node_fs.fchmodSync)(descriptor, 448);
    } finally {
      (0, import_node_fs.closeSync)(descriptor);
    }
  }
}
function assertRegularHostDiagnosticsFileOrMissing(filePath) {
  try {
    const stats = (0, import_node_fs.lstatSync)(filePath);
    if (stats.isSymbolicLink()) {
      throw new Error(`Refusing symbolic link for Electron diagnostics file: ${filePath}`);
    }
    if (!stats.isFile()) {
      throw new Error(`Refusing non-regular Electron diagnostics file: ${filePath}`);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
function readHostDiagnosticsTail(filePath) {
  let descriptor;
  try {
    const noFollow = process.platform === "win32" ? 0 : import_node_fs.constants.O_NOFOLLOW;
    descriptor = (0, import_node_fs.openSync)(filePath, import_node_fs.constants.O_RDONLY | noFollow);
    const size = (0, import_node_fs.fstatSync)(descriptor).size;
    const length = Math.min(size, HOST_DIAGNOSTICS_BYTE_LIMIT);
    const buffer = Buffer.alloc(length);
    const bytesRead = (0, import_node_fs.readSync)(descriptor, buffer, 0, length, size - length);
    const tail = buffer.subarray(0, bytesRead).toString("utf-8");
    if (size <= length) return tail;
    const firstNewline = tail.indexOf("\n");
    return firstNewline >= 0 ? tail.slice(firstNewline + 1) : "";
  } catch {
    return "";
  } finally {
    if (descriptor !== void 0) (0, import_node_fs.closeSync)(descriptor);
  }
}
function sanitizeHostDiagnostic(line, homeDir = import_node_os.default.homedir()) {
  let sanitized = line.replace(/[\r\n]+/g, " ").replace(/https?:\/\/[^\s<>"')\]}]+/gi, (candidate) => sanitizeUrlUserinfo(candidate)).replace(/\bBearer\s+[^\s,;]+/gi, "Bearer [REDACTED]").replace(
    /\b((?:(?:[a-z0-9]+_)*(?:api[_-]?key|auth[_-]?token|access[_-]?token|refresh[_-]?token|session[_-]?token|password|secret))\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
    "$1[REDACTED]"
  ).replace(/\b(?:sk-(?:ant-api03-|proj-)?|ghp_)[A-Za-z0-9_-]{8,}\b/g, "[REDACTED]").trimEnd();
  if (homeDir) sanitized = sanitized.replaceAll(homeDir, "[HOME]");
  return truncateUtf8(sanitized, HOST_DIAGNOSTICS_LINE_BYTE_LIMIT);
}
function truncateUtf8(value, maxBytes) {
  const buffer = Buffer.from(value, "utf-8");
  if (buffer.byteLength <= maxBytes) return value;
  return buffer.subarray(0, maxBytes).toString("utf-8").replace(/\uFFFD$/, "");
}
function sanitizeUrlUserinfo(candidate) {
  try {
    const url = new URL(candidate);
    if (!url.username && !url.password) return candidate;
    return `${url.protocol}//[REDACTED]@${url.host}${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "[REDACTED_URL]";
  }
}
function formatStartupError(message, logs) {
  const logText = logs.length > 0 ? logs.join("\n") : "No server stdout/stderr was captured before the timeout.";
  return `${message}

Recent server logs:
${logText}`;
}
function clearProxyEnv(baseEnv) {
  const env = { ...baseEnv };
  for (const key of PROXY_ENV_KEYS) delete env[key];
  delete env[SYSTEM_PROXY_BRIDGE_ENV];
  delete env[SYSTEM_PROXY_ERROR_ENV];
  const noProxy = mergeLoopbackNoProxy(env.no_proxy || env.NO_PROXY);
  return { ...env, NO_PROXY: noProxy, no_proxy: noProxy };
}
function withSystemProxyBridgeEnv(baseEnv, bridgeUrl) {
  return {
    ...clearProxyEnv(baseEnv),
    [SYSTEM_PROXY_BRIDGE_ENV]: bridgeUrl
  };
}
function withSystemProxyErrorEnv(baseEnv, error) {
  const message = error instanceof Error ? error.message : String(error);
  const sanitized = sanitizeHostDiagnostic(message).replace(/\s+/g, " ").trim() || "unknown bridge startup error";
  return {
    ...clearProxyEnv(baseEnv),
    [SYSTEM_PROXY_ERROR_ENV]: `System proxy bridge unavailable: ${sanitized}`
  };
}
function withAdapterProxyBridgeEnv(baseEnv, bridgeUrl) {
  const env = clearProxyEnv(baseEnv);
  return {
    ...env,
    HTTP_PROXY: bridgeUrl,
    HTTPS_PROXY: bridgeUrl,
    http_proxy: bridgeUrl,
    https_proxy: bridgeUrl,
    ALL_PROXY: bridgeUrl,
    all_proxy: bridgeUrl
  };
}
function mergeLoopbackNoProxy(existing) {
  const entries = (existing ?? "").split(/[,\s]+/).map((entry) => entry.trim()).filter(Boolean);
  const lowerEntries = new Set(entries.map((entry) => entry.toLowerCase()));
  for (const entry of LOOPBACK_NO_PROXY_ENTRIES) {
    if (!lowerEntries.has(entry.toLowerCase())) entries.push(entry);
  }
  return entries.join(",");
}
var POWERSHELL_PATH_OVERRIDE_ENV = "CLAUDE_CODE_POWERSHELL_PATH";
function windowsPowerShellOverride(shellPath, platform = process.platform) {
  var _a;
  if (platform !== "win32") return null;
  const trimmed = shellPath == null ? void 0 : shellPath.trim();
  if (!trimmed) return null;
  const base = (_a = trimmed.split(/[\\/]/).pop()) == null ? void 0 : _a.toLowerCase().replace(/\.exe$/, "");
  return base === "pwsh" || base === "powershell" ? trimmed : null;
}
function buildSidecarEnv(baseEnv, h5DistDir) {
  const env = {
    ...baseEnv,
    CLAUDE_H5_AUTO_PUBLIC_URL: "1",
    CLAUDE_H5_DIST_DIR: h5DistDir
  };
  const configDir = baseEnv.CLAUDE_CONFIG_DIR;
  if (configDir) {
    const cacheDir = import_node_path.default.join(configDir, "Cache");
    (0, import_node_fs.mkdirSync)(cacheDir, { recursive: true });
    env.CLAUDE_CONFIG_DIR = configDir;
    env.XDG_CACHE_HOME = cacheDir;
  }
  return env;
}
function createServerPlan({
  desktopRoot,
  appRoot: appRoot2,
  port,
  bindHost = SERVER_BIND_HOST,
  h5DistDir = import_node_path.default.join(desktopRoot, "dist"),
  env = process.env
}) {
  if (!hasCompiledSidecar(desktopRoot)) {
    const serverScript = resolveServerScript(desktopRoot, env);
    if (serverScript) {
      return {
        command: resolveNodeRuntimeExecutable(env, desktopRoot),
        args: [
          ...nodeRuntimeFlags(resolveNodeRuntimeExecutable(env, desktopRoot)),
          serverScript,
          "server",
          "--app-root",
          appRoot2,
          "--host",
          bindHost,
          "--port",
          String(port)
        ],
        env: {
          ...buildSidecarEnv(withBundledRipgrepPath(env, desktopRoot), h5DistDir),
          CLAUDE_APP_ROOT: appRoot2
        }
      };
    }
  }
  return {
    command: resolveSidecarExecutable(desktopRoot),
    args: ["server", "--app-root", appRoot2, "--host", bindHost, "--port", String(port)],
    env: buildSidecarEnv(withBundledRipgrepPath(env, desktopRoot), h5DistDir)
  };
}
function createAdapterPlan({
  desktopRoot,
  appRoot: appRoot2,
  serverUrl,
  flag,
  h5DistDir = import_node_path.default.join(desktopRoot, "dist"),
  env = process.env
}) {
  if (!hasCompiledSidecar(desktopRoot)) {
    const adaptersScript = resolveAdaptersScript(desktopRoot, env);
    if (adaptersScript) {
      return {
        command: resolveNodeRuntimeExecutable(env, desktopRoot),
        args: [
          ...nodeRuntimeFlags(resolveNodeRuntimeExecutable(env, desktopRoot)),
          adaptersScript,
          "--app-root",
          appRoot2,
          flag
        ],
        env: {
          ...buildSidecarEnv(withBundledRipgrepPath(env, desktopRoot), h5DistDir),
          CLAUDE_APP_ROOT: appRoot2,
          ADAPTER_SERVER_URL: httpToWebSocketUrl(serverUrl)
        }
      };
    }
  }
  return {
    command: resolveSidecarExecutable(desktopRoot),
    args: ["adapters", "--app-root", appRoot2, flag],
    env: {
      ...buildSidecarEnv(withBundledRipgrepPath(env, desktopRoot), h5DistDir),
      ADAPTER_SERVER_URL: httpToWebSocketUrl(serverUrl)
    }
  };
}
function spawnSidecar(plan, deps = {}) {
  const exists = deps.existsSyncFn ?? import_node_fs.existsSync;
  const isPathResolved = plan.command.includes("/") || plan.command.includes("\\");
  if (isPathResolved && !exists(plan.command)) {
    throw new Error(`Electron sidecar binary not found: ${plan.command}. Run "cd desktop && bun run build:sidecars" first.`);
  }
  return (deps.spawnFn ?? import_node_child_process.spawn)(plan.command, plan.args, {
    env: plan.env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
}
function getWindowsEnv(env, name) {
  var _a;
  const normalizedName = name.toLowerCase();
  return (_a = Object.entries(env).find(([key, value]) => key.toLowerCase() === normalizedName && value)) == null ? void 0 : _a[1];
}
function resolveWindowsTaskkillExecutable(env = process.env) {
  const systemRoot = getWindowsEnv(env, "SystemRoot") ?? getWindowsEnv(env, "windir");
  return systemRoot ? import_node_path.default.win32.join(systemRoot, "System32", "taskkill.exe") : "taskkill.exe";
}
function fallbackToDirectSidecarKill(child, error) {
  console.error("[desktop] taskkill failed; falling back to direct sidecar termination", error);
  try {
    child.kill();
  } catch (fallbackError) {
    console.error("[desktop] direct sidecar termination failed", fallbackError);
  }
}
function killSidecar(child, sync = false, deps = {}) {
  const platform = deps.platform ?? process.platform;
  if (platform === "win32" && child.pid) {
    const command = resolveWindowsTaskkillExecutable(deps.env);
    const args = ["/F", "/T", "/PID", String(child.pid)];
    const options = { stdio: "ignore", windowsHide: true };
    if (sync) {
      try {
        const result = (deps.spawnSyncFn ?? import_node_child_process.spawnSync)(command, args, options);
        if (result.error) fallbackToDirectSidecarKill(child, result.error);
      } catch (error) {
        fallbackToDirectSidecarKill(child, error);
      }
    } else {
      try {
        const killer = (deps.spawnAsync ?? import_node_child_process.spawn)(command, args, options);
        killer.once("error", (error) => fallbackToDirectSidecarKill(child, error));
      } catch (error) {
        fallbackToDirectSidecarKill(child, error);
      }
    }
    return;
  }
  child.kill();
}

// electron/services/terminal.ts
var import_node_child_process2 = require("node:child_process");
var import_tree_kill = __toESM(require_tree_kill(), 1);
var import_node_crypto2 = require("node:crypto");
var import_node_fs2 = __toESM(require("node:fs"), 1);
var import_node_module = require("node:module");
var import_node_os2 = __toESM(require("node:os"), 1);
var import_node_path2 = __toESM(require("node:path"), 1);
var import_node_process = __toESM(require("node:process"), 1);
var TERMINAL_CONFIG_FILE = "terminal-config.json";
var MIN_TERMINAL_COLS = 20;
var MIN_TERMINAL_ROWS = 8;
var NODE_PTY_MANIFEST_FILE = ".cc-haha-node-pty-manifest.json";
var MACOS_DOWNLOAD_XATTRS = ["com.apple.quarantine", "com.apple.provenance"];
var isRecord2 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
function sendTerminalEvent(webContents, channel, payload) {
  if (webContents.isDestroyed()) return;
  try {
    webContents.send(channel, payload);
  } catch (error) {
    if (error instanceof Error && error.message === "Object has been destroyed") return;
    throw error;
  }
}
var preparedNodePtyDirs = /* @__PURE__ */ new Set();
function terminalConfigPath(app2, env = import_node_process.default.env) {
  var _a;
  const portableDir = (_a = env.CLAUDE_CONFIG_DIR) == null ? void 0 : _a.trim();
  if (portableDir) {
    return import_node_path2.default.join(portableDir, TERMINAL_CONFIG_FILE);
  }
  if (!app2) return null;
  return import_node_path2.default.join(app2.getPath("home"), ".claude", TERMINAL_CONFIG_FILE);
}
function claudeConfigDir2(env = import_node_process.default.env, platform = import_node_process.default.platform) {
  var _a;
  const portableDir = (_a = env.CLAUDE_CONFIG_DIR) == null ? void 0 : _a.trim();
  if (portableDir) return portableDir;
  const home = platform === "win32" ? env.USERPROFILE || import_node_os2.default.homedir() : env.HOME || import_node_os2.default.homedir();
  return home ? import_node_path2.default.join(home, ".claude") : null;
}
function desktopTerminalSettingsPath(env = import_node_process.default.env, platform = import_node_process.default.platform) {
  const dir = claudeConfigDir2(env, platform);
  return dir ? import_node_path2.default.join(dir, "settings.json") : null;
}
function normalizeTerminalBashPath(value, isFile = (filePath) => {
  try {
    return import_node_fs2.default.statSync(filePath).isFile();
  } catch {
    return false;
  }
}) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return null;
  if (!isFile(trimmed)) {
    throw new Error(`terminal bash path does not exist: ${trimmed}`);
  }
  return trimmed;
}
function defaultShell(platform = import_node_process.default.platform, env = import_node_process.default.env, customBashPath = null, fileExists = import_node_fs2.default.existsSync) {
  if (platform === "win32") {
    const bashPath = typeof customBashPath === "string" ? customBashPath.trim() : "";
    if (bashPath && fileExists(bashPath)) return bashPath;
    return env.COMSPEC || "powershell.exe";
  }
  return env.SHELL || (fileExists("/bin/zsh") ? "/bin/zsh" : "/bin/bash");
}
function resolveDesktopTerminalShell(platform, config) {
  if (platform !== "win32" || !config) return null;
  const startupShell = typeof config.startupShell === "string" ? config.startupShell.trim() : void 0;
  switch (startupShell) {
    case void 0:
    case "":
    case "system":
      return null;
    case "pwsh":
      return "pwsh.exe";
    case "powershell":
      return "powershell.exe";
    case "cmd":
      return "cmd.exe";
    case "custom": {
      const customShellPath = typeof config.customShellPath === "string" ? config.customShellPath.trim() : "";
      if (!customShellPath) throw new Error("custom terminal shell path is empty");
      return customShellPath;
    }
    default:
      return null;
  }
}
function ensureUtf8Locale(env, platform = import_node_process.default.platform) {
  const fallback = platform === "darwin" ? "en_US.UTF-8" : "C.UTF-8";
  for (const key of ["LANG", "LC_CTYPE", "LC_ALL"]) {
    const value = env[key];
    if (!value || !value.trim().toLowerCase().replace(/-/g, "").includes("utf8")) {
      env[key] = fallback;
    }
  }
  return env;
}
function parseEnvBlock(buffer) {
  const env = {};
  for (const entry of buffer.toString("utf8").split("\0")) {
    if (!entry) continue;
    const equals = entry.indexOf("=");
    if (equals <= 0) continue;
    env[entry.slice(0, equals)] = entry.slice(equals + 1);
  }
  return env;
}
function loginShellEnvironment(shell, platform = import_node_process.default.platform) {
  if (platform === "win32") return {};
  try {
    const stdout = (0, import_node_child_process2.execFileSync)(shell, ["-l", "-c", "env -0"], {
      encoding: "buffer",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2e3
    });
    return parseEnvBlock(stdout);
  } catch {
    return {};
  }
}
function terminalEnvironment(shell, platform = import_node_process.default.platform, env = import_node_process.default.env) {
  const merged = {};
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") merged[key] = value;
  }
  Object.assign(merged, loginShellEnvironment(shell, platform));
  return ensureUtf8Locale(merged, platform);
}
function readDesktopTerminalConfig(env = import_node_process.default.env, platform = import_node_process.default.platform) {
  const settingsPath = desktopTerminalSettingsPath(env, platform);
  if (!settingsPath) return null;
  try {
    const parsed = JSON.parse(import_node_fs2.default.readFileSync(settingsPath, "utf8"));
    if (!isRecord2(parsed) || !isRecord2(parsed.desktopTerminal)) return null;
    const startupShell = typeof parsed.desktopTerminal.startupShell === "string" ? parsed.desktopTerminal.startupShell : null;
    const customShellPath = typeof parsed.desktopTerminal.customShellPath === "string" ? parsed.desktopTerminal.customShellPath : null;
    const normalizedStartupShell = (startupShell == null ? void 0 : startupShell.trim()) ?? "";
    if (!["", "system", "pwsh", "powershell", "cmd", "custom"].includes(normalizedStartupShell)) {
      return null;
    }
    if (normalizedStartupShell === "custom" && !(customShellPath == null ? void 0 : customShellPath.trim())) {
      return null;
    }
    return {
      startupShell,
      customShellPath
    };
  } catch {
    return null;
  }
}
function loadTerminalConfig(app2, env) {
  const configPath = terminalConfigPath(app2, env);
  if (!configPath) return {};
  const candidates = [configPath];
  if (app2 && !env.CLAUDE_CONFIG_DIR) {
    candidates.push(import_node_path2.default.join(app2.getPath("userData"), TERMINAL_CONFIG_FILE));
  }
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(import_node_fs2.default.readFileSync(candidate, "utf8"));
      if (!isRecord2(parsed)) continue;
      const config = { ...parsed };
      if (typeof config.bash_path !== "string" && config.bash_path !== null) {
        delete config.bash_path;
      }
      return config;
    } catch {
    }
  }
  return {};
}
function saveTerminalConfig(app2, env, config) {
  const configPath = terminalConfigPath(app2, env);
  if (!configPath) throw new Error("terminal config path is unavailable");
  import_node_fs2.default.mkdirSync(import_node_path2.default.dirname(configPath), { recursive: true });
  import_node_fs2.default.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
function resolveTerminalCwd(cwd, env = import_node_process.default.env, currentDirectory = import_node_process.default.cwd) {
  const trimmed = cwd == null ? void 0 : cwd.trim();
  const resolved = trimmed || env.CLAUDE_CONFIG_DIR || env.HOME || env.USERPROFILE || currentDirectory();
  let isDirectory = false;
  try {
    isDirectory = import_node_fs2.default.statSync(resolved).isDirectory();
  } catch {
    isDirectory = false;
  }
  if (!isDirectory) {
    throw new Error(`terminal cwd does not exist: ${resolved}`);
  }
  return resolved;
}
function ensureNodePtyHelpersExecutable(moduleDir) {
  const prebuildsDir = import_node_path2.default.join(moduleDir, "prebuilds");
  if (!import_node_fs2.default.existsSync(prebuildsDir)) return;
  for (const platformDir of import_node_fs2.default.readdirSync(prebuildsDir)) {
    const helperPath = import_node_path2.default.join(prebuildsDir, platformDir, "spawn-helper");
    if (!import_node_fs2.default.existsSync(helperPath)) continue;
    const stat = import_node_fs2.default.statSync(helperPath);
    if (!stat.isFile()) continue;
    import_node_fs2.default.chmodSync(helperPath, 320);
  }
}
function walkNodePtyFiles(rootDir) {
  const results = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    let entries = [];
    try {
      entries = import_node_fs2.default.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = import_node_path2.default.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name !== NODE_PTY_MANIFEST_FILE) {
        results.push(fullPath);
      }
    }
  }
  return results.sort();
}
function hashFile(filePath) {
  return (0, import_node_crypto2.createHash)("sha256").update(import_node_fs2.default.readFileSync(filePath)).digest("hex");
}
function buildNodePtyManifest(moduleDir) {
  return {
    version: 1,
    files: walkNodePtyFiles(moduleDir).map((filePath) => ({
      path: import_node_path2.default.relative(moduleDir, filePath).replaceAll(import_node_path2.default.sep, "/"),
      sha256: hashFile(filePath)
    }))
  };
}
function manifestsEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function readNodePtyManifest(moduleDir) {
  try {
    const parsed = JSON.parse(import_node_fs2.default.readFileSync(import_node_path2.default.join(moduleDir, NODE_PTY_MANIFEST_FILE), "utf8"));
    if (parsed.version !== 1 || !Array.isArray(parsed.files)) return null;
    return parsed;
  } catch {
    return null;
  }
}
function writeNodePtyManifest(moduleDir, manifest) {
  import_node_fs2.default.writeFileSync(import_node_path2.default.join(moduleDir, NODE_PTY_MANIFEST_FILE), JSON.stringify(manifest, null, 2), { mode: 384 });
}
function chmodNodePtyDirectories(moduleDir) {
  for (const dir of [import_node_path2.default.dirname(moduleDir), moduleDir]) {
    try {
      import_node_fs2.default.chmodSync(dir, 448);
    } catch {
    }
  }
}
function stripMacosDownloadAttributes(moduleDir) {
  if (import_node_process.default.platform !== "darwin") return;
  for (const attr of MACOS_DOWNLOAD_XATTRS) {
    try {
      (0, import_node_child_process2.execFileSync)("/usr/bin/xattr", ["-dr", attr, moduleDir], { stdio: "ignore" });
    } catch {
    }
  }
  for (const filePath of walkNodePtyFiles(moduleDir)) {
    let originalMode = null;
    try {
      const stat = import_node_fs2.default.statSync(filePath);
      const mode = stat.mode & 511;
      if ((mode & 128) === 0) {
        originalMode = mode;
        import_node_fs2.default.chmodSync(filePath, mode | 128);
      }
      for (const attr of MACOS_DOWNLOAD_XATTRS) {
        try {
          (0, import_node_child_process2.execFileSync)("/usr/bin/xattr", ["-d", attr, filePath], { stdio: "ignore" });
        } catch {
        }
      }
    } catch {
    } finally {
      if (originalMode != null) {
        try {
          import_node_fs2.default.chmodSync(filePath, originalMode);
        } catch {
        }
      }
    }
  }
}
function isNodePtyCacheCurrent(sourceManifest, cacheDir) {
  const cacheManifest = readNodePtyManifest(cacheDir);
  if (!cacheManifest || !manifestsEqual(sourceManifest, cacheManifest)) return false;
  try {
    return manifestsEqual(sourceManifest, buildNodePtyManifest(cacheDir));
  } catch {
    return false;
  }
}
function prepareNodePtyRuntime(sourceDir, cacheDir) {
  if (!import_node_fs2.default.existsSync(import_node_path2.default.join(sourceDir, "package.json"))) {
    throw new Error(`node-pty source directory is missing: ${sourceDir}`);
  }
  const sourceManifest = buildNodePtyManifest(sourceDir);
  if (preparedNodePtyDirs.has(cacheDir) && isNodePtyCacheCurrent(sourceManifest, cacheDir)) {
    stripMacosDownloadAttributes(cacheDir);
    return cacheDir;
  }
  if (!preparedNodePtyDirs.has(cacheDir) && isNodePtyCacheCurrent(sourceManifest, cacheDir)) {
    stripMacosDownloadAttributes(cacheDir);
    preparedNodePtyDirs.add(cacheDir);
    return cacheDir;
  }
  import_node_fs2.default.rmSync(cacheDir, { recursive: true, force: true });
  import_node_fs2.default.mkdirSync(import_node_path2.default.dirname(cacheDir), { recursive: true, mode: 448 });
  import_node_fs2.default.mkdirSync(cacheDir, { recursive: true, mode: 448 });
  import_node_fs2.default.cpSync(sourceDir, cacheDir, { recursive: true });
  stripMacosDownloadAttributes(cacheDir);
  ensureNodePtyHelpersExecutable(cacheDir);
  chmodNodePtyDirectories(cacheDir);
  if (!manifestsEqual(sourceManifest, buildNodePtyManifest(cacheDir))) {
    throw new Error("node-pty runtime cache integrity check failed");
  }
  writeNodePtyManifest(cacheDir, sourceManifest);
  preparedNodePtyDirs.add(cacheDir);
  return cacheDir;
}
async function loadNodePtyFactory(sourceDir, cacheDir) {
  try {
    if (sourceDir && cacheDir) {
      const moduleDir = prepareNodePtyRuntime(sourceDir, cacheDir);
      const requireFromNodePty = (0, import_node_module.createRequire)(import_node_path2.default.join(moduleDir, "package.json"));
      return requireFromNodePty(moduleDir);
    }
    return await import("node-pty");
  } catch (error) {
    if (isLegacyWindows(import_node_process.default.platform)) return createPipePtyFactory();
    throw error;
  }
}
function isLegacyWindows(platform) {
  if (platform !== "win32") return false;
  const [major = -1] = import_node_os2.default.release().split(".").map(Number);
  return !Number.isFinite(major) || major < 10;
}
var PIPE_PTY_NOTICE = "[terminal] node-pty unavailable on this Windows version - using pipe fallback (no full TTY emulation)\r\n";
function createPipePtyFactory() {
  return {
    spawn(shell, args, options) {
      var _a, _b, _c, _d;
      const child = (0, import_node_child_process2.spawn)(shell, args, {
        cwd: options.cwd,
        env: options.env,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true
      });
      const dataListeners = [];
      let exitHandler = null;
      let settled = false;
      const emit = (chunk) => {
        const data = typeof chunk === "string" ? chunk : chunk.toString("utf8");
        for (const listener of dataListeners) listener(data);
      };
      (_a = child.stdout) == null ? void 0 : _a.setEncoding("utf8");
      (_b = child.stdout) == null ? void 0 : _b.on("data", emit);
      (_c = child.stderr) == null ? void 0 : _c.setEncoding("utf8");
      (_d = child.stderr) == null ? void 0 : _d.on("data", emit);
      child.on("exit", (code, signal) => {
        if (settled) return;
        settled = true;
        exitHandler == null ? void 0 : exitHandler({ exitCode: code ?? 1, signal });
      });
      child.on("error", () => {
        if (settled) return;
        settled = true;
        exitHandler == null ? void 0 : exitHandler({ exitCode: 1 });
      });
      queueMicrotask(() => emit(PIPE_PTY_NOTICE));
      return {
        pid: child.pid,
        process: child.spawnfile,
        write(data) {
          var _a2;
          (_a2 = child.stdin) == null ? void 0 : _a2.write(data);
        },
        resize() {
        },
        kill() {
          if (child.pid) {
            (0, import_tree_kill.default)(child.pid, "SIGKILL", () => {
              try {
                child.kill();
              } catch {
              }
            });
            return;
          }
          try {
            child.kill();
          } catch {
          }
        },
        onData(handler) {
          dataListeners.push(handler);
          return dataListeners;
        },
        onExit(handler) {
          exitHandler = handler;
          return child;
        }
      };
    }
  };
}
async function resolvePtyFactory(factory, nodePtySourceDir, nodePtyCacheDir) {
  if (!factory) return loadNodePtyFactory(nodePtySourceDir, nodePtyCacheDir);
  if (typeof factory === "function") return factory();
  return factory;
}
var ElectronTerminalService = class {
  app;
  env;
  platform;
  ptyFactory;
  nodePtySourceDir;
  nodePtyCacheDir;
  fileExists;
  isFile;
  cwd;
  nextSessionId = 1;
  sessions = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    this.app = options.app;
    this.env = options.env ?? import_node_process.default.env;
    this.platform = options.platform ?? import_node_process.default.platform;
    this.ptyFactory = options.ptyFactory;
    this.nodePtySourceDir = options.nodePtySourceDir;
    this.nodePtyCacheDir = options.nodePtyCacheDir;
    this.fileExists = options.fileExists ?? import_node_fs2.default.existsSync;
    this.isFile = options.isFile ?? ((filePath) => {
      try {
        return import_node_fs2.default.statSync(filePath).isFile();
      } catch {
        return false;
      }
    });
    this.cwd = options.cwd ?? import_node_process.default.cwd;
  }
  getBashPath() {
    return loadTerminalConfig(this.app, this.env).bash_path ?? null;
  }
  setBashPath(value) {
    const config = loadTerminalConfig(this.app, this.env);
    config.bash_path = normalizeTerminalBashPath(value, this.isFile);
    saveTerminalConfig(this.app, this.env, config);
  }
  resolveShell() {
    const terminalConfig = loadTerminalConfig(this.app, this.env);
    const systemDefault = defaultShell(
      this.platform,
      this.env,
      terminalConfig.bash_path ?? null,
      this.fileExists
    );
    return resolveDesktopTerminalShell(this.platform, readDesktopTerminalConfig(this.env, this.platform)) ?? systemDefault;
  }
  async spawn(input, webContents) {
    const cols = Math.max(MIN_TERMINAL_COLS, Math.floor(input.cols ?? 80));
    const rows = Math.max(MIN_TERMINAL_ROWS, Math.floor(input.rows ?? 24));
    const cwd = resolveTerminalCwd(input.cwd, this.env, this.cwd);
    const shell = this.resolveShell();
    let rendererDestroyed = webContents.isDestroyed();
    if (rendererDestroyed) throw new Error("terminal renderer is destroyed");
    let sessionId = null;
    let pty = null;
    let ptyDisposed = false;
    const disposePty = () => {
      if (!pty || ptyDisposed) return;
      ptyDisposed = true;
      try {
        pty.kill();
      } catch {
      }
    };
    const onOwnerDestroyed = () => {
      rendererDestroyed = true;
      if (sessionId === null || !pty) return;
      const active = this.sessions.get(sessionId);
      if ((active == null ? void 0 : active.pty) !== pty) return;
      this.sessions.delete(sessionId);
      this.detachOwnerListener(active);
      disposePty();
    };
    const onOwnerNavigated = () => {
      onOwnerDestroyed();
    };
    webContents.once("destroyed", onOwnerDestroyed);
    webContents.on("did-navigate", onOwnerNavigated);
    try {
      const ptyFactory = await resolvePtyFactory(this.ptyFactory, this.nodePtySourceDir, this.nodePtyCacheDir);
      if (rendererDestroyed || webContents.isDestroyed()) {
        throw new Error("terminal renderer is destroyed");
      }
      sessionId = this.nextSessionId++;
      const ptySpawnOptions = {
        name: "xterm-256color",
        cols,
        rows,
        cwd,
        env: {
          ...terminalEnvironment(shell, this.platform, this.env),
          TERM: "xterm-256color",
          COLORTERM: "truecolor"
        }
      };
      if (isLegacyWindows(this.platform)) {
        // ConPTY is a Win10 1809+ OS feature: force the winpty backend that
        // node-pty 1.1.0 still ships (prebuilds/win32-x64 winpty-agent.exe +
        // N-API pty.node) for full TTY emulation on Win7/8.
        ptySpawnOptions.useConpty = false;
      }
      try {
        pty = ptyFactory.spawn(shell, [], ptySpawnOptions);
      } catch (error) {
        if (!isLegacyWindows(this.platform)) throw error;
        pty = createPipePtyFactory().spawn(shell, [], ptySpawnOptions);
      }
      if (rendererDestroyed || webContents.isDestroyed()) {
        disposePty();
        throw new Error("terminal renderer is destroyed");
      }
      const activeSessionId = sessionId;
      const activePty = pty;
      this.sessions.set(activeSessionId, {
        pty: activePty,
        owner: webContents,
        onOwnerDestroyed,
        onOwnerNavigated
      });
      activePty.onData((data) => {
        var _a;
        if (((_a = this.sessions.get(activeSessionId)) == null ? void 0 : _a.pty) !== activePty) return;
        sendTerminalEvent(webContents, ELECTRON_EVENT_CHANNELS.terminalOutput, {
          session_id: activeSessionId,
          data
        });
      });
      activePty.onExit(({ exitCode, signal }) => {
        const active = this.removeSession(activeSessionId, activePty);
        if (!active) return;
        sendTerminalEvent(webContents, ELECTRON_EVENT_CHANNELS.terminalExit, {
          session_id: activeSessionId,
          code: exitCode,
          signal: signal == null ? null : String(signal)
        });
      });
      if (rendererDestroyed || webContents.isDestroyed()) {
        const active = this.removeSession(activeSessionId, activePty);
        if (active) disposePty();
        throw new Error("terminal renderer is destroyed");
      }
      return {
        session_id: activeSessionId,
        shell,
        cwd
      };
    } catch (error) {
      if (sessionId !== null && pty) {
        const active = this.removeSession(sessionId, pty);
        if (active) disposePty();
      }
      webContents.removeListener("destroyed", onOwnerDestroyed);
      webContents.off("did-navigate", onOwnerNavigated);
      throw error;
    }
  }
  write(sessionId, data, owner) {
    this.getSession(sessionId, owner).pty.write(data);
  }
  resize(sessionId, cols, rows, owner) {
    this.getSession(sessionId, owner).pty.resize(
      Math.max(MIN_TERMINAL_COLS, Math.floor(cols)),
      Math.max(MIN_TERMINAL_ROWS, Math.floor(rows))
    );
  }
  kill(sessionId, owner) {
    const session2 = this.sessions.get(sessionId);
    if (!session2) return;
    this.assertSessionOwner(session2, owner);
    this.stopSession(sessionId, session2);
  }
  killAll() {
    for (const [sessionId, session2] of Array.from(this.sessions.entries())) {
      this.stopSession(sessionId, session2);
    }
  }
  getSession(sessionId, owner) {
    const session2 = this.sessions.get(sessionId);
    if (!session2) throw new Error("terminal session is not running");
    this.assertSessionOwner(session2, owner);
    return session2;
  }
  assertSessionOwner(session2, owner) {
    if (session2.owner !== owner) {
      throw new Error("terminal session is owned by another renderer");
    }
  }
  detachOwnerListener(session2) {
    session2.owner.removeListener("destroyed", session2.onOwnerDestroyed);
    session2.owner.off("did-navigate", session2.onOwnerNavigated);
  }
  removeSession(sessionId, expectedPty) {
    const session2 = this.sessions.get(sessionId);
    if (!session2 || session2.pty !== expectedPty) return null;
    this.sessions.delete(sessionId);
    this.detachOwnerListener(session2);
    return session2;
  }
  stopSession(sessionId, session2) {
    if (!this.removeSession(sessionId, session2.pty)) return;
    session2.pty.kill();
  }
};

// electron/services/systemProxyBridge.ts
var import_node_http2 = __toESM(require("node:http"), 1);
var import_node_https = __toESM(require("node:https"), 1);
var import_node_net2 = __toESM(require("node:net"), 1);
var import_node_tls = __toESM(require("node:tls"), 1);
var import_promises = require("node:dns/promises");
var import_promises2 = require("node:stream/promises");
var SYSTEM_PROXY_BRIDGE_HOST = "127.0.0.1";
var CONNECT_TIMEOUT_MS = 1e4;
var MAX_BUFFERED_REQUEST_BYTES = 32 * 1024 * 1024;
function parseSystemProxyRules(rules) {
  if (!(rules == null ? void 0 : rules.trim())) return [{ type: "direct" }];
  const parsed = [];
  for (const rawRule of rules.split(";")) {
    const rule = rawRule.trim();
    if (!rule) continue;
    if (/^DIRECT$/i.test(rule)) {
      parsed.push({ type: "direct" });
      continue;
    }
    const match = rule.match(/^(PROXY|HTTPS|SOCKS|SOCKS4|SOCKS5)\s+(.+)$/i);
    if (!match) continue;
    const endpoint = parseEndpoint(match[2]);
    if (!endpoint) continue;
    const kind = match[1].toUpperCase();
    parsed.push({
      type: kind === "PROXY" ? "http" : kind === "HTTPS" ? "https" : kind === "SOCKS4" ? "socks4" : kind === "SOCKS5" ? "socks5" : "socks4",
      ...endpoint
    });
  }
  return parsed;
}
var SystemProxyBridge = class {
  constructor(resolveSystemProxy) {
    this.resolveSystemProxy = resolveSystemProxy;
  }
  server = null;
  startPromise = null;
  lifecycleGeneration = 0;
  clientSockets = /* @__PURE__ */ new Set();
  outboundSockets = /* @__PURE__ */ new Set();
  start() {
    if (this.startPromise) return this.startPromise;
    const generation = ++this.lifecycleGeneration;
    this.startPromise = this.startOnce(generation);
    return this.startPromise;
  }
  async stop() {
    ++this.lifecycleGeneration;
    const startPromise = this.startPromise;
    this.startPromise = null;
    const server = this.server;
    this.server = null;
    for (const socket of this.clientSockets) socket.destroy();
    for (const socket of this.outboundSockets) socket.destroy();
    if (server == null ? void 0 : server.listening) server.closeAllConnections();
    const closing = (server == null ? void 0 : server.listening) ? new Promise((resolve) => server.close(() => resolve())) : Promise.resolve();
    await closing;
    await (startPromise == null ? void 0 : startPromise.catch(() => {
    }));
  }
  async startOnce(generation) {
    const server = import_node_http2.default.createServer((request, response) => {
      void this.handleHttpRequest(request, response);
    });
    server.on("connect", (request, clientSocket, head) => {
      void this.handleConnect(request, clientSocket, head);
    });
    server.on("clientError", (_error, socket) => {
      socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
    });
    server.on("connection", (socket) => {
      this.clientSockets.add(socket);
      socket.once("close", () => this.clientSockets.delete(socket));
    });
    this.server = server;
    try {
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, SYSTEM_PROXY_BRIDGE_HOST, () => {
          server.off("error", reject);
          resolve();
        });
      });
    } catch (error) {
      if (this.server === server) this.server = null;
      throw error;
    }
    if (generation !== this.lifecycleGeneration || this.server !== server) {
      await closeServer(server);
      throw new Error("System proxy bridge startup was stopped");
    }
    const address = server.address();
    if (!address || typeof address === "string") {
      if (this.server === server) this.server = null;
      await closeServer(server);
      throw new Error("Could not resolve system proxy bridge port");
    }
    return `http://${SYSTEM_PROXY_BRIDGE_HOST}:${address.port}`;
  }
  async handleHttpRequest(request, response) {
    try {
      const target = resolveHttpTarget(request);
      if (target.protocol !== "http:") {
        response.writeHead(400, { Connection: "close" });
        response.end("HTTPS proxy requests must use CONNECT");
        return;
      }
      const rules = await this.resolveRules(target);
      const method = request.method ?? "GET";
      const headers = sanitizeProxyRequestHeaders(request.headers);
      const onSocket = (socket) => this.trackOutboundSocket(socket);
      const upstreamResponse = isReplaySafeMethod(method) ? await requestUsingRules(
        rules,
        target,
        method,
        headers,
        await readRequestBody(request),
        onSocket
      ) : await requestStreamingUsingRule(
        await selectReachableRule(rules, target),
        target,
        method,
        headers,
        request,
        onSocket
      );
      response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.statusMessage, upstreamResponse.headers);
      await (0, import_promises2.pipeline)(upstreamResponse, response);
    } catch (error) {
      if (response.headersSent) {
        response.destroy();
        return;
      }
      response.writeHead(502, { Connection: "close" });
      response.end(`System proxy bridge failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async handleConnect(request, clientSocket, head) {
    let routeSocket = null;
    let clientUnavailable = clientSocket.destroyed || !clientSocket.writable || clientSocket.writableEnded || clientSocket.writableFinished;
    const isClientUnavailable = () => clientUnavailable || clientSocket.destroyed || !clientSocket.writable || clientSocket.writableEnded || clientSocket.writableFinished;
    const closeRoute = () => {
      clientUnavailable = true;
      routeSocket == null ? void 0 : routeSocket.destroy();
      clientSocket.destroy();
    };
    clientSocket.on("error", closeRoute);
    clientSocket.once("end", closeRoute);
    clientSocket.once("close", closeRoute);
    try {
      const endpoint = parseEndpoint(request.url ?? "", 443);
      if (!endpoint) throw new Error("Invalid CONNECT target");
      const target = new URL(`https://${formatAuthority(endpoint.host, endpoint.port)}/`);
      const rules = await this.resolveRules(target);
      if (isClientUnavailable()) return;
      const route = await connectTunnelUsingRules(rules, endpoint.host, endpoint.port);
      routeSocket = route.socket;
      this.trackOutboundSocket(route.socket);
      const closeBoth = () => {
        route.socket.destroy();
        clientSocket.destroy();
      };
      route.socket.on("error", closeBoth);
      if (isClientUnavailable()) {
        route.socket.destroy();
        return;
      }
      clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
      if (head.length > 0) route.socket.write(head);
      route.socket.pipe(clientSocket);
      clientSocket.pipe(route.socket);
    } catch (error) {
      if (isClientUnavailable()) {
        clientSocket.destroy();
        return;
      }
      const authenticationRequired = error instanceof ProxyAuthenticationRequiredError;
      clientSocket.end(`${authenticationRequired ? "HTTP/1.1 407 Proxy Authentication Required" : "HTTP/1.1 502 Bad Gateway"}\r
Connection: close\r
Content-Type: text/plain\r
\r
${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async resolveRules(target) {
    if (isLoopbackHostname(target.hostname)) return [{ type: "direct" }];
    return parseSystemProxyRules(await this.resolveSystemProxy(target.href));
  }
  trackOutboundSocket(socket) {
    this.outboundSockets.add(socket);
    socket.once("close", () => this.outboundSockets.delete(socket));
  }
};
function resolveHttpTarget(request) {
  const rawUrl = request.url ?? "";
  if (/^https?:\/\//i.test(rawUrl)) return new URL(rawUrl);
  const host = request.headers.host;
  if (!host) throw new Error("Proxy request is missing Host header");
  return new URL(rawUrl || "/", `http://${host}`);
}
function sanitizeProxyRequestHeaders(headers) {
  const sanitized = { ...headers };
  const connectionTokens = String(headers.connection ?? "").split(",").map((token) => token.trim().toLowerCase()).filter(Boolean);
  for (const name of [
    ...connectionTokens,
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "proxy-connection",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade"
  ]) {
    delete sanitized[name];
  }
  return sanitized;
}
function isReplaySafeMethod(method) {
  return ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}
async function requestUsingRules(rules, target, method, headers, body, onSocket) {
  const errors = [];
  for (const rule of rules) {
    try {
      return await requestUsingRule(rule, target, method, headers, body, onSocket);
    } catch (error) {
      errors.push(`${rule.type}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`No system proxy route succeeded (${errors.join("; ")})`);
}
async function requestUsingRule(rule, target, method, headers, body, onSocket) {
  const outgoing = await createRuleRequest(rule, target, method, headers, onSocket);
  return await performHttpRequest(outgoing.transport, outgoing.options, body, onSocket);
}
async function requestStreamingUsingRule(rule, target, method, headers, body, onSocket) {
  const outgoing = await createRuleRequest(rule, target, method, headers, onSocket);
  return await new Promise((resolve, reject) => {
    const request = outgoing.transport.request(outgoing.options, resolve);
    request.once("socket", onSocket);
    request.once("error", reject);
    body.once("error", (error) => request.destroy(error));
    body.pipe(request);
  });
}
async function createRuleRequest(rule, target, method, headers, onSocket) {
  const outgoingHeaders = { ...headers, connection: "close" };
  if (rule.type === "direct") {
    return {
      transport: import_node_http2.default,
      options: {
        method,
        host: target.hostname,
        port: targetPort(target),
        path: `${target.pathname}${target.search}`,
        headers: outgoingHeaders,
        agent: false
      }
    };
  }
  const endpoint = requireEndpoint(rule);
  if (rule.type === "http" || rule.type === "https") {
    return {
      transport: rule.type === "https" ? import_node_https.default : import_node_http2.default,
      options: {
        method,
        host: endpoint.host,
        port: endpoint.port,
        path: target.href,
        headers: outgoingHeaders,
        agent: false,
        servername: import_node_net2.default.isIP(endpoint.host) ? void 0 : endpoint.host
      }
    };
  }
  const socket = rule.type === "socks4" ? await connectSocks4(endpoint, target.hostname, targetPort(target)) : await connectSocks5(endpoint, target.hostname, targetPort(target));
  onSocket(socket);
  return {
    transport: import_node_http2.default,
    options: {
      method,
      host: target.hostname,
      port: targetPort(target),
      path: `${target.pathname}${target.search}`,
      headers: outgoingHeaders,
      agent: new SingleSocketAgent(socket)
    }
  };
}
async function selectReachableRule(rules, target) {
  const errors = [];
  for (const rule of rules) {
    let socket = null;
    try {
      if (rule.type === "direct") {
        socket = await connectTcp(target.hostname, targetPort(target));
      } else {
        const endpoint = requireEndpoint(rule);
        socket = rule.type === "http" || rule.type === "https" ? await connectProxyEndpoint(endpoint, rule.type === "https") : rule.type === "socks4" ? await connectSocks4(endpoint, target.hostname, targetPort(target)) : await connectSocks5(endpoint, target.hostname, targetPort(target));
      }
      socket.destroy();
      return rule;
    } catch (error) {
      socket == null ? void 0 : socket.destroy();
      errors.push(`${rule.type}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`No system proxy route succeeded (${errors.join("; ")})`);
}
function performHttpRequest(transport, options, body, onSocket) {
  return new Promise((resolve, reject) => {
    const request = transport.request(options, resolve);
    request.once("socket", onSocket);
    request.once("error", reject);
    request.end(body);
  });
}
async function readRequestBody(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > MAX_BUFFERED_REQUEST_BYTES) {
      throw new Error(`proxy request body exceeds ${MAX_BUFFERED_REQUEST_BYTES} bytes`);
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks, total);
}
var SingleSocketAgent = class extends import_node_http2.default.Agent {
  constructor(socket) {
    super({ keepAlive: false });
    this.socket = socket;
  }
  claimed = false;
  createConnection() {
    if (this.claimed) throw new Error("System proxy route socket was already claimed");
    this.claimed = true;
    return this.socket;
  }
};
function closeServer(server) {
  if (!server.listening) return Promise.resolve();
  return new Promise((resolve) => server.close(() => resolve()));
}
async function connectTunnelUsingRules(rules, targetHost, targetPortNumber) {
  const errors = [];
  for (const rule of rules) {
    try {
      if (rule.type === "direct") {
        return { socket: await connectTcp(targetHost, targetPortNumber) };
      }
      const endpoint = requireEndpoint(rule);
      if (rule.type === "http" || rule.type === "https") {
        return {
          socket: await establishHttpProxyTunnel(
            endpoint,
            rule.type === "https",
            targetHost,
            targetPortNumber
          )
        };
      }
      return {
        socket: rule.type === "socks4" ? await connectSocks4(endpoint, targetHost, targetPortNumber) : await connectSocks5(endpoint, targetHost, targetPortNumber)
      };
    } catch (error) {
      if (error instanceof ProxyAuthenticationRequiredError) throw error;
      errors.push(`${rule.type}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`No system proxy route succeeded (${errors.join("; ")})`);
}
async function establishHttpProxyTunnel(endpoint, secure, targetHost, targetPortNumber) {
  var _a;
  const socket = await connectProxyEndpoint(endpoint, secure);
  try {
    const authority = formatAuthority(targetHost, targetPortNumber);
    socket.write(
      `CONNECT ${authority} HTTP/1.1\r
Host: ${authority}\r
Proxy-Connection: keep-alive\r
\r
`
    );
    const header = await readUntil(socket, Buffer.from("\r\n\r\n"), 64 * 1024);
    const statusLine = header.toString("latin1").split("\r\n", 1)[0] ?? "";
    const status = Number((_a = statusLine.match(/^HTTP\/\d(?:\.\d)?\s+(\d{3})\b/i)) == null ? void 0 : _a[1]);
    if (status === 407) {
      throw new ProxyAuthenticationRequiredError("HTTP proxy requires authentication");
    }
    if (status < 200 || status >= 300) {
      throw new Error(`HTTP proxy CONNECT returned ${Number.isFinite(status) ? status : "an invalid response"}`);
    }
    return socket;
  } catch (error) {
    socket.destroy();
    throw error;
  }
}
function connectProxyEndpoint(endpoint, secure) {
  return secure ? connectTls(endpoint.host, endpoint.port) : connectTcp(endpoint.host, endpoint.port);
}
function connectTcp(host, port) {
  return new Promise((resolve, reject) => {
    const socket = import_node_net2.default.connect({ host, port });
    const timer = setTimeout(() => socket.destroy(new Error("connection timed out")), CONNECT_TIMEOUT_MS);
    socket.once("connect", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}
function connectTls(host, port) {
  return new Promise((resolve, reject) => {
    const socket = import_node_tls.default.connect({ host, port, servername: import_node_net2.default.isIP(host) ? void 0 : host });
    const timer = setTimeout(() => socket.destroy(new Error("connection timed out")), CONNECT_TIMEOUT_MS);
    socket.once("secureConnect", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}
async function connectSocks5(endpoint, targetHost, targetPortNumber) {
  const socket = await connectTcp(endpoint.host, endpoint.port);
  try {
    socket.write(Buffer.from([5, 1, 0]));
    const greeting = await readExactly(socket, 2);
    if (greeting[0] !== 5 || greeting[1] !== 0) throw new Error("SOCKS5 proxy rejected no-authentication mode");
    const host = Buffer.from(targetHost);
    if (host.length > 255) throw new Error("SOCKS5 target hostname is too long");
    const port = Buffer.allocUnsafe(2);
    port.writeUInt16BE(targetPortNumber);
    socket.write(Buffer.concat([Buffer.from([5, 1, 0, 3, host.length]), host, port]));
    const response = await readExactly(socket, 4);
    if (response[0] !== 5 || response[1] !== 0) throw new Error(`SOCKS5 connect failed with code ${response[1]}`);
    const addressLength = response[3] === 1 ? 4 : response[3] === 4 ? 16 : response[3] === 3 ? (await readExactly(socket, 1))[0] : 0;
    if (!addressLength) throw new Error("SOCKS5 proxy returned an invalid address type");
    await readExactly(socket, addressLength + 2);
    return socket;
  } catch (error) {
    socket.destroy();
    throw error;
  }
}
async function connectSocks4(endpoint, targetHost, targetPortNumber) {
  const socket = await connectTcp(endpoint.host, endpoint.port);
  try {
    const port = Buffer.allocUnsafe(2);
    port.writeUInt16BE(targetPortNumber);
    const address = import_node_net2.default.isIPv4(targetHost) ? targetHost : (await (0, import_promises.lookup)(targetHost, { family: 4 })).address;
    const octets = address.split(".").map(Number);
    if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
      throw new Error("SOCKS4 target did not resolve to IPv4");
    }
    socket.write(Buffer.concat([
      Buffer.from([4, 1]),
      port,
      Buffer.from(octets),
      Buffer.from([0])
    ]));
    const response = await readExactly(socket, 8);
    if (response[1] !== 90) throw new Error(`SOCKS4 connect failed with code ${response[1]}`);
    return socket;
  } catch (error) {
    socket.destroy();
    throw error;
  }
}
function readExactly(socket, length) {
  return readFromSocket(socket, (buffer) => buffer.length >= length ? length : null);
}
function readUntil(socket, marker, maxBytes) {
  return readFromSocket(socket, (buffer) => {
    const index = buffer.indexOf(marker);
    if (index >= 0) return index + marker.length;
    if (buffer.length > maxBytes) throw new Error("proxy response headers are too large");
    return null;
  });
}
function readFromSocket(socket, completeLength) {
  return new Promise((resolve, reject) => {
    let buffered = Buffer.alloc(0);
    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("close", onClose);
      clearTimeout(timer);
    };
    const onData = (chunk) => {
      buffered = Buffer.concat([buffered, chunk]);
      let length;
      try {
        length = completeLength(buffered);
      } catch (error) {
        cleanup();
        reject(error);
        return;
      }
      if (length === null) return;
      cleanup();
      if (buffered.length > length) socket.unshift(buffered.subarray(length));
      resolve(buffered.subarray(0, length));
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const onClose = () => {
      cleanup();
      reject(new Error("proxy connection closed during handshake"));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("proxy handshake timed out"));
    }, CONNECT_TIMEOUT_MS);
    socket.on("data", onData);
    socket.once("error", onError);
    socket.once("close", onClose);
  });
}
function parseEndpoint(value, defaultPort) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(`tcp://${trimmed}`);
    const port = url.port ? Number(url.port) : defaultPort;
    if (!url.hostname || !port || !Number.isInteger(port) || port < 1 || port > 65535) return null;
    return { host: stripIpv6Brackets(url.hostname), port };
  } catch {
    return null;
  }
}
function requireEndpoint(rule) {
  if (!rule.host || !rule.port) throw new Error(`Invalid ${rule.type} proxy endpoint`);
  return { host: rule.host, port: rule.port };
}
function targetPort(url) {
  return url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80;
}
function isLoopbackHostname(hostname) {
  const normalized = stripIpv6Brackets(hostname).toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}
function stripIpv6Brackets(hostname) {
  return hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
}
function formatAuthority(host, port) {
  return `${host.includes(":") ? `[${host}]` : host}:${port}`;
}
var ProxyAuthenticationRequiredError = class extends Error {
};

// electron/services/serverRuntime.ts
var DEFAULT_SERVER_RUNTIME_DEPS = {
  appendHostDiagnostic,
  preferredServerPorts,
  reserveServerPort,
  spawnSidecar,
  waitForServer,
  writeLastServerPort,
  createSystemProxyBridge: (resolveSystemProxy) => new SystemProxyBridge(resolveSystemProxy)
};
function createServerStartState(child) {
  let failure = null;
  let rejectFailure;
  const failurePromise = new Promise((_resolve, reject) => {
    rejectFailure = reject;
  });
  return {
    child,
    adapterChildren: [],
    childStopped: false,
    get failure() {
      return failure;
    },
    failurePromise,
    fail(error) {
      if (failure) return;
      failure = error;
      rejectFailure(error);
    }
  };
}
var ElectronServerRuntime = class {
  desktopRoot;
  appRoot;
  h5DistDir;
  diagnosticsFile;
  baseEnv;
  deps;
  resolveSystemProxy;
  localAccessToken = (0, import_node_crypto3.randomBytes)(32).toString("base64url");
  petAccessToken = (0, import_node_crypto3.randomBytes)(32).toString("base64url");
  sidecarEnvPromise = null;
  systemProxyBridge = null;
  server = null;
  adapters = [];
  startupError = null;
  restartAfterExit = false;
  startPromise = null;
  lifecycleGeneration = 0;
  startingServer = null;
  adapterRestartPromise = null;
  constructor(options) {
    this.desktopRoot = options.desktopRoot;
    this.appRoot = options.appRoot ?? options.desktopRoot;
    this.h5DistDir = options.h5DistDir ?? import_node_path3.default.join(options.desktopRoot, "dist");
    this.diagnosticsFile = options.diagnosticsFile;
    this.baseEnv = options.env ?? process.env;
    this.deps = { ...DEFAULT_SERVER_RUNTIME_DEPS, ...options.deps };
    this.resolveSystemProxy = options.resolveSystemProxy;
  }
  async startServer() {
    if (this.server) return this.server.url;
    if (this.startPromise) return this.startPromise;
    this.restartAfterExit = false;
    const generation = this.lifecycleGeneration;
    this.startPromise = this.startServerOnce(generation);
    try {
      return await this.startPromise;
    } finally {
      this.startPromise = null;
    }
  }
  async getServerUrl() {
    if (this.server) return this.server.url;
    if (this.startPromise) return await this.startServer();
    if (this.startupError && !this.restartAfterExit) throw new Error(this.startupError);
    return await this.startServer();
  }
  getLocalAccessToken() {
    return this.localAccessToken;
  }
  getPetAccessToken() {
    return this.petAccessToken;
  }
  getActiveServerUrl() {
    var _a;
    return ((_a = this.server) == null ? void 0 : _a.url) ?? null;
  }
  restartAdaptersSidecars() {
    if (this.adapterRestartPromise) return this.adapterRestartPromise;
    const operation = this.restartAdaptersSidecarsOnce();
    const tracked = operation.finally(() => {
      if (this.adapterRestartPromise === tracked) this.adapterRestartPromise = null;
    });
    this.adapterRestartPromise = tracked;
    return tracked;
  }
  async restartAdaptersSidecarsOnce() {
    const serverUrl = await this.getServerUrl();
    const server = this.server;
    if (!server || server.url !== serverUrl) return;
    this.stopAdapterChildren(server.adapterChildren);
    await this.startAdaptersSidecars(serverUrl, void 0, server);
  }
  stopAll(sync = false) {
    var _a;
    ++this.lifecycleGeneration;
    const starting = this.startingServer;
    if (starting) {
      this.startingServer = null;
      this.stopAdaptersForStart(starting, sync);
      if (((_a = this.server) == null ? void 0 : _a.child) === starting.child) this.server = null;
      starting.fail(new Error("server startup stopped"));
      if (!starting.childStopped) {
        starting.childStopped = true;
        killSidecar(starting.child, sync);
      }
    }
    this.stopAdaptersSidecars(sync);
    if (this.server) {
      killSidecar(this.server.child, sync);
      this.server = null;
    }
    this.stopSystemProxyBridge();
  }
  async startServerOnce(generation) {
    var _a;
    const port = await this.deps.reserveServerPort(
      SERVER_BIND_HOST,
      this.deps.preferredServerPorts(this.baseEnv)
    );
    const url = `http://${SERVER_CONTROL_HOST}:${port}`;
    const logs = [];
    let startState = null;
    const env = this.withServerAccessTokens(await this.resolveSidecarBaseEnv());
    this.assertCurrentGeneration(generation);
    const plan = createServerPlan({
      desktopRoot: this.desktopRoot,
      appRoot: this.appRoot,
      port,
      h5DistDir: this.h5DistDir,
      env: this.diagnosticsFile ? { ...env, [ELECTRON_DIAGNOSTICS_FILE_ENV]: this.diagnosticsFile } : env
    });
    try {
      const child = this.deps.spawnSidecar(plan);
      startState = createServerStartState(child);
      this.startingServer = startState;
      this.captureLogs(child, "claude-server", logs, (code, signal) => {
        this.handleServerExit(child, code, signal, logs);
      }, (error) => {
        this.handleServerError(child, error, logs);
      });
      await Promise.race([
        this.deps.waitForServer(SERVER_CONTROL_HOST, port, SERVER_STARTUP_TIMEOUT_MS),
        startState.failurePromise
      ]);
      if (startState.failure) throw startState.failure;
      this.deps.writeLastServerPort(port, this.baseEnv);
      this.server = { url, child, adapterChildren: startState.adapterChildren };
      const activeServer = this.server;
      this.startupError = null;
      this.stopAdaptersSidecars();
      await Promise.race([
        this.startAdaptersSidecars(url, startState, activeServer),
        startState.failurePromise
      ]);
      if (startState.failure) throw startState.failure;
      return url;
    } catch (error) {
      if (startState) {
        this.stopAdaptersForStart(startState);
        if (((_a = this.server) == null ? void 0 : _a.child) === startState.child) this.server = null;
        if (!startState.childStopped) {
          startState.childStopped = true;
          killSidecar(startState.child);
        }
      }
      if (startState == null ? void 0 : startState.failure) {
        throw new Error(this.startupError ?? startState.failure.message);
      }
      const message = error instanceof Error ? error.message : String(error);
      this.deps.appendHostDiagnostic(this.diagnosticsFile, `[claude-server] [startup-error] ${message}`);
      this.startupError = formatStartupError(message, logs);
      throw new Error(this.startupError);
    } finally {
      if (this.startingServer === startState) this.startingServer = null;
    }
  }
  assertCurrentGeneration(generation) {
    if (generation !== this.lifecycleGeneration) throw new Error("server startup stopped");
  }
  async startAdaptersSidecars(serverUrl, startState, activeServer) {
    const baseEnv = this.withLocalAccessToken(await this.resolveSidecarBaseEnv());
    const bridgeUrl = baseEnv.CC_HAHA_SYSTEM_PROXY_URL;
    const env = bridgeUrl ? withAdapterProxyBridgeEnv(baseEnv, bridgeUrl) : baseEnv;
    const isCurrentGeneration = () => {
      if (startState == null ? void 0 : startState.failure) return false;
      if (activeServer && this.server !== activeServer) return false;
      return true;
    };
    if (!isCurrentGeneration()) return;
    const ownedAdapters = (startState == null ? void 0 : startState.adapterChildren) ?? (activeServer == null ? void 0 : activeServer.adapterChildren);
    for (const [label, flag] of [
      ["feishu", "--feishu"],
      ["telegram", "--telegram"],
      ["wechat", "--wechat"],
      ["dingtalk", "--dingtalk"],
      ["whatsapp", "--whatsapp"]
    ]) {
      if (!isCurrentGeneration()) break;
      try {
        const child = this.deps.spawnSidecar(createAdapterPlan({
          desktopRoot: this.desktopRoot,
          appRoot: this.appRoot,
          h5DistDir: this.h5DistDir,
          serverUrl,
          flag,
          env
        }));
        if (!isCurrentGeneration()) {
          killSidecar(child);
          break;
        }
        this.captureLogs(child, `claude-adapters:${label}`);
        this.adapters.push(child);
        ownedAdapters == null ? void 0 : ownedAdapters.push(child);
      } catch (error) {
        console.error(`[desktop] failed to start ${label} adapter sidecar`, error);
      }
    }
  }
  stopAdaptersSidecars(sync = false) {
    var _a, _b;
    const children = this.adapters.splice(0);
    this.removeOwnedAdapters((_a = this.server) == null ? void 0 : _a.adapterChildren, children);
    this.removeOwnedAdapters((_b = this.startingServer) == null ? void 0 : _b.adapterChildren, children);
    for (const child of children) {
      killSidecar(child, sync);
    }
  }
  withLocalAccessToken(env) {
    return {
      ...env,
      CC_HAHA_LOCAL_ACCESS_TOKEN: this.localAccessToken
    };
  }
  withServerAccessTokens(env) {
    return {
      ...this.withLocalAccessToken(env),
      CC_HAHA_PET_ACCESS_TOKEN: this.petAccessToken
    };
  }
  removeOwnedAdapters(owned, removed) {
    if (!(owned == null ? void 0 : owned.length) || !removed.length) return;
    const removedSet = new Set(removed);
    const retained = owned.filter((child) => !removedSet.has(child));
    owned.splice(0, owned.length, ...retained);
  }
  stopAdaptersForStart(startState, sync = false) {
    this.stopAdapterChildren(startState.adapterChildren, sync);
  }
  captureLogs(child, label, startupLogs, onExit, onError) {
    child.stdout.on("data", (chunk) => {
      const line = String(chunk).trimEnd();
      if (!line) return;
      console.log(`[${label}] ${line}`);
      this.deps.appendHostDiagnostic(this.diagnosticsFile, `[${label}] [stdout] ${line}`);
      if (startupLogs) pushStartupLog(startupLogs, `[stdout] ${line}`);
    });
    child.stderr.on("data", (chunk) => {
      const line = String(chunk).trimEnd();
      if (!line) return;
      console.error(`[${label}] ${line}`);
      this.deps.appendHostDiagnostic(this.diagnosticsFile, `[${label}] [stderr] ${line}`);
      if (startupLogs) pushStartupLog(startupLogs, `[stderr] ${line}`);
    });
    child.on("exit", (code, signal) => {
      const line = `sidecar exited (code=${code}, signal=${signal})`;
      console.log(`[${label}] ${line}`);
      this.deps.appendHostDiagnostic(this.diagnosticsFile, `[${label}] [exit] ${line}`);
      if (startupLogs) pushStartupLog(startupLogs, `[exit] ${line}`);
      onExit == null ? void 0 : onExit(code, signal);
    });
    child.on("error", (error) => {
      const message = error instanceof Error ? error.message : String(error);
      const line = `sidecar process error: ${message}`;
      console.error(`[${label}] ${sanitizeHostDiagnostic(line)}`);
      this.deps.appendHostDiagnostic(this.diagnosticsFile, `[${label}] [process-error] ${line}`);
      if (startupLogs) pushStartupLog(startupLogs, `[process-error] ${line}`);
      onError == null ? void 0 : onError(error instanceof Error ? error : new Error(message));
    });
  }
  handleServerExit(child, code, signal, logs) {
    this.handleServerFailure(
      child,
      `server sidecar exited after spawn (code=${code}, signal=${signal})`,
      logs
    );
  }
  handleServerError(child, error, logs) {
    this.handleServerFailure(
      child,
      `server sidecar process error after spawn: ${sanitizeHostDiagnostic(error.message)}`,
      logs
    );
  }
  handleServerFailure(child, message, logs) {
    var _a, _b, _c;
    const active = ((_a = this.server) == null ? void 0 : _a.child) === child;
    const starting = ((_b = this.startingServer) == null ? void 0 : _b.child) === child;
    if (!active && !starting) return;
    if (active) {
      const adapterChildren = this.server.adapterChildren;
      this.server = null;
      this.stopAdapterChildren(adapterChildren);
    }
    this.restartAfterExit = true;
    this.startupError = formatStartupError(message, logs);
    if (starting) (_c = this.startingServer) == null ? void 0 : _c.fail(new Error(message));
  }
  stopAdapterChildren(children, sync = false) {
    for (const child of children.splice(0)) {
      const index = this.adapters.indexOf(child);
      if (index >= 0) this.adapters.splice(index, 1);
      killSidecar(child, sync);
    }
  }
  async resolveSidecarBaseEnv() {
    this.sidecarEnvPromise ??= this.resolveSidecarBaseEnvOnce();
    return await this.sidecarEnvPromise;
  }
  async resolveSidecarBaseEnvOnce() {
    const baseEnv = clearProxyEnv(this.baseEnv);
    if (!this.resolveSystemProxy) return this.applyPowerShellOverride(baseEnv);
    const bridge = this.deps.createSystemProxyBridge(this.resolveSystemProxy);
    this.systemProxyBridge = bridge;
    try {
      const bridgeUrl = await bridge.start();
      if (this.systemProxyBridge !== bridge) {
        throw new Error("system proxy bridge startup was stopped");
      }
      return this.applyPowerShellOverride(withSystemProxyBridgeEnv(baseEnv, bridgeUrl));
    } catch (error) {
      if (this.systemProxyBridge === bridge) {
        this.systemProxyBridge = null;
        await bridge.stop().catch(() => {
        });
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[desktop] failed to start system proxy bridge for sidecars: ${sanitizeHostDiagnostic(message)}`);
      return this.applyPowerShellOverride(withSystemProxyErrorEnv(baseEnv, error));
    }
  }
  stopSystemProxyBridge() {
    const bridge = this.systemProxyBridge;
    this.systemProxyBridge = null;
    this.sidecarEnvPromise = null;
    if (bridge) void bridge.stop();
  }
  // On Windows, forward the user's chosen PowerShell to the agent sidecar so its
  // PowerShellTool honors the same shell as the UI terminal (regression from the
  // Tauri build, where this lived in src-tauri/src/lib.rs). Best-effort: never
  // block sidecar startup, and never override an explicitly set env var.
  applyPowerShellOverride(env) {
    if (process.platform !== "win32" || env[POWERSHELL_PATH_OVERRIDE_ENV]) return env;
    try {
      const shell = resolveDesktopTerminalShell("win32", readDesktopTerminalConfig(env));
      const override = windowsPowerShellOverride(shell, "win32");
      if (override) return { ...env, [POWERSHELL_PATH_OVERRIDE_ENV]: override };
    } catch {
    }
    return env;
  }
};

// electron/services/dialogs.ts
function toElectronOpenDialogOptions(options = {}) {
  return {
    properties: [
      options.directory ? "openDirectory" : "openFile",
      options.multiple ? "multiSelections" : void 0
    ].filter(Boolean),
    title: options.title,
    defaultPath: options.defaultPath,
    filters: options.filters
  };
}
function toElectronSaveDialogOptions(options = {}) {
  return {
    title: options.title,
    defaultPath: options.defaultPath,
    filters: options.filters
  };
}
async function openDialog(parentWindow, options) {
  const { dialog: dialog2 } = await import("electron");
  const dialogOptions = toElectronOpenDialogOptions(options);
  const result = parentWindow ? await dialog2.showOpenDialog(parentWindow, dialogOptions) : await dialog2.showOpenDialog(dialogOptions);
  if (result.canceled) return null;
  return (options == null ? void 0 : options.multiple) ? result.filePaths : result.filePaths[0] ?? null;
}
async function saveDialog(parentWindow, options) {
  const { dialog: dialog2 } = await import("electron");
  const dialogOptions = toElectronSaveDialogOptions(options);
  const result = parentWindow ? await dialog2.showSaveDialog(parentWindow, dialogOptions) : await dialog2.showSaveDialog(dialogOptions);
  return result.canceled ? null : result.filePath ?? null;
}

// electron/services/shell.ts
var import_node_fs3 = require("node:fs");
var import_node_os3 = require("node:os");
var import_node_path4 = __toESM(require("node:path"), 1);
var import_node_url = require("node:url");
var ALLOWED_EXTERNAL_PROTOCOLS = /* @__PURE__ */ new Set(["http:", "https:", "mailto:"]);
var ALLOWED_SYSTEM_SETTINGS_URLS = /* @__PURE__ */ new Set([
  "ms-settings:notifications",
  "x-apple.systempreferences:com.apple.preference.notifications"
]);
var BLOCKED_EXECUTABLE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".app",
  ".bat",
  ".cmd",
  ".com",
  ".exe",
  ".msi",
  ".ps1",
  ".scr",
  ".sh"
]);
function normalizeExternalUrl(target) {
  let url;
  try {
    url = new URL(target);
  } catch {
    throw new Error("External shell targets must be absolute URLs");
  }
  if (!ALLOWED_EXTERNAL_PROTOCOLS.has(url.protocol)) {
    throw new Error(`Unsupported external URL scheme: ${url.protocol}`);
  }
  return url.toString();
}
function expandTildePath(target, platform = process.platform) {
  if (target === "~" || target.startsWith("~/") || platform === "win32" && target.startsWith("~\\")) {
    return (0, import_node_os3.homedir)() + target.slice(1);
  }
  return target;
}
function normalizeOpenPath(target) {
  const filePath = expandTildePath(
    target.startsWith("file://") ? (0, import_node_url.fileURLToPath)(target) : target
  );
  if (!import_node_path4.default.isAbsolute(filePath)) {
    throw new Error("System file paths must be absolute");
  }
  const realPath = (0, import_node_fs3.realpathSync)(filePath);
  const stat = (0, import_node_fs3.statSync)(realPath);
  if (!stat.isFile() && !stat.isDirectory()) {
    throw new Error("System file paths must point to a file or directory");
  }
  if (isBlockedExecutablePath(realPath, stat.isDirectory())) {
    throw new Error("System file paths must not point to executable apps or scripts");
  }
  return realPath;
}
function isBlockedExecutablePath(realPath, isDirectory) {
  const ext = import_node_path4.default.extname(realPath).toLowerCase();
  if (BLOCKED_EXECUTABLE_EXTENSIONS.has(ext)) return true;
  if (isDirectory) return false;
  if (process.platform === "win32") return false;
  return ((0, import_node_fs3.statSync)(realPath).mode & 73) !== 0;
}
async function openExternalUrl(target) {
  const { shell } = await import("electron");
  await shell.openExternal(normalizeExternalUrl(target));
}
function normalizeSystemSettingsUrl(target) {
  if (!ALLOWED_SYSTEM_SETTINGS_URLS.has(target)) {
    throw new Error(`Unsupported system settings URL: ${target}`);
  }
  return target;
}
async function openSystemSettingsUrl(target) {
  const { shell } = await import("electron");
  await shell.openExternal(normalizeSystemSettingsUrl(target));
  return true;
}
async function openSystemPath(target) {
  const { shell } = await import("electron");
  const error = await shell.openPath(normalizeOpenPath(target));
  if (error) throw new Error(error);
}

// electron/services/notifications.ts
var activeNotifications = /* @__PURE__ */ new Set();
function validateNotificationOptions(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value;
  return typeof record.title === "string" && record.title.trim().length > 0 && (record.body === void 0 || typeof record.body === "string") && (record.icon === void 0 || typeof record.icon === "string") && (record.id === void 0 || typeof record.id === "number") && (record.extra === void 0 || typeof record.extra === "object" && record.extra !== null && !Array.isArray(record.extra));
}
function notificationPermissionState(NotificationClass) {
  return NotificationClass.isSupported() ? "granted" : "denied";
}
function requestNotificationPermission(NotificationClass) {
  return notificationPermissionState(NotificationClass);
}
function sendDesktopNotification({
  NotificationClass,
  options,
  onAction,
  onLifecycle
}) {
  if (!validateNotificationOptions(options)) {
    throw new Error("Invalid Electron notification payload");
  }
  if (!NotificationClass.isSupported()) return false;
  const notification = new NotificationClass({
    title: options.title,
    body: options.body,
    icon: options.icon
  });
  activeNotifications.add(notification);
  const cleanup = () => {
    activeNotifications.delete(notification);
  };
  notification.on("click", () => {
    onAction({
      id: options.id,
      extra: options.extra,
      target: options.target,
      action: "click"
    });
    cleanup();
  });
  notification.on("close", () => {
    onLifecycle == null ? void 0 : onLifecycle("close");
    cleanup();
  });
  notification.on("failed", () => {
    onLifecycle == null ? void 0 : onLifecycle("failed");
    cleanup();
  });
  notification.show();
  return true;
}

// electron/services/windows.ts
var import_node_fs4 = require("node:fs");
var import_node_path5 = __toESM(require("node:path"), 1);
var WINDOW_STATE_FILE = "window-state.json";
var DEFAULT_WINDOW_WIDTH = 1280;
var DEFAULT_WINDOW_HEIGHT = 820;
var MIN_WINDOW_WIDTH = 960;
var MIN_WINDOW_HEIGHT = 640;
var MIN_VISIBLE_PIXELS = 80;
var failedWindowStateWritePaths = /* @__PURE__ */ new Set();
function windowStatePath(app2, env = process.env) {
  return import_node_path5.default.join(env.CLAUDE_CONFIG_DIR || import_node_path5.default.join(app2.getPath("home"), ".claude"), WINDOW_STATE_FILE);
}
function isPersistableWindowState(state) {
  return Number.isFinite(state.x) && Number.isFinite(state.y) && state.width >= MIN_WINDOW_WIDTH && state.height >= MIN_WINDOW_HEIGHT;
}
function hasMeaningfulIntersection(state, displayBounds) {
  const stateRight = state.x + state.width;
  const stateBottom = state.y + state.height;
  const displayRight = displayBounds.x + displayBounds.width;
  const displayBottom = displayBounds.y + displayBounds.height;
  return stateRight > displayBounds.x + MIN_VISIBLE_PIXELS && stateBottom > displayBounds.y + MIN_VISIBLE_PIXELS && state.x < displayRight - MIN_VISIBLE_PIXELS && state.y < displayBottom - MIN_VISIBLE_PIXELS;
}
function isWindowStateVisibleOnAnyDisplay(state, displays) {
  if (displays.length === 0) return true;
  return displays.some(
    (display) => hasMeaningfulIntersection(state, display.workArea ?? display.bounds)
  );
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function clampWindowStateToVisibleWorkArea(state, displays) {
  const display = displays.find(
    (candidate) => hasMeaningfulIntersection(state, candidate.workArea ?? candidate.bounds)
  );
  if (!display) return state;
  const workArea = display.workArea ?? display.bounds;
  const maxX = workArea.x + Math.max(0, workArea.width - state.width);
  const maxY = workArea.y + Math.max(0, workArea.height - state.height);
  return {
    ...state,
    x: clamp(state.x, workArea.x, maxX),
    y: clamp(state.y, workArea.y, maxY)
  };
}
function readWindowState(app2, displays, env = process.env, platform = process.platform) {
  let statePath = windowStatePath(app2, env);
  if (!(0, import_node_fs4.existsSync)(statePath) && !env.CLAUDE_CONFIG_DIR) {
    const legacyStatePath = import_node_path5.default.join(app2.getPath("userData"), WINDOW_STATE_FILE);
    if ((0, import_node_fs4.existsSync)(legacyStatePath)) statePath = legacyStatePath;
  }
  if (!(0, import_node_fs4.existsSync)(statePath)) return null;
  try {
    const parsed = JSON.parse((0, import_node_fs4.readFileSync)(statePath, "utf-8"));
    if (!isPersistableWindowState(parsed)) return null;
    if (!isWindowStateVisibleOnAnyDisplay(parsed, displays)) return null;
    return platform === "darwin" ? clampWindowStateToVisibleWorkArea(parsed, displays) : parsed;
  } catch (error) {
    console.error(`[desktop] failed to read Electron window state ${statePath}:`, error);
    return null;
  }
}
function writeWindowState(app2, state, env = process.env) {
  if (!isPersistableWindowState(state)) return;
  const statePath = windowStatePath(app2, env);
  try {
    (0, import_node_fs4.mkdirSync)(import_node_path5.default.dirname(statePath), { recursive: true });
    (0, import_node_fs4.writeFileSync)(statePath, `${JSON.stringify(state, null, 2)}
`);
    failedWindowStateWritePaths.delete(statePath);
  } catch (error) {
    if (!failedWindowStateWritePaths.has(statePath)) {
      failedWindowStateWritePaths.add(statePath);
      console.error(`[desktop] failed to write Electron window state ${statePath}:`, error);
    }
  }
}
function captureWindowState(window) {
  if (window.isDestroyed()) return null;
  if (window.isMinimized()) return null;
  const bounds = window.getBounds();
  const state = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    maximized: window.isMaximized()
  };
  return isPersistableWindowState(state) ? state : null;
}
function windowOptionsFromState(state) {
  return state ? { x: state.x, y: state.y, width: state.width, height: state.height } : { width: DEFAULT_WINDOW_WIDTH, height: DEFAULT_WINDOW_HEIGHT };
}
function windowChromeOptionsForPlatform(platform = process.platform) {
  if (platform === "darwin") {
    return {
      titleBarStyle: "hiddenInset",
      fullscreenable: false
    };
  }
  if (platform === "win32") {
    return {
      frame: false,
      autoHideMenuBar: true,
      fullscreenable: true
    };
  }
  return {
    titleBarStyle: "default",
    fullscreenable: true
  };
}
function restoreWindowMaximized(window, state) {
  if (state == null ? void 0 : state.maximized) window.maximize();
}
function saveWindowState(app2, window) {
  const state = captureWindowState(window);
  if (state) writeWindowState(app2, state);
}
function hideWindowSafely(window, afterHide) {
  if (window.isSimpleFullScreen()) {
    window.setSimpleFullScreen(false);
    window.hide();
    afterHide == null ? void 0 : afterHide();
    return;
  }
  if (!window.isFullScreen()) {
    window.hide();
    afterHide == null ? void 0 : afterHide();
    return;
  }
  window.once("leave-full-screen", () => {
    if (!window.isDestroyed()) {
      window.hide();
      afterHide == null ? void 0 : afterHide();
    }
  });
  window.setFullScreen(false);
}
function toggleWindowFullScreen(window, platform = process.platform) {
  if (platform === "darwin") {
    window.setSimpleFullScreen(!window.isSimpleFullScreen());
    return;
  }
  window.setFullScreen(!window.isFullScreen());
}
function showMainWindow(window, app2) {
  var _a;
  if (!window) return;
  (_a = app2 == null ? void 0 : app2.show) == null ? void 0 : _a.call(app2);
  if (!window.isVisible()) window.show();
  if (window.isMinimized()) window.restore();
  window.focus();
}
function refreshWindowsDragHitTest(window, platform = process.platform, delayMs = 100) {
  if (platform !== "win32") return void 0;
  const timer = setTimeout(() => {
    if (window.isDestroyed() || window.isMinimized() || window.isMaximized() || window.isFullScreen()) {
      return;
    }
    const bounds = window.getBounds();
    window.setBounds({ ...bounds, height: bounds.height + 1 });
    window.setBounds(bounds);
  }, delayMs);
  return () => clearTimeout(timer);
}
function installWindowLifecycle({
  app: app2,
  window,
  shouldQuit
}) {
  window.on("close", (event) => {
    saveWindowState(app2, window);
    if (shouldQuit()) return;
    event.preventDefault();
    hideWindowSafely(window);
  });
  window.on("move", () => saveWindowState(app2, window));
  window.on("resize", () => saveWindowState(app2, window));
}

// electron/services/menu.ts
function buildApplicationMenuTemplate(appName, onNavigate, platform = process.platform, actions = {}) {
  const appMenu = platform === "darwin" ? [{
    label: appName,
    submenu: [
      { label: `About ${appName}`, click: () => onNavigate("about") },
      { type: "separator" },
      { label: "Settings...", accelerator: "CmdOrCtrl+,", click: () => onNavigate("settings") },
      { type: "separator" },
      { role: "services" },
      { type: "separator" },
      { label: `Hide ${appName}`, accelerator: "Command+H", click: () => {
        var _a;
        return (_a = actions.hide) == null ? void 0 : _a.call(actions);
      } },
      { role: "hideOthers" },
      { role: "unhide" },
      { type: "separator" },
      { role: "quit" }
    ]
  }] : [{
    label: "File",
    submenu: [
      { label: "Settings...", accelerator: "Ctrl+,", click: () => onNavigate("settings") },
      { type: "separator" },
      { role: "quit" }
    ]
  }];
  return [
    ...appMenu,
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" }
      ]
    },
    {
      label: "View",
      submenu: [
        {
          label: "Toggle Full Screen",
          accelerator: platform === "darwin" ? "Ctrl+Command+F" : "F11",
          click: () => {
            var _a;
            return (_a = actions.toggleFullScreen) == null ? void 0 : _a.call(actions);
          }
        }
      ]
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        { label: "Close Window", accelerator: "CmdOrCtrl+W", click: () => {
          var _a;
          return (_a = actions.close) == null ? void 0 : _a.call(actions);
        } }
      ]
    }
  ];
}
function buildRendererContextMenuTemplate(params) {
  if (params.isEditable) {
    return [
      { role: "undo", enabled: params.editFlags.canUndo },
      { role: "redo", enabled: params.editFlags.canRedo },
      { type: "separator" },
      { role: "cut", enabled: params.editFlags.canCut },
      { role: "copy", enabled: params.editFlags.canCopy },
      { role: "paste", enabled: params.editFlags.canPaste },
      { type: "separator" },
      { role: "selectAll", enabled: params.editFlags.canSelectAll }
    ];
  }
  if (params.selectionText.length > 0) {
    return [{ role: "copy", enabled: params.editFlags.canCopy }];
  }
  return [];
}
async function installRendererContextMenu(window) {
  const { Menu: Menu2 } = await import("electron");
  window.webContents.on("context-menu", (_event, params) => {
    const template = buildRendererContextMenuTemplate(params);
    if (template.length === 0 || window.isDestroyed()) return;
    Menu2.buildFromTemplate(template).popup({ window });
  });
}
async function installApplicationMenu(app2, getMainWindow, platform = process.platform) {
  const { Menu: Menu2 } = await import("electron");
  if (platform === "win32") {
    Menu2.setApplicationMenu(null);
    return;
  }
  const template = buildApplicationMenuTemplate(app2.name || "Claude Code Haha", (destination) => {
    var _a;
    (_a = getMainWindow()) == null ? void 0 : _a.webContents.send(ELECTRON_EVENT_CHANNELS.nativeMenuNavigate, destination);
  }, platform, {
    hide: () => {
      var _a;
      const window = getMainWindow();
      if (!window) {
        (_a = app2.hide) == null ? void 0 : _a.call(app2);
        return;
      }
      hideWindowSafely(window, () => {
        var _a2;
        return (_a2 = app2.hide) == null ? void 0 : _a2.call(app2);
      });
    },
    close: () => {
      var _a;
      (_a = getMainWindow()) == null ? void 0 : _a.close();
    },
    toggleFullScreen: () => {
      const window = getMainWindow();
      if (window) toggleWindowFullScreen(window, platform);
    }
  });
  Menu2.setApplicationMenu(Menu2.buildFromTemplate(template));
}

// electron/services/singleInstance.ts
function acquireSingleInstanceLock(app2, getMainWindow, env = process.env) {
  if (env.CC_HAHA_ELECTRON_DISABLE_SINGLE_INSTANCE_LOCK === "1") {
    return true;
  }
  const hasLock = app2.requestSingleInstanceLock();
  if (!hasLock) {
    app2.quit();
    return false;
  }
  app2.on("second-instance", () => {
    showMainWindow(getMainWindow(), app2);
  });
  return true;
}

// electron/services/tray.ts
var import_node_fs5 = require("node:fs");
var import_node_path6 = __toESM(require("node:path"), 1);
function resolveTrayIconPath(desktopRoot) {
  const candidates = [
    import_node_path6.default.join(desktopRoot, "src-tauri", "icons", "icon.png"),
    import_node_path6.default.join(desktopRoot, "public", "app-icon.png"),
    import_node_path6.default.join(desktopRoot, "dist", "app-icon.png")
  ];
  const resolved = candidates.find((candidate) => (0, import_node_fs5.existsSync)(candidate));
  if (!resolved) {
    throw new Error(`Electron tray icon not found under ${desktopRoot}`);
  }
  return resolved;
}
function shouldInstallTray(platform = process.platform) {
  return platform !== "darwin";
}
async function installTray({
  app: app2,
  desktopRoot,
  show,
  quit,
  electronRuntime
}) {
  const { Menu: Menu2, Tray, nativeImage: nativeImage2 } = electronRuntime ?? await import("electron");
  const icon = nativeImage2.createFromPath(resolveTrayIconPath(desktopRoot));
  const tray = new Tray(icon);
  tray.setToolTip(app2.name || "Claude Code Haha");
  tray.setContextMenu(Menu2.buildFromTemplate([
    { label: "Show Claude Code Haha", click: show },
    { type: "separator" },
    { label: "Quit Claude Code Haha", click: quit }
  ]));
  tray.on("click", show);
  return {
    tray,
    dispose() {
      tray.destroy();
    }
  };
}

// electron/services/updater.ts
var import_node_fs7 = require("node:fs");

// electron/services/appMode.ts
var import_node_crypto4 = require("node:crypto");
var import_node_fs6 = __toESM(require("node:fs"), 1);
var import_node_path7 = __toESM(require("node:path"), 1);
var import_node_process2 = __toESM(require("node:process"), 1);
var APP_MODE_FILE = "app-mode.json";
function systemClaudeConfigDir(app2) {
  return import_node_path7.default.join(app2.getPath("home"), ".claude");
}
function readAppModeConfig(configDir) {
  try {
    const parsed = JSON.parse(import_node_fs6.default.readFileSync(import_node_path7.default.join(configDir, APP_MODE_FILE), "utf8"));
    return {
      mode: typeof parsed.mode === "string" ? parsed.mode.toLowerCase() : "default",
      portable_dir: typeof parsed.portable_dir === "string" ? parsed.portable_dir.trim() : null
    };
  } catch {
    return null;
  }
}
function writeAppModeConfig(configDir, config) {
  import_node_fs6.default.mkdirSync(configDir, { recursive: true });
  const target = import_node_path7.default.join(configDir, APP_MODE_FILE);
  const temporary = import_node_path7.default.join(configDir, `.${APP_MODE_FILE}.${(0, import_node_crypto4.randomUUID)()}.tmp`);
  try {
    import_node_fs6.default.writeFileSync(temporary, JSON.stringify(config, null, 2));
    import_node_fs6.default.renameSync(temporary, target);
  } finally {
    import_node_fs6.default.rmSync(temporary, { force: true });
  }
}
function assertWritableDataDir(configDir) {
  try {
    import_node_fs6.default.mkdirSync(configDir, { recursive: true });
    const probeDir = import_node_fs6.default.mkdtempSync(import_node_path7.default.join(configDir, ".cc-haha-write-test-"));
    try {
      import_node_fs6.default.writeFileSync(import_node_path7.default.join(probeDir, "probe"), "");
    } finally {
      import_node_fs6.default.rmSync(probeDir, { recursive: true, force: true });
    }
  } catch {
    throw new Error(`Data storage directory is not writable: ${configDir}`);
  }
}
function resolveWithExistingAncestor(inputPath) {
  let existingPath = import_node_path7.default.resolve(inputPath);
  const missingSegments = [];
  while (!import_node_fs6.default.existsSync(existingPath)) {
    const parent = import_node_path7.default.dirname(existingPath);
    if (parent === existingPath) return import_node_path7.default.resolve(inputPath);
    missingSegments.unshift(import_node_path7.default.basename(existingPath));
    existingPath = parent;
  }
  return import_node_path7.default.join(import_node_fs6.default.realpathSync.native(existingPath), ...missingSegments);
}
function isPathAtOrBelow(parentDir, candidateDir) {
  const relative = import_node_path7.default.relative(
    resolveWithExistingAncestor(parentDir),
    resolveWithExistingAncestor(candidateDir)
  );
  return relative === "" || !relative.startsWith(`..${import_node_path7.default.sep}`) && relative !== ".." && !import_node_path7.default.isAbsolute(relative);
}
function normalizedCustomDir(app2, value) {
  const selectedDir = value == null ? void 0 : value.trim();
  if (!selectedDir) throw new Error("Choose an absolute custom data directory");
  if (!import_node_path7.default.isAbsolute(selectedDir)) throw new Error("Custom data storage must use an absolute path");
  const normalized = import_node_path7.default.resolve(selectedDir);
  if (isPathAtOrBelow(import_node_path7.default.dirname(app2.getPath("exe")), normalized)) {
    throw new Error("Custom data storage must stay outside the application install directory");
  }
  return normalized;
}
function externallyControlled(env) {
  return Boolean(env.CLAUDE_CONFIG_DIR && env.CC_HAHA_APP_PORTABLE_DIR !== "1");
}
function clearAppManagedPortableEnv(env = import_node_process2.default.env) {
  if (env.CC_HAHA_APP_PORTABLE_DIR !== "1") return;
  delete env.CLAUDE_CONFIG_DIR;
  delete env.CC_HAHA_APP_PORTABLE_DIR;
  delete env.WEBVIEW2_USER_DATA_FOLDER;
}
function determineStartupPortableDir(app2, env = import_node_process2.default.env) {
  if (env.CLAUDE_CONFIG_DIR) return null;
  const config = readAppModeConfig(app2.getPath("userData"));
  if ((config == null ? void 0 : config.mode) !== "portable" || !config.portable_dir || !import_node_path7.default.isAbsolute(config.portable_dir)) return null;
  try {
    return normalizedCustomDir(app2, config.portable_dir);
  } catch {
    return null;
  }
}
function applyStartupPortableMode(app2, env = import_node_process2.default.env) {
  clearAppManagedPortableEnv(env);
  if (env.CLAUDE_CONFIG_DIR) {
    env.CLAUDE_CONFIG_DIR = normalizedCustomDir(app2, env.CLAUDE_CONFIG_DIR);
    return null;
  }
  const customDir = determineStartupPortableDir(app2, env);
  if (!customDir) return null;
  const webViewDataDir = import_node_path7.default.join(customDir, "EBWebView");
  import_node_fs6.default.mkdirSync(webViewDataDir, { recursive: true });
  env.CLAUDE_CONFIG_DIR = customDir;
  env.CC_HAHA_APP_PORTABLE_DIR = "1";
  env.WEBVIEW2_USER_DATA_FOLDER = webViewDataDir;
  return customDir;
}
function getAppMode(app2, env = import_node_process2.default.env) {
  const envConfigDir = env.CLAUDE_CONFIG_DIR ? normalizedCustomDir(app2, env.CLAUDE_CONFIG_DIR) : null;
  const persistedCustomDir = envConfigDir ? null : determineStartupPortableDir(app2, env);
  const customDir = envConfigDir || persistedCustomDir;
  if (customDir) {
    return {
      mode: "portable",
      portableDir: customDir,
      activeConfigDir: customDir,
      configDirSource: envConfigDir && env.CC_HAHA_APP_PORTABLE_DIR !== "1" ? "environment" : "portable"
    };
  }
  return {
    mode: "default",
    portableDir: null,
    activeConfigDir: systemClaudeConfigDir(app2),
    configDirSource: "system"
  };
}
function setAppMode(app2, input, env = import_node_process2.default.env) {
  if (externallyControlled(env)) {
    throw new Error("CLAUDE_CONFIG_DIR is controlled by the launch environment");
  }
  if (input.mode === "default") {
    writeAppModeConfig(app2.getPath("userData"), { mode: "default", portable_dir: null });
    return;
  }
  if (input.mode !== "portable") throw new Error(`Unsupported app mode: ${String(input.mode)}`);
  const selectedDir = normalizedCustomDir(app2, input.portableDir);
  if (import_node_fs6.default.existsSync(selectedDir) && !import_node_fs6.default.statSync(selectedDir).isDirectory()) {
    throw new Error(`Custom data storage path is not a directory: ${selectedDir}`);
  }
  assertWritableDataDir(selectedDir);
  writeAppModeConfig(app2.getPath("userData"), {
    mode: "portable",
    portable_dir: selectedDir
  });
}

// electron/services/updater.ts
function updaterSessionProxyConfig(proxy) {
  return proxy ? { proxyRules: proxy, proxyBypassRules: "<local>" } : { mode: "system" };
}
function normalizeUpdateInfo(info) {
  if (!(info == null ? void 0 : info.version)) return null;
  const releaseNotes = Array.isArray(info.releaseNotes) ? info.releaseNotes.map((note) => note.note).filter(Boolean).join("\n\n") : info.releaseNotes;
  return {
    version: info.version,
    body: info.body ?? releaseNotes ?? null
  };
}
function isMissingUpdateMetadataError(error) {
  if (!error) return false;
  const maybeError = typeof error === "object" ? error : {};
  const code = typeof maybeError.code === "string" ? maybeError.code : "";
  const path14 = typeof maybeError.path === "string" ? maybeError.path : "";
  const message = typeof maybeError.message === "string" && maybeError.message ? maybeError.message : String(error);
  const referencesChannelMetadata = /latest(?:-[a-z0-9]+)?(?:-[a-z0-9]+)?\.ya?ml/i.test(message);
  if (code === "ENOENT") {
    return path14.endsWith("app-update.yml") || message.includes("app-update.yml");
  }
  if (code === "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") {
    return referencesChannelMetadata;
  }
  return referencesChannelMetadata && /cannot find|not found|404/i.test(message);
}
var ElectronUpdaterService = class {
  updater;
  proxyController;
  updateConfigPath;
  pendingUpdate = null;
  downloaded = false;
  proxyKey = null;
  constructor(updater, proxyController, runtimeOptions = {}) {
    this.updater = updater;
    this.proxyController = proxyController;
    this.updateConfigPath = runtimeOptions.updateConfigPath;
    this.updater.autoDownload = false;
    this.updater.disableDifferentialDownload = true;
    this.updater.logger = null;
  }
  async applyProxy(options) {
    var _a;
    if (!this.proxyController) return;
    const proxy = ((_a = options == null ? void 0 : options.proxy) == null ? void 0 : _a.trim()) || null;
    const nextProxyKey = proxy ? `manual:${proxy}` : "system";
    if (this.proxyKey === nextProxyKey) return;
    await this.proxyController.apply(proxy);
    this.proxyKey = nextProxyKey;
  }
  async checkForUpdates(options) {
    let result;
    try {
      await this.applyProxy(options);
      if (this.updateConfigPath && !(0, import_node_fs7.existsSync)(this.updateConfigPath)) {
        result = null;
      } else {
        result = await this.updater.checkForUpdates();
      }
    } catch (error) {
      if (!isMissingUpdateMetadataError(error)) throw error;
      result = null;
    }
    this.pendingUpdate = normalizeUpdateInfo(result == null ? void 0 : result.updateInfo);
    this.downloaded = false;
    return this.pendingUpdate;
  }
  async downloadUpdate(emit) {
    if (!this.pendingUpdate) {
      throw new Error("No Electron update is available to download");
    }
    if (this.downloaded) {
      emit({ event: "Finished" });
      return;
    }
    let lastTransferred = 0;
    let started = false;
    const onProgress = (progress) => {
      const transferred = Math.max(0, progress.transferred ?? 0);
      if (!started) {
        started = true;
        emit({ event: "Started", data: { contentLength: progress.total ?? null } });
      }
      const chunkLength = Math.max(0, transferred - lastTransferred);
      lastTransferred = transferred;
      if (chunkLength > 0) {
        emit({ event: "Progress", data: { chunkLength } });
      }
    };
    this.updater.on("download-progress", onProgress);
    try {
      await this.updater.downloadUpdate();
      if (!started) {
        emit({ event: "Started", data: { contentLength: null } });
      }
      emit({ event: "Finished" });
      this.downloaded = true;
    } finally {
      this.updater.off("download-progress", onProgress);
    }
  }
  cancelInstall() {
    this.pendingUpdate = null;
    this.downloaded = false;
  }
  stageDownloadedUpdate() {
    if (!this.pendingUpdate) {
      throw new Error("No Electron update is ready to install");
    }
    if (!this.downloaded) {
      throw new Error("Electron update has not finished downloading");
    }
  }
  hasDownloadedUpdate() {
    return !!this.pendingUpdate && this.downloaded;
  }
  quitAndInstallDownloadedUpdate(env = process.env) {
    this.stageDownloadedUpdate();
    clearAppManagedPortableEnv(env);
    this.updater.quitAndInstall(false, true);
  }
};

// electron/services/updateSmoke.ts
var import_node_fs8 = require("node:fs");
function parsePositiveInteger(value, fallback) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function parseUpdateSmokeEnv(env) {
  var _a;
  const version = (_a = env.CC_HAHA_ELECTRON_UPDATE_SMOKE_VERSION) == null ? void 0 : _a.trim();
  if (!version) return null;
  return {
    version,
    body: env.CC_HAHA_ELECTRON_UPDATE_SMOKE_BODY ?? "Electron update smoke release",
    totalBytes: parsePositiveInteger(env.CC_HAHA_ELECTRON_UPDATE_SMOKE_TOTAL_BYTES, 100),
    logPath: env.CC_HAHA_ELECTRON_UPDATE_SMOKE_LOG
  };
}
function writeLog(logPath, payload) {
  if (!logPath) return;
  (0, import_node_fs8.appendFileSync)(logPath, `${JSON.stringify({
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    ...payload
  })}
`);
}
var UpdateSmokeUpdater = class {
  constructor(config) {
    this.config = config;
  }
  autoDownload = true;
  logger = null;
  progressHandler = null;
  async checkForUpdates() {
    writeLog(this.config.logPath, {
      event: "check",
      version: this.config.version
    });
    return {
      updateInfo: {
        version: this.config.version,
        body: this.config.body
      }
    };
  }
  async downloadUpdate() {
    var _a, _b;
    writeLog(this.config.logPath, {
      event: "download-start",
      totalBytes: this.config.totalBytes
    });
    const firstChunk = Math.max(1, Math.floor(this.config.totalBytes / 2));
    (_a = this.progressHandler) == null ? void 0 : _a.call(this, { transferred: firstChunk, total: this.config.totalBytes });
    (_b = this.progressHandler) == null ? void 0 : _b.call(this, { transferred: this.config.totalBytes, total: this.config.totalBytes });
    writeLog(this.config.logPath, {
      event: "download-finish",
      totalBytes: this.config.totalBytes
    });
    return void 0;
  }
  quitAndInstall(isSilent, isForceRunAfter) {
    writeLog(this.config.logPath, {
      event: "quit-and-install",
      isSilent: isSilent ?? null,
      isForceRunAfter: isForceRunAfter ?? null
    });
  }
  on(event, handler) {
    if (event === "download-progress") this.progressHandler = handler;
    return this;
  }
  off(event, handler) {
    if (event === "download-progress" && this.progressHandler === handler) {
      this.progressHandler = null;
    }
    return this;
  }
};
function createUpdateSmokeUpdaterFromEnv(env) {
  const config = parseUpdateSmokeEnv(env);
  return config ? new UpdateSmokeUpdater(config) : null;
}

// electron/services/preview.ts
var import_node_fs9 = require("node:fs");

// electron/ipc/previewMessage.ts
var MAX_PREVIEW_EVENT_BYTES = 8 * 1024 * 1024;
var MAX_PREVIEW_TEXT_LENGTH = 32768;
function byteLength(input) {
  return new TextEncoder().encode(input).byteLength;
}
function isPlainRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isBoundedString(value, maxLength = MAX_PREVIEW_TEXT_LENGTH) {
  return typeof value === "string" && value.length <= maxLength;
}
function isPreviewDataUrl(value) {
  return typeof value === "string" && value.length <= MAX_PREVIEW_EVENT_BYTES && /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\r\n]+$/i.test(value);
}
function isPreviewKind(value) {
  return value === "full" || value === "viewport" || value === "element";
}
function isSelectionScreenshotKind(value) {
  return isPreviewKind(value) || value === "region";
}
function parsePreviewAgentMessage(raw) {
  if (byteLength(raw) > MAX_PREVIEW_EVENT_BYTES) return null;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isPlainRecord(parsed) || parsed.v !== 1 || typeof parsed.type !== "string") {
    return null;
  }
  switch (parsed.type) {
    case "ready":
      return { v: 1, type: "ready" };
    case "picker-exited":
      if (parsed.reason !== void 0 && parsed.reason !== "cancel-current" && parsed.reason !== "host" && parsed.reason !== "invalid-target") return null;
      return { v: 1, type: "picker-exited", ...parsed.reason ? { reason: parsed.reason } : {} };
    case "navigated":
      if (!isBoundedString(parsed.url) || !isBoundedString(parsed.title)) return null;
      try {
        const url = new URL(parsed.url);
        if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      } catch {
        return null;
      }
      return { v: 1, type: "navigated", url: parsed.url, title: parsed.title };
    case "error":
      if (!isBoundedString(parsed.message)) return null;
      return { v: 1, type: "error", message: parsed.message };
    case "screenshot":
      if (!isPreviewDataUrl(parsed.dataUrl) || !isPreviewKind(parsed.kind)) return null;
      return { v: 1, type: "screenshot", dataUrl: parsed.dataUrl, kind: parsed.kind };
    case "selection":
      if (!isPlainRecord(parsed.payload)) return null;
      if ("screenshot" in parsed.payload) {
        const screenshot = parsed.payload.screenshot;
        if (!isPlainRecord(screenshot)) return null;
        if (screenshot.dataUrl !== void 0 && !isPreviewDataUrl(screenshot.dataUrl)) return null;
        if (screenshot.kind !== void 0 && !isSelectionScreenshotKind(screenshot.kind)) return null;
      }
      return { v: 1, type: "selection", payload: parsed.payload };
    default:
      return null;
  }
}

// electron/services/zoom.ts
var MIN_APP_ZOOM = 0.5;
var MAX_APP_ZOOM = 2;
function normalizeZoomFactor(value) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 1;
  return Math.min(Math.max(numeric, MIN_APP_ZOOM), MAX_APP_ZOOM);
}

// electron/services/preview.ts
var FULL_CAPTURE_MAX_EDGE = 16384;
var FULL_CAPTURE_MAX_PIXELS = 32e6;
function attachPreviewView(parent, view) {
  var _a;
  if (parent.contentView) {
    parent.contentView.addChildView(view);
  } else {
    (_a = parent.addBrowserView) == null ? void 0 : _a.call(parent, view);
  }
}
function detachPreviewView(parent, view) {
  var _a;
  if (!parent) return;
  if (parent.contentView) {
    parent.contentView.removeChildView(view);
  } else {
    (_a = parent.removeBrowserView) == null ? void 0 : _a.call(parent, view);
  }
}
function isPlainRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isHostCaptureMessage(payload) {
  return isPlainRecord2(payload) && payload.v === 1 && payload.type === "capture" && (payload.kind === "full" || payload.kind === "viewport" || payload.kind === "element");
}
function isHostPickerMessage(payload) {
  return isPlainRecord2(payload) && payload.v === 1 && (payload.type === "enter-picker" || payload.type === "exit-picker");
}
function normalizePreviewUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("empty url");
  const parsed = new URL(trimmed);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`unsupported url scheme: ${trimmed}`);
  }
  return trimmed;
}
function normalizePreviewBounds(bounds) {
  for (const [key, value] of Object.entries(bounds)) {
    if (!Number.isFinite(value)) throw new Error(`invalid preview bounds ${key}`);
  }
  return {
    x: bounds.x,
    y: bounds.y,
    width: Math.max(0, bounds.width),
    height: Math.max(0, bounds.height)
  };
}
function normalizeScaleFactor(value) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
}
function roundDip(value) {
  return Math.round(value * 1e6) / 1e6;
}
function snapPreviewBoundsToScaleFactor(bounds, scaleFactor) {
  const normalized = normalizePreviewBounds(bounds);
  const factor = normalizeScaleFactor(scaleFactor);
  const left = Math.round(normalized.x * factor);
  const top = Math.round(normalized.y * factor);
  const right = Math.round((normalized.x + normalized.width) * factor);
  const bottom = Math.round((normalized.y + normalized.height) * factor);
  return {
    x: roundDip(left / factor),
    y: roundDip(top / factor),
    width: roundDip(Math.max(0, right - left) / factor),
    height: roundDip(Math.max(0, bottom - top) / factor)
  };
}
function resolvePreviewScriptPath(previewScriptPath) {
  if ((0, import_node_fs9.existsSync)(previewScriptPath)) return previewScriptPath;
  const unpackedPath = previewScriptPath.replace(/\.asar([/\\])/, ".asar.unpacked$1");
  if (unpackedPath !== previewScriptPath && (0, import_node_fs9.existsSync)(unpackedPath)) return unpackedPath;
  return previewScriptPath;
}
var ElectronPreviewService = class {
  createView;
  previewScriptPath;
  resolveScaleFactor;
  view = null;
  parent = null;
  requestedBounds = null;
  zoomFactor = 1;
  pickerArmed = false;
  fullCapture = null;
  constructor(options) {
    this.createView = options.createView;
    this.previewScriptPath = options.previewScriptPath;
    this.resolveScaleFactor = options.resolveScaleFactor;
  }
  async open(parent, url, bounds) {
    this.pickerArmed = false;
    const normalizedUrl = normalizePreviewUrl(url);
    this.parent = parent;
    this.requestedBounds = normalizePreviewBounds(bounds);
    const view = this.ensureView(parent);
    this.applyBounds(view);
    await view.webContents.loadURL(normalizedUrl);
  }
  async navigate(url) {
    this.pickerArmed = false;
    const view = this.requireView();
    await view.webContents.loadURL(normalizePreviewUrl(url));
  }
  setBounds(bounds) {
    this.requestedBounds = normalizePreviewBounds(bounds);
    this.applyBounds(this.view);
  }
  setVisible(visible) {
    var _a;
    if ((_a = this.view) == null ? void 0 : _a.setVisible) {
      this.view.setVisible(visible);
      return;
    }
    if (!this.view || !this.parent) return;
    if (visible) {
      attachPreviewView(this.parent, this.view);
    } else {
      detachPreviewView(this.parent, this.view);
    }
  }
  setZoomFactor(value) {
    this.zoomFactor = normalizeZoomFactor(value);
    this.applyZoomFactor(this.view);
  }
  refreshBounds() {
    this.applyBounds(this.view);
  }
  close() {
    var _a, _b, _c, _d;
    if (!this.view) return;
    detachPreviewView(this.parent, this.view);
    if (!((_b = (_a = this.view.webContents).isDestroyed) == null ? void 0 : _b.call(_a))) {
      (_d = (_c = this.view.webContents).close) == null ? void 0 : _d.call(_c);
    }
    this.view = null;
    this.parent = null;
    this.requestedBounds = null;
    this.pickerArmed = false;
  }
  async message(payload, renderer) {
    if (isHostCaptureMessage(payload) && renderer) {
      await this.captureScreenshotToRenderer(payload.kind, renderer);
      return;
    }
    if (isHostPickerMessage(payload)) {
      this.pickerArmed = payload.type === "enter-picker";
    }
    const raw = JSON.stringify(payload);
    const script = `globalThis.__PREVIEW_BRIDGE__?.handleHostRaw(${JSON.stringify(raw)})`;
    await this.requireView().webContents.executeJavaScript(script);
  }
  async sendMessageToRenderer(sender, raw, renderer) {
    var _a;
    if (sender !== ((_a = this.view) == null ? void 0 : _a.webContents)) return;
    if (typeof raw !== "string") return;
    const message = parsePreviewAgentMessage(raw);
    if (!message) return;
    if (message.type === "selection") {
      if (!this.pickerArmed) return;
      this.pickerArmed = false;
    } else if (message.type === "picker-exited") {
      this.pickerArmed = false;
    }
    const event = message.type === "selection" ? await this.withNativeSelectionScreenshot(message) : message;
    renderer == null ? void 0 : renderer.send(ELECTRON_EVENT_CHANNELS.previewEvent, event);
  }
  ensureView(parent) {
    if (this.view) return this.view;
    const view = this.createView();
    attachPreviewView(parent, view);
    view.webContents.on("did-finish-load", () => {
      this.pickerArmed = false;
      void this.injectPreviewAgent(view);
    });
    this.applyZoomFactor(view);
    this.view = view;
    this.parent = parent;
    return view;
  }
  requireView() {
    if (!this.view) throw new Error("preview not open");
    return this.view;
  }
  async injectPreviewAgent(view) {
    var _a, _b;
    if ((_b = (_a = view.webContents).isDestroyed) == null ? void 0 : _b.call(_a)) return;
    const script = (0, import_node_fs9.readFileSync)(resolvePreviewScriptPath(this.previewScriptPath), "utf8");
    await view.webContents.executeJavaScript(script);
  }
  async captureNativeDataUrl(kind = "viewport") {
    const webContents = this.requireView().webContents;
    if (kind === "full") return this.captureFullPageDataUrl(webContents);
    if (!webContents.capturePage) throw new Error("native preview capture unavailable");
    const image = await webContents.capturePage();
    return image.toDataURL();
  }
  async captureFullPageDataUrl(webContents) {
    var _a;
    if (((_a = this.fullCapture) == null ? void 0 : _a.webContents) === webContents) {
      return await this.fullCapture.promise;
    }
    const promise = this.captureFullPageDataUrlOnce(webContents);
    const capture = { webContents, promise };
    this.fullCapture = capture;
    try {
      return await promise;
    } finally {
      if (this.fullCapture === capture) this.fullCapture = null;
    }
  }
  async captureFullPageDataUrlOnce(webContents) {
    const debuggerApi = webContents.debugger;
    if (!debuggerApi) throw new Error("full preview capture unavailable");
    let attachedHere = false;
    try {
      if (!debuggerApi.isAttached()) {
        debuggerApi.attach("1.3");
        attachedHere = true;
      }
      const metrics = await debuggerApi.sendCommand("Page.getLayoutMetrics");
      if (!isPlainRecord2(metrics)) throw new Error("invalid full preview layout metrics");
      const contentSize = isPlainRecord2(metrics.cssContentSize) ? metrics.cssContentSize : metrics.contentSize;
      if (!isPlainRecord2(contentSize)) throw new Error("invalid full preview layout metrics");
      const width = Math.ceil(Number(contentSize.width));
      const height = Math.ceil(Number(contentSize.height));
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        throw new Error("invalid full preview dimensions");
      }
      if (width > FULL_CAPTURE_MAX_EDGE || height > FULL_CAPTURE_MAX_EDGE || width * height > FULL_CAPTURE_MAX_PIXELS) {
        throw new Error(`full preview capture exceeds safety limit: ${width}x${height}`);
      }
      const screenshot = await debuggerApi.sendCommand("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width, height, scale: 1 }
      });
      if (!isPlainRecord2(screenshot) || typeof screenshot.data !== "string" || !screenshot.data) {
        throw new Error("invalid full preview screenshot data");
      }
      return `data:image/png;base64,${screenshot.data}`;
    } finally {
      if (attachedHere) {
        try {
          if (debuggerApi.isAttached()) debuggerApi.detach();
        } catch {
        }
      }
    }
  }
  applyZoomFactor(view) {
    var _a, _b;
    (_b = view == null ? void 0 : (_a = view.webContents).setZoomFactor) == null ? void 0 : _b.call(_a, this.zoomFactor);
  }
  applyBounds(view) {
    var _a;
    if (!view || !this.parent || !this.requestedBounds) return;
    const scaleFactor = ((_a = this.resolveScaleFactor) == null ? void 0 : _a.call(this, this.parent)) ?? 1;
    view.setBounds(snapPreviewBoundsToScaleFactor(this.requestedBounds, scaleFactor));
  }
  async captureScreenshotToRenderer(kind, renderer) {
    try {
      renderer.send(ELECTRON_EVENT_CHANNELS.previewEvent, {
        v: 1,
        type: "screenshot",
        dataUrl: await this.captureNativeDataUrl(kind),
        kind
      });
    } catch (error) {
      renderer.send(ELECTRON_EVENT_CHANNELS.previewEvent, {
        v: 1,
        type: "error",
        message: String(error)
      });
    }
  }
  async withNativeSelectionScreenshot(message) {
    try {
      const payload = message.payload;
      const screenshot = isPlainRecord2(payload.screenshot) ? payload.screenshot : {};
      return {
        ...message,
        payload: {
          ...payload,
          screenshot: {
            ...screenshot,
            kind: screenshot.kind ?? "region",
            dataUrl: await this.captureNativeDataUrl("viewport")
          }
        }
      };
    } catch {
      return message;
    } finally {
      await this.clearSelectionOverlay();
    }
  }
  async clearSelectionOverlay() {
    var _a, _b;
    const webContents = (_a = this.view) == null ? void 0 : _a.webContents;
    if (!webContents || ((_b = webContents.isDestroyed) == null ? void 0 : _b.call(webContents))) return;
    try {
      await webContents.executeJavaScript("globalThis.__PREVIEW_AGENT_CLEAR_SELECTION_OVERLAY__?.()");
    } catch {
    }
  }
};

// electron/services/previewSession.ts
var import_node_crypto5 = require("node:crypto");
var PREVIEW_SESSION_PARTITION_PREFIX = "cc-haha-preview-";
function createPreviewSessionPartition() {
  return `${PREVIEW_SESSION_PARTITION_PREFIX}${(0, import_node_crypto5.randomUUID)()}`;
}
var MAIN_RENDERER_MEDIA_PATHS = [
  "/api/desktop-ui/preferences/profile/avatar",
  "/api/filesystem/file"
];
var MAIN_RENDERER_MEDIA_PREFIXES = [
  "/api/open-targets/icons/",
  "/preview-fs/"
];
function sameOrigin(left, right) {
  try {
    return new URL(left).origin === new URL(right).origin;
  } catch {
    return false;
  }
}
function isAllowlistedMainRendererMediaRequest(details, mainRendererWebContentsId) {
  var _a;
  if (details.webContentsId !== mainRendererWebContentsId) return false;
  const method = (_a = details.method) == null ? void 0 : _a.toUpperCase();
  if (method !== "GET" && method !== "HEAD") return false;
  if (details.resourceType !== "image" && details.resourceType !== "media") {
    return false;
  }
  let pathname;
  try {
    pathname = new URL(details.url).pathname;
  } catch {
    return false;
  }
  return MAIN_RENDERER_MEDIA_PATHS.includes(pathname) || MAIN_RENDERER_MEDIA_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
function configureLocalServerRequestAuth(webRequest, resolveLocalAccess, shouldAuthorize = () => true) {
  webRequest.onBeforeSendHeaders((details, callback) => {
    const localAccess = resolveLocalAccess();
    if (!localAccess || !sameOrigin(details.url, localAccess.serverUrl) || !shouldAuthorize(details)) {
      callback({ requestHeaders: details.requestHeaders });
      return;
    }
    callback({
      requestHeaders: {
        ...details.requestHeaders,
        Authorization: `Bearer ${localAccess.token}`
      }
    });
  });
}
function configurePreviewSessionPermissions(session2) {
  session2.setPermissionCheckHandler(() => false);
  session2.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
}

// electron/services/keychain.ts
function installMacOsChromiumKeychainPromptGuard(app2, platform = process.platform) {
  if (platform !== "darwin") return false;
  app2.commandLine.appendSwitch("use-mock-keychain");
  return true;
}

// electron/services/stdioGuards.ts
var guarded = /* @__PURE__ */ new WeakSet();
function installStdioWriteFailureGuards(streams = [process.stdout, process.stderr]) {
  let installed = 0;
  for (const stream of streams) {
    if (guarded.has(stream)) continue;
    stream.on("error", () => {
    });
    guarded.add(stream);
    installed += 1;
  }
  return installed;
}

// electron/services/appIdentity.ts
var WINDOWS_APP_USER_MODEL_ID = "com.claude-code-haha.desktop";
function applyWindowsAppUserModelId(app2, platform = process.platform, appUserModelId = WINDOWS_APP_USER_MODEL_ID) {
  if (platform !== "win32") return false;
  app2.setAppUserModelId(appUserModelId);
  return true;
}

// electron/services/navigationGuards.ts
function isLoopbackHostname2(hostname) {
  const normalized = hostname.trim().replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
  if (normalized === "localhost" || normalized === "::1") return true;
  const parts = normalized.split(".");
  return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d+$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
}
function isHttpUrl(url) {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
function isAllowedMainWindowNavigationUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "file:") return true;
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return isLoopbackHostname2(parsed.hostname);
    }
    return false;
  } catch {
    return false;
  }
}
function installMainWindowNavigationGuards(webContents, { openExternal }) {
  webContents.setWindowOpenHandler(({ url }) => {
    if (isHttpUrl(url)) openExternal(url);
    return { action: "deny" };
  });
  webContents.on("will-navigate", (event, url) => {
    if (isAllowedMainWindowNavigationUrl(url)) return;
    event.preventDefault();
    if (isHttpUrl(url)) openExternal(url);
  });
}
function installPreviewNavigationGuards(webContents, { openExternal }) {
  webContents.setWindowOpenHandler(({ url }) => {
    if (isHttpUrl(url)) openExternal(url);
    return { action: "deny" };
  });
  webContents.on("will-navigate", (event, url) => {
    if (!isHttpUrl(url)) event.preventDefault();
  });
}

// electron/services/previewLifecycle.ts
function isMainFrameNavigation(details, deprecatedIsMainFrame) {
  return details.isMainFrame ?? deprecatedIsMainFrame === true;
}
function isSameDocumentNavigation(details, deprecatedIsInPlace) {
  return details.isSameDocument ?? deprecatedIsInPlace === true;
}
function installPreviewCleanupOnRendererNavigation(webContents, closePreview) {
  webContents.on("did-start-navigation", (details, _url, isInPlace, isMainFrame) => {
    if (!isMainFrameNavigation(details, isMainFrame)) return;
    if (isSameDocumentNavigation(details, isInPlace)) return;
    closePreview();
  });
}

// electron/services/notificationSmoke.ts
var import_node_fs10 = require("node:fs");
var import_node_path8 = require("node:path");
var DEFAULT_DELAY_MS = 2500;
var MAX_DELAY_MS = 6e4;
function parseNotificationSmokeDelay(value) {
  if (!value) return DEFAULT_DELAY_MS;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_DELAY_MS;
  return Math.min(Math.max(Math.round(parsed), 0), MAX_DELAY_MS);
}
function shouldTriggerSyntheticAction(value) {
  return value === "1" || (value == null ? void 0 : value.toLowerCase()) === "true";
}
function appendNotificationSmokeLog(logPath, event) {
  (0, import_node_fs10.mkdirSync)((0, import_node_path8.dirname)(logPath), { recursive: true });
  (0, import_node_fs10.appendFileSync)(logPath, `${JSON.stringify(event)}
`);
}
function logNotificationSmokeRendererAck(env, payload) {
  var _a;
  const logPath = (_a = env.CC_HAHA_ELECTRON_NOTIFICATION_SMOKE_LOG) == null ? void 0 : _a.trim();
  if (!logPath) return false;
  appendNotificationSmokeLog(logPath, {
    event: "renderer_ack",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    payload
  });
  return true;
}
function scheduleNotificationSmoke({
  env,
  NotificationClass,
  onAction,
  setTimer = setTimeout,
  writeLog: writeLog2
}) {
  var _a, _b, _c, _d;
  const sessionId = (_a = env.CC_HAHA_ELECTRON_NOTIFICATION_SMOKE_SESSION_ID) == null ? void 0 : _a.trim();
  if (!sessionId) return false;
  const title = ((_b = env.CC_HAHA_ELECTRON_NOTIFICATION_SMOKE_TITLE) == null ? void 0 : _b.trim()) || "Claude Code Haha notification smoke";
  const body = ((_c = env.CC_HAHA_ELECTRON_NOTIFICATION_SMOKE_BODY) == null ? void 0 : _c.trim()) || "Click to return to the target session.";
  const delayMs = parseNotificationSmokeDelay(env.CC_HAHA_ELECTRON_NOTIFICATION_SMOKE_DELAY_MS);
  const triggerSyntheticAction = shouldTriggerSyntheticAction(env.CC_HAHA_ELECTRON_NOTIFICATION_SMOKE_TRIGGER_ACTION);
  const logPath = (_d = env.CC_HAHA_ELECTRON_NOTIFICATION_SMOKE_LOG) == null ? void 0 : _d.trim();
  const log = (event) => {
    if (writeLog2) {
      writeLog2(event);
      return;
    }
    if (logPath) appendNotificationSmokeLog(logPath, event);
  };
  log({ event: "scheduled", timestamp: (/* @__PURE__ */ new Date()).toISOString(), sessionId, title, body, delayMs });
  setTimer(() => {
    try {
      const target = {
        type: "session",
        sessionId,
        title
      };
      const sent = sendDesktopNotification({
        NotificationClass,
        options: {
          title,
          body,
          target
        },
        onAction: (payload) => {
          log({ event: "action", timestamp: (/* @__PURE__ */ new Date()).toISOString(), sessionId, payload });
          onAction(payload);
        },
        onLifecycle: (lifecycle) => {
          log({ event: "lifecycle", timestamp: (/* @__PURE__ */ new Date()).toISOString(), sessionId, lifecycle });
        }
      });
      log({ event: "sent", timestamp: (/* @__PURE__ */ new Date()).toISOString(), sessionId, sent });
      if (sent && triggerSyntheticAction) {
        const payload = {
          target,
          action: "synthetic-click"
        };
        log({ event: "synthetic_action", timestamp: (/* @__PURE__ */ new Date()).toISOString(), sessionId, payload });
        onAction(payload);
      }
    } catch (error) {
      log({
        event: "send_failed",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        sessionId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, delayMs);
  return true;
}

// electron/services/nativeAppearance.ts
var import_node_fs11 = require("node:fs");
var import_node_path9 = __toESM(require("node:path"), 1);
var APPEARANCE_STATE_FILE = "appearance-state.json";
var LIGHT_WINDOW_BACKGROUND = "#FFFFFF";
var DARK_WINDOW_BACKGROUND = "#201D17";
var HEX_COLOR2 = /^#[0-9a-fA-F]{6}$/;
var failedAppearanceWritePaths = /* @__PURE__ */ new Set();
function appearanceStatePath(app2, env = process.env) {
  return import_node_path9.default.join(
    env.CLAUDE_CONFIG_DIR || import_node_path9.default.join(app2.getPath("home"), ".claude"),
    APPEARANCE_STATE_FILE
  );
}
function isAppliedAppearance(value) {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value;
  return typeof candidate.isDark === "boolean" && typeof candidate.followSystem === "boolean" && typeof candidate.background === "string" && HEX_COLOR2.test(candidate.background) && typeof candidate.lightBackground === "string" && HEX_COLOR2.test(candidate.lightBackground);
}
function readAppearanceState(app2, env = process.env) {
  const statePath = appearanceStatePath(app2, env);
  if (!(0, import_node_fs11.existsSync)(statePath)) return null;
  try {
    const parsed = JSON.parse((0, import_node_fs11.readFileSync)(statePath, "utf-8"));
    return isAppliedAppearance(parsed) ? parsed : null;
  } catch (error) {
    console.error(`[desktop] failed to read appearance state ${statePath}:`, error);
    return null;
  }
}
function writeAppearanceState(app2, state, env = process.env) {
  if (!isAppliedAppearance(state)) return;
  const statePath = appearanceStatePath(app2, env);
  try {
    (0, import_node_fs11.mkdirSync)(import_node_path9.default.dirname(statePath), { recursive: true });
    (0, import_node_fs11.writeFileSync)(statePath, `${JSON.stringify(state, null, 2)}
`);
    failedAppearanceWritePaths.delete(statePath);
  } catch (error) {
    if (!failedAppearanceWritePaths.has(statePath)) {
      failedAppearanceWritePaths.add(statePath);
      console.error(`[desktop] failed to write appearance state ${statePath}:`, error);
    }
  }
}
function startupWindowBackground(cached, systemPrefersDark) {
  if (!cached) return systemPrefersDark ? DARK_WINDOW_BACKGROUND : LIGHT_WINDOW_BACKGROUND;
  if (!cached.followSystem) return cached.background;
  if (systemPrefersDark) return DARK_WINDOW_BACKGROUND;
  return cached.lightBackground;
}
function applyAppliedAppearance(state, { app: app2, windows, env = process.env }) {
  for (const window of windows()) {
    if (window.isDestroyed()) continue;
    window.setBackgroundColor(state.background);
  }
  writeAppearanceState(app2, state, env);
}

// electron/services/rendererEntry.ts
var import_node_path10 = __toESM(require("node:path"), 1);
function isAllowedDevRendererUrl(input) {
  try {
    const parsed = new URL(input);
    if (parsed.protocol !== "http:") return false;
    return parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost" || parsed.hostname === "::1" || parsed.hostname === "[::1]";
  } catch {
    return false;
  }
}
function resolveRendererEntry(options) {
  var _a, _b;
  const devUrl = (_b = (_a = options.env) == null ? void 0 : _a.ELECTRON_RENDERER_URL) == null ? void 0 : _b.trim();
  if (!options.isPackaged && devUrl) {
    if (!isAllowedDevRendererUrl(devUrl)) {
      throw new Error(`Refusing non-local Electron renderer URL: ${devUrl}`);
    }
    return devUrl;
  }
  return import_node_path10.default.join(options.appRoot, "dist", "index.html");
}

// electron/services/rendererLifecycle.ts
var DEFAULT_RENDERER_UNRESPONSIVE_RECOVERY_DELAY_MS = 1e4;
function installRendererLifecycle({
  window,
  isQuitting: isQuitting2,
  recordDiagnostic,
  writeSnapshot,
  onRendererProcessGone,
  onRecoveryExhausted,
  unresponsiveRecoveryDelayMs = DEFAULT_RENDERER_UNRESPONSIVE_RECOVERY_DELAY_MS
}) {
  let recoveryAttempted = false;
  let failureReported = false;
  let unresponsiveRecoveryTimer = null;
  let rendererReloadTimer = null;
  const clearUnresponsiveRecovery = () => {
    if (!unresponsiveRecoveryTimer) return;
    clearTimeout(unresponsiveRecoveryTimer);
    unresponsiveRecoveryTimer = null;
  };
  const clearRendererReload = () => {
    if (!rendererReloadTimer) return;
    clearTimeout(rendererReloadTimer);
    rendererReloadTimer = null;
  };
  const reportRecoveryFailure = (detail) => {
    if (failureReported || isQuitting2()) return;
    failureReported = true;
    onRecoveryExhausted(recordDiagnostic(`[recovery-exhausted] ${detail}`));
  };
  const recoverRenderer = (trigger) => {
    clearUnresponsiveRecovery();
    if (isQuitting2() || window.isDestroyed() || window.webContents.isDestroyed()) {
      recordDiagnostic(`[recovery-skipped] trigger=${trigger} quitting=${isQuitting2()}`);
      return;
    }
    if (rendererReloadTimer) {
      recordDiagnostic(`[recovery-already-scheduled] trigger=${trigger}`);
      return;
    }
    if (recoveryAttempted) {
      reportRecoveryFailure(`trigger=${trigger}`);
      return;
    }
    recoveryAttempted = true;
    recordDiagnostic(`[recovery-started] trigger=${trigger}`);
    rendererReloadTimer = setTimeout(() => {
      rendererReloadTimer = null;
      if (isQuitting2() || window.isDestroyed() || window.webContents.isDestroyed()) {
        recordDiagnostic(`[recovery-skipped] trigger=${trigger} quitting=${isQuitting2()}`);
        return;
      }
      try {
        window.webContents.reload();
      } catch (error) {
        reportRecoveryFailure(
          `trigger=${trigger} reloadError=${error instanceof Error ? error.message : String(error)}`
        );
      }
    }, 0);
  };
  window.webContents.on("did-finish-load", () => {
    clearUnresponsiveRecovery();
    if (recoveryAttempted) recordDiagnostic("[recovery-loaded]");
    writeSnapshot("did-finish-load");
  });
  window.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    writeSnapshot(`did-fail-load:${errorCode}:${errorDescription}:${validatedURL}`);
    if (recoveryAttempted && isMainFrame && errorCode !== -3) {
      reportRecoveryFailure(`loadError=${errorCode}:${errorDescription}`);
    }
  });
  window.webContents.on("render-process-gone", (_event, details) => {
    clearUnresponsiveRecovery();
    const detail = recordDiagnostic(
      `[process-gone] reason=${details.reason} exitCode=${details.exitCode}`
    );
    onRendererProcessGone == null ? void 0 : onRendererProcessGone(detail);
    writeSnapshot(`render-process-gone:${details.reason}:${details.exitCode}`);
    recoverRenderer(`process-gone:${details.reason}`);
  });
  window.webContents.on("unresponsive", () => {
    recordDiagnostic("[unresponsive]");
    writeSnapshot("unresponsive");
    if (unresponsiveRecoveryTimer) return;
    unresponsiveRecoveryTimer = setTimeout(() => {
      unresponsiveRecoveryTimer = null;
      recoverRenderer("unresponsive-timeout");
    }, unresponsiveRecoveryDelayMs);
  });
  window.webContents.on("responsive", () => {
    clearUnresponsiveRecovery();
    recordDiagnostic("[responsive]");
    writeSnapshot("responsive");
  });
  window.on("closed", () => {
    clearUnresponsiveRecovery();
    clearRendererReload();
  });
}

// electron/services/windowSmoke.ts
var import_node_fs12 = require("node:fs");
function writeWindowSmokeSnapshot(window, reason, env = process.env) {
  var _a, _b;
  const logPath = env.CC_HAHA_ELECTRON_WINDOW_SMOKE_LOG;
  if (!logPath) return;
  const payload = window ? {
    reason,
    destroyed: window.isDestroyed(),
    title: window.getTitle(),
    visible: window.isVisible(),
    focused: window.isFocused(),
    minimized: window.isMinimized(),
    maximized: window.isMaximized(),
    fullScreen: window.isFullScreen(),
    bounds: window.getBounds(),
    url: ((_a = window.webContents) == null ? void 0 : _a.getURL()) ?? null,
    loading: ((_b = window.webContents) == null ? void 0 : _b.isLoading()) ?? null
  } : {
    reason,
    missingWindow: true
  };
  (0, import_node_fs12.appendFileSync)(logPath, `${JSON.stringify({
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    ...payload
  })}
`);
}

// electron/services/windowStartup.ts
async function loadAndRevealMainWindow({
  load,
  beforeReveal,
  reveal,
  onLoadFailure
}) {
  let loaded = true;
  let loadError;
  try {
    await load();
  } catch (error) {
    loaded = false;
    loadError = error;
  }
  beforeReveal();
  reveal();
  if (!loaded) {
    onLoadFailure(loadError);
    return { loaded: false, error: loadError };
  }
  return { loaded: true };
}

// electron/services/petWindow.ts
var import_node_fs13 = require("node:fs");
var import_node_os4 = __toESM(require("node:os"), 1);
var import_node_path11 = __toESM(require("node:path"), 1);
var PET_WINDOW_WIDTH = 384;
var PET_WINDOW_HEIGHT = 400;
var PET_WINDOW_MARGIN = 24;
var PET_WINDOW_PARTITION = "cc-haha-pet";
var PET_WINDOW_STATE_FILE = "pet-window.json";
var MAX_ABSOLUTE_SCREEN_COORDINATE = 1e6;
var PET_WINDOW_DRAG_INTERVAL_MS = 16;
var PET_WINDOW_SHAPE_PADDING = 12;
var failedPetWindowStateWritePaths = /* @__PURE__ */ new Set();
var PET_PANEL_DEFAULT_PLACEMENT = Object.freeze({
  vertical: "above",
  horizontal: "center"
});
var PET_PANEL_GAP = 12;
var PET_PANEL_FLIP_HYSTERESIS = 24;
var PET_PANEL_HORIZONTAL_HYSTERESIS = 24;
function isFiniteScreenCoordinate(value) {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= MAX_ABSOLUTE_SCREEN_COORDINATE;
}
function isPetWindowPosition(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value;
  return isFiniteScreenCoordinate(record.x) && isFiniteScreenCoordinate(record.y);
}
function isPetWindowRegion(value) {
  if (!isPetWindowPosition(value)) return false;
  const record = value;
  return isFiniteScreenCoordinate(record.width) && isFiniteScreenCoordinate(record.height) && record.width > 0 && record.height > 0;
}
function roundPetWindowRegion(region) {
  return {
    x: Math.round(region.x),
    y: Math.round(region.y),
    width: Math.round(region.width),
    height: Math.round(region.height)
  };
}
function petWindowAnchor(state) {
  const region = state.region ?? {
    x: 0,
    y: 0,
    width: PET_WINDOW_WIDTH,
    height: PET_WINDOW_HEIGHT
  };
  return {
    x: state.x + region.x + Math.floor(region.width / 2),
    y: state.y + region.y + Math.floor(region.height / 2)
  };
}
function resolveHomePath(input, homeDir) {
  if (input === "~") return homeDir;
  if (input.startsWith(`~${import_node_path11.default.sep}`) || input.startsWith("~/") || input.startsWith("~\\")) {
    return import_node_path11.default.join(homeDir, input.slice(2));
  }
  return input;
}
function petWindowStatePath(env = process.env, homeDir = import_node_os4.default.homedir()) {
  var _a;
  const normalizedHome = import_node_path11.default.resolve(homeDir);
  const configuredRoot = (_a = env.CLAUDE_CONFIG_DIR) == null ? void 0 : _a.trim();
  const configRoot = configuredRoot ? import_node_path11.default.resolve(resolveHomePath(configuredRoot, normalizedHome)) : import_node_path11.default.join(normalizedHome, ".claude");
  return import_node_path11.default.join(configRoot, "cc-haha", PET_WINDOW_STATE_FILE);
}
function readPetWindowPosition(env = process.env, homeDir = import_node_os4.default.homedir()) {
  const statePath = petWindowStatePath(env, homeDir);
  if (!(0, import_node_fs13.existsSync)(statePath)) return null;
  try {
    const parsed = JSON.parse((0, import_node_fs13.readFileSync)(statePath, "utf8"));
    if (!isPetWindowPosition(parsed)) return null;
    const region = parsed.region;
    return {
      x: Math.round(parsed.x),
      y: Math.round(parsed.y),
      ...isPetWindowRegion(region) ? { region: roundPetWindowRegion(region) } : {}
    };
  } catch (error) {
    console.error(`[desktop] failed to read pet window state ${statePath}:`, error);
    return null;
  }
}
function writePetWindowPosition(state, env = process.env, homeDir = import_node_os4.default.homedir()) {
  if (!isPetWindowPosition(state)) return;
  const statePath = petWindowStatePath(env, homeDir);
  const temporaryPath = `${statePath}.${process.pid}.tmp`;
  try {
    (0, import_node_fs13.mkdirSync)(import_node_path11.default.dirname(statePath), { recursive: true, mode: 448 });
    (0, import_node_fs13.writeFileSync)(temporaryPath, `${JSON.stringify({
      x: Math.round(state.x),
      y: Math.round(state.y),
      ...isPetWindowRegion(state.region) ? { region: roundPetWindowRegion(state.region) } : {}
    }, null, 2)}
`, { mode: 384 });
    (0, import_node_fs13.renameSync)(temporaryPath, statePath);
    failedPetWindowStateWritePaths.delete(statePath);
  } catch (error) {
    (0, import_node_fs13.rmSync)(temporaryPath, { force: true });
    if (!failedPetWindowStateWritePaths.has(statePath)) {
      failedPetWindowStateWritePaths.add(statePath);
      console.error(`[desktop] failed to write pet window state ${statePath}:`, error);
    }
  }
}
function clampPetWindowPosition(position, workArea, visibleRegion = {
  x: 0,
  y: 0,
  width: PET_WINDOW_WIDTH,
  height: PET_WINDOW_HEIGHT
}) {
  const minX = workArea.x - visibleRegion.x;
  const minY = workArea.y - visibleRegion.y;
  const maxX = minX + Math.max(0, workArea.width - visibleRegion.width);
  const maxY = minY + Math.max(0, workArea.height - visibleRegion.height);
  return {
    x: Math.min(Math.max(Math.round(position.x), minX), maxX),
    y: Math.min(Math.max(Math.round(position.y), minY), maxY)
  };
}
function petPanelBounds(regions) {
  const attachments = regions.slice(1);
  if (attachments.length === 0) return null;
  const left = Math.min(...attachments.map((region) => region.x));
  const top = Math.min(...attachments.map((region) => region.y));
  const right = Math.max(...attachments.map((region) => region.x + region.width));
  const bottom = Math.max(...attachments.map((region) => region.y + region.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}
function resolvePetPanelPlacement({
  windowPosition,
  workArea,
  mascot,
  panel,
  previous
}) {
  if (!panel) return PET_PANEL_DEFAULT_PLACEMENT;
  const required = panel.height + PET_PANEL_GAP;
  const spaceAbove = windowPosition.y + mascot.y - workArea.y;
  const threshold = previous.vertical === "above" ? required : required + PET_PANEL_FLIP_HYSTERESIS;
  const vertical = spaceAbove >= threshold ? "above" : "below";
  const workAreaRight = workArea.x + workArea.width;
  const mascotScreenLeft = windowPosition.x + mascot.x;
  const mascotScreenRight = mascotScreenLeft + mascot.width;
  const mascotScreenCenter = mascotScreenLeft + mascot.width / 2;
  const centeredPanelLeft = mascotScreenCenter - panel.width / 2;
  const centeredPanelRight = mascotScreenCenter + panel.width / 2;
  const centeredFits = centeredPanelLeft >= workArea.x && centeredPanelRight <= workAreaRight;
  let horizontal = previous.horizontal;
  if (previous.horizontal === "center") {
    if (centeredPanelLeft < workArea.x) horizontal = "right";
    else if (centeredPanelRight > workAreaRight) horizontal = "left";
  } else if (previous.horizontal === "left") {
    const leftAlignedFits = mascotScreenRight - panel.width >= workArea.x;
    const rightAlignedFits = mascotScreenLeft + panel.width <= workAreaRight;
    if (!leftAlignedFits && rightAlignedFits) horizontal = "right";
    else if (centeredFits && centeredPanelRight <= workAreaRight - PET_PANEL_HORIZONTAL_HYSTERESIS) horizontal = "center";
  } else {
    const rightAlignedFits = mascotScreenLeft + panel.width <= workAreaRight;
    const leftAlignedFits = mascotScreenRight - panel.width >= workArea.x;
    if (!rightAlignedFits && leftAlignedFits) horizontal = "left";
    else if (centeredFits && centeredPanelLeft >= workArea.x + PET_PANEL_HORIZONTAL_HYSTERESIS) horizontal = "center";
  }
  return { vertical, horizontal };
}
function isPositiveExtent(extent) {
  return typeof (extent == null ? void 0 : extent.width) === "number" && extent.width > 0 && typeof (extent == null ? void 0 : extent.height) === "number" && extent.height > 0;
}
function petWindowContentExtent(window) {
  var _a;
  const candidates = [(_a = window.getContentBounds) == null ? void 0 : _a.call(window), window.getBounds()];
  const measured = candidates.find(isPositiveExtent);
  return {
    width: measured ? Math.round(measured.width) : PET_WINDOW_WIDTH,
    height: measured ? Math.round(measured.height) : PET_WINDOW_HEIGHT
  };
}
function movePetWindow(window, position) {
  window.setBounds({
    x: position.x,
    y: position.y,
    width: PET_WINDOW_WIDTH,
    height: PET_WINDOW_HEIGHT
  });
}
function normalizePetWindowRegion(region, extent) {
  const x = Math.max(0, Math.min(extent.width - 1, Math.round(region.x)));
  const y = Math.max(0, Math.min(extent.height - 1, Math.round(region.y)));
  const right = Math.max(x + 1, Math.min(extent.width, Math.round(region.x + region.width)));
  const bottom = Math.max(y + 1, Math.min(extent.height, Math.round(region.y + region.height)));
  return { x, y, width: right - x, height: bottom - y };
}
function getPetWindowBounds(workArea, restoredPosition) {
  if (restoredPosition) {
    return {
      ...clampPetWindowPosition(restoredPosition, workArea, restoredPosition.region),
      width: PET_WINDOW_WIDTH,
      height: PET_WINDOW_HEIGHT
    };
  }
  return {
    x: Math.max(
      workArea.x,
      workArea.x + workArea.width - PET_WINDOW_WIDTH - PET_WINDOW_MARGIN
    ),
    y: Math.max(
      workArea.y,
      workArea.y + workArea.height - PET_WINDOW_HEIGHT - PET_WINDOW_MARGIN
    ),
    width: PET_WINDOW_WIDTH,
    height: PET_WINDOW_HEIGHT
  };
}
function petWindowOptions(bounds, preload, platform = process.platform) {
  return {
    ...bounds,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    backgroundColor: "#00000000",
    frame: false,
    fullscreenable: false,
    hasShadow: false,
    maximizable: false,
    minimizable: false,
    resizable: false,
    show: false,
    // macOS runs a visible window's frame through
    // -[NSWindow constrainFrameRect:toScreen:], which rewrites any y above the
    // work area back down to its top edge. The mascot sits at the bottom of a
    // mostly transparent window, so clamping against it deliberately asks for a
    // negative y to push that padding off-screen — and AppKit silently refused,
    // stranding the mascot a padding-height below the menu bar. This is the one
    // switch that skips that method; clampPetWindowPosition stays the
    // authoritative bound on every platform and every edge.
    ...platform === "darwin" ? { enableLargerThanScreen: true } : { skipTaskbar: true },
    transparent: true,
    type: platform === "darwin" ? "panel" : void 0,
    webPreferences: {
      preload,
      partition: PET_WINDOW_PARTITION,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  };
}
function configurePetWindow(window, platform) {
  if (platform === "darwin") {
    window.setIgnoreMouseEvents(true, { forward: true });
  } else {
    window.setIgnoreMouseEvents(false);
    window.setShape([{ x: 0, y: 0, width: PET_WINDOW_WIDTH, height: PET_WINDOW_HEIGHT }]);
  }
  if (platform !== "darwin") return;
  window.setAlwaysOnTop(true, "floating");
  window.setVisibleOnAllWorkspaces(true, {
    skipTransformProcessType: true,
    visibleOnFullScreen: true
  });
}
var PetWindowController = class {
  window = null;
  creating = null;
  drag = null;
  dragTimer = null;
  visibleDragRegion = null;
  panelBounds = null;
  panelPlacement = PET_PANEL_DEFAULT_PLACEMENT;
  /**
   * Screen position the mascot has to keep once the renderer reports its next
   * layout.
   *
   * Set whenever the mascot is about to move inside the window while the user
   * expects it to stay put on screen: a flip moves it by the panel's height, and
   * a restart hands the renderer a saved position whose mascot offset belongs to
   * whichever side the panel was on when it was saved. Horizontal placement
   * moves the mascot inside the window too. Every case needs the window to move
   * the opposite way by the same amount.
   */
  pendingMascotAnchorScreen = null;
  pendingRestoredPosition = null;
  options;
  constructor(options) {
    this.options = options;
  }
  async create() {
    var _a, _b, _c, _d;
    const restoredPosition = ((_b = (_a = this.options).readPosition) == null ? void 0 : _b.call(_a)) ?? null;
    this.resetPanelState();
    this.pendingRestoredPosition = restoredPosition;
    if (restoredPosition == null ? void 0 : restoredPosition.region) {
      this.pendingMascotAnchorScreen = {
        x: restoredPosition.x + restoredPosition.region.x,
        y: restoredPosition.y + restoredPosition.region.y
      };
    }
    const currentWorkArea = restoredPosition && this.options.getWorkAreaForPoint ? this.options.getWorkAreaForPoint(petWindowAnchor(restoredPosition)) : this.options.getCurrentWorkArea();
    const window = this.options.createWindow(petWindowOptions(
      getPetWindowBounds(currentWorkArea, restoredPosition),
      this.options.preloadPath,
      this.options.platform
    ));
    this.window = window;
    window.on("closed", () => {
      this.finishDrag(window);
      if (this.window === window) {
        this.window = null;
        this.resetPanelState();
        this.pendingRestoredPosition = null;
      }
    });
    try {
      configurePetWindow(window, this.options.platform ?? process.platform);
      (_d = (_c = this.options).onCreated) == null ? void 0 : _d.call(_c, window);
      await this.options.load(window);
      return window;
    } catch (error) {
      if (!window.isDestroyed()) window.destroy();
      if (this.window === window) {
        this.window = null;
        this.resetPanelState();
        this.pendingRestoredPosition = null;
      }
      throw error;
    }
  }
  ensureWindow() {
    if (this.window && !this.window.isDestroyed()) {
      return Promise.resolve(this.window);
    }
    if (this.creating) return this.creating;
    const creating = this.create();
    this.creating = creating;
    void creating.finally(() => {
      if (this.creating === creating) this.creating = null;
    }).catch(() => void 0);
    return creating;
  }
  async show() {
    const window = await this.ensureWindow();
    if (!window.isVisible()) {
      if ((this.options.platform ?? process.platform) === "darwin") {
        window.setIgnoreMouseEvents(true, { forward: true });
      }
      window.showInactive();
      if ((this.options.platform ?? process.platform) === "darwin") {
        window.setAlwaysOnTop(true, "floating");
      } else {
        window.setAlwaysOnTop(true);
      }
    }
  }
  hide() {
    const window = this.window;
    this.finishDrag(window ?? void 0);
    if (!window || window.isDestroyed()) {
      this.window = null;
      return;
    }
    window.destroy();
    this.window = null;
    this.resetPanelState();
    this.pendingRestoredPosition = null;
  }
  resetPanelState() {
    this.visibleDragRegion = null;
    this.panelBounds = null;
    this.panelPlacement = PET_PANEL_DEFAULT_PLACEMENT;
    this.pendingMascotAnchorScreen = null;
  }
  owns(window) {
    return window !== null && this.window === window && !window.isDestroyed();
  }
  setIgnoreMouseEvents(window, ignore) {
    if (!this.owns(window)) {
      throw new Error("Pet window IPC sender does not own the companion window");
    }
    if ((this.options.platform ?? process.platform) !== "darwin") return;
    window.setIgnoreMouseEvents(ignore, ignore ? { forward: true } : void 0);
  }
  setInteractiveRegions(window, regions) {
    var _a, _b;
    if (!this.owns(window)) {
      throw new Error("Pet window IPC sender does not own the companion window");
    }
    const platform = this.options.platform ?? process.platform;
    const extent = petWindowContentExtent(window);
    const primaryRegion = regions[0];
    const dragRegion = primaryRegion ? normalizePetWindowRegion(primaryRegion, extent) : null;
    if (dragRegion) this.visibleDragRegion = dragRegion;
    const panel = petPanelBounds(regions);
    this.panelBounds = panel ? normalizePetWindowRegion(panel, extent) : null;
    if (dragRegion) {
      const bounds = window.getBounds();
      const restoredPosition = this.pendingRestoredPosition;
      this.pendingRestoredPosition = null;
      const requestedPosition = this.holdMascotAnchor(dragRegion, restoredPosition ?? bounds);
      const anchor = petWindowAnchor({ ...requestedPosition, region: dragRegion });
      const workArea = ((_b = (_a = this.options).getWorkAreaForPoint) == null ? void 0 : _b.call(_a, anchor)) ?? this.options.getCurrentWorkArea();
      const nextPosition = clampPetWindowPosition(requestedPosition, workArea, dragRegion);
      if (nextPosition.x !== bounds.x || nextPosition.y !== bounds.y) {
        movePetWindow(window, nextPosition);
      }
      this.updatePanelPlacement(window, nextPosition, workArea, dragRegion);
    }
    if (platform === "darwin") return this.panelPlacement;
    const shape = regions.map((region) => normalizePetWindowRegion({
      x: region.x - PET_WINDOW_SHAPE_PADDING,
      y: region.y - PET_WINDOW_SHAPE_PADDING,
      width: region.width + PET_WINDOW_SHAPE_PADDING * 2,
      height: region.height + PET_WINDOW_SHAPE_PADDING * 2
    }, extent));
    if (shape.length > 0) window.setShape(shape);
    return this.panelPlacement;
  }
  /**
   * Rebases the window on the screen position the mascot has to keep.
   *
   * The reported region is the first news of where the mascot actually sits
   * inside the window, so this is the point where a placement change or restore
   * becomes a window move that leaves the mascot where the user last saw it.
   */
  holdMascotAnchor(mascot, requestedPosition) {
    const anchorScreen = this.pendingMascotAnchorScreen;
    if (anchorScreen === null) return requestedPosition;
    this.pendingMascotAnchorScreen = null;
    const compensated = {
      x: anchorScreen.x - mascot.x,
      y: anchorScreen.y - mascot.y
    };
    const drag = this.drag;
    if (drag) {
      drag.windowStart = {
        x: drag.windowStart.x + compensated.x - requestedPosition.x,
        y: drag.windowStart.y + compensated.y - requestedPosition.y
      };
    }
    return compensated;
  }
  updatePanelPlacement(window, windowPosition, workArea, mascot) {
    var _a, _b;
    const previous = this.panelPlacement;
    const next = resolvePetPanelPlacement({
      windowPosition,
      workArea,
      mascot,
      panel: this.panelBounds,
      previous
    });
    if (next.vertical === previous.vertical && next.horizontal === previous.horizontal) return;
    this.pendingMascotAnchorScreen = {
      x: windowPosition.x + mascot.x,
      y: windowPosition.y + mascot.y
    };
    this.panelPlacement = next;
    (_b = (_a = this.options).onPanelPlacementChanged) == null ? void 0 : _b.call(_a, window, next);
  }
  dragWindow(window, payload) {
    var _a, _b;
    if (!this.owns(window)) {
      throw new Error("Pet window IPC sender does not own the companion window");
    }
    if (!isFiniteScreenCoordinate(payload.x) || !isFiniteScreenCoordinate(payload.y)) {
      throw new Error("Pet window drag coordinates must be finite screen coordinates");
    }
    if (payload.phase === "start") {
      this.finishDrag();
      const bounds = window.getBounds();
      const sampledPointer = (_b = (_a = this.options).getCursorScreenPoint) == null ? void 0 : _b.call(_a);
      const pointerStart = sampledPointer && isPetWindowPosition(sampledPointer) ? sampledPointer : payload;
      this.drag = {
        window,
        pointerStart: { x: pointerStart.x, y: pointerStart.y },
        windowStart: { x: bounds.x, y: bounds.y },
        lastPosition: { x: bounds.x, y: bounds.y }
      };
      if (this.options.getCursorScreenPoint) {
        this.dragTimer = setInterval(() => this.sampleDragPosition(), PET_WINDOW_DRAG_INTERVAL_MS);
      }
      return this.panelPlacement;
    }
    const drag = this.drag;
    if (!drag || drag.window !== window) {
      throw new Error("Pet window drag has not started");
    }
    const payloadPosition = { x: payload.x, y: payload.y };
    const cursorPosition = payload.phase === "end" ? this.readCursorScreenPoint() ?? payloadPosition : payloadPosition;
    this.updateDragPosition(drag, cursorPosition);
    if (payload.phase === "end") {
      this.finishDrag(window);
    }
    return this.panelPlacement;
  }
  readCursorScreenPoint() {
    var _a, _b;
    const point = (_b = (_a = this.options).getCursorScreenPoint) == null ? void 0 : _b.call(_a);
    return point && isPetWindowPosition(point) ? { x: point.x, y: point.y } : null;
  }
  sampleDragPosition() {
    const drag = this.drag;
    if (!drag || drag.window.isDestroyed()) {
      this.finishDrag(drag == null ? void 0 : drag.window);
      return;
    }
    const point = this.readCursorScreenPoint();
    if (point) this.updateDragPosition(drag, point);
  }
  updateDragPosition(drag, pointer) {
    var _a, _b;
    const requestedPosition = {
      x: drag.windowStart.x + pointer.x - drag.pointerStart.x,
      y: drag.windowStart.y + pointer.y - drag.pointerStart.y
    };
    const workArea = ((_b = (_a = this.options).getWorkAreaForPoint) == null ? void 0 : _b.call(_a, pointer)) ?? this.options.getCurrentWorkArea();
    const nextPosition = clampPetWindowPosition(
      requestedPosition,
      workArea,
      this.visibleDragRegion ?? void 0
    );
    if (nextPosition.x === drag.lastPosition.x && nextPosition.y === drag.lastPosition.y) return;
    movePetWindow(drag.window, nextPosition);
    drag.lastPosition = nextPosition;
    if (this.visibleDragRegion) {
      this.updatePanelPlacement(drag.window, nextPosition, workArea, this.visibleDragRegion);
    }
  }
  finishDrag(window) {
    var _a, _b;
    const drag = this.drag;
    if (window && drag && drag.window !== window) return;
    if (this.dragTimer) {
      clearInterval(this.dragTimer);
      this.dragTimer = null;
    }
    if (!drag) return;
    this.drag = null;
    (_b = (_a = this.options).writePosition) == null ? void 0 : _b.call(_a, {
      ...drag.lastPosition,
      ...this.visibleDragRegion ? { region: this.visibleDragRegion } : {}
    });
  }
  showContextMenu(window, closeLabel, menuFactory) {
    if (!this.owns(window)) {
      return Promise.reject(new Error("Pet window IPC sender does not own the companion window"));
    }
    return new Promise((resolve) => {
      let settled = false;
      const settle = (selected) => {
        if (settled) return;
        settled = true;
        resolve(selected);
      };
      const menu = menuFactory.buildFromTemplate([{
        label: closeLabel,
        click: () => settle(true)
      }]);
      menu.popup({
        window,
        callback: () => settle(false)
      });
    });
  }
  dispose() {
    this.finishDrag();
    if (this.window && !this.window.isDestroyed()) this.window.destroy();
    this.window = null;
  }
};

// electron/services/localePreference.ts
var import_node_crypto6 = require("node:crypto");
var import_node_fs14 = __toESM(require("node:fs"), 1);
var import_node_path12 = __toESM(require("node:path"), 1);

// src/i18n/locale.ts
var VALID_LOCALES = ["en", "zh", "zh-TW", "jp", "kr"];
function isLocale(value) {
  return typeof value === "string" && VALID_LOCALES.includes(value);
}

// electron/services/localePreference.ts
var LOCALE_PREFERENCE_FILE = "locale-preference.json";
function localePreferencePath(app2) {
  return import_node_path12.default.join(app2.getPath("userData"), LOCALE_PREFERENCE_FILE);
}
function readLocalePreference(app2) {
  var _a;
  try {
    const parsed = JSON.parse(import_node_fs14.default.readFileSync(localePreferencePath(app2), "utf8"));
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    const entries = Object.entries(parsed);
    if (entries.length !== 1 || ((_a = entries[0]) == null ? void 0 : _a[0]) !== "locale") return null;
    return isLocale(entries[0][1]) ? entries[0][1] : null;
  } catch {
    return null;
  }
}
function writeLocalePreference(app2, locale) {
  if (!isLocale(locale)) {
    throw new Error(`Unsupported locale preference: ${String(locale)}`);
  }
  const target = localePreferencePath(app2);
  const configDir = import_node_path12.default.dirname(target);
  const temporary = import_node_path12.default.join(configDir, `.${LOCALE_PREFERENCE_FILE}.${(0, import_node_crypto6.randomUUID)()}.tmp`);
  const preference = { locale };
  import_node_fs14.default.mkdirSync(configDir, { recursive: true });
  try {
    import_node_fs14.default.writeFileSync(temporary, `${JSON.stringify(preference, null, 2)}
`, {
      encoding: "utf8",
      mode: 384
    });
    import_node_fs14.default.renameSync(temporary, target);
  } finally {
    import_node_fs14.default.rmSync(temporary, { force: true });
  }
}

// electron/services/pets.ts
var import_node_fs15 = require("node:fs");
var import_promises3 = require("node:fs/promises");
var import_node_os5 = __toESM(require("node:os"), 1);
var import_node_path13 = __toESM(require("node:path"), 1);
var CUSTOM_PET_SPRITESHEET_WIDTH = 1536;
var CUSTOM_PET_SPRITESHEET_HEIGHT = 2288;
var CUSTOM_PET_SPRITESHEET_PIXELS = CUSTOM_PET_SPRITESHEET_WIDTH * CUSTOM_PET_SPRITESHEET_HEIGHT;
var CUSTOM_PET_SINGLE_IMAGE_MIN_DIMENSION = 32;
var CUSTOM_PET_SINGLE_IMAGE_MAX_DIMENSION = 4096;
var CUSTOM_PET_SINGLE_IMAGE_MAX_PIXELS = CUSTOM_PET_SINGLE_IMAGE_MAX_DIMENSION * CUSTOM_PET_SINGLE_IMAGE_MAX_DIMENSION;
var CUSTOM_PET_SINGLE_IMAGE_MANIFEST_VERSION = 1;
var CUSTOM_PET_SINGLE_IMAGE_RENDERER_VERSION = 1;
var CUSTOM_PET_SINGLE_IMAGE_MOTION_PROFILE = "soft-spring-v1";
var CUSTOM_PET_FOLDER_MAX_LENGTH = 73;
var DEFAULT_CUSTOM_PET_MAX_ENTRIES = 128;
var DEFAULT_CUSTOM_PET_MAX_DECODED_PIXELS = CUSTOM_PET_SPRITESHEET_PIXELS * 16;
var DEFAULT_CUSTOM_PET_MAX_MANIFEST_BYTES = 64 * 1024;
var DEFAULT_CUSTOM_PET_MAX_IMAGE_BYTES = 8 * 1024 * 1024;
var DEFAULT_CUSTOM_PET_MAX_TOTAL_IMAGE_BYTES = 8 * 1024 * 1024;
var DEFAULT_CUSTOM_PET_MAX_TOTAL_DATA_URL_BYTES = 12 * 1024 * 1024;
var MAX_DISPLAY_NAME_LENGTH = 80;
var MAX_DESCRIPTION_LENGTH = 500;
var MAX_IMAGE_PATH_LENGTH = 512;
var MIN_CUSTOM_PET_IMAGE_BYTES = 20;
var PET_FOLDER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
function createCustomPetCatalogLoader(load) {
  let inFlight = null;
  const loadCatalog = (() => {
    if (inFlight) return inFlight;
    const current = load();
    inFlight = current;
    void current.finally(() => {
      if (inFlight === current) inFlight = null;
    }).catch(() => void 0);
    return current;
  });
  loadCatalog.invalidate = () => {
    inFlight = null;
  };
  loadCatalog.invalidateAfter = async (mutation) => {
    const result = await mutation();
    loadCatalog.invalidate();
    return result;
  };
  return loadCatalog;
}
var PetPackageError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.name = "PetPackageError";
    this.code = code;
  }
};
function getPetPackageErrorCode(error) {
  return error instanceof PetPackageError ? error.code : "io-error";
}
function isNodeError(error) {
  return error instanceof Error && "code" in error;
}
function normalizeLimit(value, fallback) {
  return Number.isSafeInteger(value) && value !== void 0 && value >= 0 ? value : fallback;
}
function resolveHomePath2(input, homeDir) {
  if (input === "~") return homeDir;
  if (input.startsWith(`~${import_node_path13.default.sep}`) || input.startsWith("~/") || input.startsWith("~\\")) {
    return import_node_path13.default.join(homeDir, input.slice(2));
  }
  return input;
}
function resolveCustomPetsRoot(options = {}) {
  var _a;
  if (options.root) return import_node_path13.default.resolve(options.root);
  const env = options.env ?? process.env;
  const homeDir = import_node_path13.default.resolve(options.homeDir ?? import_node_os5.default.homedir());
  const configuredRoot = (_a = env.CLAUDE_CONFIG_DIR) == null ? void 0 : _a.trim();
  const claudeConfigDir3 = configuredRoot ? import_node_path13.default.resolve(resolveHomePath2(configuredRoot, homeDir)) : import_node_path13.default.join(homeDir, ".claude");
  return import_node_path13.default.join(claudeConfigDir3, "cc-haha", "pets");
}
async function ensureCustomPetsRoot(options = {}) {
  const root = resolveCustomPetsRoot(options);
  await (0, import_promises3.mkdir)(root, { recursive: true, mode: 448 });
  const rootStat = await (0, import_promises3.lstat)(root);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error("Custom pets root must be a real directory");
  }
  return root;
}
function sanitizeErrorEntry(entry) {
  if (!entry || entry.length > 256 || CONTROL_CHARACTER_PATTERN.test(entry)) return void 0;
  return entry;
}
function packageError(entry, error) {
  const safeEntry = sanitizeErrorEntry(entry);
  const normalized = error instanceof PetPackageError ? { code: error.code, message: error.message } : { code: "io-error", message: "Unable to read this custom pet package." };
  return safeEntry ? { entry: safeEntry, ...normalized } : normalized;
}
function rootError(code, message) {
  return { code, message };
}
async function captureDirectoryIdentity(directoryPath, options) {
  let beforeStat;
  try {
    beforeStat = await (0, import_promises3.lstat)(directoryPath);
  } catch {
    throw new PetPackageError(options.missingCode, options.invalidMessage);
  }
  if (beforeStat.isSymbolicLink()) {
    throw new PetPackageError(options.symlinkCode, options.invalidMessage);
  }
  if (!beforeStat.isDirectory()) {
    throw new PetPackageError(options.invalidCode, options.invalidMessage);
  }
  let resolvedPath;
  let afterStat;
  try {
    resolvedPath = await (0, import_promises3.realpath)(directoryPath);
    afterStat = await (0, import_promises3.lstat)(directoryPath);
  } catch {
    throw new PetPackageError(options.changedCode, options.changedMessage);
  }
  if (afterStat.isSymbolicLink() || !afterStat.isDirectory() || beforeStat.dev !== afterStat.dev || beforeStat.ino !== afterStat.ino) {
    throw new PetPackageError(options.changedCode, options.changedMessage);
  }
  return {
    ...options,
    directoryPath,
    realPath: import_node_path13.default.resolve(resolvedPath),
    dev: afterStat.dev,
    ino: afterStat.ino
  };
}
async function assertDirectoryIdentity(identity) {
  const current = await captureDirectoryIdentity(identity.directoryPath, identity);
  if (current.realPath !== identity.realPath || current.dev !== identity.dev || current.ino !== identity.ino) {
    throw new PetPackageError(identity.changedCode, identity.changedMessage);
  }
}
async function assertDirectoryIdentities(identities) {
  for (const identity of identities) {
    await assertDirectoryIdentity(identity);
  }
}
function assertDirectRealChild(parent, child) {
  if (import_node_path13.default.dirname(child.realPath) !== parent.realPath) {
    throw new PetPackageError(
      child.changedCode,
      child.changedMessage
    );
  }
}
var ROOT_DIRECTORY_OPTIONS = {
  missingCode: "root-invalid",
  symlinkCode: "root-invalid",
  invalidCode: "root-invalid",
  changedCode: "root-invalid",
  invalidMessage: "Custom pets root must be a real directory.",
  changedMessage: "Custom pets root changed while loading."
};
var PACKAGE_DIRECTORY_OPTIONS = {
  missingCode: "directory-changed",
  symlinkCode: "symlink-entry",
  invalidCode: "directory-changed",
  changedCode: "directory-changed",
  invalidMessage: "The custom pet package must be a real directory.",
  changedMessage: "The custom pet package changed while loading."
};
var IMAGE_DIRECTORY_OPTIONS = {
  missingCode: "missing-image",
  symlinkCode: "symlink-image",
  invalidCode: "invalid-image",
  changedCode: "directory-changed",
  invalidMessage: "The pet image path must contain only real directories.",
  changedMessage: "The pet image directory changed while loading."
};
async function readDirectEntries(root, maxEntries, validateRoot) {
  await validateRoot();
  const directory = await (0, import_promises3.opendir)(root);
  const entries = [];
  try {
    await validateRoot();
    while (entries.length <= maxEntries) {
      const entry = await directory.read();
      if (!entry) break;
      entries.push(entry);
    }
    await validateRoot();
  } finally {
    try {
      await directory.close();
    } catch {
    }
  }
  return {
    entries: entries.slice(0, maxEntries).sort((left, right) => left.name.localeCompare(right.name)),
    capped: entries.length > maxEntries
  };
}
async function readBoundedRegularFile(options) {
  var _a, _b, _c, _d, _e;
  await ((_a = options.validatePathContext) == null ? void 0 : _a.call(options));
  let pathStat;
  try {
    pathStat = await (0, import_promises3.lstat)(options.filePath);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      throw new PetPackageError(options.missingCode, options.missingMessage);
    }
    throw new PetPackageError(options.invalidCode, options.invalidMessage);
  }
  if (pathStat.isSymbolicLink()) {
    throw new PetPackageError(options.symlinkCode, options.symlinkMessage);
  }
  if (!pathStat.isFile()) {
    throw new PetPackageError(options.invalidCode, options.invalidMessage);
  }
  if (pathStat.size > options.maxBytes) {
    throw new PetPackageError(options.tooLargeCode, options.tooLargeMessage);
  }
  await ((_b = options.validatePathContext) == null ? void 0 : _b.call(options));
  const noFollow = import_node_fs15.constants.O_NOFOLLOW ?? 0;
  let file;
  try {
    file = await (0, import_promises3.open)(options.filePath, import_node_fs15.constants.O_RDONLY | noFollow);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      throw new PetPackageError(options.missingCode, options.missingMessage);
    }
    if (isNodeError(error) && error.code === "ELOOP") {
      throw new PetPackageError(options.symlinkCode, options.symlinkMessage);
    }
    throw new PetPackageError(options.invalidCode, options.invalidMessage);
  }
  try {
    const openedStat = await file.stat();
    if (!openedStat.isFile() || openedStat.dev !== pathStat.dev || openedStat.ino !== pathStat.ino) {
      throw new PetPackageError(options.invalidCode, options.invalidMessage);
    }
    if (openedStat.size > options.maxBytes) {
      throw new PetPackageError(options.tooLargeCode, options.tooLargeMessage);
    }
    await ((_c = options.validatePathContext) == null ? void 0 : _c.call(options));
    const chunks = [];
    let totalBytes = 0;
    while (totalBytes < openedStat.size) {
      const chunk = Buffer.allocUnsafe(Math.min(64 * 1024, openedStat.size - totalBytes));
      const { bytesRead } = await file.read(chunk, 0, chunk.byteLength, null);
      if (bytesRead === 0) break;
      totalBytes += bytesRead;
      (_d = options.onBytesRead) == null ? void 0 : _d.call(options, bytesRead);
      chunks.push(chunk.subarray(0, bytesRead));
    }
    const afterReadStat = await file.stat();
    if (!afterReadStat.isFile() || afterReadStat.dev !== openedStat.dev || afterReadStat.ino !== openedStat.ino || afterReadStat.size !== openedStat.size || totalBytes !== openedStat.size) {
      if (afterReadStat.size > options.maxBytes) {
        throw new PetPackageError(options.tooLargeCode, options.tooLargeMessage);
      }
      throw new PetPackageError(options.invalidCode, options.invalidMessage);
    }
    await ((_e = options.validatePathContext) == null ? void 0 : _e.call(options));
    return Buffer.concat(chunks, totalBytes);
  } finally {
    await file.close();
  }
}
function decodeManifest(data) {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(data);
  } catch {
    throw new PetPackageError("invalid-manifest", "pet.json must contain valid UTF-8 JSON.");
  }
  let manifest;
  try {
    manifest = JSON.parse(text);
  } catch {
    throw new PetPackageError("invalid-manifest", "pet.json must contain valid JSON.");
  }
  if (typeof manifest !== "object" || manifest === null || Array.isArray(manifest)) {
    throw new PetPackageError("invalid-manifest", "pet.json must contain a JSON object.");
  }
  return manifest;
}
function isRecord3(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function sanitizedTextField(value, maxLength, code, fieldName) {
  if (typeof value !== "string") {
    throw new PetPackageError(code, `${fieldName} must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength || CONTROL_CHARACTER_PATTERN.test(trimmed)) {
    throw new PetPackageError(code, `${fieldName} is invalid.`);
  }
  return trimmed;
}
function resolvePortableRelativePath(packageDir, value, options) {
  if (typeof value !== "string" || !value || value !== value.trim()) {
    throw new PetPackageError(options.code, `${options.fieldName} must be a relative path.`);
  }
  if (value.length > MAX_IMAGE_PATH_LENGTH || CONTROL_CHARACTER_PATTERN.test(value)) {
    throw new PetPackageError(options.code, `${options.fieldName} is invalid.`);
  }
  if (import_node_path13.default.posix.isAbsolute(value) || import_node_path13.default.win32.isAbsolute(value)) {
    throw new PetPackageError(options.code, `${options.fieldName} must be relative.`);
  }
  const portablePath = value.replaceAll("\\", "/");
  const segments = portablePath.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes(":")) || import_node_path13.default.posix.normalize(portablePath) !== portablePath) {
    throw new PetPackageError(options.code, `${options.fieldName} cannot traverse the package.`);
  }
  const absolutePath = import_node_path13.default.resolve(packageDir, ...segments);
  const relativeToPackage = import_node_path13.default.relative(packageDir, absolutePath);
  if (!relativeToPackage || relativeToPackage.startsWith("..") || import_node_path13.default.isAbsolute(relativeToPackage)) {
    throw new PetPackageError(options.code, `${options.fieldName} must stay inside the package.`);
  }
  return { relativePath: segments.join("/"), absolutePath };
}
function mimeTypeForPath(imagePath, fieldName) {
  const extension = import_node_path13.default.posix.extname(imagePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  throw new PetPackageError(
    "unsupported-image-format",
    `${fieldName} must point to a PNG or WebP image.`
  );
}
async function captureImageDirectoryIdentities(packageIdentity, imagePath) {
  const identities = [packageIdentity];
  const relativePath = import_node_path13.default.relative(packageIdentity.directoryPath, imagePath);
  const segments = relativePath.split(import_node_path13.default.sep);
  let current = packageIdentity.directoryPath;
  let parentIdentity = packageIdentity;
  for (const segment of segments.slice(0, -1)) {
    current = import_node_path13.default.join(current, segment);
    const componentIdentity = await captureDirectoryIdentity(current, IMAGE_DIRECTORY_OPTIONS);
    assertDirectRealChild(parentIdentity, componentIdentity);
    identities.push(componentIdentity);
    parentIdentity = componentIdentity;
  }
  return identities;
}
function hasExpectedImageSignature(data, mimeType) {
  if (mimeType === "image/png") {
    return data.byteLength >= 24 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && data.readUInt32BE(8) === 13 && data.toString("ascii", 12, 16) === "IHDR";
  }
  return data.byteLength >= 20 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP" && data.readUInt32LE(4) + 8 === data.byteLength;
}
var PNG_ACTL_CHUNK = 1633899596;
var WEBP_VP8X_CHUNK = 1448097880;
var WEBP_ANIM_CHUNK = 1095649613;
var WEBP_ANMF_CHUNK = 1095650630;
var WEBP_VP8X_ANIMATION_FLAG = 2;
function hasPngAnimationChunk(data) {
  let offset = 8;
  while (offset + 12 <= data.byteLength) {
    const chunkLength = data.readUInt32BE(offset);
    if (chunkLength > data.byteLength - offset - 12) break;
    if (data.readUInt32BE(offset + 4) === PNG_ACTL_CHUNK) return true;
    offset += 12 + chunkLength;
  }
  return false;
}
function hasWebpAnimationChunk(data) {
  let offset = 12;
  while (offset + 8 <= data.byteLength) {
    const chunkType = data.readUInt32BE(offset);
    const chunkLength = data.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    if (chunkLength > data.byteLength - chunkStart) break;
    if (chunkType === WEBP_ANIM_CHUNK || chunkType === WEBP_ANMF_CHUNK) return true;
    if (chunkType === WEBP_VP8X_CHUNK && chunkLength >= 1 && (data[chunkStart] & WEBP_VP8X_ANIMATION_FLAG) !== 0) {
      return true;
    }
    offset = chunkStart + chunkLength + chunkLength % 2;
  }
  return false;
}
function hasEmbeddedImageAnimation(data, mimeType) {
  return mimeType === "image/png" ? hasPngAnimationChunk(data) : hasWebpAnimationChunk(data);
}
function readUInt24LE(data, offset) {
  return data[offset] | data[offset + 1] << 8 | data[offset + 2] << 16;
}
function inspectPetImageSize({ data, mimeType }) {
  if (!hasExpectedImageSignature(data, mimeType)) {
    throw new Error("Invalid image header");
  }
  if (mimeType === "image/png") {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }
  let offset = 12;
  while (offset + 8 <= data.byteLength) {
    const chunkType = data.toString("ascii", offset, offset + 4);
    const chunkLength = data.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;
    if (chunkEnd > data.byteLength) break;
    if (chunkType === "VP8X" && chunkLength >= 10) {
      return {
        width: readUInt24LE(data, chunkStart + 4) + 1,
        height: readUInt24LE(data, chunkStart + 7) + 1
      };
    }
    if (chunkType === "VP8L" && chunkLength >= 5 && data[chunkStart] === 47) {
      const b1 = data[chunkStart + 1];
      const b2 = data[chunkStart + 2];
      const b3 = data[chunkStart + 3];
      const b4 = data[chunkStart + 4];
      return {
        width: 1 + b1 + ((b2 & 63) << 8),
        height: 1 + (b2 >> 6) + (b3 << 2) + ((b4 & 15) << 10)
      };
    }
    if (chunkType === "VP8 " && chunkLength >= 10 && data[chunkStart + 3] === 157 && data[chunkStart + 4] === 1 && data[chunkStart + 5] === 42) {
      return {
        width: data.readUInt16LE(chunkStart + 6) & 16383,
        height: data.readUInt16LE(chunkStart + 8) & 16383
      };
    }
    offset = chunkEnd + chunkLength % 2;
  }
  throw new Error("Unsupported WebP image header");
}
function isValidImageDimension(value) {
  return Number.isSafeInteger(value) && value > 0;
}
function imagePixels(size) {
  if (!isValidImageDimension(size.width) || !isValidImageDimension(size.height)) return 0;
  const pixels = size.width * size.height;
  return Number.isSafeInteger(pixels) ? pixels : 0;
}
function assertAtlasImageSize(size) {
  if (size.width !== CUSTOM_PET_SPRITESHEET_WIDTH || size.height !== CUSTOM_PET_SPRITESHEET_HEIGHT) {
    throw new PetPackageError(
      "invalid-image-dimensions",
      `The spritesheet image must be ${CUSTOM_PET_SPRITESHEET_WIDTH}x${CUSTOM_PET_SPRITESHEET_HEIGHT}.`
    );
  }
}
function assertSingleImageSize(size) {
  const pixels = imagePixels(size);
  if (size.width < CUSTOM_PET_SINGLE_IMAGE_MIN_DIMENSION || size.height < CUSTOM_PET_SINGLE_IMAGE_MIN_DIMENSION || size.width > CUSTOM_PET_SINGLE_IMAGE_MAX_DIMENSION || size.height > CUSTOM_PET_SINGLE_IMAGE_MAX_DIMENSION || pixels === 0 || pixels > CUSTOM_PET_SINGLE_IMAGE_MAX_PIXELS) {
    throw new PetPackageError(
      "invalid-image-dimensions",
      `The pet image must be between ${CUSTOM_PET_SINGLE_IMAGE_MIN_DIMENSION} and ${CUSTOM_PET_SINGLE_IMAGE_MAX_DIMENSION} pixels per side and contain no more than ${CUSTOM_PET_SINGLE_IMAGE_MAX_PIXELS} pixels.`
    );
  }
}
function assertCandidateImageSize(size, imageKind) {
  if (imageKind === "atlas-v2") assertAtlasImageSize(size);
  else assertSingleImageSize(size);
}
function parseManifestRenderer(packageDir, entry, manifest, displayName, description) {
  if (manifest.manifestVersion === void 0) {
    if (manifest.renderer !== void 0 || manifest.spriteVersionNumber !== 2) {
      throw new PetPackageError(
        "invalid-sprite-version",
        "spriteVersionNumber must be 2 for a legacy atlas pet."
      );
    }
    const resolvedImage2 = resolvePortableRelativePath(
      packageDir,
      manifest.spritesheetPath,
      { code: "invalid-spritesheet-path", fieldName: "spritesheetPath" }
    );
    return {
      imagePath: resolvedImage2.absolutePath,
      mimeType: mimeTypeForPath(resolvedImage2.relativePath, "spritesheetPath"),
      imageKind: "atlas-v2",
      metadata: {
        id: `custom:${entry}`,
        displayName,
        description,
        spriteVersionNumber: 2,
        spritesheetPath: resolvedImage2.relativePath
      }
    };
  }
  if (manifest.manifestVersion !== CUSTOM_PET_SINGLE_IMAGE_MANIFEST_VERSION) {
    throw new PetPackageError(
      "invalid-manifest-version",
      `manifestVersion must be ${CUSTOM_PET_SINGLE_IMAGE_MANIFEST_VERSION}.`
    );
  }
  if (!isRecord3(manifest.renderer)) {
    throw new PetPackageError("invalid-renderer", "renderer must be an object.");
  }
  const renderer = manifest.renderer;
  if (renderer.kind !== "single-image" || renderer.version !== CUSTOM_PET_SINGLE_IMAGE_RENDERER_VERSION) {
    throw new PetPackageError(
      "invalid-renderer",
      `renderer must use single-image version ${CUSTOM_PET_SINGLE_IMAGE_RENDERER_VERSION}.`
    );
  }
  const motionProfile = renderer.motionProfile ?? CUSTOM_PET_SINGLE_IMAGE_MOTION_PROFILE;
  if (motionProfile !== CUSTOM_PET_SINGLE_IMAGE_MOTION_PROFILE) {
    throw new PetPackageError("invalid-renderer", "The single-image motion profile is unsupported.");
  }
  const resolvedImage = resolvePortableRelativePath(
    packageDir,
    renderer.imagePath,
    { code: "invalid-image-path", fieldName: "imagePath" }
  );
  return {
    imagePath: resolvedImage.absolutePath,
    mimeType: mimeTypeForPath(resolvedImage.relativePath, "imagePath"),
    imageKind: "single-image",
    metadata: {
      id: `custom:${entry}`,
      displayName,
      description,
      manifestVersion: CUSTOM_PET_SINGLE_IMAGE_MANIFEST_VERSION,
      spriteVersionNumber: 1,
      imagePath: resolvedImage.relativePath,
      motionProfile
    }
  };
}
async function readManifestCandidate(root, rootIdentity, entry, maxManifestBytes) {
  const packageDir = import_node_path13.default.join(root, entry.name);
  if (entry.isSymbolicLink()) {
    throw new PetPackageError("symlink-entry", "Custom pet package symlinks are not allowed.");
  }
  if (!entry.isDirectory()) return null;
  if (entry.name.length > CUSTOM_PET_FOLDER_MAX_LENGTH || !PET_FOLDER_PATTERN.test(entry.name)) {
    throw new PetPackageError("invalid-id", "Custom pet folder name is not a safe slug.");
  }
  await assertDirectoryIdentity(rootIdentity);
  const packageIdentity = await captureDirectoryIdentity(
    packageDir,
    PACKAGE_DIRECTORY_OPTIONS
  );
  assertDirectRealChild(rootIdentity, packageIdentity);
  const manifestDirectoryIdentities = [rootIdentity, packageIdentity];
  const manifestData = await readBoundedRegularFile({
    filePath: import_node_path13.default.join(packageDir, "pet.json"),
    maxBytes: maxManifestBytes,
    validatePathContext: () => assertDirectoryIdentities(manifestDirectoryIdentities),
    missingCode: "missing-manifest",
    symlinkCode: "symlink-manifest",
    tooLargeCode: "manifest-too-large",
    invalidCode: "invalid-manifest",
    missingMessage: "The custom pet package is missing pet.json.",
    symlinkMessage: "pet.json cannot be a symlink.",
    tooLargeMessage: "pet.json exceeds the allowed size.",
    invalidMessage: "pet.json must be a regular file."
  });
  const manifest = decodeManifest(manifestData);
  const displayName = sanitizedTextField(
    manifest.displayName,
    MAX_DISPLAY_NAME_LENGTH,
    "invalid-display-name",
    "displayName"
  );
  const description = sanitizedTextField(
    manifest.description,
    MAX_DESCRIPTION_LENGTH,
    "invalid-description",
    "description"
  );
  const renderer = parseManifestRenderer(
    packageDir,
    entry.name,
    manifest,
    displayName,
    description
  );
  const imageDirectoryIdentities = await captureImageDirectoryIdentities(
    packageIdentity,
    renderer.imagePath
  );
  const directoryIdentities = [rootIdentity, ...imageDirectoryIdentities];
  await assertDirectoryIdentities(directoryIdentities);
  return {
    entry: entry.name,
    ...renderer,
    directoryIdentities
  };
}
async function loadCandidateImage(candidate, inspectImageSize, maxImageBytes, tooLargeCode, onImageRead, onDecodeAttempt) {
  const data = await readBoundedRegularFile({
    filePath: candidate.imagePath,
    maxBytes: maxImageBytes,
    validatePathContext: () => assertDirectoryIdentities(candidate.directoryIdentities),
    onBytesRead: onImageRead,
    missingCode: "missing-image",
    symlinkCode: "symlink-image",
    tooLargeCode,
    invalidCode: "invalid-image",
    missingMessage: "The pet image does not exist.",
    symlinkMessage: "The pet image cannot be a symlink.",
    tooLargeMessage: tooLargeCode === "image-too-large" ? "The pet image exceeds the allowed size." : "The total custom pet image budget has been reached.",
    invalidMessage: "The pet image must be a regular file."
  });
  if (!hasExpectedImageSignature(data, candidate.mimeType)) {
    throw new PetPackageError("invalid-image", "The pet image header is invalid.");
  }
  if (hasEmbeddedImageAnimation(data, candidate.mimeType)) {
    throw new PetPackageError(
      "invalid-image",
      "The pet image must be a static PNG or WebP."
    );
  }
  let headerSize;
  try {
    headerSize = inspectPetImageSize({
      data,
      mimeType: candidate.mimeType
    });
  } catch {
    throw new PetPackageError("invalid-image", "The pet image header is invalid.");
  }
  assertCandidateImageSize(headerSize, candidate.imageKind);
  onDecodeAttempt(imagePixels(headerSize));
  if (inspectImageSize !== inspectPetImageSize) {
    let decodedSize;
    try {
      decodedSize = await inspectImageSize({
        data,
        mimeType: candidate.mimeType
      });
    } catch {
      throw new PetPackageError("invalid-image", "The pet image cannot be decoded.");
    }
    assertCandidateImageSize(decodedSize, candidate.imageKind);
    if (decodedSize.width !== headerSize.width || decodedSize.height !== headerSize.height) {
      throw new PetPackageError(
        "invalid-image",
        "The decoded pet image dimensions do not match its header."
      );
    }
  }
  await assertDirectoryIdentities(candidate.directoryIdentities);
  return data;
}
function dataUrlPrefix(mimeType) {
  return `data:${mimeType};base64,`;
}
function maxRawBytesForDataUrl(mimeType, remainingBytes) {
  const availableBase64Bytes = remainingBytes - dataUrlPrefix(mimeType).length;
  if (availableBase64Bytes < 4) return 0;
  return Math.floor(availableBase64Bytes / 4) * 3;
}
function totalImageBudgetError() {
  return new PetPackageError(
    "total-image-bytes-exceeded",
    "The total custom pet image budget has been reached."
  );
}
async function assertCustomPetTargetAvailable(targetPath) {
  try {
    await (0, import_promises3.lstat)(targetPath);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return;
    throw new PetPackageError("io-error", "Unable to inspect the custom pet destination.");
  }
  throw new PetPackageError("duplicate-id", "A custom pet with this ID already exists.");
}
async function readCustomPetSourceImage(imagePath) {
  const resolved = import_node_path13.default.resolve(imagePath);
  const mimeType = mimeTypeForPath(resolved, "imagePath");
  const data = await readBoundedRegularFile({
    filePath: resolved,
    maxBytes: DEFAULT_CUSTOM_PET_MAX_IMAGE_BYTES,
    missingCode: "missing-image",
    symlinkCode: "symlink-image",
    tooLargeCode: "image-too-large",
    invalidCode: "invalid-image",
    missingMessage: "The selected pet image does not exist.",
    symlinkMessage: "The selected pet image cannot be a symlink.",
    tooLargeMessage: "The selected pet image exceeds the allowed size.",
    invalidMessage: "The selected pet image must be a regular file."
  });
  if (!hasExpectedImageSignature(data, mimeType)) {
    throw new PetPackageError("invalid-image", "The pet image header is invalid.");
  }
  if (hasEmbeddedImageAnimation(data, mimeType)) {
    throw new PetPackageError("invalid-image", "The pet image must be a static PNG or WebP.");
  }
  const { width, height } = inspectPetImageSize({ data, mimeType });
  return { data, mimeType, width, height };
}
function validatedCustomPetIdentity(input) {
  const slug = input.slug.trim();
  if (slug !== input.slug || slug.length === 0 || slug.length > CUSTOM_PET_FOLDER_MAX_LENGTH || !PET_FOLDER_PATTERN.test(slug)) {
    throw new PetPackageError("invalid-id", "Custom pet ID must be a lowercase kebab-case slug.");
  }
  return {
    slug,
    displayName: sanitizedTextField(
      input.displayName,
      MAX_DISPLAY_NAME_LENGTH,
      "invalid-display-name",
      "displayName"
    ),
    description: sanitizedTextField(
      input.description,
      MAX_DESCRIPTION_LENGTH,
      "invalid-description",
      "description"
    )
  };
}
async function createCustomPetFromAtlas(input, options = {}) {
  const { slug, displayName, description } = validatedCustomPetIdentity(input);
  const atlasPath = import_node_path13.default.resolve(input.atlasPath);
  const mimeType = mimeTypeForPath(atlasPath, "spritesheetPath");
  const atlasData = await readBoundedRegularFile({
    filePath: atlasPath,
    maxBytes: DEFAULT_CUSTOM_PET_MAX_IMAGE_BYTES,
    missingCode: "missing-image",
    symlinkCode: "symlink-image",
    tooLargeCode: "image-too-large",
    invalidCode: "invalid-image",
    missingMessage: "The selected spritesheet image does not exist.",
    symlinkMessage: "The selected spritesheet image cannot be a symlink.",
    tooLargeMessage: "The selected spritesheet image exceeds the allowed size.",
    invalidMessage: "The selected spritesheet image must be a regular file."
  });
  return installCustomAtlasPet({ slug, displayName, description, atlasData, mimeType }, options);
}
async function createCustomPetFromAtlasBytes(input, options = {}) {
  const { slug, displayName, description } = validatedCustomPetIdentity(input);
  if (input.mimeType !== "image/png" && input.mimeType !== "image/webp") {
    throw new PetPackageError(
      "unsupported-image-format",
      "The assembled spritesheet must be a PNG or WebP image."
    );
  }
  const atlasData = input.atlasData;
  if (!(atlasData instanceof Uint8Array) || atlasData.byteLength < MIN_CUSTOM_PET_IMAGE_BYTES) {
    throw new PetPackageError("invalid-image", "The assembled spritesheet image is not readable.");
  }
  if (atlasData.byteLength > DEFAULT_CUSTOM_PET_MAX_IMAGE_BYTES) {
    throw new PetPackageError(
      "image-too-large",
      "The assembled spritesheet image exceeds the allowed size."
    );
  }
  return installCustomAtlasPet(
    { slug, displayName, description, atlasData, mimeType: input.mimeType },
    options
  );
}
async function installCustomAtlasPet(request, options) {
  const { slug, displayName, description, atlasData } = request;
  const extension = request.mimeType === "image/png" ? "png" : "webp";
  const spritesheetPath = `spritesheet.${extension}`;
  const root = await ensureCustomPetsRoot(options);
  const rootIdentity = await captureDirectoryIdentity(root, ROOT_DIRECTORY_OPTIONS);
  const targetPath = import_node_path13.default.join(root, slug);
  await assertCustomPetTargetAvailable(targetPath);
  const stagingRoot = await (0, import_promises3.mkdtemp)(import_node_path13.default.join(import_node_path13.default.dirname(root), ".pet-install-"));
  const packagePath = import_node_path13.default.join(stagingRoot, slug);
  try {
    await (0, import_promises3.mkdir)(packagePath, { mode: 448 });
    await (0, import_promises3.writeFile)(import_node_path13.default.join(packagePath, spritesheetPath), atlasData, { flag: "wx", mode: 384 });
    await (0, import_promises3.writeFile)(
      import_node_path13.default.join(packagePath, "pet.json"),
      `${JSON.stringify({
        id: slug,
        displayName,
        description,
        spriteVersionNumber: 2,
        spritesheetPath
      }, null, 2)}
`,
      { flag: "wx", mode: 384 }
    );
    const validation = await loadCustomPets({
      root: stagingRoot,
      inspectImageSize: options.inspectImageSize,
      maxEntries: 1
    });
    const pet = validation.pets.find((candidate) => candidate.id === `custom:${slug}`);
    const validationError = validation.errors[0];
    if (!pet || pet.spriteVersionNumber !== 2 || validationError) {
      throw new PetPackageError(
        (validationError == null ? void 0 : validationError.code) ?? "invalid-image",
        (validationError == null ? void 0 : validationError.message) ?? "The custom pet package could not be validated."
      );
    }
    await assertDirectoryIdentity(rootIdentity);
    await assertCustomPetTargetAvailable(targetPath);
    try {
      await (0, import_promises3.rename)(packagePath, targetPath);
    } catch (error) {
      if (isNodeError(error) && (error.code === "EEXIST" || error.code === "ENOTEMPTY")) {
        throw new PetPackageError("duplicate-id", "A custom pet with this ID already exists.");
      }
      throw error;
    }
    await assertDirectoryIdentity(rootIdentity);
    return pet;
  } finally {
    await (0, import_promises3.rm)(stagingRoot, { recursive: true, force: true });
  }
}
async function createCustomPetFromImage(input, options = {}) {
  const slug = input.slug.trim();
  if (slug !== input.slug || slug.length === 0 || slug.length > CUSTOM_PET_FOLDER_MAX_LENGTH || !PET_FOLDER_PATTERN.test(slug)) {
    throw new PetPackageError("invalid-id", "Custom pet ID must be a lowercase kebab-case slug.");
  }
  const displayName = sanitizedTextField(
    input.displayName,
    MAX_DISPLAY_NAME_LENGTH,
    "invalid-display-name",
    "displayName"
  );
  const description = sanitizedTextField(
    input.description,
    MAX_DESCRIPTION_LENGTH,
    "invalid-description",
    "description"
  );
  const motionProfile = input.motionProfile ?? CUSTOM_PET_SINGLE_IMAGE_MOTION_PROFILE;
  if (motionProfile !== CUSTOM_PET_SINGLE_IMAGE_MOTION_PROFILE) {
    throw new PetPackageError("invalid-renderer", "The single-image motion profile is unsupported.");
  }
  const sourcePath = import_node_path13.default.resolve(input.imagePath);
  const mimeType = mimeTypeForPath(sourcePath, "imagePath");
  const extension = mimeType === "image/png" ? "png" : "webp";
  const imagePath = `pet.${extension}`;
  const imageData = await readBoundedRegularFile({
    filePath: sourcePath,
    maxBytes: DEFAULT_CUSTOM_PET_MAX_IMAGE_BYTES,
    missingCode: "missing-image",
    symlinkCode: "symlink-image",
    tooLargeCode: "image-too-large",
    invalidCode: "invalid-image",
    missingMessage: "The selected pet image does not exist.",
    symlinkMessage: "The selected pet image cannot be a symlink.",
    tooLargeMessage: "The selected pet image exceeds the allowed size.",
    invalidMessage: "The selected pet image must be a regular file."
  });
  const root = await ensureCustomPetsRoot(options);
  const rootIdentity = await captureDirectoryIdentity(root, ROOT_DIRECTORY_OPTIONS);
  const targetPath = import_node_path13.default.join(root, slug);
  await assertCustomPetTargetAvailable(targetPath);
  const stagingRoot = await (0, import_promises3.mkdtemp)(import_node_path13.default.join(import_node_path13.default.dirname(root), ".pet-install-"));
  const packagePath = import_node_path13.default.join(stagingRoot, slug);
  try {
    await (0, import_promises3.mkdir)(packagePath, { mode: 448 });
    await (0, import_promises3.writeFile)(import_node_path13.default.join(packagePath, imagePath), imageData, { flag: "wx", mode: 384 });
    await (0, import_promises3.writeFile)(
      import_node_path13.default.join(packagePath, "pet.json"),
      `${JSON.stringify({
        id: slug,
        displayName,
        description,
        manifestVersion: CUSTOM_PET_SINGLE_IMAGE_MANIFEST_VERSION,
        renderer: {
          kind: "single-image",
          version: CUSTOM_PET_SINGLE_IMAGE_RENDERER_VERSION,
          imagePath,
          motionProfile
        }
      }, null, 2)}
`,
      { flag: "wx", mode: 384 }
    );
    const validation = await loadCustomPets({
      root: stagingRoot,
      inspectImageSize: options.inspectImageSize,
      maxEntries: 1
    });
    const pet = validation.pets.find((candidate) => candidate.id === `custom:${slug}`);
    const validationError = validation.errors[0];
    if (!pet || pet.spriteVersionNumber !== 1 || validationError) {
      throw new PetPackageError(
        (validationError == null ? void 0 : validationError.code) ?? "invalid-image",
        (validationError == null ? void 0 : validationError.message) ?? "The custom pet package could not be validated."
      );
    }
    await assertDirectoryIdentity(rootIdentity);
    await assertCustomPetTargetAvailable(targetPath);
    try {
      await (0, import_promises3.rename)(packagePath, targetPath);
    } catch (error) {
      if (isNodeError(error) && (error.code === "EEXIST" || error.code === "ENOTEMPTY")) {
        throw new PetPackageError("duplicate-id", "A custom pet with this ID already exists.");
      }
      throw error;
    }
    await assertDirectoryIdentity(rootIdentity);
    return pet;
  } finally {
    await (0, import_promises3.rm)(stagingRoot, { recursive: true, force: true });
  }
}
function packageCanBeSkippedForExhaustedBudget(entry) {
  return entry.isDirectory() && entry.name.length <= CUSTOM_PET_FOLDER_MAX_LENGTH && PET_FOLDER_PATTERN.test(entry.name);
}
function canFitAnyCustomPetImage(options) {
  const dataUrlRawBudget = Math.max(
    maxRawBytesForDataUrl("image/png", options.remainingDataUrlBytes),
    maxRawBytesForDataUrl("image/webp", options.remainingDataUrlBytes)
  );
  return Math.min(
    options.maxImageBytes,
    options.remainingImageBytes,
    dataUrlRawBudget
  ) >= MIN_CUSTOM_PET_IMAGE_BYTES;
}
async function loadCustomPets(options = {}) {
  const root = resolveCustomPetsRoot(options);
  const pets = [];
  const errors = [];
  const maxEntries = normalizeLimit(options.maxEntries, DEFAULT_CUSTOM_PET_MAX_ENTRIES);
  const maxManifestBytes = normalizeLimit(
    options.maxManifestBytes,
    DEFAULT_CUSTOM_PET_MAX_MANIFEST_BYTES
  );
  const maxImageBytes = normalizeLimit(options.maxImageBytes, DEFAULT_CUSTOM_PET_MAX_IMAGE_BYTES);
  const maxTotalImageBytes = normalizeLimit(
    options.maxTotalImageBytes,
    DEFAULT_CUSTOM_PET_MAX_TOTAL_IMAGE_BYTES
  );
  const maxTotalDataUrlBytes = normalizeLimit(
    options.maxTotalDataUrlBytes,
    DEFAULT_CUSTOM_PET_MAX_TOTAL_DATA_URL_BYTES
  );
  const maxDecodedPixels = normalizeLimit(
    options.maxDecodedPixels,
    DEFAULT_CUSTOM_PET_MAX_DECODED_PIXELS
  );
  const inspectImageSize = options.inspectImageSize ?? inspectPetImageSize;
  let rootStat;
  try {
    rootStat = await (0, import_promises3.lstat)(root);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return { root, pets, errors };
    return {
      root,
      pets,
      errors: [rootError("io-error", "Unable to read the custom pets root.")]
    };
  }
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    return {
      root,
      pets,
      errors: [rootError("root-invalid", "Custom pets root must be a real directory.")]
    };
  }
  let rootIdentity;
  try {
    rootIdentity = await captureDirectoryIdentity(root, ROOT_DIRECTORY_OPTIONS);
  } catch (error) {
    const normalized = error instanceof PetPackageError ? rootError(error.code, error.message) : rootError("root-invalid", "Custom pets root changed while loading.");
    return { root, pets, errors: [normalized] };
  }
  let directEntries;
  try {
    directEntries = await readDirectEntries(
      root,
      maxEntries,
      () => assertDirectoryIdentity(rootIdentity)
    );
  } catch (error) {
    const normalized = error instanceof PetPackageError ? rootError(error.code, error.message) : rootError("io-error", "Unable to scan the custom pets root.");
    return {
      root,
      pets,
      errors: [normalized]
    };
  }
  if (directEntries.capped) {
    errors.push(rootError("entry-limit", `Only the first ${maxEntries} custom pet entries were scanned.`));
  }
  let remainingImageBytes = maxTotalImageBytes;
  let remainingDataUrlBytes = maxTotalDataUrlBytes;
  let remainingDecodedPixels = maxDecodedPixels;
  for (const entry of directEntries.entries) {
    if (!canFitAnyCustomPetImage({
      maxImageBytes,
      remainingImageBytes,
      remainingDataUrlBytes
    })) {
      if (packageCanBeSkippedForExhaustedBudget(entry)) {
        errors.push(packageError(entry.name, totalImageBudgetError()));
      } else if (entry.isSymbolicLink()) {
        errors.push(packageError(
          entry.name,
          new PetPackageError("symlink-entry", "Custom pet package symlinks are not allowed.")
        ));
      } else if (entry.isDirectory() && (entry.name.length > CUSTOM_PET_FOLDER_MAX_LENGTH || !PET_FOLDER_PATTERN.test(entry.name))) {
        errors.push(packageError(
          entry.name,
          new PetPackageError("invalid-id", "Custom pet folder name is not a safe slug.")
        ));
      }
      continue;
    }
    try {
      const candidate = await readManifestCandidate(root, rootIdentity, entry, maxManifestBytes);
      if (!candidate) continue;
      const remainingDataUrlRawBytes = maxRawBytesForDataUrl(
        candidate.mimeType,
        remainingDataUrlBytes
      );
      const remainingReadBytes = Math.min(
        maxImageBytes,
        remainingImageBytes,
        remainingDataUrlRawBytes
      );
      if (remainingReadBytes === 0) throw totalImageBudgetError();
      const data = await loadCandidateImage(
        candidate,
        inspectImageSize,
        remainingReadBytes,
        remainingReadBytes < maxImageBytes ? "total-image-bytes-exceeded" : "image-too-large",
        (bytes) => {
          remainingImageBytes -= bytes;
        },
        (decodedPixels) => {
          if (remainingDecodedPixels < decodedPixels) {
            throw new PetPackageError(
              "decode-budget-exceeded",
              "The total custom pet decoded-pixel budget has been reached."
            );
          }
          remainingDecodedPixels -= decodedPixels;
        }
      );
      const dataUrl = `${dataUrlPrefix(candidate.mimeType)}${data.toString("base64")}`;
      if (dataUrl.length > remainingDataUrlBytes) throw totalImageBudgetError();
      remainingDataUrlBytes -= dataUrl.length;
      pets.push({
        ...candidate.metadata,
        mimeType: candidate.mimeType,
        dataUrl
      });
    } catch (error) {
      errors.push(packageError(entry.name, error));
    }
  }
  try {
    await assertDirectoryIdentity(rootIdentity);
  } catch (error) {
    pets.length = 0;
    const normalized = error instanceof PetPackageError ? rootError(error.code, error.message) : rootError("root-invalid", "Custom pets root changed while loading.");
    errors.push(normalized);
  }
  return { root, pets, errors };
}

// electron/main.ts
var mainWindow = null;
var serverRuntime = null;
var updaterService = null;
var terminalService = null;
var previewService = null;
var petWindowController = null;
var traceWindows = /* @__PURE__ */ new Map();
var isQuitting = false;
var trayController = null;
installStdioWriteFailureGuards();
installMacOsChromiumKeychainPromptGuard(import_electron.app);
if (process.platform === "win32" && Number(import_node_os6.default.release().split(".")[0]) < 10) {
  import_electron.app.disableHardwareAcceleration();
}
var lazyAutoUpdater;
function createAutoUpdaterStub() {
  const stub = {
    autoDownload: false,
    disableDifferentialDownload: true,
    logger: null,
    netSession: { setProxy: async () => void 0 },
    setFeedURL: () => void 0,
    checkForUpdates: () => Promise.resolve(null),
    downloadUpdate: () => Promise.reject(new Error("electron-updater is not installed")),
    quitAndInstall: () => void 0,
    on: () => stub,
    once: () => stub,
    off: () => stub,
    removeAllListeners: () => stub
  };
  return stub;
}
function loadAutoUpdater() {
  if (lazyAutoUpdater) return lazyAutoUpdater;
  try {
    const updaterModule = require("electron-updater");
    lazyAutoUpdater = updaterModule.autoUpdater ?? createAutoUpdaterStub();
  } catch {
    console.warn("[updater] electron-updater is not installed; automatic updates are disabled");
    lazyAutoUpdater = createAutoUpdaterStub();
  }
  return lazyAutoUpdater;
}
function appRoot() {
  return import_electron.app.isPackaged ? import_electron.app.getAppPath() : process.cwd();
}
function unpackedRoot() {
  const root = appRoot();
  return import_electron.app.isPackaged ? root.replace(/\.asar$/, ".asar.unpacked") : root;
}
function preloadPath() {
  return import_node_path14.default.join(appRoot(), "electron-dist", "preload.cjs");
}
function previewPreloadPath() {
  return import_node_path14.default.join(appRoot(), "electron-dist", "preview-preload.cjs");
}
function petPreloadPath() {
  return import_node_path14.default.join(appRoot(), "electron-dist", "pet-preload.cjs");
}
function previewAgentPath() {
  return import_node_path14.default.join(appRoot(), "src-tauri", "resources", "preview-agent.js");
}
function rendererEntry() {
  return resolveRendererEntry({
    isPackaged: import_electron.app.isPackaged,
    appRoot: appRoot(),
    env: process.env
  });
}
var lastAppliedAppearance = null;
function currentAppearance() {
  if (!lastAppliedAppearance) lastAppliedAppearance = readAppearanceState(import_electron.app);
  return lastAppliedAppearance;
}
function resolveStartupWindowBackground() {
  return startupWindowBackground(currentAppearance(), import_electron.nativeTheme.shouldUseDarkColors);
}
function installSystemAppearanceWatch() {
  import_electron.nativeTheme.on("updated", () => {
    const current = currentAppearance();
    if (current && !current.followSystem) return;
    const background = startupWindowBackground(current, import_electron.nativeTheme.shouldUseDarkColors);
    for (const window of [mainWindow, ...traceWindows.values()]) {
      if (!window || window.isDestroyed()) continue;
      window.setBackgroundColor(background);
    }
  });
}
async function loadRendererEntry(window, query) {
  const entry = rendererEntry();
  if (/^https?:\/\//.test(entry)) {
    const url = new URL(entry);
    for (const [key, value] of Object.entries(query ?? {})) {
      url.searchParams.set(key, value);
    }
    await window.loadURL(url.toString());
  } else {
    await window.loadFile(entry, query ? { query } : void 0);
  }
}
async function openTraceWindow(sessionId) {
  const existing = traceWindows.get(sessionId);
  if (existing && !existing.isDestroyed()) {
    showMainWindow(existing, import_electron.app);
    return;
  }
  const traceWindow = new import_electron.BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 860,
    minHeight: 560,
    title: "Trace",
    autoHideMenuBar: true,
    show: false,
    backgroundColor: resolveStartupWindowBackground(),
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  traceWindows.set(sessionId, traceWindow);
  traceWindow.on("closed", () => {
    traceWindows.delete(sessionId);
  });
  installMainWindowNavigationGuards(traceWindow.webContents, { openExternal: openExternalUrl });
  await loadRendererEntry(traceWindow, {
    traceWindow: "1",
    traceSessionId: sessionId
  });
  showMainWindow(traceWindow, import_electron.app);
}
function getServerRuntime() {
  serverRuntime ??= new ElectronServerRuntime({
    desktopRoot: unpackedRoot(),
    appRoot: appRoot(),
    h5DistDir: import_node_path14.default.join(unpackedRoot(), "dist"),
    diagnosticsFile: electronHostDiagnosticsFile(process.env),
    resolveSystemProxy: (url) => import_electron.session.defaultSession.resolveProxy(url)
  });
  return serverRuntime;
}
function resolvePetServerAccess() {
  const runtime = getServerRuntime();
  const serverUrl = runtime.getActiveServerUrl();
  return serverUrl ? { serverUrl, token: runtime.getPetAccessToken() } : null;
}
function resolveMainRendererServerAccess() {
  const runtime = getServerRuntime();
  const serverUrl = runtime.getActiveServerUrl();
  return serverUrl ? { serverUrl, token: runtime.getLocalAccessToken() } : null;
}
function getUpdaterService() {
  const smokeUpdater = createUpdateSmokeUpdaterFromEnv(process.env);
  updaterService ??= new ElectronUpdaterService(smokeUpdater ?? loadAutoUpdater(), {
    async apply(proxy) {
      await loadAutoUpdater().netSession.setProxy(updaterSessionProxyConfig(proxy));
    }
  }, {
    updateConfigPath: !smokeUpdater && import_electron.app.isPackaged ? import_node_path14.default.join(process.resourcesPath, "app-update.yml") : void 0
  });
  return updaterService;
}
function nodePtyRuntimeCacheDir() {
  if (!import_electron.app.isPackaged || process.platform !== "darwin") return void 0;
  return import_node_path14.default.join(import_electron.app.getPath("userData"), "native", `node-pty-${process.platform}-${process.arch}-${import_electron.app.getVersion()}`);
}
function getTerminalService() {
  terminalService ??= new ElectronTerminalService({
    app: import_electron.app,
    nodePtySourceDir: import_electron.app.isPackaged ? import_node_path14.default.join(unpackedRoot(), "node_modules", "node-pty") : void 0,
    nodePtyCacheDir: nodePtyRuntimeCacheDir()
  });
  return terminalService;
}
var previewViewConstructor = electron.WebContentsView ?? electron.BrowserView;
function getPreviewService() {
  previewService ??= new ElectronPreviewService({
    previewScriptPath: previewAgentPath(),
    resolveScaleFactor: (parent) => {
      var _a;
      const bounds = (_a = parent.getBounds) == null ? void 0 : _a.call(parent);
      return bounds ? import_electron.screen.getDisplayMatching(bounds).scaleFactor : 1;
    },
    createView: () => {
      if (!previewViewConstructor) {
        throw new Error("This Electron runtime provides neither WebContentsView nor BrowserView");
      }
      const view = new previewViewConstructor({
        webPreferences: {
          preload: previewPreloadPath(),
          partition: createPreviewSessionPartition(),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true
        }
      });
      configurePreviewSessionPermissions(view.webContents.session);
      installPreviewNavigationGuards(view.webContents, { openExternal: openExternalUrl });
      return view;
    }
  });
  return previewService;
}
function getPetWindowController() {
  petWindowController ??= new PetWindowController({
    createWindow: (options) => new import_electron.BrowserWindow(options),
    getCursorScreenPoint: () => import_electron.screen.getCursorScreenPoint(),
    getCurrentWorkArea: () => import_electron.screen.getDisplayNearestPoint(
      import_electron.screen.getCursorScreenPoint()
    ).workArea,
    getWorkAreaForPoint: (point) => import_electron.screen.getDisplayNearestPoint(point).workArea,
    preloadPath: petPreloadPath(),
    platform: process.platform,
    readPosition: () => readPetWindowPosition(process.env, import_electron.app.getPath("home")),
    writePosition: (position) => writePetWindowPosition(position, process.env, import_electron.app.getPath("home")),
    onCreated: (window) => {
      configurePreviewSessionPermissions(window.webContents.session);
      configureLocalServerRequestAuth(
        window.webContents.session.webRequest,
        resolvePetServerAccess
      );
      installMainWindowNavigationGuards(window.webContents, { openExternal: openExternalUrl });
    },
    load: (window) => loadRendererEntry(window, { petWindow: "1" }),
    onPanelPlacementChanged: (window, placement) => {
      if (window.isDestroyed()) return;
      window.webContents.send(ELECTRON_EVENT_CHANNELS.petPanelPlacementChanged, placement);
    }
  });
  return petWindowController;
}
var loadCustomPetCatalog = createCustomPetCatalogLoader(() => loadCustomPets({
  inspectImageSize: ({ data }) => import_electron.nativeImage.createFromBuffer(data).getSize()
}));
async function listCustomPets() {
  const { pets, errors } = await loadCustomPetCatalog();
  return { pets, errors };
}
function focusPetSession(sessionId) {
  showMainWindow(mainWindow, import_electron.app);
  mainWindow == null ? void 0 : mainWindow.webContents.send(ELECTRON_EVENT_CHANNELS.petNavigateSession, sessionId);
}
function currentWindow(event) {
  const window = import_electron.BrowserWindow.fromWebContents(event.sender);
  if (!window) throw new Error("No BrowserWindow for Electron IPC event");
  return window;
}
function registerHandler(channel, handler) {
  import_electron.ipcMain.handle(channel, async (event, payload) => {
    if (!isElectronIpcChannel(channel) || !validateElectronIpcPayload(channel, payload)) {
      throw new Error(`Invalid Electron IPC payload for ${channel}`);
    }
    const senderWindow = import_electron.BrowserWindow.fromWebContents(event.sender);
    if ((petWindowController == null ? void 0 : petWindowController.owns(senderWindow)) && !isElectronIpcChannelAllowedForPetWindow(channel)) {
      throw new Error(`Electron IPC channel ${channel} is not available to the pet window`);
    }
    return handler(event, payload);
  });
}
function unsupported(name) {
  throw new Error(`${name} is not implemented in the Electron host yet`);
}
function emitNotificationAction(payload) {
  showMainWindow(mainWindow, import_electron.app);
  mainWindow == null ? void 0 : mainWindow.webContents.send(ELECTRON_EVENT_CHANNELS.notificationAction, payload);
}
function broadcastLocaleChanged(locale) {
  for (const window of import_electron.BrowserWindow.getAllWindows()) {
    if (window.isDestroyed()) continue;
    window.webContents.send(ELECTRON_EVENT_CHANNELS.appLocaleChanged, locale);
  }
}
async function handleCommandInvoke(payload) {
  const { command, args } = payload;
  switch (command) {
    case "plugin:notification|is_permission_granted":
      return notificationPermissionState(import_electron.Notification) === "granted";
    case "plugin:notification|request_permission":
    case "macos_request_notification_permission":
      return requestNotificationPermission(import_electron.Notification);
    case "macos_notification_permission_state":
      return notificationPermissionState(import_electron.Notification);
    case "macos_send_notification":
      return sendDesktopNotification({
        NotificationClass: import_electron.Notification,
        options: args,
        onAction: emitNotificationAction
      });
    case "macos_open_notification_settings":
      return openSystemSettingsUrl("x-apple.systempreferences:com.apple.preference.notifications");
    case "open_windows_notification_settings":
      return openSystemSettingsUrl("ms-settings:notifications");
    default:
      return unsupported(`Electron command ${command}`);
  }
}
function registerIpcHandlers() {
  import_electron.ipcMain.on(ELECTRON_INTERNAL_CHANNELS.previewMessageFromView, (event, raw) => {
    void getPreviewService().sendMessageToRenderer(event.sender, raw, mainWindow == null ? void 0 : mainWindow.webContents);
  });
  registerHandler(ELECTRON_IPC_CHANNELS.appGetVersion, () => import_electron.app.getVersion());
  registerHandler(
    ELECTRON_IPC_CHANNELS.appGetLocalePreference,
    () => readLocalePreference(import_electron.app)
  );
  registerHandler(ELECTRON_IPC_CHANNELS.appSetLocalePreference, (event, payload) => {
    if (currentWindow(event) !== mainWindow) {
      throw new Error("Only the main window can change the locale preference");
    }
    const locale = payload;
    writeLocalePreference(import_electron.app, locale);
    broadcastLocaleChanged(locale);
  });
  registerHandler(
    ELECTRON_IPC_CHANNELS.appGetPreferredSystemLanguages,
    () => import_electron.app.getPreferredSystemLanguages()
  );
  registerHandler(ELECTRON_IPC_CHANNELS.runtimeGetServerUrl, () => getServerRuntime().getServerUrl());
  registerHandler(
    ELECTRON_IPC_CHANNELS.runtimeGetLocalAccessToken,
    () => getServerRuntime().getLocalAccessToken()
  );
  registerHandler(
    ELECTRON_IPC_CHANNELS.runtimeGetPetAccessToken,
    () => getServerRuntime().getPetAccessToken()
  );
  registerHandler(ELECTRON_IPC_CHANNELS.commandInvoke, (_event, payload) => handleCommandInvoke(payload));
  registerHandler(ELECTRON_IPC_CHANNELS.clipboardReadText, () => import_electron.clipboard.readText());
  registerHandler(ELECTRON_IPC_CHANNELS.clipboardWriteText, (_event, payload) => import_electron.clipboard.writeText(String(payload)));
  registerHandler(ELECTRON_IPC_CHANNELS.shellOpen, (_event, payload) => openExternalUrl(String(payload)));
  registerHandler(ELECTRON_IPC_CHANNELS.shellOpenPath, (_event, payload) => openSystemPath(String(payload)));
  registerHandler(ELECTRON_IPC_CHANNELS.traceOpenWindow, (_event, payload) => openTraceWindow(String(payload)));
  registerHandler(ELECTRON_IPC_CHANNELS.petsList, () => listCustomPets());
  registerHandler(ELECTRON_IPC_CHANNELS.petsCreateFromImage, async (event, payload) => {
    const input = payload;
    const imagePath = await openDialog(currentWindow(event), {
      title: input.dialogTitle || "Choose a transparent pet image",
      filters: [{ name: input.dialogFilterName || "Pet image", extensions: ["png", "webp"] }]
    });
    if (typeof imagePath !== "string") return null;
    try {
      const pet = await loadCustomPetCatalog.invalidateAfter(() => createCustomPetFromImage({
        slug: input.slug,
        displayName: input.displayName,
        description: input.description,
        imagePath
      }, {
        inspectImageSize: ({ data }) => import_electron.nativeImage.createFromBuffer(data).getSize()
      }));
      return { id: pet.id };
    } catch (error) {
      return { errorCode: getPetPackageErrorCode(error) };
    }
  });
  registerHandler(ELECTRON_IPC_CHANNELS.petsCreateFromAtlas, async (event, payload) => {
    const input = payload;
    const atlasPath = await openDialog(currentWindow(event), {
      title: input.dialogTitle || "Choose a v2 pet animation atlas",
      filters: [{ name: input.dialogFilterName || "Pet animation atlas", extensions: ["png", "webp"] }]
    });
    if (typeof atlasPath !== "string") return null;
    try {
      const pet = await loadCustomPetCatalog.invalidateAfter(() => createCustomPetFromAtlas({
        slug: input.slug,
        displayName: input.displayName,
        description: input.description,
        atlasPath
      }, {
        inspectImageSize: ({ data }) => import_electron.nativeImage.createFromBuffer(data).getSize()
      }));
      return { id: pet.id };
    } catch (error) {
      return { errorCode: getPetPackageErrorCode(error) };
    }
  });
  registerHandler(ELECTRON_IPC_CHANNELS.petsPickSourceSheet, async (event, payload) => {
    const input = payload;
    const imagePath = await openDialog(currentWindow(event), {
      title: input.dialogTitle || "Choose a pet action sheet",
      filters: [{ name: input.dialogFilterName || "Pet action sheet", extensions: ["png", "webp"] }]
    });
    if (typeof imagePath !== "string") return null;
    try {
      const source = await readCustomPetSourceImage(imagePath);
      return {
        bytes: source.data,
        mimeType: source.mimeType,
        width: source.width,
        height: source.height
      };
    } catch (error) {
      return { errorCode: getPetPackageErrorCode(error) };
    }
  });
  registerHandler(ELECTRON_IPC_CHANNELS.petsCreateFromAtlasBytes, async (_event, payload) => {
    const input = payload;
    try {
      const pet = await loadCustomPetCatalog.invalidateAfter(() => createCustomPetFromAtlasBytes({
        slug: input.slug,
        displayName: input.displayName,
        description: input.description,
        atlasData: input.atlasData,
        mimeType: input.mimeType
      }, {
        inspectImageSize: ({ data }) => import_electron.nativeImage.createFromBuffer(data).getSize()
      }));
      return { id: pet.id };
    } catch (error) {
      return { errorCode: getPetPackageErrorCode(error) };
    }
  });
  registerHandler(ELECTRON_IPC_CHANNELS.petsOpenFolder, async () => {
    const root = await ensureCustomPetsRoot();
    await openSystemPath(root);
  });
  registerHandler(ELECTRON_IPC_CHANNELS.petsShow, async () => {
    await getPetWindowController().show();
    mainWindow == null ? void 0 : mainWindow.webContents.send(ELECTRON_EVENT_CHANNELS.petVisibilityChanged, true);
  });
  registerHandler(ELECTRON_IPC_CHANNELS.petsHide, () => {
    getPetWindowController().hide();
    mainWindow == null ? void 0 : mainWindow.webContents.send(ELECTRON_EVENT_CHANNELS.petVisibilityChanged, false);
  });
  registerHandler(ELECTRON_IPC_CHANNELS.petsShowContextMenu, (event, payload) => {
    const { closeLabel } = payload;
    return getPetWindowController().showContextMenu(
      currentWindow(event),
      closeLabel.trim(),
      import_electron.Menu
    );
  });
  registerHandler(ELECTRON_IPC_CHANNELS.petsDragWindow, (event, payload) => getPetWindowController().dragWindow(
    currentWindow(event),
    payload
  ));
  registerHandler(ELECTRON_IPC_CHANNELS.petsSetIgnoreMouseEvents, (event, payload) => {
    getPetWindowController().setIgnoreMouseEvents(currentWindow(event), Boolean(payload));
  });
  registerHandler(ELECTRON_IPC_CHANNELS.petsSetInteractiveRegions, (event, payload) => getPetWindowController().setInteractiveRegions(
    currentWindow(event),
    payload
  ));
  registerHandler(ELECTRON_IPC_CHANNELS.petsFocusMainWindow, (event) => {
    if (!getPetWindowController().owns(currentWindow(event))) {
      throw new Error("Pet window IPC sender does not own the companion window");
    }
    showMainWindow(mainWindow, import_electron.app);
  });
  registerHandler(ELECTRON_IPC_CHANNELS.petsFocusSession, (_event, payload) => focusPetSession(String(payload)));
  registerHandler(ELECTRON_IPC_CHANNELS.dialogOpen, (event, payload) => openDialog(currentWindow(event), payload));
  registerHandler(ELECTRON_IPC_CHANNELS.dialogSave, (event, payload) => saveDialog(currentWindow(event), payload));
  registerHandler(ELECTRON_IPC_CHANNELS.updateCheck, (_event, payload) => getUpdaterService().checkForUpdates(payload));
  registerHandler(ELECTRON_IPC_CHANNELS.updateDownload, () => getUpdaterService().downloadUpdate((event) => {
    mainWindow == null ? void 0 : mainWindow.webContents.send(ELECTRON_EVENT_CHANNELS.updateDownloadEvent, event);
  }));
  registerHandler(ELECTRON_IPC_CHANNELS.updateInstall, () => getUpdaterService().stageDownloadedUpdate());
  registerHandler(ELECTRON_IPC_CHANNELS.updatePrepareInstall, () => getServerRuntime().stopAll());
  registerHandler(ELECTRON_IPC_CHANNELS.updateCancelInstall, () => getUpdaterService().cancelInstall());
  registerHandler(ELECTRON_IPC_CHANNELS.updateRelaunch, () => {
    if (getUpdaterService().hasDownloadedUpdate()) {
      isQuitting = true;
      getUpdaterService().quitAndInstallDownloadedUpdate();
      return;
    }
    import_electron.app.relaunch();
    import_electron.app.quit();
  });
  registerHandler(ELECTRON_IPC_CHANNELS.notificationPermissionState, () => notificationPermissionState(import_electron.Notification));
  registerHandler(ELECTRON_IPC_CHANNELS.notificationRequestPermission, () => requestNotificationPermission(import_electron.Notification));
  registerHandler(ELECTRON_IPC_CHANNELS.notificationSend, (_event, payload) => sendDesktopNotification({
    NotificationClass: import_electron.Notification,
    options: payload,
    onAction: emitNotificationAction
  }));
  registerHandler(ELECTRON_IPC_CHANNELS.notificationActionAck, (_event, payload) => logNotificationSmokeRendererAck(process.env, payload));
  registerHandler(ELECTRON_IPC_CHANNELS.windowMinimize, (event) => currentWindow(event).minimize());
  registerHandler(ELECTRON_IPC_CHANNELS.windowToggleMaximize, (event) => {
    const window = currentWindow(event);
    if (window.isMaximized()) window.unmaximize();
    else window.maximize();
  });
  registerHandler(ELECTRON_IPC_CHANNELS.windowClose, (event) => currentWindow(event).close());
  registerHandler(ELECTRON_IPC_CHANNELS.windowStartDragging, () => void 0);
  registerHandler(ELECTRON_IPC_CHANNELS.windowRequestAttention, (event) => currentWindow(event).flashFrame(true));
  registerHandler(ELECTRON_IPC_CHANNELS.windowFocus, (event) => currentWindow(event).focus());
  registerHandler(ELECTRON_IPC_CHANNELS.windowIsMaximized, (event) => currentWindow(event).isMaximized());
  registerHandler(ELECTRON_IPC_CHANNELS.terminalSpawn, (event, payload) => getTerminalService().spawn(payload ?? {}, event.sender));
  registerHandler(ELECTRON_IPC_CHANNELS.terminalWrite, (event, payload) => {
    const { sessionId, data } = payload;
    return getTerminalService().write(sessionId, data, event.sender);
  });
  registerHandler(ELECTRON_IPC_CHANNELS.terminalResize, (event, payload) => {
    const { sessionId, cols, rows } = payload;
    return getTerminalService().resize(sessionId, cols, rows, event.sender);
  });
  registerHandler(ELECTRON_IPC_CHANNELS.terminalKill, (event, payload) => {
    const { sessionId } = payload;
    return getTerminalService().kill(sessionId, event.sender);
  });
  registerHandler(ELECTRON_IPC_CHANNELS.terminalGetBashPath, () => getTerminalService().getBashPath());
  registerHandler(ELECTRON_IPC_CHANNELS.terminalSetBashPath, (_event, payload) => getTerminalService().setBashPath(payload));
  registerHandler(ELECTRON_IPC_CHANNELS.previewOpen, (event, payload) => {
    const { url, bounds } = payload;
    return getPreviewService().open(currentWindow(event), url, bounds ?? { x: 0, y: 0, width: 0, height: 0 });
  });
  registerHandler(ELECTRON_IPC_CHANNELS.previewNavigate, (_event, payload) => getPreviewService().navigate(String(payload)));
  registerHandler(ELECTRON_IPC_CHANNELS.previewSetBounds, (_event, payload) => getPreviewService().setBounds(payload));
  registerHandler(ELECTRON_IPC_CHANNELS.previewSetVisible, (_event, payload) => getPreviewService().setVisible(Boolean(payload)));
  registerHandler(ELECTRON_IPC_CHANNELS.previewSetZoom, (_event, payload) => getPreviewService().setZoomFactor(payload));
  registerHandler(ELECTRON_IPC_CHANNELS.previewClose, () => getPreviewService().close());
  registerHandler(ELECTRON_IPC_CHANNELS.previewMessage, (event, payload) => getPreviewService().message(payload, event.sender));
  registerHandler(ELECTRON_IPC_CHANNELS.appModeGet, () => getAppMode(import_electron.app));
  registerHandler(ELECTRON_IPC_CHANNELS.appModeSet, (_event, payload) => setAppMode(import_electron.app, payload));
  registerHandler(ELECTRON_IPC_CHANNELS.appModePrepareRestart, () => getServerRuntime().stopAll(true));
  registerHandler(ELECTRON_IPC_CHANNELS.appModeRestart, () => {
    isQuitting = true;
    import_electron.app.relaunch();
    import_electron.app.quit();
  });
  registerHandler(ELECTRON_IPC_CHANNELS.adaptersRestartSidecar, () => getServerRuntime().restartAdaptersSidecars());
  registerHandler(ELECTRON_IPC_CHANNELS.zoomSet, (event, payload) => currentWindow(event).webContents.setZoomFactor(normalizeZoomFactor(payload)));
  registerHandler(ELECTRON_IPC_CHANNELS.appearanceSetApplied, (_event, payload) => {
    if (!isAppliedAppearance(payload)) return;
    lastAppliedAppearance = payload;
    applyAppliedAppearance(payload, {
      app: import_electron.app,
      // The pet window is deliberately transparent, so it stays out of this.
      windows: () => [mainWindow, ...traceWindows.values()].filter((window) => !!window)
    });
  });
}
async function createMainWindow() {
  const restoredState = readWindowState(import_electron.app, import_electron.screen.getAllDisplays());
  const bounds = windowOptionsFromState(restoredState);
  mainWindow = new import_electron.BrowserWindow({
    ...bounds,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    show: false,
    // Painted before the renderer produces its first frame; without it a
    // dark-theme user gets a white flash on every launch.
    backgroundColor: resolveStartupWindowBackground(),
    ...windowChromeOptionsForPlatform(process.platform),
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  configureLocalServerRequestAuth(
    mainWindow.webContents.session.webRequest,
    resolveMainRendererServerAccess,
    (details) => isAllowlistedMainRendererMediaRequest(
      details,
      mainWindow.webContents.id
    )
  );
  installMainWindowNavigationGuards(mainWindow.webContents, { openExternal: openExternalUrl });
  await installRendererContextMenu(mainWindow);
  installPreviewCleanupOnRendererNavigation(mainWindow.webContents, () => {
    previewService == null ? void 0 : previewService.close();
  });
  installWindowLifecycle({
    app: import_electron.app,
    window: mainWindow,
    shouldQuit: () => isQuitting
  });
  const window = mainWindow;
  const diagnosticsFile = electronHostDiagnosticsFile(process.env);
  const recordRendererDiagnostic = (detail) => {
    const sanitized = sanitizeHostDiagnostic(detail);
    appendHostDiagnostic(diagnosticsFile, `[renderer] ${sanitized}`);
    return sanitized;
  };
  window.on("resize", () => {
    if (window.isDestroyed()) return;
    window.webContents.send(ELECTRON_EVENT_CHANNELS.windowResized);
  });
  installRendererLifecycle({
    window,
    isQuitting: () => isQuitting,
    recordDiagnostic: recordRendererDiagnostic,
    writeSnapshot: (reason) => writeWindowSmokeSnapshot(window, reason),
    onRendererProcessGone: (detail) => {
      console.error(`[desktop] Electron renderer process exited: ${detail}`);
    },
    onRecoveryExhausted: (detail) => {
      console.error(`[desktop] Electron renderer recovery exhausted: ${detail}`);
      import_electron.dialog.showErrorBox(
        "\u754C\u9762\u6062\u590D\u5931\u8D25 / Interface Recovery Failed",
        `\u684C\u9762\u754C\u9762\u610F\u5916\u9000\u51FA\u6216\u6301\u7EED\u65E0\u54CD\u5E94\uFF0C\u81EA\u52A8\u6062\u590D\u672A\u80FD\u89E3\u51B3\u95EE\u9898\u3002\u8BF7\u91CD\u542F\u5E94\u7528\uFF1B\u5982\u679C\u95EE\u9898\u6301\u7EED\u5B58\u5728\uFF0C\u8BF7\u9644\u4E0A\u8BCA\u65AD\u65E5\u5FD7\u53CD\u9988\u3002

The desktop interface exited unexpectedly or remained unresponsive, and automatic recovery did not resolve it. Restart the app and include diagnostics when reporting the problem.

${detail}`
      );
    }
  });
  writeWindowSmokeSnapshot(mainWindow, "after-create");
  await loadAndRevealMainWindow({
    load: () => loadRendererEntry(mainWindow),
    beforeReveal: () => restoreWindowMaximized(mainWindow, restoredState),
    reveal: () => showMainWindow(mainWindow, import_electron.app),
    onLoadFailure: (error) => {
      const detail = sanitizeHostDiagnostic(error instanceof Error ? error.message : String(error));
      console.error(`[desktop] failed to load Electron renderer: ${detail}`);
      writeWindowSmokeSnapshot(mainWindow, "renderer-load-failed");
      import_electron.dialog.showErrorBox(
        "\u542F\u52A8\u9519\u8BEF / Startup Error",
        `\u684C\u9762\u754C\u9762\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u91CD\u542F\u5E94\u7528\u3002\u5982\u679C\u95EE\u9898\u6301\u7EED\u5B58\u5728\uFF0C\u8BF7\u9644\u4E0A\u8BCA\u65AD\u65E5\u5FD7\u53CD\u9988\u3002

The desktop interface could not be loaded. Restart the app and include diagnostics when reporting the problem.

${detail}`
      );
    }
  });
  refreshWindowsDragHitTest(mainWindow, process.platform);
  writeWindowSmokeSnapshot(mainWindow, "after-final-show");
}
if (!acquireSingleInstanceLock(import_electron.app, () => mainWindow)) {
  process.exit(0);
}
registerIpcHandlers();
import_electron.app.whenReady().then(async () => {
  applyWindowsAppUserModelId(import_electron.app);
  applyStartupPortableMode(import_electron.app);
  installSystemAppearanceWatch();
  import_electron.screen.on("display-metrics-changed", (_event, _display, changedMetrics) => {
    if (changedMetrics.includes("scaleFactor") || changedMetrics.includes("bounds")) {
      previewService == null ? void 0 : previewService.refreshBounds();
    }
  });
  await getServerRuntime().startServer().catch((error) => {
    console.error("[desktop] failed to start Electron server sidecar", error);
  });
  await installApplicationMenu(import_electron.app, () => mainWindow);
  if (shouldInstallTray(process.platform)) {
    trayController = await installTray({
      app: import_electron.app,
      desktopRoot: appRoot(),
      show: () => showMainWindow(mainWindow, import_electron.app),
      quit: () => {
        isQuitting = true;
        import_electron.app.quit();
      }
    }).catch((error) => {
      console.error("[desktop] failed to create Electron tray", error);
      return null;
    });
  }
  await createMainWindow();
  scheduleNotificationSmoke({
    env: process.env,
    NotificationClass: import_electron.Notification,
    onAction: emitNotificationAction
  });
  import_electron.app.on("activate", () => {
    if (mainWindow) {
      showMainWindow(mainWindow, import_electron.app);
      return;
    }
    void createMainWindow();
  });
});
import_electron.app.on("window-all-closed", () => {
  if (isQuitting && process.platform !== "darwin") import_electron.app.quit();
});
import_electron.app.on("before-quit", () => {
  isQuitting = true;
  if (mainWindow) saveWindowState(import_electron.app, mainWindow);
  trayController == null ? void 0 : trayController.dispose();
  trayController = null;
  terminalService == null ? void 0 : terminalService.killAll();
  previewService == null ? void 0 : previewService.close();
  petWindowController == null ? void 0 : petWindowController.dispose();
  petWindowController = null;
  getServerRuntime().stopAll(true);
});
