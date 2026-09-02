
import * as http from 'node:http'
import * as net from 'node:net'
import { Readable } from 'node:stream'
import { WebSocketServer, type WebSocket as WsWebSocket } from 'ws'

export interface NodeServeWebSocket<Data = unknown> {
  data: Data
  send(data: string | ArrayBuffer | Uint8Array): void
  close(code?: number, reason?: string): void
  terminate(): void
  get readyState(): number
}

export interface NodeServeWebSocketHandlers<Data = unknown> {
  open?(ws: NodeServeWebSocket<Data>): void
  message?(ws: NodeServeWebSocket<Data>, message: string | Buffer): void
  close?(ws: NodeServeWebSocket<Data>, code: number, reason: string): void
  drain?(ws: NodeServeWebSocket<Data>): void
}

export interface NodeServeServer<Data = unknown> {
  readonly port: number
  readonly hostname: string
  upgrade(request: Request, options?: { data?: Data }): boolean
  requestIP(request: Request): { address: string; port: number; family: string } | null
  stop(force?: boolean): void
  readonly listening: Promise<void>
  readonly nodeServer: http.Server
}

export interface NodeServeOptions<Data = unknown> {
  port?: number
  hostname?: string
  idleTimeout?: number
  reusePort?: boolean
  maxRequestBodySize?: number
  fetch(
    request: Request,
    server: NodeServeServer<Data>,
  ): Response | undefined | Promise<Response | undefined>
  websocket?: NodeServeWebSocketHandlers<Data>
}

interface UpgradeInfo {
  incoming: http.IncomingMessage
  socket: net.Socket
  head: Buffer
}

