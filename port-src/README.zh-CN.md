# port-src/ — Win7 移植新增源码

[English](README.md) | **简体中文**

上游不存在的新增文件；它们要么构建出新产物，要么是安装器交付的
权威编译产物。

```
port-src/
├── scripts/node-port/        无 Bun 的 CLI/server 构建管线（esbuild）
│   ├── build.mjs              打包 src/entrypoints/cli.tsx + 恢复 CLI
│   │                          -> dist/{server,cli,recovery-cli,adapters}.mjs
│   │                          Bun API 别名至 src/compat 垫片
│   ├── build-electron.mjs     桌面 electron 构建辅助（Stage A）
│   ├── build-preview-agent.mjs
│   └── cli-entry-wrapper.mjs
├── src/
│   ├── compat/               Bun 运行时 API 垫片（基于 node:child_process）
│   │   ├── bunSpawn.ts        Bun.spawn 子集：混合 ReadableStream 带
│   │   │                      .text()/.json()、exited promise、onExit
│   │   └── bunBundle.ts bunFile.ts bunServe.ts bunSqlite.ts
│   └── entrypoints/
│       └── serverNode.ts     Node server 入口包装（Node 下
│                              import.meta.main 为 undefined——本文件是
│                              server.mjs 的显式自启动入口）
├── adapters/
│   └── index.ts              IM 适配器分发器叠加层（代码分块入口；
│                              adapters 依赖装好后由 build.mjs 复制到
│                              <root>/adapters/index.ts）
├── desktop/
│   └── offline-win.cjs       electron-builder 离线配置（Stage A）
└── desktop-electron/         权威主进程编译产物
    └── main.cjs ...          含 node-runtime 回退层
```

## 构建 CLI bundle

```bash
# 在上游仓库根目录，应用补丁 001-004 之后
#（补丁之外的前置：为上游根目录 67 个依赖执行 `npm install`
#  + 八处 Bun 调用点改写——见 patches/README
#  「源码叠加缺口」；即上游五处调用点加上 2026-08-21
#  会话 spawn 修复新增的服务层三文件）
node port-src/scripts/node-port/build.mjs     # -> dist/*.mjs
# 然后运行标识符自适应的构建后修补器（CU 离线 + win32 CLI spawn 链
#  + cli.mjs VT 输入门控——补丁 005 是 08-18 的历史 diff，
#  对新构建不再适用）。
# 布局同根 README 的 Stage A：cc-haha 与 cc-haha-win7 并列，
# 因此在上游仓库根目录下修补器位于
# ../cc-haha-win7/runtime/node-fallback/：
python3 ../cc-haha-win7/runtime/node-fallback/patch-computer-use.py dist/server.mjs
```

Node 目标为 22（`--experimental-sqlite` 旗标由 main.cjs 的
`sqliteFlagArgsForVersion` 对 22.5–22.12 与 23.0–23.3 自动探测附加）。
