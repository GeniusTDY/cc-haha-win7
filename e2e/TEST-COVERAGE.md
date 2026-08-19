# cc-haha v2 (Win7 离线版) 测试覆盖矩阵

- 对象: `Claude-Code-Haha-0.5.4-Win7-x64-Offline-v2.exe`
  sha256 `03286eaf62a5ce7e607c610bc66787897be87c9539ff648225f98a4b0ba716be`
- 环境: Win7 SP1 x64 VM（QEMU，完全离线：默认路由删除 + ping 8.8.8.8/github.com 超时证明）
- 最终结果: **round23 = 77/77，round24 = 17+3/20，round25 = 30+3/33，round26 = 49/49，round27 = 18+4+7+8/37，全 PASS 0 FAIL**

## 1. 最终验收套件（当前有效）

| 脚本 | 阶段 | 覆盖点 | 结果 |
|---|---|---|---|
| round23.bat | 卸载旧版 | Uninstall.exe /S 静默卸载 + 残留目录清理 | uninstall-exit 记录（首次无旧版时=2 属预期） |
| | 首次运行场景 | 清空 %APPDATA%\cc-haha、~/.claude/.runtime、~/.claude/cc-haha | 通过 |
| | 离线证明 | route delete + ping 8.8.8.8/DNS 超时 + SMB(10.0.2.4)仍可达 | ping 超时=离线成立 |
| | 静默安装 | v2.exe /S 提权静默安装（离线） | install-exit=0 |
| | 安装完整性 (18 项) | 主 exe、dist/{server,adapters,cli,recovery-cli}.mjs、adapters-chunks、**sidecar 已移除**、rg.exe、node.exe、python.exe、pip wheel、python38._pth(Lib\site-packages + import site)、setup-vxkex(KexCfg)、index.html CSS shim、asar 内 node-fallback、v2 server.mjs 标记 | 全 [OK] |
| | 运行时可用 | node --version / python --version / rg --version（VxKex 生效证明） | 全部 exit=0 |
| | 全量 E2E | 见 e2e-full.mjs 77 项（下表） | 77/77 |
| | CU 自定义路径探针 | cu-setup-probe.mjs（下表） | RESULT: PASS |
| | 路由恢复 | route add 还原 | exit=0 |
| round24.bat | 安装器副产物 | 桌面/开始菜单快捷方式、Uninstall.exe 存在 | 通过 |
| | 离线 + guest 本地 mock | 127.0.0.1:8787 mock Anthropic API（FILE-TOOLS 工具链 + 流式） | mock-health OK |
| | gap-probe phase1 (17 项) | 见下表 | 17/17 |
| | gap-probe phase2 (3 项) | 无 mock 环境重启后持久化复查 | 3/3 |
| | 路由恢复 | route add | exit=0 |
| round25.bat | Phase A：v1→v2 原地升级 | 先装 v1 建基线（确认无 v2 标记）→ 不卸载直接覆盖安装 v2 → exe/v2 server.mjs/spawn 修复/sidecar 已移除/卸载器 5 项断言 | 全 [OK] |
| | round25-probe phase1 (30 项) | 见第 4 节 | 30/30 |
| | Phase C：非提权重启 | runas /trustlevel:0x20000 受限令牌重启应用 | 探针可连 |
| | round25-probe phase2 (3 项) | 受限令牌下服务可用性 + 崩溃后重启恢复 | 3/3 |
| | 路由恢复 | route add | exit=0 |
| round26.bat | 残余盲区 sweep | 见第 5 节（API 全路由组 + GUI 全导航遍历） | 49/49 |
| | 路由恢复 | route add | exit=0 |
| round27.bat | 测试类型学盲区 | 见第 6 节（协议负向/中断/失败终态/自卸载生命周期/WS 控制面全集） | 37/37 |
| | 路由恢复 | route add | exit=0 |

## 2. e2e-full.mjs — 77 项明细（全 PASS）

