#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

const [,, exePath, icoPath, verPath] = process.argv
if (!exePath || !icoPath || !verPath) {
  console.error('Usage: node patch-exe-icon.mjs <exe> <icon.ico> <version.bin>')
  process.exit(1)
}
for (const f of [exePath, icoPath, verPath]) {
  if (!fs.existsSync(f)) {
    console.error(`[FAIL] not found: ${f}`)
    process.exit(1)
  }
}

const RT_ICON = 3
const RT_GROUP_ICON = 14
const RT_VERSION = 16
const LANG = 0x409
const GROUP_NAME = 103

function parsePe(buf) {
  const peOff = buf.readUInt32LE(0x3c)
  if (buf.readUInt32LE(peOff) !== 0x4550) throw new Error('not a PE file')
  const numSections = buf.readUInt16LE(peOff + 6)
  const optSize = buf.readUInt16LE(peOff + 20)
  const magic = buf.readUInt16LE(peOff + 24)
  if (magic !== 0x10b && magic !== 0x20b) throw new Error(`unknown optional header magic ${magic}`)
  const ddBase = peOff + 24 + (magic === 0x20b ? 112 : 96)
  const resRva = buf.readUInt32LE(ddBase + 2 * 8)
  const resSize = buf.readUInt32LE(ddBase + 2 * 8 + 4)
  const sections = []
  const secOff = peOff + 24 + optSize
  for (let i = 0; i < numSections; i++) {
    const o = secOff + i * 40
    sections.push({
      name: buf.toString('latin1', o, o + 8).replace(/\0.*$/, ''),
      vsz: buf.readUInt32LE(o + 8),
      va: buf.readUInt32LE(o + 12),
      rawSize: buf.readUInt32LE(o + 16),
      rawOff: buf.readUInt32LE(o + 20),
      headerOff: o,
    })
  }
  const rvaToOff = (rva) => {
    for (const s of sections) {
      if (rva >= s.va && rva < s.va + Math.max(s.vsz, s.rawSize)) return s.rawOff + (rva - s.va)
    }
    return -1
  }
  return { peOff, numSections, optSize, magic, ddBase, resRva, resSize, sections, rvaToOff }
}

function readResourceLeaves(buf, pe) {
  const base = pe.rvaToOff(pe.resRva)
  if (base < 0) throw new Error('.rsrc section not mapped in file')
  const leaves = []
  const walk = (dirOff, depth, typeKey, nameKey) => {
    const nNamed = buf.readUInt16LE(dirOff + 12)
    const nId = buf.readUInt16LE(dirOff + 14)
    for (let i = 0; i < nNamed + nId; i++) {
      const eOff = dirOff + 16 + i * 8
      const nameField = buf.readUInt32LE(eOff)
      const offField = buf.readUInt32LE(eOff + 4)
      let key
      if (i < nNamed) {
        const sOff = base + (nameField & 0x7fffffff)
        const len = buf.readUInt16LE(sOff)
        key = buf.toString('utf16le', sOff + 2, sOff + 2 + len * 2)
      } else {
        key = nameField
      }
      if (offField & 0x80000000) {
        walk(base + (offField & 0x7fffffff), depth + 1,
          depth === 0 ? key : typeKey,
          depth === 1 ? key : nameKey)
      } else {
        const de = base + offField
        const rva = buf.readUInt32LE(de)
        const size = buf.readUInt32LE(de + 4)
        const fo = pe.rvaToOff(rva)
        if (fo < 0) throw new Error(`resource data rva ${rva} not mapped`)
        leaves.push({ type: typeKey, name: nameKey, lang: key, off: fo, size })
      }
    }
  }
  walk(base, 0, undefined, undefined)
  return leaves
}

function cmpKey(a, b) {
  const aS = typeof a === 'string'
  const bS = typeof b === 'string'
  if (aS && bS) {
    const x = a.toUpperCase()
    const y = b.toUpperCase()
    return x < y ? -1 : x > y ? 1 : 0
  }
  if (aS) return -1
  if (bS) return 1
  return a - b
}

