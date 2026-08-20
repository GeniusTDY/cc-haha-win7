#!/usr/bin/env python3
# Patch the node-port server bundle (dist/server.mjs) for Win7 Computer Use
# offline support. Every replacement asserts exactly-once match; aborts with
# no changes on failure.
#
# Identifier-adaptive: esbuild renames top-level import aliases per build
# (join187 -> join183, __dirname2 -> __dirname3, ...) because its renamer
# numbers colliding symbols by frequency histogram. All esbuild-generated
# aliases used below are therefore auto-detected from the bundle instead of
# hard-coded, so this script survives rebuilds of dist/server.mjs.
#
# Usage: python3 patch-computer-use.py [path/to/server.mjs]
import re
import shutil
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else "server.mjs"
BAK = PATH + ".pre-cu.bak"

src = open(PATH, encoding="utf-8").read()

if "getBundledPythonDirsWin" in src:
    print("[SKIP] server.mjs already patched (getBundledPythonDirsWin present)")
    sys.exit(0)

shutil.copyfile(PATH, BAK)

# --------------------------------------------------------------------------
# Auto-detect esbuild-generated identifiers (import aliases + renamed locals)
# --------------------------------------------------------------------------
detect_fail = []


def module_prologue(marker):
    """Return the import block that follows a module comment marker."""
    m = re.search(
        re.escape(marker) + r"\n(?:init_define_MACRO\(\);\n)?((?:import [^\n]+\n)+)",
        src,
    )
    return m.group(1) if m else ""


# --- src/server/api/computer-use.ts prologue (CU api module) --------------
cu_pro = module_prologue("// src/server/api/computer-use.ts")
cu_join = re.search(r"\bjoin as (\w+)\b", cu_pro)
cu_readfile = re.search(r"\breadFile as (\w+)\b", cu_pro)
cu_writefile = re.search(r"\bwriteFile as (\w+)\b", cu_pro)
cu_path = re.search(r"import (\w+) from \"(?:node:)?path\";", cu_pro)
cu_futp = re.search(r"\bfileURLToPath as (\w+)\b", cu_pro)
if not (cu_join and cu_readfile and cu_writefile and cu_path and cu_futp):
    detect_fail.append("computer-use.ts prologue aliases")
    print(f"[FAIL] computer-use.ts prologue incomplete: {cu_pro!r}")

# --- src/utils/computerUse/pythonBridge.ts prologue -----------------------
pb_pro = module_prologue("// src/utils/computerUse/pythonBridge.ts")
pb_path = re.search(r"import (\w+) from \"(?:node:)?path\";", pb_pro)
pb_readfile = re.search(r"\breadFile as (\w+)\b", pb_pro)
pb_writefile = re.search(r"\bwriteFile as (\w+)\b", pb_pro)
if not (pb_path and pb_readfile and pb_writefile):
    detect_fail.append("pythonBridge.ts prologue aliases")
    print(f"[FAIL] pythonBridge.ts prologue incomplete: {pb_pro!r}")

# --- context-bound identifiers --------------------------------------------
m = re.search(r"async function detectPythonRuntime\((\w+), (\w+), (\w+), (\w+)\) \{", src)
if m:
    cu_platform, cu_runcmd = m.group(1), m.group(2)
    print(f"[detect] detectPythonRuntime({cu_platform}, {cu_runcmd}, ...)")
else:
    cu_platform = cu_runcmd = None
    detect_fail.append("detectPythonRuntime signature")

# identifiers as used inside the patch contexts below
SUB = {}
for old, detected, label in [
    ("join187", cu_join and cu_join.group(1), "join (computer-use.ts)"),
    ("readFile85", cu_readfile and cu_readfile.group(1), "readFile (computer-use.ts)"),
    ("writeFile64", cu_writefile and cu_writefile.group(1), "writeFile (computer-use.ts)"),
    ("path59", cu_path and cu_path.group(1), "path default (computer-use.ts)"),
    ("fileURLToPath9", cu_futp and cu_futp.group(1), "fileURLToPath (computer-use.ts)"),
    ("path17", pb_path and pb_path.group(1), "path default (pythonBridge.ts)"),
    ("readFile28", pb_readfile and pb_readfile.group(1), "readFile (pythonBridge.ts)"),
    ("writeFile24", pb_writefile and pb_writefile.group(1), "writeFile (pythonBridge.ts)"),
    ("platform5", cu_platform, "detectPythonRuntime platform param"),
    ("runCommand2", cu_runcmd, "detectPythonRuntime runCommand param"),
]:
    if detected is None:
        detect_fail.append(label)
        print(f"[FAIL] could not detect identifier for {old} ({label})")
    else:
        SUB[old] = detected
        print(f"[detect] {old} -> {detected}  ({label})")

