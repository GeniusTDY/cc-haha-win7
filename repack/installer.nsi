Unicode true
ManifestDPIAware true
SetCompressor /SOLID lzma

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "x64.nsh"

!define PRODUCT_NAME "Claude Code Haha"
!define PRODUCT_VERSION "0.5.4"
!define UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\ClaudeCodeHaha"
!define VXKEX_VERSION "1.2.1.2229"

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "Claude-Code-Haha-0.5.4-win7-x64-setup.exe"
InstallDir "C:\cc-haha"
InstallDirRegKey HKLM "${UNINST_KEY}" "InstallLocation"
RequestExecutionLevel admin
ShowInstDetails show
ShowUninstDetails show

Var HealthOK

!define MUI_ICON "app-icon.ico"
!define MUI_UNICON "app-icon.ico"
!define MUI_WELCOMEFINISHPAGE_BITMAP "modern-wizard.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "modern-wizard.bmp"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_FUNCTION "RunApp"
!define MUI_FINISHPAGE_RUN_TEXT "$(FinishRunText)"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"

LangString FinishRunText ${LANG_SIMPCHINESE} "运行 Claude Code Haha"
LangString FinishRunText ${LANG_ENGLISH} "Run Claude Code Haha"

LangString MsgDetailStop ${LANG_SIMPCHINESE} "正在停止运行中的实例..."
LangString MsgDetailStop ${LANG_ENGLISH} "Stopping running instances..."
LangString MsgDetailFiles ${LANG_SIMPCHINESE} "正在安装应用文件（离线，约 730 MB）..."
LangString MsgDetailFiles ${LANG_ENGLISH} "Installing application files (offline, ~730 MB)..."
LangString MsgDetailFirewall ${LANG_SIMPCHINESE} "正在为内置 node.exe 添加防火墙规则..."
LangString MsgDetailFirewall ${LANG_ENGLISH} "Adding firewall rule for bundled node.exe..."
LangString MsgDetailVxkexSetup ${LANG_SIMPCHINESE} "正在静默安装 VxKex 兼容层（无需任何操作）..."
LangString MsgDetailVxkexSetup ${LANG_ENGLISH} "Installing bundled VxKex silently (no interaction needed)..."
LangString MsgDetailVxkexVerify ${LANG_SIMPCHINESE} "正在校验 VxKex 安装结果..."
LangString MsgDetailVxkexVerify ${LANG_ENGLISH} "Verifying the VxKex installation..."
LangString MsgDetailRegNode ${LANG_SIMPCHINESE} "正在向 VxKex 注册 node.exe（WINVERSPOOF:NONE）..."
LangString MsgDetailRegNode ${LANG_ENGLISH} "Registering node.exe with VxKex (WINVERSPOOF:NONE)..."
LangString MsgDetailRegPython ${LANG_SIMPCHINESE} "正在向 VxKex 注册 python.exe（UCRT shim）..."
LangString MsgDetailRegPython ${LANG_ENGLISH} "Registering python.exe with VxKex (UCRT shim)..."
LangString MsgDetailRegRg ${LANG_SIMPCHINESE} "正在向 VxKex 注册 rg.exe（WaitOnAddress Win8+ API shim）..."
LangString MsgDetailRegRg ${LANG_ENGLISH} "Registering rg.exe with VxKex (WaitOnAddress Win8+ API shim)..."
LangString MsgDetailVerifyNode ${LANG_SIMPCHINESE} "正在验证 node.exe 可运行..."
LangString MsgDetailVerifyNode ${LANG_ENGLISH} "Verifying node.exe runs..."
LangString MsgDetailSelfHeal ${LANG_SIMPCHINESE} "首次验证未通过，正在自动重跑 VxKex 注册（setup-vxkex.bat）..."
LangString MsgDetailSelfHeal ${LANG_ENGLISH} "First check failed; re-running VxKex registration (setup-vxkex.bat)..."

