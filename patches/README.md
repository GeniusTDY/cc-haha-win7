# patches/ — Win7 port deltas vs upstream NanmiCoder/cc-haha v0.6.2

**English** | [简体中文](README.zh-CN.md)

Base: upstream tag/commit `85e7f3a20` ("release: v0.6.2"; pristine tree
`757d004471e01255b13bec5a67d8f909e21d689b`). The series previously targeted
`d52bbec7` (v0.5.4) — see the regeneration notes below. Apply order =
patch number. All paths are relative to the upstream repo root (`desktop/`
is the Electron app subproject).

| # | file | applies to | summary |
|---|---|---|---|
| 1 | `desktop/001-package-json-electron22.patch` | `desktop/package.json` | pin Electron 22.3.27 (last Win7 major, Chromium 108/Node 16.17) + electron-builder 26.8.1 |
| 2 | `desktop/002-index-html-css-shim.patch` | `desktop/index.html` | Chromium 108 CSS shim: color-mix()/lab()/oklch()/lch()/oklab() evaluation + scrollbar fallbacks, re-runs on theme change; plus Set seven-methods polyfill (union/intersection/difference/symmetricDifference/isSubsetOf/isSupersetOf/isDisjointFrom — Chrome 122+, needed by cytoscape/mermaid) |
| 3 | `desktop/003-terminal-winpty-fallback.patch` | `desktop/electron/services/terminal.ts` | force node-pty's winpty backend on Win7/8 (`useConpty:false`) + line-based pipe fallback when node-pty cannot load/spawn |
| 4 | `cli/004-shell-win32-bash-resolution.patch` | `src/utils/Shell.ts`, `src/utils/windowsPaths.ts` | Windows shell chain for the Bash tool: user Git → bundled `runtime/git-2.45.2` PortableGit (`CC_HAHA_BASH_EXE`/`CC_HAHA_RUNTIME_DIR`/relative probes) → PATH bash |
| 5 | `cli/005-server-mjs-computer-use-offline.patch` | `dist/server.mjs` (node-port bundle) | bundled-Python detection, offline wheel install (--no-index), venv fallback to bundled python.exe. **Historical**: diff against the 2026-08-18 build; the 844024a9 rebuild changed line offsets so `git apply` fails on current build.mjs output — fresh rebuilds use `runtime/node-fallback/patch-computer-use.py` (identifier-adaptive, full P1–P10 set incl. the win32 CLI spawn chain and the cli.mjs VT-input gate) |
| 6 | `electron-builder/006-nsis-target-nowine.patch` | `node_modules/app-builder-lib/.../NsisTarget.js` | wine-free uninstaller extraction on Linux (UninstallerReader for all non-Windows hosts) |
| 7 | `desktop/007-session-title-locale.patch` | `desktop/src/**` (10 title display sites + 5 locale files) | display-layer mapping `displaySessionTitle()` for placeholder session titles ('New Session'/'Untitled Session' store sentinels stay untouched in the data layer; UI renders `t('session.untitled')` per locale); retires the obsolete `tabs.untitled` key |
| 8 | `desktop/008-brand-fork-etiquette.patch` | `desktop/package.json`, `desktop/src-tauri/tauri.conf.json`, `desktop/src/{components/layout/Sidebar,pages/ActivitySettings,pages/settings/AboutSettings}.tsx` + tests + 5 locale files, `src/server/services/desktopUiPreferencesService.ts` | repository identity points at GeniusTDY/cc-haha-win7 (package.json homepage + electron-updater publish target, tauri updater endpoint, sidebar link, backend DEFAULT_PROFILE_SUBTITLE) while upstream is credited first, fork etiquette: the About "GitHub Repo"/"Author" cards list upstream then the fork/maintainer in two-row entries with hint lines, and the Activity profile shows both subtitle links while the subtitle is still the default (`upstreamHint`/`upstreamAuthorHint`/`forkMaintainerHint` keys in all five locales) |
| 9 | `desktop/009-changelog-modal.patch` | `desktop/src/pages/settings/AboutSettings.tsx`, `desktop/src/lib/changelogContent{,Data}.ts` + 5 locale files | in-app changelog modal replacing the browser jump to upstream GitHub releases: pre-baked bilingual corpus (all 44 upstream releases, v0.1.0 - v0.6.2; zh/en split + Installation-section removal baked in at generation time), language mapping with fallback, bare `#issue` ref linkification to the upstream tracker, in-modal version switcher with a "current version" indicator (`settings.about.currentVersion` in all five locales); retires the now-unused GITHUB_RELEASES const |
| 10 | `desktop/010-providers-changed-refresh.patch` | `desktop/src/types/chat.ts`, `desktop/src/stores/{chatStore,providerStore,providerStore.test}.ts` | the desktop listens to the server's `providers_changed` event (emitted per provider created/updated/deleted/activated/reordered/imported): `chatStore` exposes `registerProvidersChangedHandler()` and dispatches the event's reason, `providerStore` registers a 500 ms-debounced `fetchProviders()` flush — importing or updating a provider in one window refreshes every other open window without a manual reload |
| 11 | `desktop/011-h5-input-width-fix.patch` | `desktop/index.html` | H5 access "Host/IP" row: the viewport-based `sm:grid-cols-[minmax(0,1fr)_9rem_9rem]` breakpoint responds to the window, not the grid's own box, so inside the nested settings cards the 1fr column collapses and the input only reaches full width when maximized; a container query on the row's parent wrapper (`container-type:inline-size` + `@container (max-width: 28rem)` → single `minmax(0,1fr)` column) responds to the real container width (container queries and `:has()` are both Chromium 105+, fine on Electron 22's 108) |
| 12 | `desktop/012-button-nowrap-fix.patch` | `desktop/index.html` | `button.inline-flex{white-space:nowrap}`: fixed-height buttons (h-6 = 24px and friends) never disabled wrapping, so tight flex rows folded CJK labels (the zh-CN "Refresh"/"Rebuild local index" buttons in Settings → Diagnostics) onto two lines whose ~27px of line boxes painted outside the button border; nowrap keeps every label on one line and restores min-content width so flex can no longer shrink a button below its label |
| 13 | `desktop/013-intranet-mode-ui-gates.patch` | `desktop/electron/main.ts`, `desktop/electron/services/{intranetMode,intranetNetworkGuard,shell,systemProxyBridge,updater}.ts`, `desktop/src/api/settings.ts`, `desktop/src/components/layout/Sidebar.tsx`, `desktop/src/pages/Settings.tsx`, `desktop/src/pages/{settings/{AboutSettings,GeneralSettings,IntranetModeSettings,ProviderSettings},ComputerUseSettings,Market}.tsx`, `desktop/src/stores/{settingsStore,chatStore,updateStore,uiStore}.ts`, `desktop/src/types/{settings,chat}.ts`, 5 locale files | intranet mode, desktop half: the switch lives on its own settings page (first rail entry); the server's `network_policy_changed` broadcast mirrors the flag into every open window with no restart, and focus hydration (window focus / visibilitychange re-pulls `/api/settings/user`, PUT-stamp guarded against in-flight saves) covers freshly restarted apps with no open session; online-only UI hides (About update card + social/author/feedback links, provider-modal "Get API Key" button + preset promo strip — the modal itself stays since adding intranet/self-hosted providers is the air-gap use case, WebSearch Tavily/Brave "Get API Key" links, sidebar skill-market entry + an "unavailable" notice for already-open market tabs, IM Adapters rail tab, Computer Use's "Download Python 3" button); the two About GitHub repo cards (upstream + fork) STAY visible — attribution info, clicks short-circuit to a no-op; authoritative main-process gates read `<CLAUDE_CONFIG_DIR>/settings.json` uncached per call — `openExternalUrl()` refuses http(s) before even loading the electron module, `checkForUpdates()` returns null without touching electron-updater, a new Chromium network guard (main.ts installs it) disables spell-check dictionary downloads and the component updater (NetworkService background traffic), and under intranet mode the system-proxy bridge only forwards to loopback/RFC1918/ULA/link-local targets so CLI children tunnelling through it can never reach the public internet |
| 14 | `cli/014-intranet-mode-network-policy.patch` | `src/utils/{networkPolicy,apiPreconnect,releaseNotes}.ts`, `src/tools/WebSearchTool/{WebSearchTool,backend}.ts`, `src/tools/WebFetchTool/utils.ts`, `src/tools/{RemoteTriggerTool/RemoteTriggerTool,BriefTool/upload}.ts`, `src/utils/telemetry/instrumentation.ts`, `src/services/{api/{usage,referral},mcp/officialRegistry,remoteManagedSettings/syncCache,settingsSync/index,teamMemorySync/index,voiceStreamSTT}.ts`, `src/server/{index,services/{conversationService,market/providerFetch},middleware/errorHandler,ws/{events,handler},api/{settings,haha-oauth,haha-grok-oauth,haha-openai-oauth}}.ts` | intranet mode, server/CLI half: `src/utils/networkPolicy.ts` reads the `intranetMode` boolean from `~/.claude/settings.json` UNCACHED per call, so a toggle affects already-running sessions on their next tool use; telemetry fully off (OTLP + BigQuery + init, overriding an inherited `CLAUDE_CODE_ENABLE_TELEMETRY=1`); OAuth start/callback → 403 `INTRANET_MODE_DISABLED` and status reports logged-out without the outbound token refresh (plus 403 on the bare `/callback*` routers); WebSearch disables every backend with a model-facing explanation ("内网模式已禁用 WebSearch — do not retry, answer from the conversation and local files"); WebFetch stays usable against plain-http intranet services (http→https upgrade and the outbound domain-blocklist preflight are skipped); CLI children are stamped `CC_HAHA_INTRANET_MODE=1` + `CLAUDE_CODE_ENABLE_TELEMETRY=0`; `PUT /api/settings/user` broadcasts the toggle to all connected clients. Audit pass (every remaining app-initiated outbound call gated): API preconnect warmup skipped; MCP official-registry prefetch skipped (api.anthropic.com, `isOfficialMcpUrl()` already fails closed); changelog fetch skipped (raw.githubusercontent.com, local cache kept); skills market refused server-side in `providerFetch()` before any proxied fetch (H5/direct API callers too, not just the hidden UI); settings sync up/down, remote managed settings eligibility (checked before the cache so a flip takes effect immediately), and team memory sync hard-off (claude.ai); usage → null and referral → not-eligible/empty inert shapes; voice-stream STT never available; RemoteTriggerTool fails fast with a do-not-retry error; Brief attachment upload skipped silently (local-only briefs stay functional) |