# pathExists aliases differ per module (pathExists3 = CU api, pathExists2 = pythonBridge)
m = re.search(r"let venvExists = await (\w+)\(venvPython\);", src)
if m:
    SUB["pathExists3"] = m.group(1)
    print(f"[detect] pathExists (CU api) = {m.group(1)}")
else:
    detect_fail.append("pathExists3")
m = re.search(r"if \(await (\w+)\(devRequirements\)\) \{", src)
if m:
    SUB["pathExists2"] = m.group(1)
    print(f"[detect] pathExists (pythonBridge) = {m.group(1)}")
else:
    detect_fail.append("pathExists2")

# pythonBridge module-level var list (__dirname2 drifted to __dirname3 etc.)
m = re.search(r"var (__dirname\d+), projectRoot, runtimeStateRoot", src)
if m:
    SUB["__dirname2"] = m.group(1)
    print(f"[detect] pythonBridge __dirname var = {m.group(1)}")
else:
    detect_fail.append("pythonBridge __dirname var")

# installSetupDependencies default install fn alias
m = re.search(r"installSetupDependencies\(\w+, \w+, install = (\w+)\) \{", src)
if m:
    SUB["runPipInstallWithFallback2"] = m.group(1)
    print(f"[detect] runPipInstallWithFallback alias = {m.group(1)}")
else:
    detect_fail.append("runPipInstallWithFallback2")

if detect_fail:
    print(f"\ndetection failed for: {detect_fail} - aborting, no changes written")
    sys.exit(2)

# identifiers that are semantic source names (stable across builds); verify
# they exist so a failure is loud instead of a silent no-op
for stable in ["venvRoot", "venvRoot2", "installStampPath", "installStampPath2",
               "config4", "helperPath2", "reqPath", "projectRoot", "pythonRuntime",
               "baseInterpreterMarkerPath", "effectiveVenvCreated", "helperFileName",
               "getVenvCreationPythonCommand", "venvBaseInterpreterMatches",
               "runPipInstallWithFallback", "execFileNoThrow", "runOrThrow",
               "logForDebugging", "requirements-win.txt"]:
    if stable not in src:
        print(f"[FAIL] stable identifier missing from bundle: {stable}")
        sys.exit(2)

word_sub = re.compile(r"\b(" + "|".join(sorted(SUB, key=len, reverse=True)) + r")\b")


def adapt(s):
    return word_sub.sub(lambda mm: SUB[mm.group(1)], s)


n_fail = 0


def rep(old, new, label):
    global src, n_fail
    old = adapt(old)
    new = adapt(new)
    cnt = src.count(old)
    if cnt != 1:
        print(f"[FAIL] {label}: matched {cnt} times (expected 1)")
        n_fail += 1
        return
    src = src.replace(old, new)
    print(f"[OK] {label}")


# ---------------------------------------------------------------- P1: min python 3.9 -> 3.8
rep("""var MIN_PYTHON_MAJOR = 3;
var MIN_PYTHON_MINOR = 9;""",
    """var MIN_PYTHON_MAJOR = 3;
var MIN_PYTHON_MINOR = 8;""", "P1 MIN_PYTHON_MINOR 9->8")

# ---------------------------------------------------------------- P2: bundled python helpers + detection
rep("""async function detectPythonRuntime(platform5, runCommand2, venvPythonPath, customPythonPath) {""",
    """function getBundledPythonCandidatesWin() {
  try {
    if (process.platform !== "win32") return [];
    const selfDir = path59.dirname(fileURLToPath9(import.meta.url));
    return [
      path59.resolve(selfDir, "..", "runtime", "python-3.8.10", "python.exe"),
      path59.resolve(selfDir, "..", "..", "runtime", "python-3.8.10", "python.exe")
    ];
  } catch {
    return [];
  }
}
async function getBundledGetPipPath() {
  for (const py of getBundledPythonCandidatesWin()) {
    const getPip = path59.join(path59.dirname(py), "get-pip.py");
    if (await pathExists3(getPip)) return getPip;
  }
  return null;
}
async function getBundledWheelsDir() {
  for (const py of getBundledPythonCandidatesWin()) {
    const wheels = path59.join(path59.dirname(py), "wheels");
    if (await pathExists3(wheels)) return wheels;
  }
  return null;
}
async function detectPythonRuntime(platform5, runCommand2, venvPythonPath, customPythonPath) {""", "P2a bundled helpers inserted")

