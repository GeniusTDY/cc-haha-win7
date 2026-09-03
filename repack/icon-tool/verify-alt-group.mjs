#!/usr/bin/env node
import { NtExecutable, NtExecutableResource } from './node_modules/resedit/dist/index.js';
import IconGroupEntry from './node_modules/resedit/dist/resource/IconGroupEntry.js';
import IconFile from './node_modules/resedit/dist/data/IconFile.js';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const [exePath, mainIco, altIco] = process.argv.slice(2);
const exe = NtExecutable.from(readFileSync(exePath));
const res = NtExecutableResource.from(exe);
const groups = IconGroupEntry.fromEntries(res.entries);
console.log('groups:', groups.map(g => `id=${g.id}(${g.icons.length} imgs)`).join(' '));

function groupHashes(g) {
  return g.icons.map(e => {
    const ent = res.entries.find(x => x.type === 3 && x.id === e.iconID);
    return createHash('md5').update(Buffer.from(ent.bin)).digest('hex');
  }).sort();
}
function icoHashes(p) {
  return IconFile.from(readFileSync(p)).icons
    .map(i => createHash('md5').update(Buffer.from(i.data.bin)).digest('hex')).sort();
}

const mainOk = JSON.stringify(groupHashes(groups[0])) === JSON.stringify(icoHashes(mainIco));
const alt = groups.find(g => g.id !== groups[0].id);
const altOk = alt && JSON.stringify(groupHashes(alt)) === JSON.stringify(icoHashes(altIco));
console.log(`group id=${groups[0].id} == ${mainIco}: ${mainOk}`);
console.log(`group id=${alt ? alt.id : '?'} == ${altIco}: ${altOk}`);
console.log(mainOk && altOk ? 'PASS: dual icon groups verified' : 'FAIL');
process.exit(mainOk && altOk ? 0 : 1);
