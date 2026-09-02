#!/usr/bin/env node

import { createHash } from "node:crypto";
import { statSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const exe = args.shift();
if (!exe) {
  console.error("usage: node make-latest-yml.mjs <setup.exe> <version> [--tag t] [--owner o] [--repo r] [--notes n]");
  process.exit(1);
}
let version = args.shift();
if (!version || version.startsWith("--")) {
  console.error("error: <version> is required (must be semver-greater than the installed version)");
  process.exit(1);
}
let tag = `v${version}`;
let owner = "GeniusTDY";
let repo = "cc-haha-win7";
let notes = null;
while (args.length) {
  const a = args.shift();
  if (a === "--tag") tag = args.shift();
  else if (a === "--owner") owner = args.shift();
  else if (a === "--repo") repo = args.shift();
  else if (a === "--notes") notes = args.shift();
  else { console.error(`unknown option: ${a}`); process.exit(1); }
}

const data = readFileSync(exe);
const sha512 = createHash("sha512").update(data).digest("base64");
const size = statSync(exe).size;
const name = basename(exe);

const yml = [
  `# electron-updater feed — attach this file and ${name} (unchanged name)`,
  `# to the latest non-prerelease release of ${owner}/${repo}:`,
  `#   https://github.com/${owner}/${repo}/releases/edit/${tag}`,
  `version: ${version}`,
  `path: ${name}`,
  `sha512: ${sha512}`,
  `files:`,
  `  - url: ${name}`,
  `    sha512: ${sha512}`,
  `    size: ${size}`,
  ...(notes ? [`releaseName: ${version}`, `releaseNotes: ${notes}`] : []),
  "",
].join("\n");

const out = join(dirname(exe), "latest.yml");
writeFileSync(out, yml);
console.log(`[OK] ${out}`);
console.log(yml);
