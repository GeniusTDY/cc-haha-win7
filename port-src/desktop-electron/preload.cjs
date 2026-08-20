"use strict";

// electron/preload.ts
var import_electron = require("electron");

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
function validateElectronIpcPayload(channel, payload) {
  return ELECTRON_IPC_VALIDATORS[channel](payload);
}

// src/lib/desktopHost/electronHost.ts
function safeInvoke(bridge, channel, payload) {
  if (!validateElectronIpcPayload(channel, payload)) {
    return Promise.reject(new Error(`Invalid Electron IPC payload for ${channel}`));
  }
  return bridge.invoke(channel, payload);
}
function createElectronHost(bridge) {
  const invoke = (channel, payload) => safeInvoke(bridge, channel, payload);
  const subscribe = (channel, handler) => bridge.subscribe(channel, handler);
  const createUpdate = (metadata) => ({
    version: metadata.version,
    body: metadata.body ?? null,
    async download(onEvent) {
      const unlisten = onEvent ? await subscribe(ELECTRON_EVENT_CHANNELS.updateDownloadEvent, onEvent) : null;
      try {
        await invoke(ELECTRON_IPC_CHANNELS.updateDownload);
      } finally {
        unlisten == null ? void 0 : unlisten();
      }
    },
    install: () => invoke(ELECTRON_IPC_CHANNELS.updateInstall),
    close: () => invoke(ELECTRON_IPC_CHANNELS.updateCancelInstall)
  });
  return {
    kind: "electron",
    isDesktop: true,
    capabilities: {
      appMode: true,
      clipboard: true,
      dialogs: true,
      notifications: true,
      previewWebview: true,
      shell: true,
      terminal: true,
      updates: true,
      windowControls: true,
      zoom: true
    },
    runtime: {
      getServerUrl: () => invoke(ELECTRON_IPC_CHANNELS.runtimeGetServerUrl),
      getLocalAccessToken: () => invoke(ELECTRON_IPC_CHANNELS.runtimeGetLocalAccessToken)
    },
    app: {
      getVersion: () => invoke(ELECTRON_IPC_CHANNELS.appGetVersion),
      getLocalePreference: () => invoke(ELECTRON_IPC_CHANNELS.appGetLocalePreference),
      setLocalePreference: (locale) => invoke(ELECTRON_IPC_CHANNELS.appSetLocalePreference, locale),
      getPreferredSystemLanguages: () => invoke(ELECTRON_IPC_CHANNELS.appGetPreferredSystemLanguages),
      onLocaleChanged: (handler) => subscribe(ELECTRON_EVENT_CHANNELS.appLocaleChanged, handler)
    },
    commands: {
      invoke: (command, args) => invoke(ELECTRON_IPC_CHANNELS.commandInvoke, { command, args })
    },
    clipboard: {
      readText: () => invoke(ELECTRON_IPC_CHANNELS.clipboardReadText),
      writeText: (text) => invoke(ELECTRON_IPC_CHANNELS.clipboardWriteText, text)
    },
    files: {
      getPathForFile(file) {
        var _a;
        const nativePath = (_a = bridge.getPathForFile) == null ? void 0 : _a.call(bridge, file);
        if (nativePath) return nativePath;
        const legacyPath = file.path;
        return typeof legacyPath === "string" ? legacyPath : "";
      }
    },
    events: {
      listen: (_eventName, handler) => subscribe(ELECTRON_EVENT_CHANNELS.event, handler)
    },
    webview: {
      onDragDropEvent: (handler) => subscribe(ELECTRON_EVENT_CHANNELS.webviewDragDrop, handler)
    },
    shell: {
      open: (target) => invoke(ELECTRON_IPC_CHANNELS.shellOpen, target),
      openPath: (path) => invoke(ELECTRON_IPC_CHANNELS.shellOpenPath, path)
    },
    trace: {
      openWindow: (sessionId) => invoke(ELECTRON_IPC_CHANNELS.traceOpenWindow, sessionId)
    },
    pets: {
      list: () => invoke(ELECTRON_IPC_CHANNELS.petsList),
      createFromImage: (input) => invoke(ELECTRON_IPC_CHANNELS.petsCreateFromImage, input),
      createFromAtlas: (input) => invoke(ELECTRON_IPC_CHANNELS.petsCreateFromAtlas, input),
      pickSourceSheet: (input) => invoke(ELECTRON_IPC_CHANNELS.petsPickSourceSheet, input),
      createFromAtlasBytes: (input) => invoke(ELECTRON_IPC_CHANNELS.petsCreateFromAtlasBytes, input),
      openFolder: () => invoke(ELECTRON_IPC_CHANNELS.petsOpenFolder),
      show: () => invoke(ELECTRON_IPC_CHANNELS.petsShow),
      hide: () => invoke(ELECTRON_IPC_CHANNELS.petsHide),
      showContextMenu: (closeLabel) => invoke(
        ELECTRON_IPC_CHANNELS.petsShowContextMenu,
        { closeLabel }
      ),
      dragWindow: (payload) => invoke(ELECTRON_IPC_CHANNELS.petsDragWindow, payload),
      setIgnoreMouseEvents: (ignore) => invoke(ELECTRON_IPC_CHANNELS.petsSetIgnoreMouseEvents, ignore),
      setInteractiveRegions: (regions) => invoke(ELECTRON_IPC_CHANNELS.petsSetInteractiveRegions, regions),
      focusMainWindow: () => invoke(ELECTRON_IPC_CHANNELS.petsFocusMainWindow),
      focusSession: (sessionId) => invoke(ELECTRON_IPC_CHANNELS.petsFocusSession, sessionId),
      onNavigateSession: (handler) => subscribe(ELECTRON_EVENT_CHANNELS.petNavigateSession, handler),
      onVisibilityChanged: (handler) => subscribe(ELECTRON_EVENT_CHANNELS.petVisibilityChanged, handler),
      onPanelPlacementChanged: (handler) => subscribe(ELECTRON_EVENT_CHANNELS.petPanelPlacementChanged, handler)
    },
    dialogs: {
      open: (options) => invoke(ELECTRON_IPC_CHANNELS.dialogOpen, options),
      save: (options) => invoke(ELECTRON_IPC_CHANNELS.dialogSave, options)
    },
    updates: {
      check: async (options) => {
        const update = await invoke(ELECTRON_IPC_CHANNELS.updateCheck, options);
        return update ? createUpdate(update) : null;
      },
      prepareInstall: () => invoke(ELECTRON_IPC_CHANNELS.updatePrepareInstall),
      cancelInstall: () => invoke(ELECTRON_IPC_CHANNELS.updateCancelInstall),
      relaunch: () => invoke(ELECTRON_IPC_CHANNELS.updateRelaunch)
    },
    notifications: {
      permissionState: () => invoke(ELECTRON_IPC_CHANNELS.notificationPermissionState),
      requestPermission: () => invoke(ELECTRON_IPC_CHANNELS.notificationRequestPermission),
      send: (options) => invoke(ELECTRON_IPC_CHANNELS.notificationSend, options),
      onAction: (handler) => subscribe(ELECTRON_EVENT_CHANNELS.notificationAction, handler),
      ackAction: (payload) => invoke(ELECTRON_IPC_CHANNELS.notificationActionAck, payload)
    },
    window: {
      minimize: () => invoke(ELECTRON_IPC_CHANNELS.windowMinimize),
      toggleMaximize: () => invoke(ELECTRON_IPC_CHANNELS.windowToggleMaximize),
      close: () => invoke(ELECTRON_IPC_CHANNELS.windowClose),
      startDragging: () => invoke(ELECTRON_IPC_CHANNELS.windowStartDragging),
      requestAttention: () => invoke(ELECTRON_IPC_CHANNELS.windowRequestAttention),
      focus: () => invoke(ELECTRON_IPC_CHANNELS.windowFocus),
      isMaximized: () => invoke(ELECTRON_IPC_CHANNELS.windowIsMaximized),
      onResized: (handler) => subscribe(ELECTRON_EVENT_CHANNELS.windowResized, handler),
      onNativeMenuNavigate: (handler) => subscribe(ELECTRON_EVENT_CHANNELS.nativeMenuNavigate, handler)
    },
    terminal: {
      spawn: (options) => invoke(ELECTRON_IPC_CHANNELS.terminalSpawn, options),
      write: (sessionId, data) => invoke(ELECTRON_IPC_CHANNELS.terminalWrite, { sessionId, data }),
      resize: (sessionId, cols, rows) => invoke(ELECTRON_IPC_CHANNELS.terminalResize, { sessionId, cols, rows }),
      kill: (sessionId) => invoke(ELECTRON_IPC_CHANNELS.terminalKill, { sessionId }),
      onOutput: (handler) => subscribe(ELECTRON_EVENT_CHANNELS.terminalOutput, handler),
      onExit: (handler) => subscribe(ELECTRON_EVENT_CHANNELS.terminalExit, handler),
      getBashPath: () => invoke(ELECTRON_IPC_CHANNELS.terminalGetBashPath),
      setBashPath: (path) => invoke(ELECTRON_IPC_CHANNELS.terminalSetBashPath, path)
    },
    preview: {
      open: (url, bounds) => invoke(ELECTRON_IPC_CHANNELS.previewOpen, { url, bounds }),
      navigate: (url) => invoke(ELECTRON_IPC_CHANNELS.previewNavigate, url),
      setBounds: (bounds) => invoke(ELECTRON_IPC_CHANNELS.previewSetBounds, bounds),
      setVisible: (visible) => invoke(ELECTRON_IPC_CHANNELS.previewSetVisible, visible),
      setZoom: (level) => invoke(ELECTRON_IPC_CHANNELS.previewSetZoom, level),
      close: () => invoke(ELECTRON_IPC_CHANNELS.previewClose),
      message: (payload) => invoke(ELECTRON_IPC_CHANNELS.previewMessage, payload),
      onEvent: (handler) => subscribe(ELECTRON_EVENT_CHANNELS.previewEvent, handler)
    },
    appMode: {
      get: () => invoke(ELECTRON_IPC_CHANNELS.appModeGet),
      set: (config) => invoke(ELECTRON_IPC_CHANNELS.appModeSet, config),
      prepareRestart: () => invoke(ELECTRON_IPC_CHANNELS.appModePrepareRestart),
      restart: () => invoke(ELECTRON_IPC_CHANNELS.appModeRestart)
    },
    adapters: {
      restartSidecar: () => invoke(ELECTRON_IPC_CHANNELS.adaptersRestartSidecar)
    },
    zoom: {
      set: (level) => invoke(ELECTRON_IPC_CHANNELS.zoomSet, level)
    },
    appearance: {
      setApplied: (state) => invoke(ELECTRON_IPC_CHANNELS.appearanceSetApplied, state)
    }
  };
}

// electron/preload.ts
var electronHost = createElectronHost({
  getPathForFile(file) {
    var _a;
    if (typeof ((_a = import_electron.webUtils) == null ? void 0 : _a.getPathForFile) === "function") {
      return import_electron.webUtils.getPathForFile(file);
    }
    return file.path ?? "";
  },
  invoke(channel, payload) {
    return import_electron.ipcRenderer.invoke(channel, payload);
  },
  subscribe(channel, handler) {
    const listener = (_event, payload) => handler(payload);
    import_electron.ipcRenderer.on(channel, listener);
    return Promise.resolve(() => {
      import_electron.ipcRenderer.removeListener(channel, listener);
    });
  }
});
import_electron.contextBridge.exposeInMainWorld("desktopHost", electronHost);
