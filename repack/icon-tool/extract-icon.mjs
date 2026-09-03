#!/usr/bin/env node
import { NtExecutable, NtExecutableResource } from './node_modules/resedit/dist/index.js';
import IconGroupEntry from './node_modules/resedit/dist/resource/IconGroupEntry.js';
import { readFileSync, writeFileSync } from 'node:fs';

const [exePath, outPath] = process.argv.slice(2);
if (!exePath || !outPath) { console.error('usage: node extract-icon.mjs <exe> <out.ico>'); process.exit(1); }

const exe = NtExecutable.from(readFileSync(exePath));
const res = NtExecutableResource.from(exe);
const groups = IconGroupEntry.fromEntries(res.entries);
if (!groups.length) { console.error('no RT_GROUP_ICON'); process.exit(1); }
const g = groups[0];
const imgs = [];
for (const e of g.icons) {
  const iconEntry = res.entries.find(x => x.type === 3 && x.id === e.iconID);
  if (iconEntry) imgs.push({ entry: e, data: iconEntry.bin });
}
let bin = Buffer.alloc(6 + imgs.length * 16);
bin.writeUInt16LE(0, 0); bin.writeUInt16LE(1, 2); bin.writeUInt16LE(imgs.length, 4);
let off = 6;
const datas = [];
for (const { entry, data } of imgs) {
  const w = entry.width === 0 ? 256 : entry.width;
  bin.writeUInt8(entry.width === 0 ? 0 : entry.width, off); bin.writeUInt8(entry.height === 0 ? 0 : entry.height, off + 1);
  bin.writeUInt8(entry.colorCount || 0, off + 2); bin.writeUInt8(0, off + 3);
  bin.writeUInt16LE(entry.planes || 1, off + 4); bin.writeUInt16LE(entry.bitCount, off + 6);
  bin.writeUInt32LE(data.byteLength, off + 8);
  bin.writeUInt32LE(bin.length + datas.reduce((s, d) => s + d.length, 0), off + 12);
  datas.push(Buffer.from(data));
  off += 16;
  console.log(`  image ${w}x${entry.height} bit=${entry.bitCount} bytes=${data.byteLength}`);
}
writeFileSync(outPath, Buffer.concat([bin, ...datas]));
console.log(`wrote ${outPath}: ${imgs.length} images`);