function buildResourceSection(leaves, rva) {
  const types = new Map()
  for (const lf of leaves) {
    if (!types.has(lf.type)) types.set(lf.type, new Map())
    const names = types.get(lf.type)
    if (!names.has(lf.name)) names.set(lf.name, new Map())
    names.get(lf.name).set(lf.lang, lf)
  }
  const typeList = [...types.entries()]
    .sort((a, b) => cmpKey(a[0], b[0]))
    .map(([type, names]) => ({
      type,
      names: [...names.entries()]
        .sort((a, b) => cmpKey(a[0], b[0]))
        .map(([name, langs]) => ({
          name,
          langs: [...langs.entries()].sort((a, b) => a[0] - b[0]),
        })),
    }))

  let off = 0
  const l0 = { off: 0, count: typeList.length }
  off += 16 + 8 * typeList.length
  for (const t of typeList) {
    t.dirOff = off
    off += 16 + 8 * t.names.length
  }
  for (const t of typeList) {
    for (const n of t.names) {
      n.dirOff = off
      off += 16 + 8 * n.langs.length
    }
  }

  const strings = new Map()
  const intern = (s) => {
    if (!strings.has(s)) {
      const padded = (4 + s.length * 2 + 3) & ~3
      strings.set(s, { off, len: s.length, padded })
      off += padded
    }
    return strings.get(s)
  }
  for (const t of typeList) {
    if (typeof t.type === 'string') t.typeStr = intern(t.type)
    for (const n of t.names) {
      if (typeof n.name === 'string') n.nameStr = intern(n.name)
    }
  }

  for (const t of typeList) {
    for (const n of t.names) {
      for (const [, lf] of n.langs) {
        lf.deOff = off
        off += 16
      }
    }
  }
  for (const t of typeList) {
    for (const n of t.names) {
      for (const [, lf] of n.langs) {
        lf.blobOff = off
        off += (lf.data.length + 3) & ~3
      }
    }
  }

  const out = Buffer.alloc(off)
  const writeDir = (dirOff, entries) => {
    let nNamed = 0
    for (const e of entries) if (e.str !== undefined) nNamed++
    out.writeUInt16LE(nNamed, dirOff + 12)
    out.writeUInt16LE(entries.length - nNamed, dirOff + 14)
    let eo = dirOff + 16
    for (const e of entries) {
      if (e.str !== undefined) out.writeUInt32LE((0x80000000 | e.str.off) >>> 0, eo)
      else out.writeUInt32LE(e.id, eo)
      out.writeUInt32LE((e.target + (e.isDir ? 0x80000000 : 0)) >>> 0, eo + 4)
      eo += 8
    }
  }
  const writeString = (rec, s) => {
    out.writeUInt16LE(rec.len, rec.off)
    out.write(s, rec.off + 2, 'utf16le')
    out.writeUInt16LE(0, rec.off + 2 + rec.len * 2)
  }

  for (const t of typeList) if (t.typeStr) writeString(t.typeStr, t.type)
  for (const t of typeList) for (const n of t.names) if (n.nameStr) writeString(n.nameStr, n.name)

  writeDir(l0.off, typeList.map(t => ({
    str: t.typeStr !== undefined ? t.typeStr : undefined,
    id: t.typeStr !== undefined ? undefined : t.type,
    target: t.dirOff,
    isDir: true,
  })))
  for (const t of typeList) {
    writeDir(t.dirOff, t.names.map(n => ({
      str: n.nameStr !== undefined ? n.nameStr : undefined,
      id: n.nameStr !== undefined ? undefined : n.name,
      target: n.dirOff,
      isDir: true,
    })))
  }
  for (const t of typeList) {
    for (const n of t.names) {
      writeDir(n.dirOff, n.langs.map(([lang, lf]) => ({ id: lang, target: lf.deOff, isDir: false })))
    }
  }
  for (const t of typeList) {
    for (const n of t.names) {
      for (const [, lf] of n.langs) {
        out.writeUInt32LE(rva + lf.blobOff, lf.deOff)
        out.writeUInt32LE(lf.data.length, lf.deOff + 4)
        out.writeUInt32LE(0, lf.deOff + 8)
        out.writeUInt32LE(0, lf.deOff + 12)
        lf.data.copy(out, lf.blobOff)
      }
    }
  }
  return { buf: out, size: off }
}