LangString MsgVxKexNotFound ${LANG_SIMPCHINESE} "未检测到 VxKex 兼容层（Node.js 22 在 Win7 上运行必需）。$\n$\n是否现在运行内嵌的 VxKex 安装程序？（离线，无需网络）"
LangString MsgVxKexNotFound ${LANG_ENGLISH} "VxKex compatibility layer not found (required for Node.js 22 on Win7).$\n$\nRun the bundled offline VxKex setup now?"
LangString MsgVxKexInstallFailed ${LANG_SIMPCHINESE} "VxKex 安装未生效（KexCfg.exe 未出现，已重试 30 秒）。$\ncc-haha 的后端服务将无法启动，因此已跳过运行时注册与“运行 cc-haha”。$\n$\n请以管理员身份手动执行：$\n$INSTDIR\resources\runtime\vxkex-${VXKEX_VERSION}\KexSetup_Release_1_2_1_2229.exe /SILENTUNATTEND$\n然后运行 resources\runtime\setup-vxkex.bat。"
LangString MsgVxKexInstallFailed ${LANG_ENGLISH} "VxKex did not install (KexCfg.exe never appeared after a 30 s retry).$\nThe cc-haha backend cannot start, so runtime registration and 'Run cc-haha' were skipped.$\n$\nAs administrator please run:$\n$INSTDIR\resources\runtime\vxkex-${VXKEX_VERSION}\KexSetup_Release_1_2_1_2229.exe /SILENTUNATTEND$\nthen run resources\runtime\setup-vxkex.bat."
LangString MsgBackendNotReady ${LANG_SIMPCHINESE} "内置 node.exe 仍无法运行，cc-haha 后端无法启动。$\n为避免启动一个不可用的应用，已跳过“运行 cc-haha”。$\n$\n请以管理员身份运行以下脚本后手动启动 cc-haha：$\n$INSTDIR\resources\runtime\setup-vxkex.bat"
LangString MsgBackendNotReady ${LANG_ENGLISH} "The bundled node.exe still cannot run, so the cc-haha backend will not start.$\n'Run cc-haha' was skipped to avoid launching an unusable app.$\n$\nPlease run this script as administrator, then start cc-haha manually:$\n$INSTDIR\resources\runtime\setup-vxkex.bat"

Section "install" SecInstall
  SetOutPath "$INSTDIR"

  DetailPrint "$(MsgDetailStop)"
  nsExec::ExecToLog 'taskkill /f /im "Claude Code Haha.exe"'
  Sleep 1500
  nsExec::ExecToLog 'taskkill /f /im node.exe'
  Sleep 500

  DetailPrint "$(MsgDetailFiles)"
  File /r "app\*"

  DetailPrint "$(MsgDetailFirewall)"
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="cc-haha node"'
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="cc-haha node" dir=in action=allow program="$INSTDIR\resources\runtime\node-v22.17.0\node.exe" enable=yes'

  StrCpy $HealthOK "0"

  StrCpy $R0 ""
  SetRegView 64
  ReadRegStr $R1 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\VxKex" "InstallLocation"
  SetRegView 32
  ${If} $R1 == ""
    ReadRegStr $R1 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\VxKex" "InstallLocation"
  ${EndIf}
  ${If} $R1 != ""
    StrCpy $R0 "$R1\KexCfg.exe"
    IfFileExists "$R0" kex_located 0
    StrCpy $R0 ""
  ${EndIf}

kex_locate:
  ${DisableX64FSRedirection}
  IfFileExists "C:\Program Files\VxKex\KexCfg.exe" 0 kex_locate_wow
    StrCpy $R0 "C:\Program Files\VxKex\KexCfg.exe"
    Goto kex_locate_done
kex_locate_wow:
  IfFileExists "C:\Program Files (x86)\VxKex\KexCfg.exe" 0 kex_locate_done
    StrCpy $R0 "C:\Program Files (x86)\VxKex\KexCfg.exe"
kex_locate_done:
  ${EnableX64FSRedirection}

  ${If} $R0 != ""
    Goto kex_located
  ${EndIf}

  MessageBox MB_YESNO|MB_ICONQUESTION "$(MsgVxKexNotFound)" /SD IDYES IDYES kex_install IDNO kex_end

kex_install:
  DetailPrint "$(MsgDetailVxkexSetup)"
  ExecWait 'cmd /c echo. | "$INSTDIR\resources\runtime\vxkex-${VXKEX_VERSION}\KexSetup_Release_1_2_1_2229.exe" /SILENTUNATTEND' $R1
  DetailPrint "$(MsgDetailVxkexVerify)"
  StrCpy $R2 "0"
kex_poll:
  IntOp $R2 $R2 + 1
  Sleep 1000
  ${DisableX64FSRedirection}
  IfFileExists "C:\Program Files\VxKex\KexCfg.exe" 0 kex_poll_wow
    StrCpy $R0 "C:\Program Files\VxKex\KexCfg.exe"
