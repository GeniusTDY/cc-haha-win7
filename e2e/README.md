# e2e/ — Win7 offline verification suite

Guest-side E2E against the installed app, driven from the Linux host via
the QEMU test toolkit (qvm.sh / vncclick.py / scr.py — see the
`win7-pure-qemu` repo for the generic toolkit and DEPLOY guide).

## Files

| file | role |
|---|---|
| `e2e-full.mjs` | 77-check comprehensive suite: GUI boot (CDP), renderer CSS shim, server HTTP/WS APIs, workspace search (rg.exe via VxKex), Computer Use (bundled Python + offline wheels), adapters, recovery CLI. Writes `e2e-results.json` + screenshots to the SMB share |
| `round19.bat` | full restore verification: uninstall → wipe user state → silent-install the **rebuilt** Offline.exe → install-integrity asserts (sidecar removed, node-fallback dist present, python38._pth fixed, .whl wheels, CSS shim marker, main.cjs fallback marker inside app.asar) → bundled node/python/rg run (VxKex proof) → launch GUI with `--remote-debugging-port=9222` → run e2e-full.mjs |
| `round20.bat` | v1 rebuilt installer, fully offline (default route deleted, ping-proven) → full e2e-full.mjs |
| `round21c.bat` | CU setup probe offline against server-v2: custom python path resolving to the bundled interpreter → `success:true` (bundledCandidateMatch fix) |
| `round22.bat` | **v2 installer full offline regression**: kill app → delete default route → relaunch GUI with CDP → full e2e-full.mjs → restore route |
| `round23.bat` | **final v2 acceptance (offline)**: uninstall + wipe → go offline (ping-proven) → silent-install the **v2 exe itself** → 18 integrity asserts (incl. `bundledCandidateMatch` marker proving v2 server deployed) → bundled node/python/rg run → GUI launch → full e2e-full.mjs → cu-setup-probe.mjs → restore route. Log: `round23.txt`; results: `e2e-results-round23-offline.json` |
| `cu-setup-probe.mjs` | Computer Use setup/status API probe (netstat port discovery fallback when state file is absent) |
| `round17.bat` | historical fresh-install round (same shape, original package) |
| `round18.bat` | historical rerun against live GUI |
| `slowtype.py` | lossless VNC typing (TCG-safe gaps) for Win+R launching |
| `postsetup.mjs` | Computer Use API driver (port discovery + setup + status) |
| `auto-trigger.py`, `autounattend.xml` | unattended-install + auto-answer helpers |

## Run (QEMU Win7 SP1 x64, TCG, no internet in guest)

```bash
# host: share root must be the cc-haha work dir (guest sees \\10.0.2.4\qemu)
cd cc-haha/vm
QVM_MON=/tmp/qemu.sock QVM_SMB="$PWD/.." bash qvm.sh start
QVM_MON=/tmp/qemu.sock python3 scr.py wait "Recycle Bin" 300

python3 vncclick.py combo "win+r"; sleep 2.5
python3 slowtype.py 'cmd /c \\10.0.2.4\qemu\vm\round19.bat' 0.12
python3 vncclick.py key 0xff0d
# confirm the self-elevation UAC prompt if it appears:
QVM_MON=/tmp/qemu.sock SCR_UAC_CLICK=1 python3 scr.py uac 120
# wait for completion (~15 min on TCG):
QVM_MON=/tmp/qemu.sock python3 scr.py wait-file round19.txt "=== Finished" 1500
python3 - <<'EOF'
import json; r = json.load(open('e2e-results.json'))
print(len(r), 'checks,', sum(x['ok'] for x in r), 'passed,',
      sum(not x['ok'] for x in r), 'failed')
EOF
```

Expected: install-integrity block all `[OK]`, then `77 checks, 77 passed`.

## Offline regression results (QEMU Win7, guest offline)

| round | installer | network | result |
|---|---|---|---|
| 19g | v1 rebuilt | online | 76/77 (page Providers nav flake) |
| 20 | v1 rebuilt | **offline** | **77/77** |
| 22 | **v2 rebuilt** (CU custom-path fix) | **offline** | **77/77** |
| 23 | **v2 exe, fresh offline install** (uninstall+wipe first) | **offline** | **77/77 + CU probe PASS, 0 FAIL** |

Full analysis in `docs/VERIFICATION-REPORT.md` §15.