function peChecksum(buf, cksOff) {
  let sum = 0
  if ((buf.byteOffset & 1) === 0) {
    const words = new Uint16Array(buf.buffer, buf.byteOffset, buf.length >> 1)
    for (let i = 0; i < words.length; i++) {
      if (i * 2 === cksOff || i * 2 === cksOff + 2) continue
      sum += words[i]
    }
  } else {
    for (let i = 0; i + 1 < buf.length; i += 2) {
      if (i === cksOff || i === cksOff + 2) continue
      sum += buf.readUInt16LE(i)
    }
  }
  if (buf.length & 1) sum += buf[buf.length - 1]
  while (sum > 0xffff) sum = (sum & 0xffff) + (sum >>> 16)
  return (sum + buf.length) >>> 0
}

const sha256 = (b) => createHash('sha256').update(b).digest('hex')

const exe = fs.readFileSync(exePath)
const ico = fs.readFileSync(icoPath)
const versionBlob = fs.readFileSync(verPath)

if (ico.readUInt16LE(0) !== 0 || ico.readUInt16LE(2) !== 1) throw new Error('not an .ico file')
const iconCount = ico.readUInt16LE(4)
const icons = []
for (let i = 0; i < iconCount; i++) {
  const o = 6 + i * 16
  icons.push({
    w: ico.readUInt8(o),
    h: ico.readUInt8(o + 1),
    planes: ico.readUInt16LE(o + 4),
    bpp: ico.readUInt16LE(o + 6),
    size: ico.readUInt32LE(o + 8),
    off: ico.readUInt32LE(o + 12),
  })
}

const group = Buffer.alloc(6 + 14 * iconCount)
group.writeUInt16LE(0, 0)
group.writeUInt16LE(1, 2)
group.writeUInt16LE(iconCount, 4)
icons.forEach((ic, i) => {
  const o = 6 + i * 14
  group.writeUInt8(ic.w, o)
  group.writeUInt8(ic.h, o + 1)
  group.writeUInt8(0, o + 2)
  group.writeUInt8(0, o + 3)
  group.writeUInt16LE(ic.planes, o + 4)
  group.writeUInt16LE(ic.bpp, o + 6)
  group.writeUInt32LE(ic.size, o + 8)
  group.writeUInt16LE(iconCount - i, o + 12)
})

const pe = parsePe(exe)
const rsrcSec = pe.sections.find(s => pe.resRva >= s.va && pe.resRva < s.va + Math.max(s.vsz, s.rawSize))
if (!rsrcSec) throw new Error('.rsrc section not found')
const oldLeaves = readResourceLeaves(exe, pe)
const kept = oldLeaves
  .filter(l => l.type !== RT_ICON && l.type !== RT_GROUP_ICON && l.type !== RT_VERSION)
  .map(l => ({ type: l.type, name: l.name, lang: l.lang, data: exe.subarray(l.off, l.off + l.size) }))

const expected = new Map()
icons.forEach((ic, i) => {
  expected.set(`${RT_ICON}/${iconCount - i}/${LANG}`, sha256(ico.subarray(ic.off, ic.off + ic.size)))
})
expected.set(`${RT_GROUP_ICON}/${GROUP_NAME}/${LANG}`, sha256(group))
expected.set(`${RT_VERSION}/1/${LANG}`, sha256(versionBlob))
const current = new Map()
for (const l of oldLeaves) {
  if (l.type === RT_ICON || l.type === RT_GROUP_ICON || l.type === RT_VERSION) {
    current.set(`${l.type}/${l.name}/${l.lang}`, sha256(exe.subarray(l.off, l.off + l.size)))
  }
}
let alreadyStamped = current.size === expected.size
if (alreadyStamped) {
  for (const [k, v] of expected) {
    if (current.get(k) !== v) { alreadyStamped = false; break }
  }
}
if (alreadyStamped) {
  console.log('[SKIP] exe already stamped with this icon + version info')
  process.exit(0)
}