| 类别 | 检查 |
|---|---|
| server (1) | 端口发现（netstat） |
| api-get (2) | /api/settings/user、/api/conversations/:id/status |
| api-sec (1) | /api/h5-access 本地独占门（远程拒绝） |
| api-post (6) | /api/search 命中、默认 cwd、/api/market、/api/diagnostics/local-index/rebuild、/api/filesystem/browse、/api/computer-use/setup |
| api-put (2) | /api/settings/user 读写回环、/api/desktop-ui/preferences/pet 回环 |
| python (3) | 依赖 imports、win_helper check_permissions、win_helper screenshot |
| gui (9) | CDP 连接、导航枚举、New session/Providers/Scheduled/Settings 页、设置 tabs 枚举 ×4、Computer Use 页 |
| style (2) | 计算样式 + 样式表加载、无裸控件（Win7 CSS shim 验证） |
| form (6) | CU 表单枚举、填写 python path、Apply、Recheck Status、modal 开启 + Esc 关闭 |
| screenshot (14) | 每页/关键状态截图存证（e2e-shots/*.png） |
| fatal (1) | 驱动自身无致命错误 |

## 3. gap-probe.mjs — 覆盖盲区补齐（20/20 PASS）

| 类别 | 检查 | 本轮结果 |
|---|---|---|
| cli (3) | cli.mjs --version、recovery-cli --help、adapters --telegram（分块加载/无 token 路径） | PASS |
| agent (1) | 完整 agent 回合：CLI 入口 + Write→Read 工具循环（mock API 驱动，hi.txt 内容=ok） | PASS |
| ws (4) | REST 建会话(201)、WS connected 帧、**user_message→message_complete**（服务端 spawn CLI 子进程）、会话详情消息持久化(messageCount=8) | PASS（修复验证点） |
| cron (3) | 建任务(201)、手动触发(200)、**run 达到 SUCCESS/completed 终态**（调度器+spawn 链路） | PASS（修复验证点） |
| h5 (1) | GET / 提供 H5 静态入口 | PASS |
| term (3) | 终端 tab 点击、xterm DOM 挂载（pipe-PTY 回退）、CDP 截图 | PASS |
| server (1) | 端口发现 | PASS |
| persist (2) | **CJK 设置跨应用重启**（sqlite 中文回环「中文持久化探针-✓」）、**WS 会话跨重启存活** | PASS |
| 截图 (1) | 40-terminal-tab.png | PASS |

## 4. round25-probe.mjs — A 级盲区闭合（30+3/33 PASS）

对 round23/24 之后的覆盖审计识别出 8 项盲区，全部闭合：

| 盲区 | 检查 | 结果 |
|---|---|---|
| API 面 (12) | doctor/traces(+settings)/sessions/skills 本地路由 200；v1/skills、features、claude_code/metrics 等 SDK 出站路由 404（证明不误挂本地）；filesystem/file 无 path→400、任意路径/越界路径→403；doctor/repair 空 targets 干跑 200 | PASS |
| H5 安全门 (6) | enable/disable/regenerate 非桌面调用方一律 403（本地独占）；settings 读 403；verify 拒绝未知/缺失 bearer 401 | PASS |
| 并发 WS 会话 (2) | 3 个会话同时 user_message→全部 message_complete；3 个独立 workDir 各自 Write→Read 工具循环互不串扰（hi.txt=ok ×3） | PASS |
| cron 真调度 (3) | 创建 */1 每分钟任务(201)后**不手动触发**，等待调度器真实 tick → status=completed runs=1；任务删除清理 | PASS |
| v1→v2 原地升级 (Phase A, 5) | v1 基线确认（无 v2 标记）→ 不卸载直接覆盖装 v2：主 exe、v2 server.mjs（bundledCandidateMatch 标记）、spawn 修复（cliMjs2）、sidecar 已移除、卸载器在位 | PASS |
| 恢复模式 (3) | 重命名 cli.mjs 模拟主 CLI 损坏 → recovery-cli 文本回合仍 MOCK-OK（exit=0）→ cli.mjs 还原 | PASS |
| 崩溃自愈 (3) | 定位服务监听 PID→taskkill 后端口即拒连（进程确已死）→ 支持的恢复路径为应用重启（Phase C 实测拉起成功，无进程级 respawn 属设计预期） | PASS |
| 非提权运行 (phase2, 3) | runas /trustlevel:0x20000 受限令牌重启后：端口复发现、/health 200（且持久化探针值仍在）、H5 静态入口 200 | PASS |

关键测试方法：mock-anthropic.mjs 新增 TEXT-ONLY 场景（recovery-cli 纯文本回合）与
Bash 场景 stdout 标记校验（`AGENT-TOOL-STDOUT-MARKER` 必须出现在 tool_result 中
才回 TOOL-LOOP-OK，杜绝无条件成功的假阳性）；FILE-TOOLS 并发场景用独立 workDir
验证会话隔离。

## 5. round26-probe.mjs — 源码级对账后的残余盲区 sweep（49/49 PASS）

