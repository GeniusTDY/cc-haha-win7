#!/usr/bin/env node
/**
 * Minimal mock Anthropic API for Node-port e2e verification.
 * Implements POST /v1/messages (SSE + non-stream), /v1/me, /v1/models,
 * POST /v1/messages/count_tokens.
 */

import http from 'node:http'

const PORT = Number(process.env.MOCK_PORT ?? 8787)

let requestLog = []

const server = http.createServer((req, res) => {
  const chunks = []
  req.on('data', c => chunks.push(c))
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8')
    const entry = { method: req.method, url: req.url, bodyLength: body.length }
    requestLog.push(entry)
    console.error(`[mock] ${req.method} ${req.url} (${body.length}B)`)

    const json = (obj, status = 200) => {
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(obj))
    }

    if (req.url === '/v1/me' || req.url?.startsWith('/v1/me?') || req.url?.startsWith('/api/oauth/profile')) {
      return json({
        uuid: 'mock-user',
        email: 'mock@example.com',
        name: 'Mock User',
        account: { organizations: [{ uuid: 'mock-org', name: 'MockOrg' }] },
      })
    }

    if (req.url?.startsWith('/v1/models')) {
      return json({
        data: [
          { id: 'claude-sonnet-4-20250514', display_name: 'Sonnet' },
          { id: 'claude-opus-4-20250514', display_name: 'Opus' },
        ],
      })
    }

    if (req.url?.startsWith('/v1/messages/count_tokens')) {
      return json({ input_tokens: 100 })
    }

    if (req.method === 'POST' && req.url?.startsWith('/v1/messages')) {
      const parsed = (() => {
        try {
          return JSON.parse(body)
        } catch {
          return {}
        }
      })()
      const stream = parsed.stream === true
      const model = parsed.model ?? 'claude-sonnet-4-20250514'

      // Turn 1 (contains user prompt, no tool_result) → request tool call(s).
      // Turn 2+ (contains tool_result) → next tool call or final text reply.
      const messagesText = JSON.stringify(parsed.messages ?? [])
      const toolResultCount = (messagesText.match(/"tool_result"/g) ?? []).length
      const blocks = []
      let stopReason = 'end_turn'
      let replyText = ''
      // Prompt-driven scenario: a prompt containing FILE-TOOLS exercises the
      // Write→Read tool chain with guest-relative paths (works on Win7 + Linux);
      // MOCK_SCENARIO env still takes priority for explicit runs.
      const scenario =
        process.env.MOCK_SCENARIO ??
        (messagesText.includes('FILE-TOOLS') ? 'file-tools' : 'bash')

      if (scenario === 'file-tools') {
        // Chain: Write hi.txt("ok") → Read hi.txt → final.
        if (toolResultCount === 0) {
          replyText = 'I will write a file first.'
          blocks.push({ type: 'text', text: replyText })
          blocks.push({
            type: 'tool_use',
            id: 'toolu_mock_write',
            name: 'Write',
            input: { file_path: 'hi.txt', content: 'ok' },
          })
          stopReason = 'tool_use'
        } else if (toolResultCount === 1) {
          replyText = 'Now I will read it back.'
          blocks.push({ type: 'text', text: replyText })
          blocks.push({
            type: 'tool_use',
            id: 'toolu_mock_read',
            name: 'Read',
            input: { file_path: 'hi.txt' },
          })
          stopReason = 'tool_use'
        } else {
          const lastResult = messagesText.slice(messagesText.lastIndexOf('"tool_result"'))
          const readOk = lastResult.includes('ok')
          replyText = readOk
            ? 'FILE-TOOLS-OK — Write then Read both succeeded with expected content.'
            : 'FILE-TOOLS-FAIL — Read content mismatch.'
          blocks.push({ type: 'text', text: replyText })
        }
      } else {
        // bash scenario (default)
        if (toolResultCount === 0) {
          replyText = 'I will run a shell command to verify the tool loop.'
          blocks.push({ type: 'text', text: replyText })
          blocks.push({
            type: 'tool_use',
            id: 'toolu_mock_1',
            name: 'Bash',
            input: { command: 'echo AGENT-TOOL-EXECUTED > tool-ran.txt', description: 'e2e marker' },
          })
          stopReason = 'tool_use'
        } else {
          replyText = 'TOOL-LOOP-OK — the Bash tool executed and its result was returned to me.'
          blocks.push({ type: 'text', text: replyText })
        }
      }

      if (!stream) {
        return json({
          id: 'msg_mock',
          type: 'message',
          role: 'assistant',
          model,
          content: blocks,
          stop_reason: stopReason,
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 20 },
        })
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      })
      const send = event => res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
      send({
        type: 'message_start',
        message: {
          id: 'msg_mock',
          type: 'message',
          role: 'assistant',
          model,
          content: [],
          stop_reason: null,
          usage: { input_tokens: 10, output_tokens: 0 },
        },
      })
      blocks.forEach((block, index) => {
        send({ type: 'content_block_start', index, content_block: block })
        if (block.type === 'text') {
          for (const piece of block.text.match(/.{1,12}/g) ?? []) {
            send({ type: 'content_block_delta', index, delta: { type: 'text_delta', text: piece } })
          }
        } else {
          send({
            type: 'content_block_delta',
            index,
            delta: { type: 'input_json_delta', partial_json: JSON.stringify(block.input) },
          })
        }
        send({ type: 'content_block_stop', index })
      })
      send({
        type: 'message_delta',
        delta: { stop_reason: stopReason, stop_sequence: null },
        usage: { output_tokens: 20 },
      })
      send({ type: 'message_stop' })
      return res.end()
    }

    json({ error: 'not found' }, 404)
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.error(`[mock] Anthropic mock listening on http://127.0.0.1:${PORT}`)
  console.error(`[mock] requests so far: 0`)
})

process.on('SIGTERM', () => process.exit(0))
process.on('SIGINT', () => process.exit(0))