rep("""  for (const candidate of getPythonCandidates(platform5)) {
    const versionResult = await runCommand2(candidate.command, [...candidate.prefixArgs, "--version"]);""",
    """  for (const bundledPath of getBundledPythonCandidatesWin()) {
    const bundledResult = await runCommand2(bundledPath, ["--version"]);
    if (!bundledResult.ok) continue;
    return {
      installed: true,
      version: extractPythonVersion(`${bundledResult.stdout}
${bundledResult.stderr}`),
      path: bundledPath,
      command: bundledPath,
      prefixArgs: [],
      source: "bundled",
      error: null
    };
  }
  for (const candidate of getPythonCandidates(platform5)) {
    const versionResult = await runCommand2(candidate.command, [...candidate.prefixArgs, "--version"]);""", "P2b bundled detection in detectPythonRuntime")

# ---------------------------------------------------------------- P3: runSetup effective python var
rep("""  const venvPython = isWindows3 ? join187(venvRoot2, "Scripts", "python.exe") : join187(venvRoot2, "bin", "python3");
  let venvExists = await pathExists3(venvPython);""",
    """  const venvPython = isWindows3 ? join187(venvRoot2, "Scripts", "python.exe") : join187(venvRoot2, "bin", "python3");
  let effectivePythonCmd = venvPython;
  let venvExists = await pathExists3(venvPython);""", "P3 effectivePythonCmd declared")

# ---------------------------------------------------------------- P3b: venv failure -> bundled fallback
rep("""    if (!venvResult.ok) {
      steps.push({
        name: "venv",
        ok: false,
        message: `\\u521B\\u5EFA\\u865A\\u62DF\\u73AF\\u5883\\u5931\\u8D25: ${venvResult.stderr}`
      });
      return { success: false, steps };
    }
    try {
      await writeFile64(baseInterpreterMarkerPath, config4.pythonPath ?? "", "utf8");
    } catch (err2) {
      steps.push({
        name: "venv",
        ok: false,
        message: `\\u5199\\u5165\\u865A\\u62DF\\u73AF\\u5883\\u6807\\u8BB0\\u6587\\u4EF6\\u5931\\u8D25: ${err2}`
      });
      return { success: false, steps };
    }
    steps.push({ name: "venv", ok: true, message: "\\u865A\\u62DF\\u73AF\\u5883\\u5DF2\\u521B\\u5EFA" });""",
    """    if (!venvResult.ok) {
      const bundledCandidateMatch = getBundledPythonCandidatesWin().some((candidate) => {
        try {
          return path59.resolve(String(pythonRuntime.path ?? "")).toLowerCase() === path59.resolve(candidate).toLowerCase();
        } catch {
          return false;
        }
      });
      if (pythonRuntime.source === "bundled" || bundledCandidateMatch) {
        effectivePythonCmd = pythonRuntime.command;
        try {
          await writeFile64(baseInterpreterMarkerPath, config4.pythonPath ?? "", "utf8");
        } catch {
        }
        steps.push({
          name: "venv",
          ok: true,
          message: `\\u5D4C\\u5165\\u5F0F Python \\u65E0 venv \\u6A21\\u5757\\uFF0C\\u76F4\\u63A5\\u4F7F\\u7528\\u5185\\u7F6E\\u89E3\\u91CA\\u5668: ${venvResult.stderr.slice(0, 120)}`
        });
      } else {
        steps.push({
          name: "venv",
          ok: false,
          message: `\\u521B\\u5EFA\\u865A\\u62DF\\u73AF\\u5883\\u5931\\u8D25: ${venvResult.stderr}`
        });
        return { success: false, steps };
      }
    } else {
      try {
        await writeFile64(baseInterpreterMarkerPath, config4.pythonPath ?? "", "utf8");
      } catch (err2) {
        steps.push({
          name: "venv",
          ok: false,
          message: `\\u5199\\u5165\\u865A\\u62DF\\u73AF\\u5883\\u6807\\u8BB0\\u6587\\u4EF6\\u5931\\u8D25: ${err2}`
        });
        return { success: false, steps };
      }
      steps.push({ name: "venv", ok: true, message: "\\u865A\\u62DF\\u73AF\\u5883\\u5DF2\\u521B\\u5EFA" });
    }""", "P3b venv fallback to bundled")

