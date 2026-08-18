@echo off
rem round20: FULLY OFFLINE verification. Delete default route (internet dead,
rem SMB 10.0.2.4 stays on-link), prove offline, relaunch GUI, run full E2E,
rem then restore route.
setlocal enabledelayedexpansion
set "SHARE=\\10.0.2.4\qemu"
set "OUT=%SHARE%\vm\round20.txt"
set "NODE=C:\cc-haha\resources\runtime\node\node.exe"

net session >nul 2>&1
if errorlevel 1 (
    echo not-elevated self-elevating > "%OUT%"
    echo Set UAC = CreateObject^("Shell.Application"^) : UAC.ShellExecute "cmd.exe", "/c ""%~f0""", "", "runas", 1 > "%TEMP%\r20.vbs"
    cscript //nologo "%TEMP%\r20.vbs" >nul 2>&1
    exit /b
)

echo === round20 offline-e2e %date% %time% === > "%OUT%"
echo [OK] elevated >> "%OUT%"

echo --- kill default route (go offline) --- >> "%OUT%"
route delete 0.0.0.0 >nul 2>&1
route delete 0.0.0.0 mask 0.0.0.0 >nul 2>&1
ipconfig | findstr /i "Gateway" >> "%OUT%" 2>&1

echo --- prove offline: ping 8.8.8.8 (expect fail) --- >> "%OUT%"
ping -n 1 -w 3000 8.8.8.8 >> "%OUT%" 2>&1
echo ping88-exit=!errorlevel! >> "%OUT%"
ping -n 1 -w 3000 github.com >> "%OUT%" 2>&1
echo pingdns-exit=!errorlevel! >> "%OUT%"

echo --- SMB still reachable --- >> "%OUT%"
copy /y "%SHARE%\vm\e2e-full.mjs" "%TEMP%\e2e-check.mjs" >nul 2>&1
echo smb-copy-exit=!errorlevel! >> "%OUT%"

taskkill /f /im "Claude Code Haha.exe" >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
ping -n 4 127.0.0.1 >nul

echo --- launch GUI offline (CDP on) --- >> "%OUT%"
start "" "C:\cc-haha\Claude Code Haha.exe" --remote-debugging-port=9222
echo launched, waiting 90s >> "%OUT%"
ping -n 91 127.0.0.1 >nul

echo --- run full E2E OFFLINE --- >> "%OUT%"
"%NODE%" "%SHARE%\vm\e2e-full.mjs" >> "%OUT%" 2>&1

echo --- post-E2E node --- >> "%OUT%"
tasklist | findstr /i "node.exe" >> "%OUT%" 2>&1

echo --- restore default route --- >> "%OUT%"
route add 0.0.0.0 mask 0.0.0.0 10.0.2.2 >nul 2>&1
echo route-restore-exit=!errorlevel! >> "%OUT%"
echo === Finished %date% %time% === >> "%OUT%"
exit /b 0
