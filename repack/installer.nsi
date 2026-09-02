Unicode true
ManifestDPIAware true
SetCompressor /SOLID lzma

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "x64.nsh"

!define PRODUCT_NAME "Claude Code Haha"
!define PRODUCT_VERSION "0.5.4"
!define UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\ClaudeCodeHaha"

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "Claude-Code-Haha-0.5.4-win7-x64-setup.exe"
InstallDir "C:\cc-haha"
InstallDirRegKey HKLM "${UNINST_KEY}" "InstallLocation"
RequestExecutionLevel admin
ShowInstDetails show
ShowUninstDetails show

!define MUI_ICON "app-icon.ico"
!define MUI_UNICON "app-icon.ico"
!define MUI_WELCOMEFINISHPAGE_BITMAP "modern-wizard.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "modern-wizard.bmp"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\Claude Code Haha.exe"
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
LangString MsgDetailRegNode ${LANG_SIMPCHINESE} "正在向 VxKex 注册 node.exe（WINVERSPOOF:NONE）..."
LangString MsgDetailRegNode ${LANG_ENGLISH} "Registering node.exe with VxKex (WINVERSPOOF:NONE)..."
LangString MsgDetailRegPython ${LANG_SIMPCHINESE} "正在向 VxKex 注册 python.exe（UCRT shim）..."
LangString MsgDetailRegPython ${LANG_ENGLISH} "Registering python.exe with VxKex (UCRT shim)..."
LangString MsgDetailRegRg ${LANG_SIMPCHINESE} "正在向 VxKex 注册 rg.exe（WaitOnAddress Win8+ API shim）..."
LangString MsgDetailRegRg ${LANG_ENGLISH} "Registering rg.exe with VxKex (WaitOnAddress Win8+ API shim)..."
LangString MsgDetailVerifyNode ${LANG_SIMPCHINESE} "正在验证 node.exe 可运行..."
LangString MsgDetailVerifyNode ${LANG_ENGLISH} "Verifying node.exe runs..."

LangString MsgVxKexNotFound ${LANG_SIMPCHINESE} "未检测到 VxKex 兼容层（Node.js 22 在 Win7 上运行必需）。$\n$\n是否现在运行内嵌的 VxKex 安装程序？（离线，无需网络）"
LangString MsgVxKexNotFound ${LANG_ENGLISH} "VxKex compatibility layer not found (required for Node.js 22 on Win7).$\n$\nRun the bundled offline VxKex setup now?"
LangString MsgVxKexInstallFailed ${LANG_SIMPCHINESE} "VxKex 仍未安装（KexCfg.exe 未找到）。$\ncc-haha 将无法启动后端服务。$\n请稍后以管理员身份手动运行：$\n$INSTDIR\resources\runtime\vxkex-1.2.1.2229\KexSetup_Release_1_2_1_2229.exe /SILENTUNATTEND$\n然后运行 resources\runtime\setup-vxkex.bat 完成注册。"
LangString MsgVxKexInstallFailed ${LANG_ENGLISH} "VxKex is still not installed (KexCfg.exe not found).$\ncc-haha will not be able to start its backend service.$\nPlease run it manually later as administrator:$\n$INSTDIR\resources\runtime\vxkex-1.2.1.2229\KexSetup_Release_1_2_1_2229.exe /SILENTUNATTEND$\nthen run resources\runtime\setup-vxkex.bat to complete registration."
LangString MsgNodeRunFailed ${LANG_SIMPCHINESE} "node.exe 未能运行（exit=$R1）。$\n请以管理员身份重新运行 resources\runtime\setup-vxkex.bat。"
LangString MsgNodeRunFailed ${LANG_ENGLISH} "node.exe failed to run (exit=$R1).$\nPlease re-run resources\runtime\setup-vxkex.bat as an administrator."