# ---------------------------------------------------------------- P3c: pip block -> get-pip + offline build deps
rep("""  if (!await pathExists3(pipPath)) {
    const pipResult = await runCommand(venvPython, [
      "-m",
      "ensurepip",
      "--upgrade"
    ]);
    if (!pipResult.ok) {
      steps.push({
        name: "pip",
        ok: false,
        message: `\\u5B89\\u88C5 pip \\u5931\\u8D25: ${pipResult.stderr}`
      });
      return { success: false, steps };
    }
  }""",
    """  if (!await pathExists3(pipPath)) {
    const pipResult = await runCommand(effectivePythonCmd, [
      "-m",
      "ensurepip",
      "--upgrade"
    ]);
    if (!pipResult.ok) {
      const wheelsDirForPip = await getBundledWheelsDir();
      const pipWheelName = "pip-24.3.1-py3-none-any.whl";
      const pipWheel = wheelsDirForPip && await pathExists3(join187(wheelsDirForPip, pipWheelName)) ? join187(wheelsDirForPip, pipWheelName) : null;
      if (pipWheel) {
        const extract = await runCommand(effectivePythonCmd, [
          "-c",
          "import os,sys,sysconfig,zipfile; d=sysconfig.get_paths()['purelib']; os.makedirs(d,exist_ok=True); zipfile.ZipFile(sys.argv[1]).extractall(d); print('pip extracted to', d)",
          pipWheel
        ]);
        if (!extract.ok) {
          steps.push({
            name: "pip",
            ok: false,
            message: `pip wheel extract failed: ${extract.stderr.slice(0, 300)}`
          });
          return { success: false, steps };
        }
        const bootstrap = await runCommand(effectivePythonCmd, [
          "-m", "pip", "install", "--no-index", "--find-links", wheelsDirForPip,
          "setuptools", "wheel"
        ]);
        if (!bootstrap.ok) {
          steps.push({
            name: "pip",
            ok: false,
            message: `pip wheel bootstrap failed: ${bootstrap.stderr.slice(0, 300)}`
          });
          return { success: false, steps };
        }
      } else {
        const getPipScript = await getBundledGetPipPath();
        if (!getPipScript) {
          steps.push({
            name: "pip",
            ok: false,
            message: `\\u5B89\\u88C5 pip \\u5931\\u8D25: ${pipResult.stderr}`
          });
          return { success: false, steps };
        }
        const bootstrap = await runCommand(effectivePythonCmd, [getPipScript, "--no-warn-script-location"]);
        if (!bootstrap.ok) {
          steps.push({
            name: "pip",
            ok: false,
            message: `get-pip failed: ${bootstrap.stderr.slice(0, 300)}`
          });
          return { success: false, steps };
        }
      }
    }
    const wheelsDirForBuild = await getBundledWheelsDir();
    if (wheelsDirForBuild) {
      await runCommand(effectivePythonCmd, [
        "-m", "pip", "install", "--no-index", "--find-links", wheelsDirForBuild,
        "setuptools", "wheel"
      ]);
    }
  }""", "P3c pip bootstrap offline")

# ---------------------------------------------------------------- P3d: deps install with effective python
rep("""    const installResult = await installSetupDependencies(venvPython, reqPath);""",
    """    const installResult = await installSetupDependencies(effectivePythonCmd, reqPath);""", "P3d installSetupDependencies effective")

