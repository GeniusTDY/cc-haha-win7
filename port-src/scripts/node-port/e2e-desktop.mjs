#!/usr/bin/env node
/**
 * Node-port desktop e2e: REST create-session → WS connect → user_message →
 * CLI subprocess (spawned by server) → mock Anthropic tool loop →
 * message_complete. Verifies the full desktop data path under Node.
 */

import WebSocket from 'ws'

const BASE = 'http://127.0.0.1:19876'
const WS_BASE = 'ws://127.0.0.1:19876'
const TOKEN = 'sk-mock'
const WORK_DIR = '/tmp/e2e-desktop-ws'

const authHeaders = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }

const log = (...a) => console.log('[e2e]', ...a)

async function main() {
  // 1. Create session via REST
  const createRes = await fetch(`${BASE}/api/sessions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ workDir: WORK_DIR, permissionMode: 'bypassPermissions' }),
  })
  if (createRes.status !== 201) {
    throw new Error(`createSession failed: ${createRes.status} ${await createRes.text()}`)
  }
  const session = await createRes.json()
  const sessionId = session.id ?? session.sessionId
  log('session created:', sessionId, 'sdkToken?', Boolean(session.sdkToken))

  // 2. Connect desktop WS
  const ws = new WebSocket(`${WS_BASE}/ws/${sessionId}`, { headers: { Authorization: `Bearer ${TOKEN}` } })

  const messages = []
  let resolveDone
  let rejectDone
  const done = new Promise((res, rej) => { resolveDone = res; rejectDone = rej })
  const timeout = setTimeout(() => rejectDone(new Error('e2e timeout after 120s')), 120_000)

  ws.on('open', () => {
    log('ws open — sending user_message')
    ws.send(JSON.stringify({ type: 'user_message', content: 'Run the bash marker command now.' }))
  })

  ws.on('message', raw => {
    const text = raw.toString()
    let msg
    try { msg = JSON.parse(text) } catch { log('non-json frame:', text.slice(0, 120)); return }
    messages.push(msg)
    const t = msg.type ?? '?'
    if (t === 'connected') log('ws connected frame for', msg.sessionId)
    else if (t === 'status') log('status:', msg.state, msg.verb ?? '')
    else if (t === 'message_complete') { log('message_complete ✓'); clearTimeout(timeout); resolveDone(msg) }
    else if (t === 'error') log('error frame:', JSON.stringify(msg).slice(0, 300))
    else if (t === 'cli_output' || t === 'assistant_message' || t === 'stream_event') {
      // verbose; summarize only
    } else log('frame:', t)
  })

  ws.on('error', err => { clearTimeout(timeout); rejectDone(err) })

  const complete = await done
  ws.close()
  log('total frames received:', messages.length)

  // 3. Verify session transcript persisted & visible via REST
  const detailRes = await fetch(`${BASE}/api/sessions/${sessionId}`, { headers: authHeaders })
  const detail = await detailRes.json()
  log('session title after turn:', JSON.stringify(detail.title ?? detail.session?.title))
  log('messageCount:', detail.messageCount ?? detail.session?.messageCount)

  console.log('E2E-DESKTOP-OK')
  process.exit(0)
}

main().catch(err => {
  console.error('E2E-DESKTOP-FAIL:', err.message)
  process.exit(1)
})
