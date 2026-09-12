@echo off
setlocal enabledelayedexpansion
rem ============================================================
rem cc-haha Win7 VxKex registration (VxKex 1.2.x, KexCfg based)
rem
rem Normally NOT needed: the installer already registers the
rem bundled runtimes automatically. Run this manually only if
rem you moved the install directory or reinstalled VxKex.
rem
rem VERIFIED CONFIGURATION (Win7 SP1 x64 VM, full E2E):
rem   node.exe   ENABLE:YES WINVERSPOOF:NONE (shims Win8+ APIs)
rem   python.exe ENABLE:YES WINVERSPOOF:NONE (UCRT api-set shim)
rem   Claude Code Haha.exe needs no registration (Electron 22)
rem ============================================================

net session >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Administrator required. Right-click - Run as administrator.
    exit /b 1
)

rem derive install root from this script location (...resources\runtime\)
rem NOTE: pushd/popd normalizes the path. A literal "%~dp0..\..\..." used
rem to produce a wrong FilterFullPath (resources\resources\...) because
rem KexCfg does not fully collapse multi-level relative components, so
rem VxKex never matched the real exe path and injection silently failed.
pushd "%~dp0.."
set "RES=%CD%"
popd
set "NODE=%RES%\runtime\node-v22.17.0\node.exe"
set "PYEXE=%RES%\runtime\python-3.8.10\python.exe"
set "RGEXE=%RES%\app.asar.unpacked\src-tauri\binaries\rg.exe"
set "SETUP=%~dp0vxkex-1.2.1.2229\KexSetup_Release_1_2_1_2229.exe"

set "KEXCFG="
call :findkexcfg
if defined KEXCFG goto :havekex

echo [..] VxKex not found - installing the bundled copy silently...
if not exist "%SETUP%" (
    echo [FAIL] bundled VxKex setup missing: "%SETUP%"
    exit /b 1
)
cmd /c "echo. | ""%SETUP%"" /SILENTUNATTEND"
echo [..] waiting for VxKex to land (up to 30 s)...
set /a KEXTRIES=0
:waitkex
set /a KEXTRIES+=1
ping -n 2 127.0.0.1 >nul
call :findkexcfg
if defined KEXCFG goto :havekex
if %KEXTRIES% LSS 30 goto :waitkex
echo [FAIL] VxKex still not installed (KexCfg.exe never appeared).
echo        Install it manually, then re-run this script:
echo          "%SETUP%" /SILENTUNATTEND
exit /b 1

:havekex
echo [OK] KexCfg: %KEXCFG%

echo [1/5] Registering node.exe...
"%KEXCFG%" /EXE:"%NODE%" /ENABLE:YES /WINVERSPOOF:NONE /DISABLEFORCHILD:NO
if errorlevel 1 ( echo [FAIL] node.exe registration failed & exit /b 1 )

echo [2/5] Registering python.exe...
"%KEXCFG%" /EXE:"%PYEXE%" /ENABLE:YES /WINVERSPOOF:NONE /DISABLEFORCHILD:NO
if errorlevel 1 ( echo [WARN] python.exe registration failed - Computer Use disabled )

echo [3/5] Registering rg.exe (ripgrep search, Win8+ API shim)...
if exist "%RGEXE%" (
    "%KEXCFG%" /EXE:"%RGEXE%" /ENABLE:YES /WINVERSPOOF:NONE /DISABLEFORCHILD:NO
    if errorlevel 1 ( echo [WARN] rg.exe registration failed - workspace search degraded )
) else (
    echo [WARN] rg.exe not found - skipped
)

echo [4/5] Verifying node runs...
"%NODE%" --version
if errorlevel 1 ( echo [FAIL] node.exe failed to start & exit /b 1 )

echo [5/5] Verifying python runs...
"%PYEXE%" --version

echo Registration complete. Restart cc-haha.
exit /b 0

:findkexcfg
set "KEXCFG="
if exist "C:\Program Files\VxKex\KexCfg.exe" set "KEXCFG=C:\Program Files\VxKex\KexCfg.exe"
if defined KEXCFG goto :eof
if exist "C:\Program Files (x86)\VxKex\KexCfg.exe" set "KEXCFG=C:\Program Files (x86)\VxKex\KexCfg.exe"
goto :eof
