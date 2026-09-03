#!/usr/bin/env node
import { NtExecutable, NtExecutableResource } from 'resedit';
import IconGroupEntry from './node_modules/resedit/dist/resource/IconGroupEntry.js';
import IconFile from './node_modules/resedit/dist/data/IconFile.js';
import { readFileSync, writeFileSync } from 'node:fs';

const [exePath, icoPath, altIcoPath] = process.argv.slice(2);
if (!exePath || !icoPath) {
  console.error('usage: node inject-icon.mjs <exe> <main.ico> [alt.ico]');
  process.exit(1);
}

const exe = NtExecutable.from(readFileSync(exePath));
const res = NtExecutableResource.from(exe);
let groups = IconGroupEntry.fromEntries(res.entries);
if (groups.length === 0) {
  console.error('no RT_GROUP_ICON found');
  process.exit(1);
}

const ico = IconFile.from(readFileSync(icoPath));
console.log(`main ico: ${ico.icons.length} images (${ico.icons.map(i => `${i.width || 256}x${i.height || 256}`).join(', ')})`);
const gid = groups[0].id;
const lang = groups[0].lang;
IconGroupEntry.replaceIconsForResource(res.entries, gid, lang, ico.icons.map(i => i.data));

if (altIcoPath) {
  groups = IconGroupEntry.fromEntries(res.entries);
  const usedIds = groups.map(g => g.id);
  const altGid = Math.max(...usedIds) + 1;
  const alt = IconFile.from(readFileSync(altIcoPath));
  console.log(`alt ico: ${alt.icons.length} images (${alt.icons.map(i => `${i.width || 256}x${i.height || 256}`).join(', ')})`);
  IconGroupEntry.replaceIconsForResource(res.entries, altGid, lang, alt.icons.map(i => i.data));
  console.log(`added alt icon group id=${altGid} lang=0x${lang.toString(16)} (existing group ids: ${usedIds.join(',')})`);
}

res.outputResource(exe);
const out = Buffer.from(exe.generate());
writeFileSync(exePath, out);
console.log(`written ${exePath} (${(out.length / 1048576).toFixed(1)} MB)`);
