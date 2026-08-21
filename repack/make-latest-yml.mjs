#!/usr/bin/env node
// make-latest-yml.mjs — generate the electron-updater feed file (latest.yml)
// for a built Win7 installer.
//
// Attach the generated latest.yml TOGETHER WITH the setup.exe (unchanged file
// name) to the latest NON-PRERELEASE release of the repo named in the
// installer's resources/app-update.yml (rewritten by build-repack.sh step 2b
// to GeniusTDY/cc-haha-win7). electron-updater resolves:
//   https://github.com/<owner>/<repo>/releases/latest               (tag)
//   https://github.com/<owner>/<repo>/releases/download/<tag>/latest.yml  (feed)
//   https://github.com/<owner>/<repo>/releases/download/<tag>/<files[].url> (exe)
//
// The updater offers the update only when <version> is semver-greater than
// the installed app version (the asar package.json version — build-repack.sh
// step 3 bumps it to the build's APP_VERSION via patch-app-asar.mjs
// --set-version, currently 0.5.5).
//
// Usage:
//   node make-latest-yml.mjs <setup.exe> <version> [options]
//     --tag <tag>      release tag (default: v<version>)
//     --owner <owner>  repo owner, informational in the header comment
//                      (default GeniusTDY)
//     --repo <repo>    repo name (default cc-haha-win7)
//     --notes <text>   release notes shown in the update dialog
//
// Writes latest.yml next to the exe.

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
