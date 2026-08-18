@echo off
rem round23: FINAL v2 acceptance — fresh install of the v2 offline installer,
rem fully offline guest (route deleted, ping-proven), integrity asserts,
rem full 77-check E2E, CU custom-python-path probe, then route restore.
setlocal enabledelayedexpansion
set "SHARE=\\10.0.2.4\qemu"
set "OUT=%SHARE%\vm\round23.txt"
set "NODE=C:\cc-haha\resources\runtime\node\node.exe"

net session >nul 2>&1
if errorlevel 1 (
    echo not-elevated self-elevating > "%OUT%"
    echo Set UAC = CreateObject^("Shell.Application"^) : UAC.ShellExecute "cmd.exe", "/c ""%~f0""", "", "runas", 1 > "%TEMP%\r23.vbs"
    cscript //nologo "%TEMP%\r23.vbs" >nul 2>&1
    exit /b
)

echo === round23 v2-final-offline %date% %time% === > "%OUT%"
echo [OK] elevated >> "%OUT%"

reg add "HKLM\SYSTEM\CurrentControlSet\Control\Windows" /v ErrorMode /t REG_DWORD /d 2 /f >> "%OUT%" 2>&1

taskkill /f /im "Claude Code Haha.exe" >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
ping -n 4 127.0.0.1 >nul

echo --- uninstall previous --- >> "%OUT%"
if exist "C:\cc-haha\Uninstall.exe" (
  "C:\cc-haha\Uninstall.exe" /S _?="C:\cc-haha" >> "%OUT%" 2>&1
  echo uninstall-exit=!errorlevel! >> "%OUT%"
)
ping -n 9 127.0.0.1 >nul
if exist "C:\cc-haha" ( rmdir /s /q "C:\cc-haha" >> "%OUT%" 2>&1 )
if exist "C:\cc-haha" ( echo [WARN] dir still exists >> "%OUT%" ) else ( echo [OK] C:\cc-haha gone >> "%OUT%" )

echo --- wipe user state (first-run scenario) --- >> "%OUT%"
rmdir /s /q "C:\Users\test\AppData\Roaming\cc-haha" >nul 2>&1 && echo [OK] appdata wiped >> "%OUT%"
rmdir /s /q "C:\Users\test\.claude\.runtime" >nul 2>&1 && echo [OK] runtime wiped >> "%OUT%"
rmdir /s /q "C:\Users\test\.claude\cc-haha" >nul 2>&1 && echo [OK] state wiped >> "%OUT%"

echo --- GO OFFLINE (delete default route) --- >> "%OUT%"
route delete 0.0.0.0 >nul 2>&1
route delete 0.0.0.0 mask 0.0.0.0 >nul 2>&1
ping -n 1 -w 3000 8.8.8.8 >> "%OUT%" 2>&1
echo ping88-exit=!errorlevel! >> "%OUT%"
ping -n 1 -w 3000 github.com >> "%OUT%" 2>&1
echo pingdns-exit=!errorlevel! >> "%OUT%"
copy /y "%SHARE%\vm\round23.bat" "%TEMP%\r23-probe.tmp" >nul 2>&1 && echo [OK] SMB still reachable >> "%OUT%" || echo [FAIL] SMB unreachable >> "%OUT%"
del "%TEMP%\r23-probe.tmp" >nul 2>&1

echo --- INSTALL v2 package (silent, elevated, OFFLINE) --- >> "%OUT%"
"%SHARE%\vm\Claude-Code-Haha-0.5.4-Win7-x64-Offline-v2.exe" /S >> "%OUT%" 2>&1
echo install-exit=!errorlevel! >> "%OUT%"
ping -n 21 127.0.0.1 >nul