The Electron main-process node-runtime fallback layer is not a numbered
patch: it ships as the compiled artifacts `port-src/desktop-electron/*.cjs`
(byte-identical to the shipped `app.asar`; `main.cjs` carries BOTH the
fallback layer AND the winpty forcing — the same hunk patch 003 adds to
the TS source). In a Stage A source rebuild they must be **overlaid onto
`desktop/electron-dist/` before electron-builder packs the asar** (see
the `cp ../port-src/desktop-electron/*.cjs electron-dist/` step in the
root README's Stage A walkthrough) — the upstream TS sources do not
contain the fallback layer, and a rebuild without the overlay produces
an app.asar whose server cannot start once Stage B removes the broken
sidecar. Rebuilding main.cjs from TS requires re-adding the fallback
layer by hand; overlaying the committed artifact is the reproducible
path. (Patch 003 ports that artifact's pipe fallback into the TS source,
so rebuilds from source keep that half; the node-runtime fallback half
exists only in the compiled artifact.)

## Source-level overlay gap

The patch series is NOT the complete port delta. Building `dist/*.mjs`
from a fresh upstream checkout additionally requires working-tree-only
changes that this repo does not carry as patches:

- overlay `port-src/src/compat/` → `src/compat/` and
  `port-src/src/entrypoints/serverNode.ts` → `src/entrypoints/serverNode.ts`
  (the esbuild `bun:sqlite` / `bun:bundle` aliases in build.mjs resolve
  to `<root>/src/compat/…`, which does not exist in a fresh clone);
- five Bun call-site rewrites in upstream sources:
  `src/server/index.ts` (`Bun.serve` → `nodeServe`),
  `src/server/api/sessions.ts` + `src/server/api/computer-use.ts`
  (`Bun.spawn` → `nodeBunSpawn`), `src/server/staticH5.ts` +
  `src/server/api/previewFs.ts` (`Bun.file` → `nodeBunFile`);
- three more service-level rewrites (2026-08-21 session-spawn fix, all
  present in the shipped `runtime/node-fallback/server.mjs`):
  `src/server/services/conversationService.ts` +
  `src/server/services/cronScheduler.ts` +
  `src/server/services/diagnosticsService.ts`
  (`Bun.spawn` → `nodeBunSpawn` — sessions, cron scheduler,
  `openLogDir` x3; the embedded-ripgrep `--version` probe in
  `src/utils/ripgrep.ts` stays on `Bun.spawn` as unreachable dead code
  under Node — the desktop bundles a native rg.exe);
- two semantics fixes baked into the same rebuild:
  `shouldStripInheritedProviderEnv` (both conversationService and
  cronScheduler) strips `ANTHROPIC_*` only for a configured provider —
  `providerId === null` keeps the inherited env so env-only setups can
  still authenticate — and cronScheduler's
  `buildCronCliArgs`/`resolveCronProjectRoot` fall back from the
  Bun-only `import.meta.dir` to `fileURLToPath(import.meta.url)`;
- the upstream root dependencies (68 entries: axios, lodash-es, react, …)
  must be installed (`bun install` / `npm install`) — only esbuild and the
  desktop dependency tree are vendored in this repo.

Empirically, running build.mjs on a fresh `85e7f3a20` clone + patches
001–004 + `cp -r port-src ./` fails with ~2000 unresolved-module errors.
The fully offline, reproducible path this repo supports is **Stage B
only**: `runtime/node-fallback/` ships the prebuilt dist bundles and
build-repack.sh step 4/9 deploys them into the installer, independent of
any Stage A build.

## Regenerating the series for v0.6.2 (2026-09-12)

The series originally targeted v0.5.4. Re-targeting it at `85e7f3a20`
("release: v0.6.2") kept 001/002/003/007/011/012 and cli/004, cli/014
byte-identical and regenerated the four patches whose hunks upstream had
moved underneath: **008, 009, 010, 013**. Verified by applying the 12
numbered patches in the order below to a pristine `85e7f3a20` checkout
and comparing the resulting tree to the canonical replay (zero conflict
markers):

```
series tree: 9d06be08fa401dbc7665b7cc1e22653bd06c61d4
expected   : 9d06be08fa401dbc7665b7cc1e22653bd06c61d4
```

(under v0.5.4 this was `861e9c96e15ce7ebd3f31b69adafee17f1f3c984`). The
regenerated diffs are produced with git plumbing (`hash-object` /
`read-tree` / `update-index --cacheinfo` / `write-tree` / `commit-tree`)
and emitted as `git diff <parent> <new-commit>`, so every patch remains a
plain two-way `git diff` that `git apply` takes without 3-way fallback.

- **008 (brand/fork etiquette)** — only context lines shifted.
- **009 (changelog modal)** — corpus extended from 40 to **44** entries
  (v0.1.0 - v0.6.2) by re-running the generator over upstream
  `release-notes/*.md`. Language assignment is content-based, not
  positional: the English body is the block holding `## Installation` and
  the Chinese body the one holding `## 安装`, because v0.6.1 and v0.6.2
  put the Chinese block first while v0.5.2–v0.6.0 put English first. 37
  of the 44 bodies are monolingual (Chinese only) and reach the UI through
  `changelogContent.ts`'s fallback. The parser reproduces the three
  shipped bilingual entries (v0.5.2/0.5.3/0.5.4) byte-for-byte. Patch
  size 233,997 → 265,256 B.
- **010 (`providers_changed` refresh)** and **013 (intranet-mode UI
  gates)** — upstream refactored `chatStore`/`settingsStore`, so both were
  rebased onto the new sources. 013's resolved `settingsStore.ts`
  (`userSettingsPatch()`, `intranetMode: userSettings.intranetMode === true`,
  `proxyManagedSettingsWarning`) is rebuilt from the final replay commit,
  not the intermediate conflict-marked one.

A 3-way replay (`git apply --3way`) on a fresh clone additionally needs
the intermediate blobs the patches expect to be reachable; they were
seeded by replaying the v0.5.4 series with `git apply --3way` +
`git add -A` + commit. Plain `git apply` (used below) does not need this.

Root dependencies grew 67 → 68 between v0.5.4 and v0.6.2 (devDependencies
unchanged at 1). The Bun call-site census is unchanged in shape:
`Bun.serve`, `Bun.spawn`, `Bun.file`, `bun:sqlite`
(`src/server/services/ccSwitchImport.ts`), `bun:bundle` (`src/bridge/*`,
`src/cli`, `src/commands/*`) and `import.meta.dir`
(`src/server/services/conversationService.ts`, `cronScheduler.ts`); no
`Bun.write`/`Bun.env`.

### Patch 015 is artefact-level, not part of the upstream series

`desktop/015-renderer-recovery-hardening.patch` does **not** apply to the
upstream checkout: it records a change to this repo's own committed
compiled artifact `port-src/desktop-electron/main.cjs` (renderer crash
recovery — a single reload attempt becomes up to three escalating
attempts, clearing `localstorage` then
`localstorage`+`shadercache`+`cachestorage` before the second and third
reloads). That change is already folded into the regenerated v0.6.2
artifact, so — like patch 005 — the patch no longer applies to the current
`main.cjs` and is kept as the record of the edit. It must never be handed
to a fresh upstream clone.

## Apply

```bash
# Layout as in the root README's Stage A walkthrough: the upstream clone
# and this repo (cc-haha-win7) sit side by side, so from inside the clone
# everything this repo ships is reachable as ../cc-haha-win7/.
git clone https://github.com/NanmiCoder/cc-haha && cd cc-haha
git checkout 85e7f3a20
git apply ../cc-haha-win7/patches/desktop/001-package-json-electron22.patch
git apply ../cc-haha-win7/patches/desktop/002-index-html-css-shim.patch
git apply ../cc-haha-win7/patches/desktop/003-terminal-winpty-fallback.patch
git apply ../cc-haha-win7/patches/desktop/007-session-title-locale.patch
git apply ../cc-haha-win7/patches/desktop/008-brand-fork-etiquette.patch
git apply ../cc-haha-win7/patches/desktop/009-changelog-modal.patch
git apply ../cc-haha-win7/patches/desktop/010-providers-changed-refresh.patch
git apply ../cc-haha-win7/patches/desktop/011-h5-input-width-fix.patch
git apply ../cc-haha-win7/patches/desktop/012-button-nowrap-fix.patch
git apply ../cc-haha-win7/patches/desktop/013-intranet-mode-ui-gates.patch
git apply ../cc-haha-win7/patches/cli/004-shell-win32-bash-resolution.patch
git apply ../cc-haha-win7/patches/cli/014-intranet-mode-network-policy.patch
# after building the node-port bundle (dist/server.mjs):
python3 ../cc-haha-win7/runtime/node-fallback/patch-computer-use.py dist/server.mjs
#   (patch 005 is the historical 2026-08-18 diff — see its STATUS NOTE;
#    the adaptive script applies the same CU set + the win32 spawn chain
#    and also restores the VT-input gate in the sibling dist/cli.mjs)
# after `npm install` in desktop/ (any reinstall overwrites node_modules):
git apply ../cc-haha-win7/patches/electron-builder/006-nsis-target-nowine.patch
```

## Verify the node_modules patch survived a reinstall

```bash
grep -q 'process.platform !== "win32"' \
  desktop/node_modules/app-builder-lib/out/targets/nsis/NsisTarget.js \
  || echo "patch 006 lost — re-apply"
```

## Known deployment pitfall: HarfBuzz ligature crash (0xC0000005)

**Symptom**: the packaged app crashes the renderer at random on Win7
(`process-gone reason=crashed exitCode=-1073741819`), most reliably right
after a fresh-session / cleared Local Storage path. A stock Win7 install
ships no ligature-capable font, and this port's minimal static font
subset (the ~21KB icon font in `desktop/dist/assets`) cannot shape the
**ligature icon names** the stock upstream frontend emits.

**Root cause**: upstream `App-*.js` references icons by ligature name
(`"icon-name"` text nodes). The port's font is a no-ligature static subset
that maps **PUA codepoints** instead. Feeding ligature names into that
font hits a HarfBuzz shaping crash path on Chromium 108/Win7 — each side
is individually correct, only the combination is fatal, and no static
check catches it. Only a real Win7 VM run reproduces it.

**Fix / rule**: frontend assets that use ligature icon names must never
be shipped together with the PUA-subset font. Two safe combinations,
verified by A/B bisection on the Win7 QEMU VM (2026-08-31):

1. PUA-codepoint frontend assets (`__iconCP` mapping) + PUA font subset
   (the crash-free recipe used in the verified deployment), or
2. ligature-name frontend assets + a full ligature-capable font
   (heavier; not used by this port).

Additionally, `index.html` variants that redirect `file://` →
`http://127.0.0.1:60927` reach the same shaping crash path after
navigation — use the no-redirect `index.html`. When swapping
`server.mjs`/`cli.mjs` into an existing asar, keep the frontend assets
and the font from the same build generation.
