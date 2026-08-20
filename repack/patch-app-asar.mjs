#!/usr/bin/env node
/**
 * patch-app-asar.mjs — surgical app.asar patcher (Win7 port, Stage B).
 *
 * Replaces `electron-dist/main.cjs` inside an electron-builder app.asar and
 * applies the terminal winpty fix (patch 003) to it in one pass, without a
 * full extract/repack roundtrip:
 *
 *   1. read the asar header (size pickle + header pickle)
 *   2. read the packed main.cjs bytes from the data section
 *   3. insert the `useConpty = false` forcing (exact-once anchor match)
 *   4. append the patched bytes to the END of the data section and repoint
 *      the header entry (offset/size/integrity) — every other file keeps its
 *      original offset, so the rest of the archive stays byte-identical
 *      (the old main.cjs bytes simply become unreachable dead space)
 *   5. write the new archive atomically and re-verify by parsing it back
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

function patchMainCjs(src) {
  if (src.includes('ptySpawnOptions.useConpty = false')) {
    return { src, already: true }
  }
  const first = src.indexOf(ANCHOR)
  if (first === -1) throw new Error('[FAIL] main.cjs spawn anchor not found')
  if (src.indexOf(ANCHOR, first + 1) !== -1) {
    throw new Error('[FAIL] main.cjs spawn anchor is not unique')
  }
  return { src: src.slice(0, first) + INSERTION + src.slice(first + ANCHOR.length), already: false }
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
if (!archivePath || !fs.existsSync(archivePath)) {
  console.error(`Usage: node patch-app-asar.mjs <app.asar> [--verify-only]`)
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

  const { src: patched, already } = patchMainCjs(mainBuf.toString('utf8'))
  if (verifyOnly || already) {
    console.log(already ? '[SKIP] main.cjs already patched (useConpty forcing present)' : '[OK] patch would apply')
    process.exit(0)
  }
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

  // data section = original data (fd, dataSize bytes) + patched main.cjs
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
    for (const marker of ['resolveNodeRuntimeExecutable', 'sqliteFlagArgsForVersion', 'server.mjs']) {
      if (!checkBuf.toString('utf8').includes(marker)) {
        throw new Error(`re-verify: node-runtime fallback marker missing: ${marker}`)
      }
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