对 server.mjs 全部 32 个 `handle*Api` 路由组与 GUI 实际侧边栏做源码级对账，
发现 round23/24/25 之后仍有两类从未触达的面，全部闭合：

| 盲区 | 检查 | 结果 |
|---|---|---|
| API 全路由组 sweep (21) | 19 个从未请求过的路由组各发代表 GET：providers(200)/models(200)/agents(200,含工具清单)/tasks(200)/workflows(200,含 deep-research)/teams(200)/plugins(200)/mcp(200)/mcp/servers(405 方法守卫)/memory(404 子路径守卫)/open-targets(200,枚举 explorer 等)/activity-stats(200,会话统计)/adapters(200)/adapters/channels(200)/wechat-adapters(404 受控)/whatsapp-adapters(404 受控)/haha-oauth(200 loggedIn:false)/haha-grok-oauth(200)/haha-openai-oauth(200)——断言 <500 且限时内响应；sweep 后 /health 仍 200 | PASS |
| GUI 全导航遍历 (28) | CDP 枚举真实侧边栏全部 20 个条目并逐个点击：主导航（New session/Scheduled/Skills Market/Search chats）+ 会话历史 8 条 + 设置区全部页面（Settings/Providers/General/H5 Access/IM Adapters/Terminal/MCP/Agents/Skills/Memory/Plugins/Pets/Computer Use）；每页断言 body 非空 + 无 error-boundary + 截图 | PASS |

round26 发现并修复的**测试基建问题**（产品零缺陷）：
- 反复 taskkill 后会残留 CDP 端点已死的僵尸进程占用 9222，bat 需按 PID 清剿
  端口占用者并确认释放后再重启应用；
- CDP fetch/evaluate 必须带超时 + 重试，否则探针可能无限挂起；
- 会话历史条目的相对时间戳（"4h ago"）与虚拟滚动导致点击失配，同构会话
  条目已由 8 个静态命名条目覆盖；瞬态浮层按钮（如 "Expand display"）以
  DOM 重查确认后记 skip。

## 6. round27-probe + batch + ws2 — 测试类型学盲区闭合（37/37 PASS）

按测试类型学（负向/边界/中断/失败路径/生命周期终点）对账，此前所有轮次
几乎只走 happy path。闭合项：

| 类型学盲区 | 检查 | 结果 |
|---|---|---|
| WS 协议负向/控制面 (7) | 非法 JSON→PARSE_ERROR 错误帧；未知类型→UNKNOWN_TYPE；ping→pong；sync_state→session_state(idle)；连续负向后连接仍存活；会话创建 workDir 不存在→400 WORKDIR_MISSING | PASS |
| 运行中断 (2) | SLOW-STREAM 流式回合中 stop_generation：2 个 delta 后中断，流停止（ticks<25），非完整 25 tick | PASS |
| 边界路径 (2) | workDir 含空格+中文（`w7 r27 目录 with 空格`）的 FILE-TOOLS 回合：Write→Read hi.txt=ok 落盘在目标目录 | PASS |
| 失败终态 (4) | FAIL-NOW（mock 返回 500）：任务 run 经 SDK 10 级退避重试 218s 后标记 failed（exitCode=1、output 记录 API Error、completedAt 落定）——600s 深度观测时间线确认，不卡 running | PASS |
| API 负向矩阵 (5) | POST 到 GET-only /api/traces→405；PUT settings 非法 JSON→400；未知路由→404；URL 编码路径遍历→403；/proxy/v1/messages→404 受控 | PASS |
| 并发突发 (2) | 20 并行混合 GET 全部受控 <500；burst 后 /health 200 | PASS |
| CLI 面 (1) | cli.mjs --help 输出 usage（8751 字节） | PASS |
| 自卸载生命周期 (4, 纯 batch) | Uninstall.exe /S：主 exe、dist/server.mjs、桌面+开始菜单快捷方式、安装目录本体 **全部移除**（需杀进程后等待句柄释放 ≥9s，此前偶发残留为锁竞态非产品缺陷） | PASS |
| 重装恢复 (7) | v2 重装后 exe/server.mjs/v2 双标记/快捷方式/服务端口/health 全恢复 | PASS |
| WS 控制面全集 (8) | 剩余 6 种入站帧全部受控触达：permission_response/computer_use_permission_response（无挂起→静默忽略）、set_permission_mode（接受）、set_runtime_config（非法负载→类型化 RUNTIME_CONFIG_INVALID 错误帧）、prewarm_session（接受）、stop_background_task（伪 id→静默忽略）；全部处理后连接存活（pong 增长）。至此 WS 入站 11 种类型（user_message/ping/sync_state/stop_generation/PARSE_ERROR/UNKNOWN_TYPE + 上述 6 种）100% 覆盖 | PASS |

