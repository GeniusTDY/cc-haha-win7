@echo off
setlocal enabledelayedexpansion
title cc-haha Node fallback deploy + sidecar removal

rem ============================================================
rem cc-haha Win7 post-install fix (run AFTER GUI installation)
rem
rem 1. Locates the GUI install dir (registry, arg override,
rem    or C:\cc-haha default).
rem 2. Copies the Node fallback bundle (server.mjs, adapters.mjs,
rem    cli.mjs, recovery-cli.mjs, adapters-chunks\) into
rem    <install>\resources\app.asar.unpacked\dist\
rem    (the GUI installer does NOT ship these files).
rem 3. Deletes the broken Bun-compiled sidecar
rem    (claude-sidecar-x86_64-pc-windows-msvc.exe) so the GUI
rem    automatically falls back to node.exe + dist\server.mjs.
rem 4. Adds an inbound firewall rule for node.exe (suppresses the
rem    Windows Firewall popup on first launch).
rem
rem Prerequisites: KB patches + VxKex + GUI installed,
rem runtime\VxKex\reg-vxkex.bat already run.
rem
rem Run as Administrator.
rem ============================================================

net session >nul 2>&1 || (
    echo [FAIL] Administrator required. Right-click - Run as administrator.
    exit /b 1
)

set "SELFDIR=%~dp0"
set "SIDECAR_NAME=claude-sidecar-x86_64-pc-windows-msvc.exe"

rem --- locate install dir -------------------------------------
set "INST="
if not "%~1"=="" (
    set "INST=%~1"
    goto :inst_found
)

for %%R in (HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall HKLM\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall) do (
    for /f "delims=" %%K in ('reg query "%%R" /s /f "Claude Code Haha" /d 2^>nul ^| findstr /i "^HKEY"') do (
        if "!INST!"=="" for /f "tokens=1,2,*" %%A in ('reg query "%%K" /v InstallLocation 2^>nul ^| findstr /i "InstallLocation"') do (
            if not "%%C"=="" set "INST=%%C"
        )
    )
)
if "%INST%"=="" set "INST=C:\cc-haha"

:inst_found
if "%INST:~-1%"=="\" set "INST=%INST:~0,-1%"
set "GUI=%INST%\Claude Code Haha.exe"
if not exist "%GUI%" (
    echo [FAIL] GUI not found at %INST%
    echo        Pass the install dir as argument:
    echo        remove-sidecar.bat "D:\my\cc-haha"
    exit /b 1
)
echo [OK] install dir: %INST%

set "APPUNP=%INST%\resources\app.asar.unpacked"
set "DIST=%APPUNP%\dist"
set "SIDECAR=%APPUNP%\src-tauri\binaries\%SIDECAR_NAME%"
set "NODE=%INST%\resources\runtime\node\node.exe"

rem --- stop running app ---------------------------------------
taskkill /f /im "Claude Code Haha.exe" >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
ping -n 3 127.0.0.1 >nul

rem --- step 1: deploy fallback bundle -------------------------
if not exist "%SELFDIR%server.mjs" (
    echo [FAIL] server.mjs missing next to this script ^(runtime\node-fallback^).
    exit /b 1
)
echo [1/4] Copying Node fallback bundle into dist\ ...
set "COPYFAIL=0"
for %%F in (server.mjs adapters.mjs cli.mjs recovery-cli.mjs) do (
    xcopy "%SELFDIR%%%F" "%DIST%\" /y /q >nul 2>nul
    if not exist "%DIST%\%%F" copy /y "%SELFDIR%%%F" "%DIST%\%%F" >nul 2>nul
    if not exist "%DIST%\%%F" (
        echo [FAIL] could not deploy %%F
        set "COPYFAIL=1"
    )
)
xcopy "%SELFDIR%adapters-chunks\" "%DIST%\adapters-chunks\" /e /i /y /q >nul 2>nul
if "%COPYFAIL%"=="1" (
    echo        Check that the full runtime\node-fallback folder ships with this package.
    exit /b 1
)
set "CNT=0"
for /f %%N in ('dir /b "%DIST%\adapters-chunks" 2^>nul ^| find /c /v ""') do set "CNT=%%N"
if "%CNT%"=="0" (
    echo [FAIL] adapters-chunks deployed empty.
    exit /b 1
)
echo [OK] fallback bundle deployed - %CNT% chunk files.

