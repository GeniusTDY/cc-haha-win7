#!/usr/bin/env node
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const { Pickle } = await import(
  path.join(HERE, 'asar-tool', 'node_modules', '@electron', 'asar', 'lib', 'pickle.js')
)

const BLOCK_SIZE = 4 * 1024 * 1024

const ANCHOR =
  '      };\n' +
  '      try {\n' +
  '        pty = ptyFactory.spawn(shell, [], ptySpawnOptions);\n' +
  '      } catch (error) {\n' +
  '        if (!isLegacyWindows(this.platform)) throw error;'

const INSERTION =
  '      };\n' +
  '      if (isLegacyWindows(this.platform)) {\n' +
  '        ptySpawnOptions.useConpty = false;\n' +
  '      }\n' +
  '      try {\n' +
  '        pty = ptyFactory.spawn(shell, [], ptySpawnOptions);\n' +
  '      } catch (error) {\n' +
  '        if (!isLegacyWindows(this.platform)) throw error;'

const NODE_DIR_OLD = '"runtime", "node", "node.exe"'
const NODE_DIR_NEW = '"runtime", "node-v22.17.0", "node.exe"'

// On Windows the node-pty cache dir is darwin-only (undefined), and the asar
// virtual filesystem is invisible to the ESM loader, so `import("node-pty")`
// throws ERR_MODULE_NOT_FOUND. The bare `return import(...)` also hides that
// rejection from the `catch`, so the legacy-Windows pipe fallback never fires.
// Resolve node-pty from the real app.asar.unpacked path via createRequire, and
// await the dynamic import so the fallback stays reachable.
const PTY_ANCHOR = '    return import("node-pty");'
const PTY_INSERTION =
  '    if (sourceDir) {\n' +
  '      const requireFromSource = (0, import_node_module.createRequire)(import_node_path2.default.join(sourceDir, "package.json"));\n' +
  '      return requireFromSource(sourceDir);\n' +
  '    }\n' +
  '    return await import("node-pty");'

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
  let didPty = false
  if (!src.includes('requireFromSource(sourceDir)')) {
    const first = src.indexOf(PTY_ANCHOR)
    if (first === -1) throw new Error('[FAIL] main.cjs node-pty import anchor not found')
    if (src.indexOf(PTY_ANCHOR, first + 1) !== -1) {
      throw new Error('[FAIL] main.cjs node-pty import anchor is not unique')
    }
    src = src.slice(0, first) + PTY_INSERTION + src.slice(first + PTY_ANCHOR.length)
    didPty = true
  }
  return { src, already: !didWinpty && !didPaths && !didPty, didWinpty, didPaths, didPty }
}

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

  const { src: patched, already, didWinpty, didPaths, didPty } = patchMainCjs(mainBuf.toString('utf8'))

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
  console.log(`[PATCH] main.cjs: winpty forcing ${didWinpty ? 'inserted' : 'already present'}, node runtime dir ${didPaths ? 'version-stamped (node -> node-v22.17.0)' : 'already version-stamped'}, node-pty resolver ${didPty ? 'fixed' : 'already fixed'}`)
  const patchedBuf = Buffer.from(patched, 'utf8')
  new Function(patched)

  entry.size = patchedBuf.length
  entry.offset = String(dataSize)
  entry.integrity = integrityFor(patchedBuf)

  const headerPickle = Pickle.createEmpty()
  headerPickle.writeString(JSON.stringify(header))
  const newHeaderBuf = headerPickle.toBuffer()
  const sizePickle = Pickle.createEmpty()
  sizePickle.writeUInt32(newHeaderBuf.length)
  const newSizeBuf = sizePickle.toBuffer()

  const tmp = archivePath + '.tmp'
  const out = fs.openSync(tmp, 'w')
  try {
    fs.writeSync(out, newSizeBuf)
    fs.writeSync(out, newHeaderBuf)
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

  const check = readArchive(tmp)
  try {
    const checkEntry = check.header.files['electron-dist'].files['main.cjs']
    const checkBuf = readPackedFile(check.fd, check.headerSize, checkEntry)
    const checkHash = createHash('sha256').update(checkBuf).digest('hex')
    if (checkHash !== checkEntry.integrity.hash) throw new Error('re-verify: integrity mismatch')
    if (!checkBuf.toString('utf8').includes('ptySpawnOptions.useConpty = false')) {
      throw new Error('re-verify: useConpty forcing missing')
    }
    if (!checkBuf.toString('utf8').includes('requireFromSource(sourceDir)')) {
      throw new Error('re-verify: node-pty sourceDir resolver missing')
    }
    if (!checkBuf.toString('utf8').includes('return await import("node-pty")')) {
      throw new Error('re-verify: awaited node-pty import missing')
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