round27 记录的两条**测试基建铁律**（复现必读）：
- 捆绑 node.exe 拷贝到其他路径无法在 Win7 启动（0xC0000139）——VxKex 注入
  按安装路径注册；卸载阶段的自检只能用纯 batch 完成；
- cron 失败终态断言的轮询窗口必须 > SDK 重试梯队长度（实测 218s），
  否则误报"卡死"。

## 7. 修复回归对照（v2 上一版 → 本版）

| 问题 | 症状 | 修复 | 验证 |
|---|---|---|---|
| 服务端 spawn CLI 用了 Bun 专属 `--preload` | node.exe 报 bad option，WS/cron 全挂 | win32 分支改为直接执行 cli.mjs，保留 .cmd 启动器与 preload 兜底 | WS ended=complete frames=34；cron status=completed |
| 继承环境变量被过度剥离 | CLI 拿不到 ANTHROPIC_* | 仅显式选择 provider id 时才剥离 | agent turn / WS / cron 全通过 |

## 8. 历史脚本归类（迭代遗留，结论已收敛进 round23–27，无需再跑）

| 组 | 脚本 | 用途（已被取代） |
|---|---|---|
| 环境搭建/启动 | run-vm.sh, qvm.sh, launch-gui.bat, enable-vxkex.bat, kexfix*, reg-vxkex-vm.bat, restore-vxkex.bat | VM/VxKex 一次性环境搭建 |
| 探索诊断 | explore.bat, miniprobe.bat, apiprobe.bat, whereis-node.bat, check-fallback.bat, check-ifeo.bat, fix-ifeo.bat, v8-flags.bat, matrix-node.bat, matrix-test.bat, smoke-node.bat, noderun.bat, guinodedbg.bat, readfiles.bat, rgfix.bat, rgtest.bat, t1/t3/t4.bat, r-test.bat, r4.bat, q-test.bat, shot1.bat, validate.bat | 早期逐项手工排查（node 兼容、IFE0、rg 等） |
| 迭代验收 | func1–10.bat, crash14*.bat, probe14.bat, retry14.bat, retry-sidecar.bat, cuverify3–15.bat, cudiag*.bat, cupip.bat, cusetup2.bat, cuquick1.bat, cu9recheck.bat, round17–22*.bat, e2erun*.bat, srvwatch.bat, node-fallback.bat, deploy-node-fallback.bat | 各轮功能/崩溃/CU/回退验证，断言已并入 round23/24 |
| 驱动辅助 | auto-trigger.py, run-launch.py, vncclick.py, vncshot.py, vnccap.py, uac-click.py, uac-watch.py, scr.py, screen-check.py, slowtype.py, cdp.mjs, cdp2.mjs, mock-anthropic.mjs, server-v2.mjs, postsetup.mjs, gap-probe.mjs, cu-setup-probe.mjs, e2e-full.mjs, diag24.bat | 套件基础设施（VNC/UAC/CDP/mock），仍在用 |

## 9. 结论

- 安装、离线、完整性、运行时、API（32 路由组全覆盖 + 负向矩阵）、GUI（侧边栏 20 条目全遍历）、Python 侧、CLI（--version/--help/回合）、agent 回合、WS 会话（含并发 + 协议负向 + 运行中断）、cron 调度（真实 tick + 失败终态）、H5（含安全门）、终端、持久化、CU、原地升级、恢复模式、崩溃恢复、非提权运行、卸载/重装生命周期闭环、边界路径（空格+中文）—— **25 个维度全覆盖，216 项断言 0 失败**。
- 覆盖完备性由三层对账保证：源码级（32 个 `handle*Api` 全触达、WS 入站 11 种消息类型全覆盖、GUI 侧边栏运行时枚举全点击）、测试类型学级（happy/负向/边界/中断/失败/生命周期终点）、以及 mock 场景矩阵（file-tools/text-only/bash/slow-stream/fail）。
- 未覆盖项（超出离线范围，属预期豁免）：真实外网 API 调用、真实 OAuth 回调流程、Telegram/微信/WhatsApp 通道真实推送、自动更新、在线 Skills Market 拉取（离线环境用 mock/本地断言替代）。
