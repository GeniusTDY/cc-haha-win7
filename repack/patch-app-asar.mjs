#!/usr/bin/env node
/**
 * patch-app-asar.mjs — surgical app.asar patcher (Win7 port, Stage B).
 *
 * Replaces `electron-dist/main.cjs` inside an electron-builder app.asar and
 * applies two idempotent fixes to it in one pass, without a full
 * extract/repack roundtrip:
 *
 *   1. read the asar header (size pickle + header pickle)
 *   2. read the packed main.cjs bytes from the data section
 *   3. insert the `useConpty = false` forcing (exact-once anchor match)
 *      + re-stamp the node-runtime probe dirs to the versioned layout
 *      (`"runtime", "node"` -> `"runtime", "node-v22.17.0"`), so seeds
 *      built before the version-stamp refactor keep resolving node.exe
 *   4. append the patched bytes to the END of the data section and repoint
 *      the header entry (offset/size/integrity) — every other file keeps its
 *      original offset, so the rest of the archive stays byte-identical
 *      (the old main.cjs bytes simply become unreachable dead space)
 *   5. write the new archive atomically and re-verify by parsing it back
 *
 * `--set-version <ver>` additionally bumps the asar root package.json
 * `"version"` field in place (same byte length only — the replacement is
 * written at the file's original offset and only its integrity hash is
 * repointed, so no other entry moves). This is what makes a rebuilt
 * installer semver-greater than the installed one for electron-updater.
 *
 * Why surgical: the shipped main.cjs contains the Win7 node-runtime fallback
 * layer (NODE_RUNTIME_EXE_ENV / resolveNodeRuntimeExecutable / …) that is NOT
 * in the current desktop/electron sources, so a wholesale rebuild would lose
 * it. The bundled main.cjs already carries the pipe-fallback half of patch
 * 006; the only missing runtime change is forcing node-pty's winpty backend
 * on legacy Windows (ConPTY is Win10 1809+).
 *
 * Usage: node patch-app-asar.mjs <path/to/app.asar> [--verify-only]
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const { Pickle } = await import(
  path.join(HERE, 'asar-tool', 'node_modules', '@electron', 'asar', 'lib', 'pickle.js')
)

const BLOCK_SIZE = 4 * 1024 * 1024 // must match electron-builder's integrity blockSize

// ---------------------------------------------------------------------------
// The winpty patch applied to the compiled main.cjs (mirrors the runtime part
// of patches/desktop/003-terminal-winpty-fallback.patch).
// ---------------------------------------------------------------------------
const ANCHOR =
  '      };\n' +
  '      try {\n' +
  '        pty = ptyFactory.spawn(shell, [], ptySpawnOptions);\n' +
  '      } catch (error) {\n' +
  '        if (!isLegacyWindows(this.platform)) throw error;'

const INSERTION =
  '      };\n' +
  '      if (isLegacyWindows(this.platform)) {\n' +
  '        // ConPTY is a Win10 1809+ OS feature: force the winpty backend that\n' +
  '        // node-pty 1.1.0 still ships (prebuilds/win32-x64 winpty-agent.exe +\n' +
  '        // N-API pty.node) for full TTY emulation on Win7/8.\n' +
  '        ptySpawnOptions.useConpty = false;\n' +
  '      }\n' +
  '      try {\n' +
  '        pty = ptyFactory.spawn(shell, [], ptySpawnOptions);\n' +
  '      } catch (error) {\n' +
  '        if (!isLegacyWindows(this.platform)) throw error;'

// Node-runtime probe dirs were re-stamped with their versions during the
// version-stamp refactor; older asar seeds still probe `runtime/node`.
const NODE_DIR_OLD = '"runtime", "node", "node.exe"'
const NODE_DIR_NEW = '"runtime", "node-v22.17.0", "node.exe"'

function patchMainCjs(src) {
  let didWinpty = false
  if (!src.includes('ptySpawnOptions.useConpty = false')) {
    const first = src.indexOf(ANCHOR)
    if (first === -1) throw new Error('[FAIL] main.cjs spawn anchor not found')
    if (src.indexOf(ANCHOR, first + 1) !== -1) {
      throw new Error('[FAIL] main.cjs spawn anchor is not unique')
    }
    src = src.slice(0, first) + INSERTION + src.slice(first + ANCHOR.length)
    didWinpty = true
  }
  const didPaths = src.includes(NODE_DIR_OLD)
  if (didPaths) src = src.split(NODE_DIR_OLD).join(NODE_DIR_NEW)
  return { src, already: !didWinpty && !didPaths, didWinpty, didPaths }
}

// ---------------------------------------------------------------------------
// asar primitives
// ---------------------------------------------------------------------------
function readArchive(archivePath) {
  const fd = fs.openSync(archivePath, 'r')
  try {
    const sizeBuf = Buffer.alloc(8)
    if (fs.readSync(fd, sizeBuf, 0, 8, null) !== 8) throw new Error('unable to read header size')
    const headerSize = Pickle.createFromBuffer(sizeBuf).createIterator().readUInt32()
    const headerBuf = Buffer.alloc(headerSize)
    if (fs.readSync(fd, headerBuf, 0, headerSize, null) !== headerSize) {
      throw new Error('unable to read header')
    }
    const header = JSON.parse(Pickle.createFromBuffer(headerBuf).createIterator().readString())
    const stat = fs.fstatSync(fd)
    const dataSize = Number(stat.size) - 8 - headerSize
    return { fd, header, headerSize, dataSize }
  } catch (err) {
    fs.closeSync(fd)
    throw err
  }
}

function readPackedFile(fd, headerSize, info) {
  const buf = Buffer.alloc(info.size)
  if (info.size <= 0) return buf
  const offset = 8 + headerSize + parseInt(info.offset)
  fs.readSync(fd, buf, 0, info.size, offset)
  return buf
}

function integrityFor(buf) {
  const blocks = []
  for (let i = 0; i < buf.length; i += BLOCK_SIZE) {
    blocks.push(createHash('sha256').update(buf.subarray(i, i + BLOCK_SIZE)).digest('hex'))
  }
  return {
    algorithm: 'SHA256',
    hash: createHash('sha256').update(buf).digest('hex'),
    blockSize: BLOCK_SIZE,
    blocks,
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
const archivePath = process.argv[2]
const verifyOnly = process.argv.includes('--verify-only')
const setVersionIdx = process.argv.indexOf('--set-version')
const setVersion = setVersionIdx !== -1 ? process.argv[setVersionIdx + 1] : null
if (!archivePath || !fs.existsSync(archivePath) || (setVersionIdx !== -1 && !setVersion)) {
  console.error(`Usage: node patch-app-asar.mjs <app.asar> [--verify-only] [--set-version <ver>]`)
  process.exit(1)
}

const { fd, header, headerSize, dataSize } = readArchive(archivePath)
try {
  const entry =
    header.files['electron-dist']?.files['main.cjs'] ??
    (() => {
      throw new Error('[FAIL] electron-dist/main.cjs not in asar header')
    })()
  if (entry.unpacked) throw new Error('[FAIL] main.cjs is unpacked — use a plain file copy instead')

  const mainBuf = readPackedFile(fd, headerSize, entry)
  const origHash = createHash('sha256').update(mainBuf).digest('hex')
  if (entry.integrity && origHash !== entry.integrity.hash) {
    throw new Error('[FAIL] main.cjs content does not match its integrity hash — asar corrupt?')
  }

  const { src: patched, already, didWinpty, didPaths } = patchMainCjs(mainBuf.toString('utf8'))

  // --set-version: bump the root package.json "version" in place (same length)
  let pkgPatch = null
  if (setVersion) {
    const pkgEntry = header.files['package.json']
    if (!pkgEntry || pkgEntry.unpacked) throw new Error('[FAIL] package.json not found (or unpacked) in asar header')
    const pkgBuf = readPackedFile(fd, headerSize, pkgEntry)
    if (pkgEntry.integrity && createHash('sha256').update(pkgBuf).digest('hex') !== pkgEntry.integrity.hash) {
      throw new Error('[FAIL] package.json does not match its integrity hash — asar corrupt?')
    }
    const m = pkgBuf.toString('utf8').match(/("version"\s*:\s*")([^"]+)(")/)
    if (!m) throw new Error('[FAIL] package.json has no "version" field')
    if (m[2] === setVersion) {
      console.log(`[SKIP] package.json already at version ${setVersion}`)
    } else if (m[2].length !== setVersion.length) {
      throw new Error(`[FAIL] version length mismatch ("${m[2]}" -> "${setVersion}") — same-length in-place bump only`)
    } else {
      const newPkg = Buffer.concat([
        pkgBuf.subarray(0, m.index + m[1].length),
        Buffer.from(setVersion, 'utf8'),
        pkgBuf.subarray(m.index + m[1].length + m[2].length),
      ])
      pkgPatch = { entry: pkgEntry, buf: newPkg, offset: parseInt(pkgEntry.offset), from: m[2] }
      pkgEntry.integrity = integrityFor(newPkg)
      console.log(`[PATCH] package.json version ${m[2]} -> ${setVersion} (in place, ${newPkg.length} bytes)`)
    }
  }

  if (verifyOnly || (already && !pkgPatch)) {
    console.log(already && !pkgPatch ? '[SKIP] main.cjs already patched (useConpty forcing + versioned node dir present)' : '[OK] patch would apply')
    process.exit(0)
  }
  console.log(`[PATCH] main.cjs: winpty forcing ${didWinpty ? 'inserted' : 'already present'}, node runtime dir ${didPaths ? 'version-stamped (node -> node-v22.17.0)' : 'already version-stamped'}`)
  const patchedBuf = Buffer.from(patched, 'utf8')
  new Function(patched) // syntax check without executing

  // Repoint the entry: append at the end of the data section. Mutate in place
  // to keep the JSON key order of every other entry untouched.
  entry.size = patchedBuf.length
  entry.offset = String(dataSize)
  entry.integrity = integrityFor(patchedBuf)

  const headerPickle = Pickle.createEmpty()
  headerPickle.writeString(JSON.stringify(header))
  const newHeaderBuf = headerPickle.toBuffer()
  const sizePickle = Pickle.createEmpty()
  sizePickle.writeUInt32(newHeaderBuf.length)
  const newSizeBuf = sizePickle.toBuffer()

  // data section = original data (fd, dataSize bytes) + patched main.cjs;
  // a same-length package.json version bump is pwritten over its original
  // region so no other entry's offset shifts.
  const tmp = archivePath + '.tmp'
  const out = fs.openSync(tmp, 'w')
  try {
    fs.writeSync(out, newSizeBuf)
    fs.writeSync(out, newHeaderBuf)
    // copy the original data section in chunks (it is ~185 MB)
    const CHUNK = 8 * 1024 * 1024
    const chunk = Buffer.alloc(CHUNK)
    let read = 0
    while (read < dataSize) {
      const n = Math.min(CHUNK, dataSize - read)
      fs.readSync(fd, chunk, 0, n, 8 + headerSize + read)
      fs.writeSync(out, chunk, 0, n)
      read += n
    }
    fs.writeSync(out, patchedBuf)
    if (pkgPatch) {
      fs.writeSync(out, pkgPatch.buf, 0, pkgPatch.buf.length, 8 + newHeaderBuf.length + pkgPatch.offset)
    }
  } finally {
    fs.closeSync(out)
  }

  // verify the rewritten archive by parsing it back
  const check = readArchive(tmp)
  try {
    const checkEntry = check.header.files['electron-dist'].files['main.cjs']
    const checkBuf = readPackedFile(check.fd, check.headerSize, checkEntry)
    const checkHash = createHash('sha256').update(checkBuf).digest('hex')
    if (checkHash !== checkEntry.integrity.hash) throw new Error('re-verify: integrity mismatch')
    if (!checkBuf.toString('utf8').includes('ptySpawnOptions.useConpty = false')) {
      throw new Error('re-verify: useConpty forcing missing')
    }
    if (checkBuf.toString('utf8').includes(NODE_DIR_OLD)) {
      throw new Error('re-verify: unversioned runtime/node probe path still present')
    }
    for (const marker of ['resolveNodeRuntimeExecutable', 'sqliteFlagArgsForVersion', 'server.mjs']) {
      if (!checkBuf.toString('utf8').includes(marker)) {
        throw new Error(`re-verify: node-runtime fallback marker missing: ${marker}`)
      }
    }
    if (pkgPatch) {
      const checkPkg = readPackedFile(check.fd, check.headerSize, check.header.files['package.json'])
      if (createHash('sha256').update(checkPkg).digest('hex') !== check.header.files['package.json'].integrity.hash) {
        throw new Error('re-verify: package.json integrity mismatch')
      }
      const checkVer = JSON.parse(checkPkg.toString('utf8')).version
      if (checkVer !== setVersion) throw new Error(`re-verify: package.json version is ${checkVer}, expected ${setVersion}`)
    }
  } finally {
    fs.closeSync(check.fd)
  }

  fs.renameSync(tmp, archivePath)
  console.log(`[OK] main.cjs patched inside ${path.basename(archivePath)}`)
  console.log(`     ${mainBuf.length} -> ${patchedBuf.length} bytes (+${patchedBuf.length - mainBuf.length})`)
  console.log(`     old sha256 ${origHash.slice(0, 16)}… (dead space, unreachable)`)
  console.log(`     new sha256 ${entry.integrity.hash.slice(0, 16)}…`)
} finally {
  fs.closeSync(fd)
}