echo --- install integrity --- >> "%OUT%"
if exist "C:\cc-haha\Claude Code Haha.exe" ( echo [OK] exe present >> "%OUT%" ) else ( echo [FAIL] exe missing >> "%OUT%" )
set "DIST=C:\cc-haha\resources\app.asar.unpacked\dist"
set "BIN=C:\cc-haha\resources\app.asar.unpacked\src-tauri\binaries"
set "RT=C:\cc-haha\resources\runtime"
for %%F in (server.mjs adapters.mjs cli.mjs recovery-cli.mjs) do (
  if exist "!DIST!\%%F" ( echo [OK] dist\%%F >> "%OUT%" ) else ( echo [FAIL] dist\%%F missing >> "%OUT%" )
)
if exist "!DIST!\adapters-chunks" ( echo [OK] adapters-chunks >> "%OUT%" ) else ( echo [FAIL] adapters-chunks missing >> "%OUT%" )
if exist "!BIN!\claude-sidecar-x86_64-pc-windows-msvc.exe" ( echo [FAIL] sidecar PRESENT >> "%OUT%" ) else ( echo [OK] sidecar removed >> "%OUT%" )
if exist "!BIN!\rg.exe" ( echo [OK] rg.exe present >> "%OUT%" ) else ( echo [FAIL] rg.exe missing >> "%OUT%" )
if exist "!RT!\node\node.exe" ( echo [OK] node.exe present >> "%OUT%" ) else ( echo [FAIL] node.exe missing >> "%OUT%" )
if exist "!RT!\python\python.exe" ( echo [OK] python.exe present >> "%OUT%" ) else ( echo [FAIL] python.exe missing >> "%OUT%" )
if exist "!RT!\python\wheels\pip-24.3.1-py3-none-any.whl" ( echo [OK] pip wheel present >> "%OUT%" ) else ( echo [FAIL] pip wheel missing >> "%OUT%" )
findstr /C:"Lib\site-packages" "!RT!\python\python38._pth" >nul 2>&1 && echo [OK] python38._pth fixed >> "%OUT%" || echo [FAIL] python38._pth >> "%OUT%"
findstr /C:"import site" "!RT!\python\python38._pth" >nul 2>&1 && echo [OK] _pth import site >> "%OUT%" || echo [FAIL] _pth import site >> "%OUT%"
findstr /C:"KexCfg" "!RT!\setup-vxkex.bat" >nul 2>&1 && echo [OK] setup-vxkex KexCfg edition >> "%OUT%" || echo [FAIL] setup-vxkex edition >> "%OUT%"
findstr /C:"__CC_W7_CSS_SHIM__" "!DIST!\index.html" >nul 2>&1 && echo [OK] CSS shim in index.html >> "%OUT%" || echo [FAIL] CSS shim missing >> "%OUT%"
findstr /m /C:"CC_HAHA_NODE_EXE" "C:\cc-haha\resources\app.asar" >nul 2>&1 && echo [OK] main.cjs node-fallback in asar >> "%OUT%" || echo [FAIL] main.cjs fallback missing >> "%OUT%"
findstr /C:"bundledCandidateMatch" "!DIST!\server.mjs" >nul 2>&1 && echo [OK] v2 server.mjs (bundledCandidateMatch) >> "%OUT%" || echo [FAIL] v1 server.mjs deployed >> "%OUT%"

echo --- bundled runtimes run (VxKex proof) --- >> "%OUT%"
"!RT!\node\node.exe" --version >> "%OUT%" 2>&1
echo node-ver-exit=!errorlevel! >> "%OUT%"
"!RT!\python\python.exe" --version >> "%OUT%" 2>&1
echo python-ver-exit=!errorlevel! >> "%OUT%"
"!BIN!\rg.exe" --version >> "%OUT%" 2>&1
echo rg-ver-exit=!errorlevel! >> "%OUT%"

echo --- launch GUI (first run, CDP on, OFFLINE) --- >> "%OUT%"
start "" "C:\cc-haha\Claude Code Haha.exe" --remote-debugging-port=9222
echo launched, waiting 90s >> "%OUT%"
ping -n 91 127.0.0.1 >nul

echo --- run full E2E (OFFLINE) --- >> "%OUT%"
"!NODE!" "%SHARE%\vm\e2e-full.mjs" >> "%OUT%" 2>&1
echo e2e-exit=!errorlevel! >> "%OUT%"

echo --- CU setup probe: custom python path -> bundled (OFFLINE) --- >> "%OUT%"
"!NODE!" "%SHARE%\vm\cu-setup-probe.mjs" >> "%OUT%" 2>&1
echo cu-probe-exit=!errorlevel! >> "%OUT%"

echo --- post-E2E node --- >> "%OUT%"
tasklist | findstr /i "node.exe" >> "%OUT%" 2>&1

route add 0.0.0.0 mask 0.0.0.0 10.0.2.2 >nul 2>&1
echo route-restore-exit=!errorlevel! >> "%OUT%"
echo === Finished %date% %time% === >> "%OUT%"
exit /b 0