const newLeaves = [...kept]
icons.forEach((ic, i) => {
  newLeaves.push({ type: RT_ICON, name: iconCount - i, lang: LANG, data: ico.subarray(ic.off, ic.off + ic.size) })
})
newLeaves.push({ type: RT_GROUP_ICON, name: GROUP_NAME, lang: LANG, data: group })
newLeaves.push({ type: RT_VERSION, name: 1, lang: LANG, data: versionBlob })

const built = buildResourceSection(newLeaves, pe.resRva)
if (built.size > rsrcSec.rawSize) {
  throw new Error(`new .rsrc (${built.size} B) exceeds section raw size (${rsrcSec.rawSize} B)`)
}

const out = Buffer.from(exe)
built.buf.copy(out, rsrcSec.rawOff)
out.fill(0, rsrcSec.rawOff + built.size, rsrcSec.rawOff + rsrcSec.rawSize)
out.writeUInt32LE(built.size, rsrcSec.headerOff + 8)
out.writeUInt32LE(built.size, pe.ddBase + 2 * 8 + 4)

const cksOff = pe.peOff + 24 + 64
out.writeUInt32LE(peChecksum(out, cksOff), cksOff)

const pe2 = parsePe(out)
const leaves2 = readResourceLeaves(out, pe2)
const gotIcons = leaves2.filter(l => l.type === RT_ICON)
const gotGroup = leaves2.filter(l => l.type === RT_GROUP_ICON)
const gotVersion = leaves2.filter(l => l.type === RT_VERSION)
const gotKept = leaves2.filter(l => l.type !== RT_ICON && l.type !== RT_GROUP_ICON && l.type !== RT_VERSION)
const mism = []
if (gotIcons.length !== iconCount) mism.push(`icon count ${gotIcons.length} != ${iconCount}`)
gotIcons.forEach((l) => {
  const ic = icons[iconCount - l.name]
  if (!ic || sha256(out.subarray(l.off, l.off + l.size)) !== sha256(ico.subarray(ic.off, ic.off + ic.size))) {
    mism.push(`icon #${l.name} bytes differ from ico`)
  }
})
if (gotGroup.length !== 1) mism.push(`group icon count ${gotGroup.length} != 1`)
if (gotGroup[0] && sha256(out.subarray(gotGroup[0].off, gotGroup[0].off + gotGroup[0].size)) !== sha256(group)) {
  mism.push('group icon bytes differ')
}
if (gotVersion.length !== 1) mism.push(`version count ${gotVersion.length} != 1`)
if (gotVersion[0] && sha256(out.subarray(gotVersion[0].off, gotVersion[0].off + gotVersion[0].size)) !== sha256(versionBlob)) {
  mism.push('version blob bytes differ')
}
if (gotKept.length !== kept.length) mism.push(`kept resources ${gotKept.length} != ${kept.length}`)
if (peChecksum(out, cksOff) !== out.readUInt32LE(cksOff)) mism.push('checksum self-check failed')
if (mism.length) {
  console.error('[FAIL] post-write verification: ' + mism.join('; '))
  process.exit(1)
}

const tmp = exePath + '.tmp'
fs.writeFileSync(tmp, out)
fs.renameSync(tmp, exePath)

const verText = versionBlob.toString('utf16le')
const pick = (key) => {
  const m = verText.match(new RegExp(key + '\\u0000\\u0000([^\\u0000]+)'))
  return m ? m[1] : '?'
}
console.log(`[OK] ${path.basename(exePath)}: .rsrc ${pe.resSize} -> ${built.size} B (section raw ${rsrcSec.rawSize} B)`)
console.log(`     icons: ${icons.map(ic => `${ic.w || 256}x${ic.h || 256}`).join(', ')} from ${path.basename(icoPath)}`)
console.log(`     version: ${pick('ProductName')} ${pick('FileVersion')} (${pick('CompanyName')})`)
console.log(`     kept resources: ${kept.length} entries, checksum recomputed`)