# ---------------------------------------------------------------- P3e: runSetup deps self-heal probe
rep("""  try {
    installedDigest = (await readFile85(installStampPath2, "utf8")).trim();
  } catch {
  }
  if (installedDigest !== digest) {
    const installResult = await installSetupDependencies(effectivePythonCmd, reqPath);""",
    """  try {
    installedDigest = (await readFile85(installStampPath2, "utf8")).trim();
  } catch {
  }
  let needsInstall = installedDigest !== digest;
  if (!needsInstall) {
    const depsProbe = await runCommand(effectivePythonCmd, ["-c", "import " + (isWindows3 ? "mss, pyautogui, PIL, psutil, pyperclip, screeninfo, win32api" : "mss, pyautogui, PIL, psutil, pyperclip, screeninfo")]);
    if (!depsProbe.ok) needsInstall = true;
  }
  if (needsInstall) {
    const installResult = await installSetupDependencies(effectivePythonCmd, reqPath);""", "P3e setup deps self-heal probe")

# ---------------------------------------------------------------- P4: installSetupDependencies offline wheels
rep("""async function installSetupDependencies(venvPython, reqPath, install = runPipInstallWithFallback2) {
  await install(venvPython, ["-m", "pip", "install", "--upgrade", "pip"]);
  return install(venvPython, ["-m", "pip", "install", "-r", reqPath]);
}""",
    """async function installSetupDependencies(pythonCmd, reqPath, install = runPipInstallWithFallback2) {
  const wheelsDir = await getBundledWheelsDir();
  if (wheelsDir) {
    return install(pythonCmd, [
      "-m", "pip", "install",
      "--no-index", "--no-build-isolation", "--find-links", wheelsDir,
      "-r", reqPath
    ]);
  }
  await install(pythonCmd, ["-m", "pip", "install", "--upgrade", "pip"]);
  return install(pythonCmd, ["-m", "pip", "install", "-r", reqPath]);
}""", "P4 installSetupDependencies offline")

# ---------------------------------------------------------------- P5: checkStatus base-interpreter mode
rep("""  let effectiveVenvCreated = venvCreated;
  if (venvCreated) {
    const matches = await venvBaseInterpreterMatches(config4.pythonPath);
    if (!matches) effectiveVenvCreated = false;
  }""",
    """  let effectiveVenvCreated = venvCreated;
  if (venvCreated) {
    const matches = await venvBaseInterpreterMatches(config4.pythonPath);
    if (!matches) effectiveVenvCreated = false;
  } else if (await pathExists3(baseInterpreterMarkerPath)) {
    effectiveVenvCreated = true;
  }""", "P5 checkStatus base mode")

# ---------------------------------------------------------------- P6: listInstalledApps fallback python
rep("""  const pythonBin = isWindows3 ? join187(venvRoot2, "Scripts", "python.exe") : join187(venvRoot2, "bin", "python3");
  if (!await pathExists3(pythonBin) || !await pathExists3(helperPath2)) {
    return [];
  }""",
    """  let pythonBin = isWindows3 ? join187(venvRoot2, "Scripts", "python.exe") : join187(venvRoot2, "bin", "python3");
  if (!await pathExists3(pythonBin)) {
    pythonBin = null;
    for (const cand of getBundledPythonCandidatesWin()) {
      if (await pathExists3(cand)) { pythonBin = cand; break; }
    }
  }
  if (!pythonBin || !await pathExists3(helperPath2)) {
    return [];
  }""", "P6 listInstalledApps fallback")

# ---------------------------------------------------------------- P7: pythonBridge — var list
rep("""var __dirname2, projectRoot, runtimeStateRoot, venvRoot, installStampPath, isWindows2, requirementsPath, helperFileName, helperPath, bootstrapPromise;""",
    """var __dirname2, projectRoot, runtimeStateRoot, venvRoot, installStampPath, isWindows2, requirementsPath, helperFileName, helperPath, bootstrapPromise, basePythonOverride;""", "P7a basePythonOverride var")

# ---------------------------------------------------------------- P7b: pythonBinPath + bundled dirs helper
rep("""function pythonBinPath() {
  return isWindows2 ? path17.join(venvRoot, "Scripts", "python.exe") : path17.join(venvRoot, "bin", "python3");
}""",
    """function pythonBinPath() {
  if (basePythonOverride) return basePythonOverride;
  return isWindows2 ? path17.join(venvRoot, "Scripts", "python.exe") : path17.join(venvRoot, "bin", "python3");
}
function getBundledPythonDirsWin() {
  try {
    if (process.platform !== "win32") return [];
    return [
      path17.resolve(__dirname2, "..", "runtime", "python"),
      path17.resolve(__dirname2, "..", "..", "runtime", "python"),
      path17.resolve(__dirname2, "..", "..", "..", "runtime", "python")
    ];
  } catch {
    return [];
  }
}""", "P7b pythonBinPath override + dirs helper")