export function nodeServe<Data = unknown>(
  options: NodeServeOptions<Data>,
): NodeServeServer<Data> {
  const socketByRequest = new WeakMap<Request, net.Socket>()
  const upgradeByRequest = new WeakMap<Request, UpgradeInfo>()
  const upgradedRequests = new WeakSet<Request>()

  const wss = options.websocket
    ? new WebSocketServer({ noServer: true, perMessageDeflate: false })
    : null

  let boundPort = 0
  let listeningResolve: (() => void) | null = null
  const listening = new Promise<void>(resolve => {
    listeningResolve = resolve
  })

  function wrapWs(ws: WsWebSocket): NodeServeWebSocket<Data> {
    const originalSend = ws.send.bind(ws)
    const originalClose = ws.close.bind(ws)
    const originalTerminate = ws.terminate.bind(ws)
    const wrapped = ws as unknown as NodeServeWebSocket<Data>
    wrapped.send = (data: string | ArrayBuffer | Uint8Array): void => {
      if (ws.readyState === ws.OPEN) {
        originalSend(data as string)
      }
    }
    wrapped.close = (code?: number, reason?: string): void => {
      try {
        originalClose(code ?? 1000, reason ?? '')
      } catch {
      }
    }
    wrapped.terminate = (): void => {
      originalTerminate()
    }
    return wrapped
  }

  if (wss) {
    wss.on('connection', ws => {
      const handlers = options.websocket!
      const wrapped = wrapWs(ws)
      ws.on('message', (data: Buffer, isBinary: boolean) => {
        if (isBinary) {
          handlers.message?.(wrapped, data)
        } else {
          handlers.message?.(wrapped, data.toString('utf8'))
        }
      })
      ws.on('close', (code: number, reason: Buffer) => {
        handlers.close?.(wrapped, code ?? 1005, reason.toString('utf8'))
      })
      ws.on('error', () => {
      })
      handlers.open?.(wrapped)
    })
  }

  const serverFacade: NodeServeServer<Data> = {
    get port(): number {
      return boundPort
    },
    get hostname(): string {
      return options.hostname ?? '0.0.0.0'
    },
    upgrade(request: Request, upgradeOptions?: { data?: Data }): boolean {
      const info = upgradeByRequest.get(request)
      if (!info || !wss) return false
      upgradedRequests.add(request)
      wss.handleUpgrade(info.incoming, info.socket, info.head, ws => {
        const wrapped = wrapWs(ws)
        wrapped.data = upgradeOptions?.data as Data
        wss.emit('connection', ws)
      })
      return true
    },
    requestIP(request: Request): { address: string; port: number; family: string } | null {
      const socket = socketByRequest.get(request)
      if (!socket) return null
      return {
        address: socket.remoteAddress ?? '',
        port: socket.remotePort ?? 0,
        family: socket.remoteFamily ?? 'IPv4',
      }
    },
    stop(force?: boolean): void {
      if (force) {
        nodeServer.closeAllConnections?.()
      }
      wss?.close()
      nodeServer.close()
    },
    listening,
    get nodeServer(): http.Server {
      return nodeServer
    },
  }

  async function handleRequest(
    incoming: http.IncomingMessage,
    res: http.ServerResponse | null,
    rawSocket: net.Socket | null,
    head: Buffer,
  ): Promise<void> {
    const host = incoming.headers.host ?? 'localhost'
    const url = `http://${host}${incoming.url ?? '/'}`
    const headers = new Headers()
    for (const [key, value] of Object.entries(incoming.headers)) {
      if (value === undefined) continue
      headers.set(key, Array.isArray(value) ? value.join(', ') : value)
    }
    const method = incoming.method ?? 'GET'
    const hasBody = method !== 'GET' && method !== 'HEAD'
    const webRequest = new Request(url, {
      method,
      headers,
      body: hasBody ? (Readable.toWeb(incoming) as ReadableStream) : undefined,
      duplex: hasBody ? 'half' : undefined,
    })
    socketByRequest.set(webRequest, rawSocket ?? (incoming.socket as net.Socket))
    if (rawSocket) {
      upgradeByRequest.set(webRequest, { incoming, socket: rawSocket, head })
    }

    let response: Response | undefined
    try {
      response = await options.fetch(webRequest, serverFacade)
    } catch (error) {
      console.error('[nodeServe] fetch handler error:', error)
      response = new Response('Internal Server Error', { status: 500 })
    }

    if (rawSocket) {
      if (upgradedRequests.has(webRequest)) {
        if (response) {
          void response.body?.cancel().catch(() => {})
        }
        return
      }
      if (response) {
        try {
          const body = await response.arrayBuffer()
          const statusLine = `HTTP/1.1 ${response.status} ${response.statusText || 'Error'}\r\n`
          const headerLines: string[] = []
          response.headers.forEach((value, key) => {
            headerLines.push(`${key}: ${value}\r\n`)
          })
          headerLines.push(`Content-Length: ${body.byteLength}\r\n`)
          headerLines.push('Connection: close\r\n')
          rawSocket.write(statusLine + headerLines.join('') + '\r\n')
          rawSocket.end(Buffer.from(body))
        } catch {
          rawSocket.destroy()
        }
      } else {
        rawSocket.destroy()
      }
      return
    }

    if (!res) return
    if (!response) {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('no response')
      return
    }

    res.statusCode = response.status
    if (response.statusText) res.statusMessage = response.statusText
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })

    if (!response.body || method === 'HEAD') {
      res.end()
      return
    }

    const nodeBody = Readable.fromWeb(response.body as import('node:stream/web').ReadableStream)
    nodeBody.on('data', chunk => {
      res.write(chunk)
    })
    nodeBody.on('end', () => {
      res.end()
    })
    nodeBody.on('error', err => {
      if (!res.headersSent) {
        res.statusCode = 500
      }
      res.destroy(err as Error)
    })
    res.on('close', () => {
      if (!nodeBody.destroyed && !nodeBody.readableEnded) {
        nodeBody.destroy()
        void response!.body?.cancel().catch(() => {})
      }
    })
  }

  const nodeServer = http.createServer((incoming, res) => {
    incoming.on('error', () => {
      res.destroy()
    })
    res.on('error', () => {})
    void handleRequest(incoming, res, null, Buffer.alloc(0))
  })

  nodeServer.on('clientError', (err, socket) => {
    if (socket.writable) {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
    } else {
      socket.destroy()
    }
  })

  nodeServer.on('upgrade', (incoming, socket, head) => {
    if (!wss) {
      socket.destroy()
      return
    }
    socket.on('error', () => socket.destroy())
    void handleRequest(incoming, null, socket, head)
  })

  if (options.idleTimeout) {
    nodeServer.keepAliveTimeout = options.idleTimeout * 1000
    nodeServer.headersTimeout = Math.max(
      nodeServer.headersTimeout,
      options.idleTimeout * 1000 + 1000,
    )
  }

  nodeServer.on('error', err => {
    console.error('[nodeServe] server error:', err)
  })

  nodeServer.listen(options.port ?? 0, options.hostname ?? '0.0.0.0', () => {
    const address = nodeServer.address()
    if (address && typeof address === 'object') {
      boundPort = address.port
    }
    listeningResolve?.()
  })

  return serverFacade
}

export default nodeServe