Section "install" SecInstall
  SetOutPath "$INSTDIR"

  DetailPrint "$(MsgDetailStop)"
  nsExec::ExecToLog 'taskkill /f /im "Claude Code Haha.exe"'
  Sleep 1500
  nsExec::ExecToLog 'taskkill /f /im node.exe'
  Sleep 500

  DetailPrint "$(MsgDetailFiles)"
  File /r "app\*"

  CreateDirectory "$SMPROGRAMS\Claude Code Haha"
  CreateShortCut "$SMPROGRAMS\Claude Code Haha\Claude Code Haha.lnk" "$INSTDIR\Claude Code Haha.exe"
  CreateShortCut "$SMPROGRAMS\Claude Code Haha\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortCut "$DESKTOP\Claude Code Haha.lnk" "$INSTDIR\Claude Code Haha.exe"

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

  DetailPrint "$(MsgDetailFirewall)"
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="cc-haha node"'
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="cc-haha node" dir=in action=allow program="$INSTDIR\resources\runtime\node-v22.17.0\node.exe" enable=yes'

  StrCpy $R0 ""
  SetRegView 64
  ReadRegStr $R1 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\VxKex" "InstallLocation"
  SetRegView 32
  ${If} $R1 == ""
    ReadRegStr $R1 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\VxKex" "InstallLocation"
  ${EndIf}
  ${If} $R1 != ""
    IfFileExists "$R1\KexCfg.exe" 0 kex_paths
      StrCpy $R0 "$R1\KexCfg.exe"
      Goto kex_have
  ${EndIf}
kex_paths:
  ${DisableX64FSRedirection}
  IfFileExists "C:\Program Files\VxKex\KexCfg.exe" 0 +3
    StrCpy $R0 "C:\Program Files\VxKex\KexCfg.exe"
    Goto kex_have
  ${EnableX64FSRedirection}
  IfFileExists "C:\Program Files\VxKex\KexCfg.exe" 0 +3
    StrCpy $R0 "C:\Program Files\VxKex\KexCfg.exe"
    Goto kex_have
  IfFileExists "C:\Program Files (x86)\VxKex\KexCfg.exe" 0 +3
    StrCpy $R0 "C:\Program Files (x86)\VxKex\KexCfg.exe"
    Goto kex_have

  MessageBox MB_YESNO|MB_ICONQUESTION "$(MsgVxKexNotFound)" /SD IDYES IDYES kex_install IDNO kex_end

kex_install:
  DetailPrint "$(MsgDetailVxkexSetup)"
  ExecWait 'cmd /c echo. | "$INSTDIR\resources\runtime\vxkex-1.2.1.2229\KexSetup_Release_1_2_1_2229.exe" /SILENTUNATTEND' $R1
  ${DisableX64FSRedirection}
  IfFileExists "C:\Program Files\VxKex\KexCfg.exe" 0 +3
    StrCpy $R0 "C:\Program Files\VxKex\KexCfg.exe"
    Goto kex_have
  ${EnableX64FSRedirection}
  IfFileExists "C:\Program Files\VxKex\KexCfg.exe" 0 +3
    StrCpy $R0 "C:\Program Files\VxKex\KexCfg.exe"
    Goto kex_have
  IfFileExists "C:\Program Files (x86)\VxKex\KexCfg.exe" 0 +3
    StrCpy $R0 "C:\Program Files (x86)\VxKex\KexCfg.exe"
    Goto kex_have
  MessageBox MB_ICONEXCLAMATION "$(MsgVxKexInstallFailed)" /SD IDOK
  Goto kex_end

kex_have:
  DetailPrint "$(MsgDetailRegNode)"
  ExecWait '"$R0" /EXE:"$INSTDIR\resources\runtime\node-v22.17.0\node.exe" /ENABLE:YES /WINVERSPOOF:NONE /DISABLEFORCHILD:NO'
  DetailPrint "$(MsgDetailRegPython)"
  ExecWait '"$R0" /EXE:"$INSTDIR\resources\runtime\python-3.8.10\python.exe" /ENABLE:YES /WINVERSPOOF:NONE /DISABLEFORCHILD:NO'
  DetailPrint "$(MsgDetailRegRg)"
  ExecWait '"$R0" /EXE:"$INSTDIR\resources\app.asar.unpacked\src-tauri\binaries\rg.exe" /ENABLE:YES /WINVERSPOOF:NONE /DISABLEFORCHILD:NO'
  DetailPrint "$(MsgDetailVerifyNode)"
  nsExec::ExecToLog '"$INSTDIR\resources\runtime\node-v22.17.0\node.exe" --version'
  Pop $R1
  ${If} $R1 != 0
    MessageBox MB_ICONEXCLAMATION "$(MsgNodeRunFailed)" /SD IDOK
  ${EndIf}

kex_end:
SectionEnd

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
