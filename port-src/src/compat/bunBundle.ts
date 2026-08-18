/**
 * Node.js port: `bun:bundle` feature-flag shim.
 *
 * Upstream builds pass `--feature=NAME` to `bun build`/launcher; feature()
 * is evaluated at build time under Bun. In the Node port the launcher sets
 * `CC_HAHA_FEATURES` (comma-separated list) and this shim evaluates it at
 * call time — call sites are written as plain boolean checks, so semantics
 * match Bun's runtime `feature()` behavior.
 */

const cachedList = (() => {
  // Default matches every official upstream entry point: bin/claude-haha
  // always passes --feature=TRANSCRIPT_CLASSIFIER and the release sidecars
  // are compiled with it (gates the auto-mode transcript classifier). The
  // Node port must keep it on for direct `node dist/cli.mjs` runs and for
  // server/cron/sidecar child CLI spawns, none of which go through the
  // launcher. Set CC_HAHA_FEATURES explicitly (e.g. "") to disable.
  const raw = process.env.CC_HAHA_FEATURES ?? 'TRANSCRIPT_CLASSIFIER'
  return new Set(
    raw
      .split(',')
      .map(entry => entry.trim())
      .filter(Boolean)
      .map(entry => entry.split('=').shift()!.trim()),
  )
})()

export function feature(name: string): boolean | string | undefined {
  if (cachedList.has(name)) return true
  return false
}

export default { feature }
