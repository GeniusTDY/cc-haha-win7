@echo off
rem round24: coverage-gap fill for the v2 installer, fully offline.
rem guest-side mock Anthropic API on 127.0.0.1:8787 + app restarted with
rem ANTHROPIC_BASE_URL pointing at it => WS session flow, cron execution
rem and full agent turns are all closable offline. Phase2 restarts the app
rem WITHOUT the mock env and re-reads persistence probes.
setlocal enabledelayedexpansion
set "SHARE=\\10.0.2.4\qemu"
set "OUT=%SHARE%\vm\round24.txt"
set "NODE=C:\cc-haha\resources\runtime\node\node.exe"
set "APP=C:\cc-haha\Claude Code Haha.exe"

net session >nul 2>&1
if errorlevel 1 (
    echo not-elevated self-elevating > "%OUT%"
    echo Set UAC = CreateObject^("Shell.Application"^) : UAC.ShellExecute "cmd.exe", "/c ""%~f0""", "", "runas", 1 > "%TEMP%\r24.vbs"
    cscript //nologo "%TEMP%\r24.vbs" >nul 2>&1
    exit /b
)

echo === round24 gap-fill OFFLINE %date% %time% === > "%OUT%"
echo [OK] elevated >> "%OUT%"
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Windows" /v ErrorMode /t REG_DWORD /d 2 /f >> "%OUT%" 2>&1

echo --- shortcuts (installer artifacts) --- >> "%OUT%"
dir /b "C:\Users\test\Desktop\*.lnk" "C:\Users\Public\Desktop\*.lnk" 2>nul | findstr /i "claude haha" >> "%OUT%" && echo [OK] desktop shortcut >> "%OUT%"
dir /b "%APPDATA%\Microsoft\Windows\Start Menu\Programs\*.lnk" 2>nul | findstr /i "claude haha" >> "%OUT%" && echo [OK] start-menu shortcut >> "%OUT%"
if exist "C:\cc-haha\Uninstall.exe" ( echo [OK] uninstaller present >> "%OUT%" ) else ( echo [FAIL] uninstaller missing >> "%OUT%" )

echo --- GO OFFLINE --- >> "%OUT%"
route delete 0.0.0.0 >nul 2>&1
ping -n 1 -w 3000 8.8.8.8 >> "%OUT%" 2>&1
echo ping88-exit=!errorlevel! >> "%OUT%"
copy /y "%SHARE%\vm\round24.bat" "%TEMP%\r24.tmp" >nul 2>&1 && echo [OK] SMB alive >> "%OUT%"

echo --- start guest mock API (localhost, offline-safe) --- >> "%OUT%"
taskkill /f /im node.exe >nul 2>&1
start "" /min "%NODE%" "%SHARE%\vm\mock-anthropic.mjs"
ping -n 6 127.0.0.1 >nul
"%NODE%" -e "fetch('http://127.0.0.1:8787/health').then(r=>r.text()).then(t=>console.log('mock-health',t)).catch(e=>console.log('mock-ERR',e.message))" >> "%OUT%" 2>&1

echo --- restart app WITH mock env + CDP --- >> "%OUT%"
taskkill /f /im "Claude Code Haha.exe" >nul 2>&1
ping -n 4 127.0.0.1 >nul
set "ANTHROPIC_BASE_URL=http://127.0.0.1:8787"
set "ANTHROPIC_API_KEY=mock"
set "ANTHROPIC_MODEL=claude-fable-5"
set "ANTHROPIC_SMALL_FAST_MODEL=claude-fable-5"
start "" "%APP%" --remote-debugging-port=9222
echo launched-with-mock-env, waiting 90s >> "%OUT%"
ping -n 91 127.0.0.1 >nul

echo --- gap-probe phase1 --- >> "%OUT%"
"%NODE%" "%SHARE%\vm\gap-probe.mjs" 1 >> "%OUT%" 2>&1
echo gap1-exit=!errorlevel! >> "%OUT%"

echo --- restart app WITHOUT mock env (persistence check) --- >> "%OUT%"
taskkill /f /im "Claude Code Haha.exe" >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
ping -n 5 127.0.0.1 >nul
start "" "%APP%" --remote-debugging-port=9222
echo relaunched-clean, waiting 75s >> "%OUT%"
ping -n 76 127.0.0.1 >nul

echo --- gap-probe phase2 --- >> "%OUT%"
"%NODE%" "%SHARE%\vm\gap-probe.mjs" 2 >> "%OUT%" 2>&1
echo gap2-exit=!errorlevel! >> "%OUT%"

route add 0.0.0.0 mask 0.0.0.0 10.0.2.2 >nul 2>&1
echo route-restore=!errorlevel! >> "%OUT%"
echo === Finished %date% %time% === >> "%OUT%"
exit /b 0