# ---------------------------------------------------------------- P7c: ensureRuntimeFiles multi-root
rep("""  const devReqFile = isWindows2 ? "requirements-win.txt" : "requirements.txt";
  const devRequirements = path17.join(projectRoot, "runtime", devReqFile);
  const devHelper = path17.join(projectRoot, "runtime", helperFileName);
  if (await pathExists2(devRequirements)) {
    await writeFile24(requirementsPath, await readFile28(devRequirements, "utf8"), "utf8");
  }
  if (await pathExists2(devHelper)) {
    await writeFile24(helperPath, await readFile28(devHelper, "utf8"), "utf8");
  }""",
    """  const devReqFile = isWindows2 ? "requirements-win.txt" : "requirements.txt";
  const runtimeRoots = [
    path17.join(projectRoot, "runtime"),
    path17.resolve(__dirname2, "..", "..", "runtime")
  ];
  const devRequirements = runtimeRoots.map((root) => path17.join(root, devReqFile));
  const devHelper = runtimeRoots.map((root) => path17.join(root, helperFileName));
  for (const reqCandidate of devRequirements) {
    if (await pathExists2(reqCandidate)) {
      await writeFile24(requirementsPath, await readFile28(reqCandidate, "utf8"), "utf8");
      break;
    }
  }
  for (const helperCandidate of devHelper) {
    if (await pathExists2(helperCandidate)) {
      await writeFile24(helperPath, await readFile28(helperCandidate, "utf8"), "utf8");
      break;
    }
  }""", "P7c ensureRuntimeFiles multi-root")

# ---------------------------------------------------------------- P7d: ensureBootstrapped venv fallback
rep("""    if (!await pathExists2(pythonBinPath())) {
      logForDebugging("creating runtime venv at %s", { level: "debug" });
      const pythonCmd = await getVenvCreationPythonCommand();
      await runOrThrow(pythonCmd, ["-m", "venv", venvRoot], "python venv creation");
    }""",
    """    if (!await pathExists2(pythonBinPath())) {
      logForDebugging("creating runtime venv at %s", { level: "debug" });
      const pythonCmd = await getVenvCreationPythonCommand();
      try {
        await runOrThrow(pythonCmd, ["-m", "venv", venvRoot], "python venv creation");
      } catch (venvError) {
        let bundledExe = null;
        for (const dir of getBundledPythonDirsWin()) {
          const exe = path17.join(dir, "python.exe");
          if (await pathExists2(exe)) { bundledExe = exe; break; }
        }
        if (!bundledExe) throw venvError;
        basePythonOverride = bundledExe;
      }
    }""", "P7d ensureBootstrapped venv fallback")

# ---------------------------------------------------------------- P7e: ensureBootstrapped pip block
rep("""    const pipBin = isWindows2 ? path17.join(venvRoot, "Scripts", "pip.exe") : path17.join(venvRoot, "bin", "pip");
    if (!await pathExists2(pipBin)) {
      logForDebugging("bootstrapping pip with ensurepip", { level: "debug" });
      await runOrThrow(pythonBinPath(), ["-m", "ensurepip", "--upgrade"], "ensurepip");
    }""",
    """    const pipBin = isWindows2 ? path17.join(venvRoot, "Scripts", "pip.exe") : path17.join(venvRoot, "bin", "pip");
    if (!basePythonOverride && !await pathExists2(pipBin)) {
      logForDebugging("bootstrapping pip with ensurepip", { level: "debug" });
      await runOrThrow(pythonBinPath(), ["-m", "ensurepip", "--upgrade"], "ensurepip");
    }
    if (basePythonOverride) {
      const pipProbe = await execFileNoThrow(basePythonOverride, ["-m", "pip", "--version"], { useCwd: false });
      if (pipProbe.code !== 0) {
        let wheelsDirPip = null;
        for (const dir of getBundledPythonDirsWin()) {
          const cand = path17.join(dir, "wheels");
          if (await pathExists2(cand)) { wheelsDirPip = cand; break; }
        }
        const pipWheelPath = wheelsDirPip ? path17.join(wheelsDirPip, "pip-24.3.1-py3-none-any.whl") : null;
        if (pipWheelPath && await pathExists2(pipWheelPath)) {
          await runOrThrow(basePythonOverride, ["-c", "import os,sys,sysconfig,zipfile; d=sysconfig.get_paths()['purelib']; os.makedirs(d,exist_ok=True); zipfile.ZipFile(sys.argv[1]).extractall(d); print('pip extracted to', d)", pipWheelPath], "pip wheel extract");
          await runOrThrow(basePythonOverride, ["-m", "pip", "install", "--no-index", "--find-links", wheelsDirPip, "setuptools", "wheel"], "pip wheel bootstrap");
        } else {
          let getPipScript = null;
          for (const dir of getBundledPythonDirsWin()) {
            const cand = path17.join(dir, "get-pip.py");
            if (await pathExists2(cand)) { getPipScript = cand; break; }
          }
          if (getPipScript) {
            await runOrThrow(basePythonOverride, [getPipScript, "--no-warn-script-location"], "get-pip bootstrap");
          }
        }
      }
      let wheelsDir = null;
      for (const dir of getBundledPythonDirsWin()) {
        const cand = path17.join(dir, "wheels");
        if (await pathExists2(cand)) { wheelsDir = cand; break; }
      }
      if (wheelsDir) {
        await execFileNoThrow(basePythonOverride, [
          "-m", "pip", "install", "--no-index", "--find-links", wheelsDir,
          "setuptools", "wheel"
        ], { useCwd: false });
      }
    }""", "P7e ensureBootstrapped pip offline")