kex_poll_wow:
  ${EnableX64FSRedirection}
  ${If} $R0 == ""
    ${DisableX64FSRedirection}
    IfFileExists "C:\Program Files (x86)\VxKex\KexCfg.exe" 0 kex_poll_done
      StrCpy $R0 "C:\Program Files (x86)\VxKex\KexCfg.exe"
kex_poll_done:
    ${EnableX64FSRedirection}
  ${EndIf}
  ${If} $R0 == ""
    ${If} $R2 < 30
      Goto kex_poll
    ${EndIf}
  ${EndIf}

  ${If} $R0 == ""
    MessageBox MB_ICONEXCLAMATION "$(MsgVxKexInstallFailed)" /SD IDOK
    Goto kex_end
  ${EndIf}

kex_located:
  DetailPrint "$(MsgDetailRegNode)"
  ExecWait '"$R0" /EXE:"$INSTDIR\resources\runtime\node-v22.17.0\node.exe" /ENABLE:YES /WINVERSPOOF:NONE /DISABLEFORCHILD:NO'
  DetailPrint "$(MsgDetailRegPython)"
  ExecWait '"$R0" /EXE:"$INSTDIR\resources\runtime\python-3.8.10\python.exe" /ENABLE:YES /WINVERSPOOF:NONE /DISABLEFORCHILD:NO'
  DetailPrint "$(MsgDetailRegRg)"
  ExecWait '"$R0" /EXE:"$INSTDIR\resources\app.asar.unpacked\src-tauri\binaries\rg.exe" /ENABLE:YES /WINVERSPOOF:NONE /DISABLEFORCHILD:NO'

  DetailPrint "$(MsgDetailVerifyNode)"
  nsExec::ExecToLog '"$INSTDIR\resources\runtime\node-v22.17.0\node.exe" --version'
  Pop $R3
  ${If} $R3 != 0
    DetailPrint "$(MsgDetailSelfHeal)"
    nsExec::ExecToLog 'cmd /c ""$INSTDIR\resources\runtime\setup-vxkex.bat""'
    Pop $R3
    nsExec::ExecToLog '"$INSTDIR\resources\runtime\node-v22.17.0\node.exe" --version'
    Pop $R3
  ${EndIf}
  ${If} $R3 != 0
    MessageBox MB_ICONEXCLAMATION "$(MsgBackendNotReady)" /SD IDOK
    Goto kex_end
  ${EndIf}
  StrCpy $HealthOK "1"

kex_end:

  WriteUninstaller "$INSTDIR\Uninstall.exe"
  SetRegView 64
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegStr HKLM "${UNINST_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKLM "${UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION} Win7-offline"
  WriteRegStr HKLM "${UNINST_KEY}" "DisplayIcon" "$INSTDIR\Claude Code Haha.exe"
  WriteRegStr HKLM "${UNINST_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "${UNINST_KEY}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegDWORD HKLM "${UNINST_KEY}" "EstimatedSize" $0
  WriteRegStr HKLM "${UNINST_KEY}" "NoModify" "1"
  WriteRegStr HKLM "${UNINST_KEY}" "NoRepair" "1"
  SetRegView 32
  DeleteRegKey HKLM "${UNINST_KEY}"
  SetRegView 64

  CreateDirectory "$SMPROGRAMS\Claude Code Haha"
  CreateShortCut "$SMPROGRAMS\Claude Code Haha\Claude Code Haha.lnk" "$INSTDIR\Claude Code Haha.exe"
  CreateShortCut "$SMPROGRAMS\Claude Code Haha\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortCut "$DESKTOP\Claude Code Haha.lnk" "$INSTDIR\Claude Code Haha.exe"
SectionEnd

Function RunApp
  ${If} $HealthOK == "1"
    Exec '"$INSTDIR\Claude Code Haha.exe"'
  ${Else}
    MessageBox MB_ICONEXCLAMATION "$(MsgBackendNotReady)"
  ${EndIf}
FunctionEnd

Section "Uninstall"
  SetRegView 64
  nsExec::ExecToLog 'taskkill /f /im "Claude Code Haha.exe"'
  Sleep 1500
  nsExec::ExecToLog 'taskkill /f /im node.exe'
  Sleep 500

  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="cc-haha node"'

  Delete "$DESKTOP\Claude Code Haha.lnk"
  RMDir /r "$SMPROGRAMS\Claude Code Haha"

  RMDir /r "$INSTDIR"
  DeleteRegKey HKLM "${UNINST_KEY}"
SectionEnd
