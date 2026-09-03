#!/usr/bin/env node
import { NtExecutable, NtExecutableResource } from './node_modules/resedit/dist/index.js';
import IconGroupEntry from './node_modules/resedit/dist/resource/IconGroupEntry.js';
import IconFile from './node_modules/resedit/dist/data/IconFile.js';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const [exePath, icoPath] = process.argv.slice(2);
const exe = NtExecutable.from(readFileSync(exePath));
const res = NtExecutableResource.from(exe);
const groups = IconGroupEntry.fromEntries(res.entries);
const g = groups[0];

const exeIcons = g.icons.map(e => {
  const ent = res.entries.find(x => x.type === 3 && x.id === e.iconID);
  return { w: e.width || 256, h: e.height, bit: e.bitCount, data: Buffer.from(ent.bin) };
}).sort((a, b) => a.w - b.w);

const ico = IconFile.from(readFileSync(icoPath));
const refIcons = ico.icons.map(i => ({
  w: i.width || 256, h: i.height || 256, bit: i.bitCount, data: Buffer.from(i.data.bin)
})).sort((a, b) => a.w - b.w);

console.log(`exe group: ${exeIcons.length} images; ref ico: ${refIcons.length} images`);
let allMatch = exeIcons.length === refIcons.length;
for (let i = 0; i < Math.max(exeIcons.length, refIcons.length); i++) {
  const a = exeIcons[i], b = refIcons[i];
  if (!a || !b) { console.log(`#${i}: MISSING`); allMatch = false; continue; }
  const ha = createHash('md5').update(a.data).digest('hex').slice(0, 12);
  const hb = createHash('md5').update(b.data).digest('hex').slice(0, 12);
  const same = a.w === b.w && a.data.equals(b.data);
  if (!same) allMatch = false;
  console.log(`#${i} ${a.w}x${a.h}@${a.bit} (${a.data.length}B md5=${ha}) vs ref ${b.w}x${b.h}@${b.bit} (${b.data.length}B md5=${hb}) => ${same ? 'IDENTICAL' : 'DIFF'}`);
}
console.log(allMatch ? 'ALL IDENTICAL — exe 内嵌图标 = 官方 app-icon.ico' : 'MISMATCH');