# ---------------------------------------------------------------- P7f: installRuntimeDependencies offline
rep("""async function installRuntimeDependencies(requirementsPath2, install = runPipInstallWithFallback) {
  await install(["-m", "pip", "install", "--upgrade", "pip"], "pip upgrade");
  await install(["-m", "pip", "install", "-r", requirementsPath2], "python dependency install");
}""",
    """async function installRuntimeDependencies(requirementsPath2, install = runPipInstallWithFallback) {
  let wheelsDir = null;
  for (const dir of getBundledPythonDirsWin()) {
    const cand = path17.join(dir, "wheels");
    if (await pathExists2(cand)) { wheelsDir = cand; break; }
  }
  if (wheelsDir) {
    await install([
      "-m", "pip", "install",
      "--no-index", "--no-build-isolation", "--find-links", wheelsDir,
      "-r", requirementsPath2
    ], "python dependency install (offline wheels)");
    return;
  }
  await install(["-m", "pip", "install", "--upgrade", "pip"], "pip upgrade");
  await install(["-m", "pip", "install", "-r", requirementsPath2], "python dependency install");
}""", "P7f installRuntimeDependencies offline")

# ---------------------------------------------------------------- P7g: runtime deps self-heal probe
rep("""    try {
      installedDigest = (await readFile28(installStampPath, "utf8")).trim();
    } catch {
    }
    if (installedDigest !== digest) {
      logForDebugging("installing python runtime dependencies", { level: "debug" });""",
    """    try {
      installedDigest = (await readFile28(installStampPath, "utf8")).trim();
    } catch {
    }
    let needsRuntimeInstall = installedDigest !== digest;
    if (!needsRuntimeInstall) {
      const runtimeDepsProbe = await execFileNoThrow(pythonBinPath(), ["-c", "import " + (isWindows2 ? "mss, pyautogui, PIL, psutil, pyperclip, screeninfo, win32api" : "mss, pyautogui, PIL, psutil, pyperclip, screeninfo")], { useCwd: false });
      if (runtimeDepsProbe.code !== 0) needsRuntimeInstall = true;
    }
    if (needsRuntimeInstall) {
      logForDebugging("installing python runtime dependencies", { level: "debug" });""", "P7g runtime deps self-heal probe")

# ---------------------------------------------------------------- P8: Pillow py38-compatible range (win)
rep("""Pillow>=11.3.0,<12\\npyautogui>=0.9.54\\npywin32>=306""",
    """Pillow>=10.0.0,<11\\npyautogui>=0.9.54\\npywin32>=306""", "P8 win requirements Pillow >=10,<11 (py38)")

if n_fail:
    print(f"\n{n_fail} patch(es) FAILED - restoring backup, no changes written")
    shutil.copyfile(BAK, PATH)
    sys.exit(1)

open(PATH, "w", encoding="utf-8", newline="").write(src)
print("\nAll patches applied. Syntax check next.")
