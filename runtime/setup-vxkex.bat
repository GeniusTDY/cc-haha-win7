@echo off
setlocal
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

set "KEXCFG=C:\Program Files\VxKex\KexCfg.exe"
if not exist "%KEXCFG%" set "KEXCFG=C:\Program Files (x86)\VxKex\KexCfg.exe"
if not exist "%KEXCFG%" (
    echo [FAIL] KexCfg.exe not found. Install VxKex first:
    echo        %~dp0vxkex\KexSetup_Release_1_2_1_2229.exe
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
set "NODE=%RES%\runtime\node\node.exe"
set "PYEXE=%RES%\runtime\python\python.exe"
set "RGEXE=%RES%\app.asar.unpacked\src-tauri\binaries\rg.exe"

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
