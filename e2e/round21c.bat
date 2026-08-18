@echo off
rem round21c: re-run CU setup probe offline (app already running server-v2)
setlocal enabledelayedexpansion
set "SHARE=\\10.0.2.4\qemu"
set "OUT=%SHARE%\vm\round21c.txt"
set "NODE=C:\cc-haha\resources\runtime\node\node.exe"

net session >nul 2>&1
if errorlevel 1 (
    echo not-elevated self-elevating > "%OUT%"
    echo Set UAC = CreateObject^("Shell.Application"^) : UAC.ShellExecute "cmd.exe", "/c ""%~f0""", "", "runas", 1 > "%TEMP%\r21c.vbs"
    cscript //nologo "%TEMP%\r21c.vbs" >nul 2>&1
    exit /b
)

echo === round21c cu-probe offline %date% %time% === > "%OUT%"
echo [OK] elevated >> "%OUT%"
route delete 0.0.0.0 >nul 2>&1
route delete 0.0.0.0 mask 0.0.0.0 >nul 2>&1
ping -n 1 -w 3000 8.8.8.8 >> "%OUT%" 2>&1
echo ping88-exit=!errorlevel! >> "%OUT%"
"%NODE%" "%SHARE%\vm\cu-setup-probe.mjs" >> "%OUT%" 2>&1
echo probe-exit=!errorlevel! >> "%OUT%"
route add 0.0.0.0 mask 0.0.0.0 10.0.2.2 >nul 2>&1
echo route-restore-exit=!errorlevel! >> "%OUT%"
echo === Finished %date% %time% === >> "%OUT%"
exit /b 0
