@echo off
rem round22: full E2E regression with server-v2 (offline)
setlocal enabledelayedexpansion
set "SHARE=\\10.0.2.4\qemu"
set "OUT=%SHARE%\vm\round22.txt"
set "NODE=C:\cc-haha\resources\runtime\node\node.exe"

net session >nul 2>&1
if errorlevel 1 (
    echo not-elevated self-elevating > "%OUT%"
    echo Set UAC = CreateObject^("Shell.Application"^) : UAC.ShellExecute "cmd.exe", "/c ""%~f0""", "", "runas", 1 > "%TEMP%\r22.vbs"
    cscript //nologo "%TEMP%\r22.vbs" >nul 2>&1
    exit /b
)

echo === round22 full-e2e v2 offline %date% %time% === > "%OUT%"
echo [OK] elevated >> "%OUT%"
route delete 0.0.0.0 >nul 2>&1
route delete 0.0.0.0 mask 0.0.0.0 >nul 2>&1
ping -n 1 -w 3000 8.8.8.8 >> "%OUT%" 2>&1
echo ping88-exit=!errorlevel! >> "%OUT%"

taskkill /f /im "Claude Code Haha.exe" >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
ping -n 4 127.0.0.1 >nul
start "" "C:\cc-haha\Claude Code Haha.exe" --remote-debugging-port=9222
echo launched, waiting 90s >> "%OUT%"
ping -n 91 127.0.0.1 >nul

echo --- run full E2E OFFLINE (v2) --- >> "%OUT%"
"%NODE%" "%SHARE%\vm\e2e-full.mjs" >> "%OUT%" 2>&1

tasklist | findstr /i "node.exe" >> "%OUT%" 2>&1
route add 0.0.0.0 mask 0.0.0.0 10.0.2.2 >nul 2>&1
echo route-restore-exit=!errorlevel! >> "%OUT%"
echo === Finished %date% %time% === >> "%OUT%"
exit /b 0
