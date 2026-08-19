"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// electron/preview-preload.ts
var preview_preload_exports = {};
__export(preview_preload_exports, {
  installPreviewPostBridge: () => installPreviewPostBridge
});
module.exports = __toCommonJS(preview_preload_exports);
var electron = __toESM(require("electron"), 1);

// electron/ipc/channels.ts
var ELECTRON_INTERNAL_CHANNELS = {
  previewMessageFromView: "desktop:preview:message-from-view"
};

// electron/ipc/previewMessage.ts
var MAX_PREVIEW_EVENT_BYTES = 8 * 1024 * 1024;
function byteLength(input) {
  return new TextEncoder().encode(input).byteLength;
}
function shouldForwardPreviewMessage(input) {
  if (typeof input.raw !== "string") return false;
  if (byteLength(input.raw) > MAX_PREVIEW_EVENT_BYTES) return false;
  if (!input.isTopFrame) return false;
  try {
    const parsed = new URL(input.href);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// electron/preview-preload.ts
var { contextBridge, ipcRenderer } = electron;
function isTopFrame() {
  try {
    return window.top === window;
  } catch {
    return false;
  }
}
function installPreviewPostBridge() {
  if (!contextBridge?.exposeInMainWorld || !ipcRenderer?.send) return;
  contextBridge.exposeInMainWorld("__DESKTOP_PREVIEW_POST__", (raw) => {
    if (!shouldForwardPreviewMessage({
      raw,
      href: window.location.href,
      isTopFrame: isTopFrame()
    })) {
      return;
    }
    ipcRenderer.send(ELECTRON_INTERNAL_CHANNELS.previewMessageFromView, raw);
  });
}
installPreviewPostBridge();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  installPreviewPostBridge
});
