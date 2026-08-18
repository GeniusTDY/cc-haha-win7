@echo off
rem round17: (elevated) disable VxKex regs -> uninstall -> wipe -> install NEW package -> first-run -> full E2E
setlocal enabledelayedexpansion
set "SHARE=\\10.0.2.4\qemu"
set "OUT=%SHARE%\vm\round17.txt"

net session >nul 2>&1
if errorlevel 1 (
    echo not-elevated self-elevating > "%OUT%"
    echo Set UAC = CreateObject^("Shell.Application"^) : UAC.ShellExecute "cmd.exe", "/c ""%~f0""", "", "runas", 1 > "%TEMP%\r17.vbs"
    cscript //nologo "%TEMP%\r17.vbs" >nul 2>&1
    exit /b
)

echo === round17 reinstall-new-package %date% %time% === > "%OUT%"
echo [OK] elevated >> "%OUT%"

set "KEXCFG=C:\Program Files\VxKex\KexCfg.exe"
if not exist "%KEXCFG%" set "KEXCFG=C:\Program Files (x86)\VxKex\KexCfg.exe"
set "RGOLD=C:\cc-haha\resources\app.asar.unpacked\src-tauri\binaries\rg.exe"

echo --- pre-disable all VxKex registrations (prove installer re-registers) --- >> "%OUT%"
"%KEXCFG%" /EXE:"C:\cc-haha\resources\runtime\node\node.exe" /ENABLE:NO >> "%OUT%" 2>&1
"%KEXCFG%" /EXE:"C:\cc-haha\resources\runtime\python\python.exe" /ENABLE:NO >> "%OUT%" 2>&1
if exist "%RGOLD%" "%KEXCFG%" /EXE:"%RGOLD%" /ENABLE:NO >> "%OUT%" 2>&1
echo pre-disable done >> "%OUT%"

echo --- suppress hard-error dialogs --- >> "%OUT%"
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Windows" /v ErrorMode /t REG_DWORD /d 2 /f >> "%OUT%" 2>&1

taskkill /f /im "Claude Code Haha.exe" >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
ping -n 4 127.0.0.1 >nul

echo --- uninstall previous --- >> "%OUT%"
if exist "C:\cc-haha\Uninstall cc-haha.exe" (
  "C:\cc-haha\Uninstall cc-haha.exe" /S _?="C:\cc-haha" >> "%OUT%" 2>&1
  echo uninstall-exit=!errorlevel! >> "%OUT%"
) else (
  echo no uninstaller found >> "%OUT%"
)
ping -n 9 127.0.0.1 >nul
if exist "C:\cc-haha" ( rmdir /s /q "C:\cc-haha" >> "%OUT%" 2>&1 ) else ( echo [OK] C:\cc-haha removed by uninstaller >> "%OUT%" )
if exist "C:\cc-haha" ( echo [WARN] dir still exists >> "%OUT%" ) else ( echo [OK] C:\cc-haha gone >> "%OUT%" )

echo --- wipe user state (first-run scenario) --- >> "%OUT%"
rmdir /s /q "C:\Users\test\AppData\Roaming\cc-haha" >nul 2>&1 && echo [OK] appdata wiped >> "%OUT%"
rmdir /s /q "C:\Users\test\.claude\.runtime" >nul 2>&1 && echo [OK] runtime wiped >> "%OUT%"
rmdir /s /q "C:\Users\test\.claude\cc-haha" >nul 2>&1 && echo [OK] state wiped >> "%OUT%"

echo --- INSTALL new package (silent, elevated ctx) --- >> "%OUT%"
"%SHARE%\Claude-Code-Haha-0.5.4-Win7-x64-Offline.exe" /S >> "%OUT%" 2>&1
echo install-exit=!errorlevel! >> "%OUT%"
ping -n 21 127.0.0.1 >nul
if exist "C:\cc-haha\Claude Code Haha.exe" ( echo [OK] installed >> "%OUT%" ) else ( echo [FAIL] exe missing >> "%OUT%" )
if exist "C:\cc-haha\resources\app.asar.unpacked\src-tauri\binaries\rg.exe" ( echo [OK] rg.exe present >> "%OUT%" ) else ( echo [FAIL] rg.exe missing >> "%OUT%" )

echo --- verify rg runs right after install (proves installer registered it) --- >> "%OUT%"
"C:\cc-haha\resources\app.asar.unpacked\src-tauri\binaries\rg.exe" --version >> "%OUT%" 2>&1
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
