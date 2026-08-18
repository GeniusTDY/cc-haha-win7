@echo off
rem round19: verify REBUILT offline installer (restored pipeline)
rem uninstall -> wipe -> install rebuilt exe -> restoration asserts -> full E2E
setlocal enabledelayedexpansion
set "SHARE=\\10.0.2.4\qemu"
set "OUT=%SHARE%\vm\round19.txt"

net session >nul 2>&1
if errorlevel 1 (
    echo not-elevated self-elevating > "%OUT%"
    echo Set UAC = CreateObject^("Shell.Application"^) : UAC.ShellExecute "cmd.exe", "/c ""%~f0""", "", "runas", 1 > "%TEMP%\r19.vbs"
    cscript //nologo "%TEMP%\r19.vbs" >nul 2>&1
    exit /b
)

echo === round19 rebuilt-installer verify %date% %time% === > "%OUT%"
echo [OK] elevated >> "%OUT%"

echo --- suppress hard-error dialogs --- >> "%OUT%"
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

echo --- INSTALL rebuilt package (silent, elevated) --- >> "%OUT%"
"%SHARE%\vm\Claude-Code-Haha-0.5.4-Win7-x64-Offline.exe" /S >> "%OUT%" 2>&1
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

echo --- bundled runtimes run (VxKex proof) --- >> "%OUT%"
"!RT!\node\node.exe" --version >> "%OUT%" 2>&1
echo node-ver-exit=!errorlevel! >> "%OUT%"
"!RT!\python\python.exe" --version >> "%OUT%" 2>&1
echo python-ver-exit=!errorlevel! >> "%OUT%"
"!BIN!\rg.exe" --version >> "%OUT%" 2>&1
echo rg-ver-exit=!errorlevel! >> "%OUT%"

echo --- launch GUI (first run, CDP on) --- >> "%OUT%"
start "" "C:\cc-haha\Claude Code Haha.exe" --remote-debugging-port=9222
echo launched, waiting 90s >> "%OUT%"
ping -n 91 127.0.0.1 >nul

echo --- run full E2E --- >> "%OUT%"
"C:\cc-haha\resources\runtime\node\node.exe" "%SHARE%\vm\e2e-full.mjs" >> "%OUT%" 2>&1

echo --- post-E2E node --- >> "%OUT%"
tasklist | findstr /i "node.exe" >> "%OUT%" 2>&1
echo === Finished %date% %time% === >> "%OUT%"
exit /b 0
