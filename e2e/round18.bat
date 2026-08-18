@echo off
rem round18: rerun full E2E against live GUI (validate Recheck retry fix)
setlocal
set "SHARE=\\10.0.2.4\qemu"
set "OUT=%SHARE%\vm\round18.txt"
set "NODE=C:\cc-haha\resources\runtime\node\node.exe"
echo === round18 e2e-rerun %date% %time% === > "%OUT%"
tasklist | findstr /i "node.exe Claude" >> "%OUT%" 2>&1
echo --- run E2E --- >> "%OUT%"
"%NODE%" "%SHARE%\vm\e2e-full.mjs" >> "%OUT%" 2>&1
echo --- post-E2E node state --- >> "%OUT%"
tasklist | findstr /i "node.exe" >> "%OUT%" 2>&1
echo === Finished %date% %time% === >> "%OUT%"