rem --- step 1b: merge offline python wheels (Computer Use) -----
set "PYWHEELS=%INST%\resources\runtime\python\wheels"
set "PYDIR=%INST%\resources\runtime\python"
if exist "%PYDIR%\python.exe" (
    if exist "%SELFDIR%wheels\" (
        xcopy "%SELFDIR%wheels\*.whl" "%PYWHEELS%\" /y /q >nul 2>nul
        if not exist "%PYWHEELS%\setuptools-75.3.0-py3-none-any.whl" copy /y "%SELFDIR%wheels\setuptools-75.3.0-py3-none-any.whl" "%PYWHEELS%\" >nul 2>nul
        if not exist "%PYWHEELS%\wheel-0.42.0-py3-none-any.whl" copy /y "%SELFDIR%wheels\wheel-0.42.0-py3-none-any.whl" "%PYWHEELS%\" >nul 2>nul
        copy /y "%SELFDIR%wheels\get-pip.py" "%PYDIR%\get-pip.py" >nul 2>nul
        if not exist "%PYWHEELS%\pyautogui-0.9.54-py3-none-any.whl" copy /y "%SELFDIR%wheels\pyautogui-0.9.54-py3-none-any.whl" "%PYWHEELS%\" >nul 2>nul
        if exist "%PYWHEELS%\setuptools-75.3.0-py3-none-any.whl" (
            echo [OK] offline wheels + py3.8 get-pip merged.
        ) else (
            echo [WARN] wheels merge failed - Computer Use setup needs setuptools wheel.
        )
    ) else (
        echo [INFO] no wheels folder in bundle - skipping merge.
    )
    rem Embedded python ships python38._pth in isolated mode: without
    rem "import site" + Lib\site-packages, pip and every installed package
    rem stay invisible. Enable site discovery when missing.
    if exist "%PYDIR%\python38._pth" (
        findstr /r /c:"^import site" "%PYDIR%\python38._pth" >nul 2>&1
        if errorlevel 1 (
            (echo python38.zip& echo .& echo Lib\site-packages& echo import site) > "%PYDIR%\python38._pth"
            echo [OK] python38._pth site-packages discovery enabled.
        ) else (
            echo [OK] python38._pth already site-enabled.
        )
    )
)

rem --- step 1c: py38 requirements-win.txt (Computer Use) -------
rem Installer ships Pillow>=11 requirements that pip can never
rem satisfy on Python 3.8. Deploy the py38-compatible pin list so
rem setup + pythonBridge read the same content (sha256 stamp match).
if exist "%SELFDIR%requirements-win.txt" (
    copy /y "%SELFDIR%requirements-win.txt" "%INST%\resources\runtime\requirements-win.txt" >nul 2>nul
    if exist "%INST%\resources\runtime\requirements-win.txt" (
        echo [OK] py38 requirements-win.txt deployed.
    ) else (
        echo [WARN] requirements-win.txt copy failed - embedded defaults still used.
    )
)

rem --- step 2: remove broken sidecar --------------------------
echo [2/4] Removing compiled sidecar ^(forces node.exe fallback^) ...
if exist "%SIDECAR%" del /f /q "%SIDECAR%" >nul 2>&1
if exist "%SIDECAR%" (
    echo [FAIL] could not delete %SIDECAR%
    exit /b 1
)
echo [OK] sidecar removed.

rem --- step 3: firewall rule for node.exe ---------------------
echo [3/4] Adding firewall rule for node.exe ...
netsh advfirewall firewall delete rule name="cchaha-node" >nul 2>&1
netsh advfirewall firewall add rule name="cchaha-node" dir=in action=allow program="%NODE%" enable=yes profile=any >nul 2>&1
echo [OK] firewall rule set.

rem --- step 4: verify -----------------------------------------
echo [4/4] Verifying ...
if not exist "%NODE%" (
    echo [FAIL] node.exe missing: %NODE%
    exit /b 1
)
"%NODE%" --version
if errorlevel 1 (
    echo [FAIL] node.exe failed to start.
    echo        Check that VxKex is installed and reg-vxkex.bat was run.
    exit /b 1
)
echo [OK] node.exe runs.

echo.
echo Fix complete. Start cc-haha from the desktop shortcut.
echo The GUI will now use node.exe + dist\server.mjs.
exit /b 0
