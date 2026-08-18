@echo off
setlocal enabledelayedexpansion
title cc-haha VxKex registration

rem ============================================================
rem cc-haha Win7 VxKex registration (VxKex 1.2.x)
rem
rem VERIFIED WORKING CONFIGURATION (Win7 SP1 x64 VM, full E2E):
rem
rem  - Claude Code Haha.exe  : NO VxKex registration needed.
rem    Electron 22 (Chromium 108) runs natively on Win7 SP1
rem    once KB2533623 + KB2670838 are installed.
rem
rem  - node.exe              : VxKex ENABLED with WINVERSPOOF:NONE.
rem    * VxKex shims missing Win8+/Win10 API entry points
rem      (EventSetInformation etc.) that Node 22 imports ->
rem      without VxKex node.exe dies with 0xC0000139.
rem    * Version spoofing MUST stay OFF: with Win10 spoof V8's
rem      ThreadIsolation uses PAGE_TARGETS_INVALID in
rem      OS::SetPermissions and crashes with
rem      "Check failed: 1455L == error" (ERROR_COMMITMENT_LIMIT).
rem      With spoof off, V8 takes the legacy Win7 path -> stable.
rem
rem  - python.exe            : VxKex ENABLED with WINVERSPOOF:NONE.
rem    * Bundled Python 3.8.10 embed needs UCRT
rem      (api-ms-win-crt-runtime-1-1-0.dll). Fresh Win7 SP1 has
rem      no UCRT -> python.exe dies with a System Error dialog.
rem      VxKex shims the UCRT api-set -> python runs, no
rem      KB2999226 patch needed.
rem    * Required by the Computer Use feature (screenshots,
rem      mouse/keyboard control via mss + pyautogui).
rem
rem  - claude-sidecar-*.exe  : not registered; the sidecar must be
rem    REMOVED (see runtime\node-fallback\remove-sidecar.bat /
rem    Setup.txt step 6) so the GUI falls back to node.exe +
rem    dist\server.mjs.
rem
rem Run as Administrator.
rem ============================================================

net session >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Administrator required. Right-click - Run as administrator.
    exit /b 1
)

set "KEXCFG=C:\Program Files\VxKex\KexCfg.exe"
if not exist "%KEXCFG%" (
    echo [FAIL] KexCfg.exe not found. Install VxKex first:
    echo        runtime\VxKex\KexSetup_Release_1_2_1_2229.exe
    exit /b 1
)

set "NODE=C:\cc-haha\resources\runtime\node\node.exe"
if not "%~1"=="" set "NODE=%~1"
if not exist "%NODE%" (
    echo [FAIL] node.exe not found at %NODE%
    echo        Install the GUI first - Setup.txt step 4.
    echo        Custom install path? Run this script with the node path:
    echo        reg-vxkex.bat "D:\my\cc-haha\resources\runtime\node\node.exe"
    exit /b 1
)

rem derive python.exe from node path (...resources\runtime\node\node.exe)
set "PYEXE=%NODE:node\node.exe=python\python.exe%"
if not exist "%PYEXE%" set "PYEXE="

echo [1/5] Registering node.exe (ENABLE:YES WINVERSPOOF:NONE)...
"%KEXCFG%" /EXE:"%NODE%" /ENABLE:YES /WINVERSPOOF:NONE /DISABLEFORCHILD:NO
if errorlevel 1 (
    echo [FAIL] KexCfg registration failed for node.exe.
    exit /b 1
)
echo [OK] node.exe registered, version spoofing OFF.

if defined PYEXE (
    echo [2/5] Registering python.exe - ENABLE:YES WINVERSPOOF:NONE...
    "%KEXCFG%" /EXE:"%PYEXE%" /ENABLE:YES /WINVERSPOOF:NONE /DISABLEFORCHILD:NO
    if errorlevel 1 (
        echo [WARN] KexCfg registration failed for python.exe.
        echo        Computer Use will not work - other features unaffected.
    ) else (
        echo [OK] python.exe registered - UCRT shim active.
    )
) else (
    echo [2/5] python.exe not found next to node.exe - skipping.
    echo        Computer Use feature will stay disabled.
)

echo [3/5] Verifying node runs...
"%NODE%" --version
if errorlevel 1 (
    echo [FAIL] node.exe failed to start. Reinstall VxKex.
    exit /b 1
)

if defined PYEXE (
    echo [4/5] Verifying python runs...
    "%PYEXE%" --version
    if errorlevel 1 (
        echo [FAIL] python.exe failed to start.
        exit /b 1
    )
) else (
    echo [4/5] skipped - no python.exe.
)

echo [5/5] Verifying IFEO subkeys...
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options\node.exe" /s 2>nul | findstr /i "FilterFullPath KEX_WinVerSpoof"
if errorlevel 1 echo [WARN] Could not read node.exe IFEO key.
if defined PYEXE (
    reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options\python.exe" /s 2>nul | findstr /i "FilterFullPath KEX_WinVerSpoof"
    if errorlevel 1 echo [WARN] Could not read python.exe IFEO key.
)

echo.
echo Registration complete. Restart cc-haha.
exit /b 0
