#!/usr/bin/env node
// Debug wrapper: logs spawn metadata, then execs the real bundled CLI with
// stderr duplicated to a capture file.
import { spawn } from 'node:child_process'
import { appendFileSync } from 'node:fs'

const REAL = '/workspace/cc-haha/dist/cli.mjs'
const CAPTURE = '/tmp/cli-spawn-debug.log'

const stamp = new Date().toISOString()
appendFileSync(CAPTURE, `\n===== ${stamp} wrapper invoked =====\n`)
appendFileSync(CAPTURE, `argv: ${JSON.stringify(process.argv.slice(2))}\n`)
appendFileSync(
  CAPTURE,
  `env keys of interest: ${JSON.stringify({
    CLAUDE_CODE_ENTRYPOINT: process.env.CLAUDE_CODE_ENTRYPOINT,
    CC_HAHA_DESKTOP_SERVER_URL: process.env.CC_HAHA_DESKTOP_SERVER_URL,
    CC_HAHA_DESKTOP_AWAIT_MCP: process.env.CC_HAHA_DESKTOP_AWAIT_MCP,
    CLAUDE_CODE_OAUTH_TOKEN: process.env.CLAUDE_CODE_OAUTH_TOKEN ? '(set)' : '(unset)',
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '(set)' : '(unset)',
    CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR,
    CALLER_DIR: process.env.CALLER_DIR,
    stdin_isTTY: process.stdin.isTTY,
  })}\n`,
)

const child = spawn(process.execPath, [REAL, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: process.env,
  stdio: ['pipe', 'pipe', 'pipe'],
})

appendFileSync(CAPTURE, `child pid: ${child.pid}\n`)

child.stdout.on('data', d => {
  appendFileSync(CAPTURE, `[OUT] ${d.toString().slice(0, 500)}`)
})
child.stderr.on('data', d => {
  appendFileSync(CAPTURE, `[ERR] ${d.toString().slice(0, 500)}`)
})
child.on('exit', (c, s) => {
  appendFileSync(CAPTURE, `child exit code=${c} signal=${s}\n`)
  process.exit(c ?? 1)
})
child.on('error', e => {
  appendFileSync(CAPTURE, `spawn error: ${e.message}\n`)
  process.exit(1)
})

// Forward stdin to child
process.stdin.on('data', d => child.stdin.write(d))
process.stdin.on('end', () => child.stdin.end())
process.stdin.on('error', () => {})

// Stay alive with child
setInterval(() => {}, 1 << 30)
